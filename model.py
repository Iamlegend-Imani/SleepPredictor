from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    "Heart rate",
    "Drank coffee",
    "Worked out",
    "Activity (steps)",
    "Time in bed (seconds)",
]

MODEL_CANDIDATES = {
    "Ridge": make_pipeline(
        SimpleImputer(strategy="median"),
        StandardScaler(),
        Ridge(alpha=6.0),
    ),
    "Random Forest": make_pipeline(
        SimpleImputer(strategy="median"),
        RandomForestRegressor(
            n_estimators=400,
            max_depth=20,
            random_state=42,
            n_jobs=-1,
        ),
    ),
}


def _duration_to_seconds(value):
    if pd.isna(value):
        return np.nan
    text = str(value).strip()
    try:
        hours, minutes = text.split(":", maxsplit=1)
        return int(hours) * 3600 + int(minutes) * 60
    except (TypeError, ValueError):
        return np.nan


def load_model_frame(csv_path="sleepdata1.csv"):
    path = Path(csv_path)
    data = pd.read_csv(path, sep=";")

    target = (
        data["Sleep quality"]
        .astype(str)
        .str.replace("%", "", regex=False)
        .replace("nan", np.nan)
        .astype(float)
    )

    notes = data["Sleep Notes"].fillna("").astype(str)
    features = pd.DataFrame(
        {
            "Heart rate": pd.to_numeric(data["Heart rate"], errors="coerce"),
            "Drank coffee": notes.str.contains("Drank coffee", case=False).astype(int),
            "Worked out": notes.str.contains("Worked out", case=False).astype(int),
            "Activity (steps)": pd.to_numeric(data["Activity (steps)"], errors="coerce").replace(0, np.nan),
            "Time in bed (seconds)": data["Time in bed"].map(_duration_to_seconds),
        }
    )

    mask = target.notna()
    return features.loc[mask].reset_index(drop=True), target.loc[mask].reset_index(drop=True)


@lru_cache(maxsize=1)
def train_model(csv_path="sleepdata1.csv"):
    X, y = load_model_frame(csv_path)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    comparison = {}

    for name, estimator in MODEL_CANDIDATES.items():
        scores = -cross_val_score(
            estimator,
            X_train,
            y_train,
            cv=cv,
            scoring="neg_mean_absolute_error",
        )
        comparison[name] = {
            "cv_mae": float(scores.mean()),
            "cv_std": float(scores.std()),
        }

    best_name = min(comparison, key=lambda name: comparison[name]["cv_mae"])
    model = MODEL_CANDIDATES[best_name]
    model.fit(X_train, y_train)

    predictions = np.clip(model.predict(X_test), 0, 100)
    test_mae = float(mean_absolute_error(y_test, predictions))

    importance = permutation_importance(
        model,
        X_test,
        y_test,
        scoring="neg_mean_absolute_error",
        n_repeats=20,
        random_state=42,
    )
    feature_importance = pd.DataFrame(
        {
            "Feature": FEATURE_COLUMNS,
            "Importance": importance.importances_mean,
        }
    ).sort_values("Importance", ascending=False)

    return {
        "model": model,
        "best_model": best_name,
        "comparison": comparison,
        "test_mae": test_mae,
        "feature_importance": feature_importance,
        "rows": int(len(X)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
    }


def predict_sleep_quality(
    heart_rate,
    drank_coffee,
    worked_out,
    activity_steps,
    time_in_bed_hours,
):
    artifact = train_model()
    row = pd.DataFrame(
        [
            {
                "Heart rate": heart_rate,
                "Drank coffee": int(bool(drank_coffee)),
                "Worked out": int(bool(worked_out)),
                "Activity (steps)": activity_steps,
                "Time in bed (seconds)": float(time_in_bed_hours) * 3600,
            }
        ],
        columns=FEATURE_COLUMNS,
    )
    prediction = float(artifact["model"].predict(row)[0])
    return float(np.clip(prediction, 0, 100))
