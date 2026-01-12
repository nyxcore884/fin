import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore, storage
import functions_framework
import logging
import os
import tempfile
import json
import re
import requests # Required for calling Genkit flows

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        # Use Application Default Credentials
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
        logging.info("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        logging.error(f"Failed to initialize Firebase Admin SDK: {e}")

db = firestore.client()

# --- Helper function for robust file reading ---
def read_financial_file(file_path: str) -> pd.DataFrame:
    """Reads CSV or Excel files into a Pandas DataFrame with robust encoding."""
    file_extension = os.path.splitext(file_path)[1].lower()
    try:
        if file_extension == '.csv':
            # Try reading with utf-8-sig first (handles BOM)
            return pd.read_csv(file_path, encoding='utf-8-sig')
        elif file_extension in ('.xlsx', '.xls'):
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
    except UnicodeDecodeError:
        logging.warning(f"UTF-8 decoding failed for {os.path.basename(file_path)}. Trying 'cp1252'.")
        # Fallback to another common encoding
        return pd.read_csv(file_path, encoding='cp1252')
    except Exception as e:
        logging.error(f"Error reading file {os.path.basename(file_path)}: {e}")
        raise

# --- Helper function to clean and convert numeric strings ---
def clean_and_convert_numeric(series: pd.Series) -> pd.Series:
    """Converts a Series of strings to numeric, handling various decimal/thousand separators."""
    if series.dtype == 'object':
        # Remove spaces, then replace comma decimal separator with a period
        series = series.str.replace(r'\s', '', regex=True).str.replace(',', '.', regex=False)
    return pd.to_numeric(series, errors='coerce')


# --- Function to call Genkit AI flows ---
def call_genkit_flow(flow_name: str, data: dict, api_key: str) -> dict:
    """Calls a Genkit flow endpoint."""
    try:
        # Construct the Genkit flow URL. This assumes Genkit is running on port 4000
        # In a real deployed environment, this URL would be the service URL of your Next.js app.
        genkit_url = f"http://127.0.0.1:4000/api/flow/{flow_name}"
        headers = {
            "Content-Type": "application/json",
            "x-genkit-api-key": api_key 
        }
        # The body must be JSON with an 'input' key
        response = requests.post(genkit_url, headers=headers, json={'input': data})
        response.raise_for_status()
        # The actual result is nested under the 'output' key
        return response.json().get('output', {})
    except requests.exceptions.RequestException as e:
        logging.error(f"Error calling Genkit flow '{flow_name}': {e}")
        # Return a default/error structure that matches the expected output
        if flow_name == 'classifyRevenue':
            return {"classification": "retail"} # Default classification
        if flow_name == 'detectAnomalies':
            return {"anomalies": []}
        return {}


@functions_framework.http
def process_financial_data_http(request):
    """HTTP Cloud Function to process financial data, triggered by Next.js API route."""
    session_id = None
    temp_dir = tempfile.mkdtemp()
    local_files = {}

    try:
        request_json = request.get_json(silent=True)
        session_id = request_json.get('sessionId') if request_json else None
        if not session_id:
            raise ValueError("No sessionId provided in the request body.")

        logging.info(f"Processing session: {session_id}")
        session_ref = db.collection('upload_sessions').document(session_id)
        session_doc = session_ref.get()

        if not session_doc.exists:
            raise ValueError(f"Session {session_id} not found.")

        session_data = session_doc.to_dict()
        session_ref.update({'status': 'processing', 'processedAt': firestore.SERVER_TIMESTAMP})

        files_meta = session_data.get('files', {})
        if not files_meta:
            raise ValueError("No files metadata in session.")

        bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET')
        if not bucket_name:
            raise ValueError("FIREBASE_STORAGE_BUCKET env var not set.")
        bucket = storage.bucket(bucket_name)

        for file_type, meta in files_meta.items():
            blob = bucket.blob(meta['path'])
            file_name = os.path.basename(meta['name'])
            temp_file_path = os.path.join(temp_dir, file_name)
            blob.download_to_filename(temp_file_path)
            local_files[file_type] = temp_file_path
            logging.info(f"Downloaded {file_type} to {temp_file_path}")

        # --- Data Processing with Pandas ---
        gl_entries_df = read_financial_file(local_files['glEntries'])
        gl_entries_df['Amount_Reporting_Curr'] = clean_and_convert_numeric(gl_entries_df['Amount_Reporting_Curr'])
        gl_entries_df.dropna(subset=['Amount_Reporting_Curr'], inplace=True)
        
        # Load mapping files
        budget_holder_df = read_financial_file(local_files['budgetHolderMapping'])
        cost_item_map_df = read_financial_file(local_files['costItemMap'])
        regional_df = read_financial_file(local_files['regionalMapping'])

        # --- Apply Mappings ---
        # 1. Map Cost Item to Budget Article
        processed_df = pd.merge(gl_entries_df, cost_item_map_df, on='cost_item', how='left')
        # 2. Map Budget Article to Budget Holder
        processed_df = pd.merge(processed_df, budget_holder_df, on='budget_article', how='left')
        # 3. Map Structural Unit to Region
        processed_df = pd.merge(processed_df, regional_df, on='structural_unit', how='left')

        # --- AI-Powered Revenue Classification ---
        revenue_df = processed_df[processed_df['Amount_Reporting_Curr'] > 0]
        costs_df = processed_df[processed_df['Amount_Reporting_Curr'] <= 0].copy()
        
        retail_revenue = 0
        wholesale_revenue = 0
        
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY env var is not set.")

        for index, row in revenue_df.iterrows():
            # Use 'counterparty' or another descriptive field for classification
            entry_description = row.get('counterparty', '')
            if entry_description:
                ai_input = {
                    "revenueEntry": entry_description,
                    "keywordsRetail": "individual, person, private",
                    "keywordsWholesale": "company, organization, ltd, llc"
                }
                classification_result = call_genkit_flow('classifyRevenue', ai_input, gemini_api_key)
                if classification_result.get('classification') == 'wholesale':
                    wholesale_revenue += row['Amount_Reporting_Curr']
                else:
                    retail_revenue += row['Amount_Reporting_Curr']
            else:
                retail_revenue += row['Amount_Reporting_Curr'] # Default to retail

        # --- Calculations ---
        total_costs = costs_df['Amount_Reporting_Curr'].abs().sum()
        costs_by_holder = costs_df.groupby('budget_holder')['Amount_Reporting_Curr'].sum().abs().to_dict()
        costs_by_region = costs_df.groupby('region')['Amount_Reporting_Curr'].sum().abs().to_dict()

        # --- AI Anomaly Detection ---
        costs_by_holder_str = json.dumps({k: v for k, v in costs_by_holder.items() if pd.notna(k)})
        anomaly_input = {"incomeStatementData": costs_by_holder_str}
        ai_anomalies_result = call_genkit_flow('detectAnomalies', anomaly_input, gemini_api_key)
        anomalies = [a['description'] for a in ai_anomalies_result.get('anomalies', [])]

        # --- Final Result Structure ---
        result_data = {
            'userId': session_data['userId'],
            'sessionId': session_id,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'verifiedMetrics': {
                'totalCosts': float(total_costs),
                'retailRevenue': float(retail_revenue),
                'wholesaleRevenue': float(wholesale_revenue),
                'costsByHolder': {str(k): float(v) for k, v in costs_by_holder.items() if pd.notna(k)},
                'costsByRegion': {str(k): float(v) for k, v in costs_by_region.items() if pd.notna(k)},
            },
            'aiAnalysis': {
                'anomalies': anomalies,
                'insights': ["Insight from Python backend."],
                'recommendations': ["Recommendation from Python backend."],
            },
        }

        # --- Save to Firestore ---
        result_ref = db.collection('budget_results').document()
        result_ref.set(result_data)
        
        session_ref.update({'status': 'completed', 'resultId': result_ref.id, 'completedAt': firestore.SERVER_TIMESTAMP})
        
        logging.info(f"Successfully processed session {session_id}. Result ID: {result_ref.id}")
        return json.dumps({"success": True, "resultId": result_ref.id}), 200

    except Exception as e:
        error_message = f"An unexpected error occurred: {e}"
        logging.error(f"Error processing session {session_id}: {e}", exc_info=True)
        if session_id:
            try:
                db.collection('upload_sessions').document(session_id).update({
                    'status': 'error',
                    'errorMessage': error_message,
                    'completedAt': firestore.SERVER_TIMESTAMP
                })
            except Exception as update_err:
                logging.error(f"Failed to update session {session_id} to 'failed' status: {update_err}")
        return json.dumps({"success": False, "error": error_message}), 500

    finally:
        # --- Cleanup ---
        if os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir)
            logging.info(f"Cleaned up temporary directory: {temp_dir}")
