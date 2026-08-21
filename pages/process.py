import dash_bootstrap_components as dbc
import dash_core_components as dcc
import dash_html_components as html


layout = html.Div(
    [
        html.H2("How the project works"),
        dcc.Markdown(
            """
### 1. Start with sleep records
The included CSV contains **887 sleep observations** with fields such as sleep
quality, time in bed, wake-up mood, sleep notes, heart rate, and activity steps.

### 2. Clean and engineer features
The notebook converts sleep quality from a percentage string to a numeric
target, transforms time in bed into seconds, handles missing values, and
extracts behavioral indicators from the sleep notes.

Examples include whether the record mentions:
- coffee
- tea
- working out
- a stressful day
- eating late

### 3. Establish a baseline
A mean-prediction baseline produced a recorded MAE of approximately **10.56**.

### 4. Compare models
The analysis evaluates linear regression, Ridge regression, random forest, and
XGBoost approaches using cross-validation.

### 5. Interpret and simplify
Permutation importance is used to inspect which variables contribute most to
the model. The web version is reduced to five inputs:

1. Heart rate
2. Drank coffee
3. Worked out
4. Activity steps
5. Time in bed

### 6. Save the web model
A `RandomForestRegressor` pipeline with one-hot encoding and missing-value
imputation is saved to `notebooks/model.joblib` and used by the prediction page.

---

### Important limitations

This is a small historical dataset and an exploratory portfolio project. The
repository does not clearly document the original dataset provenance, so this
refresh does not invent one. The model should not be interpreted as a medical
or causal model of sleep.
            """
        ),
        dbc.Alert(
            "Good machine learning includes knowing what a model cannot tell you.",
            color="light",
        ),
    ]
)
