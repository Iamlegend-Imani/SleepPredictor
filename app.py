from __future__ import annotations

import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, Input, Output, State, dcc, html
import dash_bootstrap_components as dbc

from modeling import LABELS, build_model, make_input, predict_score, scenario_deltas

bundle = build_model()

app = Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}],
    title="Sleep Intelligence",
)
server = app.server


def score_label(score: float) -> str:
    if score >= 85:
        return "Strong sleep signal"
    if score >= 70:
        return "Solid, with room to optimize"
    if score >= 55:
        return "Mixed sleep signal"
    return "Low sleep signal"


def make_gauge(score: float):
    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=score,
            number={"suffix": "%", "font": {"size": 48}},
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 0},
                "bar": {"color": "#d8e8ff", "thickness": 0.22},
                "bgcolor": "rgba(255,255,255,0.06)",
                "borderwidth": 0,
                "steps": [
                    {"range": [0, 55], "color": "rgba(255,255,255,0.04)"},
                    {"range": [55, 70], "color": "rgba(255,255,255,0.07)"},
                    {"range": [70, 85], "color": "rgba(255,255,255,0.10)"},
                    {"range": [85, 100], "color": "rgba(255,255,255,0.14)"},
                ],
            },
        )
    )
    fig.update_layout(
        height=260,
        margin=dict(l=20, r=20, t=30, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        font={"color": "#f5f7ff"},
    )
    return fig


def importance_figure():
    ordered = sorted(bundle.feature_importance.items(), key=lambda item: item[1])
    labels = [LABELS.get(k, k) for k, _ in ordered]
    scores = [v for _, v in ordered]
    fig = go.Figure(go.Bar(x=scores, y=labels, orientation="h"))
    fig.update_layout(
        height=360,
        margin=dict(l=10, r=10, t=10, b=10),
        xaxis_title="Permutation importance",
        yaxis_title=None,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#dbe3f5"},
    )
    return fig


def history_figure():
    frame = bundle.data.copy()
    fig = px.scatter(
        frame,
        x="time_in_bed_minutes",
        y="sleep_quality",
        hover_data=["wake_state", "heart_rate", "steps"],
        opacity=0.55,
    )
    fig.update_traces(marker={"size": 7})
    fig.update_layout(
        height=360,
        margin=dict(l=10, r=10, t=10, b=10),
        xaxis_title="Time in bed (minutes)",
        yaxis_title="Sleep quality (%)",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#dbe3f5"},
    )
    return fig


app.layout = html.Div(
    className="app-shell",
    children=[
        html.Div(className="aurora aurora-one"),
        html.Div(className="aurora aurora-two"),
        dbc.Container(
            fluid="xl",
            children=[
                html.Nav(
                    className="topbar",
                    children=[
                        html.Div(
                            [
                                html.Div("SLEEP", className="wordmark-kicker"),
                                html.Div("INTELLIGENCE", className="wordmark"),
                            ]
                        ),
                        html.Div(
                            [
                                html.A("Predict", href="#predict"),
                                html.A("Patterns", href="#patterns"),
                                html.A("Research", href="#research"),
                            ],
                            className="nav-links",
                        ),
                    ],
                ),
                html.Section(
                    className="hero",
                    children=[
                        html.Div(
                            [
                                html.Div("A revived machine-learning experiment", className="eyebrow"),
                                html.H1(["Your sleep is a ", html.Span("system"), ", not a score."]),
                                html.P(
                                    "Explore how duration, activity, stress and daily habits relate to sleep quality — using the original SleepPredictor dataset as the foundation."
                                ),
                                html.A("Explore tonight's signal", href="#predict", className="primary-cta"),
                            ],
                            className="hero-copy",
                        ),
                        html.Div(
                            className="hero-orbit",
                            children=[
                                html.Div("887", className="orbit-number"),
                                html.Div("historical nights", className="orbit-label"),
                                html.Div(className="orbit-ring ring-one"),
                                html.Div(className="orbit-ring ring-two"),
                            ],
                        ),
                    ],
                ),
                html.Section(
                    id="predict",
                    className="section-block",
                    children=[
                        html.Div(
                            [
                                html.Div("01 / PREDICT", className="section-kicker"),
                                html.H2("Build a sleep scenario"),
                                html.P(
                                    "Change the inputs. The model estimates sleep quality from patterns in the historical dataset."
                                ),
                            ],
                            className="section-heading",
                        ),
                        dbc.Row(
                            className="g-4",
                            children=[
                                dbc.Col(
                                    md=5,
                                    children=html.Div(
                                        className="glass-card input-card",
                                        children=[
                                            html.Label("Time in bed", className="field-label"),
                                            html.Div(id="hours-display", className="field-value"),
                                            dcc.Slider(
                                                id="hours",
                                                min=3,
                                                max=12,
                                                step=0.25,
                                                value=8,
                                                marks={3: "3h", 6: "6h", 9: "9h", 12: "12h"},
                                            ),
                                            html.Label("How did you wake up?", className="field-label spacing-top"),
                                            dcc.Dropdown(
                                                id="wake-state",
                                                options=[
                                                    {"label": "Good", "value": "good"},
                                                    {"label": "Neutral", "value": "neutral"},
                                                    {"label": "Low", "value": "low"},
                                                    {"label": "Not recorded", "value": "not recorded"},
                                                ],
                                                value="good",
                                                clearable=False,
                                                className="dark-dropdown",
                                            ),
                                            dbc.Row(
                                                className="g-3 spacing-top",
                                                children=[
                                                    dbc.Col(
                                                        [
                                                            html.Label("Heart rate", className="field-label"),
                                                            dbc.Input(id="heart-rate", type="number", min=35, max=140, value=60),
                                                        ],
                                                        xs=6,
                                                    ),
                                                    dbc.Col(
                                                        [
                                                            html.Label("Daily steps", className="field-label"),
                                                            dbc.Input(id="steps", type="number", min=0, max=50000, value=7000),
                                                        ],
                                                        xs=6,
                                                    ),
                                                ],
                                            ),
                                            html.Label("What was part of the day?", className="field-label spacing-top"),
                                            dbc.Checklist(
                                                id="habits",
                                                className="habit-grid",
                                                options=[
                                                    {"label": "Coffee", "value": "coffee"},
                                                    {"label": "Tea", "value": "tea"},
                                                    {"label": "Worked out", "value": "worked_out"},
                                                    {"label": "Stressful day", "value": "stressful_day"},
                                                    {"label": "Ate late", "value": "ate_late"},
                                                ],
                                                value=["coffee", "worked_out"],
                                                switch=True,
                                            ),
                                            dbc.Button("Estimate sleep signal", id="predict-button", n_clicks=0, className="predict-button"),
                                        ],
                                    ),
                                ),
                                dbc.Col(
                                    md=7,
                                    children=html.Div(
                                        className="glass-card result-card",
                                        children=[
                                            html.Div("MODEL ESTIMATE", className="mini-label"),
                                            dcc.Graph(id="score-gauge", figure=make_gauge(80), config={"displayModeBar": False}),
                                            html.H3(id="score-label", children="Solid, with room to optimize"),
                                            html.P(id="model-context", className="muted-copy"),
                                            html.Hr(className="soft-rule"),
                                            html.Div("SCENARIO SENSITIVITY", className="mini-label"),
                                            html.Div(id="scenario-deltas", className="delta-grid"),
                                            html.P(
                                                "These deltas show how this model's estimate changes when one input is toggled. They do not prove that the behavior causes better or worse sleep.",
                                                className="microcopy",
                                            ),
                                        ],
                                    ),
                                ),
                            ],
                        ),
                    ],
                ),
                html.Section(
                    id="patterns",
                    className="section-block",
                    children=[
                        html.Div(
                            [
                                html.Div("02 / PATTERNS", className="section-kicker"),
                                html.H2("The dataset has a memory"),
                                html.P("See which recorded variables helped the model most, and how sleep duration related to quality across the dataset."),
                            ],
                            className="section-heading",
                        ),
                        dbc.Row(
                            className="g-4",
                            children=[
                                dbc.Col(
                                    md=6,
                                    children=html.Div(
                                        className="glass-card chart-card",
                                        children=[
                                            html.Div("MODEL IMPORTANCE", className="mini-label"),
                                            dcc.Graph(figure=importance_figure(), config={"displayModeBar": False}),
                                        ],
                                    ),
                                ),
                                dbc.Col(
                                    md=6,
                                    children=html.Div(
                                        className="glass-card chart-card",
                                        children=[
                                            html.Div("HISTORICAL NIGHTS", className="mini-label"),
                                            dcc.Graph(figure=history_figure(), config={"displayModeBar": False}),
                                        ],
                                    ),
                                ),
                            ],
                        ),
                    ],
                ),
                html.Section(
                    id="research",
                    className="section-block research-grid",
                    children=[
                        html.Div(
                            [
                                html.Div("03 / RESEARCH", className="section-kicker"),
                                html.H2("A student project, upgraded without erasing its history."),
                                html.P(
                                    "The original 2021 notebook explored sleep-quality prediction with linear, ridge, random-forest and XGBoost approaches. This version keeps the historical dataset and rebuilds the product layer with a current scikit-learn pipeline and a transparent interface."
                                ),
                            ],
                            className="research-copy",
                        ),
                        html.Div(
                            className="metric-stack",
                            children=[
                                html.Div([html.Strong(f"{len(bundle.data):,}"), html.Span("nights in dataset")], className="metric-pill"),
                                html.Div([html.Strong(f"{bundle.date_start} → {bundle.date_end}"), html.Span("historical range")], className="metric-pill"),
                                html.Div([html.Strong(f"±{bundle.test_mae:.1f}"), html.Span("current holdout MAE")], className="metric-pill"),
                                html.Div([html.Strong(f"±{bundle.baseline_mae:.1f}"), html.Span("mean baseline MAE")], className="metric-pill"),
                            ],
                        ),
                    ],
                ),
                html.Footer(
                    [
                        html.Div("Sleep Intelligence · Revived from SleepPredictor"),
                        html.P("Exploratory software only. Not a medical device, diagnosis, or treatment recommendation."),
                    ]
                ),
            ],
        ),
    ],
)


@app.callback(Output("hours-display", "children"), Input("hours", "value"))
def update_hours_display(hours):
    return f"{float(hours):.2f} hours"


@app.callback(
    Output("score-gauge", "figure"),
    Output("score-label", "children"),
    Output("model-context", "children"),
    Output("scenario-deltas", "children"),
    Input("predict-button", "n_clicks"),
    State("hours", "value"),
    State("wake-state", "value"),
    State("heart-rate", "value"),
    State("steps", "value"),
    State("habits", "value"),
)
def update_prediction(_, hours, wake_state, heart_rate, steps, habits):
    row = make_input(hours or 8, wake_state or "not recorded", heart_rate, steps, habits or [])
    score = predict_score(bundle, row)
    deltas = scenario_deltas(bundle, row)

    ordered = sorted(deltas.items(), key=lambda item: abs(item[1]), reverse=True)
    cards = []
    for feature, delta in ordered:
        sign = "+" if delta >= 0 else ""
        cards.append(
            html.Div(
                [
                    html.Span(LABELS.get(feature, feature), className="delta-name"),
                    html.Strong(f"{sign}{delta:.1f}", className="delta-value"),
                ],
                className="delta-card",
            )
        )

    context = (
        f"On the current 20% holdout split, this rebuilt model's mean absolute error is about "
        f"{bundle.test_mae:.1f} points. Treat the estimate as a directional signal, not a promise."
    )
    return make_gauge(score), score_label(score), context, cards


if __name__ == "__main__":
    app.run(debug=True)
