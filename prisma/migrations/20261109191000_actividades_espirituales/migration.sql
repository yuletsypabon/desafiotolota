ALTER TABLE "Evento"
ADD COLUMN "descuentoEspiritualPorPuntoMs" DOUBLE PRECISION NOT NULL DEFAULT 0.02;

CREATE TABLE "ActividadEspiritual" (
    "id" TEXT NOT NULL,
    "pruebaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActividadEspiritual_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PuntajeEspiritual" (
    "id" TEXT NOT NULL,
    "actividadId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PuntajeEspiritual_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActividadEspiritual_pruebaId_idx" ON "ActividadEspiritual"("pruebaId");
CREATE INDEX "PuntajeEspiritual_equipoId_idx" ON "PuntajeEspiritual"("equipoId");
CREATE UNIQUE INDEX "PuntajeEspiritual_actividadId_equipoId_key" ON "PuntajeEspiritual"("actividadId", "equipoId");

ALTER TABLE "ActividadEspiritual"
ADD CONSTRAINT "ActividadEspiritual_pruebaId_fkey"
FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PuntajeEspiritual"
ADD CONSTRAINT "PuntajeEspiritual_actividadId_fkey"
FOREIGN KEY ("actividadId") REFERENCES "ActividadEspiritual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PuntajeEspiritual"
ADD CONSTRAINT "PuntajeEspiritual_equipoId_fkey"
FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
