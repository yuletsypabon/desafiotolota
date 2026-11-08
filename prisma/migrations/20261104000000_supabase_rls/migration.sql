-- Supabase expone el esquema "public" por su API REST (PostgREST) con la clave anónima.
-- Activar RLS sin políticas bloquea ese acceso: solo la app (usuario postgres vía Prisma) lee y escribe.
-- Importante porque aquí hay fichas médicas y datos personales.
-- En PostgreSQL normal (local / CI / Azure) no tiene efecto sobre la app: el dueño de las tablas omite RLS.
ALTER TABLE "Evento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prueba" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Participante" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resultado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PuntoDisciplina" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
