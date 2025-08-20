use yew::prelude::*;

#[derive(Properties, PartialEq)]
pub struct MenuIconProps {
    pub additional_classes: String,
}

pub struct MenuIcon;

impl Component for MenuIcon {
    type Message = ();
    type Properties = MenuIconProps;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
<svg class={ctx.props().additional_classes.clone()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        }
    }
}
