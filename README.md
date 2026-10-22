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
- pagos iniciales y cuotas para FLEX (20 % inicial) y EVOLUCIONA;
- comparación de ofertas y referencia básica de mercado.

## Presentación para la institución

El selector **Presentar como** permite alternar entre la vista interna y la vista para la institución. Ambas utilizan el mismo escenario: los cambios en tecnología, modalidad, cantidad de equipos, estudiantes y condiciones de pago actualizan la propuesta en vivo.

En la vista institucional, **Ocultar vista interna** activa el modo de presentación: oculta los botones de cambio de vista mientras el escenario sigue siendo editable. Para recuperarlos, selecciona **Salir de presentación**. El modo se conserva al recargar en esa pestaña y no constituye una medida de seguridad.

La vista institucional destaca la inversión sin IVA y muestra el total con IVA junto a ella, además del IVA, importe por estudiante, condiciones de pago y propiedad, el alcance educativo y una referencia visual de proyecto. Los pagos iniciales y las cuotas mostrados incluyen IVA. La estimación de ingresos y contribución del colegio puede abrirse dentro de cada modalidad; es una proyección bruta con supuestos, no una utilidad neta. Cuando se comparan las modalidades, cada una conserva sus propios resultados.

La ficha de CiudadBots enlaza al programa disponible; la referencia del Robot Cartógrafo conserva su atribución original a Ignat Khlebnikov / RoboRiseIT. Las fichas de robótica para pequeños y primaria muestran fotografías de equipos proporcionadas por GuateGeeks y actividades ilustrativas cuyo alcance debe confirmarse. La imagen de drones es una ilustración generada, inspirada en un dron educativo pequeño; el equipo y la actividad se confirman en la propuesta. Las fichas de electrónica y realidad virtual son referencias del catálogo de programas próximos y proceden del portal educativo de GuateGeeks.

La sección del programa presenta **Socrates Aprende** mediante un recorrido animado compuesto por capturas reales de la semana 1, que se puede pausar, y enlaza a la plataforma. La muestra observada corresponde a sexto primaria. La disponibilidad para estudiantes se comunica por fases; la animación es una vista previa, no una conexión de datos con el simulador.

## Cotizaciones en PDF

El botón **Crear cotización PDF** abre un formulario para indicar institución, contacto, ubicación, vigencia y una nota opcional. Elige una modalidad; cuando la calculadora está en **Comparar todas**, el formulario propone EVOLUCIONA 16 y permite cambiarla. La vista previa muestra el programa, los equipos, los estudiantes y los importes actuales. Una propuesta individual genera dos páginas: experiencia educativa con aula, kit y servicios incluidos; después, inversión y forma de pago. La inversión sin IVA tiene la mayor jerarquía; IVA y total con IVA se muestran debajo. Los datos del formulario se procesan localmente en el navegador y no se guardan ni envían a un servidor.

Para una propuesta de varios niveles, selecciona **Varios programas o niveles** y una sola modalidad para todos. Cada ficha define nivel, grados concretos, tecnología, estudiantes y equipos. Si dos o más niveles utilizan el mismo grupo de equipos, selecciona **Uso de equipos → Mismos equipos** en las fichas posteriores: solo se factura el grupo original, mientras cada nivel conserva sus estudiantes y su enfoque de proyectos. La sugerencia mensual por estudiante usa la suma de estudiantes atendidos por ese grupo de equipos. La propuesta multinivel abre con una portada de rutas de aprendizaje, sigue con fotos de aula y kit por programa y los servicios incluidos, y deja el desglose de inversión para la última página. INTEGRA también permite varios niveles, pero se mantiene como cotización de compra separada de FLEX y EVOLUCIONA.

La proyección de cobro por estudiante se puede activar o desactivar en FLEX y EVOLUCIONA; en INTEGRA no aparece. Al activarla, se añade una página con cobro mensual sugerido, ingresos y diferencia estimada antes de gastos propios. Si hay equipos compartidos, el costo único se distribuye entre niveles proporcionalmente a sus estudiantes solo para esta estimación; nunca se factura dos veces. Al desactivarla, el PDF omite tanto la página de proyección como el cobro sugerido. El PDF excluye costos y resultados internos de GuateGeeks. El acceso a Socrates Aprende no está incluido en INTEGRA. Para las demás modalidades, el contenido estudiantil está disponible actualmente para 6.º primaria y se ampliará gradualmente a 5.º; hay recursos docentes y el tiempo de acceso se acuerda con GuateGeeks.

La generación usa una copia local de `pdf-lib` en `assets/vendor/`, junto con su licencia, para que funcione en GitHub Pages sin cargar servicios externos. Las fotografías y el logo se incrustan desde `quote-assets.js`, lo que también permite descargar el PDF al abrir `index.html` como archivo local. Si se modifican las imágenes de `assets/quote-media/`, ejecuta `node scripts/build-quote-assets.cjs` para actualizar ese archivo. Las fotografías de aula representan experiencias conceptuales; no documentan necesariamente una clase de la institución cotizada. Las imágenes de TaleBot, Robot Master y Spike Prime son referencias de kit proporcionadas por GuateGeeks; las de electrónica, VR y drones son ilustrativas.

La pantalla institucional oculta los costos y márgenes internos, pero **no protege su confidencialidad**: se encuentran en el HTML y JavaScript publicados por GitHub Pages. Para protegerlos es necesario restringir o separar el simulador interno y sus datos mediante una solución de acceso adecuada.

## Persistencia de campos

Los valores seleccionados se guardan localmente en el navegador mediante `localStorage`. Al recargar la página se recupera el último escenario utilizado en ese dispositivo y navegador.

Campos guardados: tecnología, oferta, cantidad de equipos, estudiantes, duración FLEX, pago inicial EVOLUCIONA y margen objetivo de la institución.

## Publicación

El sitio no necesita compilación ni dependencias para funcionar. Está preparado para GitHub Pages desde la rama `main` y la raíz del repositorio. Para abrirlo localmente:

```bash
python3 -m http.server 8000
```

Después, visita `http://localhost:8000/`. Los archivos `client.js`, `client.css`, `quote.js`, `quote-assets.js` y `assets/` deben publicarse junto con `index.html`.

## Pruebas de desarrollo

Las pruebas usan Node.js, Playwright y un Chrome o Chromium instalado localmente. La ruta del navegador se detecta en macOS y ubicaciones comunes de Linux; para otra instalación, configura `CHROME_PATH`.

```bash
npm install
npm test
```

El logo de GuateGeeks permanece integrado dentro de `index.html`.
