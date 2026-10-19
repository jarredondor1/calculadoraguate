# GuateGeeks — Simulador Comercial y Financiero

Simulador web estático para evaluar las modalidades comerciales de GuateGeeks:

- **INTEGRA** — adquisición directa del equipamiento + implementación inicial.
- **FLEX** — programa por renta, con el equipamiento en propiedad de GuateGeeks.
- **EVOLUCIONA 8** — programa de 8 meses con propiedad del equipamiento al finalizar.
- **EVOLUCIONA 16** — programa de 16 meses con propiedad del equipamiento al finalizar.

## Qué calcula

El simulador muestra:

- precios sin IVA y con IVA;
- costo equivalente por estudiante con y sin IVA;
- sugerencia de cobro mensual al estudiante;
- ingreso y ganancia bruta estimada para la institución educativa;
- costo directo, ganancia bruta y margen de GuateGeeks;
- pagos iniciales y cuotas para EVOLUCIONA;
- comparación de ofertas y referencia básica de mercado.

## Persistencia de campos

Los valores seleccionados se guardan localmente en el navegador mediante `localStorage`. Al recargar la página se recupera el último escenario utilizado en ese dispositivo y navegador.

Campos guardados: tecnología, oferta, cantidad de equipos, estudiantes, duración FLEX, pago inicial EVOLUCIONA y margen objetivo de la institución.

## Publicación

El proyecto no necesita compilación ni dependencias. Está preparado para GitHub Pages desde la rama `main` y la raíz del repositorio.

El logo de GuateGeeks está integrado directamente dentro de `index.html`, por lo que el sitio funciona como una página autocontenida.
