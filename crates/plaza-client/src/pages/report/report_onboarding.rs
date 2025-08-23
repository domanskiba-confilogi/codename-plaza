use std::rc::Rc;
use yew::prelude::*;
use crate::text_field::*;
use crate::select_field::*;

pub struct ReportOnboarding {
    possible_job_titles: Rc<Vec<SelectFieldItem>>,
    possible_company_sectors: Rc<Vec<SelectFieldItem>>,
}

#[derive(Properties, PartialEq)]
pub struct ReportOnboardingProperties;

impl Component for ReportOnboarding {
    type Message = ();
    type Properties = ReportOnboardingProperties;

    fn create(ctx: &Context<Self>) -> Self {
        Self {
            possible_company_sectors: Rc::new(vec![
                SelectFieldItem { value: 1, display_text: "IT".to_string() },
                SelectFieldItem { value: 2, display_text: "Agent dzwoniący".to_string() },
                SelectFieldItem { value: 3, display_text: "Management agentów".to_string() },
                SelectFieldItem { value: 4, display_text: "Logistyka".to_string() },
                SelectFieldItem { value: 5, display_text: "Magazyn".to_string() },
                SelectFieldItem { value: 6, display_text: "Rekrutacja".to_string() },
                SelectFieldItem { value: 7, display_text: "Księgowość".to_string() },
                SelectFieldItem { value: 8, display_text: "Legal".to_string() },
                SelectFieldItem { value: 9, display_text: "Kadry".to_string() },
                SelectFieldItem { value: 10, display_text: "Marketing".to_string() },
                SelectFieldItem { value: 11, display_text: "Analityka".to_string() },
                SelectFieldItem { value: 12, display_text: "Manager".to_string() },
                SelectFieldItem { value: 13, display_text: "Sprzedaż".to_string() },
                SelectFieldItem { value: 14, display_text: "Odsłuchy".to_string() },
                SelectFieldItem { value: 15, display_text: "Controlling".to_string() },
            ]),
            possible_job_titles: Rc::new(vec![
            ]),
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <div class="w-full max-w-3xl p-4 flex flex-col gap-4">
                <div class="w-full flex flex-col sm:flex-row gap-4">
                    <TextField>{"Imię"}</TextField>
                    <TextField>{"Nazwisko"}</TextField>
                </div>

                <SelectField items={self.possible_company_sectors.clone()}>{"Dział firmy"}</SelectField>
            </div>
        }
    }
}
