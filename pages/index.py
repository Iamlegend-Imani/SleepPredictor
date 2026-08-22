import dash_bootstrap_components as dbc
import dash_core_components as dcc
import dash_html_components as html


layout = html.Div(
    [
        dbc.Row(
            [
                dbc.Col(
                    [
                        html.P("MACHINE LEARNING · SLEEP · HUMAN DATA", className="text-muted"),
                        html.H1("What might tonight's sleep quality look like?"),
                        dcc.Markdown(
                            """
Sleep Predictor is an exploratory machine-learning project that estimates a
sleep-quality score from a small set of behavioral and physiological signals.

The model uses **time in bed, activity steps, workout status, coffee intake,
and heart rate** to generate an estimated sleep-quality percentage.
                            """
                        ),
                        dcc.Link(
                            dbc.Button("Try the predictor", color="primary", className="mr-2"),
                            href="/predictions",
                        ),
                        dcc.Link(
                            dbc.Button("See the model insights", color="secondary", outline=True),
                            href="/insights",
                        ),
                    ],
                    md=7,
                ),
                dbc.Col(
                    dbc.Card(
                        dbc.CardBody(
                            [
                                html.H4("At a glance", className="card-title"),
                                html.P("5 model inputs"),
                                html.P("887 sleep observations in the included dataset"),
                                html.P("Random-forest model saved for the web experience"),
                                html.P("Built as a 2021 data-science portfolio project"),
                            ]
                        ),
                        className="shadow-sm",
                    ),
                    md=5,
                ),
            ],
            className="align-items-center",
        ),
        html.Hr(className="my-5"),
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(
                        dbc.CardBody(
                            [
                                html.H4("Predict"),
                                html.P(
                                    "Enter a few sleep-related signals and generate an exploratory sleep-quality estimate."
                                ),
                            ]
                        )
                    ),
                    md=4,
                ),
                dbc.Col(
                    dbc.Card(
                        dbc.CardBody(
                            [
                                html.H4("Understand"),
                                html.P(
                                    "Compare the recorded baseline and model results, then inspect feature importance."
                                ),
                            ]
                        )
                    ),
                    md=4,
                ),
                dbc.Col(
                    dbc.Card(
                        dbc.CardBody(
                            [
                                html.H4("Trace"),
                                html.P(
                                    "See how raw sleep records were cleaned, modeled, interpreted, and prepared for the app."
                                ),
                            ]
                        )
                    ),
                    md=4,
                ),
            ],
        ),
        dbc.Alert(
            "This is an exploratory portfolio model, not a medical device and not medical advice.",
            color="light",
            className="mt-4",
        ),
    ]
)
