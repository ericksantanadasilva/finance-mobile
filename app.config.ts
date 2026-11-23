import type { ConfigContext } from 'expo/config';

// O app.json continua sendo a base; aqui só entra o que depende do ambiente.
export default ({ config }: ConfigContext) => ({
  ...config,
  android: {
    ...config.android,
    // No EAS, a variável de arquivo GOOGLE_SERVICES_JSON (Secret) traz o
    // caminho do arquivo; no PC (npx expo run:android), o arquivo local, que
    // fica fora do Git
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
