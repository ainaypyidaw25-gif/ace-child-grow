import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mm.com.acegroup.acechildgrow',
  appName: 'ACE Child Grow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#F5FAFD',
  },
};

export default config;
