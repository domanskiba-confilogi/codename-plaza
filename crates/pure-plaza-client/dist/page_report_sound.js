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
import { mountNavbar } from "./component_navbar.js";
import { LOGGED_IN_NAVBAR_ARGS, reportCriticalError } from "./helpers.js";
import { mountTextField } from "./component_text_field.js";
import { mountTextArea } from "./component_textarea_field.js";
import { mountButton } from "./component_button.js";
var authStore = createAuthStore();
var loadingScreen = mountSuspenseScreen("#loading-screen", {
    message: "Loading needed data...",
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var fields_1, submit_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, checkIsLoggedInMiddleware(authStore)];
            case 1:
                _a.sent();
                loadingScreen.destroy();
                Array.from(document.querySelectorAll('[data-loading="show"]')).forEach(function (element) {
                    element.classList.remove("hidden");
                });
                mountNavbar('#navbar-root', __assign({ brandHref: '/', brandName: 'Confilogi', brandAccent: 'IT Support' }, LOGGED_IN_NAVBAR_ARGS));
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
                        placeholder: "e.g, CONFI-000000000",
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
                mountButton("#shortcut-1", {
                    label: "I hear the customers, they don't hear me.",
                    variant: 'secondary',
                    size: 'sm',
                    onClick: function () {
                        fields_1.descriptionField.setValue("Hello, the person that contact's data is provided inside the ticket can hear the customers, but they don't hear the agent.");
                    }
                });
                mountButton("#shortcut-2", {
                    label: "I don't hear the customers.",
                    variant: 'secondary',
                    size: 'sm',
                    onClick: function () {
                        fields_1.descriptionField.setValue("Hello, the person that contact's data is provided inside the ticket can't hear the customers.");
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
                mountButton('#submit-btn', {
                    label: 'Submit',
                    variant: 'primary',
                    size: 'md',
                    type: 'button',
                    onClick: function () {
                        submit_1();
                    }
                });
                submit_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var payload;
                    return __generator(this, function (_a) {
                        payload = {
                            person: {
                                name: fields_1.firstNameField.getValue().trim(),
                                secondName: fields_1.secondNameField.getValue().trim(),
                                surname: fields_1.lastNameField.getValue().trim(),
                            },
                            computerId: fields_1.computerIdField.getValue().trim(),
                            anydeskNumber: fields_1.anydeskField.getValue().trim(),
                            description: fields_1.descriptionField.getValue().trim(),
                        };
                        console.log(payload);
                        return [2 /*return*/];
                    });
                }); };
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                reportCriticalError(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); })();
