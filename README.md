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

## Presentación para la institución

El selector **Presentar como** permite alternar entre la vista interna y la vista para la institución. Ambas utilizan el mismo escenario: los cambios en tecnología, modalidad, cantidad de equipos, estudiantes y condiciones de pago actualizan la propuesta en vivo.

En la vista institucional, **Ocultar vista interna** activa el modo de presentación: oculta los botones de cambio de vista mientras el escenario sigue siendo editable. Para recuperarlos, selecciona **Salir de presentación**. El modo se conserva al recargar en esa pestaña y no constituye una medida de seguridad.

La vista institucional destaca la inversión sin IVA y muestra el total con IVA junto a ella, además del IVA, importe por estudiante, condiciones de pago y propiedad, el alcance educativo y una referencia visual de proyecto. Los pagos iniciales y las cuotas mostrados incluyen IVA. La estimación de ingresos y contribución del colegio puede abrirse dentro de cada modalidad; es una proyección bruta con supuestos, no una utilidad neta. Cuando se comparan las modalidades, cada una conserva sus propios resultados.

La ficha de CiudadBots enlaza al programa disponible; la referencia del Robot Cartógrafo conserva su atribución original a Ignat Khlebnikov / RoboRiseIT. Las fichas de robótica para pequeños y primaria muestran fotografías de equipos proporcionadas por GuateGeeks y actividades ilustrativas cuyo alcance debe confirmarse. La imagen de drones es una ilustración generada, inspirada en un dron educativo pequeño; el equipo y la actividad se confirman en la propuesta. Las fichas de electrónica y realidad virtual son referencias del catálogo de programas próximos y proceden del portal educativo de GuateGeeks.

La sección del programa presenta **Socrates Aprende** mediante un recorrido animado compuesto por capturas reales de la semana 1, que se puede pausar, y enlaza a la plataforma. La muestra observada corresponde a sexto primaria; la disponibilidad de otros grados debe confirmarse en Socrates. La animación es una vista previa, no una conexión de datos con el simulador.

La pantalla institucional oculta los costos y márgenes internos, pero **no protege su confidencialidad**: se encuentran en el HTML y JavaScript publicados por GitHub Pages. Para protegerlos es necesario restringir o separar el simulador interno y sus datos mediante una solución de acceso adecuada.

## Propuesta compartible para Colegio Costa Sur

La ruta `/colegio-costa-sur/` presenta una oferta EVOLUCIONA de 8 meses para 5 equipos y 60 estudiantes. Muestra una cuota sugerida de Q 200 por estudiante al mes; el colegio puede editar la cuota y la cantidad de estudiantes para estimar sus ingresos y la diferencia bruta después de pagar la inversión cotizada con IVA. El precio de esta propuesta permanece fijo al cambiar el tamaño del grupo. La página carga únicamente los datos aprobados para esta cotización y no incluye el margen objetivo ni los costos internos de GuateGeeks.

## Persistencia de campos

Los valores seleccionados se guardan localmente en el navegador mediante `localStorage`. Al recargar la página se recupera el último escenario utilizado en ese dispositivo y navegador.

Campos guardados: tecnología, oferta, cantidad de equipos, estudiantes, duración FLEX, pago inicial EVOLUCIONA y margen objetivo de la institución.

## Publicación

El sitio no necesita compilación ni dependencias para funcionar. Está preparado para GitHub Pages desde la rama `main` y la raíz del repositorio. Para abrirlo localmente:

```bash
python3 -m http.server 8000
```

Después, visita `http://localhost:8000/`. Los archivos `client.js`, `client.css` y `assets/` deben publicarse junto con `index.html`.

## Pruebas de desarrollo

Las pruebas usan Node.js, Playwright y un Chrome o Chromium instalado localmente. La ruta del navegador se detecta en macOS y ubicaciones comunes de Linux; para otra instalación, configura `CHROME_PATH`.

```bash
npm install
npm test
```

El logo de GuateGeeks permanece integrado dentro de `index.html`.
