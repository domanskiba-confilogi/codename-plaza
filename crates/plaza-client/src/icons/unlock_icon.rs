use yew::prelude::*;

pub struct UnlockIcon;

#[derive(Properties, PartialEq)]
pub struct UnlockIconProperties {
    pub classes: String
}

impl Component for UnlockIcon {
    type Message = ();
    type Properties = UnlockIconProperties;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <svg class={ctx.props().classes.clone()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        }
    }
}
