// Se asegura de que .env tenga AUTH_SECRET (la clave con la que se firman las sesiones).
// Si falta o está vacía, genera una aleatoria y la escribe en .env. Nunca la muestra en pantalla.
// Uso: node scripts/asegurar-secreto.mjs   (lo llama "Iniciar evento.bat")
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const archivo = '.env';
const texto = readFileSync(archivo, 'utf8');
const linea = /^AUTH_SECRET=(.*)$/m;
const actual = texto.match(linea)?.[1]?.trim().replace(/^["']|["']$/g, '');

if (actual) {
  console.log('AUTH_SECRET ya está configurada.');
} else {
  const nueva = `AUTH_SECRET="${randomBytes(48).toString('base64url')}"`;
  const salto = texto.endsWith('\n') || !texto ? '' : '\n';
  writeFileSync(archivo, linea.test(texto) ? texto.replace(linea, nueva) : `${texto}${salto}${nueva}\n`);
  console.log('Se creó una AUTH_SECRET nueva en .env (las sesiones abiertas tendrán que iniciar sesión de nuevo).');
}
