# Simulador compartible para Colegio Costa Sur

## Objetivo

Crear una propuesta web específica para Colegio Costa Sur que el equipo pueda compartir para que la institución explore distintos cobros mensuales por estudiante y entienda el ingreso estimado del programa. La página debe explicar el valor de forma clara, sin mostrar criterios, costos ni márgenes internos de GuateGeeks.

## Experiencia propuesta

- Página independiente y compartible, identificada como propuesta para Colegio Costa Sur.
- Una sola oferta titulada **EVOLUCIONA**. La duración se presenta una vez como **8 meses** dentro de sus condiciones, evitando etiquetas redundantes como “EVOLUCIONA 8 · 8 meses”.
- Presenta por separado la cuota mensual sugerida por GuateGeeks y la cuota mensual que la institución puede editar.
- Permite ajustar la cuota que cobraría el colegio y actualiza los resultados en vivo, sin recargar la página.
- Escenario inicial: 5 equipos, 60 estudiantes, 8 meses, 20 % de pago inicial y Q 200 sugeridos por estudiante al mes, conforme al ejemplo comercial compartido.
- Mantiene visibles la inversión total para la institución y sus condiciones de pago, con el total sin IVA como cifra principal y el total con IVA en menor jerarquía.

## Resultados y lenguaje financiero

Para la cuota que el colegio está probando, la página calcula:

- ingreso estimado por estudiante durante el programa;
- ingreso total estimado de la institución durante el período;
- diferencia estimada después de pagar a GuateGeeks, tanto por estudiante como para toda la institución;
- equivalente mensual de esa diferencia por estudiante.

La estimación de ingreso usa `cuota mensual por estudiante × estudiantes × meses`. La diferencia resta de ese ingreso la inversión total del programa con IVA. Se etiqueta como **diferencia bruta estimada**, no como ganancia neta, y se aclara junto al resultado que no descuenta gastos, cobros ni impuestos propios del colegio. La cuota sugerida de Q 200 es una referencia comercial de GuateGeeks; la cuota editable pertenece al escenario que evalúa la institución.

## Límites de datos de la vista compartible

- La página específica contiene solo los valores de la propuesta aprobados para mostrar: oferta, plazo, cantidades, inversión al cliente, condiciones y cuota sugerida.
- No carga ni muestra costos de adquisición de GuateGeeks, margen objetivo interno, rentabilidad de GuateGeeks ni los ajustes internos de 6 % o 10 %.
- La explicación del ajuste por pago inicial se reemplaza por condiciones visibles para el colegio: desembolso inicial y cuotas del programa.
- Los cambios que explore el visitante no alteran ni guardan el escenario interno del simulador comercial.

## Criterios de aceptación

1. Al abrir el enlace específico aparece Colegio Costa Sur y EVOLUCIONA como una sola oferta, con “8 meses” indicado una vez.
2. El texto compartible no menciona ajustes internos de GuateGeeks ni presenta el margen propio del proveedor.
3. La cuota sugerida aparece separada de un campo etiquetado para que el colegio introduzca su propia cuota por estudiante al mes.
4. Cambiar la cuota recalcula inmediatamente los ingresos totales y por estudiante, así como la diferencia bruta frente a la inversión con IVA.
5. Con el escenario inicial del ejemplo, una cuota de Q 200, 60 estudiantes y 8 meses produce Q 96,000 de ingreso estimado. Al restar Q 71,113.28 de inversión con IVA, la diferencia bruta estimada es Q 24,886.72.
6. El lenguaje aclara que la diferencia no descuenta gastos e impuestos del colegio y no es utilidad neta.
7. La vista se adapta a escritorio y móvil; los campos tienen etiquetas accesibles y validan cantidades y cuotas inválidas sin mostrar resultados engañosos.

## Alcance

Esta entrega cubre la página específica compartible y las pruebas de su cálculo, contenido y presentación adaptable. No cambia la lógica de precios interna ni convierte el enlace público en un mecanismo de control de acceso. La información que el proveedor autorice a mostrar en una página pública no debe considerarse confidencial.
