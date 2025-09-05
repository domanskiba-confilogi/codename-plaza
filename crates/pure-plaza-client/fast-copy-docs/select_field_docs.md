# SelectField (mountSelectField) — wielokrotny wybór z wyszukiwaniem (Vanilla JS)

Komponent pólka wielokrotnego wyboru z wyszukiwarką, działający bez frameworków. Renderuje input, listę wyników i „chipsy” wybranych pozycji. Stylowanie oparte jest na klasach Tailwind CSS (działa też bez Tailwinda, ale będzie mniej estetyczne).

- Wybór wielu elementów
- Filtrowanie po wpisywaniu
- Obsługa klawiatury (Enter wybiera pierwszą pozycję)
- Zdarzenia CustomEvent oraz callbacki
- API do sterowania (disable/enable, clear, setItems, focus)
- Tryb disabled
- Łatwy mounting do dowolnego selektora

---

## Szybki start

HTML:
```html
<div id="skills"></div>
```

JS:
```js
// Upewnij się, że masz helper escapeHtml (patrz sekcja „Wymagania i uwagi”)
const items = [
  { value: 'js', displayText: 'JavaScript' },
  { value: 'ts', displayText: 'TypeScript' },
  { value: 'py', displayText: 'Python' },
];

const select = mountSelectField('#skills', items, {
  label: 'Wybierz technologie',
  placeholder: 'Szukaj...',
  onSelect: ({ value, item, chosen }) => console.log('Wybrane:', value, item, chosen),
  onRemove: ({ value, item, chosen }) => console.log('Usunięte:', value, item, chosen),
});

// Odczyt aktualnego wyboru
console.log(select.getChosen()); // np. []
```

---

## Wymagania i uwagi

- Wymagany kontener w DOM: element dopasowany przez `document.querySelector(selector)`.
- Funkcja `escapeHtml` musi być dostępna globalnie (używana do bezpiecznego wstrzykiwania label i placeholder). Przykład:
  ```js
  function escapeHtml(input) {
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  ```
- Stylowanie używa klas Tailwind CSS. Bez Tailwinda komponent zadziała, ale będzie wyglądał surowo.
- Wartości `item.value` powinny być porównywalne przez `===` (najlepiej prymitywy: string/number).
- Wbudowane teksty interfejsu są po polsku („Brak wyników”, aria-label „Usuń ...”).

---

## API: sygnatura i parametry

Sygnatura:
```js
const instance = mountSelectField(selector, items, options?);
```

Parametry:
- `selector` (string): selektor CSS kontenera, w którym komponent zostanie zamontowany. Przykład: `'#skills'`, `'.select-field'`.
- `items` (Array<{ value: any, displayText: string }>): lista dostępnych opcji.
  - `value`: identyfikator wartości (prymityw zalecany).
  - `displayText`: tekst wyświetlany w menu i na chipie.
- `options` (obiekt, opcjonalnie):
  - `label` (string, domyślnie: "Select items"): etykieta pola.
  - `placeholder` (string, domyślnie: "Search..."): placeholder inputu.
  - `disabled` (boolean, domyślnie: false): startowy stan disabled.
  - `onSelect` (fn): callback po wybraniu elementu.
  - `onRemove` (fn): callback po usunięciu z wyboru.

Wyjątki:
- Rzuca błąd, jeśli `selector` nie znajduje elementu.
- Rzuca błąd, jeśli `items` nie jest tablicą.

---

## Zdarzenia

Komponent emituje CustomEvent na elemencie root (kontenerze `selector`):

- `selectfield:select` — po dodaniu elementu
  - `event.detail`:
    - `value`: wybrana wartość
    - `item`: pełny obiekt `{ value, displayText }` (lub fallback)
    - `chosen`: bieżąca kopia tablicy wybranych wartości
- `selectfield:remove` — po usunięciu elementu
  - `event.detail`: jak wyżej
- `selectfield:change` — po każdej zmianie selekcji
  - `event.detail`:
    - `chosen`: kopia tablicy wybranych wartości

Uwaga: `onSelect` i `onRemove` z `options` wywoływane są dodatkowo (są niezależne od CustomEvent).

Syntactic sugar:
- Metody `instance.addEventListener(eventName, handler)` i `instance.removeEventListener` akceptują nazwę z lub bez prefiksu `selectfield:` (np. `'select'` albo `'selectfield:select'`).

Przykład:
```js
const unsubscribe = select.addEventListener('change', (e) => {
  console.log('Aktualny wybór:', e.detail.chosen);
});
// unsubscribe(); // aby odpiąć
```

---

## Publiczne metody instancji

- `getChosen(): any[]` — zwraca kopię wybranych wartości.
- `setItems(nextItems: {value, displayText}[])` — ustawia nową listę opcji.
  - Uwaga: aktualna implementacja nadpisuje selekcję tak, że wybiera wszystkie nowe wartości (patrz „Znane ograniczenia”).
  - Emisja: `selectfield:change`.
- `clear()` — usuwa wszystkie wybrane wartości.
  - Emisja: dla każdego usuniętego elementu: `remove` + `change`.
