use yew::prelude::*;
use yew_router::prelude::*;
use crate::app::{AppState, Route};

pub enum LogoutMsg {
    Processed
}

pub struct Logout;

impl Component for Logout {
    type Message = LogoutMsg;
    type Properties = ();

    fn create(ctx: &Context<Self>) -> Self {
        let state = ctx.link().context::<AppState>(Callback::noop()).expect("a valid global state handle").0;

        let scope = ctx.link().clone();
        wasm_bindgen_futures::spawn_local(async move {
            state.authorization_state.remove_logged_in_user().await;

            scope.send_message(Self::Message::Processed);
        });

        Self
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::Processed => {
                let state = ctx.link().context::<AppState>(Callback::noop()).expect("a valid global state handle").0;

                match ctx.link().navigator() {
                    Some(navigator) => navigator.push(&Route::Home),
                    None => state.fatal_error_state.report("failed to obtain navigator handle inside logout page"),
                };
            }
        }

        false
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {}
    }
}

