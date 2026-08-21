from dash import Dash, Input, Output, State, dcc, html, no_update
import pandas as pd
import plotly.express as px

from model import predict_sleep_quality, train_model

app = Dash(__name__, title="Sleep Predictor")
server = app.server

artifact = train_model()
comparison_df = pd.DataFrame(
    [
        {
            "Model": name,
            "Cross-validation MAE": values["cv_mae"],
        }
        for name, values in artifact["comparison"].items()
    ]
).sort_values("Cross-validation MAE")

comparison_fig = px.bar(
    comparison_df,
    x="Model",
    y="Cross-validation MAE",
    title="Modern model comparison",
)
comparison_fig.update_layout(showlegend=False)

importance_fig = px.bar(
    artifact["feature_importance"].sort_values("Importance"),
    x="Importance",
    y="Feature",
    orientation="h",
    title="Permutation importance on the held-out test set",
)
importance_fig.update_layout(showlegend=False)

app.layout = html.Div(
    className="shell",
    children=[
        html.Header(
            className="hero",
            children=[
                html.P("SLEEP · MACHINE LEARNING · HUMAN DATA", className="eyebrow"),
                html.H1("Sleep Predictor"),
                html.P(
                    "A reproducible machine-learning experiment that estimates sleep quality "
                    "from a small set of behavioral and physiological signals.",
                    className="lede",
                ),
                html.Div(
                    className="metric-grid",
                    children=[
                        html.Div(
                            className="metric-card",
                            children=[
                                html.Span("Best model", className="metric-label"),
                                html.Strong(artifact["best_model"], className="metric-value"),
                            ],
                        ),
                        html.Div(
                            className="metric-card",
                            children=[
                                html.Span("Test MAE", className="metric-label"),
                                html.Strong(f'{artifact["test_mae"]:.2f}', className="metric-value"),
                            ],
                        ),
                        html.Div(
                            className="metric-card",
                            children=[
                                html.Span("Usable records", className="metric-label"),
                                html.Strong(str(artifact["rows"]), className="metric-value"),
                            ],
                        ),
                    ],
                ),
            ],
        ),
        html.Main(
            children=[
                html.Section(
                    className="panel",
                    children=[
                        html.Div(
                            className="section-heading",
                            children=[
                                html.P("TRY THE MODEL", className="eyebrow"),
                                html.H2("Estimate sleep quality"),
                                html.P(
                                    "Enter a few signals. The model returns an exploratory estimate from 0 to 100."
                                ),
                            ],
                        ),
                        html.Div(
                            className="form-grid",
                            children=[
                                html.Label(
                                    [
                                        html.Span("Heart rate (bpm)"),
                                        dcc.Input(
                                            id="heart-rate",
                                            type="number",
                                            min=30,
                                            max=220,
                                            step=1,
                                            value=60,
                                        ),
                                    ]
                                ),
                                html.Label(
                                    [
                                        html.Span("Activity steps"),
                                        dcc.Input(
                                            id="activity-steps",
                                            type="number",
                                            min=0,
                                            step=100,
                                            value=7000,
                                        ),
                                    ]
                                ),
                                html.Label(
                                    [
                                        html.Span("Time in bed (hours)"),
                                        dcc.Input(
                                            id="time-in-bed",
                                            type="number",
                                            min=0.5,
                                            max=16,
                                            step=0.25,
                                            value=8,
                                        ),
                                    ]
                                ),
                                html.Div(
                                    className="check-group",
                                    children=[
                                        dcc.Checklist(
                                            id="coffee",
                                            options=[{"label": "Drank coffee", "value": "yes"}],
                                            value=[],
                                        ),
                                        dcc.Checklist(
                                            id="workout",
                                            options=[{"label": "Worked out", "value": "yes"}],
                                            value=["yes"],
                                        ),
                                    ],
                                ),
                            ],
                        ),
                        html.Button("Predict sleep quality", id="predict-button", n_clicks=0),
                        html.Div(id="prediction-output", className="prediction-output"),
                    ],
                ),
                html.Section(
                    className="panel",
                    children=[
                        html.Div(
                            className="section-heading",
                            children=[
                                html.P("MODEL EVIDENCE", className="eyebrow"),
                                html.H2("What the current rebuild is doing"),
                                html.P(
                                    "The app cleans the original dataset, derives five practical inputs, "
                                    "compares modern Ridge and Random Forest pipelines with 5-fold cross-validation, "
                                    "selects the lower-MAE model, and evaluates it on a held-out test set."
                                ),
                            ],
                        ),
                        html.Div(
                            className="chart-grid",
                            children=[
                                dcc.Graph(figure=comparison_fig),
                                dcc.Graph(figure=importance_fig),
                            ],
                        ),
                    ],
                ),
                html.Section(
                    className="panel prose",
                    children=[
                        html.P("WHY THIS MATTERS", className="eyebrow"),
                        html.H2("From a 2021 notebook to a reproducible system"),
                        dcc.Markdown(
                            f"""
The original project contained real modeling work, but the web layer depended on a
serialized 2021 model and an aging application stack.

**Version 2 changes the architecture:**

- the model is rebuilt from the included dataset when the application starts;
- preprocessing and prediction live in one reproducible pipeline;
- model selection uses cross-validation rather than a hard-coded artifact;
- current evaluation is separated from the original notebook's historical results;
- feature importance is calculated against a held-out test set;
- the interface uses the current Dash component API.

The current run selected **{artifact["best_model"]}** and produced a held-out test
MAE of **{artifact["test_mae"]:.2f}** sleep-quality points.

This remains an exploratory portfolio project. It is **not a medical device**, and
its predictions should not be used for diagnosis or treatment decisions.
                            """
                        ),
                    ],
                ),
            ]
        ),
    ],
)


@app.callback(
    Output("prediction-output", "children"),
    Input("predict-button", "n_clicks"),
    State("heart-rate", "value"),
    State("activity-steps", "value"),
    State("time-in-bed", "value"),
    State("coffee", "value"),
    State("workout", "value"),
    prevent_initial_call=True,
)
def update_prediction(n_clicks, heart_rate, activity_steps, time_in_bed, coffee, workout):
    if not n_clicks:
        return no_update

    if heart_rate is None or activity_steps is None or time_in_bed is None:
        return html.Div("Please complete all numeric fields.", className="error")

    prediction = predict_sleep_quality(
        heart_rate=heart_rate,
        drank_coffee="yes" in (coffee or []),
        worked_out="yes" in (workout or []),
        activity_steps=activity_steps,
        time_in_bed_hours=time_in_bed,
    )

    return html.Div(
        [
            html.Span("Estimated sleep quality", className="result-label"),
            html.Strong(f"{prediction:.1f}%", className="result-value"),
            html.P(
                "An exploratory model estimate based on patterns in the included historical dataset."
            ),
        ],
        className="result-card",
    )


if __name__ == "__main__":
    app.run(debug=True)
