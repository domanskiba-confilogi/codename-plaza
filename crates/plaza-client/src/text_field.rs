use yew::prelude::*;

pub struct TextField {
    id: String
}

#[derive(Properties, PartialEq)]
pub struct TextFieldProperties {
    pub children: Html
}

impl Component for TextField {
    type Message = ();
    type Properties = TextFieldProperties;

    fn create(ctx: &Context<Self>) -> Self {
        Self {
            id: format!("input-{}", (js_sys::Math::random() * 100_000_000_000_000.0) as i32)
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <div class="w-full max-w-3xl">
                <div class="flex flex-col gap-2">
                    <label for={self.id.clone()}>{ctx.props().children.clone()}</label>
                    <input type="text" class="border-3 border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-700/75" id={self.id.clone()} />
                </div>
            </div>
        }
    }
}