- `clearSearch()` — czyści wpisany tekst i filtr.
- `focus()` — ustawia focus na input (jeśli nie jest disabled).
- `disable()` — przełącza komponent w stan disabled (blokada UI i interakcji).
- `enable()` — odblokowuje komponent.
- `setDisabled(flag: boolean)` — jawne ustawienie stanu disabled.
- `isDisabled(): boolean` — sprawdza stan disabled.
- `addEventListener(eventName, handler): () => void` — dodaje nasłuch na CustomEvent (zwraca funkcję do wypięcia).
- `removeEventListener(eventName, handler)` — usuwa nasłuch dodany bezpośrednio.
- `setOnSelect(fn)` — runtime’owa podmiana callbacku `onSelect`.
- `setOnRemove(fn)` — runtime’owa podmiana callbacku `onRemove`.
- `destroy()` — odmontowuje komponent (usuwa nasłuchy i czyści `root.innerHTML`).

---

## Zachowanie i UX

- Filtrowanie:
  - Case-insensitive, `displayText` zawiera wpisany fragment.
  - Po wybraniu elementu input i filtr są czyszczone.
- Menu:
  - Pokazuje się przy kliknięciu/focusie w input.
  - Ukrywa się z opóźnieniem 150 ms po blur (aby umożliwić kliknięcie w opcję).
  - W treści „Brak wyników” gdy nic nie pasuje.
- Klawiatura:
  - Enter wybiera pierwszą pasującą pozycję (jeśli jest).
- Chipsy:
  - Pokazują wybrane elementy; przycisk X usuwa dany element.
  - W stanie disabled przyciski są nieaktywne.
- Disabled:
  - Input zablokowany, menu ukryte, brak reakcji na interakcje.
- i18n:
  - Teksty „Brak wyników”, aria-label „Usuń {nazwa}” są po polsku (na stałe w kodzie).

---

## Przykłady użycia

Podstawowy:
```js
const s = mountSelectField('#tags', [
  { value: 1, displayText: 'Frontend' },
  { value: 2, displayText: 'Backend' },
  { value: 3, displayText: 'DevOps' },
], { label: 'Tagi', placeholder: 'Szukaj tagów...' });
```

Obsługa zdarzeń:
```js
s.addEventListener('select', (e) => console.log('Dodano:', e.detail.item.displayText));
s.addEventListener('remove', (e) => console.log('Usunięto:', e.detail.item.displayText));
s.addEventListener('change', (e) => console.log('Wybrane:', e.detail.chosen));
```

Aktualizacja listy elementów:
```js
s.setItems([
  { value: 'a', displayText: 'Alpha' },
  { value: 'b', displayText: 'Beta' },
]);
// Uwaga: po setItems wybór = wszystkie nowe wartości ('a','b') zgodnie z aktualną implementacją.
```

Blokada/odblokowanie:
```js
s.disable();
// ...
s.enable();
```

Czyszczenie:
```js
s.clear();      // usuwa wszystkie wybrane wartości
s.clearSearch(); // czyści tylko filtr w input
```

Sprzątanie:
```js
s.destroy();
```

---

## Wskazówki dot. stylów

- Kontener zawiera wewnątrz wrapper z klasą `relative`, a menu ma `absolute top-[110%] left-0`. Zapewnij, że rodzic nie ma `overflow: hidden`, które ucina dropdown.
- Klasy Tailwind można dostosować modyfikując kod, jeśli potrzebujesz innego wyglądu.
- Ikona „X” to wbudowane SVG; można podmienić w kodzie `X_ICON_SVG`.

---

## Znane ograniczenia i pułapki

- setItems nadpisuje wybór: obecna logika ustawia `chosen` na „wszystkie dostępne wartości” po wywołaniu. To jest zachowane zgodnie z pierwowzorem i może zaskoczyć — jeżeli chcesz innego zachowania, owiń `setItems` własną logiką (np. zachowaj wspólną część dotychczasowego wyboru).
- Brak konfiguracji limitu liczby wyborów (wszystkie dozwolone).
- Twardo zakodowane polskie teksty („Brak wyników” i aria-label).
- Wymagany globalny `escapeHtml`. Brak definiowania tej funkcji spowoduje błąd w momencie montowania.
- `value` powinien być prymitywem; obiekty jako `value` mogą nie działać z `includes/indexOf` zgodnie z oczekiwaniami.

---

## Typy (przykładowe, TypeScript)

```ts
type SelectItem<Value = string> = {
  value: Value;
  displayText: string;
};

type SelectDetail<Value = string> = {
  value: Value;
  item: SelectItem<Value>;
  chosen: Value[];
};

type MountOptions<Value = string> = {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  onSelect?: (detail: SelectDetail<Value>) => void;
  onRemove?: (detail: SelectDetail<Value>) => void;
};

type SelectInstance<Value = string> = {
  getChosen: () => Value[];
  setItems: (items: SelectItem<Value>[]) => void;
  clear: () => void;
  clearSearch: () => void;
  focus: () => void;
  disable: () => void;
  enable: () => void;
  setDisabled: (flag: boolean) => void;
  isDisabled: () => boolean;
  addEventListener: (eventName: string, handler: (e: CustomEvent<any>) => void) => () => void;
  removeEventListener: (eventName: string, handler: (e: CustomEvent<any>) => void) => void;
  setOnSelect: (fn?: (detail: SelectDetail<Value>) => void) => void;
  setOnRemove: (fn?: (detail: SelectDetail<Value>) => void) => void;
  destroy: () => void;
};
```

---

## Sprzątanie (destroy)

Jeśli komponent jest montowany dynamicznie (np. w SPA) — przed usunięciem kontenera wywołaj `destroy()`:
```js
const inst = mountSelectField('#container', items);
// ...
inst.destroy(); // usuwa nasłuchy i czyści zawartość root.innerHTML
```
