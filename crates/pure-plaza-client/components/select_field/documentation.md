# SelectField — wielokrotny/jednokrotny wybór z wyszukiwaniem (Vanilla JS)

Lekki komponent oparty o czysty JavaScript, renderujący pole wyboru z:
- filtrowaniem po tekście,
- wyborem wielu pozycji (chipsy) lub trybem pojedynczym,
- zdarzeniami CustomEvent i/lub callbackami,
- pełnym API do sterowania w runtime.

Uwaga: komponent używa klas Tailwind CSS w markup (możesz je zastąpić własnymi). W kodzie pojawia się twardo zakodowany tekst “Brak wyników” oraz aria-label “Usuń …” w języku polskim.

## Szybki start

HTML:
```html
<div id="my-select"></div>
```

JavaScript:
```js
const items = [
  { value: 1, displayText: 'Jabłko' },
  { value: 2, displayText: 'Gruszka' },
  { value: 3, displayText: 'Banany' },
];

const select = mountSelectField('#my-select', items, {
  label: 'Wybierz owoce',
  placeholder: 'Szukaj…',
  onSelect: ({ value, item, chosen }) => console.log('SELECT', value, item, chosen),
  onRemove: ({ value, item, chosen }) => console.log('REMOVE', value, item, chosen),
});

document.querySelector('#my-select')
  .addEventListener('selectfield:change', (e) => {
    console.log('CHANGE', e.detail.chosen);
  });
```

## Wymagania i założenia

- Środowisko: przeglądarka (DOM).
- Selektor CSS musi wskazywać istniejący element. W przeciwnym razie zostanie rzucony błąd.
- Parametr items musi być tablicą obiektów { value, displayText }, inaczej zostanie rzucony błąd.
- Funkcja globalna escapeHtml musi być dostępna (jest używana do sanityzacji label i placeholder).
- Komponent nadpisuje (innerHTML) zawartość wskazanego kontenera (root).
- Stylowanie używa klas Tailwind. Jeśli nie używasz Tailwind, podmień klasy lub dodaj własny CSS.
- Menu jest pozycjonowane absolutnie (z-index: 10) względem kontenera; upewnij się, że kontener nie ma overflow: hidden, które utnie listę.

## API montażu

```js
const instance = mountSelectField(selector, items, options?)
```

- selector: string — selektor CSS root-a (np. '#my-select').
- items: Array<{ value: any, displayText: string }> — lista dostępnych opcji.
- options?: 
  - label?: string = 'Select items'
  - placeholder?: string = 'Search...'
  - disabled?: boolean = false
  - multiple?: boolean = true  // inicjalny tryb wyboru
  - onSelect?: (detail) => void
  - onRemove?: (detail) => void

Uwaga: tekst “Brak wyników” (pusty stan) oraz aria-label na przycisku usuwania chipów są w kodzie na stałe po polsku.

## Obiekt zwracany (metody publiczne)

- getChosen(): any[] — zwraca kopię aktualnie wybranych wartości.
- setChosen(newValues: any[]): void — programowo ustawia wybory:
  - usuwa poprzednie (emituje 'remove' dla usuwanych),
  - wybiera nowe (emituje 'select'),
  - wymusza limit w trybie pojedynczym,
  - emituje 'selectfield:change'.
- setItems(nextItems: { value, displayText }[]): void — podmienia listę opcji:
  - czyści wybór (emituje 'remove' dla usuniętych),
  - ustawia nowe items,
  - wymusza limit w trybie pojedynczym,
  - emituje 'selectfield:change'.
- getItems(): { value, displayText }[] — kopia aktualnej listy opcji.
- clear(): void — usuwa wszystkie wybory, czyści wyszukiwarkę; emituje 'remove' dla każdego usuniętego.
- clearSearch(): void — czyści wyłącznie tekst wyszukiwania.
- focus(): void — focus na input (jeśli nie disabled).
- disable(): void — ustawia disabled = true (ukrywa menu, blokuje interakcje).
- enable(): void — ustawia disabled = false.
- setDisabled(flag: boolean): void — bezpośrednie ustawienie disabled.
- isDisabled(): boolean — aktualny stan disabled.
- addEventListener(eventName, handler): () => void — sugar dla addEventListener na root:
  - automatycznie prefiksuje eventy 'selectfield:' jeśli brak,
  - zwraca funkcję wypisania (unsubscribe).
- removeEventListener(eventName, handler): void — sugar dla removeEventListener.
- setOnSelect(fn | null): void — runtime’owa podmiana callbacku onSelect.
- setOnRemove(fn | null): void — runtime’owa podmiana callbacku onRemove.
- setMultiple(flag: boolean): void — przełącza tryb pojedynczy/wielokrotny:
  - wchodząc w single, przycina wybór do jednego i emituje 'remove' dla odrzuconych.
- isMultiple(): boolean — aktualny tryb.
- destroy(): void — usuwa nasłuchy i czyści root.innerHTML.

## Zdarzenia

Komponent emituje CustomEvent-y na elemencie root.

- selectfield:select
  - detail: { value, item, chosen }
  - value: wybrane value
  - item: dopasowany obiekt z items (lub fallback { value, displayText: String(value) })
  - chosen: kopia aktualnie wybranych wartości po zdarzeniu
