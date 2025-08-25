use yew::prelude::*;
use web_sys::HtmlInputElement;

pub struct TextFieldInputEvent {
    pub new_value: String,
}

pub struct TextField {
    id: String,
    input_element: NodeRef,
    parent_on_input_callback: Option<Callback<TextFieldInputEvent>>,
}

#[derive(PartialEq, Clone, Copy)]
pub enum TextFieldType {
    Text,
    Email,
    Password,
}

impl ToString for TextFieldType {
    fn to_string(&self) -> String {
        match self {
            Self::Text => "text".to_string(),
            Self::Email => "email".to_string(),
            Self::Password => "password".to_string()
        }
    }
}

impl Default for TextFieldType {
    fn default() -> Self {
        Self::Text
    }
}

#[derive(Properties, PartialEq)]
pub struct TextFieldProperties {
    #[prop_or_default]
    pub field_type: TextFieldType,
    pub children: Html,
    #[prop_or_default]
    pub oninput: Option<Callback<TextFieldInputEvent>>
}

impl Component for TextField {
    type Message = ();
    type Properties = TextFieldProperties;

    fn create(ctx: &Context<Self>) -> Self {
        Self {
            id: format!("input-{}", (js_sys::Math::random() * 100_000_000.0) as i32),
            input_element: NodeRef::default(),
            parent_on_input_callback: ctx.props().oninput.clone(),
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let oninput = {
            let input_element_ref = self.input_element.clone();
            let parent_on_input_callback = self.parent_on_input_callback.clone();

            Callback::from(move |_: InputEvent| {
                match &parent_on_input_callback {
                    Some(callback) => callback.emit(TextFieldInputEvent {
                        new_value: input_element_ref.cast::<HtmlInputElement>().expect("HTML Input Element").value()
                    }),
                    None => {}
                }
            })
        };
        
        html! {
            <div class="w-full max-w-3xl">
                <div class="flex flex-col gap-2">
                    <label for={self.id.clone()}>{ctx.props().children.clone()}</label>
                    <input type={ctx.props().field_type.to_string()} ref={self.input_element.clone()} oninput={oninput} class="border-3 border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-700/75" id={self.id.clone()} />
                </div>
            </div>
        }
    }
}
