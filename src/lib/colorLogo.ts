'use client';
import { useEffect, useState } from 'react';

/**
 * Color más llamativo de un logo: se reduce la imagen a 32×32, se descartan los píxeles grises, muy oscuros o muy
 * claros, y gana el tono (en 24 grupos) más vivo y abundante, evitando naranjas y dorados si hay otro color.
 * Devuelve el promedio de ese grupo en hex.
 */
function colorDestacado(img: HTMLImageElement): string | null {
  const lado = 32;
  const c = document.createElement('canvas');
  c.width = lado;
  c.height = lado;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, lado, lado);
  const { data } = ctx.getImageData(0, 0, lado, lado);

  // 24 grupos de 15° de tono; cada uno recuerda su tono para poder descartar los dorados
  const grupos = Array.from({ length: 24 }, (_, i) => ({ tono: i * 15, peso: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue; // transparente
    const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
    if (s < 0.35 || l < 0.2 || l > 0.82) continue; // gris, casi negro o casi blanco
    let h = 0;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    const grupo = grupos[Math.floor((((h * 60) % 360) + 360) % 360 / 15)];
    const peso = s * (1 - Math.abs(2 * l - 1) * 0.6); // vale más un color vivo y de luz media que uno apagado
    grupo.peso += peso;
    grupo.r += data[i] * peso;
    grupo.g += data[i + 1] * peso;
    grupo.b += data[i + 2] * peso;
  }
  // Se prefiere un tono fuera de los naranjas, dorados y pieles (15°–65°): el amarillo ya lo usan las demás cartas y
  // los dorados y tonos de piel aparecen en casi todos los escudos ilustrados, así que no distinguen al equipo
  const conColor = grupos.filter((g) => g.peso >= 2);
  if (!conColor.length) return null; // logo casi sin color
  const otros = conColor.filter((g) => g.tono < 15 || g.tono >= 60);
  const mejor = (otros.length ? otros : conColor).reduce((a, b) => (b.peso > a.peso ? b : a));
  const hex = (v: number) => Math.round(v / mejor.peso).toString(16).padStart(2, '0');
  return `#${hex(mejor.r)}${hex(mejor.g)}${hex(mejor.b)}`;
}

/** ¿Va mejor texto oscuro sobre este color? (luminancia relativa) */
export function esColorClaro(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}

/** Color destacado del logo (null mientras carga, si no hay logo o si el logo no tiene color). */
export function useColorLogo(logo?: string | null) {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!logo) return setColor(null);
    let vigente = true;
    const img = new Image();
    img.onload = () => {
      try {
        if (vigente) setColor(colorDestacado(img));
      } catch {
        if (vigente) setColor(null); // imagen de otro dominio sin permiso de lectura
      }
    };
    img.src = logo;
    return () => {
      vigente = false;
    };
  }, [logo]);
  return color;
}
