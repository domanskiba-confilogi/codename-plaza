var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createAuthStore } from "./auth_store.js";
import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { createApiConnector } from "./api.js";
import { reportCriticalError, LOGGED_IN_NAVBAR_ARGS, escapeHtml, mustQuerySelector } from "./helpers.js";
import { mountNavbar } from "./component_navbar.js";
import { mountTextField } from "./component_text_field.js";
import { mountCheckbox } from "./component_checkbox.js";
import { mountSelectField } from "./component_select_field.js";
import { mountButton } from "./component_button.js";
var loadingScreen = mountSuspenseScreen("#loading-screen", {
    message: "Loading needed data...",
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var authStore, apiConnector, _a, jobTitles_1, companyDepartments, licenses, systemPermissions_1, mailingGroups, licenseToJobTitleMappings_1, systemPermissionToJobTitleMappings_1, setRequiredLicenses_1, setRequiredSystemPermissions_1, synchronizeJobTitleItems_1, synchronizeJobSubtitleItems_1, synchronizeSubpermissionCheckboxes_1, requestedPermissionIds_1, masterSystems, fields_1, clearAllErrors_1, submitOnboarding_1, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                authStore = createAuthStore();
                apiConnector = createApiConnector({ authStore: authStore });
                return [4 /*yield*/, checkIsLoggedInMiddleware(authStore)];
            case 1:
                _b.sent();
                return [4 /*yield*/, Promise.all([
                        apiConnector.getJobTitles(),
                        apiConnector.getCompanyDepartments(),
                        apiConnector.getLicenses(),
                        apiConnector.getSystemPermissions(),
                        apiConnector.getMailingGroups(),
                        apiConnector.getLicenseToJobTitleMappings(),
                        apiConnector.getSystemPermissionToJobTitleMappings(),
                    ]).then(function (_a) {
                        var jobTitlesResult = _a[0], companyDepartmentsResult = _a[1], licensesResult = _a[2], systemPermissionsResult = _a[3], mailingGroupsResult = _a[4], licenseToJobTitleMappingsResult = _a[5], systemPermissionToJobTitleMappingsResult = _a[6];
                        if (jobTitlesResult.unknownError !== null)
                            throw jobTitlesResult.unknownError;
                        if (companyDepartmentsResult.unknownError !== null)
                            throw companyDepartmentsResult.unknownError;
                        if (licensesResult.unknownError !== null)
                            throw licensesResult.unknownError;
                        if (systemPermissionsResult.unknownError !== null)
                            throw systemPermissionsResult.unknownError;
                        if (mailingGroupsResult.unknownError !== null)
                            throw mailingGroupsResult.unknownError;
                        if (licenseToJobTitleMappingsResult.unknownError !== null)
                            throw licenseToJobTitleMappingsResult.unknownError;
                        if (systemPermissionToJobTitleMappingsResult.unknownError !== null)
                            throw systemPermissionToJobTitleMappingsResult.unknownError;
                        if (jobTitlesResult.ok === null)
                            throw new Error("Ok is null (it shouldn't be).");
                        if (companyDepartmentsResult.ok === null)
                            throw new Error("Ok is null (it shouldn't be).");
                        if (licensesResult.ok === null)
                            throw new Error("Ok is null (it shouldn't be).");
                        if (systemPermissionsResult.ok === null)
                            throw new Error("Ok is null (it shouldn't be).");
                        if (mailingGroupsResult.ok === null)
                            throw new Error("Ok is null (it shouldn't be).");
                        if (licenseToJobTitleMappingsResult.ok === null)
                            throw new Error("Ok is null (it shouldn't be).");
                        if (systemPermissionToJobTitleMappingsResult.ok === null)
                            throw new Error("Ok is null (it shouldn't be).");
                        return {
                            jobTitles: jobTitlesResult.ok,
                            companyDepartments: companyDepartmentsResult.ok,
                            licenses: licensesResult.ok,
                            systemPermissions: systemPermissionsResult.ok,
                            mailingGroups: mailingGroupsResult.ok,
                            licenseToJobTitleMappings: licenseToJobTitleMappingsResult.ok,
                            systemPermissionToJobTitleMappings: systemPermissionToJobTitleMappingsResult.ok
                        };
                    })];
            case 2:
                _a = _b.sent(), jobTitles_1 = _a.jobTitles, companyDepartments = _a.companyDepartments, licenses = _a.licenses, systemPermissions_1 = _a.systemPermissions, mailingGroups = _a.mailingGroups, licenseToJobTitleMappings_1 = _a.licenseToJobTitleMappings, systemPermissionToJobTitleMappings_1 = _a.systemPermissionToJobTitleMappings;
                console.log(jobTitles_1.filter(function (jobTitle) { return jobTitle.companyDepartmentId !== null; }));
                loadingScreen.destroy();
                Array.from(document.querySelectorAll('[data-loading="show"]')).forEach(function (element) {
                    element.classList.remove("hidden");
                });
                // Navbar
                mountNavbar('#navbar-root', __assign({ brandHref: '/', brandName: 'Confilogi', brandAccent: 'IT Support' }, LOGGED_IN_NAVBAR_ARGS));
                setRequiredLicenses_1 = function () {
                    var result = [];
                    fields_1.licensesField.setChosen(licenseToJobTitleMappings_1
                        .filter(function (mapping) { return mapping.jobTitleId === fields_1.jobTitleField.getChosen()[0]; })
                        .map(function (mapping) { return mapping.licenseId; }));
                    if (fields_1.jobTitleField.getChosen().length > 0) {
                        result = result.concat(licenseToJobTitleMappings_1
                            .filter(function (mapping) { return mapping.jobTitleId === fields_1.jobTitleField.getChosen()[0]; })
                            .map(function (mapping) { return mapping.licenseId; }));
                    }
                    if (fields_1.jobSubtitleField.getChosen().length > 0) {
                        result = result.concat(licenseToJobTitleMappings_1
                            .filter(function (mapping) { return mapping.jobTitleId === fields_1.jobSubtitleField.getChosen()[0]; })
                            .map(function (mapping) { return mapping.licenseId; }));
                    }
                    fields_1.licensesField.enable();
                    fields_1.licensesField.setChosen(result);
                    if (fields_1.licensesField.getChosen().length > 0) {
                        fields_1.licensesField.disable();
                    }
                    else {
                        fields_1.licensesField.enable();
                    }
                };
                setRequiredSystemPermissions_1 = function () {
                    var result = [];
                    if (fields_1.jobTitleField.getChosen().length > 0) {
                        result = result.concat(systemPermissionToJobTitleMappings_1
                            .filter(function (systemPermission) { return systemPermission.jobTitleId === fields_1.jobTitleField.getChosen()[0]; })
                            .map(function (systemPermission) { return systemPermission.systemPermissionId; }));
                    }
                    if (fields_1.jobSubtitleField.getChosen().length > 0) {
                        result = result.concat(systemPermissionToJobTitleMappings_1
                            .filter(function (systemPermission) { return systemPermission.jobTitleId === fields_1.jobSubtitleField.getChosen()[0]; })
                            .map(function (systemPermission) { return systemPermission.systemPermissionId; }));
                    }
                    fields_1.masterSystemsField.enable();
                    fields_1.masterSystemsField.setChosen(result);
                    if (fields_1.masterSystemsField.getChosen().length > 0) {
                        fields_1.masterSystemsField.disable();
                    }
                    else {
                        fields_1.masterSystemsField.enable();
                    }
                };
                synchronizeJobTitleItems_1 = function () {
                    fields_1.jobTitleField.enable();
                    if (fields_1.companyDepartmentField.getChosen().length > 0) {
                        fields_1.jobTitleField.setItems(jobTitles_1
                            .filter(function (jobTitle) { return jobTitle.companyDepartmentId === fields_1.companyDepartmentField.getChosen()[0]; })
                            .map(function (jobTitle) {
                            var _a;
                            return ({
                                value: jobTitle.id,
                                displayText: (_a = jobTitle.name) !== null && _a !== void 0 ? _a : jobTitle.intranetName,
                            });
                        }));
                    }
                    fields_1.jobSubtitleField.disable();
                };
                synchronizeJobSubtitleItems_1 = function () {
                    if (fields_1.jobTitleField.getChosen().length > 0) {
                        fields_1.jobSubtitleField.setItems(jobTitles_1
                            .filter(function (jobTitle) { return jobTitle.parentJobTitleId === fields_1.jobTitleField.getChosen()[0]; })
                            .map(function (jobTitle) {
                            var _a;
                            return ({
                                value: jobTitle.id,
                                displayText: (_a = jobTitle.name) !== null && _a !== void 0 ? _a : jobTitle.intranetName,
                            });
                        }));
                    }
                    if (fields_1.jobSubtitleField.getItems().length > 0) {
                        fields_1.jobSubtitleField.enable();
                    }
                };
                synchronizeSubpermissionCheckboxes_1 = function () {
                    for (var _i = 0, _a = Object.entries(fields_1.subpermissions); _i < _a.length; _i++) {
                        var _b = _a[_i], _ = _b[0], subpermissionField = _b[1];
                        subpermissionField.destroy();
                    }
                    ;
                    fields_1.subpermissions = {};
                    mustQuerySelector(document.body, "#subpermissions-wrapper").innerHTML = '';
                    var subpermissions = systemPermissions_1.filter(function (systemPermission) { return fields_1.masterSystemsField.getChosen().includes(systemPermission.subpermissionOfId); });
                    subpermissions.forEach(function (subpermission) {
                        var id = "subpermission-".concat(escapeHtml(String(subpermission.id)), "-root");
                        var singleCheckboxWrapper = document.createElement("div");
                        singleCheckboxWrapper.id = id;
                        mustQuerySelector(document.body, "#subpermissions-wrapper").appendChild(singleCheckboxWrapper);
                        fields_1.subpermissions[subpermission.id] = mountCheckbox("#".concat(id), {
                            label: subpermission.name,
                            checked: requestedPermissionIds_1[subpermission.id] === true,
                            onChange: function (_a) {
                                var checked = _a.checked;
                                requestedPermissionIds_1[subpermission.id] = checked;
                            }
                        });
                    });
                };
                requestedPermissionIds_1 = {};
                masterSystems = systemPermissions_1
                    .filter(function (systemPermission) { return systemPermission.subpermissionOfId === null; })
                    .map(function (masterSystem) { return ({
                    value: masterSystem.id,
                    displayText: masterSystem.name,
                }); });
                fields_1 = {
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
                    companyDepartmentField: mountSelectField('#company-department-field', companyDepartments.map(function (department) { return ({
                        value: department.id,
                        displayText: department.name
                    }); }), {
                        label: 'Company department',
                        placeholder: 'Call center, Sales...',
                        multiple: false,
                        onSelect: function () {
                            synchronizeJobTitleItems_1();
                        },
                    }),
                    jobTitleField: mountSelectField('#job-title-field', [], {
                        label: 'Job title',
                        placeholder: 'Select job title...',
                        multiple: false,
                        onSelect: function () {
                            synchronizeJobSubtitleItems_1();
                            setRequiredLicenses_1();
                            setRequiredSystemPermissions_1();
                        },
                        onRemove: function () {
                            synchronizeJobSubtitleItems_1();
                            setRequiredLicenses_1();
                            setRequiredSystemPermissions_1();
                        }
                    }),
                    jobSubtitleField: mountSelectField('#job-subtitle-field', [], {
                        label: 'Job Subtitle',
                        placeholder: 'Select job title...',
                        multiple: false,
                        onSelect: function () {
                            setRequiredLicenses_1();
                            setRequiredSystemPermissions_1();
                        },
                        onRemove: function () {
                            setRequiredLicenses_1();
                            setRequiredSystemPermissions_1();
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
                    masterSystemsField: mountSelectField("#master-systems-field", masterSystems, {
                        label: "Master systems",
                        placeholder: "Vici PL, Vici EU1, CRM EU, etc.",
                        onSelect: function (_) {
                            synchronizeSubpermissionCheckboxes_1();
                        },
                        onRemove: function () {
                            synchronizeSubpermissionCheckboxes_1();
                        }
                    }),
                    licensesField: mountSelectField("#licenses-field", licenses.map(function (license) { return ({
                        value: license.id,
                        displayText: license.name,
                    }); }), {
                        label: "Licenses",
                        placeholder: "Office on desktop, PowerBI Pro, etc.",
                    }),
                    groupsField: mountSelectField("#groups-field", mailingGroups.map(function (mailingGroup) { return ({
                        value: mailingGroup.id,
                        displayText: "".concat(mailingGroup.name, " (").concat(mailingGroup.email, ")")
                    }); }), {
                        label: "Groups",
                        placeholder: "e.g., CZ-SK Managers"
                    }),
                    subpermissions: {}
                };
                fields_1.jobTitleField.disable();
                fields_1.jobSubtitleField.disable();
                mountButton('#submit-btn', {
                    label: 'Submit',
                    variant: 'primary',
                    size: 'md',
                    type: 'button',
                    onClick: function () {
                        submitOnboarding_1();
                    }
                });
                mountButton('#cancel-btn', {
                    label: 'Cancel',
                    variant: 'ghost',
                    size: 'sm',
                    onClick: function () {
                        window.location.href = '/report-problem.html';
                    }
                });
                clearAllErrors_1 = function () {
                    [fields_1.firstNameField, fields_1.lastNameField, fields_1.streetField,
                        fields_1.houseNumberField, fields_1.countryField, fields_1.cityField,
                        fields_1.postalCodeField, fields_1.phoneField,
                        fields_1.emailField].forEach(function (f) { return f.clearError(); });
                };
                submitOnboarding_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var jobTitleId, payload, _i, _a, _b, subpermissionId, checkboxField;
                    var _c;
                    return __generator(this, function (_d) {
                        clearAllErrors_1();
                        if (fields_1.jobSubtitleField.getChosen().length > 0) {
                            jobTitleId = fields_1.jobSubtitleField.getChosen()[0];
                        }
                        else if (fields_1.jobTitleField.getChosen().length > 0) {
                            jobTitleId = fields_1.jobTitleField.getChosen()[0];
                        }
                        else {
                            throw new Error("No job title or job subtitle field chosen.");
                        }
                        payload = {
                            person: {
                                name: fields_1.firstNameField.getValue().trim(),
                                secondName: fields_1.secondNameField.getValue().trim(),
                                surname: fields_1.lastNameField.getValue().trim(),
                            },
                            companyDepartmentId: (_c = fields_1.companyDepartmentField.getChosen()[0]) !== null && _c !== void 0 ? _c : null,
                            jobTitleId: jobTitleId,
                            workedWithUsBefore: fields_1.workedBeforeSwitch.getValue(),
                            postalAddress: {
                                street: fields_1.streetField.getValue().trim(),
                                houseNumber: fields_1.houseNumberField.getValue().trim(),
                                apartmentNumber: fields_1.apartmentNumberField.getValue().trim(),
                                country: fields_1.countryField.getValue().trim(),
                                city: fields_1.cityField.getValue().trim(),
                                postalCode: fields_1.postalCodeField.getValue().trim(),
                                cellphone: fields_1.phoneField.getValue().trim(),
                                email: fields_1.emailField.getValue().trim(),
                            },
                            hardware: [],
                            systemPermissionIds: [],
                            licenseIds: fields_1.licensesField.getChosen(),
                            mailingGroupIds: fields_1.groupsField.getChosen(),
                        };
                        if (fields_1.hardwareLaptopField.getValue())
                            payload.hardware.push('laptop');
                        if (fields_1.hardwareMouseField.getValue())
                            payload.hardware.push('mouse');
                        if (fields_1.hardwareHeadsetField.getValue())
                            payload.hardware.push('headset');
                        if (fields_1.hardwareUsbCNetworkCardField.getValue())
                            payload.hardware.push('usb-c-network-card');
                        if (fields_1.hardwareUsbAWirelessNetworkCardField.getValue())
                            payload.hardware.push('usb-a-wireless-network-card');
                        if (fields_1.hardwareLaptopBagField.getValue())
                            payload.hardware.push('laptop-bag');
                        if (fields_1.hardwarePhoneField.getValue())
                            payload.hardware.push('phone');
                        if (fields_1.hardwarePhoneChargerField.getValue())
                            payload.hardware.push('phone-charger');
                        payload.systemPermissionIds = fields_1.masterSystemsField.getChosen();
                        for (_i = 0, _a = Object.entries(fields_1.subpermissions); _i < _a.length; _i++) {
                            _b = _a[_i], subpermissionId = _b[0], checkboxField = _b[1];
                            if (checkboxField.getValue()) {
                                payload.systemPermissionIds.push(parseInt(subpermissionId));
                            }
                        }
                        reportCriticalError(JSON.stringify(payload));
                        return [2 /*return*/];
                    });
                }); };
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                reportCriticalError(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); })();
