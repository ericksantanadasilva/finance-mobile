import { Tabs } from 'expo-router/js-tabs';
import {
  ArrowLeftRight,
  Ellipsis,
  LayoutDashboard,
  Target,
} from 'lucide-react-native';

import { TabBar } from '@/components/tab-bar';

// Abas em JavaScript (estilizáveis), não NativeTabs. Mesmos ícones do menu do
// web, exceto Transações: lá é Wallet, que aqui já é o ícone do saldo.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'visão geral',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name='transactions'
        options={{
          title: 'transações',
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name='goals'
        options={{
          title: 'metas',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='more'
        options={{
          title: 'mais',
          tabBarIcon: ({ color, size }) => (
            <Ellipsis color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
