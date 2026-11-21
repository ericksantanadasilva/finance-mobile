import { Link } from 'expo-router';
import { ScrollView, Text, useColorScheme, View } from 'react-native';

import { useHardShadow } from '@/lib/hard-shadow';

// PROVISÓRIO (Etapa 3): vitrine para provar o NativeWind no SDK 58, os tokens
// e a sombra dura. Só em desenvolvimento; sai quando os componentes base existirem.

const SURFACES = [
  ['bg-background', 'background'],
  ['bg-surface', 'surface'],
  ['bg-surface-muted', 'surface-muted'],
  ['bg-band', 'band'],
] as const;

const ACCENTS = [
  ['bg-income', 'text-income-foreground', 'income ↑'],
  ['bg-expense', 'text-expense-foreground', 'expense ↓'],
  ['bg-warning', 'text-warning-foreground', 'warning'],
  ['bg-highlight', 'text-highlight-foreground', 'highlight'],
  ['bg-ai', 'text-ai-foreground', 'ai'],
  ['bg-danger', 'text-danger-foreground', 'danger'],
] as const;

export default function ThemeTest() {
  const scheme = useColorScheme();
  const shadowSm = useHardShadow('sm');
  const shadowMd = useHardShadow();
  const shadowLg = useHardShadow('lg');

  return (
    <ScrollView
      className='bg-background'
      contentContainerClassName='gap-4 p-6 pt-16'
    >
      <Text className='font-display text-2xl font-bold text-foreground'>
        vitrine do tema ({scheme})
      </Text>

      {/* 0. Fontes embutidas pelo plugin do expo-font (3ª build) */}
      <View className='gap-1 rounded-xl border-2 border-ink bg-surface p-4'>
        <Text className='font-sans text-foreground'>
          space grotesk 400 · R$ 1.234,56
        </Text>
        <Text className='font-sans font-medium text-foreground'>
          space grotesk 500 (font-medium) · R$ 1.234,56
        </Text>
        <Text className='font-sans font-bold text-foreground'>
          space grotesk 700 (font-bold) · R$ 1.234,56
        </Text>
        <Text className='font-display text-foreground'>space mono 400</Text>
        <Text className='font-display font-bold text-foreground'>
          space mono 700 (títulos)
        </Text>
        <Text className='text-foreground'>sem classe de fonte (sistema)</Text>
      </View>

      {/* 1. Classes padrão do Tailwind (prova do NativeWind) */}
      <View className='rounded-xl border-2 border-black bg-yellow-200 p-4'>
        <Text className='font-bold lowercase text-black'>
          1. CLASSES PADRÃO (DEVE FICAR EM MINÚSCULAS)
        </Text>
        <Text className='text-sm text-black'>
          fundo amarelo, borda preta de 2px, cantos arredondados
        </Text>
      </View>

      {/* 2. Tokens: devem trocar sozinhos entre claro e escuro */}
      <Text className='text-lg font-bold text-foreground'>2. tokens</Text>
      <View className='gap-2'>
        {SURFACES.map(([bg, name]) => (
          <View
            key={name}
            className={`${bg} rounded-lg border-2 border-ink px-3 py-2`}
          >
            <Text className='text-foreground'>{name}</Text>
            <Text className='text-sm text-muted-foreground'>
              muted-foreground
            </Text>
          </View>
        ))}
        <View className='rounded-lg border-2 border-border-custom bg-surface px-3 py-2'>
          <Text className='text-foreground'>borda fina border-custom</Text>
        </View>
        <View className='flex-row flex-wrap gap-2'>
          {ACCENTS.map(([bg, fg, label]) => (
            <View key={label} className={`${bg} rounded-md px-3 py-2`}>
              <Text className={`${fg} font-bold`}>{label}</Text>
            </View>
          ))}
        </View>
        <Text className='text-foreground'>
          <Text className='font-bold text-income'>↑ R$ 100,00</Text>
          {'  '}
          <Text className='font-bold text-expense'>↓ R$ 50,00</Text>
        </Text>
        <View className='rounded-lg border-2 border-danger-border bg-danger px-3 py-2'>
          <Text className='font-bold text-danger-foreground'>
            botão danger (claro: preenchido; escuro: contornado)
          </Text>
        </View>
      </View>

      {/* 3. Sombra dura pelo hook useHardShadow (sem desfoque, cor do --ink) */}
      <Text className='text-lg font-bold text-foreground'>3. sombra dura</Text>
      <View className='gap-6 pb-2 pr-2'>
        <View
          className='rounded-md border-2 border-ink bg-surface p-3'
          style={shadowSm}
        >
          <Text className='text-foreground'>
            sm: 2px (selos, itens pequenos)
          </Text>
        </View>
        <View
          className='rounded-2xl border-2 border-ink bg-surface p-4'
          style={shadowMd}
        >
          <Text className='text-foreground'>
            md: 4px (padrão: cards, botões)
          </Text>
        </View>
        <View
          className='rounded-2xl border-2 border-ink bg-surface p-4'
          style={shadowLg}
        >
          <Text className='text-foreground'>
            lg: 6px (diálogos, card de login)
          </Text>
        </View>
      </View>

      <Link href='/' className='py-2 text-base text-foreground underline'>
        voltar
      </Link>
    </ScrollView>
  );
}
