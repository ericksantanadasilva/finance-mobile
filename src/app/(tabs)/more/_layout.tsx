import { Stack } from 'expo-router';

// Pilha dentro da aba "mais": categorias e recorrentes abrem por cima, com a
// barra de abas ainda visível. Tocar em "mais" de novo volta ao topo.
export default function MoreLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
