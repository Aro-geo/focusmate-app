import {setGlobalOptions} from "firebase-functions";
import {onRequest, onCall} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {getConfig} from "./config";

if (!admin.apps.length) {
  admin.initializeApp();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let config: any;
try {
  config = getConfig();
} catch (error) {
  console.warn("Config validation failed during build:", error);
  config = {
    deepseek: {apiKey: ""},
    database: {url: "", secret: ""},
    firebase: {
      projectId: "focusmate-ai-8cad6",
    },
    debug: {token: ""},
    app: {url: "", corsOrigin: ""},
  };
}

setGlobalOptions({maxInstances: 10});

export const analyzeTask = onCall(async (request) => {
  const {task, model = "deepseek-chat", temperature = 1.0} = request.data;

  if (!config.deepseek.apiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.deepseek.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: "system",
          content: "You are a friendly productivity assistant. Write in a " +
            "conversational, warm tone as if speaking to a friend. Don't use " +
            "markdown, bullet points, or formal language.",
        },
        {
          role: "user",
          content: `Analyze task: "${task}". Provide complexity, time.`,
        }],
        max_tokens: 200,
        temperature,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "";

    return {
      analysis: aiResponse,
      complexity: "medium",
      estimatedTime: 30,
      priority: "high",
      suggestions: ["Break into smaller tasks", "Set a timer"],
    };
  } catch (error) {
    logger.error("Task analysis failed", error);
    throw new Error("Failed to analyze task");
  }
});

// Removed prioritizeTasks cloud function to avoid excessive token consumption
// and performance issues. Task prioritization is now handled client-side
// using rule-based sorting and the stable chat() function for AI suggestions.

export const generateUserAnalytics = onDocumentCreated(
  "users/{userId}/sessions/{sessionId}",
  async (event) => {
    const sessionData = event.data?.data();
    const userId = event.params.userId;

    logger.info("Generating analytics", {userId, sessionData});

    try {
      const analytics = {
        totalSessions: 1,
        averageDuration: sessionData?.duration || 0,
        productivity: "improving",
      };

      await admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("analytics")
        .add({
          ...analytics,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      logger.error("Analytics generation failed", error);
    }
  }
);

export const aiChat = onCall(async (request) => {
  const {
    message,
    context,
    model = "deepseek-chat",
    temperature = 1.3,
  } = request.data;

  if (!config.deepseek.apiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  try {
    const systemMsg = "You are a friendly productivity assistant for " +
      "FocusMate AI. Respond conversationally as if speaking to a friend. " +
      "Do not use markdown formatting, bullet points, or numbered lists. " +
      "Keep your tone warm, helpful and human-like.";

    const messages = [
      {role: "system", content: systemMsg},
      ...(context ? [{role: "user", content: context}] : []),
      {role: "user", content: message},
    ];

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.deepseek.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 500,
        temperature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "DeepSeek API error");
    }

    return {
      response: data.choices[0]?.message?.content || "No response generated",
      usage: data.usage,
    };
  } catch (error) {
    logger.error("AI chat failed", error);
    throw new Error("Failed to get AI response");
  }
});

export const healthCheck = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", config.app.corsOrigin || "*");
  res.set("Access-Control-Allow-Methods", "GET");

  try {
    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      configLoaded: {
        deepseek: !!config.deepseek.apiKey,
        database: !!config.database.url,
      },
    };

    res.json(status);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Health check failed", error);
    res.status(500).json({
      status: "unhealthy",
      error: err.message,
    });
  }
});
