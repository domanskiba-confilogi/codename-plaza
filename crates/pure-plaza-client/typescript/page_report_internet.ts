import { createAuthStore } from "./auth_store.js";
import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountNavbar } from "./component_navbar.js";
import { LOGGED_IN_NAVBAR_ARGS, reportCriticalError } from "./helpers.js";
import { mountTextField } from "./component_text_field.js";
import { mountTextArea } from "./component_textarea_field.js";
import { mountButton } from "./component_button.js";
import { PersonData } from "./api.js";

const authStore = createAuthStore();

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		await checkIsLoggedInMiddleware(authStore);

		loadingScreen.destroy();

		Array.from(document.querySelectorAll('[data-loading="show"]')).forEach(element => {
			element.classList.remove("hidden");
		});

		mountNavbar('#navbar-root', {
			brandHref: '/',
			brandName: 'Confilogi',
			brandAccent: 'IT Support',
			...LOGGED_IN_NAVBAR_ARGS
		});

		const fields = {
			firstNameField: mountTextField('#first-name-field', {
				label: 'Name',
				type: 'text',
				placeholder: 'Enter name...',
				value: '',
				clearErrorOnInput: true,
			}),
			secondNameField: mountTextField('#second-name-field', {
				label: 'Second name (optional)',
				type: 'text',
				placeholder: 'Enter second name...',
				value: '',
				clearErrorOnInput: true,
			}),
			lastNameField: mountTextField('#last-name-field', {
				label: 'Surname',
				type: 'text',
				placeholder: 'Enter surname...',
				value: '',
				clearErrorOnInput: true,
			}),
			anydeskField: mountTextField("#anydesk-field", {
				type: 'text',
				label: "Anydesk number",
				placeholder: "e.g., 1 234 567 890",
				value: '',
				clearErrorOnInput: true,
			}),
			computerIdField: mountTextField("#computer-id-field", {
				type: 'text',
				label: "Computer's id",
				placeholder: "e.g., CONFI-123456789",
				value: '',
				clearErrorOnInput: true,
			}),
			descriptionField: mountTextArea("#description-field", {
				label: "Description of the problem",
				placeholder: "Tell us about your problem...",
				value: '',
				clearErrorOnInput: true,
			}),
		};

		mountButton('#cancel-btn', {
			label: 'Cancel',
			variant: 'ghost',
			size: 'sm',
			onClick: () => {
				window.location.href = '/report-problem.html';
			}
		});

		mountButton('#submit-btn', {
			label: 'Submit',
			variant: 'primary',
			size: 'md',
			type: 'button',
			onClick: () => {
				submit();
			}
		});

		const submit = async () => {
			const payload: {
				person: PersonData,
				anydeskNumber: string,
				computerId: string,
				description: string,
			} = {
				person: {
					name: fields.firstNameField.getValue().trim(),
					secondName: fields.secondNameField.getValue().trim(),
					surname: fields.lastNameField.getValue().trim(),
				},
				anydeskNumber: fields.anydeskField.getValue().trim(),
				computerId: fields.computerIdField.getValue().trim(),
				description: fields.descriptionField.getValue().trim(),
			};

			console.log(payload);
		}
	} catch (error) {
		reportCriticalError(error);
	}
})();
