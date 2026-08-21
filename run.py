import dash_bootstrap_components as dbc
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output

from app import app, server
from pages import index, predictions, insights, process


navbar = dbc.NavbarSimple(
    brand="Sleep Predictor",
    brand_href="/",
    children=[
        dbc.NavItem(dcc.Link("Predict", href="/predictions", className="nav-link")),
        dbc.NavItem(dcc.Link("Insights", href="/insights", className="nav-link")),
        dbc.NavItem(dcc.Link("Process", href="/process", className="nav-link")),
    ],
    sticky="top",
    color="light",
    light=True,
)

footer = dbc.Container(
    [
        html.Hr(),
        dbc.Row(
            dbc.Col(
                html.Small(
                    [
                        "Sleep Predictor · ",
                        html.A(
                            "View source on GitHub",
                            href="https://github.com/Iamlegend-Imani/SleepPredictor",
                            target="_blank",
                        ),
                        " · Exploratory machine-learning project",
                    ]
                )
            )
        ),
    ],
    className="pb-4",
)

app.layout = html.Div(
    [
        dcc.Location(id="url", refresh=False),
        navbar,
        dbc.Container(id="page-content", className="mt-4"),
        footer,
    ]
)


@app.callback(Output("page-content", "children"), [Input("url", "pathname")])
def display_page(pathname):
    if pathname == "/":
        return index.layout
    if pathname == "/predictions":
        return predictions.layout
    if pathname == "/insights":
        return insights.layout
    if pathname == "/process":
        return process.layout
    return dcc.Markdown("## Page not found")


if __name__ == "__main__":
    app.run_server(debug=True)
