# requirements-borrador.md — garden-catalogo-instancias (F0 del Agent Garden)

> **Borrador del arquitecto para el especificador.** No es la spec. El especificador lo reescribe como suyo en `hypnic-platform/specs/garden-catalogo-instancias/requirements.md`, lo parte donde haga falta y escribe `design.md` y `tasks.md`; el arquitecto da el APTO sobre `design.md`, nunca sobre este borrador.
> **Aspecto:** `Repo: hypnic-platform, Vía: 3`. Contrato nuevo (`/api/garden/*`), proveedor nuevo para platform (Google Agent Platform) y segundo runtime (`hypnic-agents`).
> **Origen:** propuesta del Agent Garden aprobada en diseño por Juan el 27-nov-2026 («aprobado», chat de Claude Code). Maqueta del admin con el contrato de rutas: https://claude.ai/artifact/LvujjQZQnarp7qeFYFHPBo (pestaña «API del garden»).
> **Convención:** un solo DEBE por requirement; cada R verificable por un test con rótulo `garden.R<n>`. Donde una R toque el panel, el test lleva `garden.ui.R<n>`.

## Historia

Como superadmin de HYPNIC, quiero que el API tenga un **Agent Garden**: un catálogo de plantillas de agente con versiones, una instancia por marca (empresa) y, por cada instancia, su harness y sus MCP administrables, conectado con Google Agent Platform (antes Vertex AI Agent Builder) y con `hypnic-agents`, para crear, modificar y conectar agentes por cliente sin tocar código ni la consola de Google.

## Glosario

- **Plantilla**: agente reutilizable del catálogo. Es un desarrollo `apps.kind='agente'` más una fila `garden_plantillas`.
- **Versión**: snapshot inmutable de una plantilla (instrucciones, modelo, skills, harness base, MCP requeridos, esquema de salida).
- **Instancia**: una versión activada en una **empresa** (la marca), con identidad propia, consumidor MCP propio, overlays de harness y skills, topes y estado.
- **Runtime**: dónde corre una instancia: `agent_runtime` (Agent Runtime de Google Agent Platform, agentes ADK) o `hypnic_agents` (Cloud Run, conversacional). `managed_agents` existe en el enum pero está deshabilitado en v1.
- **Clase de recurso MCP**: `empresa` (ERP, contabilidad, lago completo), `comercio`, `cerebro` (métricas certificadas), `tercero` (MCPs de terceros), `personal` (por persona; fuera de v1).
- **Rol efectivo**: `madre`, `especialista`, `conversacional` (F0 solo usa `especialista` y `conversacional`; `madre` queda definido para F1).
- **Overlay**: archivos de harness o skills propios de una instancia, en hypnic-storage, versionados por hash.
- **Estructural**: plantilla con `tipo='estructural'` (madre, organizador, front). Solo HYPNIC la crea.

## Alcance F0 y NO-alcance

**Cubre:** tablas `garden_plantillas`, `garden_plantilla_versiones`, `garden_instancias`; rutas `/api/garden/*` del contrato de la maqueta para plantillas, versiones e instancias; puerto `RuntimeDeAgentes` con adaptadores `AgentRuntimeAdk` y `HypnicAgents`; MCP por instancia sobre la selección por consumidor existente; harness y skills por instancia en storage; kinds de consumo `agente-turno` y `agente-tarea`; etiqueta de instancia en el gasto GCP; pantallas Catálogo e Instancias del admin; auditoría.

**NO cubre (fases siguientes):** solicitudes y agente madre (F1), creador y actualización por lote (F2), tarifa `agente-mes` y topes automáticos con aviso (F3), matrona y MCP personales (F4), Managed Agents API, edición de instrucciones en vivo sobre una versión publicada, playground.

## A. Plantillas (catálogo)

**R1.** El sistema DEBE guardar cada plantilla en `garden_plantillas` con `id`, `slug` único, `nombre`, `area`, `tipo ∈ {estructural, no_estructural}`, `rol ∈ {madre, especialista, conversacional}`, `alcance ∈ {interno, empresa, publico}`, `runtime ∈ {agent_runtime, hypnic_agents, managed_agents}`, `origen ∈ {hypnic, a_medida, google}`, `estado ∈ {borrador, publicada, retirada}` y `app_id` que referencia una fila de `apps` con `kind='agente'`.

