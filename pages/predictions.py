from pathlib import Path

import dash_bootstrap_components as dbc
import dash_core_components as dcc
import dash_html_components as html
import numpy as np
import pandas as pd
from dash.dependencies import Input, Output, State
from joblib import load

from app import app


MODEL_PATH = Path(__file__).resolve().parents[1] / "notebooks" / "model.joblib"

try:
    model = load(MODEL_PATH)
    model_error = None
except Exception as exc:
    model = None
    model_error = str(exc)


def form_group(label, component, help_text=None):
    children = [html.Label(label), component]
    if help_text:
        children.append(html.Small(help_text, className="form-text text-muted"))
    return html.Div(children, className="mb-3")


layout = html.Div(
    [
        html.H2("Sleep quality prediction"),
        dcc.Markdown(
            """
Enter the five signals used by the saved web model. **Time in bed is required**;
heart rate and steps may be left blank because the training pipeline includes
missing-value imputation.
            """
        ),
        dbc.Row(
            [
                dbc.Col(
                    [
                        form_group(
                            "Time in bed (hours)",
                            dcc.Input(
                                id="time-in-bed",
                                type="number",
                                min=0.5,
                                max=16,
                                step=0.25,
                                value=8,
                                className="form-control",
                            ),
                        ),
                        form_group(
                            "Heart rate (bpm)",
                            dcc.Input(
                                id="heart-rate",
                                type="number",
                                min=30,
                                max=220,
                                step=1,
                                placeholder="Optional",
                                className="form-control",
                            ),
                            "Leave blank if unavailable.",
                        ),
                        form_group(
                            "Activity (steps)",
                            dcc.Input(
                                id="activity-steps",
                                type="number",
                                min=0,
                                step=1,
                                placeholder="Optional",
                                className="form-control",
                            ),
                            "Leave blank if unavailable.",
                        ),
                    ],
                    md=6,
                ),
                dbc.Col(
                    [
                        form_group(
                            "Drank coffee",
                            dcc.Dropdown(
                                id="drank-coffee",
                                options=[
                                    {"label": "No", "value": 0},
                                    {"label": "Yes", "value": 1},
                                ],
                                value=0,
                                clearable=False,
                            ),
                        ),
                        form_group(
                            "Worked out",
                            dcc.Dropdown(
                                id="worked-out",
                                options=[
                                    {"label": "No", "value": 0},
                                    {"label": "Yes", "value": 1},
                                ],
                                value=0,
                                clearable=False,
                            ),
                        ),
                        dbc.Button(
                            "Predict sleep quality",
                            id="predict-button",
                            color="primary",
                            className="mt-3",
                        ),
                    ],
                    md=6,
                ),
            ]
        ),
        html.Div(id="prediction-output", className="mt-4"),
        dbc.Alert(
            "The estimate reflects patterns in the historical training data. It is not a diagnosis, treatment recommendation, or medical advice.",
            color="light",
            className="mt-4",
        ),
    ]
)


@app.callback(
    Output("prediction-output", "children"),
    [Input("predict-button", "n_clicks")],
    [
        State("time-in-bed", "value"),
        State("heart-rate", "value"),
        State("activity-steps", "value"),
        State("drank-coffee", "value"),
        State("worked-out", "value"),
    ],
)
def predict_sleep_quality(n_clicks, time_in_bed, heart_rate, activity_steps, drank_coffee, worked_out):
    if not n_clicks:
        return dbc.Alert("Enter your values and select Predict.", color="secondary")

    if model is None:
        return dbc.Alert(
            "The saved model could not be loaded in this environment. See the repository README for legacy dependency notes.",
            color="warning",
        )

    if time_in_bed is None or time_in_bed <= 0:
        return dbc.Alert("Please enter a valid amount of time in bed.", color="danger")

    input_frame = pd.DataFrame(
        [
            {
                "Heart rate": np.nan if heart_rate is None else heart_rate,
                "Drank coffee": drank_coffee,
                "Worked out": worked_out,
                "Activity (steps)": np.nan if activity_steps is None else activity_steps,
                "Time_in_Bed_in_Seconds": float(time_in_bed) * 3600,
            }
        ]
    )

    try:
        prediction = float(model.predict(input_frame)[0])
    except Exception:
        return dbc.Alert(
            "Prediction failed because the saved 2021 model is not compatible with the current runtime.",
            color="warning",
        )

    return dbc.Card(
        dbc.CardBody(
            [
                html.P("Estimated sleep quality", className="text-muted mb-1"),
                html.H2(f"{prediction:.1f}%"),
                html.P(
                    "Treat this as an exploratory model output, not a health assessment.",
                    className="mb-0",
                ),
            ]
        ),
        className="shadow-sm",
    )
