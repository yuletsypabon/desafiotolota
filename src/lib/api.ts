import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError, type ZodTypeAny, type z } from 'zod';

export type Ctx<P extends Record<string, string> = { id: string }> = { params: Promise<P> };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  const json = await req.json().catch(() => {
    throw new ZodError([{ code: 'custom', path: [], message: 'JSON inválido' }]);
  });
  return schema.parse(json);
}

/** Envuelve un handler y traduce errores conocidos a respuestas HTTP legibles. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ZodError) {
        const msg = e.issues.map((i) => `${i.path.join('.') || 'datos'}: ${i.message}`).join('; ');
        return fail(msg, 400);
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') return fail('Ya existe un registro con esos datos (duplicado).', 409);
        if (e.code === 'P2025') return fail('Registro no encontrado.', 404);
        if (e.code === 'P2003') return fail('Referencia inválida (registro relacionado no existe).', 400);
      }
      if (e instanceof HttpError) return fail(e.message, e.status);
      console.error(e);
      return fail('Error interno del servidor', 500);
    }
  };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function notFound(what = 'Registro'): never {
  throw new HttpError(404, `${what} no encontrado`);
}
