-- CreateEnum
CREATE TYPE "EstadoPrueba" AS ENUM ('PENDIENTE', 'EN_CURSO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "TipoPunto" AS ENUM ('LEVE', 'MEDIA', 'GRAVE', 'POSITIVO');

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo" TEXT,
    "numPistas" INTEGER NOT NULL DEFAULT 3,
    "pulsadorKey" TEXT NOT NULL DEFAULT 'A',
    "penLeveMs" INTEGER NOT NULL DEFAULT 300,
    "penMediaMs" INTEGER NOT NULL DEFAULT 500,
    "penGraveMs" INTEGER NOT NULL DEFAULT 1000,
    "bonPositivoMs" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prueba" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPrueba" NOT NULL DEFAULT 'PENDIENTE',
    "ordenSalida" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prueba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "capitan" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participante" (
    "id" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaNacimiento" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "residencia" TEXT,
    "profesion" TEXT,
    "contactoNombre" TEXT,
    "contactoParentesco" TEXT,
    "contactoTelefono" TEXT,
    "tipoSangre" TEXT,
    "alergias" TEXT,
    "enfermedades" TEXT,
    "medicamentos" TEXT,
    "limitaciones" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resultado" (
    "id" TEXT NOT NULL,
    "pruebaId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "pista" INTEGER,
    "salidaAt" TIMESTAMP(3) NOT NULL,
    "llegadaAt" TIMESTAMP(3) NOT NULL,
    "brutoMs" INTEGER NOT NULL,
    "detencionesMs" INTEGER NOT NULL DEFAULT 0,
    "detenciones" JSONB NOT NULL DEFAULT '[]',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resultado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuntoDisciplina" (
    "id" TEXT NOT NULL,
    "pruebaId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "participanteId" TEXT,
    "tipo" "TipoPunto" NOT NULL,
    "descripcion" TEXT,
    "hora" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuntoDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evento_anio_idx" ON "Evento"("anio");

-- CreateIndex
CREATE INDEX "Prueba_eventoId_idx" ON "Prueba"("eventoId");

-- CreateIndex
CREATE INDEX "Equipo_eventoId_idx" ON "Equipo"("eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_eventoId_nombre_key" ON "Equipo"("eventoId", "nombre");

-- CreateIndex
CREATE INDEX "Participante_equipoId_idx" ON "Participante"("equipoId");

-- CreateIndex
CREATE UNIQUE INDEX "Resultado_pruebaId_equipoId_key" ON "Resultado"("pruebaId", "equipoId");

-- CreateIndex
CREATE INDEX "PuntoDisciplina_pruebaId_idx" ON "PuntoDisciplina"("pruebaId");

-- CreateIndex
CREATE INDEX "PuntoDisciplina_equipoId_idx" ON "PuntoDisciplina"("equipoId");

-- AddForeignKey
ALTER TABLE "Prueba" ADD CONSTRAINT "Prueba_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultado" ADD CONSTRAINT "Resultado_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultado" ADD CONSTRAINT "Resultado_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuntoDisciplina" ADD CONSTRAINT "PuntoDisciplina_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuntoDisciplina" ADD CONSTRAINT "PuntoDisciplina_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuntoDisciplina" ADD CONSTRAINT "PuntoDisciplina_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
