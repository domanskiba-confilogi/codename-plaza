import { createAuthStore } from "./auth_store.js";
import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { createApiConnector, JobTitle, CompanyDepartment, License, SystemPermission, MailingGroup } from "./api.js";
import { reportCriticalError, LOGGED_IN_NAVBAR_ARGS, escapeHtml, mustQuerySelector } from "./helpers.js";
import { mountNavbar } from "./component_navbar.js";
import { mountTextField, TextFieldApi } from "./component_text_field.js";
import { mountCheckbox, CheckboxApi } from "./component_checkbox.js";
import { mountSelectField, SelectFieldApi } from "./component_select_field.js";
import { mountButton } from "./component_button.js";

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});


(async () => {
	try {
		const authStore = createAuthStore();
		const apiConnector = createApiConnector({ authStore });

		await checkIsLoggedInMiddleware(authStore);

		const {
			jobTitles,
			companyDepartments,
			licenses,
			systemPermissions,
			mailingGroups,
			licenseToJobTitleMappings,
			systemPermissionToJobTitleMappings
		}: {
			jobTitles: JobTitle[],
			companyDepartments: CompanyDepartment[],
			licenses: License[],
			systemPermissions: SystemPermission[],
			mailingGroups: MailingGroup[],
			licenseToJobTitleMappings: { licenseId: number, jobTitleId: number }[],
			systemPermissionToJobTitleMappings: { systemPermissionId: number; jobTitleId: number }[]
		} = await Promise.all([
				apiConnector.getJobTitles(),
				apiConnector.getCompanyDepartments(),
				apiConnector.getLicenses(),
				apiConnector.getSystemPermissions(),
				apiConnector.getMailingGroups(),
				apiConnector.getLicenseToJobTitleMappings(),
				apiConnector.getSystemPermissionToJobTitleMappings(),
			]).then(([
				jobTitlesResult,
				companyDepartmentsResult,
				licensesResult,
				systemPermissionsResult,
				mailingGroupsResult,
				licenseToJobTitleMappingsResult,
				systemPermissionToJobTitleMappingsResult,
			]) => {
				if (jobTitlesResult.unknownError !== null) throw jobTitlesResult.unknownError;
				if (companyDepartmentsResult.unknownError !== null) throw companyDepartmentsResult.unknownError;
				if (licensesResult.unknownError !== null) throw licensesResult.unknownError;
				if (systemPermissionsResult.unknownError !== null) throw systemPermissionsResult.unknownError;
				if (mailingGroupsResult.unknownError !== null) throw mailingGroupsResult.unknownError;
				if (licenseToJobTitleMappingsResult.unknownError !== null) throw licenseToJobTitleMappingsResult.unknownError;
				if (systemPermissionToJobTitleMappingsResult.unknownError !== null) throw systemPermissionToJobTitleMappingsResult.unknownError;


				if (jobTitlesResult.ok === null) throw new Error(`Ok is null (it shouldn't be).`);
				if (companyDepartmentsResult.ok === null) throw new Error(`Ok is null (it shouldn't be).`);
				if (licensesResult.ok === null) throw new Error(`Ok is null (it shouldn't be).`);
				if (systemPermissionsResult.ok === null) throw new Error(`Ok is null (it shouldn't be).`);
				if (mailingGroupsResult.ok === null) throw new Error(`Ok is null (it shouldn't be).`);
				if (licenseToJobTitleMappingsResult.ok === null) throw new Error(`Ok is null (it shouldn't be).`);
				if (systemPermissionToJobTitleMappingsResult.ok === null) throw new Error(`Ok is null (it shouldn't be).`);

				return {
					jobTitles: jobTitlesResult.ok, 
					companyDepartments: companyDepartmentsResult.ok, 
					licenses: licensesResult.ok, 
					systemPermissions: systemPermissionsResult.ok, 
					mailingGroups: mailingGroupsResult.ok, 
					licenseToJobTitleMappings: licenseToJobTitleMappingsResult.ok, 
					systemPermissionToJobTitleMappings: systemPermissionToJobTitleMappingsResult.ok
				};
			});

		console.log(jobTitles.filter(jobTitle => jobTitle.companyDepartmentId !== null));

		loadingScreen.destroy();

		Array.from(document.querySelectorAll('[data-loading="show"]')).forEach(element => {
			element.classList.remove("hidden");
		});

		// Navbar
		mountNavbar('#navbar-root', {
			brandHref: '/',
			brandName: 'Confilogi',
			brandAccent: 'IT Support',
			...LOGGED_IN_NAVBAR_ARGS
		});

		const setRequiredLicenses = () => {
			let result: number[] = [];

			fields.licensesField.setChosen(
				licenseToJobTitleMappings
					.filter(mapping => mapping.jobTitleId === fields.jobTitleField.getChosen()[0])
					.map(mapping => mapping.licenseId)
			);

			if (fields.jobTitleField.getChosen().length > 0) {
				result = result.concat(
					licenseToJobTitleMappings
						.filter(mapping => mapping.jobTitleId === fields.jobTitleField.getChosen()[0]!)
						.map(mapping => mapping.licenseId)
				);
			}

			if (fields.jobSubtitleField.getChosen().length > 0) {
				result = result.concat(
					licenseToJobTitleMappings
						.filter(mapping => mapping.jobTitleId === fields.jobSubtitleField.getChosen()[0]!)
						.map(mapping => mapping.licenseId)
				);
			}

			fields.licensesField.enable();
			fields.licensesField.setChosen(result);

			if (fields.licensesField.getChosen().length > 0) {
				fields.licensesField.disable();
			} else {
				fields.licensesField.enable();
			}
		}

		const setRequiredSystemPermissions = () => {
			let result: number[] = [];

			if (fields.jobTitleField.getChosen().length > 0) {
				result = result.concat(
					systemPermissionToJobTitleMappings
						.filter(systemPermission => systemPermission.jobTitleId === fields.jobTitleField.getChosen()[0]!)
						.map(systemPermission => systemPermission.systemPermissionId)
				);
			}

			if (fields.jobSubtitleField.getChosen().length > 0) {
				result = result.concat(
					systemPermissionToJobTitleMappings
						.filter(systemPermission => systemPermission.jobTitleId === fields.jobSubtitleField.getChosen()[0]!)
						.map(systemPermission => systemPermission.systemPermissionId)
				);
			}

			fields.masterSystemsField.enable();
			fields.masterSystemsField.setChosen(result);

			if (fields.masterSystemsField.getChosen().length > 0) {
				fields.masterSystemsField.disable();
			} else {
				fields.masterSystemsField.enable();
			}
		}

		const synchronizeJobTitleItems = () => {
			fields.jobTitleField.enable();

			if (fields.companyDepartmentField.getChosen().length > 0) {
				fields.jobTitleField.setItems(jobTitles
					.filter(jobTitle => jobTitle.companyDepartmentId === fields.companyDepartmentField.getChosen()[0]!)
					.map(jobTitle => ({
						value: jobTitle.id,
						displayText: jobTitle.name ?? jobTitle.intranetName,
					})));
			}

			fields.jobSubtitleField.disable();
		}

		const synchronizeJobSubtitleItems = () => {
			if (fields.jobTitleField.getChosen().length > 0) {
				fields.jobSubtitleField.setItems(jobTitles
					.filter(jobTitle => jobTitle.parentJobTitleId === fields.jobTitleField.getChosen()[0]!)
					.map(jobTitle => ({
						value: jobTitle.id,
						displayText: jobTitle.name ?? jobTitle.intranetName,
					})));
			}

			if (fields.jobSubtitleField.getItems().length > 0) {
				fields.jobSubtitleField.enable();
			}
		}

		const synchronizeSubpermissionCheckboxes = () => {
			for (let [_, subpermissionField] of Object.entries(fields.subpermissions)) {
				subpermissionField.destroy();
			};

			fields.subpermissions = {};

			mustQuerySelector(document.body, "#subpermissions-wrapper").innerHTML = '';

			const subpermissions = systemPermissions.filter(systemPermission => fields.masterSystemsField.getChosen().includes(systemPermission.subpermissionOfId));

			subpermissions.forEach(subpermission => {
				const id = `subpermission-${escapeHtml(String(subpermission.id))}-root`;

				const singleCheckboxWrapper = document.createElement("div");
				singleCheckboxWrapper.id = id;

				mustQuerySelector(document.body, "#subpermissions-wrapper").appendChild(singleCheckboxWrapper);

				fields.subpermissions[subpermission.id] = mountCheckbox(
					`#${id}`, 
					{ 
						label: subpermission.name, 
						checked: requestedPermissionIds[subpermission.id] === true,
						onChange: ({ checked }) => {
							requestedPermissionIds[subpermission.id] = checked;
						}
					}
				);
			});
		}

		const requestedPermissionIds: { [index: number]: boolean } = {};

		const masterSystems = systemPermissions
		.filter(systemPermission => systemPermission.subpermissionOfId === null)
		.map(masterSystem => ({
			value: masterSystem.id,
			displayText: masterSystem.name,
		}));

		const fields: {
			firstNameField: TextFieldApi,
			secondNameField: TextFieldApi,
			lastNameField: TextFieldApi,

			companyDepartmentField: SelectFieldApi<number>,
			jobTitleField: SelectFieldApi<number>,
			jobSubtitleField: SelectFieldApi<number>,

			workedBeforeSwitch: CheckboxApi,

			streetField: TextFieldApi,
			houseNumberField: TextFieldApi,
			apartmentNumberField: TextFieldApi,
			countryField: TextFieldApi,
			cityField: TextFieldApi,
			postalCodeField: TextFieldApi,
			phoneField: TextFieldApi,
			emailField: TextFieldApi,

			hardwareLaptopField: CheckboxApi,
			hardwareMouseField: CheckboxApi,
			hardwareHeadsetField: CheckboxApi,
			hardwareUsbCNetworkCardField: CheckboxApi,
			hardwareUsbAWirelessNetworkCardField: CheckboxApi,
			hardwareLaptopBagField: CheckboxApi,
			hardwarePhoneField: CheckboxApi,
			hardwarePhoneChargerField: CheckboxApi,
			
			masterSystemsField: SelectFieldApi<number>,
			licensesField: SelectFieldApi<number>,
			groupsField: SelectFieldApi<number>,
			subpermissions: { [index: number]: CheckboxApi }
		} = {
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
			companyDepartmentField: mountSelectField(
				'#company-department-field', 
				companyDepartments.map(department => ({ 
					value: department.id, 
					displayText: department.name 
				})), {
					label: 'Company department',
					placeholder: 'Call center, Sales...',
					multiple: false,
					onSelect: () => {
						synchronizeJobTitleItems();
					},
				}),
			jobTitleField: mountSelectField('#job-title-field', [], {
				label: 'Job title',
				placeholder: 'Select job title...',
				multiple: false,
				onSelect: () => {
					synchronizeJobSubtitleItems();
					setRequiredLicenses();
					setRequiredSystemPermissions();
				},
				onRemove: () => {
					synchronizeJobSubtitleItems();
					setRequiredLicenses();
					setRequiredSystemPermissions();
				}
			}),
			jobSubtitleField: mountSelectField('#job-subtitle-field', [], {
				label: 'Job Subtitle',
				placeholder: 'Select job title...',
				multiple: false,
				onSelect: () => {
					setRequiredLicenses();
					setRequiredSystemPermissions();
				},
				onRemove: () => {
					setRequiredLicenses();
					setRequiredSystemPermissions();
				}
			}),
			workedBeforeSwitch: mountCheckbox("#worked-before-switch", { label: "" }),
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
			masterSystemsField: mountSelectField(
				"#master-systems-field", 
				masterSystems, 
				{
					label: "Master systems",
					placeholder: "Vici PL, Vici EU1, CRM EU, etc.",
					onSelect: (_) => {
						synchronizeSubpermissionCheckboxes();
					},
					onRemove: () => {
						synchronizeSubpermissionCheckboxes();
					}
				}),
			licensesField: mountSelectField("#licenses-field", licenses.map(license => ({
				value: license.id,
				displayText: license.name,
			})), {
					label: "Licenses",
					placeholder: "Office on desktop, PowerBI Pro, etc.",
				}),
			groupsField: mountSelectField("#groups-field", mailingGroups.map(mailingGroup => ({
				value: mailingGroup.id,
				displayText: `${mailingGroup.name} (${mailingGroup.email})`
			})), {
					label: "Groups",
					placeholder: "e.g., CZ-SK Managers"
				}),
			subpermissions: {}
		};


		fields.jobTitleField.disable();
		fields.jobSubtitleField.disable();

		mountButton('#submit-btn', {
			label: 'Submit',
			variant: 'primary',
			size: 'md',
			type: 'button',
			onClick: () => {
				submitOnboarding();
			}
		});

		mountButton('#cancel-btn', {
			label: 'Cancel',
			variant: 'ghost',
			size: 'sm',
			onClick: () => {
				window.location.href = '/report-problem.html';
			}
		});

		// Validation helpers
		const clearAllErrors = () => {
			[fields.firstNameField, fields.lastNameField, fields.streetField, 
				fields.houseNumberField, fields.countryField, fields.cityField, 
				fields.postalCodeField, fields.phoneField, 
				fields.emailField].forEach(f => f.clearError());
		}

		const submitOnboarding = async () => {
			clearAllErrors();

			let jobTitleId: number;

			if (fields.jobSubtitleField.getChosen().length > 0) {
				jobTitleId = fields.jobSubtitleField.getChosen()[0]!;
			} else if (fields.jobTitleField.getChosen().length > 0) {
				jobTitleId = fields.jobTitleField.getChosen()[0]!;
			} else {
				throw new Error("No job title or job subtitle field chosen.");
			}

			// Gather
			const payload: {
				person: {
					name: string,
					secondName: string,
					surname: string,
				},
				companyDepartmentId: number | null,
				jobTitleId: number
				workedWithUsBefore: boolean,
				postalAddress: {
					street: string,
					houseNumber: string,
					apartmentNumber: string,
					country: string,
					city: string,
					postalCode: string,
					cellphone: string,
					email: string,
				},
				hardware: string[],
				systemPermissionIds: number[],
				licenseIds: number[],
				mailingGroupIds: number[],
			} = {
				person: {
					name: fields.firstNameField.getValue().trim(),
					secondName: fields.secondNameField.getValue().trim(),
					surname: fields.lastNameField.getValue().trim(),
				},
				companyDepartmentId: fields.companyDepartmentField.getChosen()[0] ?? null,
				jobTitleId,
				
				workedWithUsBefore: fields.workedBeforeSwitch.getValue(),
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
				systemPermissionIds: [],
				licenseIds: fields.licensesField.getChosen(),
				mailingGroupIds: fields.groupsField.getChosen(),
			};

			if (fields.hardwareLaptopField.getValue()) payload.hardware.push('laptop');
			if (fields.hardwareMouseField.getValue()) payload.hardware.push('mouse');
			if (fields.hardwareHeadsetField.getValue()) payload.hardware.push('headset');
			if (fields.hardwareUsbCNetworkCardField.getValue()) payload.hardware.push('usb-c-network-card');
			if (fields.hardwareUsbAWirelessNetworkCardField.getValue()) payload.hardware.push('usb-a-wireless-network-card');
			if (fields.hardwareLaptopBagField.getValue()) payload.hardware.push('laptop-bag');
			if (fields.hardwarePhoneField.getValue()) payload.hardware.push('phone');
			if (fields.hardwarePhoneChargerField.getValue()) payload.hardware.push('phone-charger');

			payload.systemPermissionIds = fields.masterSystemsField.getChosen();

			for (let [subpermissionId, checkboxField] of Object.entries(fields.subpermissions)) {
				if (checkboxField.getValue()) {
					payload.systemPermissionIds.push(parseInt(subpermissionId));
				}
			}

			reportCriticalError(JSON.stringify(payload));
		}
	} catch (error: any) {
		reportCriticalError(error);
	}
})();