- selectfield:remove
  - detail: { value, item, chosen } — analogicznie
- selectfield:change
  - detail: { chosen } — emituje się po każdej zmianie zbioru wybranych

Dodatkowo, jeśli przekazano options.onSelect / options.onRemove lub ustawiono setOnSelect / setOnRemove, te callbacki też zostaną wywołane przy odpowiednich zdarzeniach.

Sugar addEventListener normalizuje nazwy: addEventListener('select', fn) jest równoznaczne z addEventListener('selectfield:select', fn).

## Zachowanie i UX

- Filtrowanie: case-insensitive, po displayText, z pominięciem już wybranych.
- Enter w polu input: wybiera pierwszą pasującą pozycję.
- Klik w input/focus: otwiera menu.
- Blur: menu chowa się po 150 ms (aby klik w opcję zdążył się zarejestrować).
- Tryb pojedynczy:
  - wybór zastępuje poprzedni, menu zamyka się i nie otwiera automatycznie,
  - mechanizm enforceSelectionLimit dba o to, by pozostał tylko jeden wybór.
- Tryb wielokrotny:
  - po wyborze menu otwiera się ponownie z krótkim opóźnieniem (50 ms), a fokus wraca do inputa.
- Dostępność:
  - label połączony z input (for/id),
  - przyciski usuwania chipów mają aria-label,
  - lista opcji to przyciski w div-ie (bez roli listbox) — rozbudowa ARIA jest możliwa w Twojej implementacji.

## Przykłady

1) Podstawowy multi-select
```js
const fruits = [
  { value: 'apple', displayText: 'Jabłko' },
  { value: 'pear', displayText: 'Gruszka' },
  { value: 'banana', displayText: 'Banany' },
];

const api = mountSelectField('#fruits', fruits, {
  label: 'Owoce',
  placeholder: 'Szukaj owocu…',
});

api.addEventListener('change', (e) => {
  console.log('Wybrane:', e.detail.chosen);
});
```

2) Tryb pojedynczy (single)
```js
const api = mountSelectField('#single', fruits, {
  label: 'Ulubiony owoc',
  placeholder: 'Wpisz…',
  multiple: false,
});
api.setChosen(['pear']); // ustawia wybór programowo (w single i tak zostanie jeden)
```

3) Dynamiczna podmiana listy
```js
api.setItems([
  { value: 'cherry', displayText: 'Wiśnia' },
  { value: 'plum', displayText: 'Śliwka' },
]);
// Zdarzenie 'change' zostanie wyemitowane, a poprzednie wybory usunięte.
```

4) Wyłączenie/aktywacja
```js
api.disable();
// … później
api.enable();
```

5) Praca z formularzem (hidden input)
```js
const hidden = document.querySelector('#fruits-hidden');
api.addEventListener('change', (e) => {
  hidden.value = JSON.stringify(e.detail.chosen);
});
```

6) Odsubskrybowanie listenera
```js
const off = api.addEventListener('select', (e) => console.log('Wybrano', e.detail.value));
// …
off(); // usuwa nasłuch
```

## Modyfikacja tekstów (i18n)

- Label i placeholder można ustawić przez options.
- Tekst pustej listy “Brak wyników” oraz aria-label “Usuń …” są twardo zakodowane w kodzie:
  - renderMenu() tworzy element z tekstem 'Brak wyników'.
  - Przyciski usuwania chipów mają aria-label “Usuń ${displayText}”.
- Jeśli potrzebujesz pełnej internacjonalizacji, rozważ:
  - dodanie nowych opcji (np. emptyText, removeAriaLabelFormatter),
  - lub modyfikację źródeł komponentu.

## Stylowanie

- Kluczowe hooki w DOM:
  - root (kontener), w nim:
    - label
    - .chips — kontener na chipy (ukrywany/ujawniany przez klasę 'hidden')
    - input — pole wyszukiwania
    - .menu — lista opcji (absolute, z-index 10, ukrywana klasą 'hidden')
- Domyślne klasy Tailwind opisują tło, obramowanie, stany focus/hover.
- Możesz:
  - podmienić klasy w kodzie, lub
  - nadpisać je CSS-em, lub
  - zintegrować z własną skalą kolorów/tematem.

## Błędy i diagnostyka

- mountSelectField: no element found for selector "…"
  - selector wskazuje nieistniejący element.
- "items" must be an array of { value, displayText }
  - przekazano niewłaściwy typ dla items.
- ReferenceError: escapeHtml is not defined
  - upewnij się, że globalna funkcja escapeHtml istnieje (patrz Szybki start).
- W trakcie wyboru w konsoli pojawiają się logi console.info (Chosen item with value: …) — usuń je w kodzie, jeśli nie chcesz logów.

## Wewnętrzne szczegóły działania (dla integratorów)

- Obsługa klawiatury:
  - Enter wybiera pierwszy dopasowany element.
  - Nie ma nawigacji strzałkami po liście (można rozbudować).

## Sprzątanie

- Wywołaj instance.destroy(), aby:
  - odpiąć wszystkie nasłuchy z inputa,
  - opróżnić root.innerHTML.
- Po destroy nie używaj metod instancji.
