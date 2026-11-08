// Crea o cambia las contraseñas de Administrador y Cronometrador desde la terminal del servidor.
// Uso:  npm run claves              → pide las dos contraseñas
//       npm run claves -- --si-faltan → solo si aún no hay contraseña de administrador (lo usa Iniciar evento)
//
// Se hace aquí y no en el navegador a propósito: lo que llega por la red se puede falsificar,
// lo que se escribe en la terminal de este computador no.
import { createInterface } from 'node:readline';
import { PrismaClient } from '@prisma/client';
import { hashClave } from '../src/lib/clave';
import { clavesIniciales } from '../src/lib/validators';

const prisma = new PrismaClient();

// Un solo lector de teclado para todo el proceso: abrir y cerrar uno por pregunta pierde lo escrito en Windows
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let ocultar = false;
// readline repite en pantalla cada tecla: mientras se pide una contraseña no se muestra nada
const salida = rl as unknown as { _writeToOutput: (s: string) => void };
const escribirOriginal = salida._writeToOutput.bind(rl);
salida._writeToOutput = (s: string) => {
  if (!ocultar) escribirOriginal(s);
};

// Cola de líneas: cada Enter se guarda aquí y cada pregunta toma la siguiente (así no se pierde ninguna)
const lineas: string[] = [];
let esperando: ((linea: string | null) => void) | null = null;
let cerrado = false;
rl.on('line', (l) => (esperando ? (esperando(l), (esperando = null)) : lineas.push(l)));
rl.on('close', () => {
  cerrado = true;
  esperando?.(null);
});

function leerLinea(): Promise<string> {
  if (lineas.length) return Promise.resolve(lineas.shift()!);
  if (cerrado) return Promise.reject(new Error('se cerró la entrada antes de terminar'));
  return new Promise((resolve, reject) => {
    esperando = (l) => (l === null ? reject(new Error('se cerró la entrada antes de terminar')) : resolve(l));
  });
}

/** Pregunta sin mostrar lo que se escribe (como un campo de contraseña). */
async function preguntarOculto(texto: string) {
  process.stdout.write(texto);
  ocultar = true;
  try {
    return (await leerLinea()).trim();
  } finally {
    ocultar = false;
    process.stdout.write('\n');
  }
}

async function pedirClave(nombre: string) {
  for (;;) {
    const a = await preguntarOculto(`  Contraseña del ${nombre}: `);
    const b = await preguntarOculto('  Repítela: ');
    if (a === b) return a;
    console.log('  ✖ No coinciden. Intenta de nuevo.\n');
  }
}

async function main() {
  if (process.argv.includes('--si-faltan') && (await prisma.credencial.count({ where: { rol: 'ADMIN' } }))) return;

  console.log('\n🔐 Contraseñas del DESAFÍO Tolotá (mínimo 4 caracteres, distintas para cada rol)\n');
  for (;;) {
    const admin = await pedirClave('Administrador');
    const crono = await pedirClave('Cronometrador');
    const r = clavesIniciales.safeParse({ admin, crono });
    if (!r.success) {
      console.log(`  ✖ ${r.error.issues.map((i) => i.message).join('; ')}\n`);
      continue;
    }
    for (const [rol, clave] of [['ADMIN', admin], ['CRONO', crono]] as const) {
      const hash = await hashClave(clave);
      await prisma.credencial.upsert({ where: { rol }, create: { rol, hash }, update: { hash } });
    }
    console.log('\n✔ Contraseñas guardadas (cifradas). Ya puedes iniciar sesión en la app.\n');
    return;
  }
}

main()
  .catch((e) => {
    console.error('✖ No se pudieron guardar las contraseñas:', e.message);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
    return prisma.$disconnect();
  });
