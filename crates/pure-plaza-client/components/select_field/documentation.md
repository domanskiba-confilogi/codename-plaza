# SelectField (vanilla JS) – dokumentacja

Komponent wielokrotnego/jednokrotnego wyboru z wyszukiwaniem, pisany w czystym JavaScript, bez zależności od frameworków. Renderuje pole tekstowe z menu opcji, chipy wybranych elementów oraz udostępnia bogate API i zdarzenia `CustomEvent`.

- Wbudowane wyszukiwanie (filtrowanie “contains”, case-insensitive)
- Tryb multi i single (przełączany w locie)
- API do włączania/wyłączania, czyszczenia, zmiany listy opcji
- Emisja zdarzeń: select, remove, change
- Stylowanie oparte na klasach Tailwind (można zastąpić własnym CSS)

---

## Szybki start

HTML:
```html
<div id="my-select"></div>
```

JavaScript:
```js
// 1) Dane pozycji
const items = [
  { value: 'apple',  displayText: 'Apple' },
  { value: 'banana', displayText: 'Banana' },
  { value: 'cherry', displayText: 'Cherry' },
];

// 2) Montaż
const api = mountSelectField('#my-select', items, {
  label: 'Select fruits',
  placeholder: 'Type to search...',
  multiple: true, // domyślnie true
  onSelect: ({ value, item, chosen }) => console.log('selected:', value, item, chosen),
  onRemove: ({ value, item, chosen }) => console.log('removed:', value, item, chosen),
});

// 3) Nasłuchiwanie zdarzeń (opcjonalnie)
const root = document.querySelector('#my-select');
root.addEventListener('selectfield:change', (e) => {
  console.log('current chosen:', e.detail.chosen);
});
```

---

## Funkcja montująca

```js
mountSelectField(selector, items, options?)
```

- `selector` (string) – selektor CSS elementu-korzenia, do którego komponent zostanie zamontowany.
- `items` (Array) – tablica obiektów `{ value, displayText }`.
  - Zalecane, aby `value` był prymitywem (string/number/boolean) – patrz “Uwagi i ograniczenia”.
- `options` (obiekt, opcjonalny):
  - `label` (string, domyślnie: "Select items") – etykieta pola.
  - `placeholder` (string, domyślnie: "Search...") – placeholder inputu.
  - `disabled` (boolean, domyślnie: false) – startowy stan wyłączony.
  - `multiple` (boolean, domyślnie: true) – tryb wielokrotnego wyboru.
  - `onSelect(detail)` (function) – callback przy wyborze; patrz “Zdarzenia”.
  - `onRemove(detail)` (function) – callback przy usunięciu; patrz “Zdarzenia”.

Zwraca obiekt Public API (patrz niżej).

Błędy rzucane przy montażu:
- Gdy `selector` nie znajduje elementu.
- Gdy `items` nie jest tablicą o strukturze `{ value, displayText }`.

---

## Struktura DOM, którą generuje komponent

Do elementu `root` (pasującego do `selector`) wstrzykiwany jest następujący markup:

```html
<div class="flex flex-col gap-2 relative group">
  <label class="text-sm font-medium" for="{auto_id}">...</label>
  <div class="chips flex flex-row gap-2 w-full flex-wrap hidden"></div>
  <input id="{auto_id}" type="text" class="..." placeholder="..." autocomplete="off" />
  <div class="menu flex-col hidden w-full absolute top-[110%] left-0 max-h-[150px] overflow-auto rounded-xl shadow-lg shadow-black/30"></div>
</div>
```

- `chips` – kontener na wybrane elementy.
- `menu` – rozwijane menu z wynikami filtrowania.

Id inputu (`{auto_id}`) generowane jest losowo, aby powiązać label z polem.

---

## Stylowanie

- Użyte klasy pochodzą z Tailwind CSS. Komponent będzie działał bez Tailwinda, ale wymaga własnego CSS, aby wyglądał jak w przykładach.
- Menu jest pozycjonowane absolutnie pod inputem (`top-[110%]`); upewnij się, że kontener ma wystarczającą przestrzeń lub zarządzaj overflow.

---

## Public API

Obiekt zwracany przez `mountSelectField`:

- `getChosen(): string[] | number[] | boolean[]`
  - Zwraca kopię tablicy wybranych wartości.
- `setItems(nextItems: { value, displayText }[])`
  - Ustawia nową listę elementów.
  - Ważne: resetuje zaznaczenie do “wszystkie dostępne wartości”. W trybie single natychmiast redukuje do jednego wyboru (pierwszy z listy).
  - Emituje `selectfield:change`.
- `clear()`
  - Czyści wszystkie zaznaczenia, resetuje wyszukiwanie, emituje `remove` dla każdego usuniętego oraz odpowiednie `change`.
