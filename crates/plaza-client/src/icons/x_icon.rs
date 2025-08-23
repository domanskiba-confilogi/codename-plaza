use yew::prelude::*;

pub struct XIcon;

#[derive(Properties, PartialEq)]
pub struct XIconProperties {
    pub classes: String,
}

impl Component for XIcon {
    type Message = ();
    type Properties = XIconProperties;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <svg class={ctx.props().classes.clone()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        }
    }
}
