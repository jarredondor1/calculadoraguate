## Purpose

Facilitar que GuateGeeks presente a cada institución una propuesta educativa y financiera coherente con el escenario seleccionado en el simulador.

## ADDED Requirements

### Requirement: Vistas conectadas al escenario
El sistema SHALL permitir cambiar entre vista interna e institucional conservando los datos y actualizando ambas con un mismo cálculo.

#### Scenario: Actualización del escenario
- **WHEN** el operador cambia tecnología, modalidad, cantidad, estudiantes o condiciones
- **THEN** la vista institucional muestra la información actualizada del escenario sin recargar.

#### Scenario: Volver a la vista interna
- **WHEN** el operador vuelve a la vista interna
- **THEN** el escenario permanece seleccionado.

### Requirement: Información financiera institucional
La vista institucional SHALL mostrar totales sin IVA y con IVA, IVA, equivalencia por estudiante y mes y condiciones aplicables para cada modalidad, sin mostrar costos o márgenes internos de GuateGeeks en pantalla.

#### Scenario: Comparación de ofertas
- **WHEN** se selecciona comparar todas las modalidades
- **THEN** cada oferta muestra su propio total, duración y condiciones, sin presentar una como el resultado de todas.

#### Scenario: Pago distribuido
- **WHEN** se selecciona EVOLUCIONA
- **THEN** se muestran el pago inicial, las cuotas y su número.

### Requirement: Programa y proyectos
La vista institucional SHALL describir las condiciones educativas por modalidad y presentar una referencia visual de proyecto para cada tecnología cuando exista material verificado, indicando cuando un ejemplo esté pendiente o sea una propuesta futura.

#### Scenario: Proyecto disponible
- **WHEN** se selecciona LEGO SPIKE Prime
- **THEN** se presenta el Robot Cartógrafo de CiudadBots con imagen y enlace al programa.

#### Scenario: Proyecto no documentado
- **WHEN** se selecciona robótica para primaria o drones
- **THEN** se presenta una referencia visual y se aclara que la actividad concreta está pendiente de confirmación.

#### Scenario: Imágenes de equipos y conceptos
- **WHEN** se selecciona robótica para pequeños o primaria
- **THEN** se muestra la fotografía del equipo proporcionada por GuateGeeks; la imagen de drones se identifica como ilustrativa.

### Requirement: Categorías de robótica por etapa educativa
El sistema SHALL presentar las categorías de robótica con nombres comprensibles para las instituciones, conservando los equipos y cálculos asociados a cada selección.

#### Scenario: Seleccionar una categoría de robótica
- **WHEN** el operador selecciona robótica para pequeños, primaria o grandes
- **THEN** ambas vistas usan ese nombre y mantienen respectivamente los cálculos de TaleBot, Robot Master o Spike.

### Requirement: Presentación visual de Socrates Aprende
La vista institucional SHALL presentar una vista previa basada en capturas reales de Socrates Aprende y un enlace a la plataforma, aclarando la disponibilidad de la muestra sin atribuirle una integración de datos con el simulador.

#### Scenario: Explorar la plataforma
- **WHEN** la institución consulta el programa completo
- **THEN** puede ver el recorrido, pausarlo o reproducirlo, y abrir la plataforma de la semana 1.

#### Scenario: Preferencia de movimiento reducido
- **WHEN** el navegador solicita movimiento reducido
- **THEN** la vista previa se muestra estática hasta que el usuario decida reproducirla.

### Requirement: Alcance de privacidad y persistencia
El sistema SHALL conservar el escenario en el navegador y explicar que una vista ocultada no protege datos almacenados en archivos públicos.

#### Scenario: Recarga
- **WHEN** el usuario recarga el simulador en el mismo navegador
- **THEN** se restablecen los datos del escenario previamente seleccionado.