- `clearSearch()`
  - Czyści tylko bieżące zapytanie w polu wyszukiwania i odświeża menu.
- `focus()`
  - Ustawia focus na polu (jeśli nie jest disabled).
- `disable()`, `enable()`, `setDisabled(flag: boolean)`, `isDisabled(): boolean`
  - Zarządzanie stanem wyłączonym.
- `addEventListener(eventName, handler): () => void`
  - Syntactic sugar na `root.addEventListener`. Możesz podać nazwę z lub bez prefiksu `selectfield:`:
    - `addEventListener('select', fn)` równoważne `addEventListener('selectfield:select', fn)`
  - Zwraca funkcję do wypisania (unsubscribe).
- `removeEventListener(eventName, handler)`
  - Usuwa nasłuchiwanie.
- `setOnSelect(fn)`, `setOnRemove(fn)`
  - Podmienia callbacki podane w `options` w trakcie działania.
- `setMultiple(flag: boolean)`
  - Przełącza tryb single/multiple. Wejście w tryb single natychmiast redukuje liczbę wyborów do 1 i emituje `remove` dla odrzuconych.
- `isMultiple()`
  - Zwraca boolean czy użytkownik może wybrać wiele wartości czy jedną.
- `destroy()`
  - Zdejmuje nasłuchy, czyści markup (`root.innerHTML = ''`).

---

## Zdarzenia

Komponent emituje `CustomEvent` na elemencie `root`.

Dostępne typy:
- `selectfield:select`
  - detail: `{ value, item, chosen }`
  - `item` to obiekt z `items`; jeśli nie znaleziony, fallback `{ value, displayText: String(value) }`
  - Wywołuje także callback `onSelect`.
  - Dodatkowo, po select, emitowany jest również `selectfield:change`.
- `selectfield:remove`
  - detail: `{ value, item, chosen }`
  - Wywołuje także callback `onRemove`.
  - Dodatkowo emitowany `selectfield:change`.
- `selectfield:change`
  - detail: `{ chosen }` – aktualny snapshot wybranych wartości.

Przykład nasłuchiwania:
```js
const root = document.querySelector('#my-select');

root.addEventListener('selectfield:select', (e) => {
  console.log('Selected:', e.detail.value, e.detail.item, e.detail.chosen);
});

root.addEventListener('selectfield:remove', (e) => {
  console.log('Removed:', e.detail.value);
});

root.addEventListener('selectfield:change', (e) => {
  console.log('Chosen now:', e.detail.chosen);
});
```

Uwaga: `clear()` wywołuje `remove` wielokrotnie (dla każdego elementu), więc `change` również pojawi się wielokrotnie.

---

## Zachowanie i UX

- Wpisywanie w input:
  - Otwiera menu i filtruje wyniki po `displayText` (case-insensitive, zawiera).
- Klawisz Enter:
  - Wybiera pierwszy element z przefiltrowanej listy.
- Kliknięcie w input lub fokus:
  - Otwiera menu.
- Rozmycie (blur) inputu:
  - Zamyka menu po opóźnieniu 150 ms (żeby klik w menu się zarejestrował).
- Tryb single:
  - Wybór wartości zastępuje poprzednią (emisja `remove` dla zastąpionej, jeśli inna).
  - Menu nie otwiera się ponownie automatycznie po wyborze.
- Tryb multiple:
  - Kolejne wybory są dodawane do listy chipów.
  - Po wyborze menu wraca po chwili, by umożliwić szybkie wybieranie kolejnych.
- Usuwanie chipów:
  - Każdy chip ma przycisk “X”; klik usuwa wartość i emituje `remove`.

---

## i18n i dostępność

- Teksty:
  - Domyślne label: “Select items” (konfigurowalne przez `options.label`).
  - Domyślny placeholder: “Search...” (konfigurowalny przez `options.placeholder`).
  - Tekst pustego menu: “Brak wyników” – obecnie zakodowany na stałe (PL). Zmienisz go edytując źródło (linia renderująca “Brak wyników”).
  - Aria-label przycisku usuwania chipu: “Usuń {displayText}” – zakodowane na stałe (PL).
- A11y:
  - Label jest powiązany z inputem via `for`/`id`.
  - Przycisk usuwania ma `aria-label`.
  - Klawiatura: Enter wybiera pierwszy wynik. Dalsza nawigacja klawiaturą w menu nie jest zaimplementowana (możesz rozszerzyć).

---

## Bezpieczeństwo i zależności

- Funkcja używa globalnego `escapeHtml(...)` dla `label` i `placeholder`.
- Dla chipów i pozycji menu używane są `createElement` i `textContent`, co domyślnie neutralizuje HTML w `displayText`.

