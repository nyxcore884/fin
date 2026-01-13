
import pandas as pd
import numpy as np
from firebase_admin import firestore, storage
import firebase_admin
# Temporarily comment out firebase_functions import for Colab compatibility.
# from firebase_functions import firestore_fn, options
from datetime import datetime
import tempfile
import os
import json
import logging

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO)
# options.set_global_options(region=options.SupportedRegion.EUROPE_WEST1)

# --- Firebase Admin SDK Initialization ---
# For local testing, ensure Firebase Admin SDK is initialized without functions_framework
if not firebase_admin._apps:
    try:
        # In a real Cloud Function, this would be initialized automatically.
        # For local testing in Colab, we use a placeholder if not already initialized.
        # This part assumes Firebase project credentials are set up if actually interacting with Firebase.
        # For this exercise, we will mock Firebase interactions below if needed.
        # firebase_admin.initialize_app()
        logging.info("Firebase Admin SDK initialization skipped for local testing.")
    except Exception as e:
        logging.error(f"Failed to initialize Firebase Admin SDK: {e}")

# Mock Firestore and Storage clients for local execution
# In a deployed Cloud Function, these would be active Firebase clients.
db = firestore.client() if firebase_admin._apps else None
storage_client = storage.bucket() if firebase_admin._apps else None

def clean_numeric_column(series):
    """
    Robustly cleans a pandas Series containing numeric strings with various locale formats.
    Handles Georgian (lari), Russian, and European number formats.
    """
    if series.dtype == 'object':
        s = series.astype(str).str.strip()

        # Standardize decimal and thousands separators.
        # Prioritize patterns to distinguish thousands separators from decimal points.
        # Example: "1.234,56" (European) -> "1234.56"
        # Example: "1,234.56" (English) -> "1234.56"
        # Example: "123456" -> "123456"
        # Example: "123,456" -> "123456" (if comma is thousands)
        # Example: "123.456" -> "123456" (if period is thousands)
        
        # Remove all spaces as thousands separators
        s = s.str.replace(r'\s', '', regex=True)

        # Case 1: European format (thousands separator is '.', decimal separator is ',')
        # e.g., 1.234.567,89
        european_pattern = s.str.contains(r'\d+\.\d+,\d+$', regex=True)
        s.loc[european_pattern] = s.loc[european_pattern].str.replace('.', '', regex=False).str.replace(',', '.', regex=False)

        # Case 2: English format (thousands separator is ',', decimal separator is '.')
        # e.g., 1,234,567.89
        english_pattern = s.str.contains(r'\d+,\d+\.\d+$', regex=True)
        s.loc[english_pattern] = s.loc[english_pattern].str.replace(',', '', regex=False)

        # Case 3: Mixed or ambiguous, try to remove all non-decimal-point characters except first sign
        # This is a fallback and might not be perfect for all edge cases.
        s = s.str.replace(r'[^\d\.-]', '', regex=True)
        
        # Ensure only one decimal point (the last one if multiple exist due to bad cleaning)
        def handle_multiple_decimals(val):
            parts = str(val).split('.')
            if len(parts) > 2:
                return parts[0] + '.' + ''.join(parts[1:])
            return val
        s = s.apply(handle_multiple_decimals)

        return pd.to_numeric(s, errors='coerce')
    return series

