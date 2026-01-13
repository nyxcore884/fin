
import os
import json
import logging
import tempfile
import pandas as pd
import requests
import firebase_admin
from firebase_admin import firestore, storage, functions
from .budget_mapping import normalise_column_names, merge_mappings

# 1. Initialization
logging.basicConfig(level=logging.INFO)
if not firebase_admin._default_app:
    firebase_admin.initialize_app()
db = firestore.client()
storage_client = storage.Client()

# 2. Helper Functions (from user's guide, corrected and cleaned)
def clean_numeric_column(series: pd.Series) -> pd.Series:
    if not pd.api.types.is_string_dtype(series):
         return pd.to_numeric(series, errors='coerce')
    s = series.str.strip().str.replace(r'\s+', '', regex=True)
    # European: 1.234,56 -> 1234.56
    s_dot_comma = s.str.match(r'^\d{1,3}(\.\d{3})*,\d+$')
    s[s_dot_comma] = s[s_dot_comma].str.replace('.', '', regex=False).str.replace(',', '.', regex=False)
    # English: 1,234.56 -> 1234.56
    s_comma_dot = s.str.match(r'^\d{1,3}(,\d{3})*\.\d+$')
    s[s_comma_dot] = s[s_comma_dot].str.replace(',', '', regex=False)
    return pd.to_numeric(s, errors='coerce')

def read_file(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext in ['.csv', '.txt']:
        return pd.read_csv(path, encoding='utf-8-sig')
    if ext in ['.xls', '.xlsx']:
        return pd.read_excel(path, engine='openpyxl')
    raise ValueError(f'Unsupported file type: {ext}')

# 3. Main Firestore Trigger Function
@functions.firestore_fn.on_document_created(document="uploadSessions/{sessionId}")
def process_budget_file(event: functions.Event[functions.Change]) -> None:
    session_id = event.params['sessionId']
    session_ref = db.collection('uploadSessions').document(session_id)
    
    try:
        # Get file from GCS
        after_data = event.data.after.to_dict()
        gcs_uri = after_data.get('gcs_uri')
        if not gcs_uri:
            raise ValueError("gcs_uri not found.")
        
        bucket_name, blob_name = gcs_uri.replace("gs://", "").split("/", 1)
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = os.path.join(temp_dir, os.path.basename(blob_name))
            blob.download_to_filename(file_path)

            # --- Core Processing Logic ---
            df_raw = read_file(file_path)
            df = normalise_column_names(df_raw)
            df = merge_mappings(df)
            
            amount_col = 'amount_reporting_curr'
            for col in [amount_col, 'subc_debit', 'credit', 'debit']:
                if col in df.columns:
                    df[col] = clean_numeric_column(df[col])
            df.dropna(subset=[amount_col], inplace=True)
            
            from .budget_mapping import _COST_ITEM_MAP as cost_item_map
            from .budget_mapping import _BUDGET_ARTICLE_TO_BUDGET_HOLDER_MAP as ba2bh
            from .budget_mapping import _REGION_MAP as su2region
            
            if 'cost_item' in df.columns:
                cost_item_map_df = pd.DataFrame(list(cost_item_map.items()), columns=["cost_item", "budget_article_mapped"])
                df = pd.merge(df, cost_item_map_df, on="cost_item", how="left")
                df["budget_article"] = df["budget_article_mapped"].fillna(df["budget_article"])
                df.drop(columns=['budget_article_mapped'], inplace=True)

            if 'budget_article' in df.columns:
                ba2bh_df = pd.DataFrame(list(ba2bh.items()), columns=["budget_article", "budget_holder_mapped"])
                df = pd.merge(df, ba2bh_df, on="budget_article", how="left")
                df["budget_holder"] = df["budget_holder_mapped"].fillna(df["budget_holder"])
                df.drop(columns=['budget_holder_mapped'], inplace=True)

            if 'structural_unit' in df.columns:
                region_df = pd.DataFrame(list(su2region.items()), columns=["structural_unit", "region_mapped"])
                df = pd.merge(df, region_df, on="structural_unit", how="left")
                df["region"] = df["region_mapped"].fillna(df["region"])
                df.drop(columns=['region_mapped'], inplace=True)

            placeholder = "Unmapped"
            for col in ["budget_article", "budget_holder", "region"]:
                df[col] = df[col].fillna(placeholder)

            revenue_df = df[df[amount_col] > 0]
            cost_df = df[df[amount_col] <= 0]
            total_rev = revenue_df[amount_col].sum()
            total_cost_abs = cost_df[amount_col].abs().sum()
            costs_by_holder = cost_df.groupby('budget_holder')[amount_col].abs().sum().to_dict()
            costs_by_region = cost_df.groupby('region')[amount_col].abs().sum().to_dict()
            
            classify_url = os.getenv('CLASSIFY_REVENUE_URL')
            if not classify_url:
                raise RuntimeError('CLASSIFY_REVENUE_URL env var not set.')
            
            classification, explanation = 'unknown', 'No revenue data available.'
            if not revenue_df.empty:
                sample_row = revenue_df.iloc[0]
                payload = {"data": {
                    "revenueEntry": sample_row.get("description", ""),
                    "keywordsRetail": "sale,store,customer,shop",
                    "keywordsWholesale": "bulk,wholesale,warehouse,distributor"
                }}
                resp = requests.post(classify_url, json=payload, headers={'Content-Type': 'application/json'}, timeout=60)
                resp.raise_for_status()
                resp_data = resp.json().get('data', {})
                classification = resp_data.get('classification', 'unknown')
                explanation = resp_data.get('explanation', 'No explanation provided.')
            
            result_doc = {
                'userId': after_data.get('userId', 'unknown_user'),
                'uploadId': session_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'retailRevenue': float(total_rev * 0.7),
                'wholesaleRevenue': float(total_rev * 0.3),
                'totalCosts': float(total_cost_abs),
                'costsByHolder': {k: float(v) for k, v in costs_by_holder.items() if pd.notna(k)},
                'costsByRegion': {k: float(v) for k, v in costs_by_region.items() if pd.notna(k)},
                'classification': classification,
                'explanation': explanation,
                'anomalies': ['AI analysis pending'],
                'insights': ['Insight from unified backend'],
                'recommendations': ['Recommendation pending'],
            }

            results_ref = db.collection('budget_results').document()
            results_ref.set(result_doc)
            
            session_ref.update({
                'status': 'completed',
                'resultId': results_ref.id,
                'updatedAt': firestore.SERVER_TIMESTAMP,
            })
            logging.info(f'✅ Session {session_id} processed. Result: {results_ref.id}')

    except Exception as e:
        logging.error(f"Error processing session {session_id}: {e}", exc_info=True)
        session_ref.update({'status': 'failed', 'error': str(e)})
