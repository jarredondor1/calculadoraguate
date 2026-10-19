## Context

El simulador es HTML estático y calcula todas las modalidades en `calc()`. El escenario persiste en localStorage. La propuesta aprobada prioriza una presentación en la misma computadora.

## Goals / Non-Goals

**Goals:** Una vista institucional en vivo, con resultados por modalidad y contenido educativo verificable.

**Non-Goals:** Autenticación, cotizaciones remotas, sincronización entre dispositivos y confidencialidad de datos publicados.

## Decisions

- Un botón alterna vistas en la misma página; los controles y el objeto devuelto por `calc()` son compartidos.
- El catálogo visual vive en un archivo separado y utiliza recursos existentes del portal. Las fichas futuras se identifican; los proyectos sin evidencia se marcan pendientes.
- La comparación presenta todas las modalidades con condiciones propias, sin adjudicar al conjunto el resultado de EVOLUCIONA 16.
- Las pruebas automatizadas ejercitan la página estática en un navegador real.

## Risks / Trade-offs

- [Datos comerciales publicados] → Documentar que la vista es solo una separación visual; la protección real requiere otro proyecto de infraestructura.
- [Proyectos no confirmados] → Mostrar una indicación de disponibilidad y no atribuir capacidades no verificadas.
- [Condiciones comerciales sujetas a revisión] → Mostrar escenarios estimados y las limitaciones de la contribución del colegio.
