import { useUnstableNativeVariable } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

// Mesmo desenho do Blob do login do web (financeiro/app/page.tsx), num
// quadro de 200 com o centro em (100, 100)
const BLOB_PATH =
  'M44.7,-58.6C57.1,-46.7,65.9,-31.8,69.6,-15.6C73.3,0.6,71.9,18.1,63.9,31.7C55.9,45.3,41.3,55,25.4,61.8C9.5,68.6,-7.7,72.5,-23.6,68.4C-39.5,64.3,-54.1,52.2,-63.2,36.9C-72.3,21.6,-75.9,3.1,-71.7,-13.2C-67.5,-29.5,-55.5,-43.6,-41.6,-55.3C-27.7,-67,-13.9,-76.3,1.3,-77.9C16.5,-79.5,32.3,-70.5,44.7,-58.6Z';
const VIEWBOX = 200;
// Contorno de 3 px na tela, como no web, qualquer que seja o tamanho
const STROKE = 3;

function useColor(name: `--${string}`) {
  const value: unknown = useUnstableNativeVariable(name);
  return typeof value === 'string' ? value : undefined;
}

type BlobProps = {
  size: number;
  rotate: string;
  fill?: string;
  stroke?: string;
  position: { top?: number; bottom?: number; left?: number; right?: number };
};

function Blob({ size, rotate, fill, stroke, position }: BlobProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      style={{ position: 'absolute', ...position, transform: [{ rotate }] }}
    >
      <Path
        transform='translate(100 100)'
        d={BLOB_PATH}
        fill={fill}
        stroke={stroke}
        strokeWidth={(STROKE * VIEWBOX) / size}
      />
    </Svg>
  );
}

/**
 * Formas do fundo do login, como no web: magenta no canto de cima à
 * esquerda e roxo no de baixo à direita, contornadas com ink. Só decoração
 * (vão no `decoration` do CenteredScreen, que as esconde do leitor de tela e
 * do toque). Metade de cada uma fica fora da tela.
 */
export function LoginBlobs() {
  const highlight = useColor('--highlight');
  const ai = useColor('--ai');
  const ink = useColor('--ink');

  return (
    <>
      <Blob
        size={280}
        rotate='12deg'
        fill={highlight}
        stroke={ink}
        position={{ top: -100, left: -100 }}
      />
      <Blob
        size={300}
        rotate='-20deg'
        fill={ai}
        stroke={ink}
        position={{ bottom: -110, right: -100 }}
      />
    </>
  );
}
