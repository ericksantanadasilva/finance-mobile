import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useUnstableNativeVariable } from 'nativewind';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { useHardShadow } from '@/lib/hard-shadow';

/**
 * Barra de abas neo-brutalista: a aba ativa é adesivo (contorno ink + sombra
 * dura), as inativas são planas. Segue o contrato da barra padrão: emite
 * tabPress (a pilha de "mais" volta ao topo) e só então troca de aba.
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

  return (
    <View
      accessibilityRole='tablist'
      className='flex-row gap-2 border-t-2 border-ink bg-background pt-2'
      style={{
        // pb-2 somado à área segura (barra de gestos do Android)
        paddingBottom: insets.bottom + 8,
        paddingLeft: insets.left + 8,
        paddingRight: insets.right + 8,
      }}
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
      // min-h-12: área de toque confortável (48dp)
      className={`min-h-12 flex-1 items-center justify-center gap-0.5 rounded-xl border-2 px-1 py-1.5 ${focused ? 'border-ink bg-surface' : 'border-transparent'}`}
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
