'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { LOGO } from '@/lib/marca';

/** Insignia oficial del Desafío Tolotá. Puede aparecer formada por partículas al cargar. */
export default function LogoTolota({
  tamano = 40,
  prioridad = false,
  className,
  animar = false,
}: {
  tamano?: number;
  prioridad?: boolean;
  className?: string;
  animar?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(!animar);

  useEffect(() => {
    if (!animar) {
      setVisible(true);
      return;
    }

    const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || movimientoReducido) {
      setVisible(true);
      return;
    }

    let requestId = 0;
    let cancelled = false;
    const image = new window.Image();
    image.src = LOGO;

    image.onload = () => {
      if (cancelled) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const dimension = Math.max(1, Math.round(tamano * ratio));
      canvas.width = dimension;
      canvas.height = dimension;
      canvas.style.width = `${tamano}px`;
      canvas.style.height = `${tamano}px`;

      const source = document.createElement('canvas');
      source.width = dimension;
      source.height = dimension;
      const sourceContext = source.getContext('2d');
      if (!sourceContext) {
        setVisible(true);
        return;
      }
      sourceContext.drawImage(image, 0, 0, dimension, dimension);
      const pixels = sourceContext.getImageData(0, 0, dimension, dimension).data;
      const step = Math.max(4, Math.round(dimension / 16));
      const particles: { x: number; y: number; fromX: number; fromY: number; color: string; radius: number; delay: number }[] = [];

      for (let y = 0; y < dimension; y += step) {
        for (let x = 0; x < dimension; x += step) {
          const index = (y * dimension + x) * 4;
          const alpha = pixels[index + 3];
          if (alpha < 90) continue;
          const spread = dimension * 0.65;
          particles.push({
            x,
            y,
            fromX: x + (Math.random() - 0.5) * spread * 2,
            fromY: y + (Math.random() - 0.5) * spread * 2,
            color: `rgba(${pixels[index]},${pixels[index + 1]},${pixels[index + 2]},${alpha / 255})`,
            radius: Math.max(0.7, step * (0.18 + Math.random() * 0.12)),
            delay: Math.random() * 180,
          });
        }
      }

      setVisible(false);
      const start = performance.now();
      const duration = 1050;
      const draw = (now: number) => {
        if (cancelled) return;
        const elapsed = now - start;
        context.clearRect(0, 0, dimension, dimension);
        let complete = true;
        for (const particle of particles) {
          const progress = Math.max(0, Math.min(1, (elapsed - particle.delay) / duration));
          if (progress < 1) complete = false;
          const eased = 1 - (1 - progress) ** 3;
          const x = particle.fromX + (particle.x - particle.fromX) * eased;
          const y = particle.fromY + (particle.y - particle.fromY) * eased;
          context.globalAlpha = progress;
          context.fillStyle = particle.color;
          context.beginPath();
          context.arc(x, y, particle.radius, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = 1;
        if (complete) {
          setVisible(true);
          canvas.style.opacity = '0';
          return;
        }
        requestId = window.requestAnimationFrame(draw);
      };
      requestId = window.requestAnimationFrame(draw);
    };

    image.onerror = () => setVisible(true);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(requestId);
      image.onload = null;
      image.onerror = null;
      if (canvas) canvas.style.opacity = '';
    };
  }, [animar, tamano]);

  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-flex', width: tamano, height: tamano, flexShrink: 0 }}
    >
      <Image
        src={LOGO}
        alt="Desafío Tolotá"
        width={tamano}
        height={tamano}
        priority={prioridad}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 180ms ease-out' }}
      />
      {animar && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
      )}
    </span>
  );
}
