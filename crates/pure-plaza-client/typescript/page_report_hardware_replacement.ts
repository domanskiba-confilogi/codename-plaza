import { createAuthStore } from "./auth_store.js";
import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountNavbar } from "./component_navbar.js";
import { mountTextField } from "./component_text_field.js";
import { mountCheckbox } from "./component_checkbox.js";
import { reportCriticalError, LOGGED_IN_NAVBAR_ARGS, mustQuerySelector } from "./helpers.js";
import { mountButton } from "./component_button.js";
import { PostalAddressData, PersonData } from "./api.js";

const authStore = createAuthStore();

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {	
		await checkIsLoggedInMiddleware(authStore);

		const loggedInUser = authStore.getLoggedInUser()!;

		const search = new URLSearchParams(new URL(window.location).search);

		const targetPerson = search.get("target_person");

		if (targetPerson !== "myself" && targetPerson !== "colleague") {
			throw new Error("Invalid target_person search param.");
		}

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
			firstNameField: null,
			secondNameField: null,
			lastNameField: null,
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
			hardwareLaptopField: mountCheckbox("#hardware-laptop-checkbox-root", {
				label: "Laptop"
			}),
			hardwareLaptopChargerField: mountCheckbox("#hardware-laptop-charger-checkbox-root", {
				label: "Laptop charger"
			}),
			hardwareMouseField: mountCheckbox("#hardware-mouse-checkbox-root", {
				label: "Mouse"
			}),
			hardwareHeadsetField: mountCheckbox("#hardware-headset-checkbox-root", {
				label: "Headset"
			}),
			hardwareUsbCNetworkCardField: mountCheckbox("#hardware-usb-c-network-card-checkbox-root", {
				label: "USB-C Network Card"
			}),
			hardwareUsbAWirelessNetworkCardField: mountCheckbox("#hardware-usb-a-wireless-network-card-checkbox-root", {
				label: "USB-A Wireless Network Card"
			}),
			hardwareLaptopBagField: mountCheckbox("#hardware-laptop-bag-checkbox-root", {
				label: "Laptop bag"
			}),
			hardwarePhoneField: mountCheckbox("#hardware-phone-checkbox-root", {
				label: "Phone"
			}),
			hardwarePhoneChargerField: mountCheckbox("#hardware-phone-charger-checkbox-root", {
				label: "Phone charger"
			}),
		};

		if (targetPerson === "colleague") {
			fields.firstNameField = mountTextField('#first-name-field', {
				label: 'Name',
				type: 'text',
				placeholder: 'Enter name...',
				value: '',
				clearErrorOnInput: true,
			});

			fields.secondNameField = mountTextField('#second-name-field', {
				label: 'Second name (optional)',
				type: 'text',
				placeholder: 'Enter second name...',
				value: '',
				clearErrorOnInput: true,
			});

			fields.lastNameField = mountTextField('#last-name-field', {
				label: 'Surname',
				type: 'text',
				placeholder: 'Enter surname...',
				value: '',
				clearErrorOnInput: true,
			});
		} else {
			mustQuerySelector(document.body, "#colleague-data").outerHTML = "";
		}

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
			try {
				const payload: {
					person: string,
					postalAddress: PostalAddressData,
					hardware: string[],
				} = {
					person: targetPerson === "colleague" ? `${fields.firstNameField!.getValue().trim()} ${fields.secondNameField!.getValue().trim()} ${fields.lastNameField!.getValue().trim()}` : `${loggedInUser.fullName} (${loggedInUser.email})`,
					postalAddress: {
						street: fields.streetField.getValue().trim(),
						houseNumber: fields.houseNumberField.getValue().trim(),
						apartmentNumber: fields.apartmentNumberField.getValue().trim(),
						country: fields.countryField.getValue().trim(),
						city: fields.cityField.getValue().trim(),
						postalCode: fields.postalCodeField.getValue().trim(),
						cellphone: fields.phoneField.getValue().trim(),
						email: fields.emailField.getValue().trim(),
					},
					hardware: [],
				};

				if (fields.hardwareLaptopField.getValue()) payload.hardware.push('laptop');
				if (fields.hardwareLaptopChargerField.getValue()) payload.hardware.push('laptop-charger');
				if (fields.hardwareMouseField.getValue()) payload.hardware.push('mouse');
				if (fields.hardwareHeadsetField.getValue()) payload.hardware.push('headset');
				if (fields.hardwareUsbCNetworkCardField.getValue()) payload.hardware.push('usb-c-network-card');
				if (fields.hardwareUsbAWirelessNetworkCardField.getValue()) payload.hardware.push('usb-a-wireless-network-card');
				if (fields.hardwareLaptopBagField.getValue()) payload.hardware.push('laptop-bag');
				if (fields.hardwarePhoneField.getValue()) payload.hardware.push('phone');
				if (fields.hardwarePhoneChargerField.getValue()) payload.hardware.push('phone-charger');

				console.log(payload);
			} catch (error) {
				reportCriticalError(error);
			}
		}
	} catch (error) {
		reportCriticalError(error);
	}
})();

