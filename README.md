# DESAFÍO Tolotá

Sitio público del evento y sistema de cronometraje para el equipo organizador. El día de las pruebas, un portátil con PostgreSQL sirve la aplicación a los dispositivos conectados a la misma red Wi-Fi. La operación local funciona sin internet. Con conexión, el administrador puede copiar los datos a Supabase para actualizar el sitio publicado.

## Qué se publica al crear un evento

| Dónde | Qué se actualiza |
|---|---|
| Portada (`/`) | El nombre de la edición, el año y los nombres configurados para los retos X2 y X4 se leen de la base de datos. La portada prioriza el año en curso y luego el próximo año con evento. |
| Página de la edición (por ejemplo, `/desafio-2026`) | Muestra equipos por número, capitán, integrantes, pruebas y clasificación. Si hay varios eventos en el mismo año, la página muestra el creado más recientemente. La edición actual también incluye el cronograma por día. |
| Contenido editorial | Las fechas, la sede y el destino de la cuenta regresiva se mantienen en `src/lib/evento.ts`. El programa diario, los recursos y la información de inscripción se mantienen en `src/lib/contenido.ts`. Al preparar otra edición hay que revisar ambos archivos. |
| Sitio publicado | Lee la base de datos configurada en el alojamiento. Si el evento se creó en el portátil, el administrador debe subir el respaldo a Supabase para que aparezca en la web que consulta esa base. |

La portada y la página de la edición tienen un intervalo de revalidación de cinco minutos. Mientras la página de resultados públicos está abierta, consulta las posiciones cada diez segundos. En el sitio publicado, esa consulta muestra la última información disponible en la nube.

En **Recursos** están las bases y el acceso a la inscripción cuando se habilitan sus enlaces. **Historia**, **Espiritual** y **Galería** tienen páginas públicas de presentación con contenido pendiente. El módulo privado de puntuación espiritual sí está implementado.

## Día del evento sin internet

### Preparar el portátil con antelación

1. Instala Node.js 22 y PostgreSQL 16 en el portátil. Son las versiones que se utilizan en la integración continua del proyecto.
2. Desde la raíz del repositorio, copia `.env.example` como `.env` si todavía no existe. Configura `DATABASE_URL` y `DIRECT_URL` para la base **local** del evento. Reserva `NUBE_DATABASE_URL` para el destino remoto si vas a sincronizar.
3. Con internet disponible para la primera instalación y el servidor de desarrollo detenido, abre **Iniciar evento.bat**. El lanzador instala las dependencias que falten, genera el secreto de sesión, prepara la base, aplica las migraciones y solicita las contraseñas iniciales de Administrador y Cronometrador. También compila la aplicación cuando corresponde.
4. Conecta los dispositivos al mismo Wi-Fi. En el portátil abre `http://localhost:3000`. En los demás dispositivos abre la dirección de red que muestra el lanzador. Mantén el portátil encendido y la ventana del servidor abierta durante la jornada.

### Preparar equipos y pruebas

En `/cronometro`, el **Administrador** crea o selecciona el evento, configura entre una y ocho pistas, define las pruebas y habilita las que se van a correr. El **Cronometrador** trabaja con las pruebas habilitadas. La consulta del histórico desde ese rol requiere una clave adicional y la autorización dura dos horas.

En **Equipos → Importar CSV**, descarga la plantilla y usa **una fila por participante**, repitiendo el nombre del equipo en sus filas. Las fichas existentes se identifican por nombre dentro del equipo y se completan con los campos que traen valor. La importación respeta el orden de los equipos del archivo y coloca al final los equipos que ya existían y quedaron fuera. Desde la ficha se puede editar el participante y añadir su foto.

### Cronometrar una prueba

1. Elige el evento y la prueba. Revisa el orden de salida y carga un equipo en una pista libre, o activa la asignación automática. Las reservas permiten coordinar la cola entre dispositivos.
2. Selecciona la pista haciendo clic en ella o pulsando su número. El pulsador físico actúa sobre la pista seleccionada. Si el pulsador emula un teclado, utiliza la tecla configurada para el evento.
3. Da la salida. Si hay una detención, márcala y registra la reanudación desde la tarjeta. El reloj muestra centésimas y su barra completa una vuelta cada quince minutos.
4. Marca **Llegada**. El sistema intenta guardar el tiempo automáticamente. Espera la confirmación antes de liberar la pista. Si falla el guardado, usa la opción de reintento y comprueba que el equipo aparezca en **Resultados**.
5. Si un tiempo quedó asignado al equipo equivocado, abre **Corregir pista**, elige los dos equipos y registra el motivo. Los intercambios de resultados guardados quedan en el historial de correcciones.

### Interpretar los resultados

