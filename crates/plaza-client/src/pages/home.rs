use yew::prelude::*;
use yew_router::prelude::*;
use crate::app::Route;

pub struct Home;

impl Component for Home {
    type Message = ();
    type Properties = ();

    fn create(ctx: &Context<Self>) -> Self {
        ctx.link().navigator().unwrap().push(&Route::Login);

        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {
            <div></div>
        }
    }
}
