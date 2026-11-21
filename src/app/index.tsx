import { StyleSheet, Text, View } from 'react-native';

// Tela provisória: vira o login na Etapa 2
export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Finance.ai</Text>
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
