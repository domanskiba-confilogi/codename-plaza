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
import { createAuthStore } from "./auth_store.js";
import { createApiConnector } from "./api.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { reportCriticalError, escapeHtml, mountOnTableEndSeen, LOGGED_IN_NAVBAR_ARGS, mustQuerySelector } from "./helpers.js";
import { mountNavbar } from "./component_navbar.js";
var loadingScreen = mountSuspenseScreen("#loading-screen", {
    message: "Loading needed data...",
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var authStore, apiConnector_1, state_1, fetchUsers_1, tbody_1, summaryEl_1, emptyStateEl_1, cardsRoot_1, statusBadgeClasses_1, render_1, error_1;
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
                    endReached: false,
                    nextCursor: 1,
                    total: 0,
                    users: []
                };
                fetchUsers_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, ok, unknownError, items, responseNextCursor, responseTotal;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, apiConnector_1.getPaginatedUsers(30, state_1.nextCursor)];
                            case 1:
                                _a = _b.sent(), ok = _a.ok, unknownError = _a.unknownError;
                                if (unknownError !== null) {
                                    throw unknownError;
                                }
                                else if (ok === null) {
                                    throw new Error("ok should not be null");
                                }
                                else {
                                    items = ok.items, responseNextCursor = ok.nextCursor, responseTotal = ok.total;
                                    state_1.users = state_1.users.concat(items);
                                    state_1.nextCursor = responseNextCursor;
                                    state_1.total = responseTotal;
                                    if (items.length === 0)
                                        state_1.endReached = true;
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                return [4 /*yield*/, fetchUsers_1()];
            case 2:
                _a.sent();
                Array.from(document.querySelectorAll("[data-unhide=\"true\"]")).forEach(function (ele) { return ele.classList.remove("hidden"); });
                loadingScreen.destroy();
                mountNavbar('#navbar-root', __assign({ brandHref: '/', brandName: 'Confilogi', brandAccent: 'IT Support' }, LOGGED_IN_NAVBAR_ARGS));
                tbody_1 = mustQuerySelector(document.body, '#users-tbody');
                summaryEl_1 = mustQuerySelector(document.body, '#results-summary');
                emptyStateEl_1 = mustQuerySelector(document.body, '#empty-state');
                cardsRoot_1 = mustQuerySelector(document.body, '#users-cards-root');
                statusBadgeClasses_1 = function (status) {
                    return status === 'Active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400';
                };
                render_1 = function () {
                    summaryEl_1.textContent = "Showing ".concat(state_1.users.length, " of ").concat(state_1.total, " users");
                    if (state_1.users.length === 0) {
                        tbody_1.innerHTML = '';
                        cardsRoot_1.innerHTML = '';
                        emptyStateEl_1.classList.remove('hidden');
                        return;
                    }
                    emptyStateEl_1.classList.add('hidden');
                    var rowsHtml = state_1.users.map(function (u) {
                        var _a;
                        return "\n<tr class=\"hover:bg-neutral-900/40 transition\">\n<td class=\"px-4 py-3 align-top\">\n<div class=\"flex flex-col\">\n<span class=\"font-semibold\">".concat(escapeHtml(u.fullName), "</span>\n<span class=\"text-xs text-neutral-400\">ID: ").concat(escapeHtml(String(u.id)), "</span>\n</div>\n</td>\n<td class=\"px-4 py-3 align-top\">\n<span class=\"text-neutral-300\">").concat(escapeHtml(u.email), "</span>\n</td>\n<td class=\"px-4 py-3 align-top\">\n<span class=\"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300\">").concat(escapeHtml(u.jobTitle.name || u.jobTitle.intranetName), "</span>\n<span class=\"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300\">").concat(escapeHtml(((_a = u.companyDepartment) === null || _a === void 0 ? void 0 : _a.name) || "No department"), "</span>\n\n</td>\n<td class=\"px-4 py-3 align-top\">\n<span class=\"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 ").concat(statusBadgeClasses_1(u.isActive ? 'Active' : 'Disabled'), "\">").concat(escapeHtml(u.isActive ? 'Active' : 'Disabled'), "</span>\n</td>\n</tr>\n");
                    }).join('');
                    tbody_1.innerHTML = rowsHtml;
                    var cardsHtml = state_1.users.map(function (u) {
                        var _a;
                        return "\n<article class=\"bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-neutral-900 transition\">\n<div class=\"flex items-start justify-between gap-3\">\n<div>\n<h2 class=\"text-base font-semibold leading-snug\">".concat(escapeHtml(u.fullName), "</h2>\n<p class=\"text-sm text-neutral-400\">").concat(escapeHtml(u.email), "</p>\n</div>\n<span class=\"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 ").concat(statusBadgeClasses_1(u.isActive ? 'Active' : 'Disabled'), "\">\n").concat(escapeHtml(u.isActive ? 'Active' : 'Disabled'), "\n</span>\n</div>\n<div class=\"flex items-center gap-2\">\n<span class=\"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300\">\n").concat(escapeHtml(((_a = u.jobTitle) === null || _a === void 0 ? void 0 : _a.name) || u.jobTitle.intranetName), "\n</span>\n<span class=\"text-xs text-neutral-500\">ID: ").concat(escapeHtml(String(u.id)), "</span>\n</div>\n</article>\n");
                    }).join('');
                    cardsRoot_1.innerHTML = cardsHtml;
                };
                mountOnTableEndSeen('#table-end-sentinel', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var loadingScreen_1, error_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, , 4]);
                                if (!!state_1.endReached) return [3 /*break*/, 2];
                                loadingScreen_1 = mountSuspenseScreen("#loading-screen", {
                                    message: "Loading next items...",
                                });
                                return [4 /*yield*/, fetchUsers_1()];
                            case 1:
                                _a.sent();
                                render_1();
                                loadingScreen_1.destroy();
                                _a.label = 2;
                            case 2: return [3 /*break*/, 4];
                            case 3:
                                error_2 = _a.sent();
                                reportCriticalError(error_2);
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
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
