// Shared configuration storage using global variable
declare global {
  var whatsappConfig: {
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
    webhookUrl: string;
  } | null;
}

// Initialize global config if not exists
if (!global.whatsappConfig) {
  global.whatsappConfig = null;
}

export const getConfig = () => global.whatsappConfig;

export const setConfig = (config: {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  webhookUrl: string;
}) => {
  global.whatsappConfig = config;
  console.log('Configuration updated:', {
    accessToken: config.accessToken.substring(0, 10) + '...',
    phoneNumberId: config.phoneNumberId,
    verifyToken: config.verifyToken,
    webhookUrl: config.webhookUrl
  });
};

export const clearConfig = () => {
  global.whatsappConfig = null;
};
