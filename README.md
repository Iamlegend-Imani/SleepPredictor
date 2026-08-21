# Sleep Predictor

**An exploratory machine-learning project for estimating sleep quality from behavioral and physiological signals.**

Sleep Predictor uses historical sleep records to explore a simple question:

> Can a small set of everyday signals help estimate sleep quality?

The project analyzes sleep data, compares multiple regression approaches, interprets feature importance, saves a reduced-feature model, and exposes that model through a Plotly Dash interface.

## What the model uses

The saved web model accepts five inputs:

- Heart rate
- Coffee intake
- Workout status
- Activity steps
- Time in bed

It returns an estimated sleep-quality percentage.

## What is actually in this repository

The original notebook contains the substantive data-science work. It:

1. loads and explores the sleep dataset;
2. cleans and engineers sleep-related features;
3. establishes a mean-prediction baseline;
4. compares multiple regression models with cross-validation;
5. uses permutation importance for interpretability;
6. reduces the web model to five practical inputs; and
7. saves a `RandomForestRegressor` pipeline as `notebooks/model.joblib`.

The included CSV contains 887 sleep observations.

## Recorded model results

These are outputs preserved in the original 2021 notebook and **have not been independently rerun as part of this refresh**.

| Approach | Recorded MAE |
| --- | ---: |
| Mean-prediction baseline | 10.56 |
| Linear Regression | 8.37 |
| Ridge Regression | **8.29** |
| Random Forest | 8.60 |
| XGBoost | 10.41 |

Lower MAE is better. Ridge regression had the lowest recorded three-fold cross-validation MAE among these comparisons. A reduced-feature random-forest pipeline was saved for the web experience.

## Reduced-model feature importance

The notebook records permutation importance for the five-feature web model:

| Feature | Recorded importance |
| --- | ---: |
| Time in bed | 0.693653 |
| Activity steps | 0.401410 |
| Worked out | 0.084908 |
| Drank coffee | 0.075599 |
| Heart rate | 0.072214 |

These values are model-specific and are not normalized percentages or evidence of causation.

## App pages

- **Home** — project purpose and model overview
- **Predict** — interactive five-input sleep-quality estimator
- **Insights** — recorded model comparison and feature importance
- **Process** — data preparation and modeling workflow

## Repository structure

```text
SleepPredictor/
├── app.py
├── run.py
├── pages/
│   ├── index.py
│   ├── predictions.py
│   ├── insights.py
│   └── process.py
├── notebooks/
│   ├── Project2Portfolio.ipynb
│   ├── model.joblib
│   └── sleepdata1.csv
├── sleepdata1.csv
├── Pipfile
├── Pipfile.lock
└── Procfile
```

## Running the legacy project locally

This project was originally built in 2021. The dependency lock records an older stack, including Dash 1.9.1, category-encoders 2.2.2, and scikit-learn 0.24.2. The serialized model may not load correctly under modern versions of scikit-learn.

For the closest reproduction of the original environment:

```bash
git clone https://github.com/Iamlegend-Imani/SleepPredictor.git
cd SleepPredictor
pipenv install --ignore-pipfile
pipenv run python run.py
```

Then open the local Dash server shown in the terminal.

## Limitations

This repository is a portfolio and learning project, not a medical product.

- The dataset is small and historical.
- The original dataset provenance is not clearly documented in the repository.
- Missing values are common in several fields.
- Recorded model metrics are from the original notebook execution.
- Feature importance describes the fitted model and dataset; it does not establish causal effects.
- Predictions should not be used for diagnosis, treatment, or health decisions.

## Project provenance

This repository is **not a fork**, but it was created from Ryan Herr's MIT-licensed `dash-template`. The starter application's MIT license and original attribution are intentionally preserved in `LICENSE`.

The sleep analysis, modeling work, project framing, and project-specific implementation live in this repository on top of that starter scaffold.

## License

The starter scaffold is distributed under the MIT License included in this repository. See [`LICENSE`](LICENSE) for the original copyright and terms.
