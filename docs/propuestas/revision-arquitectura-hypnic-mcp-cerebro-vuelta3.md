## Vuelta 3 — 27 nov 2026 — OBSERVACIONES

**Objeto:** `specs/hypnic-mcp-cerebro/design.md` (con `requirements.md`, `tasks.md` y `revision-arquitectura.md`) en `hypnic-us/hypnic-mcp` main `29b951b` (merge de la PR #25, 23 nov 2026). Clon superficial de solo lectura en `/home/user/hypnic-mcp`.

**Bases leídas:**
- hypnic-mcp `29b951b`: `src/puertos/*`, `src/dominio/{llamada,llamada-escritura,limites,argumentos,techo,registro,exposicion,puerta,nombres}.ts`, `src/servidor-mcp/construir.ts`, `src/adaptadores/platform/{cliente-servicio,seleccion,corredor,auditoria}.ts`, `src/config.ts`, `src/composicion.ts`, `test/arquitectura/*`, `scripts/security-baseline.sh`.
- hypnic-platform main `c31d4a5`: `src/proveedores/{corredor,guardarIntegracion,registro,catalogoPublico,tipos}.ts`, `src/proveedores/windsor/definir.ts`, `src/proveedores/seleccion/{servicio,validarTecho}.ts`, `src/routes/seleccion.ts`, `INTEGRATION.md` §8j–§8n, `specs/mcp-empresa-contrato/tasks.md`. Además, la rama `spec/cerebro-portal-areas` `aac2f94` (PR #407, aprobada por Juan el 27 nov): `src/cerebro/encendido.ts` y la spec.
- **hypnic-data no está clonado.** DEP-D1…D5 y todas las citas a `src/piloto/*` quedan sin verificar en esta vuelta; valen las de las vueltas 1 y 2 sobre `9f7992a`.

**Aviso de numeración.** `revision-arquitectura.md` ya trae una «Vuelta 3 — 11 oct 2026 — APTO sobre `e6346d0`». Ese APTO se dio contra hypnic-mcp `cde279a` + PR #9 `71f6a99` y platform `f267872`. El texto de la spec en main es el que vio ese APTO, sin cambios: la cabecera sigue citando `cde279a` + PR #9. Lo que cambió es el código debajo. Este dictamen vuelve a validar la spec contra main de hoy y reemplaza a aquel APTO. El encabezado sigue el formato que pidió el orquestador.

### Veredicto

**OBSERVACIONES.** Los seis bloqueantes de la vuelta 1 y los cuatro ajustes de la vuelta 2 siguen bien cerrados en el texto. Pero el diseño se escribió sobre un runtime que ya no existe. Main tiene ahora un pipeline de escritura, más códigos de error, una ventana declarativa, un publicador de techo y candados nuevos. Platform ya tiene un modo de acceso `delegado` y un desarrollo llamado `cerebro`. Cinco afirmaciones que sostienen el diseño son hoy falsas y otras cinco son inexactas; dos candados del diseño fallarían el primer día. Hacen falta tres correcciones acotadas antes del APTO; ninguna cambia la decisión A.

### Bloqueantes de vueltas anteriores: estado

| # | Qué era | ¿Cerrado? | Dónde |
|---|---|---|---|
| B1 | `sinCobro` sin invariante de dominio | Sí | R89–R91; design «Cobro y auditoría» y firmas (`ResultadoTool.sinCobro`, `validarResultado`); C-SINCOBRO; T2c.1–T2c.4. Ver N-1(g): falta decir si rige también en escritura. |
| B2 | Cortacircuitos medio-abierto con códigos excluidos | **Sí en el texto, no en el código** | R61, R92; design «Clases de error y cortacircuitos»; T2b.2–T2b.6. Pero DEP-R1 («PR #9 fusionada con el defecto corregido») **no se cumplió**: el defecto está en main y ahora también en escritura. La tabla de clases no cubre dos códigos que hoy existen. Ver N-1(a) y N-1(b). |
| B3a | Compensación (b) mal formulada | Sí | design «Lo que hay que saber de A», 1(b). |
| B3b | Candado estructural de acceso al lago | **Ya no basta** | R95, C-ACCESO-LAGO, T6.2. La lista de llamadores de `.ejecutar(` no incluye los dos que ya existen en main. Ver N-1(d). |
| B3c | El interruptor del panel no se cumple contra el runtime | Sí | design «Resumen» 9 y punto 1; T8.3, T9.4. |
| B3d | Disparador de la capacidad firmada | Sí | design «Disparador de la capacidad firmada»; R73; C-CLASIF. |
| B4 | Tabla de hechos de platform; DEP-P1 y DEP-P2 | **Ya no es exacta** | Las filas 5 y 6 eran ciertas en `f267872`. En `c31d4a5` hay un precedente sin campos (Windsor, `access: "delegado"`) y un obstáculo nuevo (`guardaDelegado`). Ver N-2. |
| B5a | Job pendiente en hypnic-data | Sí en el diseño | DEP-D3, R93, R102, G13, T3b.10. hypnic-data sin verificar en esta vuelta. |
| B5b | Cobertura 0/0 fabricada | Sí | R94, DEP-D1/D2, `CoberturaLago \| null`, G5, G9. |
| B5c | Cuarto sitio por empresa (`PILOTO_DATASETS`) | Sí | «Lo que hay que saber de A» 4, DEP-D5, J3, DJ-4. Ver N-3: con el desarrollo `cerebro` de platform hay un quinto interruptor. |
| B6 | Partición en PRs | Sí | tasks «Partición en PRs», T2a–T4c. |
| V2-1 | Rechazo local como error de tool con código | Sí en el texto | R9, R14, R100, R101; C-VALIDACION-PREVIA; alternativa 17. Choca con la `ventana` declarativa de v1, que llegó después. Ver N-1(e). |
| V2-2 | Código propio para «consulta en curso» | Sí | R61, R93, R102; `resultado_pendiente`; alternativa 18. |
| V2-3 | Redacción de R98 y R99 | Sí | Las dos dicen «declara». |
| V2-4 | El candado `.ejecutar(` no puede admitir `construir.ts` entero | Sí para `construir.ts` | R95, T6.2. Faltan los llamadores nuevos: N-1(d). |

### Hechos verificados contra el código

| Afirmación del design | Resultado | Archivo:línea |
|---|---|---|
| DEP-R1: PR #9 llega a main con el defecto del medio-abierto corregido | **Falso.** `conexion_no_disponible`, `conexion_no_soportada` y ahora `argumento_invalido` no llaman `fallo`, `exito` ni `cancelarPrueba`. El `finally` no libera la prueba, porque `llegoAlProveedor` ya es `true`. Reproducido en esta vuelta con el `Cortacircuitos` de main: la prueba se admite; una hora y un día después, `permitir()` sigue en `false`. | `src/dominio/llamada.ts:228,242,280-298`; `src/dominio/limites.ts:99-104` |
| El defecto afecta a un solo pipeline | **Falso.** Escritura tiene su propia lista, que además excluye `proveedor_limitado`, y repite el defecto. | `src/dominio/llamada-escritura.ts:29,138,63,126-128` |
| `CODIGOS_ERROR_PROVEEDOR` = v1 + T8, y con los seis nuevos son 12 (5 A, 3 B, 4 falla) | **Inexacto.** Main ya tiene 8 códigos, entre ellos `argumento_invalido` y `proveedor_no_disponible`. Con los seis nuevos son 14, y la tabla total de `claseDeError` no clasifica esos dos. | `src/puertos/proveedor-lectura.ts:70`; usos en `shopify/index.ts:179`, `shopify/permalink.ts:30`, `llamada-escritura.ts:41` |
| C-LECTURA se cumple «sin cambios» (design l. 676) | **Falso.** La prueba de tipos exige `keyof ProveedorLectura` igual a `'id'\|'tools'\|'techo'\|'ejecutar'`. Agregar `recursos?` y `validarSemantica?` rompe `tsc` en CI. | `test/arquitectura/solo-lectura.test.ts:82` |
| `.ejecutar(` de un proveedor solo se llama en `dominio/llamada.ts`, y en `construir.ts` como `d.ejecutar(` (R95) | **Inexacto.** Hay dos llamadores más. Con R95 tal como está escrito, el candado falla el primer día. | `src/dominio/llamada-escritura.ts:103`; `src/dominio/registro.ts:66`; `src/servidor-mcp/construir.ts:127` (`d.ejecutar(`, cierto) |
| La ventana inválida no es mecanismo de v1; solo la detecta `validarSemantica` | **Hecho nuevo.** v1 tiene `DefinicionTool.ventana {desde, hasta, maxDias}`, que valida en `validarArgumentos` y responde `-32602`. La usan dos tools de Shopify. | `src/puertos/proveedor-lectura.ts:51`; `src/dominio/argumentos.ts:109-128`; `shopify/tools.ts:151,164` |
| DEP-R2: v1-T9 emite `recursos` en `aTechoMcp` | **Falso.** La función se llama `aTechoPublicable`, el tipo es `recursos: readonly never[]` y siempre emite `[]`. | `src/dominio/techo.ts:29,36,57` |
| `ContextoLlamada.recursosPermitidos` obligatorio solo toca la lectura | **Inexacto.** `ContextoEscritura extends ContextoLlamada`; el contexto de escritura se arma en `llamada-escritura.ts`. `DefinicionToolEscritura` hereda `ParametroTool`. `ResultadoTool` también lo usa escritura. | `src/puertos/proveedor-escritura.ts:10,35,56`; `llamada-escritura.ts:92-101` |
| «Lo que no cambia: las cinco tools de Shopify» | **Desactualizado.** Hay 14 tools de lectura y un proveedor de escritura. | `shopify/tools.ts:38`; `shopify/tools-escritura.ts:34` |
| El adaptador infiere `unidades` con `motivo === null` | **Inexacto, pero la conclusión se mantiene.** Hoy lo infiere con `resultado === 'ok'`. Un `bloqueado` con `sinCobro` (resultado `ok`) se reportaría con `unidades: 1`. R91 sigue siendo necesaria. | `src/adaptadores/platform/auditoria.ts:78` |
| Hay cuatro sitios que construyen `EventoAuditoria` | Cierto | `llamada.ts:113`, `http/pre-puerta.ts:81`, `servidor-mcp/construir.ts:106`, `servidor-mcp/manejador.ts:34` |
| `-32602` lleva un mensaje fijo | Cierto | `servidor-mcp/construir.ts:133` |
| `MAX_REINTENTO_SEG = 3600`; el cliente recorta `Retry-After` a 3600 | Cierto. Por eso el caso `3601` de T3b.10 no es observable. | `llamada.ts:184-189`; `adaptadores/platform/cliente-servicio.ts:42-47` |
| El cliente compartido manda `x-service-identity`, sigue en `adaptadores/platform/` y no fija `redirect` | Cierto: es lo que T3a cambia | `cliente-servicio.ts:60,63` |
| `ID_PROVEEDOR` sin guion bajo; `kindDeTool` | Cierto | `src/dominio/nombres.ts:6,22-24` |
| `RESPUESTA_MAX_BYTES` con mínimo general 4096 | Cierto | `src/config.ts:165` |
| La selección expone `recursos`; el runtime manda `consumidor` a selección y corredor | Cierto en el runtime | `puertos/fuente-seleccion.ts:6`; `adaptadores/platform/seleccion.ts:36,95`; `adaptadores/platform/corredor.ts:69` |
| DEP-P4: platform calcula la efectiva y el canal por consumidor | **Sigue abierta.** `leerEfectiva` no lee el parámetro `consumidor`: calcula para la identidad que llama. El corredor evalúa el canal sobre el `appId` llamador. Lo que sí entró es R26 (sin `sin_control` para la vía runtime) y el «dueño del techo». | platform `src/routes/seleccion.ts:55-62`; `seleccion/servicio.ts:316-318`; `routes/credenciales.ts:28`; `mcp-empresa-contrato/tasks.md` T6.x sin marcar |
| Fila 5: «ningún proveedor tiene `fields: {}`; `cerebro` sería el primero» | **Falso hoy.** Windsor: `access: "delegado"`, `fields: {}`, `tester: null`, `exposicionLegacy: false`, `sincronizaCatalogo: false`. El corredor entrega `{headers:{},parametros:{},expiraEn:null}` en modo delegado. | platform `src/proveedores/windsor/definir.ts:14-27`; `corredor.ts:186,203-205`; `tipos.ts:7` |
| Fila 6 / DEP-P2: el alta pasa por el `PUT` genérico con el registro R61 | **Incompleto hoy.** Una conexión `delegado` no se puede crear por el `PUT` genérico (`409 conexion_por_enlace`). Además existe la guarda `proveedorDisponible` (secreto de plataforma). | platform `guardarIntegracion.ts:78-86,88-91` |
| Fila 7: el literal `operador` se compara en cinco sitios, más dos usos de `esProveedorOperador` | Cierto (cambian las líneas) | platform `catalogoPublico.ts:37`, `registro.ts:27,32`, `guardarIntegracion.ts:61,95`; `routes/admin.ts:885`, `routes/cuenta.ts:1785` |
| DEP-P1 (5): actualizar INTEGRATION §8j/§8l | **Referencia rota.** Hoy §8l es «Cliente final (B2C)». `mcp-empresa-contrato` T10.3 planea otra §8l. | platform `INTEGRATION.md:1224` |
| C-DOMINIO vigente; agregar el literal `cerebro` es aditivo | Cierto. Hoy prohíbe `shopify` (`dominio.test.ts`) y `shopify\|vtex\|woocommerce` en dominio, puertos y http (`comercio-neutro.test.ts`). | `test/arquitectura/dominio.test.ts:41`; `test/arquitectura/comercio-neutro.test.ts:6,26` |
| Baseline SEC001–SEC012 | Desactualizado: ahora llega a SEC013 y SEC015 (no afectan a `cerebro`) | `scripts/security-baseline.sh:328,378` |
| S1: el runtime solo habla contrato v1 | Cierto | `src/http/ruta-mcp.ts:62-67`; `CONTRATO-DATOS.md:3` |
| Platform acepta techo `schemaVersion` 1 con `recursos` | Cierto | platform `seleccion/validarTecho.ts:220` |

### Bloqueantes nuevos

**N-1. Volver a anclar el diseño a hypnic-mcp `29b951b`.**
- Dónde: cabecera de `design.md` y de `requirements.md` («Bases leídas»), DEP-R1…R5, «Cambios a archivos de v1», «Clases de error y cortacircuitos», «Seguridad», R92, R95, T2b, T6.2, T7.
- Qué cambiar:
  - **(a) DEP-R1 incumplida.** Escribir que el defecto llegó a main en los dos pipelines (`llamada.ts:228`, `llamada-escritura.ts:29`). Decidir si `claseDeError` gobierna también escritura. Recomiendo que sí: una sola tabla y una sola política. Declarar como cambio de v1 que `proveedor_limitado` de escritura pasa a contar como falla, o, si se mantiene, ponerlo en clase B para escritura con un argumento escrito. Como mínimo, el arreglo que libera la prueba (clase B) aplica a los dos pipelines, y T2b.6 suma la regresión de escritura. Sigue en pie la recomendación de la vuelta 2: este defecto de v1 no debe esperar a esta feature. Conviene un arreglo de vía 1 ya, porque v1 está desplegado con él.
  - **(b) Clasificar los 14 códigos.** Agregar `argumento_invalido` y `proveedor_no_disponible` a la tabla total. Recomiendo B para los dos. `argumento_invalido` es un rechazo local del adaptador antes de la red (`shopify/index.ts:179`): contarlo como «respondió» repetiría lo que descarta la alternativa 13. `proveedor_no_disponible` en escritura significa «no se envió». Justificar por qué `bodega_requerida` sale como `argumento_requerido` (A) y no como el `argumento_invalido` que ya existe. Hay razón: uno lo dice el lago y el otro el adaptador. Pero debe quedar escrita para que no parezca duplicación (ISP).
  - **(c) C-LECTURA.** Reemplazar «cumple sin cambios» (l. 676) por una enmienda declarada del candado: el conjunto permitido pasa a `'id'|'tools'|'techo'|'recursos'|'validarSemantica'|'ejecutar'`. Justificarla: ninguno de los dos escribe y ambos son metadatos o funciones puras. Exigir un `@ts-expect-error` que impida cualquier otra clave. Agregar la task (T1 o T2b) y el revert.
  - **(d) C-ACCESO-LAGO / R95.** Admitir de forma explícita `prov.ejecutar(` en `dominio/llamada-escritura.ts` (proveedor de escritura) y `p.ejecutar(` en `dominio/registro.ts` (adaptador del registro de escritura), igual que se hizo con `d.ejecutar(` en `construir.ts`. Alternativa más limpia: restringir el detector a receptores de tipo `ProveedorLectura`. Ajustar R95 y T6.2. Sin esto, el candado falla en main o el implementador lo afloja por su cuenta.
  - **(e) `DefinicionTool.ventana`.** Decir que `consultar` **no** declara `ventana`. Si la declarara, la ventana invertida saldría `-32602` en `validarArgumentos` y se violarían R9 y V2-1. Agregar la prueba «`TOOLS_CEREBRO` no declara `ventana`» con su revert. Anotar en «Extensiones y excepciones» la incoherencia entre proveedores: en Shopify la ventana inválida es `-32602`, en `cerebro` es `ventana_invalida`. Alinear la de v1 con SEP-1303 queda como tarjeta aparte de v1.
  - **(f) DEP-R2 y T7.** v1-T9 ya está en main como `aTechoPublicable`, con `recursos: readonly never[]`. T7 asume ese cambio: tipo, función, golden de Shopify sin cambios byte a byte y golden de `cerebro`. Corregir los nombres (`aTechoMcp` → `aTechoPublicable`) y el estado de DEP-R2, DEP-R3 (`deploy.yml` existe) y DEP-R5 (runbook en `docs/runbook.md`).
  - **(g) Superficie compartida con escritura.** Declarar el efecto de `ContextoLlamada.recursosPermitidos` (obligatorio) sobre `ContextoEscritura`: escritura pasa un conjunto vacío. Declarar el de `ParametroTool.recurso?` sobre `DefinicionToolEscritura`: el registro de escritura rechaza `recurso`, o se acota a lectura. Y el de `ResultadoTool.{origen,procedencia,sinCobro}` sobre escritura: o escritura también pasa por `validarResultado`, o `sinCobro` se ignora y se rechaza ahí. Hoy escritura cobraría un resultado con `sinCobro` sin validarlo. Es fail-closed para el dinero, pero el contrato del puerto debe decirlo.
- Sustento: ENGINEERING.md (candados con revert, L: invariantes del contrato; incrementos revisables sobre la base real). SDD.md («archivos a crear o modificar y firmas» deben corresponder al repo). Tabla de hechos de arriba.

**N-2. Tabla de hechos de platform, DEP-P1 y DEP-P2 contra `c31d4a5`.**
- Dónde: design «Qué exige el modelo de v1», filas 5 y 6; DEP-P1, DEP-P2; la fila «Cambio en platform» de la tabla de alternativas; DJ-1, DJ-2.
- Qué cambiar:
  - Fila 5. Ya existe un precedente de proveedor sin campos ni prueba: Windsor, `access: "delegado"`. El corredor ya entrega el acceso vacío en ese modo.
  - DEP-P1. Pedir «un proveedor `delegado` (o un modo hermano) con `usos: ["accion-mcp"]` y sin `secretoPlataforma`», en lugar de una capacidad nueva desde cero.
  - Fila 6 y DEP-P2. Una conexión `delegado` hoy **no** se crea por el `PUT` genérico (`409 conexion_por_enlace`), y `proveedorDisponible` exige un secreto de plataforma. DEP-P2 debe pedir una vía de alta sin enlace solo para superadmin (o un modo distinto de `delegado` que no herede esa guarda). La exención del registro R61 queda igual.
  - Reemplazar «§8j/§8l» por «§8j y la sección de proveedores internos que platform decida» (§8l ya es B2C).
  - Registrar DEP-P4 como abierta en platform: `leerEfectiva` y el corredor no leen `consumidor`. Es ruta crítica también para el Agent Garden.
- Sustento: B4 de la vuelta 1. La decisión A se justifica con «cambio en platform acotado» y esa justificación debe apoyarse en el platform de hoy. La conclusión mejora (A es más barata con el precedente `delegado`), pero el pedido a platform cambia.

**N-3. Coherencia con `cerebro-portal-areas` (platform PR #407, aprobada por Juan el 27 nov).**
- Dónde: «Lo que hay que saber de A» 2 y 4, DEP-P1, DEP-P2, DJ-2, runbook T8.3.
- Qué cambiar:
  - Platform ya tiene un **desarrollo** `cerebro`. «Cerebro encendido» es `app_grants` habilitado a ese desarrollo (`src/cerebro/encendido.ts:6-15` en `aac2f94`), y la PR #407 descarta atarlo al DW (su alternativa 5).
  - Esta spec define un **proveedor** `cerebro` cuya conexión significa «lago encendido». Son dos interruptores con el mismo nombre para cosas distintas. Juan enciende «Cerebro» en el panel y los agentes del Agent Garden siguen sin lago si falta la conexión.
  - El diseño debe: (1) nombrar la relación entre los dos; (2) elegir una opción y abrirla como DJ-11. Opción (i): un solo interruptor, donde la conexión del proveedor solo puede existir (o nace) con `app_grants(cerebro)`. Opción (ii): dos interruptores, y el proveedor cambia a un nombre sin ambigüedad (`lago` o `datos` cumplen `ID_PROVEEDOR`; el `kind` pasaría a `mcp_lago_*`). (3) Actualizar los «cuatro sitios» a cinco si se queda con (ii).
- Sustento: el propio diseño dice que el nombre es «un contrato entre tres sitios». Ahora hay un cuarto `cerebro` con otro significado. Es más barato cambiarlo antes de T1 que después del techo publicado (el techo y el `kind` quedan versionados).

### Notas no bloqueantes

1. **T3b.10, caso `Retry-After: 3601`** (deuda 1 del APTO del 11 oct, sin resolver). El cliente recorta a 3600 (`cliente-servicio.ts:44-47`), así que el adaptador nunca ve 3601. Decidir en T3a; recomiendo «3601 ⇒ `resultado_pendiente` con 3600».
2. **Cosmético.** design l. 348 y el paso 11 (l. 464) siguen diciendo «lo fija el dominio»; R91 dice «quien construye el evento».
3. **Hecho de `unidades`.** Corregir «ya no lo infiere con `motivo === null`» por «con `resultado === 'ok'`». Con `sinCobro` eso reportaría 1, lo que refuerza R91.
4. **«Lo que no cambia».** Actualizar «las cinco tools de Shopify» (hoy 14 de lectura, más escritura) y «SEC001–SEC012» (hoy hasta SEC015).
5. **Deuda de tipos de V2-4.** El registro sin `ejecutar` para `exposicion`, `puerta` y `servidor-mcp` vale más ahora que `registro.ts` envuelve `ejecutar` de escritura. Si se toma, resuelve N-1(d) por el compilador.
6. **Mutation testing** (ENGINEERING.md, permiso y cobro): `puerta.ts` (recurso), `resultado.ts` (`sinCobro`) y `clases-error.ts`. Se mantiene de la vuelta anterior.
7. **Contratos hermanos.** Abrir ya las tarjetas de hypnic-data (DEP-D1…D3) y de platform (DEP-P1, DEP-P2 reformulados por N-2, y DEP-P4). La cola de la vuelta 1 («la feature no llega a `hecha` pronto») pesa ahora contra el F0 del Agent Garden.
8. **hypnic-data sin verificar en esta vuelta.** El repo no está clonado. Antes de T3b, revisar que `9f7992a` siga siendo la base de `consumo.ts`, `consultas.ts`, `catalogo.ts` y `composicion.ts`.
9. **Forma de la spec, verificada por script.** 102 R sin huecos ni duplicados (agrupadas por tema, no en orden numérico), una sola `DEBE` por R, y toda R aparece en alguna línea `Cubre:` de `tasks.md`.
10. **Para el F0 del Agent Garden.** Con N-1…N-3 corregidos, la ruta mínima para que un agente lea el lago es T1–T4b + T5 + T7, con fakes. La demo real depende de DEP-P1/P2 (N-2), DEP-P4 (consumidor en platform) y J1–J3 (hypnic-data encendido). La paginación (T4c) y la batería de evaluación pueden ir después del primer uso interno si Juan lo prioriza.

### Decisiones para Juan (DJ-n) que siguen abiertas

- **DJ-1 (alternativa A).** Recomiendo A, ahora sobre el modo `delegado` que platform ya tiene (N-2).
- **DJ-2 (visibilidad).** Solo superadmin y oculto al portal del cliente. Es coherente con PR #407, donde el encendido también lo escribe solo el superadmin.
- **DJ-3 (cobrar o no `bloqueado`).** No cobrar, con la invariante de B1. Condiciona T2c.
- **DJ-4 (alcance y dataset a mano en hypnic-data).** Aceptar en el piloto con runbook; abrir la tarjeta para un alta sin terminal antes de la segunda empresa.
- **DJ-5 (recursos por defecto).** `existencia_bodega_v1` y `cobertura_equivalencias_v1` por defecto, como está.
- **DJ-6 (latencia de revocación por métrica).** Aceptar la cota `SELECCION_TTL_SEG`, igual que para tools en v1.
- **DJ-7 (métrica en claro en la auditoría).** No en este corte.
- **DJ-8 (empresa y entorno del E2E).** Empresa sintética para el E2E. Como el F0 del Agent Garden apunta a Chok, conviene que Chok sea el segundo paso inmediato, con las tres métricas de comercio. Sin ERP, `existencia_bodega_v1` y `ventas_sin_stock_v1` salen `bloqueado` y el sobre lo dice.
- **DJ-9 (paginación en el runtime o en hypnic-data).** Runtime en este corte; si el costo por página molesta, mover a hypnic-data.
- **DJ-10 (costeo de BigQuery en §8f).** No declarar insumo nuevo hasta medir.
- **DJ-11 (nueva, por N-3).** Un solo interruptor, con la conexión del lago condicionada a `app_grants(cerebro)`, o renombrar el proveedor a `lago`. Recomiendo renombrar a `lago` y condicionar su alta al grant de `cerebro`: un nombre por concepto y un solo encendido visible para Juan.

arquitecto (Claude Code · subagente) · solo lectura
