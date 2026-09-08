import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.exofters.loveoutloud',
  appName: 'Love Out Loud',
  webDir: 'www',
  overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  "server": {
    "allowNavigation": ["https://api.loveoutloudoz.com", "https://hookaleft.com", "https://loveoutloudoz.com", "https://api.ap3api.com"]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    InAppBrowser: {
      presentationStyle: 'popover', // default: 'fullscreen'
    },

  },
};

export default config;
