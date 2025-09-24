import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createAuthStore } from "./auth_store.js";
import { mountNavbar } from "./component_navbar.js";
import { LOGGED_IN_NAVBAR_ARGS, reportCriticalError } from "./helpers.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountTextField } from "./component_text_field.js";
import { mountButton } from "./component_button.js";

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		const authStore = createAuthStore();
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
			streetField: mountTextField('#street-field', {
				label: 'Street name',
				type: 'text',
				placeholder: 'e.g., Main Street',
				value: '',
				clearErrorOnInput: true,
			}),
			houseNumberField: mountTextField('#house-number-field', {
				label: 'House number',
				type: 'text',
				placeholder: 'e.g., 12A',
				value: '',
				clearErrorOnInput: true,
			}),
			apartmentNumberField: mountTextField('#apartment-number-field', {
				label: 'Apartment number (optional)',
				type: 'text',
				placeholder: 'e.g., 5',
				value: '',
				clearErrorOnInput: true,
			}),
			countryField: mountTextField('#country-field', {
				label: 'Country',
				type: 'text',
				placeholder: 'e.g., Poland',
				value: '',
				clearErrorOnInput: true,
			}),
			cityField: mountTextField('#city-field', {
				label: 'City',
				type: 'text',
				placeholder: 'e.g., Warsaw',
				value: '',
				clearErrorOnInput: true,
			}),
			postalCodeField: mountTextField('#postal-code-field', {
				label: 'Postal code',
				type: 'text',
				placeholder: 'e.g., 00-001',
				value: '',
				clearErrorOnInput: true,
			}),
			phoneField: mountTextField('#phone-field', {
				label: 'Cellphone number',
				type: 'text',
				placeholder: 'e.g., +48 600 000 000',
				value: '',
				clearErrorOnInput: true,
			}),
			emailField: mountTextField('#email-field', {
				label: 'Email address',
				type: 'email',
				placeholder: 'name@domain.com',
				value: '',
				clearErrorOnInput: true,
			}),
			cancelBtn: mountButton('#cancel-btn', {
				label: 'Cancel',
				variant: 'ghost',
				size: 'sm',
				onClick: () => {
					window.location.href = '/report-problem.html';
				}
			}),
		};


		mountButton('#submit-btn', {
			label: 'Submit',
			variant: 'primary',
			size: 'md',
			type: 'button',
			onClick: () => {
				submitOnboarding();
			}
		});

		const clearAllErrors = () => {
			[fields.firstNameField, fields.lastNameField, fields.streetField, 
				fields.houseNumberField, fields.countryField, fields.cityField, 
				fields.postalCodeField, fields.phoneField, 
				fields.emailField].forEach(f => f.clearError());
		}

		const submitOnboarding = async () => {
			clearAllErrors();

			// Gather
			const payload = {
				person: {
					name: fields.firstNameField.getValue().trim(),
					secondName: fields.secondNameField.getValue().trim(),
					surname: fields.lastNameField.getValue().trim(),
				},
				postalAddress: {
					street: fields.streetField.getValue().trim(),
					houseNumber: fields.houseNumberField.getValue().trim(),
					apartmentNumber: fields.apartmentNumberField.getValue().trim(),
					country: fields.countryField.getValue().trim(),
					city: fields.cityField.getValue().trim(),
					postalCode: fields.postalCodeField.getValue().trim(),
					cellphone: fields.phoneField.getValue().trim(),
					email: fields.emailField.getValue().trim(),
				}
			};

			console.log(payload);
		}
	} catch (error) {
		reportCriticalError(error);
	}
})();
