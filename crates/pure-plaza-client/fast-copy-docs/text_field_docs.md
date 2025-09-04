
# Dokumentacja komponentu TextField (mountTextField)

Lekki, framework-agnostyczny komponent pola tekstowego renderowany bezpośrednio do DOM. Zapewnia gotowy UI (klasy Tailwind), obsługę stanu, API do sterowania oraz bezpieczne podstawienie etykiety, placeholdera i wartości.

---

## Szybki start

```html
<div id="username"></div>
<script type="module">
  // Upewnij się, że masz dostępną funkcję escapeHtml (patrz niżej)
  import { mountTextField } from './your-file.js';

  const tf = mountTextField('#username', {
    label: 'Nazwa użytkownika',
    placeholder: 'Wpisz nazwę...',
    value: '',
    type: 'text',
    onInput: ({ new_value }) => {
      console.log('Nowa wartość:', new_value);
    },
  });

  // Przykład sterowania
  tf.focus();
  tf.setValue('bart', { silent: true });
</script>
```

---

## Podpis funkcji

```js
const api = mountTextField(selector, options?)
```

- selector: string (CSS selector elementu-korzenia)
- options: obiekt konfiguracyjny (patrz niżej)
- Zwraca: kontroler API komponentu (metody i referencje DOM)

Błąd: rzuca `Error`, jeśli nie znaleziono elementu dla podanego selektora.

---

## Opcje

- type: "text" | "email" | "password"
  - Domyślnie: "text"
  - Wartości spoza listy są ignorowane i zostanie użyty "text".
- label: string
  - Domyślnie: "Label"
- placeholder: string
  - Domyślnie: ""
- disabled: boolean
  - Domyślnie: false
- value: string | number | null | undefined
  - Domyślnie: ""
  - Wartość jest konwertowana do stringa; null/undefined → "".
- onInput: function
  - Podpis: ({ new_value: string }) => void
  - Wywoływana:
    - przy wpisywaniu przez użytkownika (input)
    - przy programowej zmianie `setValue(...)` i `clear(...)` (chyba że `silent: true`)

---

## Zwracane API

- getValue(): string
- setValue(next, { silent = false } = {}): void
  - Zmienia wartość pola; null/undefined → "".
  - Jeśli `silent` = false (domyślnie), emituje `onInput`.
- getType(): "text" | "email" | "password"
- setType(nextType): void
  - Akceptuje tylko dozwolone typy; inne wartości są ignorowane.
- isDisabled(): boolean
- disable(): void
  - Ustawia atrybut disabled (style oparte na klasach Tailwind już zaaplikowane).
- enable(): void
- focus(): void
- blur(): void
- clear({ silent = false } = {}): void
  - Czyści wartość do "" i (opcjonalnie) emituje `onInput`.
- setLabel(text): void
  - Podmienia treść <label>.
- setPlaceholder(text): void
  - Podmienia atrybut placeholder inputa.
- setOnInput(fn): void
  - Podmienia callback wywoływany przy zmianie wartości.
- inputEl: HTMLInputElement
  - Referencja do elementu <input>.
- root: HTMLElement
  - Referencja do elementu-korzenia przekazanego przez selector.
- destroy(): void
  - Zdejmuje nasłuchiwacze i czyści zawartość root.

---

## Struktura DOM generowana przez komponent

```html
<div class="flex flex-col gap-2">
  <label class="text-sm font-medium" for="input-XXXXXXXX">Label</label>
  <input
    id="input-XXXXXXXX"
    type="text"
    class="border-[3px] border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-700/75 bg-neutral-950 text-neutral-100 placeholder-neutral-500 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed w-full"
    placeholder=""
    autocomplete="off"
    value=""
  />
</div>
```

Uwaga: `XXXXXXXX` to losowy identyfikator przypisywany przy montażu.

---

## Stylowanie

- Komponent używa klas Tailwind CSS. Jeśli Tailwind nie jest obecny, nadal będzie działał funkcjonalnie, ale bez zamierzonego stylu.
- Możesz nadpisać style przez:
  - globalny CSS celujący w klasy,
  - wrapper z bardziej specyficznymi selektorami,
  - modyfikację implementacji, aby przyjmować klasy przez opcje (rozszerzenie własne).

---

## Zdarzenia i emisja

- Jedyny kanał zdarzeń to `onInput`.
- Semantyka:
  - Wejście użytkownika: emituje na każdy input.
  - Programowo:
    - `setValue(v)`: emituje, chyba że `{ silent: true }`
    - `clear()`: emituje, chyba że `{ silent: true }`
  - Payload: obiekt `{ new_value: string }`
