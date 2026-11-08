# DESAFÍO Tolotá — Sistema de Cronometraje v2

Aplicación web para cronometrar el Desafío Tolotá: eventos, pruebas, equipos con fichas médicas,
cronómetro multipista con pulsador físico, disciplina, resultados por prueba y tabla general acumulada.

**Stack:** Next.js 15 (App Router) · React 19 + TypeScript · Material UI 7 · PostgreSQL + Prisma · SWR · Node.js 20+ · npm

---

## Qué cambió respecto a la versión HTML

| Antes (HTML único) | Ahora |
|---|---|
| Datos en `localStorage` (solo ese navegador; se pierden al limpiar) | Base de datos PostgreSQL en la nube, accesible desde cualquier dispositivo |
| "Año" como filtro global, equipos sueltos con campo `ano` | **Evento** como entidad: varios eventos por año, cada uno con sus pruebas, equipos y configuración |
| 3 pistas fijas | **1 a 8 pistas** configurables por evento (teclas `1…8` y `Q W E R T Y U I`) |
| Penalización calculada solo al momento de la llegada | Tiempo final **recalculado siempre**: si registras disciplina después, el resultado se actualiza |
| Disciplina asignada a una prueba según la hora | Se elige la prueba explícitamente (por defecto la que está en curso) |
| Integrantes como texto + fichas separadas | Integrantes = fichas de participante (datos, emergencia y ficha médica) |
| Guardado manual "💾 Guardar prueba" | Cada llegada se guarda al instante; si falla la red, la pista avisa y permite reintentar |
| Si se recargaba la página se perdían los cronómetros | El estado de las pistas se recupera al recargar (en ese mismo equipo) |
| — | **Tabla general acumulada**, podios, exportación CSV (general, por prueba, fichas) |
| — | **Respaldo JSON** completo + importación, y **migración** de los datos de la versión anterior |
| — | Orden de salida guardado por prueba (arrastrar, flechas o patrones) |
| — | Varios dispositivos a la vez: los resultados se refrescan cada pocos segundos |
| PIN de administrador y cronometrador guardados en el navegador | **Inicio de sesión por rol** (Administrador / Cronometrador) validado en el servidor, contraseñas cifradas y cambiables en la app; el cronometrador solo ve las pruebas habilitadas y nunca las fichas |

---

## Estructura

```
prisma/
  schema.prisma            Modelo de datos (Evento, Prueba, Equipo, Participante, Resultado, PuntoDisciplina)
  migrations/              Migración SQL inicial
  seed.ts                  Datos de demostración
src/
  app/
    page.tsx               Inicio: lista de eventos por año + crear evento
    respaldo/              Respaldo / importación / migración desde la versión HTML
    eventos/[eventoId]/
      page.tsx             Configuración: datos, pistas, pulsador, valores de disciplina, pruebas
      cronometro/          Cronómetro multipista, cola, orden de salida, resultados en vivo
      equipos/             Equipos, logos, fichas de participantes, importación CSV
      disciplina/          Registro de puntos (leve, media, grave, positivo)
      resultados/          General acumulada + resultados por prueba + exportación
      espiritual/          (Próximamente)
    api/                   API REST (route handlers) — ver tabla abajo
  components/              Componentes de UI (pistas, diálogos, avatar, toasts…)
  lib/
    scoring.ts             Cálculo de tiempos, posiciones y general (funciones puras, con pruebas)
    orden.ts               Patrones de orden de salida
    validators.ts          Validación de entradas (zod)
    respaldo.ts            Exportar/importar respaldo y migración desde localStorage
  middleware.ts            Autenticación básica opcional
tests/                     Pruebas unitarias de la lógica (npm test)
```

### API

| Método | Ruta | Uso |
|---|---|---|
| GET/POST | `/api/eventos` | Listar / crear evento (con pruebas iniciales y copia de equipos) |
| GET/PATCH/DELETE | `/api/eventos/:id` | Ver / editar / borrar evento |
| POST/PUT | `/api/eventos/:id/pruebas` | Agregar prueba / reordenar |
| PATCH/DELETE | `/api/pruebas/:id` | Renombrar, estado, orden de salida / borrar |
| GET/POST | `/api/eventos/:id/equipos` | Listar (con fichas) / crear equipo |
| POST | `/api/eventos/:id/equipos/import` | Importar equipos (CSV) |
| PATCH/DELETE | `/api/equipos/:id` | Editar / borrar equipo |
| POST | `/api/equipos/:id/participantes` | Crear ficha |
| PATCH/DELETE | `/api/participantes/:id` | Editar / borrar ficha |
| GET/PUT | `/api/pruebas/:id/resultados` | Ver / guardar tiempo de un equipo |
| DELETE | `/api/resultados/:id` | Borrar tiempo (repetir) |
| GET/POST | `/api/eventos/:id/disciplina` | Listar / registrar punto |
| DELETE | `/api/disciplina/:id` | Borrar punto |
| GET | `/api/eventos/:id/clasificacion` | Resultados por prueba + general |
| GET | `/api/eventos/:id/exportar?tipo=general\|prueba\|todas\|participantes` | CSV |
| GET/POST | `/api/respaldo` | Descargar / importar respaldo JSON |

