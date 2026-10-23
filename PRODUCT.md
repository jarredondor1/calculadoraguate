# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El equipo comercial de GuateGeeks prepara propuestas para instituciones educativas. Directores, responsables financieros y docentes revisan el PDF para comprender el programa, su alcance y la inversión.

## Product Purpose

El simulador permite configurar una modalidad y varios grupos de equipos con sus grados y estudiantes. Genera una cotización personalizada, comprensible y presentable para un centro educativo.

## Operating Context

La propuesta se configura en el navegador y se descarga como PDF. La institución puede pedir distintas tecnologías y grupos de equipos; cada grupo se cobra una sola vez aunque sus kits se compartan entre varios grados. La complejidad de las actividades varía por edad. Los importes se expresan en quetzales; el precio sin IVA es la referencia principal y el IVA se desglosa.

## Capabilities and Constraints

- Modalidades: INTEGRA (compra), FLEX (renta), EVOLUCIONA 8 y EVOLUCIONA 16. La compra se cotiza por separado de los programas.
- Cada grupo registra tecnología, cantidad de equipos, grados y estudiantes por grado. El PDF explica el alcance educativo, qué incluye la modalidad y los pagos.
- FLEX y EVOLUCIONA pueden llevar una proyección opcional del cobro sugerido al estudiante y la diferencia estimada para la institución. INTEGRA no tiene proyección.
- INTEGRA incluye una sesión inicial de una hora de capacitación de uso. Horas adicionales y Socrates Aprende se cotizan por separado.
- FLEX y EVOLUCIONA incluyen capacitación docente, planificación alineada con el CNB, integración tecnológica, soporte y Socrates Aprende según disponibilidad por grado y vigencia acordada con GuateGeeks. FLEX devuelve los equipos al terminar; EVOLUCIONA transfiere los equipos al completar el programa.
- El contenido estudiantil de Socrates Aprende está disponible hoy para 6.º primaria y se ampliará gradualmente a 5.º. Para los primeros grados hay recursos docentes; básico y bachillerato son fases posteriores.
- El generador funciona como sitio estático, usa pdf-lib local y no envía el borrador a un servidor.

## Brand Commitments

Nombre y logotipo GuateGeeks; lema «Imagina, diseña y crea». El usuario proporcionó referencias de TaleBot, Robot Master, Spike Prime y un PDF de inspiración. El PDF debe usar fotografías de experiencia en el aula y del kit, y ser visualmente atractivo sin ocultar los datos de cobro.

## Evidence on Hand

Imágenes y logo en `assets/quote-media/`; fórmulas y datos de las modalidades en el simulador; contenido de la propuesta en `quote.js`. Las fotografías de aula son conceptuales y no acreditan una clase real de la institución cotizada.

## Product Principles

1. La institución entiende primero qué experiencia y recursos recibirá, después evalúa la inversión.
2. Los grados, estudiantes y equipos de cada grupo deben poder verificarse sin duplicar kits compartidos.
3. Los importes, el IVA y los pagos deben ser precisos y legibles para dirección y finanzas.
4. Se distingue con claridad lo incluido, lo no incluido y lo que depende del grado o de un acuerdo comercial.
