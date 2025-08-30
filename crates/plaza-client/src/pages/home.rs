use yew::prelude::*;
use yew_router::prelude::*;
use crate::app::{Route, AppState};

pub struct Home;

pub enum Msg {
    RedirectTo(Route),
}

impl Component for Home {
    type Message = Msg;
    type Properties = ();

    fn create(ctx: &Context<Self>) -> Self {
        let global_state = ctx.link().context::<AppState>(Callback::noop()).expect("a valid global state handle").0;

        let link = ctx.link().clone();
        wasm_bindgen_futures::spawn_local(async move {
            let is_logged_in = global_state.authorization_state.is_logged_in().await;

            if is_logged_in {
                link.send_message(Msg::RedirectTo(Route::ReportProblem));
            } else {
                link.send_message(Msg::RedirectTo(Route::Login));
            }
        });

        Self
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::RedirectTo(to) => {
                ctx.link().navigator().expect("expected a valid navigator handle").push(&to);
            }
        }

        false
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {
            <div></div>
        }
    }
}