**R2.** CUANDO un superadmin hace `POST /api/garden/agentes` con un cuerpo válido, el sistema DEBE crear en una sola transacción la fila de `apps` (`kind='agente'`, `audience='interna'`), la fila de `garden_plantillas` y su versión 1 en estado `borrador`.

**R3.** SI quien llama a cualquier ruta de escritura de `/api/garden/*` no es superadmin de plataforma ENTONCES el sistema DEBE responder `403` sin crear ni modificar nada.

**R4.** SI el cuerpo de `POST /api/garden/agentes` trae `runtime='managed_agents'` ENTONCES el sistema DEBE responder `400 {error:"runtime_deshabilitado"}`.

**R5.** SI el cuerpo de `POST /api/garden/agentes` trae `tipo='estructural'` y la petición no lleva la cabecera de confirmación de dueño definida en design (identidad superadmin de Juan o Mar, nunca API key) ENTONCES el sistema DEBE responder `403 {error:"estructural_prohibido"}`.

**R6.** El sistema DEBE mantener el catálogo de `area` como datos administrables (tabla o configuración), sin ningún nombre de área fijo en el código.

**R7.** CUANDO un superadmin hace `GET /api/garden/agentes`, el sistema DEBE devolver todas las plantillas con su versión publicada vigente (si existe), el número de instancias por estado y el runtime.

**R8.** CUANDO un superadmin retira una plantilla (`POST /api/garden/agentes/:id/retirar`) y existe al menos una instancia en estado `activa` o `probando`, el sistema DEBE responder `409 {error:"instancias_activas"}` sin cambiar el estado.

## B. Versiones

**R9.** El sistema DEBE guardar cada versión en `garden_plantilla_versiones` con `plantilla_id`, `version` entera y monótona por plantilla, `instrucciones_ref`, `modelo` (cadena de modelos, razonamiento, temperatura, tope de tokens de salida), `mcp_requeridos` (lista de `{proveedor, recurso, clase}`), `skills` (lista de `{id, origen ∈ {plantilla, google}, ref}`), `harness_ref`, `esquema_salida`, `evalset_ref`, `estado ∈ {borrador, publicada, retirada}` y `creada_por`.

**R10.** CUANDO un superadmin hace `POST /api/garden/agentes/:id/versiones`, el sistema DEBE crear la versión `max(version)+1` en estado `borrador` copiando los campos de la versión indicada en `desde` (o de la última publicada si no se indica).

**R11.** SI una petición intenta modificar (`PUT …/versiones/:v/*`) una versión en estado distinto de `borrador` ENTONCES el sistema DEBE responder `409 {error:"version_inmutable"}`.

**R12.** CUANDO un superadmin hace `POST …/versiones/:v/publicar` sobre un borrador con `evalset_ref` no nulo, el sistema DEBE pasar la versión a `publicada` sin cambiar el estado ni la versión de ninguna instancia existente.

**R13.** SI `POST …/versiones/:v/publicar` se llama sobre un borrador sin `evalset_ref` ENTONCES el sistema DEBE responder `400 {error:"sin_evalset"}`.

**R14.** SI se intenta retirar una versión que tiene instancias en estado `activa` o `probando` ENTONCES el sistema DEBE responder `409 {error:"instancias_activas"}`.

**R15.** CUANDO se guarda el harness base de una versión (`PUT …/versiones/:v/harness`), el sistema DEBE subir cada archivo a hypnic-storage como privado bajo la ruta `hypnic/garden/plantillas/<slug>/v<version>/` y guardar en `harness_ref` el hash de cada archivo, nunca el contenido en la base de datos.

## C. Instancias

