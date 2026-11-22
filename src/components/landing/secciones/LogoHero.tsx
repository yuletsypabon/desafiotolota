import s from './LogoHero.module.css';

const PIEZAS = Array.from({ length: 9 }, (_, i) => i);
const DESTELLOS = [
  { x: 14, y: 28, delay: 180 }, { x: 22, y: 74, delay: 420 }, { x: 30, y: 14, delay: 260 },
  { x: 39, y: 88, delay: 520 }, { x: 50, y: 8, delay: 320 }, { x: 62, y: 90, delay: 610 },
  { x: 72, y: 16, delay: 240 }, { x: 82, y: 70, delay: 470 }, { x: 89, y: 38, delay: 350 },
  { x: 8, y: 55, delay: 560 }, { x: 94, y: 56, delay: 210 }, { x: 56, y: 24, delay: 680 },
];

/** Logo del evento que se arma en nueve fragmentos al entrar en el hero. */
export default function LogoHero() {
  return (
    <div className={s.logo} role="img" aria-label="Logo del Desafío Tolotá">
      {PIEZAS.map((pieza) => (
        <span
          key={pieza}
          className={s.pieza}
          style={{ animationDelay: `${pieza * 85}ms` }}
          aria-hidden="true"
        />
      ))}
      <div className={s.particulas} aria-hidden="true">
        {DESTELLOS.map(({ x, y, delay }, i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}
