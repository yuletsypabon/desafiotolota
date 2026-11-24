CREATE TYPE "EstadoTestimonio" AS ENUM ('PENDIENTE', 'PUBLICADO', 'RECHAZADO');

CREATE TABLE "Testimonio" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "anio" INTEGER NOT NULL,
    "comentario" VARCHAR(600) NOT NULL,
    "estado" "EstadoTestimonio" NOT NULL DEFAULT 'PENDIENTE',
    "consentimientoAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisadoAt" TIMESTAMP(3),

    CONSTRAINT "Testimonio_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Testimonio_estado_createdAt_idx" ON "Testimonio"("estado", "createdAt");

ALTER TABLE "Testimonio" ENABLE ROW LEVEL SECURITY;