**R16.** El sistema DEBE guardar cada instancia en `garden_instancias` con `id`, `plantilla_version_id`, `empresa_id`, `rol_efectivo`, `estado ∈ {creada, probando, activa, pausada, retirada}`, `runtime`, `runtime_ref`, `identidad_servicio`, `consumidor_mcp_id`, `harness_ref`, `skills` (overlay), `modelo_override` nullable, `tope_diario_usd`, `tope_mensual_usd`, `etiqueta_gcp`, `creada_por`, `activada_por`, `pausada_por`.

**R17.** CUANDO un superadmin hace `POST /api/garden/empresas/:empresa/instancias` con una versión `publicada`, el sistema DEBE crear la instancia en estado `creada` y, en la misma operación, su consumidor MCP, su identidad de servicio y su `etiqueta_gcp`, y llamar a `RuntimeDeAgentes.crear`.

**R18.** SI la versión indicada no está `publicada` ENTONCES el sistema DEBE responder `400 {error:"version_no_publicada"}` sin crear nada.

**R19.** SI la empresa de la ruta no existe o no está activa ENTONCES el sistema DEBE responder el `404` uniforme de platform sin revelar si la empresa existe.

**R20.** El sistema DEBE rechazar con `409 {error:"madre_unica"}` una segunda instancia con `rol_efectivo='madre'` en la misma empresa (índice único parcial), aunque F0 no la cree.

**R21.** SI una instancia se crea por una ruta distinta de `POST /api/garden/empresas/:empresa/instancias` con identidad superadmin (p. ej. por identidad de servicio de un agente) ENTONCES el sistema DEBE responder `403 {error:"estructural_prohibido"}` cuando la plantilla es estructural y `403 {error:"solo_superadmin"}` en cualquier otro caso.

**R22.** El sistema DEBE hacer cumplir en la base de datos `CHECK (tipo <> 'estructural' OR origen = 'hypnic')` sobre la plantilla referenciada, de modo que ninguna ruta pueda crear una estructural de origen distinto de HYPNIC.

**R23.** CUANDO un superadmin hace `POST …/instancias/:id/probar`, el sistema DEBE llamar a `RuntimeDeAgentes.probar` (ping, meta y evalset de la versión) y pasar la instancia a `probando` con el resultado guardado.

**R24.** CUANDO un superadmin hace `POST …/instancias/:id/activar` sobre una instancia en `probando` cuyo último resultado de prueba fue correcto, el sistema DEBE pasarla a `activa` y llamar a `RuntimeDeAgentes.activar`.

**R25.** SI la activación es la primera instancia `activa` de esa empresa y la identidad que llama no es la de un dueño (`juan@hypnic.us` o `maker@hypnic.us`, sesión o Google, nunca API key) ENTONCES el sistema DEBE responder `403 {error:"primera_activacion_dueno"}`.

**R26.** CUANDO un superadmin hace `POST …/instancias/:id/pausar`, el sistema DEBE pasar la instancia a `pausada`, llamar a `RuntimeDeAgentes.pausar` y dejar la selección MCP del consumidor sin efecto mientras dure la pausa.

**R27.** CUANDO un superadmin hace `POST …/instancias/:id/retirar`, el sistema DEBE pasar la instancia a `retirada`, llamar a `RuntimeDeAgentes.retirar` y conservar la fila y su historial.

**R28.** CUANDO un superadmin hace `POST …/instancias/:id/version` con otra versión `publicada` de la misma plantilla, el sistema DEBE guardar la versión anterior, apuntar la instancia a la nueva y pasarla a `probando`.

## D. Puerto de runtime (ENGINEERING: puertos y adaptadores)

**R29.** El sistema DEBE definir el puerto `RuntimeDeAgentes` con las operaciones `crear`, `probar`, `activar`, `pausar`, `retirar`, `actualizar` y `estado`, y el dominio del garden NO DEBE importar ningún SDK de Google ni cliente HTTP de hypnic-agents.

**R30.** El sistema DEBE elegir el adaptador por el campo `runtime` de la plantilla, por configuración, sin ramificar por nombre de plantilla ni de empresa en el dominio.

**R31.** El adaptador `AgentRuntimeAdk` DEBE crear un recurso de Agent Runtime por instancia con las etiquetas `hypnic-empresa`, `hypnic-instancia` y `hypnic-version`, y guardar su `resourceName` en `runtime_ref`.

