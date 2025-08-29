use yew::prelude::*;
use yew_router::prelude::*;

pub enum Msg {
    NewRoute,
}

struct RouteGuard {
    _listener: LocationHandle,
}

impl Component for RouteGuard {
    type Message = Msg;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        let link = ctx.link().clone();
        let listener = ctx
            .link()
            .add_location_listener(link.callback(move |_| Self::Message::NewRoute))
            .unwrap();

        Self { _listener: listener }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html!{}
    }
}
