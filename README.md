# lipari-accounts-di-broken

Progetto Angular 19 standalone con **3 bug di Dependency Injection** da trovare e correggere.

## Avvio

```bash
npm install
ng serve
# oppure
ng serve --open
```

---

## Architettura

```
src/app/
├── core/
│   ├── config/account-api.config.ts   ← InjectionToken ACCOUNT_API_CONFIG (factory: private)
│   ├── models/account.model.ts        ← AccountSummary, MOCK_PRIVATE_SUMMARY, MOCK_BUSINESS_SUMMARY
│   ├── repositories/
│   │   ├── account.repository.ts      ← abstract class AccountRepository
│   │   └── http-account.repository.ts ← implementazione concreta (usa of(MOCK).pipe(delay(300)))
│   └── services/account.service.ts    ← providedIn:'root', inietta AccountRepository + ACCOUNT_API_CONFIG
└── features/
    ├── private/private-dashboard.component.ts
    └── business/business-dashboard.component.ts
```

**Flusso DI corretto (senza bug):**

```
Route injector
  └─ AccountService        (re-fornito per isolamento)
       ├─ AccountRepository → HttpAccountRepository  (concrete impl)
       └─ ACCOUNT_API_CONFIG                         (override per area)
```

---

## MISSIONE #1 — NullInjectorError su /private

### Sintomi

- Navigando su `/private` l'app crasha immediatamente.
- In DevTools → Console compare un errore simile a:
  ```
  ERROR NullInjectorError: R3InjectorError(Environment Injector)[AccountService -> AccountRepository]:
    NullInjectorError: No provider for AccountRepository!
  ```
- La schermata rimane vuota o mostra un errore Angular.

---

## MISSIONE #2 — Doppia istanza di AccountService

### Sintomi

- Anche dopo aver risolto la Missione #1, in DevTools → Console vedi il log `[AccountService] istanziato per area: "private"` che appare **due volte** quando navighi su `/private`.
- Angular DevTools → Component tree mostra **AccountService** sia nel nodo `EnvironmentInjector` (root) sia nel nodo `PrivateDashboardComponent`.
- Le due istanze non condividono stato: un eventuale cache/stato interno sarebbe duplicato.

---

## MISSIONE #3 — La dashboard Business usa l'endpoint Privato

### Sintomi

- Navigando su `/business` l'app non crasha, ma la dashboard mostra:
  - **Titolare: Mario Rossi** invece di *Lipari SRL*
  - **Area: private** invece di *business*
  - Il saldo e i conti sono quelli del profilo privato
- Il banner di debug in basso mostra `baseUrl = /api/private` e `area = private`.
- In DevTools → Console il log `[HttpAccountRepository] chiamata simulata a /api/private/summary → area: private` conferma l'endpoint sbagliato.

---

## Note tecniche

- **HttpClient** è configurato con `provideHttpClient()` in `main.ts`.
- Le chiamate HTTP sono **simulate** con `of(MOCK_DATA).pipe(delay(300))` nel repository — il delay rende visibile lo stato di caricamento.
- Il mock restituito dipende da `ACCOUNT_API_CONFIG.area`: se è `'business'` restituisce i dati di Lipari SRL, altrimenti quelli di Mario Rossi.
- `AccountRepository` è una classe astratta: non ha `providedIn` e deve essere fornita esplicitamente tramite `{ provide: AccountRepository, useClass: HttpAccountRepository }`.