**R32.** El adaptador `AgentRuntimeAdk` DEBE crear una cuenta de servicio propia por instancia y guardarla en `identidad_servicio`; NO DEBE reutilizar la identidad de otra instancia ni la del garden.

**R33.** SI la cuota de recursos de agente del proyecto del pool está por encima del umbral configurado (`GARDEN_POOL_UMBRAL`, por defecto 80) ENTONCES `AgentRuntimeAdk` DEBE crear el recurso en el siguiente proyecto de la lista `GARDEN_POOLS` o responder `503 {error:"sin_cupo_runtime"}` si no hay otro.

**R34.** El adaptador `HypnicAgents` DEBE enlazar la instancia con una ficha de empresa de hypnic-agents existente (`runtime_ref` = id de `sac_empresa_config`) y NO DEBE crear ni modificar fichas en F0.

**R35.** El sistema DEBE arrancar con un adaptador doble en memoria (`RuntimeDeAgentesEnMemoria`) para smoke y pg-mem, sin red.

**R36.** Ningún adaptador DEBE crear proyectos GCP, habilitar APIs ni conceder permisos IAM más allá de la cuenta de servicio de la instancia y el permiso de invocación sobre su propio recurso; cualquier otro hueco se reporta como error `infra_pendiente`.

## E. MCP por instancia

**R37.** El sistema DEBE crear por cada instancia un consumidor del canal `mcp` (fila de `mcp_consumidores` con `instancia_id`), de modo que dos instancias de la misma plantilla en dos empresas tengan selecciones independientes.

**R38.** CUANDO un superadmin hace `PUT /api/garden/instancias/:id/mcp` con una selección de recursos, el sistema DEBE escribir la selección efectiva del consumidor de esa instancia usando el mismo módulo de selección de «Datos y permisos» (sin una segunda administración de permisos).

**R39.** SI la selección incluye un recurso de clase `empresa` y `rol_efectivo` de la instancia no es `madre` ENTONCES el sistema DEBE responder `403 {error:"clase_empresa_solo_madre"}` sin guardar nada.

**R40.** SI la selección incluye una tool de escritura o de clase `tercero` con gasto ENTONCES el sistema DEBE guardarla apagada, y solo puede encenderse por la confirmación humana que ya define `mcps-terceros`.

**R41.** El sistema DEBE declarar la `clase` de cada proveedor del techo `mcp` (`empresa`, `comercio`, `cerebro`, `tercero`) como dato del catálogo de conectores, y `validarTecho` DEBE rechazar un techo sin clase.

**R42.** CUANDO se pausa o retira una instancia, el sistema DEBE dejar su consumidor MCP sin selección efectiva, de modo que `tools/list` del runtime MCP responda vacío para esa identidad.

## F. Harness y skills por instancia

**R43.** CUANDO un superadmin hace `PUT /api/garden/instancias/:id/harness` con uno o más archivos, el sistema DEBE guardarlos en hypnic-storage como privados bajo `<empresa>/garden/instancias/<instancia_id>/v<n>/`, crear una versión nueva del overlay (append-only) y guardar el hash en `harness_ref`.

**R44.** CUANDO cambia `harness_ref` o `skills` de una instancia, el sistema DEBE llamar a `RuntimeDeAgentes.actualizar` para que el runtime reempaquete con los archivos resueltos.

**R45.** El sistema NO DEBE entregar a ningún runtime una URL firmada ni credencial de storage: el adaptador resuelve los archivos del lado de platform y los entrega como contenido al empaquetar.

**R46.** CUANDO un superadmin hace `PUT /api/garden/instancias/:id/skills`, el sistema DEBE aceptar skills de tres orígenes (`plantilla` apagable, `propia` en storage, `google` del Skill Registry de Google Agent Platform) y guardar por cada una `id`, `origen`, `ref` y `activa`.

**R47.** SI una skill de origen `google` no existe en el Skill Registry al momento de guardar ENTONCES el sistema DEBE responder `400 {error:"skill_no_encontrada"}` sin guardar la selección.

## G. Consumo y topes

