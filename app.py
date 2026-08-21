import dash
import dash_bootstrap_components as dbc

external_stylesheets = [
    dbc.themes.BOOTSTRAP,
    "https://use.fontawesome.com/releases/v5.9.0/css/all.css",
]

meta_tags = [
    {"name": "viewport", "content": "width=device-width, initial-scale=1"}
]

app = dash.Dash(
    __name__,
    external_stylesheets=external_stylesheets,
    meta_tags=meta_tags,
)
app.config.suppress_callback_exceptions = True
app.title = "Sleep Predictor"
server = app.server
