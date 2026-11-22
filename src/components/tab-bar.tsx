import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from 'expo-router/js-tabs';
import { useUnstableNativeVariable } from 'nativewind';
import { use, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { useHardShadow } from '@/lib/hard-shadow';

// Distância da barra até as bordas da tela, além da área segura
const MARGIN_X = 16;
const MARGIN_BOTTOM = 12;

/**
 * Barra de abas flutuante: um adesivo (contorno ink + sombra dura) solto das
 * bordas, por cima do conteúdo. Dentro dela, a aba ativa é um adesivo menor e
 * as inativas são planas. Segue o contrato da barra padrão: emite tabPress (a
 * pilha de "mais" volta ao topo) e só então troca de aba.
 */
export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  // tabBarIcon recebe a cor por prop (contrato da barra padrão): lida do token
  const active: unknown = useUnstableNativeVariable('--foreground');
  const inactive: unknown = useUnstableNativeVariable('--muted-foreground');
  const shadow = useHardShadow();
  // Altura que a barra cobre (dela até o pé da tela): as telas leem pelo
  // BottomTabBarHeightContext para deixar espaço no fim do conteúdo
  const setTabBarHeight = use(BottomTabBarHeightCallbackContext);
  const bottom = insets.bottom + MARGIN_BOTTOM;

  return (
    <View
      accessibilityRole='tablist'
      onLayout={(event) =>
        setTabBarHeight?.(event.nativeEvent.layout.height + bottom)
      }
      // Flutua: absoluta, as telas ocupam a altura toda por baixo dela
      className='absolute flex-row gap-1 rounded-3xl border-2 border-ink bg-surface p-1.5'
      style={[
        shadow,
        {
          bottom,
          left: insets.left + MARGIN_X,
          right: insets.right + MARGIN_X,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = index === state.index;
        const label = options.title ?? route.name;
        const color = focused ? active : inactive;

        function onPress() {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }

        return (
          <TabItem
            key={route.key}
            label={label}
            focused={focused}
            icon={options.tabBarIcon?.({
              focused,
              color: typeof color === 'string' ? color : 'currentColor',
              size: 20,
            })}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

type TabItemProps = {
  label: string;
  focused: boolean;
  icon: ReactNode;
  onPress: () => void;
};

function TabItem({ label, focused, icon, onPress }: TabItemProps) {
  const shadow = useHardShadow('sm');

  return (
    <Pressable
      accessibilityRole='tab'
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      // min-h-12: área de toque confortável (48dp). rounded-2xl = raio da barra
      // (24) menos o p-1.5 e a borda, para os cantos acompanharem os dela
      className={`min-h-12 flex-1 items-center justify-center gap-0.5 rounded-2xl border-2 px-1 py-1.5 ${focused ? 'border-ink bg-surface-muted' : 'border-transparent'}`}
      style={focused ? shadow : undefined}
    >
      {icon}
      <Text
        tone={focused ? 'default' : 'muted'}
        numberOfLines={1}
        className='text-xs font-bold lowercase'
      >
        {label}
      </Text>
    </Pressable>
  );
}
