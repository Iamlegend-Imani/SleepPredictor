# Sleep Predictor

> **A sleep-quality machine-learning project that evolved from a 2021 notebook into a reproducible Python application and a browser-native public experience.**

[**Live Client Experience → GitHub Pages**](https://Iamlegend-Imani.github.io/SleepPredictor/) · [**View the V2 code**](https://github.com/Iamlegend-Imani/SleepPredictor/tree/sleep-predictor-v2) · [**Original notebook**](notebooks/Project2Portfolio.ipynb)

---

## The question

Sleep is deeply affected by what happens before we close our eyes: how long we stay in bed, how active we were, whether we worked out, what we consumed, and physiological signals such as heart rate.

This project began with a simple question:

> **Can a small set of everyday behavioral and physiological signals help estimate sleep quality?**

Sleep Predictor explores that question with historical sleep records and machine learning. It is intentionally small, interpretable, and experimental. The goal is not clinical diagnosis. The goal is to demonstrate the full path from raw human data → feature engineering → model comparison → interpretation → prediction → usable product experience.

---

## Project evolution

### 2021 — Original data-science project

The first version was built as a machine-learning portfolio project. The substantive work lives in `notebooks/Project2Portfolio.ipynb` and includes exploratory analysis, feature engineering, model comparison, model interpretation, feature reduction, and serialization of a model for a Dash interface.

The original repository, however, still looked heavily like the generic Dash starter it was created from. Several public-facing pages remained placeholder content, the app branding had not been fully replaced, and the web experience depended on a serialized 2021 `model.joblib` artifact.

### 2026 — Portfolio restoration

The project was revisited to expose the work that was already there. The README was rebuilt around the actual analysis, placeholder application copy was removed, the prediction concept was restored, and the project provenance was documented clearly.

### 2026 — Sleep Predictor V2

V2 moves beyond restoration. The Python application now rebuilds its model directly from the included dataset instead of depending on the old serialized model. It creates a reproducible five-feature modeling frame, compares Ridge and Random Forest regression, selects the lower cross-validation MAE candidate, evaluates it on a held-out test set, calculates permutation importance, and exposes the selected model through Dash.

### 2026 — Public GitHub Pages client

The newest layer makes Sleep Predictor accessible without a Python server. The GitHub Pages client loads the included dataset directly in the browser and trains a lightweight Ridge regression model locally in JavaScript. User inputs never need to leave the device.

The result is one project with three useful layers:

| Layer | Purpose | Runtime |
| --- | --- | --- |
| Original notebook | Research history and exploratory modeling | Jupyter / Python |
| V2 application | Reproducible current ML pipeline and richer evaluation | Python / Dash |
| Public client | Frictionless interactive experience | Static HTML/CSS/JavaScript |

---

## What the model looks at

The final product experience centers on five signals that were surfaced in the original modeling work:

| Signal | Representation |
| --- | --- |
| Heart rate | Beats per minute |
| Coffee | Binary indicator extracted from sleep notes |
| Workout | Binary indicator extracted from sleep notes |
| Activity | Daily step count |
| Time in bed | Duration converted to seconds |

The target is the recorded **Sleep quality** percentage.

The output is an exploratory estimate between 0 and 100.

---

## Dataset

The included `sleepdata1.csv` contains **887 historical sleep observations** plus the header row. The source fields include:

- Start timestamp
- End timestamp
- Sleep quality
- Time in bed
- Wake-up mood
- Sleep notes
- Heart rate
- Activity steps

The data includes substantial missingness in several fields. Rather than hiding that, the modeling pipeline makes missing-data handling explicit.

For the current five-feature model:

- Heart rate is converted to numeric and missing values are imputed.
- Coffee and workout indicators are extracted from the free-text sleep notes.
- Zero activity-step values are treated as missing because the original notebook treated those zeros as unavailable activity measurements rather than confirmed inactivity.
- Time in bed is converted from `HH:MM` into seconds.
- Sleep-quality percentages are parsed into a numeric regression target.

---

## Original 2021 modeling results

The original notebook preserved several model comparisons. These numbers are **historical notebook outputs**, not newly claimed clinical performance.

| Approach | Recorded MAE |
| --- | ---: |
| Mean-prediction baseline | 10.56 |
| Linear Regression | 8.37 |
| **Ridge Regression** | **8.29** |
| Random Forest | 8.60 |
| XGBoost | 10.41 |

Lower MAE is better. Among those preserved three-fold cross-validation runs, Ridge regression recorded the lowest MAE.

The notebook also reduced the product-facing model to five practical inputs and saved a Random Forest pipeline as `notebooks/model.joblib`.

### Original reduced-model permutation importance

The notebook recorded the following permutation-importance values for the five-feature web model:

| Feature | Recorded importance |
| --- | ---: |
| Time in bed | 0.693653 |
| Activity steps | 0.401410 |
| Worked out | 0.084908 |
| Drank coffee | 0.075599 |
| Heart rate | 0.072214 |

These values describe the behavior of that fitted model on that dataset. They are not percentages and they do **not** establish causal effects.

---

## Sleep Predictor V2: reproducible Python architecture

The modern Python path is designed so that the transformation and model-selection logic are visible and regenerated from source data.

```text
sleepdata1.csv
      │
      ▼
   model.py
   ├── parse target
   ├── engineer 5 features
   ├── median imputation
   ├── train/test split
   ├── 5-fold cross-validation
   ├── Ridge vs Random Forest
   ├── select lower-MAE model
   ├── held-out evaluation
   └── permutation importance
      │
      ▼
    app.py
   ├── live model evidence
   ├── interactive inputs
   └── sleep-quality prediction
      │
      ▼
 run.py / Gunicorn
```

### V2 model candidates

**Ridge Regression**

- Median imputation
- Standard scaling
- Ridge `alpha=6.0`

**Random Forest Regression**

- Median imputation
- 400 estimators
- Maximum depth of 20
- Fixed random seed for reproducibility

The training set is compared using shuffled 5-fold cross-validation with mean absolute error. The lower-MAE candidate is fitted and then evaluated against a held-out test set.

---

## Public GitHub Pages architecture

GitHub Pages cannot execute a Python/Dash server, so the public client uses a browser-native companion model rather than pretending the Python runtime is available.

```text
GitHub Pages
   │
   ├── index.html
   ├── styles.css
   ├── app.js
   └── sleepdata1.csv
            │
            ▼
      browser training
      ├── parse source data
      ├── median imputation
      ├── standardization
      ├── Ridge regression
      └── local prediction
```

The browser model intentionally mirrors the Ridge design used in the Python work:

- five model inputs;
- median imputation;
- feature standardization;
- Ridge regularization with `alpha = 6`;
- prediction clipped to the 0–100 range.

This is a **browser-optimized companion model**, not a claim that JavaScript is executing the exact same fitted estimator selected by the Python V2 pipeline. The distinction is deliberate and documented.

### Privacy behavior

The public predictor performs computation locally in the browser. The values entered into the form do not need to be transmitted to an application backend.

---

## Client experience

The public interface is designed to make the work understandable before making it technical.

It includes:

1. A clear explanation of the central question.
2. A five-input interactive predictor.
3. An explanation of how the browser model is trained.
4. The preserved historical model-comparison evidence.
5. The story of how the 2021 project evolved into the current system.
6. Direct access back to the source repository.

When GitHub Pages is enabled for this repository, the public project URL is:

**https://Iamlegend-Imani.github.io/SleepPredictor/**

---

## Current technology stack

### V2 Python application

- Python
- Dash 4.4.1
- Plotly 6.9.0
- pandas 3.0.5
- NumPy 2.3.3
- scikit-learn 1.9.0
- Gunicorn 26.0.0

### Public client

- Semantic HTML
- Responsive CSS
- Vanilla JavaScript
- Browser-side matrix operations for Ridge regression
- GitHub Pages
- GitHub Actions deployment

### Historical project

- Jupyter Notebook
- pandas
- scikit-learn
- XGBoost
- SHAP / permutation-importance exploration
- Plotly Dash starter architecture

---

## Repository map

```text
SleepPredictor/
├── README.md
├── sleepdata1.csv
├── model.py                    # Reproducible modern ML pipeline
├── app.py                      # Current Dash application
├── run.py                      # Python entry point
├── requirements.txt            # Modern pinned runtime
├── Procfile
│
├── site/                       # Public GitHub Pages client
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── .github/workflows/
│   └── pages.yml               # GitHub Pages deployment
│
├── notebooks/
│   ├── Project2Portfolio.ipynb # Original analysis
│   ├── model.joblib            # Historical serialized model
│   └── sleepdata1.csv
│
├── pages/                      # Historical Dash multipage implementation
└── LICENSE
```

---

## Run the V2 Python application locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

On Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Production-style serving:

```bash
gunicorn run:server
```

---

## Run the public client locally

Because the browser client fetches `sleepdata1.csv`, serve the site through a local HTTP server rather than opening `index.html` directly.

From the repository root:

```bash
mkdir -p .pages-dist
cp -R site/. .pages-dist/
cp sleepdata1.csv .pages-dist/sleepdata1.csv
python -m http.server 8000 --directory .pages-dist
```

Then open `http://localhost:8000`.

---

## Deploy to GitHub Pages

The repository includes `.github/workflows/pages.yml`. The workflow packages the static client together with the root sleep dataset and deploys it through the official GitHub Pages actions.

One-time repository setup may be required:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

After that, pushes to the `github-pages-client` branch trigger the Pages deployment workflow.

---

## What this project demonstrates

This project is useful less because a sleep score exists and more because of the full system around it. It demonstrates:

- transforming messy human-generated data into model-ready signals;
- recognizing and handling missingness rather than ignoring it;
- establishing a baseline before evaluating more complex models;
- comparing multiple modeling approaches instead of defaulting to complexity;
- reducing a model into practical user-facing inputs;
- interpreting model behavior without confusing importance with causality;
- separating research evidence from product presentation;
- modernizing legacy ML work without erasing its history;
- creating both server-side and browser-native inference experiences;
- documenting provenance and technical limitations explicitly.

---

## Limitations and responsible use

Sleep Predictor is an exploratory portfolio and learning project. It is **not a medical device**, diagnostic system, treatment tool, or validated wellness intervention.

Important limitations include:

- The dataset is small and historical.
- The original dataset provenance is not clearly documented inside the repository.
- Several features contain substantial missing values.
- The dataset may not represent a broad population.
- Historical notebook metrics were produced in the original 2021 environment.
- The browser model is trained on the full included dataset for interactive demonstration rather than positioned as an independently validated production model.
- Feature importance reflects fitted model behavior and does not establish causal relationships.
- Predictions should not be used to make medical or health-treatment decisions.

---

## Future directions

A more ambitious evolution would move beyond asking **“What might my sleep score be?”** toward asking **“What appears to be affecting my sleep, how confident are we, and what patterns persist over time?”**

That could include longitudinal personal baselines, circadian timing, recovery signals, wearable integrations, confidence intervals, individualized feature effects, anomaly detection, privacy-preserving personal models, and intervention tracking.

The important shift would be from a one-time predictor to a genuine sleep-intelligence layer.

---

## Project provenance

This repository is **not a fork**, but it was originally created from Ryan Herr’s MIT-licensed `dash-template`. The original template copyright and MIT terms remain preserved in [`LICENSE`](LICENSE).

The sleep analysis, modeling work, project-specific implementation, V2 rebuild, and browser client live on top of that starter scaffold.

Preserving that distinction matters: the goal of the rebuild is to make the project stronger without rewriting its history.

---

## License

See [`LICENSE`](LICENSE) for the original MIT template copyright and license terms.