- **Por prueba.** Al tiempo bruto se le restan las detenciones. Sobre ese tiempo neto se aplican penalizaciones, bonificaciones y descuentos espirituales. El mínimo es cero.
- **Actividades espirituales.** Una actividad de **Tiempo** se vincula a una prueba. Alcanzar el puntaje máximo equivale a dos minutos de descuento en esa actividad. Una actividad **Plus** suma puntos que se consultan por separado.
- **General acumulada.** Se ordena primero por cantidad de pruebas completadas y después por menor suma de tiempos finales. La clasificación refleja las correcciones de disciplina y de puntajes. Desde el sistema se pueden exportar los resultados a CSV.

## Respaldo y sincronización

| Objetivo | Acción del administrador |
|---|---|
| Conservar una copia de la jornada | En **Respaldo**, descarga el archivo JSON y guárdalo en un lugar privado. Incluye las fichas de participantes. |
| Recuperar los eventos en otro portátil | Prepara el servidor y sus credenciales e importa el JSON desde **Respaldo**. La importación reemplaza los eventos que tengan el mismo identificador. |
| Actualizar la web publicada | Con internet, abre **Respaldo → Subir respaldo a Supabase**, comprueba el destino, pulsa **Subir respaldo** y confirma. Revisa el resumen de eventos y tiempos transferidos. |

La sincronización copia **todos los eventos locales** en una transacción. Reemplaza en la nube los eventos con el mismo identificador y conserva los que existen únicamente allí. Haz las correcciones en el portátil para que la siguiente subida incluya la versión correcta. Cuando haya migraciones pendientes en el destino, aplica primero `npm.cmd run nube:migrar` desde el portátil configurado.

## Desarrollo local

La aplicación usa Next.js 15 (App Router), React 19, TypeScript, Material UI 7, Prisma 6 y PostgreSQL. Desde PowerShell, en un clon nuevo con PostgreSQL en ejecución:

```powershell
Copy-Item .env.example .env
```

Edita las conexiones locales en `.env`. Después ejecuta estos comandos desde la raíz:

```powershell
npm.cmd ci
node scripts/asegurar-secreto.mjs
npm.cmd run evento:preparar
npm.cmd run claves
npm.cmd run dev
```

Abre `http://localhost:3000` para la portada y `/cronometro` para el sistema. Para compilar, detén primero el servidor de desarrollo de esa carpeta. Ambos procesos utilizan `.next`.

| Comando | Uso |
|---|---|
| `npm.cmd test` | Ejecutar las pruebas de lógica, contenido e importación CSV. |
| `npm.cmd run lint` y `npm.cmd run typecheck` | Revisar el código y comprobar los tipos. |
| `npm.cmd run db:studio` | Consultar la base de datos configurada en el entorno. |
| `npm.cmd run db:seed` | Cargar datos de demostración en una base de desarrollo. |
| `npm.cmd run build` | Generar el cliente de Prisma y compilar la aplicación. |
| `npm.cmd run evento:iniciar` | Servir la compilación de producción en la red local. |

### Estructura del repositorio

| Ubicación | Contenido |
|---|---|
| `src/app/`, `src/components/landing/`, `src/components/sitio/` | Rutas públicas, portada y vista anual de equipos, cronograma y resultados. |
| `src/app/cronometro/`, `src/components/crono/` | Administración del evento, pistas, controles y diálogos. |
| `src/app/api/` | Servicios del sistema y consulta pública de resultados. |
| `src/lib/` | Clasificación, reglas espirituales, permisos, CSV, respaldos y sincronización. |
| `prisma/`, `scripts/`, `tests/` | Esquema y migraciones, preparación del servidor y pruebas automatizadas. |

### Ramas, integración y despliegue

Cada funcionalidad se trabaja en una rama `feature/` con un nombre descriptivo y se integra en `develop`. La integración continua se ejecuta en los pull requests y en los pushes a `develop` y `main`. Instala dependencias, aplica las migraciones en PostgreSQL temporal, carga el conjunto de demostración y ejecuta lint, comprobación de tipos, pruebas y compilación.

Para desplegar en **Vercel**, configura `DATABASE_URL` para las consultas a la base remota, `DIRECT_URL` para las migraciones y `AUTH_SECRET` para firmar sesiones. El comando del proyecto es `npm run vercel-build`. En un entorno sin terminal, `ADMIN_PASSWORD` y `CRONO_PASSWORD` permiten configurar las contraseñas iniciales. `NUBE_DATABASE_URL` corresponde al portátil que envía las copias. Las opciones de conexión están descritas en `.env.example`.

Mantén los valores reales en el archivo local `.env` o en las variables privadas del alojamiento. Los respaldos, las exportaciones de fichas y las fotos de perfil contienen información personal y deben permanecer fuera del repositorio y de los recursos públicos.
