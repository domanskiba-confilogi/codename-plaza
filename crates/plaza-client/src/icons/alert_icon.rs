use yew::prelude::*;

pub struct AlertIcon;

#[derive(Properties, PartialEq)]
pub struct AlertIconProperties {
    pub classes: String
}

impl Component for AlertIcon {
    type Message = ();
    type Properties = AlertIconProperties;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <svg class={ctx.props().classes.clone()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        }
    }
}
