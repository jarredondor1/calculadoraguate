# Cotización multinivel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar un único PDF para varios niveles educativos bajo FLEX o EVOLUCIONA, con cálculo y desglose independiente por nivel; conservar INTEGRA como cotización individual.

**Architecture:** La función de cálculo existente aceptará un escenario opcional sin cambiar el resultado del simulador actual. El formulario de cotización construirá una lista de niveles activos y el PDF tendrá una rama específica para la propuesta multinivel, reutilizando las mismas utilidades visuales.

**Tech Stack:** HTML/CSS/JavaScript sin framework, pdf-lib local, pruebas con Node y Playwright.

---

### Task 1: Cálculos reutilizables

**Files:** Modify `index.html:144-153`; Test `tests/client.test.cjs`.

- [x] Add a browser test that compares the standalone calculator with a parameterized scenario for the same technology, equipment, students and terms, then checks a second scenario has different prices.
- [x] Run `npm test` and confirm the new test fails because `calculateScenario` is undefined.
- [x] Extract the current `calc()` body into `calculateScenario({tech, qty, students, bims, down, sm})`, replacing only DOM reads with the parameters. Keep `calc()` as a wrapper:

```js
function calc() {
  return calculateScenario({tech: $('tech').value, qty: +$('qty').value || 5,
    students: +$('students').value || 60, bims: +$('bims').value || 1,
    down: +$('down').value || .4, sm: +$('schoolMargin').value || .25});
}
```

- [x] Run `npm test`; all existing financial scenarios must remain unchanged.

### Task 2: Formulario y vista previa multinivel

**Files:** Modify `index.html:46-63`, `client.css:118-141`, `quote.js:1-86`; Test `tests/client.test.cjs`.

- [x] Add tests that open «Varios niveles», activate/deactivate levels, change technology/equipment/students and verify each subtotal and the consolidated total update; select INTEGRA and verify the multinivel option becomes unavailable.
- [x] Add scope selector, common terms selectors and four accessible level rows. The block configuration uses stable IDs:

```js
const LEVELS = [
  {id:'pre', label:'Preprimaria', tech:'TaleBot'},
  {id:'primary-low', label:'Primaria 1.º–3.º', tech:'Robot Master'},
  {id:'primary-high', label:'Primaria 4.º–6.º', tech:'Spike'},
  {id:'secondary', label:'Básicos y bachillerato', tech:'Spike'}
];
```

- [x] On mode/scope/input changes, recalculate each active level with `calculateScenario`, render per-level prices without IVA as primary and VAT-inclusive as secondary, then sum the matching offer fields. Require at least one active level and positive integer counts.
- [x] Run `npm test`; check modal layout at desktop and mobile widths.

### Task 3: PDF multinivel

**Files:** Modify `quote.js:88-410`; Test `tests/client.test.cjs`.

- [x] Add a test generating a multi-level PDF that checks page count, title, absence of internal cost terms and the separate sum for selected levels; test optional projection and INTEGRA isolation.
- [x] Build a multi-level branch in `makePdf` after its shared drawing helpers: page 1 summary, two vertical level blocks per following page, shared service page, optional projection page. Reuse `header`, `background`, `imageBox`, `money`, `paragraph` and `icon`.
- [x] Every level block shows its own technology, equipment, students, period, investment without IVA, VAT, total with IVA, initial payment and monthly payments. Sum unrounded values; format only at display time.
- [x] Run `npm test`; render A4 to PNG and inspect every page for clipping and alignment.

### Task 4: Documentation and final validation

**Files:** Modify `README.md`; Test `tests/client.test.cjs`.

- [x] Explain the separate individual and multinivel quote flows, pricing basis and optional projection in `README.md`.
- [x] Generate examples for FLEX, EVOLUCIONA 8 and EVOLUCIONA 16 with two and four levels. Confirm PDF text values against `calculateScenario` and verify no costs or GuateGeeks margin leak.
- [x] Run `npm test`, `git diff --check`, check working tree and update the existing PR branch.
