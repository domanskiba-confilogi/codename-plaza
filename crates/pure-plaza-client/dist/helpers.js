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
import { mountModal } from "./component_modal.js";
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function mustQuerySelector(rootElement, selector) {
    var input = rootElement.querySelector(selector);
    if (input === null) {
        throw new Error("mountTextField: failed to create/find input element");
    }
    return input;
}
var CONFILOGI_ICON_SVG = "\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1430 513.165\"><g transform=\"translate(-48.264 -60.372)\"><path d=\"M251.486,311.469q-48.185,0-73.414-26.8t-25.233-76.125q0-24.518,7.7-43.766a94.3,94.3,0,0,1,21.1-32.5,88.238,88.238,0,0,1,31.932-20.1,115.2,115.2,0,0,1,40.2-6.843,129.156,129.156,0,0,1,22.812,1.854,148.694,148.694,0,0,1,17.96,4.278,88.607,88.607,0,0,1,12.831,4.989q5.132,2.566,7.413,3.992l-12.832,35.923A107.747,107.747,0,0,0,280.71,148.1a101.382,101.382,0,0,0-27.514-3.425,60.756,60.756,0,0,0-20.1,3.425,45.459,45.459,0,0,0-17.393,10.974,54.643,54.643,0,0,0-12.118,19.531q-4.563,11.975-4.562,29.084a103.708,103.708,0,0,0,2.994,25.516,54.029,54.029,0,0,0,9.694,20.384,46.408,46.408,0,0,0,17.533,13.542q10.832,5,26.23,4.992a119.413,119.413,0,0,0,17.393-1.14,128.706,128.706,0,0,0,13.685-2.708,71.718,71.718,0,0,0,10.551-3.565q4.553-1.992,8.266-3.708l12.261,35.64q-9.409,5.706-26.517,10.264T251.486,311.469Z\" transform=\"translate(252.491 108.554)\" fill=\"white\"/><path d=\"M247.5,128.164a237.6,237.6,0,0,1,27.94-5.846,229.942,229.942,0,0,1,35.923-2.708q19.1,0,31.792,4.989t20.1,14.115A55.1,55.1,0,0,1,373.8,160.383a115.351,115.351,0,0,1,3.138,27.94V273H334.457V193.455q0-20.528-5.415-29.081T308.8,155.821q-4.563,0-9.694.427c-3.425.283-6.467.621-9.123,1V273H247.5Z\" transform=\"translate(481.041 143.03)\" fill=\"white\"/><path d=\"M356.08,99.737a82.238,82.238,0,0,1,19.814,2,95.4,95.4,0,0,1,13.258,4.278l-7.413,33.356a40.62,40.62,0,0,0-10.12-2.851,73.94,73.94,0,0,0-11.261-.854,34.608,34.608,0,0,0-12.975,2.137,20.036,20.036,0,0,0-8.266,5.846,22.557,22.557,0,0,0-4.278,8.84,45.649,45.649,0,0,0-1.28,11.117v7.413h52.46v35.357h-52.46V320.987H291.076V163.034q0-29.081,16.393-46.187T356.08,99.737Z\" transform=\"translate(586.258 95.045)\" fill=\"white\"/><path d=\"M373.827,125.662q0,11.693-7.556,18.39a27.046,27.046,0,0,1-35.637,0q-7.56-6.7-7.556-18.39t7.556-18.39a27.046,27.046,0,0,1,35.637,0Q373.82,113.976,373.827,125.662Z\" transform=\"translate(663.525 97.063)\" fill=\"white\"/><rect width=\"42.483\" height=\"149.97\" transform=\"translate(990.879 266.062)\" fill=\"white\"/><path d=\"M402.5,323.838q-18.53-.287-30.078-3.991t-18.247-10.4a34.451,34.451,0,0,1-9.123-16.253,87.568,87.568,0,0,1-2.424-21.528V106.58l42.483-6.843V263.108a55.921,55.921,0,0,0,.854,10.264,17.7,17.7,0,0,0,3.281,7.7,17.331,17.331,0,0,0,6.986,5.132,38.107,38.107,0,0,0,12.258,2.564Z\" transform=\"translate(710.726 95.045)\" fill=\"white\"/><path d=\"M531.185,124.89c-4.842-1.041-9.936-1.953-15.249-2.721q-8-1.122-16.106-1.844-8.133-.712-15.833-.714-17.967,0-32.212,5.279a67.009,67.009,0,0,0-24.1,14.972,63.943,63.943,0,0,0-14.955,23.229,84.131,84.131,0,0,0-5.132,30.074q0,33.086,16.526,51.476,16.543,18.382,47.625,18.39a75.195,75.195,0,0,0,15.812-1.571,67.491,67.491,0,0,0,14.115-4.712v5.422q0,12.548-7.56,20.524t-25.8,7.983a123.614,123.614,0,0,1-24.943-2.284,124.924,124.924,0,0,1-20.944-6.262l-7.416,35.626a171.3,171.3,0,0,0,25.366,6.426,157.554,157.554,0,0,0,27.37,2.411q39.063,0,57.742-17.8,18.679-17.834,18.681-54.6V128.157C540.35,127.027,536.041,125.931,531.185,124.89Zm-29.511,98.224a46.652,46.652,0,0,1-9.7,3.981,42.078,42.078,0,0,1-12.251,1.714q-28.815,0-28.8-35.643,0-17.091,8.273-28.214t25.089-11.121c3.8,0,7.123.13,9.97.42s5.313.621,7.413,1.007Z\" transform=\"translate(867.59 143.03)\" fill=\"white\"/><path d=\"M502.96,125.662q0,11.693-7.556,18.39a27.051,27.051,0,0,1-35.64,0q-7.56-6.7-7.556-18.39t7.556-18.39a27.051,27.051,0,0,1,35.64,0Q502.954,113.976,502.96,125.662Z\" transform=\"translate(975.304 97.063)\" fill=\"white\"/><rect width=\"42.483\" height=\"149.97\" transform=\"translate(1431.789 266.062)\" fill=\"white\"/><path d=\"M343.188,165.916a72.362,72.362,0,0,0-15.119-24.8,67.844,67.844,0,0,0-23.225-15.98,76.147,76.147,0,0,0-29.8-5.7,75.328,75.328,0,0,0-29.511,5.7,69.338,69.338,0,0,0-23.372,15.98,72.942,72.942,0,0,0-15.4,24.8,89.6,89.6,0,0,0-5.569,32.212,92.7,92.7,0,0,0,5.426,32.359,73.729,73.729,0,0,0,15.1,25.089A66.68,66.68,0,0,0,244.965,271.7a76.737,76.737,0,0,0,30.078,5.7,77.556,77.556,0,0,0,30.365-5.7,66.806,66.806,0,0,0,23.246-16.123,70.4,70.4,0,0,0,14.829-25.089,97.637,97.637,0,0,0,5.132-32.359A91.965,91.965,0,0,0,343.188,165.916Zm-45.76,61.723Q289.6,239.2,275.043,239.2t-22.518-11.558q-7.995-11.534-7.98-31.208,0-19.693,7.98-30.952t22.518-11.247q14.54,0,22.385,11.247,7.836,11.283,7.836,30.952T297.428,227.639Z\" transform=\"translate(369.244 142.629)\" fill=\"white\"/><path d=\"M503.908,165.916a72.364,72.364,0,0,0-15.119-24.8,67.858,67.858,0,0,0-23.229-15.98,80.049,80.049,0,0,0-59.309,0,69.352,69.352,0,0,0-23.375,15.98,72.935,72.935,0,0,0-15.392,24.8,89.532,89.532,0,0,0-5.569,32.212,92.692,92.692,0,0,0,5.422,32.359,73.5,73.5,0,0,0,15.119,25.089A66.582,66.582,0,0,0,405.684,271.7a82.982,82.982,0,0,0,60.443,0,66.805,66.805,0,0,0,23.246-16.123A70.444,70.444,0,0,0,504.2,230.486a97.639,97.639,0,0,0,5.129-32.359A91.579,91.579,0,0,0,503.908,165.916Zm-45.761,63.437q-7.836,11.56-22.389,11.541c-9.677,0-17.2-3.834-22.515-11.541q-7.995-11.554-7.98-31.225,0-19.667,7.98-30.932c5.313-7.5,12.838-11.268,22.515-11.268q14.546,0,22.389,11.268t7.833,30.932Q465.98,217.795,458.147,229.353Z\" transform=\"translate(757.293 142.629)\" fill=\"white\"/><g transform=\"translate(48.264 60.372)\"><path d=\"M303.461,461.53l-255.2-158.4.039-196.37,255.2,158.4Z\" transform=\"translate(-48.264 51.636)\" fill=\"#414293\"/><path d=\"M48.264,415.139l255.2-158.4-.039-196.37L48.3,218.77Z\" transform=\"translate(-48.264 -60.372)\" fill=\"#f8b133\"/><path d=\"M206.474,204.933,48.264,303.12l.055-196.355Z\" transform=\"translate(-48.264 51.641)\" fill=\"#1d1d1b\"/></g></g></svg>\n";
var CONFILOGI_ONLY_LOGO_ICON_SVG = "\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 260 520\" class=\"w-5\"><g transform=\"translate(-48.264 -60.372)\"><g transform=\"translate(48.264 60.372)\"><path d=\"M303.461,461.53l-255.2-158.4.039-196.37,255.2,158.4Z\" transform=\"translate(-48.264 51.636)\" fill=\"#414293\"/><path d=\"M48.264,415.139l255.2-158.4-.039-196.37L48.3,218.77Z\" transform=\"translate(-48.264 -60.372)\" fill=\"#f8b133\"/><path d=\"M206.474,204.933,48.264,303.12l.055-196.355Z\" transform=\"translate(-48.264 51.641)\" fill=\"#1d1d1b\"/></g></g></svg>\n";
var LOGGED_IN_NAVBAR_ITEMS = [
    { type: 'link', label: 'Reported problems', href: '/reported-problems.html' },
    { type: 'link', label: 'Report problem', href: '/report-problem.html' },
    { type: 'link', label: 'My account', href: '/my-account.html' },
    {
        type: 'dropdown',
        id: 'administration',
        label: 'Administration',
        menuWidth: 'w-64',
        items: [
            { label: 'User management', href: '/administration/user-management.html' },
            { label: 'Job title settings', href: '/administration/job-titles.html' },
            { label: 'Company department settings', href: '/administration/company-departments.html' },
            { label: 'Other settings', href: '/administration/other-settings.html' },
        ]
    },
    { type: 'link', label: 'Sign out', href: '/sign-out.html' }
];
var LOGGED_OUT_NAVBAR_ITEMS = [
    { type: 'link', label: 'Forgot your password?', href: '/forgot-your-password.html' },
];
var LOGGED_IN_NAVBAR_ARGS = {
    logoSvg: CONFILOGI_ONLY_LOGO_ICON_SVG,
    ctaText: 'Contact',
    ctaHref: '/contact.html',
    items: LOGGED_IN_NAVBAR_ITEMS,
};
var LOGGED_OUT_NAVBAR_ARGS = {
    logoSvg: CONFILOGI_ONLY_LOGO_ICON_SVG,
    ctaText: 'Sign in',
    ctaHref: '/sign-in.html',
    items: LOGGED_OUT_NAVBAR_ITEMS,
};
function reportCriticalError(error) {
    var body = "";
    if (error instanceof Error) {
        body = "<pre class=\"overflow-x-auto\">".concat(error, "\r\n").concat(error.stack, "</pre>");
    }
    else {
        body = "<pre class=\"overflow-x-auto\">".concat(String(error), "</pre>");
    }
    var errorModal = mountModal("#error-modal-root", {
        title: "A critical error occured",
        size: 'lg',
        contentHtml: body,
        primaryAction: {
            label: 'Refresh page',
            onClick: function (_first, _second) {
                window.location.reload();
            }
        },
    });
    errorModal.open();
    throw error;
}
function mountOnTableEndSeen(id, callback) {
    var _this = this;
    var sentinel = mustQuerySelector(document.body, id);
    var observer = new IntersectionObserver(function (entries) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    callback();
                }
            });
            return [2 /*return*/];
        });
    }); }, {
        root: null,
        threshold: 0,
        rootMargin: '0px 0px 150px 0px'
    });
    observer.observe(sentinel);
}
export { escapeHtml, mustQuerySelector, CONFILOGI_ICON_SVG, CONFILOGI_ONLY_LOGO_ICON_SVG, LOGGED_IN_NAVBAR_ARGS, LOGGED_OUT_NAVBAR_ARGS, reportCriticalError, mountOnTableEndSeen };
