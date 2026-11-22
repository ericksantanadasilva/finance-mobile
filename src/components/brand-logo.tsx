import { Image } from 'expo-image';
import { useColorScheme, View } from 'react-native';

import { useHardShadow } from '@/lib/hard-shadow';

const LIGHT = require('@/assets/images/brand/logo_fn_branco.png');
const DARK = require('@/assets/images/brand/logo_fn_preto.png');

// inner = raio de fora menos a borda de 2px, para a imagem encaixar no contorno
const SIZES = {
  sm: { box: 'size-8', radius: 'rounded-lg', inner: 'rounded-md' },
  md: { box: 'size-10', radius: 'rounded-[10px]', inner: 'rounded-lg' },
} as const;

// scale 1.05: as imagens já têm uma borda cinza fina no arredondado; ampliar um
// pouco e cortar deixa só o contorno ink do adesivo (igual ao web)
const IMAGE_STYLE = {
  width: '100%',
  height: '100%',
  transform: [{ scale: 1.05 }],
} as const;

/**
 * Logo no estilo adesivo (contorno ink + sombra dura pequena). Acompanha o tema
 * sem inverter: claro usa a versão clara, escuro a escura. Decorativa: sempre
 * aparece ao lado do texto "Finance.ai".
 */
export function BrandLogo({ size = 'sm' }: { size?: keyof typeof SIZES }) {
  const scheme = useColorScheme();
  const shadow = useHardShadow('sm');
  const { box, radius, inner } = SIZES[size];

  return (
    // A sombra fica no View de fora: o de dentro corta a imagem no arredondado
    <View
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      className={`${box} ${radius} shrink-0 border-2 border-ink`}
      style={shadow}
    >
      <View className={`flex-1 overflow-hidden ${inner}`}>
        <Image
          source={scheme === 'dark' ? DARK : LIGHT}
          contentFit='cover'
          style={IMAGE_STYLE}
        />
      </View>
    </View>
  );
}
