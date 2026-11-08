-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CRONO');

-- AlterTable
ALTER TABLE "Prueba" ADD COLUMN     "habilitadaDesde" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Credencial" (
    "rol" "Rol" NOT NULL,
    "hash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credencial_pkey" PRIMARY KEY ("rol")
);


-- Igual que las demás tablas: bloquear la API pública de Supabase (las contraseñas nunca deben leerse por ahí)
ALTER TABLE "Credencial" ENABLE ROW LEVEL SECURITY;
