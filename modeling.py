from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = Path(__file__).resolve().parent / "sleepdata1.csv"

FEATURES = [
    "time_in_bed_minutes",
    "wake_state",
    "heart_rate",
    "steps",
    "coffee",
    "tea",
    "worked_out",
    "stressful_day",
    "ate_late",
]

NUMERIC_FEATURES = [
    "time_in_bed_minutes",
    "heart_rate",
    "steps",
    "coffee",
    "tea",
    "worked_out",
    "stressful_day",
    "ate_late",
]
CATEGORICAL_FEATURES = ["wake_state"]

LABELS = {
    "time_in_bed_minutes": "Time in bed",
    "wake_state": "Wake state",
    "heart_rate": "Heart rate",
    "steps": "Daily steps",
    "coffee": "Coffee",
    "tea": "Tea",
    "worked_out": "Workout",
    "stressful_day": "Stressful day",
    "ate_late": "Late meal",
}


@dataclass
class ModelBundle:
    model: Pipeline
    data: pd.DataFrame
    test_mae: float
    baseline_mae: float
    feature_importance: Dict[str, float]
    date_start: str
    date_end: str


def _time_to_minutes(value) -> float:
    if pd.isna(value):
        return np.nan
    text = str(value).strip()
    try:
        hours, minutes = text.split(":", 1)
        return float(hours) * 60 + float(minutes)
    except (ValueError, TypeError):
        return np.nan


def _wake_state(value) -> str:
    if pd.isna(value):
        return "not recorded"
    text = str(value).strip()
    mapping = {
        ":)": "good",
        ":|": "neutral",
        ":(": "low",
        "Happy": "good",
        "Okay": "neutral",
        "Sad": "low",
    }
    return mapping.get(text, text.lower() or "not recorded")


def _contains_note(series: pd.Series, phrase: str) -> pd.Series:
    return (
        series.fillna("")
        .astype(str)
        .str.contains(phrase, case=False, regex=False)
        .astype(int)
    )


def load_sleep_data(path: Path = DATA_PATH) -> pd.DataFrame:
    raw = pd.read_csv(path, sep=";")
    df = pd.DataFrame(index=raw.index)

    df["sleep_quality"] = pd.to_numeric(
        raw["Sleep quality"].astype(str).str.replace("%", "", regex=False),
        errors="coerce",
    )
    df["time_in_bed_minutes"] = raw["Time in bed"].map(_time_to_minutes)
    df["wake_state"] = raw["Wake up"].map(_wake_state)
    df["heart_rate"] = pd.to_numeric(raw["Heart rate"], errors="coerce")
    df["steps"] = pd.to_numeric(raw["Activity (steps)"], errors="coerce")

    notes = raw["Sleep Notes"]
    df["coffee"] = _contains_note(notes, "Drank coffee")
    df["tea"] = _contains_note(notes, "Drank tea")
    df["worked_out"] = _contains_note(notes, "Worked out")
    df["stressful_day"] = _contains_note(notes, "Stressful day")
    df["ate_late"] = _contains_note(notes, "Ate late")

    start = pd.to_datetime(raw["Start"], errors="coerce")
    df["date"] = start.dt.date
    df = df.dropna(subset=["sleep_quality"]).reset_index(drop=True)
    return df


def build_model(path: Path = DATA_PATH) -> ModelBundle:
    data = load_sleep_data(path)
    X = data[FEATURES]
    y = data["sleep_quality"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    numeric = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )
    categorical = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric, NUMERIC_FEATURES),
            ("cat", categorical, CATEGORICAL_FEATURES),
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=500,
                    max_depth=15,
                    min_samples_leaf=2,
                    random_state=30,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    model.fit(X_train, y_train)

    prediction = model.predict(X_test)
    test_mae = float(mean_absolute_error(y_test, prediction))
    baseline = np.repeat(y_train.mean(), len(y_test))
    baseline_mae = float(mean_absolute_error(y_test, baseline))

    importance = permutation_importance(
        model,
        X_test,
        y_test,
        n_repeats=8,
        random_state=42,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    importance_map = {
        feature: max(0.0, float(score))
        for feature, score in zip(FEATURES, importance.importances_mean)
    }

    dates = pd.to_datetime(data["date"], errors="coerce")
    date_start = dates.min().strftime("%b %Y") if dates.notna().any() else "Unknown"
    date_end = dates.max().strftime("%b %Y") if dates.notna().any() else "Unknown"

    return ModelBundle(
        model=model,
        data=data,
        test_mae=test_mae,
        baseline_mae=baseline_mae,
        feature_importance=importance_map,
        date_start=date_start,
        date_end=date_end,
    )


def make_input(
    hours: float,
    wake_state: str,
    heart_rate: float | None,
    steps: float | None,
    habits: Iterable[str],
) -> pd.DataFrame:
    selected = set(habits or [])
    return pd.DataFrame(
        [
            {
                "time_in_bed_minutes": float(hours) * 60,
                "wake_state": wake_state or "not recorded",
                "heart_rate": heart_rate,
                "steps": steps,
                "coffee": int("coffee" in selected),
                "tea": int("tea" in selected),
                "worked_out": int("worked_out" in selected),
                "stressful_day": int("stressful_day" in selected),
                "ate_late": int("ate_late" in selected),
            }
        ],
        columns=FEATURES,
    )


def predict_score(bundle: ModelBundle, row: pd.DataFrame) -> float:
    score = float(bundle.model.predict(row)[0])
    return float(np.clip(score, 0, 100))


def scenario_deltas(bundle: ModelBundle, row: pd.DataFrame) -> Dict[str, float]:
    base = predict_score(bundle, row)
    result: Dict[str, float] = {}
    toggles = ["coffee", "tea", "worked_out", "stressful_day", "ate_late"]
    for feature in toggles:
        alternative = row.copy()
        alternative.loc[0, feature] = 1 - int(alternative.loc[0, feature])
        result[feature] = predict_score(bundle, alternative) - base
    return result
