import TopBar from '@/components/TopBar';

/** Marco del sistema de cronometraje: barra superior con rol, eventos, respaldo y salir. */
export default function SistemaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main>{children}</main>
    </>
  );
}
