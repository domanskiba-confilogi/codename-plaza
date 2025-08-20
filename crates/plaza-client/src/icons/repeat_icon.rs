use yew::prelude::*;

#[derive(Properties, PartialEq)]
pub struct RepeatIconProps {
    pub classes: String,
}

pub struct RepeatIcon;

impl Component for RepeatIcon {
    type Message = ();
    type Properties = RepeatIconProps;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <svg class={ctx.props().classes.clone()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        }
    }
}
