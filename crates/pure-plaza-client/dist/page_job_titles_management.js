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
import { mountSelectField } from "./component_select_field.js";
import { mountTextField } from "./component_text_field.js";
import { mountCheckbox } from "./component_checkbox.js";
var loader = mountSuspenseScreen("#loading-screen", {
    message: "Loading needed data...",
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var authStore, apiConnector_1, state_1, fetchPermissions, fetchCompanyDepartments, fetchFromBackend_1, withLoader_1, isConfigured_1, statusBadgeConfig_1, tbody_1, summaryEl_1, emptyStateEl_1, cardsRoot_1, rowButtons_1, permissionHumanId_1, cleanupRowButtons_1, render_1, openEditJobTitleModal_1, error_1;
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
                    permissions: [],
                    companyDepartments: [],
                    items: [],
                    total: 0,
                    perPage: 30,
                    nextCursor: 1,
                    endReached: false,
                };
                fetchPermissions = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, ok, unknownError;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, apiConnector_1.getPermissions()];
                            case 1:
                                _a = _b.sent(), ok = _a.ok, unknownError = _a.unknownError;
                                if (unknownError !== null) {
                                    throw unknownError;
                                }
                                else if (ok === null) {
                                    throw new Error("ok property should not be null");
                                }
                                else {
                                    state_1.permissions = ok;
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                fetchCompanyDepartments = function () { return __awaiter(void 0, void 0, void 0, function () {
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
                                    state_1.companyDepartments = ok;
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                fetchFromBackend_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, ok, unknownError;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, apiConnector_1.getJobTitlesWithDependencies()];
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
                        fetchPermissions(),
                        fetchCompanyDepartments(),
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
                isConfigured_1 = function (job) {
                    return job.permissionIds.length !== 0;
                };
                statusBadgeConfig_1 = function (conf) {
                    return conf ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-400';
                };
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
                                                    state_1.nextCursor = 1;
                                                    state_1.total = 0;
                                                    state_1.endReached = false;
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
                mustQuerySelector(document.body, '#dismiss-alert').addEventListener('click', function () {
                    var el = mustQuerySelector(document.body, '#unconfigured-alert');
                    el.classList.add('hidden');
                });
                tbody_1 = mustQuerySelector(document.body, '#jobs-tbody');
                summaryEl_1 = mustQuerySelector(document.body, '#results-summary');
                emptyStateEl_1 = mustQuerySelector(document.body, '#empty-state');
                cardsRoot_1 = mustQuerySelector(document.body, '#jobs-cards-root');
                rowButtons_1 = [];
                permissionHumanId_1 = function (permissionId) {
                    var _a;
                    var permission = state_1.permissions.find(function (permission) { return permission.id === permissionId; });
                    return (_a = permission === null || permission === void 0 ? void 0 : permission.humanId) !== null && _a !== void 0 ? _a : null;
                };
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
                    summaryEl_1.textContent = "Showing ".concat(state_1.items.length, " job titles");
                    cleanupRowButtons_1();
                    emptyStateEl_1.classList.add('hidden');
                    // Desktop rows
                    var rowsHtml = state_1.items.map(function (j) {
                        var _a;
                        var conf = isConfigured_1(j);
                        var pcount = j.permissionIds.length;
                        var configureId = "cfg-".concat(j.jobTitle.id);
                        var tags = [];
                        if (!conf) {
                            tags.push("<span class=\"inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-amber-500/20 text-amber-400\">Unconfigured</span>");
                        }
                        else {
                            tags.push("<span class=\"inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-sky-500/20 text-sky-300\">Configured</span>");
                        }
                        return "\n<tr class=\"hover:bg-neutral-900/40 transition\">\n<td class=\"px-4 py-3 align-top\">\n<div class=\"flex flex-col\">\n<span class=\"font-semibold\">".concat(escapeHtml((_a = j.jobTitle.name) !== null && _a !== void 0 ? _a : j.jobTitle.intranetName), "</span>\n<div class=\"mt-1 flex flex-wrap gap-1.5\">").concat(tags.join(''), "</div>\n<span class=\"text-xs text-neutral-500 mt-1\">ID: ").concat(escapeHtml(String(j.jobTitle.id)), " \u00B7 Intranet Name: ").concat(escapeHtml(j.jobTitle.intranetName), "</span>\n</div>\n</td>\n<td class=\"px-4 py-3 align-top\">\n<span class=\"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800\">\n").concat(escapeHtml(j.companyDepartment === null ? 'No company department' : j.companyDepartment.name), "\n</span>\n</td>\n<td class=\"px-4 py-3 align-top\">\n").concat(pcount === 0
                            ? '<span class="text-neutral-400 text-sm">No permissions</span>'
                            : "<div class=\"flex flex-wrap gap-1.5\">\n".concat(j.permissionIds.slice(0, 4).map(function (p) {
                                var _a;
                                return "\n<span class=\"inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300\">".concat(escapeHtml((_a = permissionHumanId_1(p)) !== null && _a !== void 0 ? _a : 'ERROR: Failed to find permission human ID'), "</span>\n");
                            }).join(''), "\n").concat(j.permissionIds.length > 4 ? "<span class=\"text-xs text-neutral-400\">+".concat(j.permissionIds.length - 4, " more</span>") : '', "\n</div>"), "\n</td>\n<td class=\"px-4 py-3 align-top\">\n<div class=\"flex items-center justify-end gap-2\">\n<span id=\"").concat(configureId, "\"></span>\n</div>\n</td>\n</tr>\n");
                    }).join('');
                    tbody_1.innerHTML = rowsHtml;
                    state_1.items.forEach(function (_a) {
                        var jobTitle = _a.jobTitle, companyDepartment = _a.companyDepartment, permissionIds = _a.permissionIds;
                        rowButtons_1.push(mountButton("#cfg-".concat(jobTitle.id), {
                            type: 'button',
                            variant: 'secondary',
                            label: 'Configure',
                            onClick: function () {
                                openEditJobTitleModal_1(jobTitle, companyDepartment, permissionIds);
                            },
                        }));
                    });
                    // Mobile cards
                    var cardsHtml = state_1.items.map(function (j) {
                        var conf = isConfigured_1(j);
                        var configureId = "cfg-m-".concat(j.jobTitle.id);
                        return "\n<article class=\"bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-neutral-900 transition\">\n<div class=\"flex items-start justify-between gap-3\">\n<div>\n<h2 class=\"text-base font-semibold leading-snug\">".concat(escapeHtml(j.jobTitle.name === null ? j.jobTitle.intranetName : j.jobTitle.name), "</h2>\n<p class=\"text-xs text-neutral-500 mt-0.5\">ID: ").concat(escapeHtml(String(j.jobTitle.id)), " \u00B7 Intranet Name: ").concat(escapeHtml(j.jobTitle.intranetName), "</p>\n</div>\n<span class=\"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 w-full max-w-[150px] text-ellipsis whitespace-nowrap overflow-hidden\">").concat(escapeHtml(j.companyDepartment === null ? 'No company department' : j.companyDepartment.name), "</span>\n</div>\n<div class=\"flex flex-wrap gap-1.5\">\n<span class=\"inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 ").concat(statusBadgeConfig_1(conf), "\">").concat(conf ? 'Configured' : 'Unconfigured', "</span>\n</div>\n<div class=\"flex flex-wrap gap-1.5\">\n").concat((j.permissionIds.length === 0)
                            ? '<span class="text-neutral-400 text-sm">No permissions</span>'
                            : j.permissionIds.slice(0, 3).map(function (p) {
                                var _a;
                                return "\n<span class=\"inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300\">".concat(escapeHtml((_a = permissionHumanId_1(p)) !== null && _a !== void 0 ? _a : 'ERROR: No permission human ID found'), "</span>\n");
                            }).join(''), "\n").concat(j.permissionIds.length > 3 ? "<span class=\"text-xs text-neutral-400\">+".concat(j.permissionIds.length - 3, " more</span>") : '', "\n</div>\n<div class=\"mt-1 flex items-center justify-end gap-2\">\n<span id=\"").concat(configureId, "\"></span>\n</div>\n</article>\n");
                    }).join('');
                    cardsRoot_1.innerHTML = cardsHtml;
                    state_1.items.forEach(function (_a) {
                        var jobTitle = _a.jobTitle, companyDepartment = _a.companyDepartment, permissionIds = _a.permissionIds;
                        rowButtons_1.push(mountButton("#cfg-m-".concat(jobTitle.id), {
                            type: 'button',
                            variant: 'secondary',
                            label: 'Configure',
                            onClick: function () {
                                try {
                                    openEditJobTitleModal_1(jobTitle, companyDepartment, permissionIds);
                                }
                                catch (error) {
                                    reportCriticalError(error);
                                }
                            },
                        }));
                    });
                };
                openEditJobTitleModal_1 = function (jobTitle, companyDepartment, permissionIds) {
                    var modal = mountModal('#job-modal-root', {
                        title: "Configure: ".concat(escapeHtml(jobTitle.name === null ? jobTitle.intranetName : jobTitle.name)),
                        contentHtml: '',
                        size: 'lg',
                        closeOnEsc: true,
                        closeOnBackdrop: true,
                        showCloseButton: true
                    });
                    var content = document.createElement('div');
                    content.className = 'flex flex-col gap-5';
                    content.innerHTML += "\n<div id=\"job-title-intranet-name-root\"></div>\n<div id=\"job-title-name-root\"></div>\n<div id=\"job-title-parent-job-title-root\"></div>\n<div id=\"job-title-company-department-root\"></div>\n";
                    // Permissions by API
                    var authPermissions = state_1.permissions.filter(function (permission) { return permission.humanId.startsWith("auth:"); });
                    var userManagementPermissions = state_1.permissions.filter(function (permission) { return permission.humanId.startsWith("users:"); });
                    var ticketCreationPermissions = state_1.permissions.filter(function (permission) { return permission.humanId.startsWith("create-ticket:"); });
                    var ticketManagementPermissions = state_1.permissions.filter(function (permission) { return permission.humanId.startsWith("ticket:"); });
                    var companyDepartmentsPermissions = state_1.permissions.filter(function (permission) { return permission.humanId.startsWith("company-departments:"); });
                    var jobTitlesPermissions = state_1.permissions.filter(function (permission) { return permission.humanId.startsWith("job-titles:"); });
                    var synchronizationPermissions = state_1.permissions.filter(function (permission) { return permission.humanId.startsWith("synchronization:"); });
                    var otherPermissions = state_1.permissions.filter(function (permission) {
                        return !(authPermissions.findIndex(function (sp) { return sp.id === permission.id; }) !== -1 ||
                            userManagementPermissions.findIndex(function (sp) { return sp.id === permission.id; }) !== -1 ||
                            ticketCreationPermissions.findIndex(function (sp) { return sp.id === permission.id; }) !== -1 ||
                            ticketManagementPermissions.findIndex(function (sp) { return sp.id === permission.id; }) !== -1 ||
                            synchronizationPermissions.findIndex(function (sp) { return sp.id === permission.id; }) !== -1 ||
                            jobTitlesPermissions.findIndex(function (sp) { return sp.id === permission.id; }) !== -1 ||
                            companyDepartmentsPermissions.findIndex(function (sp) { return sp.id === permission.id; }) !== -1);
                    });
                    var generatePermissionsHtmlSection = function (name, permissions) { return "\n<div class=\"bg-neutral-900/60 ring-1 ring-neutral-800 rounded-xl p-3\">\n<div class=\"flex items-center justify-between mb-2\">\n<h3 class=\"text-sm font-medium text-neutral-200\">".concat(escapeHtml(name), "</h3>\n</div>\n<div class=\"flex flex-col gap-2\">\n").concat(permissions.map(function (p) { return "<div id=\"permission-".concat(p.id, "\"></div>"); }).join(''), "\n</div>\n</div>\n"); };
                    content.innerHTML += "\n".concat(generatePermissionsHtmlSection("Authentication", authPermissions), "\n").concat(generatePermissionsHtmlSection("User management", userManagementPermissions), "\n").concat(generatePermissionsHtmlSection("Create ticket", ticketCreationPermissions), "\n").concat(generatePermissionsHtmlSection("Tickets", ticketManagementPermissions), "\n").concat(generatePermissionsHtmlSection("Synchronization", synchronizationPermissions), "\n").concat(generatePermissionsHtmlSection("Company departments", companyDepartmentsPermissions), "\n").concat(generatePermissionsHtmlSection("Job titles", jobTitlesPermissions), "\n").concat(generatePermissionsHtmlSection("Other", otherPermissions), "\n");
                    modal.setContent(content);
                    mountTextField("#job-title-intranet-name-root", {
                        type: 'text',
                        label: "Intranet name",
                        value: jobTitle.intranetName,
                        disabled: true
                    });
                    var fields = {
                        name: mountTextField("#job-title-name-root", {
                            type: 'text',
                            label: "English name",
                            value: jobTitle.name,
                        }),
                        parentJobTitleId: mountSelectField("#job-title-parent-job-title-root", state_1.items.slice().filter(function (row) { return row.jobTitle.id !== jobTitle.id; })
                            .map(function (row) {
                            var _a;
                            return ({
                                displayText: (_a = row.jobTitle.name) !== null && _a !== void 0 ? _a : row.jobTitle.intranetName,
                                value: row.jobTitle.id,
                            });
                        }), {
                            label: "Parent",
                            multiple: false,
                        }),
                        companyDepartmentId: mountSelectField("#job-title-company-department-root", state_1.companyDepartments.map(function (row) { return ({ displayText: row.name, value: row.id }); }), {
                            label: "Company department",
                            multiple: false,
                        }),
                        permissionIds: {}
                    };
                    if (jobTitle.parentJobTitleId !== null) {
                        fields.parentJobTitleId.setChosen([jobTitle.parentJobTitleId]);
                    }
                    if (companyDepartment !== null) {
                        fields.companyDepartmentId.setChosen([companyDepartment.id]);
                    }
                    state_1.permissions.forEach(function (permission) {
                        fields.permissionIds[permission.id] = mountCheckbox("#permission-".concat(permission.id), {
                            description: permission.humanId,
                            label: permission.description,
                            checked: permissionIds.includes(permission.id),
                        });
                    });
                    modal.setPrimaryAction({
                        label: 'Save changes',
                        onClick: function (_, api) { return __awaiter(void 0, void 0, void 0, function () {
                            var enabledPermissionIds_1, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        fields.name.disable();
                                        fields.parentJobTitleId.disable();
                                        fields.companyDepartmentId.disable();
                                        Object.values(fields.permissionIds).forEach(function (val) { return val.disable(); });
                                        api.setActionsLoading(true);
                                        enabledPermissionIds_1 = [];
                                        Object.keys(fields.permissionIds).forEach(function (permissionId) {
                                            var checkbox = fields.permissionIds[parseInt(permissionId)];
                                            if (checkbox === undefined) {
                                                throw new Error("Permission checkbox with permission id " + permissionId + " has not been found");
                                            }
                                            if (checkbox.getValue()) {
                                                enabledPermissionIds_1.push(parseInt(permissionId));
                                            }
                                        });
                                        return [4 /*yield*/, withLoader_1('Saving permissions...', 'Updating job title', function () { return __awaiter(void 0, void 0, void 0, function () {
                                                var unknownError, error_3;
                                                var _a, _b;
                                                return __generator(this, function (_c) {
                                                    switch (_c.label) {
                                                        case 0:
                                                            _c.trys.push([0, 3, , 4]);
                                                            return [4 /*yield*/, apiConnector_1.updateJobTitle(jobTitle.id, fields.name.getValue(), (_a = fields.parentJobTitleId.getChosen()[0]) !== null && _a !== void 0 ? _a : null, (_b = fields.companyDepartmentId.getChosen()[0]) !== null && _b !== void 0 ? _b : null, enabledPermissionIds_1)];
                                                        case 1:
                                                            unknownError = (_c.sent()).unknownError;
                                                            if (unknownError !== null)
                                                                throw unknownError;
                                                            return [4 /*yield*/, fetchFromBackend_1()];
                                                        case 2:
                                                            _c.sent();
                                                            render_1();
                                                            return [3 /*break*/, 4];
                                                        case 3:
                                                            error_3 = _c.sent();
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
