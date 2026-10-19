# Vista institucional conectada Implementation Plan

> **For agentic workers:** Use the approved design and execute the checklist in the OpenSpec change inline.

**Goal:** Presentar una propuesta institucional alimentada por el mismo escenario financiero que la vista interna.

**Architecture:** `index.html` mantiene controles, persistencia y cálculo; `client.js` recibe el resultado calculado para renderizar la vista; `client.css` contiene estilos propios. `assets/projects/` aloja recursos existentes y `tests/client.test.cjs` verifica el comportamiento en un navegador real.

**Tech Stack:** HTML, CSS, JavaScript, Node.js y Playwright para pruebas de desarrollo.

---

1. Crear pruebas de navegador que cambien tecnología, modalidad y cantidades y comparen precios; ejecutar y observar el fallo por ausencia del selector de vista.
2. Copiar recursos existentes y marcar como pendientes las tecnologías sin proyecto verificado.
3. Agregar selector de vista y render institucional con el mismo resultado de `calc()`, especificando condiciones y supuestos por modalidad.
4. Ejecutar pruebas de navegador y OpenSpec; revisar visualmente la vista en escritorio y móvil; documentar la limitación de confidencialidad.
