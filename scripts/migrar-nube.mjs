// Crea / actualiza las tablas en la base de datos de la nube (NUBE_DATABASE_URL).
// Uso: npm run nube:migrar
import { spawnSync } from 'node:child_process';

const nube = process.env.NUBE_DATABASE_URL;
if (!nube) {
  console.error('✖ Falta NUBE_DATABASE_URL en el archivo .env');
  process.exit(1);
}
const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, DATABASE_URL: nube, DIRECT_URL: nube },
});
process.exit(r.status ?? 1);
