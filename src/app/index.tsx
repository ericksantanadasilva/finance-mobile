import { StyleSheet, Text, View } from 'react-native';

import { env } from '@/lib/env';

// Tela provisória: vira o login na Etapa 2
export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Finance.ai</Text>
      <Text>API: {env.apiUrl}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
