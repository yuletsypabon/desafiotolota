-- Actividades espirituales configurables por evento.
CREATE TYPE "TipoActividadEspiritual" AS ENUM ('PLUS', 'TIEMPO');

ALTER TABLE "ActividadEspiritual"
  ADD COLUMN "eventoId" TEXT,
  ADD COLUMN "tipo" "TipoActividadEspiritual" NOT NULL DEFAULT 'TIEMPO',
  ADD COLUMN "puntosMaximos" INTEGER NOT NULL DEFAULT 100;

-- Las actividades existentes eran de una prueba: conservan su evento y pasan a ser de tipo Tiempo.
UPDATE "ActividadEspiritual" AS actividad
SET "eventoId" = prueba."eventoId"
FROM "Prueba" AS prueba
WHERE actividad."pruebaId" = prueba."id";

ALTER TABLE "ActividadEspiritual"
  ALTER COLUMN "eventoId" SET NOT NULL,
  ALTER COLUMN "pruebaId" DROP NOT NULL;

ALTER TABLE "ActividadEspiritual"
  ADD CONSTRAINT "ActividadEspiritual_eventoId_fkey"
  FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ActividadEspiritual_eventoId_idx" ON "ActividadEspiritual"("eventoId");

-- Cada corrección conserva una fotografía antes/después para que el histórico sea auditable.
CREATE TABLE "ResultadoCorreccion" (
  "id" TEXT NOT NULL,
  "pruebaId" TEXT NOT NULL,
  "equipoAId" TEXT NOT NULL,
  "equipoBId" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "antes" JSONB NOT NULL,
  "despues" JSONB NOT NULL,
  "rol" "Rol" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResultadoCorreccion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResultadoCorreccion_pruebaId_idx" ON "ResultadoCorreccion"("pruebaId");

ALTER TABLE "ResultadoCorreccion"
  ADD CONSTRAINT "ResultadoCorreccion_pruebaId_fkey"
  FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE CASCADE ON UPDATE CASCADE;
