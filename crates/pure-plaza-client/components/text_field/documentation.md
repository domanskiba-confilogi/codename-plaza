# mountTextField — dokumentacja komponentu

Lekki komponent JavaScript do montowania dostępnego pola tekstowego z etykietą, obsługą błędów, sterowaniem programistycznym i prostym API. Domyślnie używa klas Tailwind CSS do stylowania.

## Co robi komponent
- Renderuje kontrolkę formularza: etykieta + input + kontener błędu.
- Wspiera typy: text, email, password (automatyczny fallback do "text").
- Zapewnia kompletne API do: odczytu/zapisu wartości, zmiany typu, włączania/wyłączania, zarządzania fokusem, czyszczenia, ustawiania etykiety/placeholdera, podpięcia callbacków i obsługi błędów.

## Szybki start
HTML:
```html
<div id="username-field"></div>
```

JavaScript:
```js
const tf = mountTextField('#username-field', {
  label: 'Nazwa użytkownika',
  placeholder: 'Wpisz nazwę...',
  type: 'text',
  value: '',
  clearErrorOnInput: true,
  onInput: ({ new_value }) => {
    console.log('Nowa wartość:', new_value);
  },
});

// Programistyczna zmiana wartości
tf.setValue('bart', { silent: false });

// Ustawienie błędu walidacji
tf.setError('To pole jest wymagane');
```

## Opcje (options)
- type: "text" | "email" | "password"
  - Domyślnie: "text". Niepoprawna wartość => fallback do "text".
- label: string
  - Domyślnie: "Label".
- placeholder: string
  - Domyślnie: "".
- disabled: boolean
  - Domyślnie: false.
- value: string | number | null | undefined
  - Wewnętrznie rzutowane do string. Domyślnie: "".
- onInput: function
  - Podpis: ({ new_value: string }) => void
  - Błąd wewnątrz callbacku nie zatrzyma komponentu; błąd jest logowany w konsoli.
- clearErrorOnInput: boolean
  - Nowość: automatycznie usuwa błąd przy zdarzeniu "input". Domyślnie: false.

## API zwracane
- getValue(): string
- setValue(next: any, opts?: { silent?: boolean }): void
  - Rzutuje next do string. Jeśli silent=false (domyślnie), wyemituje onInput.
- getType(): "text" | "email" | "password"
- setType(nextType: string): void
  - Ignoruje nieobsługiwane typy.
- isDisabled(): boolean
- disable(): void
- enable(): void
- focus(): void
- blur(): void
- clear(opts?: { silent?: boolean }): void
  - Czyści wartość do "" i opcjonalnie emituje onInput.
- setLabel(text: any): void
- setPlaceholder(text: any): void
- setOnInput(fn: (({ new_value }: { new_value: string }) => void) | null): void
- setError(message: any): void
  - Pusty/null/whitespace => wywoła clearError().
- clearError(): void
- hasError(): boolean
- inputEl: HTMLInputElement
- errorEl: HTMLParagraphElement
- root: HTMLElement
- destroy(): void
  - Usuwa nasłuchiwacze i czyści root.innerHTML.

## Obsługa błędów i style
- setError(message):
  - Ustawia treść błędu, pokazuje element błędu, dodaje style "error ring", ustawia aria-invalid="true" i aria-describedby=errorId.
- clearError():
  - Czyści treść błędu, ukrywa element błędu, przywraca style zwykłe, usuwa aria-invalid i aria-describedby (jeśli zostało ustawione przez błąd).
- clearErrorOnInput:
  - Jeśli true, każde zdarzenie "input" i istniejący błąd => automatyczne clearError().
- Style pierścieni (Tailwind):
  - Normalnie: ring-neutral-800, focus:ring-blue-400/60
  - Błąd: ring-red-500/70, focus:ring-red-500/70

## Zdarzenia i emisja wartości
- Emisja odbywa się przez callback onInput(cfg.onInput) z obiektem: { new_value: string }.
- Emitowane momenty:
  - Interakcja użytkownika: input event.
  - setValue(next, { silent: false }) i clear({ silent: false }).
- Uwaga: setValue/clear z silent: true nie wywoła onInput.

## Przykłady użycia

1) Pole e-mail z walidacją prostą
```js
const email = mountTextField('#email', {
  label: 'Adres e-mail',
  type: 'email',
  placeholder: 'name@domain.com',
  clearErrorOnInput: true,
  onInput: ({ new_value }) => {
    // Prosta walidacja
    if (!/^\S+@\S+\.\S+$/.test(new_value)) {
      email.setError('Podaj poprawny adres e-mail');
    } else {
      email.clearError();
    }
  },
});
```

2) Hasło z przełączaniem typu
```js
const pwd = mountTextField('#password', {
  label: 'Hasło',
  type: 'password',
});

document.querySelector('#toggle-visibility').addEventListener('click', () => {
  pwd.setType(pwd.getType() === 'password' ? 'text' : 'password');
  pwd.focus();
});
```

3) Programistyczne włączanie/wyłączanie
```js
const tf = mountTextField('#field', { label: 'Imię', disabled: true });
tf.enable();  // odblokuj
tf.disable(); // zablokuj
```

4) Integracja z walidacją przed wysłaniem formularza
```js
const nameTf = mountTextField('#name', { label: 'Imię i nazwisko', clearErrorOnInput: true });

document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = nameTf.getValue().trim();

  if (!val) {
    nameTf.setError('To pole jest wymagane');
    nameTf.focus();
    return;
  }

  // ...submit logic
});
```

5) Ustawienie wartości bez emisji zdarzenia
```js
const tf = mountTextField('#silent', { label: 'Ciche ustawienie' });
tf.setValue('predefiniowane', { silent: true }); // nie wywoła onInput
```