# The original function decorator and function signature.
# @firestore_fn.on_document_updated("uploadSessions/{sessionId}")
# def process_upload_session(event: firestore_fn.Event[firestore_fn.Change]) -> None:
# Modified to a regular function for local testing in Colab.
def run_processing_logic(session_id, after_data):
    """
    Core data processing logic, extracted for local testing.
    In a real Cloud Function, this would be `process_upload_session`.
    """
    
    # Mock session_ref update for local testing. In a real Cloud Function, this would update Firestore.
    # session_ref.update({'status': 'processing', 'updatedAt': firestore.SERVER_TIMESTAMP})
    logging.info(f"Simulating processing for session {session_id}")

    # 1. DOWNLOAD FILES FROM CLOUD STORAGE (MOCKED for local execution)
    files_meta = after_data.get('files', {})
    local_files = {}
    # In a real scenario, this would download from storage_client.
    # For local testing, we would need actual file paths or mock dataframes.
    # For demonstration, we'll assume df_gl, df_budget_mapping, etc. are already loaded or mocked.
    
    # Example of mock dataframes for local testing without actual file downloads
    # Replace these with actual data loading if you have local test files
    df_gl = pd.DataFrame({
        'Transaction_ID': ['T001', 'T002', 'T003', 'T004', 'T005'],
        'Amount_Reporting_Curr': ['1.234,56', '500.00', '-789,12', '123456', '300.50'],
        'cost_item': ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Office Supplies'],
        'structural_unit': ['HR', 'Finance', 'Operations', 'Marketing', 'Admin'],
        'counterparty': ['Landlord', 'Employee', 'Electricity Co.', 'Ad Agency', 'Supplier']
    })

    df_budget_mapping = pd.DataFrame({
        'budget_article': ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Office Supplies'],
        'budget_holder': ['Admin Dept', 'HR Dept', 'Facilities', 'Marketing Dept', 'Admin Dept']
    })

    df_cost_item_map = pd.DataFrame({
        'cost_item': ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Office Supplies'],
        'budget_article': ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Office Supplies'] # Direct mapping for simplicity
    })

    df_regional_mapping = pd.DataFrame({
        'structural_unit': ['HR', 'Finance', 'Operations', 'Marketing', 'Admin'],
        'region': ['North', 'South', 'East', 'West', 'Central']
    })
    
    df_corrections = pd.DataFrame({
        'Transaction_ID': ['T003'],
        'corrected_budget_article': ['Maintenance'],
        'corrected_budget_holder': ['Facilities Dept'],
        'corrected_region': ['South']
    }) # Example correction

    # 2. READ AND VALIDATE FILES (using mock data for local run)
    # The actual read_file function is below for reference for when deployed.
    # def read_file(path):
    #     if path.endswith('.csv'):
    #         return pd.read_csv(path, encoding='utf-8-sig')
    #     elif path.endswith(('.xlsx', '.xls')):
    #         return pd.read_excel(path, engine='openpyxl')
    #     raise ValueError(f"Unsupported file format for {path}")

    # Instruction 3: Apply robust numeric data cleaning
    amount_cols = ['Amount_Reporting_Curr'] # Only Amount_Reporting_Curr for this mock. Expand if other cols are numeric.
    for col in amount_cols:
        if col in df_gl.columns:
            df_gl[col] = clean_numeric_column(df_gl[col])
    df_gl.dropna(subset=['Amount_Reporting_Curr'], inplace=True)

    # 3. APPLY BUSINESS LOGIC MAPPINGS (Instruction 4 Refinement)

    # Apply corrections first if available and if there's a unique identifier like 'Transaction_ID'
    if not df_corrections.empty and 'Transaction_ID' in df_gl.columns and 'Transaction_ID' in df_corrections.columns:
        df_gl = pd.merge(df_gl, df_corrections, on='Transaction_ID', how='left', suffixes=('', '_corrected'))

        # Apply corrections: prioritize corrected values if they exist
        for col_prefix in ['budget_article', 'budget_holder', 'region']:
            corrected_col = f'corrected_{col_prefix}'
            if corrected_col in df_gl.columns:
                df_gl[col_prefix] = df_gl[corrected_col].fillna(df_gl[col_prefix])
                df_gl.drop(columns=[corrected_col], inplace=True)

    # Map cost items to budget articles
    if 'cost_item' in df_gl.columns and 'cost_item' in df_cost_item_map.columns and 'budget_article' in df_cost_item_map.columns:
        # Ensure we don't overwrite if budget_article was already set by corrections
        temp_mapped_col = '_budget_article_from_map'
        df_gl = pd.merge(df_gl, df_cost_item_map[['cost_item', 'budget_article']].rename(columns={'budget_article': temp_mapped_col}), 
                         on='cost_item', how='left')
        df_gl['budget_article'] = df_gl['budget_article'].fillna(df_gl[temp_mapped_col])
        df_gl.drop(columns=[temp_mapped_col], inplace=True)

    # Map budget articles to budget holders
    if 'budget_article' in df_gl.columns and 'budget_article' in df_budget_mapping.columns and 'budget_holder' in df_budget_mapping.columns:
        temp_mapped_col = '_budget_holder_from_map'
        df_gl = pd.merge(df_gl, df_budget_mapping[['budget_article', 'budget_holder']].rename(columns={'budget_holder': temp_mapped_col}), 
                         on='budget_article', how='left')
        df_gl['budget_holder'] = df_gl['budget_holder'].fillna(df_gl[temp_mapped_col])
        df_gl.drop(columns=[temp_mapped_col], inplace=True)

    # Map structural units to regions
    if 'structural_unit' in df_gl.columns and 'structural_unit' in df_regional_mapping.columns and 'region' in df_regional_mapping.columns:
        temp_mapped_col = '_region_from_map'
        df_gl = pd.merge(df_gl, df_regional_mapping[['structural_unit', 'region']].rename(columns={'region': temp_mapped_col}), 
                         on='structural_unit', how='left')
        df_gl['region'] = df_gl['region'].fillna(df_gl[temp_mapped_col])
        df_gl.drop(columns=[temp_mapped_col], inplace=True)

    # Fill any remaining NaN in key mapping columns with a placeholder like 'Unmapped'
    df_gl['budget_article'] = df_gl['budget_article'].fillna('Unmapped Article')
    df_gl['budget_holder'] = df_gl['budget_holder'].fillna('Unmapped Holder')
    df_gl['region'] = df_gl['region'].fillna('Unmapped Region')

    # 4. AGGREGATE INTO INCOME STATEMENT (for AI analysis preparation - Instruction 5)
    revenue_df = df_gl[df_gl['Amount_Reporting_Curr'] > 0].copy()
    costs_df = df_gl[df_gl['Amount_Reporting_Curr'] <= 0].copy()

    total_costs = costs_df['Amount_Reporting_Curr'].abs().sum()
    costs_by_holder = costs_df.groupby('budget_holder')['Amount_Reporting_Curr'].abs().sum().to_dict()
    costs_by_region = costs_df.groupby('region')['Amount_Reporting_Curr'].abs().sum().to_dict()

    retail_revenue = revenue_df['Amount_Reporting_Curr'].sum() * 0.7
    wholesale_revenue = revenue_df['Amount_Reporting_Curr'].sum() * 0.3

    # For AI analysis, return processed dataframes or their summaries.
    # For now, retain placeholders for AI-generated data.
    anomalies = ["AI analysis temporarily unavailable."]
    insights = ["Insight from unified TS backend."]
    recommendations = ["Recommendation from unified TS backend."]

    # 6. RETURN/SAVE RESULTS (mocked for local execution)
    results_data = {
        'userId': after_data.get('userId', 'mock_user'),
        'uploadId': session_id,
        'timestamp': datetime.now().isoformat(), # Use current time for mock
        'retailRevenue': float(retail_revenue),
        'wholesaleRevenue': float(wholesale_revenue),
        'totalCosts': float(total_costs),
        'costsByHolder': {str(k): float(v) for k, v in costs_by_holder.items() if pd.notna(k)},
        'costsByRegion': {str(k): float(v) for k, v in costs_by_region.items() if pd.notna(k)},
        'anomalies': anomalies,
        'insights': insights,
        'recommendations': recommendations
    }
    logging.info(f"Simulated results for session {session_id}:\n{json.dumps(results_data, indent=2)}")
    return results_data

# Example of how to call the processing logic locally with mock data
if __name__ == '__main__':
    # Mock event data as it would come from Firestore trigger
    mock_after_data = {
        'userId': 'test_user_123',
        'status': 'ready_for_processing',
        'files': {
            'glEntries': {'name': 'mock_gl.csv', 'path': '/mock/path/gl.csv'},
            'budgetHolderMapping': {'name': 'mock_budget_map.csv', 'path': '/mock/path/budget_map.csv'},
            'costItemMap': {'name': 'mock_cost_item_map.csv', 'path': '/mock/path/cost_item_map.csv'},
            'regionalMapping': {'name': 'mock_regional_map.csv', 'path': '/mock/path/regional_map.csv'}
        }
    }
    mock_session_id = 'mock_session_abc'

    # Run the processing logic
    processed_results = run_processing_logic(mock_session_id, mock_after_data)
    print("\n--- Processing Completed (Mocked) ---")
    print(f"Processed Data for Session: {mock_session_id}")
    # In a real scenario, this would involve saving to Firestore
