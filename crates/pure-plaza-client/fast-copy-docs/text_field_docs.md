# mountTextField — Accessible, headless text field (vanilla JS + Tailwind-ready)

A lightweight utility that mounts a labeled input with built-in error messaging, accessibility attributes, and a small control API. Works with text, email, and password inputs. Styling uses Tailwind classes by default but can be customized.

## Quick start

HTML
```html
<div id="username-field"></div>
```

JS
```js
const username = mountTextField("#username-field", {
  label: "Username",
  placeholder: "e.g. johndoe",
  value: "",
  type: "text",
  clearErrorOnInput: true,
  onInput: ({ new_value }) => {
    // live validation example
    if (new_value.length < 3) {
      username.setError("Username must be at least 3 characters");
    } else {
      username.clearError();
    }
  },
});
```

## Signature

```js
const api = mountTextField(selector, options = {})
```

- selector: CSS selector for a container element to mount into.
- Throws if selector matches no element.

## Options

- type: "text" | "email" | "password" (default: "text")
  - Case-insensitive; invalid values fall back to "text".
- label: string (default: "Label")
- placeholder: string (default: "")
- disabled: boolean (default: false)
- value: string | number (default: "")
- onInput: function({ new_value: string }) (default: null)
- clearErrorOnInput: boolean (default: false)
  - When true, calling setError earlier will auto-clear on user input.

Note: label, placeholder, and value are HTML-escaped via escapeHtml before rendering.

## Rendered structure

- <label for="...">Label</label>
- <input id="...">
- <p id="...-error" role="alert" aria-live="polite" class="hidden">Error text</p>

IDs are auto-generated to bind label and input and to associate the error region.

## Accessibility

- Label is bound to input via for/id.
- Error region has role="alert" and aria-live="polite".
- When error is present, input gets aria-invalid="true" and aria-describedby set to the error element id (removed when error clears).
- Disabled state uses native disabled attribute.

## Default styling (Tailwind)

- Input uses ring, hover, focus, disabled styles.
- Error state swaps ring-neutral/focus classes to ring-red/focus-red.
- You can customize at runtime via instance.inputEl.classList or by editing the component classes.

## API

All methods are synchronous and side-effect the mounted DOM.

- getValue(): string
- setValue(next, { silent = false } = {}): void
  - Updates internal state and DOM. Emits onInput unless silent = true.
- getType(): "text" | "email" | "password"
- setType(nextType): void
  - Ignores invalid values.
- isDisabled(): boolean
- disable(): void
- enable(): void
- focus(): void
- blur(): void
- clear({ silent = false } = {}): void
  - Sets value to "" and emits onInput unless silent.
- setLabel(text): void
- setPlaceholder(text): void
- setOnInput(fn): void
  - fn receives { new_value: string }. Wrapped in try/catch internally.
- setError(message): void
  - Sets/updates error text, applies error styles and aria. Passing null/empty/whitespace clears the error.
- clearError(): void
  - Hides error and reverts styles/aria.
- hasError(): boolean
- inputEl: HTMLInputElement
- errorEl: HTMLElement
- root: HTMLElement
- destroy(): void
  - Removes event listener and clears root.innerHTML.

## Usage examples

Basic email field
```js
const email = mountTextField("#email", {
  label: "Email",
  type: "email",
  placeholder: "you@example.com",
  clearErrorOnInput: true,
  onInput: ({ new_value }) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(new_value);
    if (!ok) email.setError("Please enter a valid email address");
  },
});
```

Programmatic control (submit validation)
```js
const password = mountTextField("#password", { label: "Password", type: "password" });

document.querySelector("#submit").addEventListener("click", () => {
  const val = password.getValue();
  if (val.length < 8) {
    password.setError("Password must be at least 8 characters.");
  } else {
    password.clearError();
    // proceed with submit
  }
});
```

Toggle visibility (password reveal)
```js
const pwd = mountTextField("#pwd", { label: "Password", type: "password" });
document.querySelector("#toggle").addEventListener("click", () => {
  pwd.setType(pwd.getType() === "password" ? "text" : "password");
});
```

Customizing styles at runtime
```js
const field = mountTextField("#custom", { label: "Custom" });
field.inputEl.classList.add("border", "border-blue-300");
field.inputEl.classList.remove("ring-neutral-800");
```

Setting initial value without triggering onInput
```js
const name = mountTextField("#name", { label: "Name", onInput: console.log });
name.setValue("Alice", { silent: true });
```

## Behavioral notes

- Input uses autocomplete="off".
- setError("") or setError(null) acts like clearError().
- clearErrorOnInput only clears error; it does not perform validation.
- Unknown types in setType are ignored silently.
- destroy() cleans the container, removing all markup and listeners.

## Type hints (TypeScript-style)

```ts
type AllowedType = "text" | "email" | "password";

type Options = {
  type?: AllowedType;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string | number;
  onInput?: (e: { new_value: string }) => void;
  clearErrorOnInput?: boolean;
};

type API = {
  getValue(): string;
  setValue(next: string | number | null | undefined, opts?: { silent?: boolean }): void;
  getType(): AllowedType;
  setType(nextType: AllowedType): void;
  isDisabled(): boolean;
  disable(): void;
  enable(): void;
  focus(): void;
  blur(): void;
  clear(opts?: { silent?: boolean }): void;
  setLabel(text: string | null | undefined): void;
  setPlaceholder(text: string | null | undefined): void;
  setOnInput(fn: Options["onInput"]): void;
  setError(message: string | null | undefined): void;
  clearError(): void;
  hasError(): boolean;
  inputEl: HTMLInputElement;
  errorEl: HTMLElement | null;
  root: HTMLElement;
  destroy(): void;
};
```