---

## Día del evento sin internet (servidor local + nube)

El día del evento la app corre en **un portátil** con PostgreSQL instalado. Los demás dispositivos
(cronómetro, disciplina, pantalla de resultados) se conectan a ese portátil por **Wi-Fi local**:
un router o el punto de acceso del propio portátil. **No hace falta internet.** Todos los tiempos quedan en la base
de datos del portátil y, cuando haya conexión, se copian a la **nube (Supabase)**, donde queda el histórico.

```
 Tablet / celular / PC ──Wi-Fi local──▶ Portátil: app + PostgreSQL ──(con internet)──▶ Supabase (histórico)
                                                                     Respaldo → Sincronizar
```

### Preparar el portátil (una sola vez, con internet)
1. Instala **Node.js LTS** (nodejs.org) y **PostgreSQL 16** (postgresql.org/download/windows).
   En el instalador de PostgreSQL apunta la contraseña del usuario `postgres`.
2. Descarga o clona este repositorio y copia `.env.example` como `.env`. En `.env`:
   - `DATABASE_URL` y `DIRECT_URL`: cambia `postgres:postgres` por `postgres:TU_CONTRASEÑA`.
   - `NUBE_DATABASE_URL`: la URL **Session pooler (puerto 5432)** de Supabase.
3. Doble clic en **`Iniciar evento.bat`**. La primera vez instala dependencias, crea la base `desafio_tolota`,
   crea las tablas y compila (unos minutos).
4. Crea las tablas en la nube (una vez, y de nuevo cada vez que cambie el modelo de datos):
   ```bash
   npm run nube:migrar
   ```
5. La primera vez que arranque, Windows preguntará si Node.js puede usar la red: permite **Redes privadas**.

### Durante el evento
- **Roles:** el **Administrador** ve todo; el **Cronometrador** solo cronometra y ve resultados de las pruebas
  que el administrador habilitó (Configuración del evento → candado de cada prueba). La primera vez,
  `Iniciar evento.bat` pide crear las dos contraseñas en su ventana (o `npm run claves`); luego se cambian en
  **Respaldo → Contraseñas**. No se crean desde el navegador a propósito: así nadie en el Wi‑Fi puede adelantarse.
- Doble clic en **`Iniciar evento.bat`**. La ventana muestra las direcciones para los otros dispositivos,
  p. ej. `http://192.168.0.10:3000`. No cierres esa ventana mientras dure la jornada.
- Los otros dispositivos deben estar en la misma red Wi-Fi y abrir esa dirección en el navegador.

### Al terminar cada jornada (con internet)
- **Respaldo → ☁️ Sincronizar ahora.** Cada evento se copia completo a la nube en una sola operación:
  si se corta la conexión, la nube queda como estaba y se puede repetir.
- Los eventos que existen solo en la nube (años anteriores) **se conservan**: el histórico no se borra.
- La nube es para **consultar**: lo que se edite directamente en el sitio en la nube se reemplaza en la próxima
  sincronización de ese evento. Las correcciones se hacen en el portátil.
- Si se cambia de portátil: en el sitio en la nube, **Respaldo → Descargar**, y en el portátil nuevo, **Importar**.

---

## Instalación local (desarrollo)

Requisitos: **Node.js 20.9+**, **npm**, y un PostgreSQL (local, Docker o en la nube).

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#    edita DATABASE_URL

# (opcional) PostgreSQL con Docker:
docker run -d --name tolota-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=desafio_tolota -p 5432:5432 postgres:16

# 3. Crear tablas
npx prisma migrate deploy
# (opcional) datos de prueba
npm run db:seed

# 4. Arrancar
npm run dev        # http://localhost:3000
```

Otros comandos: `npm test` (lógica), `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:studio` (explorar la BD).

> Primera vez: después de `npm install` se genera `package-lock.json`. Súbelo a Git.

---

## Git / GitHub

```bash
git init -b main          # (ya viene inicializado si descargaste el .zip con .git)
git add . && git commit -m "Desafío Tolotá v2"
git remote add origin https://github.com/TU_USUARIO/desafio-tolota.git
git push -u origin main
```

El workflow `.github/workflows/ci.yml` valida en cada push a `main` y en cada pull request: instalación,
migraciones y seed contra un PostgreSQL 16 temporal, lint, typecheck, pruebas y build.

---

## Base de datos en Supabase

1. En **supabase.com → New project**: nombre `desafio-tolota`, región cercana (p. ej. *South America (São Paulo)*),
   y una **contraseña de base de datos** (guárdala; mejor sin `@ # / : ? &` para no tener que codificarla).
2. Cuando el proyecto esté listo: botón **Connect** (arriba) → pestaña **ORMs → Prisma**. Copia las dos URLs:
   - `DATABASE_URL` → *Transaction pooler* (puerto **6543**) — agrega `?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL` → *Session pooler* (puerto **5432**)
