# Sleep Intelligence

A modern rebuild of the original **SleepPredictor** machine-learning project.

The original 2021 notebook explored whether sleep quality could be predicted from features such as time in bed, wake state, heart rate, activity, coffee, workouts, stress, and late eating. The first app shell never became a finished product. This revamp keeps the historical dataset and research lineage while rebuilding the interface and runtime model from the ground up.

## What changed

- Replaced the unfinished Dash template with a complete interactive experience.
- Added a current scikit-learn training pipeline using the original CSV.
- Added a sleep-quality scenario estimator.
- Added model-sensitivity cards that show how the estimate changes when one habit is toggled.
- Added global permutation-importance and historical-pattern visualizations.
- Added transparent model-error context instead of presenting predictions as certainty.
- Added responsive styling and a deployable Python web-service configuration.

## Model

At startup, the app:

1. Loads `sleepdata1.csv`.
2. Converts sleep quality from percentages to a numerical regression target.
3. Engineers time-in-bed, wake-state, heart-rate, steps, and sleep-note indicators.
4. Splits the dataset into training and 20% holdout data with `random_state=42`.
5. Trains a `RandomForestRegressor` inside a preprocessing pipeline.
6. Calculates holdout MAE and permutation importance.

The interface displays the model's current holdout MAE so the prediction is framed as a directional estimate, not a promise.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:8050`.

## Deploy

A `render.yaml` and `Procfile` are included for a standard Python web deployment.

## Research archive

The original notebook and serialized model remain in `notebooks/` for provenance. They are intentionally not deleted.

## Important note

This is exploratory software built from a historical consumer sleep dataset. It is **not a medical device**, does not diagnose sleep disorders, and should not be used as a treatment recommendation.