**R48.** El sistema DEBE aceptar en `POST /api/usage/events` los `kind` `agente-turno` y `agente-tarea` con `meta.instanciaId` obligatorio, `tokensIn`, `tokensOut`, `costUsd` y `eventKey` idempotente, reportados por la identidad de servicio de la instancia o del runtime.

**R49.** SI un evento llega con `meta.instanciaId` de una instancia que no está `activa` o `probando` ENTONCES el sistema DEBE responder `403 {error:"instancia_inactiva"}` sin registrar el evento.

**R50.** CUANDO el consumo del día de una instancia alcanza `tope_diario_usd`, el sistema DEBE responder `402` al siguiente evento y pasar la instancia a `pausada` con `pausada_por='tope_diario'`.

**R51.** CUANDO un superadmin hace `GET /api/garden/instancias/:id/consumo`, el sistema DEBE devolver turnos, tokens, costo en USD y llamadas MCP del período, calculados sobre `usage_events` y el gasto GCP filtrado por `etiqueta_gcp`, con la misma valorización que «Métricas».

## H. Auditoría

**R52.** CUANDO se crea, publica o retira una plantilla o versión, o se crea, prueba, activa, pausa, retira o actualiza una instancia, o cambia su harness, skills, MCP o topes, el sistema DEBE escribir una entrada de `audit_log` con actor real, empresa, instancia o plantilla, valor anterior y valor nuevo.

**R53.** CUANDO un superadmin hace `GET /api/garden/auditoria`, el sistema DEBE devolver las entradas de `audit_log` del garden filtrables por empresa, instancia y actor.

## I. Panel (Second Brain › Agent Garden)

**R54.** MIENTRAS el usuario del panel sea superadmin de plataforma, el sistema DEBE mostrar el grupo «Second Brain» con el ítem «Agent Garden»; para cualquier otro rol NO DEBE pintarlo.

**R55.** CUANDO se abre «Agent Garden», el panel DEBE pintar la vista Catálogo con las plantillas de `GET /api/garden/agentes` filtrables por `area`, y la vista Instancias con selector de empresa y la tabla de `GET /api/garden/empresas/:empresa/instancias`.

**R56.** La ficha de instancia DEBE ofrecer las acciones probar, activar, pausar, retirar y actualizar versión, cada una llamando a su ruta y mostrando el error cerrado del servidor sin reinterpretarlo.

**R57.** La pestaña «Datos y MCP» de la ficha DEBE reutilizar el componente de selección de «Datos y permisos» con el consumidor de la instancia, pintando bloqueados (no ocultos) los recursos de clase `empresa` cuando el rol no es `madre`.

**R58.** El panel NO DEBE contener ningún control que acepte credenciales, JSON crudo de perfil ni instrucciones de consola (norma «panel sin campos de terminal»).

## Decisiones para Juan y Mar que el especificador debe dejar explícitas

- **DJ-1.** Nombre del proyecto GCP del pool (`hypnic-garden-01`) y región (`us-central1` como ori).
- **DJ-2.** Si `hypnic_agents` en F0 solo enlaza (R34) o también crea fichas de empresa (lo descartado aquí).
- **DJ-3.** Cómo entra la clase de recurso al catálogo de conectores (R41): columna en el proveedor o tabla aparte.
- **DJ-4.** Qué cuenta como «dueño» para R25 en pg-mem y smoke (identidad `superadmin@hypnic.test` como en el resto de platform).

## Dependencias con nombre

- **DEP-1** `mcp-empresa-contrato` T5–T6: selección efectiva **por consumidor** (hoy se calcula para la app que llama). Sin esto R37–R42 no se pueden cumplir.
- **DEP-2** `hypnic-mcp-cerebro` con APTO e implementado al menos `cerebro__consultar`: el analista de `garden-agentes-f0` no tiene dato sin esto.
- **DEP-3** `vertex-por-desarrollo` (0/15 tasks): región y modelo por app; mientras no exista, `modelo` vive solo en la versión.
- **DEP-4** Infra de los dueños: proyectos `hypnic-garden-01` y `-pruebas`, API de Agent Runtime, SA de despliegue por WIF, cuota.
