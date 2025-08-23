use std::rc::Rc;
use yew::prelude::*;
use std::fmt::Debug;
use web_sys::HtmlInputElement;
use crate::icons::XIcon;
use implicit_clone::sync::IArray;
use implicit_clone::ImplicitClone;

#[derive(Debug, PartialEq, Clone)]
pub struct SelectFieldItem {
    pub value: i32,
    pub display_text: String,
}

pub struct SelectField {
    id: String,
    search: String,
    all_items: Rc<Vec<SelectFieldItem>>,
    chosen_items: Vec<i32>,
    show_search_items: bool,
    search_input_ref: NodeRef,
}

#[derive(Properties, PartialEq)]
pub struct SelectFieldProperties {
    pub items: Rc<Vec<SelectFieldItem>>,
    pub children: Html
}

pub enum SelectFieldMessage {
    ShowSearchItemsAfterTimeout,
    SearchTextFieldChanged(String),
    ChoseItem(i32),
}

impl Component for SelectField {
    type Properties = SelectFieldProperties;
    type Message = SelectFieldMessage;

    fn create(ctx: &Context<Self>) -> Self {
        Self {
            id: format!("select-field-{}", (js_sys::Math::random() * 100_000_000_000_000.0) as i32),
            all_items: ctx.props().items.clone(),
            search: String::new(),
            chosen_items: Vec::new(),
            show_search_items: true,
            search_input_ref: NodeRef::default(),
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::ChoseItem(item_id) => {
                self.chosen_items.push(item_id);
                self.show_search_items = false;

                let scope = ctx.link().clone();

                wasm_bindgen_futures::spawn_local(async move {
                    sleep(50).await;

                    scope.send_message(Self::Message::ShowSearchItemsAfterTimeout);
                });

                true
            },
            Self::Message::ShowSearchItemsAfterTimeout => {
                self.show_search_items = true;
                self.search_input_ref.cast::<HtmlInputElement>().expect("HTML Input Element").focus();
                true
            }
            Self::Message::SearchTextFieldChanged(search) => {
                self.search = search;
                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let scope = ctx.link();

        let update_search_text_field = {
            let scope = scope.clone();
            Callback::from(move |event: InputEvent| {
                let target = event.target_unchecked_into::<HtmlInputElement>();
                scope.send_message(Self::Message::SearchTextFieldChanged(target.value()))
            })
        };

        let select_item_callback = |value: i32| {
            let scope = scope.clone();
            Callback::from(move |_: MouseEvent| {
                log::info!("Chosen item with value: {}", value);
                scope.send_message(Self::Message::ChoseItem(value));
            })
        };

        html! {
            <div class="flex flex-col gap-2 relative group">
                <label for={self.id.clone()}>{ctx.props().children.clone()}</label>

                <div class="flex flex-row gap-4 w-full flex-wrap">
                    {
                        for self.chosen_items.iter()
                            .map(|chosen_item_value| (*self.all_items).iter().find(|item| item.value == *chosen_item_value).cloned().unwrap())
                            .map(|chosen_item| html! { 
                                <div class="px-4 py-2 rounded-xl bg-neutral-900 flex flex-row gap-1 justify-center items-center group/item cursor-pointer" >
                                    {chosen_item.display_text} <XIcon classes="w-4 aspect-square text-neutral-300 group-hover/item:text-yellow-400" />
                                </div>
                            })
                    }
                </div>

                <input ref={self.search_input_ref.clone()} class="peer border-3 border-neutral-800 rounded-xl px-4 py-3 focus:outline-none group-focus:border-yellow-700/75 appearance-none" id={self.id.clone()} oninput={update_search_text_field} />
                { 
                    if self.show_search_items {
                        html! {
                            <div class="hover:flex focus-within:flex group-focus-within:flex peer-focus:flex flex-col hidden w-full absolute top-[110%] left-0 max-h-[150px] overflow-auto rounded-xl">
                                {
                                    for self.all_items.iter()
                                        .filter(|item| !self.chosen_items.contains(&item.value))
                                        .filter(|item| item.display_text.to_lowercase().trim().contains(self.search.to_lowercase().trim()))
                                        .map(|item| html! {
                                            <button type="button" class="text-start w-full px-4 py-2 bg-neutral-900 focus:bg-neutral-800 hover:bg-neutral-800 cursor-pointer" onclick={select_item_callback(item.value)}>
                                                {item.display_text.clone()}
                                            </button>
                                        })
                                }
                            </div>
                        }
                    } else {
                        html! {}
                    }
                }
            </div>
        }
    }
}

 pub async fn sleep(delay_ms: i32) {
    let mut cb = |resolve: js_sys::Function, reject: js_sys::Function| {
        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, delay_ms);};

    let p = js_sys::Promise::new(&mut cb);

    wasm_bindgen_futures::JsFuture::from(p).await.unwrap();
}