---

## Wymagania i kompatybilność

- Przeglądarki: współczesne przeglądarki z obsługą `CustomEvent`, `classList`, `Element.closest`, `Set`, `Array.prototype.includes`.
- Jeśli musisz wspierać starsze środowiska, rozważ polyfill `CustomEvent`.
- Brak zewnętrznych zależności JS. Stylowanie w przykładzie bazuje na Tailwind – opcjonalne.

---

## Przykłady

1) Multi-select z nasłuchem zdarzeń:
```js
const api = mountSelectField('#users', [
  { value: 1, displayText: 'Alice' },
  { value: 2, displayText: 'Bob' },
  { value: 3, displayText: 'Carol' },
], {
  label: 'Assign users',
  placeholder: 'Filter users...',
  multiple: true,
});

const root = document.querySelector('#users');
root.addEventListener('selectfield:change', (e) => {
  // Zapisz do formularza, synchronizuj z backendem, itp.
  console.log('Selected user IDs:', e.detail.chosen);
});
```

2) Single-select z przełączaniem trybu w locie:
```js
const api = mountSelectField('#country', [
  { value: 'pl', displayText: 'Poland' },
  { value: 'de', displayText: 'Germany' },
  { value: 'fr', displayText: 'France' },
], { multiple: false });

document.querySelector('#toggle-mode').addEventListener('click', () => {
  api.setMultiple(true);  // zmień na multi
});
```

3) Wymiana listy elementów:
```js
// Uwaga: setItems wybiera wszystkie wartości (w single zredukuje do 1)
api.setItems([
  { value: 'it', displayText: 'Italy' },
  { value: 'es', displayText: 'Spain' },
  { value: 'pt', displayText: 'Portugal' },
]);

console.log(api.getChosen()); // ["it", "es", "pt"] w multi; ["it"] w single
```

4) Disable/Enable i czyszczenie:
```js
api.disable();
api.enable();
api.clear(); // usunie wszystkie chipy i wyemituje remove + change
```

5) Odsubskrybowanie z sugar-API:
```js
const off = api.addEventListener('change', (e) => {
  console.log('Changed:', e.detail.chosen);
});
// ...
off(); // przestaje nasłuchiwać
```

---

## Uwagi i ograniczenia

- Wartości `value`:
  - Używana jest porównawcza zgodność `===` oraz `Set`. Zalecane prymitywy (string/number/boolean). Unikaj obiektów/funkcji jako `value`.
- `setItems(...)`:
  - Obecna implementacja celowo ustawia jako “wybrane” wszystkie nowe wartości. Jeśli chcesz wprowadzić selekcję programatyczną, rozważ:
    - Wywołać `setItems`, potem `clear()`, a następnie umożliwić użytkownikowi wybór ręcznie (brak publicznego API do “dodaj wyboru” poza interfejsem użytkownika).
    - Lub rozszerzyć komponent o metodę `setChosen(values)` (wymaga modyfikacji źródła).
- Lokalizacja:
  - “Brak wyników” i aria-label “Usuń ...” są zakodowane po polsku. Zmień w źródle dla pełnej i18n.
- Wydajność zdarzeń:
  - `clear()` emituje wiele `remove`/`change`. Jeśli zależy Ci na jednym zbiorczym `change`, opakuj operację w logikę po swojej stronie.
- Logi:
  - Wybór elementu loguje do konsoli `console.info`. Usuń/zmień, jeśli to niepożądane.

---

## Minimalne API TypeScript (informacyjne)

```ts
type SelectItem = { value: string | number | boolean; displayText: string };

type SelectDetail = {
  value: SelectItem['value'];
  item: SelectItem;
  chosen: SelectItem['value'][];
};

type Options = {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  onSelect?: (d: SelectDetail) => void;
  onRemove?: (d: SelectDetail) => void;
};

declare function mountSelectField(
  selector: string,
  items: SelectItem[],
  options?: Options
): {
  getChosen(): SelectItem['value'][];
  setItems(nextItems: SelectItem[]): void;
  clear(): void;
  clearSearch(): void;
  focus(): void;
  disable(): void;
  enable(): void;
  setDisabled(flag: boolean): void;
  isDisabled(): boolean;
  addEventListener(
    eventName: 'select' | 'remove' | 'change' | `selectfield:${string}`,
    handler: (e: CustomEvent<any>) => void
  ): () => void;
  removeEventListener(
    eventName: string,
    handler: (e: CustomEvent<any>) => void
  ): void;
  setOnSelect(fn?: (d: SelectDetail) => void): void;
  setOnRemove(fn?: (d: SelectDetail) => void): void;
  setMultiple(flag: boolean): void;
  isMultiple(): bool;
  destroy(): void;
};
```
