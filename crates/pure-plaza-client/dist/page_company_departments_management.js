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
import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createApiConnector } from "./api.js";
import { createAuthStore } from "./auth_store.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountNavbar } from "./component_navbar.js";
import { mountModal } from "./component_modal.js";
import { mountButton } from "./component_button.js";
import { LOGGED_IN_NAVBAR_ARGS, mustQuerySelector, escapeHtml, reportCriticalError } from "./helpers.js";
import { mountTextField } from "./component_text_field.js";
var loader = mountSuspenseScreen("#loading-screen", {
    message: "Loading needed data...",
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var authStore, apiConnector_1, state_1, fetchFromBackend_1, withLoader_1, tbody_1, summaryEl_1, emptyStateEl_1, cardsRoot_1, rowButtons_1, cleanupRowButtons_1, render_1, openCreateCompanyDepartmentModal_1, openEditJobTitleModal_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                authStore = createAuthStore();
                apiConnector_1 = createApiConnector({ authStore: authStore });
                return [4 /*yield*/, checkIsLoggedInMiddleware(authStore)];
            case 1:
                _a.sent();
                state_1 = {
                    items: [],
                };
                fetchFromBackend_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, ok, unknownError;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, apiConnector_1.getCompanyDepartments()];
                            case 1:
                                _a = _b.sent(), ok = _a.ok, unknownError = _a.unknownError;
                                if (unknownError !== null) {
                                    throw unknownError;
                                }
                                else if (ok === null) {
                                    throw new Error("ok property should not be null");
                                }
                                else {
                                    state_1.items = ok;
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                return [4 /*yield*/, Promise.all([
                        fetchFromBackend_1(),
                    ])];
            case 2:
                _a.sent();
                Array.from(document.querySelectorAll("[data-unhide=\"true\"]")).forEach(function (ele) { return ele.classList.remove("hidden"); });
                loader.hide();
                mountNavbar('#navbar-root', __assign({ brandHref: '/', brandName: 'Confilogi', brandAccent: 'IT Support' }, LOGGED_IN_NAVBAR_ARGS));
                withLoader_1 = function (message, hint, fn) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        loader.setMessage(message || 'Working...');
                        if (hint == null)
                            loader.setHint(null);
                        else
                            loader.setHint(hint);
                        loader.show();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var res, e_1;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 2, 3, 4]);
                                                return [4 /*yield*/, fn()];
                                            case 1:
                                                res = _a.sent();
                                                resolve(res);
                                                return [3 /*break*/, 4];
                                            case 2:
                                                e_1 = _a.sent();
                                                reject(e_1);
                                                return [3 /*break*/, 4];
                                            case 3:
                                                loader.hide();
                                                return [7 /*endfinally*/];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); }, 350);
                            })];
                    });
                }); };
                mountButton('#refresh-btn', {
                    label: 'Refresh',
                    variant: 'ghost',
                    size: 'md',
                    onClick: function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, withLoader_1('Refreshing from backend...', '', function () { return __awaiter(void 0, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    state_1.items = [];
                                                    return [4 /*yield*/, fetchFromBackend_1()];
                                                case 1:
                                                    _a.sent();
                                                    render_1();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }
                });
                mountButton('#new-company-department-btn', {
                    label: 'Create new',
                    variant: 'primary',
                    size: 'md',
                    onClick: function () { return openCreateCompanyDepartmentModal_1(); },
                });
                tbody_1 = mustQuerySelector(document.body, '#tbody');
                summaryEl_1 = mustQuerySelector(document.body, '#results-summary');
                emptyStateEl_1 = mustQuerySelector(document.body, '#empty-state');
                cardsRoot_1 = mustQuerySelector(document.body, '#cards-root');
                rowButtons_1 = [];
                cleanupRowButtons_1 = function () {
                    for (var _i = 0, rowButtons_2 = rowButtons_1; _i < rowButtons_2.length; _i++) {
                        var b = rowButtons_2[_i];
                        try {
                            b.destroy && b.destroy();
                        }
                        catch (_a) { }
                    }
                    rowButtons_1 = [];
                };
                render_1 = function () {
                    summaryEl_1.textContent = "Showing ".concat(state_1.items.length, " company departments");
                    cleanupRowButtons_1();
                    emptyStateEl_1.classList.add('hidden');
                    // Desktop rows
                    var rowsHtml = state_1.items.map(function (j) {
                        var configureId = "cfg-".concat(j.id);
                        return "\n<tr class=\"hover:bg-neutral-900/40 transition\">\n<td class=\"px-4 py-3 align-top\">\n<div class=\"flex flex-col\">\n<span class=\"font-semibold\">".concat(escapeHtml(j.name), "</span>\n<span class=\"text-xs text-neutral-500 mt-1\">ID: ").concat(escapeHtml(String(j.id)), "</span>\n</div>\n</td>\n<td class=\"px-4 py-3 align-top\">\n<div class=\"flex items-center justify-end gap-2\">\n<span id=\"").concat(configureId, "\"></span>\n</div>\n</td>\n</tr>\n");
                    }).join('');
                    tbody_1.innerHTML = rowsHtml;
                    state_1.items.forEach(function (companyDepartment) {
                        rowButtons_1.push(mountButton("#cfg-".concat(companyDepartment.id), {
                            type: 'button',
                            variant: 'secondary',
                            label: 'Configure',
                            onClick: function () {
                                openEditJobTitleModal_1(companyDepartment);
                            },
                        }));
                    });
                    var cardsHtml = state_1.items.map(function (companyDepartment) {
                        var configureId = "cfg-m-".concat(companyDepartment.id);
                        return "\n<article class=\"bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-neutral-900 transition\">\n<h2 class=\"text-base font-semibold leading-snug\">".concat(escapeHtml(companyDepartment.name), "</h2>\n<div class=\"mt-1 flex items-center justify-end gap-2\">\n<span id=\"").concat(configureId, "\"></span>\n</div>\n</article>\n");
                    }).join('');
                    cardsRoot_1.innerHTML = cardsHtml;
                    state_1.items.forEach(function (companyDepartment) {
                        rowButtons_1.push(mountButton("#cfg-m-".concat(companyDepartment.id), {
                            type: 'button',
                            variant: 'secondary',
                            label: 'Configure',
                            onClick: function () {
                                openEditJobTitleModal_1(companyDepartment);
                            },
                        }));
                    });
                };
                openCreateCompanyDepartmentModal_1 = function () {
                    var modal = mountModal('#company-department-modal-root', {
                        title: "Create new company department",
                        contentHtml: '',
                        size: 'lg',
                        closeOnEsc: true,
                        closeOnBackdrop: true,
                        showCloseButton: true
                    });
                    var content = document.createElement('div');
                    content.className = 'flex flex-col gap-5';
                    content.innerHTML = "<div id=\"company-department-name-root\"></div>";
                    modal.setContent(content);
                    var fields = {
                        name: mountTextField("#company-department-name-root", {
                            type: 'text',
                            label: "Name",
                        })
                    };
                    modal.setPrimaryAction({
                        label: 'Save changes',
                        onClick: function (_, api) { return __awaiter(void 0, void 0, void 0, function () {
                            var error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        fields.name.disable();
                                        api.setActionsLoading(true);
                                        return [4 /*yield*/, withLoader_1('Creating company department...', '', function () { return __awaiter(void 0, void 0, void 0, function () {
                                                var unknownError;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, apiConnector_1.createCompanyDepartment({
                                                                name: fields.name.getValue(),
                                                            })];
                                                        case 1:
                                                            unknownError = (_a.sent()).unknownError;
                                                            if (unknownError !== null) {
                                                                throw unknownError;
                                                            }
                                                            return [4 /*yield*/, fetchFromBackend_1()];
                                                        case 2:
                                                            _a.sent();
                                                            render_1();
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                    case 1:
                                        _a.sent();
                                        api.close();
                                        modal.destroy();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_2 = _a.sent();
                                        reportCriticalError(error_2);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }
                    });
                    modal.setSecondaryAction({
                        label: 'Cancel',
                        onClick: function (_, api) { api.close(); modal.destroy(); }
                    });
                    modal.open();
                };
                openEditJobTitleModal_1 = function (companyDepartment) {
                    var modal = mountModal('#company-department-modal-root', {
                        title: "Configure: ".concat(escapeHtml(companyDepartment.name)),
                        contentHtml: '',
                        size: 'lg',
                        closeOnEsc: true,
                        closeOnBackdrop: true,
                        showCloseButton: true
                    });
                    var content = document.createElement('div');
                    content.className = 'flex flex-col gap-5';
                    content.innerHTML = "<div id=\"company-department-name-root\"></div>";
                    modal.setContent(content);
                    var fields = {
                        name: mountTextField("#company-department-name-root", {
                            type: 'text',
                            label: "Name",
                            value: companyDepartment.name,
                        })
                    };
                    modal.setPrimaryAction({
                        label: 'Save changes',
                        onClick: function (_, api) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        fields.name.disable();
                                        api.setActionsLoading(true);
                                        return [4 /*yield*/, withLoader_1('Saving permissions...', 'Updating job title', function () { return __awaiter(void 0, void 0, void 0, function () {
                                                var unknownError, error_3;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            _a.trys.push([0, 3, , 4]);
                                                            return [4 /*yield*/, apiConnector_1.updateCompanyDepartment({
                                                                    id: companyDepartment.id,
                                                                    name: fields.name.getValue(),
                                                                })];
                                                        case 1:
                                                            unknownError = (_a.sent()).unknownError;
                                                            if (unknownError !== null) {
                                                                throw unknownError;
                                                            }
                                                            return [4 /*yield*/, fetchFromBackend_1()];
                                                        case 2:
                                                            _a.sent();
                                                            render_1();
                                                            return [3 /*break*/, 4];
                                                        case 3:
                                                            error_3 = _a.sent();
                                                            reportCriticalError(error_3);
                                                            return [3 /*break*/, 4];
                                                        case 4: return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                    case 1:
                                        _a.sent();
                                        api.close();
                                        modal.destroy();
                                        return [2 /*return*/];
                                }
                            });
                        }); }
                    });
                    modal.setSecondaryAction({
                        label: 'Cancel',
                        onClick: function (_, api) { api.close(); modal.destroy(); }
                    });
                    modal.open();
                };
                // Initial render
                render_1();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                reportCriticalError(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); })();
