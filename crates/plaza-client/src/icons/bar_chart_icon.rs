use yew::prelude::*;

pub struct BarChartIcon;

#[derive(Properties, PartialEq)]
pub struct BarChartIconProperties {
    pub classes: String
}

impl Component for BarChartIcon {
    type Message = ();
    type Properties = BarChartIconProperties;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <svg class={ctx.props().classes.clone()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
        }
    }
}
