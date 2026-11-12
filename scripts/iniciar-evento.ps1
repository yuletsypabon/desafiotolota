# Arranca el servidor local para el día del evento (no necesita internet).
# Uso: doble clic en "Iniciar evento.bat" (o: powershell -ExecutionPolicy Bypass -File scripts\iniciar-evento.ps1)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Paso($t) { Write-Host "`n== $t" -ForegroundColor Yellow }
function Falla($t) { Write-Host "`n$t" -ForegroundColor Red; Read-Host 'Presiona Enter para cerrar'; exit 1 }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Falla 'No se encontró Node.js. Instálalo desde nodejs.org (versión LTS) y vuelve a intentar.' }
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Falla 'Se creó el archivo .env a partir de .env.example. Ábrelo, revisa la contraseña de PostgreSQL y vuelve a ejecutar.'
}

if (-not (Test-Path node_modules)) {
  Paso 'Instalando dependencias (solo la primera vez, necesita internet)'
  npm ci
  if ($LASTEXITCODE) { Falla 'Falló la instalación de dependencias.' }
}

Paso 'Revisando la clave de las sesiones'
node scripts/asegurar-secreto.mjs
if ($LASTEXITCODE) { Falla 'No se pudo crear AUTH_SECRET en el archivo .env.' }

Paso 'Preparando la base de datos local'
node --env-file=.env scripts/preparar-bd.mjs
if ($LASTEXITCODE) { Falla 'No se pudo preparar la base de datos.' }
npx prisma migrate deploy
if ($LASTEXITCODE) { Falla 'No se pudieron aplicar las migraciones.' }

# Primera vez: pedir las contraseñas de Administrador y Cronometrador (solo si aún no existen)
npm run claves --silent -- --si-faltan
if ($LASTEXITCODE) { Falla 'No se pudieron guardar las contraseñas.' }

# Compilar solo si no hay build o si el código cambió desde la última compilación
$buildId = '.next\BUILD_ID'
$compilar = -not (Test-Path $buildId)
if (-not $compilar) {
  $t = (Get-Item $buildId).LastWriteTime
  $compilar = [bool](Get-ChildItem src, prisma, package.json -Recurse -File | Where-Object { $_.LastWriteTime -gt $t } | Select-Object -First 1)
}
if ($compilar) {
  Paso 'Compilando la aplicación (tarda 1-2 minutos)'
  npx next build
  if ($LASTEXITCODE) { Falla 'Falló la compilación.' }
}

$puerto = 3000
$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Select-Object -ExpandProperty IPAddress

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host '  DESAFIO TOLOTA - servidor del evento listo' -ForegroundColor Green
Write-Host "  En este computador:   http://localhost:$puerto"
foreach ($ip in $ips) { Write-Host "  En otros dispositivos: http://${ip}:$puerto" -ForegroundColor Cyan }
Write-Host '  (conectados a la misma red Wi-Fi; no hace falta internet)'
Write-Host '  Para detener el servidor: cierra esta ventana o Ctrl+C'
Write-Host "========================================================`n" -ForegroundColor Green

Start-Process "http://localhost:$puerto"
npx next start -H 0.0.0.0 -p $puerto
