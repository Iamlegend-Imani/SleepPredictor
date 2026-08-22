# Sleep Predictor V2

**A reproducible machine-learning experiment for estimating sleep quality from everyday behavioral and physiological signals.**

Sleep Predictor began as a 2021 data-science portfolio project. Version 2 rebuilds that work on a current stack and removes the app's dependence on a serialized 2021 model artifact.

> Can a small set of everyday signals help estimate sleep quality?

## What V2 does

The application now rebuilds the model from the included sleep dataset whenever it starts. It:

1. parses sleep quality into a numeric target;
2. derives a five-feature modeling frame;
3. handles missing values inside reproducible pipelines;
4. compares Ridge and Random Forest regression with 5-fold cross-validation;
5. selects the lower-MAE model;
6. evaluates the selected model on a held-out test set;
7. calculates permutation importance on that test set; and
8. exposes the selected pipeline through an interactive Dash application.

## Model inputs

- Heart rate
- Coffee intake
- Workout status
- Activity steps
- Time in bed

The output is an exploratory sleep-quality estimate from 0 to 100.

## Current architecture

```text
sleepdata1.csv
      │
      ▼
  model.py
  ├─ clean + engineer features
  ├─ train/test split
  ├─ 5-fold model comparison
  ├─ select best model
  └─ permutation importance
      │
      ▼
   app.py
  ├─ model evidence
  ├─ interactive predictor
  └─ current evaluation
      │
      ▼
   run.py / Gunicorn
```

## Modern stack

The V2 branch is pinned to the current stable generation available at the time of the rebuild:

- Dash 4.4.1
- Plotly 6.9.0
- pandas 3.0.5
- scikit-learn 1.9.0
- Gunicorn 26.0.0

Install and run:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

For production-style serving:

```bash
gunicorn run:server
```

## Original 2021 results

The original notebook is preserved in `notebooks/Project2Portfolio.ipynb`. Its recorded outputs included:

| Approach | Historical recorded MAE |
| --- | ---: |
| Mean-prediction baseline | 10.56 |
| Linear Regression | 8.37 |
| Ridge Regression | **8.29** |
| Random Forest | 8.60 |
| XGBoost | 10.41 |

Those numbers are historical notebook outputs. V2 calculates its own model comparison and held-out evaluation at runtime rather than presenting those values as current performance.

## Why the rebuild matters

The 2021 project contained substantive modeling work, but its application layer still looked like a starter template and depended on an old `model.joblib`. V2 turns it into a reproducible system: the data transformation, model selection, evaluation, and prediction path are visible in code and regenerated from source data.

## Repository provenance

This repository is **not a fork**, but it was originally created from Ryan Herr's MIT-licensed `dash-template`. The starter license and attribution are intentionally preserved in `LICENSE`.

The sleep analysis, modeling work, project-specific implementation, and V2 rebuild live on top of that starter scaffold.

## Limitations

This is an exploratory portfolio project, **not a medical device**.

- The dataset is small and historical.
- The original dataset provenance is not clearly documented in the repository.
- Several source fields contain substantial missing data.
- Model performance on this dataset does not establish general clinical validity.
- Permutation importance describes model behavior, not causal relationships.
- Predictions should not be used for diagnosis, treatment, or health decisions.

## License

See [`LICENSE`](LICENSE) for the original MIT template copyright and terms.
