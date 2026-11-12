-- Equipos cargados en las pistas de cada dispositivo (para que dos tablets no carguen el mismo equipo)
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "pruebaId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "dispositivo" TEXT NOT NULL,
    "pista" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Reserva_pruebaId_equipoId_key" ON "Reserva"("pruebaId", "equipoId");
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Sin acceso público en Supabase (igual que las demás tablas)
ALTER TABLE "Reserva" ENABLE ROW LEVEL SECURITY;
