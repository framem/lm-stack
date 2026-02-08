from __future__ import annotations

import json
from pathlib import Path
from typing import List

import pandas as pd
from sklearn.tree import DecisionTreeRegressor
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType


DATASET_PATH = Path("data/melb_data.csv")
MODEL_DIR = Path("model")
MODEL_PATH = MODEL_DIR / "melbourne_tree.onnx"
METADATA_PATH = MODEL_DIR / "melbourne_tree_metadata.json"
FEATURE_CANDIDATES: List[str] = [
    "Rooms",
    "Distance",
    "Bedroom2",
    "Bathroom",
    "Car",
    "Landsize",
    "BuildingArea",
    "YearBuilt",
]
TARGET_COLUMN = "Price"


def load_training_data() -> tuple[pd.DataFrame, pd.Series, list[str]]:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")
    data = pd.read_csv(DATASET_PATH)
    if TARGET_COLUMN not in data.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not present in dataset")

    available_features = [name for name in FEATURE_CANDIDATES if name in data.columns]
    if not available_features:
        raise ValueError("None of the expected features are present in the dataset")

    feature_frame = data[available_features]
    cleaned = feature_frame.dropna()
    if cleaned.empty:
        raise ValueError("No rows left after dropping NA values for selected features")

    y = data.loc[cleaned.index, TARGET_COLUMN].astype("float32")
    X = cleaned.astype("float32")

    return X, y, available_features


def train_model(X: pd.DataFrame, y: pd.Series) -> DecisionTreeRegressor:
    model = DecisionTreeRegressor(random_state=1)
    model.fit(X, y)
    return model


def export_onnx(model: DecisionTreeRegressor, feature_names: list[str]) -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    initial_type = [("float_input", FloatTensorType([None, len(feature_names)]))]
    onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=15)
    MODEL_PATH.write_bytes(onnx_model.SerializeToString())

    metadata = {
        "features": feature_names,
        "input_tensor_name": initial_type[0][0],
        "target": TARGET_COLUMN,
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2))
    print(f"ONNX model exported to {MODEL_PATH}")
    print(f"Metadata saved to {METADATA_PATH}")


def main() -> None:
    X, y, feature_names = load_training_data()
    print(f"Training with {len(X)} samples and {len(feature_names)} features: {feature_names}")
    model = train_model(X, y)
    export_onnx(model, feature_names)


if __name__ == "__main__":
    main()
