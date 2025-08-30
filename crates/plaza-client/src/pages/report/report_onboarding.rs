use std::rc::Rc;
use yew::prelude::*;
use crate::text_field::*;
use crate::select_field::*;
use connector::{CompanyDepartmentDto, JobTitleDto};

pub struct ReportOnboarding {
    downloaded_job_titles: Option<Vec<JobTitleDto>>,
    downloaded_company_sectors: Option<Vec<CompanyDepartmentDto>>,

    possible_job_titles: Rc<Vec<SelectFieldItem>>,
    possible_company_sectors: Rc<Vec<SelectFieldItem>>,
}

#[derive(Properties, PartialEq)]
pub struct ReportOnboardingProperties;

impl Component for ReportOnboarding {
    type Message = ();
    type Properties = ReportOnboardingProperties;

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            downloaded_company_sectors: None,
            downloaded_job_titles: None,
            possible_company_sectors: Rc::new(vec![]),
            possible_job_titles: Rc::new(vec![]),
        }
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
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
