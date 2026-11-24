import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';
import s from './flecha-accion.module.css';

type Direccion = 'salir' | 'abajo' | 'derecha' | 'izquierda';

const ICONOS = {
  salir: ArrowOutwardRoundedIcon,
  abajo: SouthRoundedIcon,
  derecha: ArrowForwardRoundedIcon,
  izquierda: ArrowBackRoundedIcon,
} as const;

/** Flecha circular con icono Material UI, siguiendo el acento amarillo de Tolotá. */
export default function FlechaAccion({ direccion = 'salir' }: { direccion?: Direccion }) {
  const Icono = ICONOS[direccion];
  return <span className={s.flecha} aria-hidden="true"><Icono /></span>;
}