3. Pégalas en el archivo `.env` (reemplaza `[YOUR-PASSWORD]` por tu contraseña).
4. Crea las tablas:
   ```bash
   npx prisma migrate deploy
   npm run db:seed      # opcional: evento de demostración
   npm run dev
   ```
5. Comprueba en Supabase → **Table Editor** que aparecen las tablas `Evento`, `Prueba`, `Equipo`, etc.

La segunda migración activa **RLS** (Row Level Security) en todas las tablas. Así la API pública de Supabase
(clave *anon*) no puede leer las fichas médicas; la app sigue funcionando porque Prisma entra como usuario `postgres`.
No uses las claves `anon`/`service_role` en este proyecto: no hacen falta.

En **Vercel**, agrega las mismas dos variables (`DATABASE_URL` y `DIRECT_URL`) en *Settings → Environment Variables*.

---

## Despliegue en Vercel (recomendado, el más rápido)

1. Sube el repositorio a GitHub.
2. En **vercel.com → Add New → Project**, importa el repo (framework: Next.js, se detecta solo).
3. Base de datos: agrega `DATABASE_URL` y `DIRECT_URL` de Supabase (ver sección anterior) en
   *Settings → Environment Variables*. (Alternativa: *Storage → Neon*; en ese caso usa la URL directa como `DIRECT_URL`.)
4. *Settings → Build & Development → Build Command*: `npm run vercel-build`
   (genera Prisma, **aplica migraciones** y compila).
5. Agrega `ADMIN_PASSWORD` y `CRONO_PASSWORD` (contraseñas iniciales del sitio en la nube).
   Región: `vercel.json` fija las funciones en `pdx1` (Portland), junto a la base de Supabase (us-west-2, Oregón). Si creas Supabase
   en otra región, cambia `regions` por la región de Vercel más cercana (cada consulta cruza esa distancia).
6. Deploy. Cada push a `main` vuelve a desplegar.

> Límite de Vercel: los cuerpos de petición no pueden superar ~4.5 MB. Los logos se reducen a 256 px en el
> navegador, así que solo afecta a importaciones de respaldos muy grandes (impórtalos en local apuntando a la misma BD).

## Despliegue en Azure

**Base de datos:** *Azure Database for PostgreSQL – Flexible Server*.
- Crea el servidor (versión 16), una base `desafio_tolota`, y en *Networking* permite acceso desde servicios de Azure.
- `DATABASE_URL` y `DIRECT_URL` (la misma): `postgresql://USUARIO:CLAVE@SERVIDOR.postgres.database.azure.com:5432/desafio_tolota?sslmode=require`

**App:** *Azure App Service* (Linux, Node 20 LTS o 22 LTS).
1. Variables en *Configuration → Application settings*: `DATABASE_URL`, `NEXT_OUTPUT=standalone`,
   `ADMIN_PASSWORD` y `CRONO_PASSWORD` (contraseñas iniciales), `SCM_DO_BUILD_DURING_DEPLOYMENT=true`.
2. Comando de inicio: `npx prisma migrate deploy && node .next/standalone/server.js`
   (si usas build *standalone* copia `public` y `.next/static` dentro de `.next/standalone`, o usa simplemente
   `npm run start` sin `NEXT_OUTPUT`).
3. Despliegue: *Deployment Center → GitHub* (crea un workflow de GitHub Actions automáticamente).

Alternativa: *Azure Static Web Apps* con soporte híbrido de Next.js, o *Azure Container Apps* con un Dockerfile.

---

## Migrar los datos de la versión HTML anterior

1. Abre el HTML antiguo en el **mismo navegador y computador** donde tienes los datos.
2. `F12` → pestaña **Consola** → pega el código que aparece en la página **Respaldo** de la app nueva → Enter.
   Se descarga `datos_version_anterior.json`.
3. En la app nueva: **Respaldo → Importar** ese archivo.

Se crea un evento por año, con sus pruebas (guardadas o configuradas), equipos, logos, fichas completas,
integrantes, tiempos (con detenciones) y puntos de disciplina. Los puntos que en la versión anterior quedaron
asignados a "Prueba actual" (sin prueba guardada) no se pueden ubicar y se reportan como *omitidos*.

---

## Uso rápido el día del evento

- **Cronometraje:** elige la prueba. Cada pista: *Cargar siguiente* → *Dar salida* → *Llegada*.
  - Teclado: `1…N` salida/llegada, `Q W E…` detenido/arrancó.
  - Pulsador físico (encoder USB que emite una tecla, por defecto `A`): haz clic en la pista para
    seleccionarla y presiona el pulsador.
  - *Salida en falso* reinicia la pista; en la tabla, ↺ borra un tiempo para repetir.
  - La pantalla no se apaga mientras haya equipos en pista (en navegadores compatibles).
- **Disciplina** puede registrarse desde otro celular al mismo tiempo; el tiempo final se ajusta solo.
- **Resultados** muestra la general acumulada y cada prueba, se actualiza cada 5 s y exporta a CSV.
- Descarga un **respaldo** al terminar cada jornada.
