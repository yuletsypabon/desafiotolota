CREATE TYPE "EstadoPeticionOracion" AS ENUM ('PENDIENTE', 'PUBLICADA', 'RECHAZADA');
CREATE TYPE "VisibilidadPeticionOracion" AS ENUM ('PRIVADA', 'PUBLICA');

CREATE TABLE "PeticionOracion" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(60),
    "peticion" VARCHAR(600) NOT NULL,
    "visibilidad" "VisibilidadPeticionOracion" NOT NULL,
    "estado" "EstadoPeticionOracion" NOT NULL DEFAULT 'PENDIENTE',
    "consentimientoAt" TIMESTAMP(3),
    "oraciones" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisadoAt" TIMESTAMP(3),

    CONSTRAINT "PeticionOracion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PeticionOracion_estado_createdAt_idx" ON "PeticionOracion"("estado", "createdAt");
CREATE INDEX "PeticionOracion_visibilidad_estado_createdAt_idx" ON "PeticionOracion"("visibilidad", "estado", "createdAt");

ALTER TABLE "PeticionOracion" ENABLE ROW LEVEL SECURITY;
