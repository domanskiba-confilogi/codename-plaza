use yew::prelude::*;
use yew_router::prelude::*;
use crate::app::{Route, AppState};

pub enum Msg {
    NewRoute,
    RedirectTo(Route)
}

pub struct RouteGuard {
    _listener: LocationHandle,
}

impl Component for RouteGuard {
    type Message = Msg;
    type Properties = ();

    fn create(ctx: &Context<Self>) -> Self {
        let link = ctx.link().clone();
        let listener = ctx
            .link()
            .add_location_listener(link.callback(move |_| Self::Message::NewRoute))
            .unwrap();
        
        ctx.link().send_message(Msg::NewRoute);

        Self { _listener: listener }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::NewRoute => {
                let link = ctx.link().clone();
                let state = ctx.link().context::<AppState>(Callback::noop()).expect("a valid state").0;
                let authorization_state = state.authorization_state.clone();
                let route = ctx.link().route::<Route>().expect("expected a route");

                wasm_bindgen_futures::spawn_local(async move {
                    let is_logged_in = authorization_state.is_logged_in().await;

                    let is_allowed_in = match route {
                        Route::Home => true,
                        Route::Login => !is_logged_in,
                        Route::ReportProblem => is_logged_in,
                        Route::ReportOnboarding => is_logged_in,
                        Route::MyTickets => is_logged_in,
                        Route::NotFound => true
                    };

                    if !is_allowed_in {
                        link.send_message(Msg::RedirectTo(Route::Home));
                    }
                });
            }
            Self::Message::RedirectTo(to) => ctx.link().navigator().expect("expected a navigator context").push(&to),
        }

        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html!{}
    }
}
