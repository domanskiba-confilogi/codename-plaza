use yew::prelude::*;

pub struct MyTickets;

impl Component for MyTickets {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {
            <div class="flex-grow w-full flex justify-center items-center">
                {"My tickets"}
            </div>
        }
    }
}
