import type { ParticipanteDTO } from './types';

/** Respuestas que significan "nada que reportar" en la ficha médica. */
const SIN_DATO = /^(ningun[oa]?|no|n\/a|na|-)$/i;

/** ¿La ficha tiene alergias, enfermedades, medicamentos o limitaciones que el equipo médico deba conocer? */
export const tieneAlerta = (p: ParticipanteDTO) =>
  [p.alergias, p.enfermedades, p.medicamentos, p.limitaciones].some((v) => v && !SIN_DATO.test(v.trim()));