- Błędy w `onInput` są łapane i logowane do `console.error`, aby nie przerwać działania komponentu.

---

## Dostępność (a11y)

- <label> jest powiązany z <input> przez atrybuty `for`/`id`.
- Atrybut `disabled` w pełni blokuje interakcję.
- Placeholder nie zastępuje etykiety – etykieta jest zawsze renderowana.
- Rozszerzenia (opcjonalne we własnej implementacji):
  - dodanie `aria-invalid`, `aria-describedby` itp.

---

## Przykłady

1) Pole tekstowe z walidacją e-mail (HTML5)
```js
const email = mountTextField('#email', {
  label: 'E-mail',
  type: 'email',
  placeholder: 'name@domain.com',
  onInput: ({ new_value }) => {
    const valid = !!new_value.match(/^\S+@\S+\.\S+$/);
    email.inputEl.style.borderColor = valid ? '#166534' : '#991b1b';
  }
});
```

2) Pole hasła z przełączaniem widoczności
```js
const pass = mountTextField('#pass', { label: 'Hasło', type: 'password' });
// ... np. po kliknięciu ikony oka:
function toggle() {
  pass.setType(pass.getType() === 'password' ? 'text' : 'password');
}
```

3) Zmiana wartości bez emisji zdarzenia
```js
const tf = mountTextField('#tf', { label: 'Ciche ustawienie' });
tf.setValue('nowa wartość', { silent: true });
```

4) Wyłączanie i włączanie
```js
tf.disable();
// ...
tf.enable();
```

5) Integracja z formularzem
```js
const nameField = mountTextField('#name', { label: 'Imię' });
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const value = nameField.getValue();
  console.log('Wysyłam:', value);
});
```

6) Sprzątanie (SPA / unmount)
```js
const ctrl = mountTextField('#node', { label: 'Do usunięcia' });
// ...
ctrl.destroy();
```

---

## Zachowanie brzegowe i uwagi

- Selector:
  - Używany jest `document.querySelector` – wybierze pierwszy dopasowany element.
  - Brak dopasowania → `Error` z czytelnym komunikatem.
- SSR / prerender:
  - Funkcja wymaga `document` i realnego DOM – uruchamiaj po `DOMContentLoaded` albo na końcu body.
- Typy:
  - Tylko "text" | "email" | "password" – inne wartości są ignorowane.
- Wartość:
  - `null` / `undefined` konwertowane do `""`.
  - Liczby i inne typy są konwertowane do stringa przez `String(...)`.
- Bezpieczeństwo:
  - Teksty (label, placeholder, value) są przechodzą przez `escapeHtml` – zapewnij obecność tej funkcji w środowisku.
- Styl:
  - Klasy Tailwind są „twardo zakodowane” – dla pełnej kontroli rozważ forka z opcją przekazywania klas.

---

## Typy (dla TypeScript – przykładowa definicja)

```ts
type AllowedType = 'text' | 'email' | 'password';

interface TextFieldOptions {
  type?: AllowedType;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string | number | null | undefined;
  onInput?: (e: { new_value: string }) => void;
}

interface TextFieldAPI {
  getValue(): string;
  setValue(next: unknown, opts?: { silent?: boolean }): void;
  getType(): AllowedType;
  setType(nextType: unknown): void;
  isDisabled(): boolean;
  disable(): void;
  enable(): void;
  focus(): void;
  blur(): void;
  clear(opts?: { silent?: boolean }): void;
  setLabel(text: unknown): void;
  setPlaceholder(text: unknown): void;
  setOnInput(fn: unknown): void;
  inputEl: HTMLInputElement;
  root: HTMLElement;
  destroy(): void;
}

declare function mountTextField(selector: string, options?: TextFieldOptions): TextFieldAPI;
```

---

## Diagnostyka

- `mountTextField: no element found for selector "..."` – upewnij się, że element istnieje w DOM w momencie wywołania.
- Callback `onInput` rzuca błędem – błąd zostanie zalogowany do konsoli; komponent będzie kontynuował działanie.

---

## Wymagania środowiskowe

- Przeglądarka/środowisko z DOM (document, querySelector).
- Globalna funkcja `escapeHtml` (lub wbuduj ją jak w przykładzie).
- Opcjonalnie Tailwind CSS dla pełnego stylu.
