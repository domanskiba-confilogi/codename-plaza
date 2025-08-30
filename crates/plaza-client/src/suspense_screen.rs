use yew::prelude::*;
use crate::icons::ConfilogiIcon;

pub struct SuspenseScreen;

#[derive(Properties, PartialEq)]
pub struct SuspenseScreenProperties {
    pub message: String,
    #[prop_or_default]
    pub hint: Option<String>
}

impl Component for SuspenseScreen {
    type Message = ();
    type Properties = SuspenseScreenProperties;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <div class="w-full min-h-screen flex flex-col gap-4 justify-center items-center">
                <ConfilogiIcon classes="w-28 z-10" />
                <p class="animate-pulse select-none z-10">{ctx.props().message.clone()}</p>
                { if let Some(hint) = ctx.props().hint.clone() {
                    html! {
                        <span class="text-sm text-neutral-600">{hint}</span>
                    }
                } else { html! {} } }
                
            </div>
        }
    }
}
