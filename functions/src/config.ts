export interface Config {
  deepseek: {
    apiKey: string;
  };
  database: {
    url: string;
    secret: string;
  };
  firebase: {
    projectId: string;
  };
  debug: {
    token: string;
  };
  app: {
    url: string;
    corsOrigin: string;
  };
}

export const getConfig = (): Config => {
  // Skip validation during build/compile time
  const isBuildTime = !process.env.DEEPSEEK_API_KEY &&
    !process.env.DATABASE_URL;
  if (!isBuildTime) {
    const requiredVars = [
      "DEEPSEEK_API_KEY",
      "DATABASE_URL",
    ];

    const missing = requiredVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      const msg = `Missing required environment variables: ${missing.join(
        ", "
      )}`;
      throw new Error(msg);
    }
  }

  return {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY as string,
    },
    database: {
      url: process.env.DATABASE_URL as string,
      secret: process.env.DATABASE_SECRET || "",
    },
    firebase: {
      projectId: "focusmate-ai-8cad6",
    },
    debug: {
      token: process.env.DEBUG_TOKEN || "",
    },
    app: {
      url: process.env.APP_URL || "https://focusmate-ai-8cad6.web.app",
      corsOrigin: process.env.CORS_ORIGIN || process.env.APP_URL ||
      "https://focusmate-ai-8cad6.web.app",
    },
  };
};

export const validateConfig = (): void => {
  try {
    getConfig();
    console.log("Configuration loaded successfully");
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Configuration validation failed:", err.message);
    throw error;
  }
};
