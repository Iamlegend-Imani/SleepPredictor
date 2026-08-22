import dash_bootstrap_components as dbc
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd
import plotly.express as px


model_scores = pd.DataFrame(
    {
        "Model": [
            "Baseline (mean prediction)",
            "Linear Regression",
            "Ridge Regression",
            "Random Forest",
            "XGBoost",
        ],
        "MAE": [10.56, 8.37, 8.29, 8.60, 10.41],
    }
)

feature_importance = pd.DataFrame(
    {
        "Feature": [
            "Time in bed",
            "Activity steps",
            "Worked out",
            "Drank coffee",
            "Heart rate",
        ],
        "Permutation importance": [0.693653, 0.401410, 0.084908, 0.075599, 0.072214],
    }
).sort_values("Permutation importance", ascending=True)

importance_figure = px.bar(
    feature_importance,
    x="Permutation importance",
    y="Feature",
    orientation="h",
    title="Recorded permutation importance for the reduced web model",
)
importance_figure.update_layout(margin=dict(l=20, r=20, t=60, b=20))


layout = html.Div(
    [
        html.H2("Model insights"),
        dcc.Markdown(
            """
The notebook compared several approaches against a simple mean-prediction
baseline. The values below are **recorded outputs from the original notebook
run** and were not independently rerun during this repository refresh.

Lower mean absolute error (MAE) is better.
            """
        ),
        dbc.Table.from_dataframe(
            model_scores,
            striped=True,
            bordered=True,
            hover=True,
            responsive=True,
        ),
        dcc.Markdown(
            """
Among the recorded three-fold cross-validation results, Ridge regression had
the lowest MAE (~8.29). A reduced-feature **Random Forest Regressor** was then
saved as `model.joblib` for the web-app prediction flow.
            """
        ),
        dcc.Graph(figure=importance_figure),
        dbc.Alert(
            "Permutation-importance values are model-specific and are not normalized percentages. They describe this dataset and model, not universal causes of sleep quality.",
            color="light",
        ),
    ]
)
