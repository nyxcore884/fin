# functions/budget_mapping.py
"""
Utility functions that turn the raw column names you receive from
an uploaded CSV/Excel sheet into clean, predictable field names.
"""

from __future__ import annotations
from pathlib import Path
from typing import Dict

import pandas as pd

def _normalise(s: str) -> str:
    return (
        s.strip()
        .replace(r'\s+', '_', regex=True)
        .replace(r'[^\w_]', '', regex=True)
        .lower()
    )

def normalise_column_names(df: pd.DataFrame) -> pd.DataFrame:
    normalised = {}
    cleaned = df.copy()
    for orig in df.columns:
        canon = _normalise(orig)
        normalised[canon] = orig
    cleaned.columns = [_normalise(c) for c in df.columns]
    setattr(cleaned, 'column_mapping', normalised)
    return cleaned

def safe_lookup_original(df: pd.DataFrame, canonical_name: str) -> str:
    mapping = getattr(df, "column_mapping", {})
    try:
        return mapping[canonical_name]
    except KeyError as exc:
        available = ", ".join(sorted(mapping.keys()))
        raise KeyError(
            f"Column mapping for '{canonical_name}' not found. "
            f"Available canonical names: {available}"
        ) from exc

def _load_mapping(csv_path: Path) -> Dict[str, str]:
    df = pd.read_csv(csv_path, dtype=str).fillna("")
    if df.shape[1] != 2:
        raise ValueError(f"Mapping file {csv_path} must have exactly two columns")
    mapping: Dict[str, str] = {}
    for _, row in df.iterrows():
        raw, canon = row[0], row[1]
        canon_norm = _normalise(canon)
        mapping[canon_norm] = raw
    return mapping

_MAPPING_DIR = Path(__file__).parent / "mappings"

_BUDGET_ARTICLE_TO_BUDGET_HOLDER_MAP: Dict[str, str] = _load_mapping(_MAPPING_DIR / "budget_article_to_budget_holder.csv")
_REGION_MAP: Dict[str, str] = _load_mapping(_MAPPING_DIR / "budget_article_to_region.csv")
_COST_ITEM_MAP: Dict[str, str] = _load_mapping(_MAPPING_DIR / "cost_item_to_budget_article.csv")

def get_canonical(name: str) -> str:
    return _normalise(name)

def merge_mappings(df: pd.DataFrame) -> pd.DataFrame:
    df = normalise_column_names(df)
    for canonical in ["budget_article", "budget_holder", "region"]:
        if canonical not in df.columns:
            try:
                original = safe_lookup_original(df, canonical)
                df[canonical] = df[original]
            except KeyError:
                df[canonical] = pd.NA
    
    placeholder = "Unmapped"
    for col in ["budget_article", "budget_holder", "region"]:
        df[col] = df[col].fillna(placeholder)

    return df
