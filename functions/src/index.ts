import {setGlobalOptions} from "firebase-functions";
import {onRequest, onCall} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {getConfig} from "./config";
import * as crypto from "crypto";

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

// Force deployment with correct CORS settings - updated

export const analyzeTask = onCall({
  cors: [
    config.app.corsOrigin,
    "https://focusmate-ai-8cad6.web.app",
    "https://focusmate-ai-8cad6.firebaseapp.com",
    "http://localhost:3000",
  ],
}, async (request) => {
  const {
    task,
    model = "deepseek-reasoner", // Use analytical model for task analysis
    temperature,
  } = request.data;

  if (!config.deepseek.apiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  try {
    const modelConfig = getDeepSeekConfig(model);
    const finalTemperature = temperature !== undefined ?
      temperature : modelConfig.temperature;

    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.deepseek.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [{
            role: "system",
            content: modelConfig.systemMessage,
          },
          {
            role: "user",
            content: `Analyze this task comprehensively: "${task}". ` +
              "Return a JSON response with the following structure: " +
              "{\"category\": \"Work/Personal/Health/etc\", " +
              "\"priority\": \"low/medium/high\", " +
              "\"estimatedTime\": number_in_minutes, " +
              "\"complexity\": \"low/medium/high\", " +
              "\"suggestions\": [\"suggestion1\", \"suggestion2\"], " +
              "\"insights\": \"detailed analysis text\"}. " +
              "Provide realistic time estimates and actionable suggestions.",
          }],
          max_tokens: modelConfig.maxTokens,
          temperature: finalTemperature,
        }),
      }
    );

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "";

    // Try to parse JSON response from AI
    let parsedAnalysis;
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = aiResponse;
      if (aiResponse.includes("```json")) {
        cleanedResponse = aiResponse
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
      }

      parsedAnalysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw AI response:", aiResponse);

      // Fallback if AI doesn't return valid JSON
      parsedAnalysis = {
        category: "General",
        priority: "medium",
        estimatedTime: 30,
        complexity: "medium",
        suggestions: [
          "Break task into smaller steps",
          "Set a timer",
          "Focus on one thing at a time",
        ],
        insights: aiResponse,
      };
    }

    return {
      analysis: parsedAnalysis.insights || aiResponse,
      category: parsedAnalysis.category || "General",
      complexity: parsedAnalysis.complexity || "medium",
      estimatedTime: parsedAnalysis.estimatedTime || 30,
      priority: parsedAnalysis.priority || "medium",
      suggestions: parsedAnalysis.suggestions ||
        ["Break into smaller tasks", "Set a timer"],
      model: modelConfig.model,
      temperature: finalTemperature,
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

// DeepSeek model configuration with specialized roles
const getDeepSeekConfig = (model: string) => {
  switch (model) {
  case "deepseek-chat":
    return {
      model: "deepseek-chat",
      temperature: 1.3,
      maxTokens: 300,
      systemMessage: "You are a creative productivity assistant for " +
        "FocusMate AI. Your role is to provide engaging, motivational " +
        "content and creative suggestions. Be warm, encouraging, and " +
        "use vivid language to inspire productivity. Focus on creative " +
        "problem-solving and innovative approaches to work challenges. " +
        "Respond conversationally as if speaking to a friend.",
    };
  case "deepseek-reasoner":
    return {
      model: "deepseek-reasoner",
      temperature: 1.0,
      maxTokens: 500,
      systemMessage: "You are an analytical productivity expert for " +
        "FocusMate AI. Your role is to provide data-driven insights, " +
        "logical analysis, and systematic approaches. Focus on " +
        "evidence-based recommendations, pattern recognition, and " +
        "structured thinking. Analyze productivity patterns, identify " +
        "trends, and offer methodical solutions. Be precise, objective, " +
        "and thorough in your analysis.",
    };
  default:
    return {
      model: "deepseek-chat",
      temperature: 1.3,
      maxTokens: 300,
      systemMessage: "You are a friendly productivity assistant for " +
        "FocusMate AI. Respond conversationally as if speaking to a " +
        "friend.",
    };
  }
};

export const aiChat = onCall({
  cors: [
    config.app.corsOrigin,
    "https://focusmate-ai-8cad6.web.app",
    "https://focusmate-ai-8cad6.firebaseapp.com",
    "http://localhost:3000",
  ],
}, async (request) => {
  const {
    message,
    context,
    model = "deepseek-chat",
    temperature, // Allow override but use model default if not provided
  } = request.data;

  if (!config.deepseek.apiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  try {
    const modelConfig = getDeepSeekConfig(model);
    const finalTemperature = temperature !== undefined ?
      temperature : modelConfig.temperature;

    console.log("Request data:", {message, context, model, temperature});

    const messages = [
      {role: "system", content: modelConfig.systemMessage},
      ...(context ? [{role: "user", content: context}] : []),
      {role: "user", content: message},
    ];

    console.log("Constructed messages:", JSON.stringify(messages, null, 2));

    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.deepseek.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages,
          max_tokens: modelConfig.maxTokens,
          temperature: finalTemperature,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "DeepSeek API error");
    }

    return {
      response: data.choices[0]?.message?.content || "No response generated",
      usage: data.usage,
      model: modelConfig.model,
      temperature: finalTemperature,
    };
  } catch (error) {
    logger.error("AI chat failed", error);
    throw new Error("Failed to get AI response");
  }
});

// Optimized Journal Insights generator (fast, structured, cached-friendly)
export const generateJournalInsightsOptimized = onCall({
  cors: [
    config.app.corsOrigin,
    "https://focusmate-ai-8cad6.web.app",
    "https://focusmate-ai-8cad6.firebaseapp.com",
    "http://localhost:3000",
  ],
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new Error("Auth required");
  }

  if (!config.deepseek.apiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  const {entries = [], cacheKey: _cacheKey} = request.data as {entries: Array<any>; cacheKey?: string};
  if (!Array.isArray(entries) || entries.length === 0) {
    return {insights: [], usedCache: false, cacheKey: null};
  }

  // Compact and cap entries server-side
  const sanitized = entries.slice(0, 60).map((e) => ({
    id: e.id || "",
    date: e.date || e.sessionDate || "",
    mood: e.mood || "",
    content: String(e.content || e.text || "").slice(0, 400),
  }));

  const prompt = `You are FocusMate Journal Insight Engine.\nAnalyze the entries and return JSON only (no markdown). Focus on patterns, emotions, growth, and actionable suggestions.\n\nReturn this JSON shape:\n{\n  "insights": [\n    {\n      "type": "emotion|pattern|suggestion|growth|concern",\n      "title": "string",\n      "description": "string",\n      "confidence": 0.0,\n      "actionable": "string or null",\n      "relatedEntries": ["id1","id2"]\n    }\n  ]\n}\n\nEntries:\n${JSON.stringify(sanitized, null, 2)}\n`;

  const body = {
    model: "deepseek-chat",
    messages: [
      {role: "system", content: "You return strict JSON only. No code fences. Keep 3-5 insights."},
      {role: "user", content: prompt},
    ],
    temperature: 0.6,
    top_p: 0.9,
    max_tokens: 700,
    stream: false,
  };

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.deepseek.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`DeepSeek error ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    const raw = json?.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {insights: []};
    }

    const normalized = Array.isArray(parsed.insights)
      ? parsed.insights.slice(0, 5).map((i: any) => ({
        type: i.type || "pattern",
        title: i.title || "Insight",
        description: i.description || "",
        confidence: typeof i.confidence === "number" ? i.confidence : 0.7,
        actionable: i.actionable || null,
        relatedEntries: Array.isArray(i.relatedEntries) ? i.relatedEntries.slice(0, 3) : [],
      }))
      : [];

    const serverHash = crypto
      .createHash("sha1")
      .update(JSON.stringify(sanitized))
      .digest("hex");

    return {insights: normalized, usedCache: false, cacheKey: serverHash};
  } catch (e) {
    logger.error("generateJournalInsightsOptimized error", e);
    // Graceful server-side fallback instead of 500
    try {
      const serverHash = crypto
        .createHash("sha1")
        .update(JSON.stringify(sanitized))
        .digest("hex");

      const quick = [
        {
          type: "pattern",
          title: "Recent Themes",
          description: `Quick summary across ${sanitized.length} recent entries. AI service temporarily unavailable.`,
          confidence: 0.5,
          actionable: "Try again shortly or continue journaling.",
          relatedEntries: sanitized.slice(0, 3).map((x) => x.id).filter(Boolean),
        },
      ];

      return {insights: quick, usedCache: false, cacheKey: serverHash};
    } catch (fallbackError) {
      logger.error("generateJournalInsightsOptimized fallback error", fallbackError);
      // Final minimal response
      return {insights: [], usedCache: false, cacheKey: null};
    }
  }
});

export const aiChatStream = onRequest({
  cors: [
    config.app.corsOrigin,
    "https://focusmate-ai-8cad6.web.app",
    "https://focusmate-ai-8cad6.firebaseapp.com",
    "http://localhost:3000",
  ],
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Cache-Control", "no-cache");
  res.set("Connection", "keep-alive");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const {
    message,
    context,
    model = "deepseek-chat",
    temperature, // Allow override but use model default if not provided
  } = req.body;

  if (!config.deepseek.apiKey) {
    res.status(500).json({error: "DeepSeek API key not configured"});
    return;
  }

  try {
    const modelConfig = getDeepSeekConfig(model);
    const finalTemperature = temperature !== undefined ?
      temperature : modelConfig.temperature;

    const messages = [
      {role: "system", content: modelConfig.systemMessage},
      ...(context ? [{role: "user", content: context}] : []),
      {role: "user", content: message},
    ];

    const apiUrl = "https://api.deepseek.com/v1/chat/completions";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.deepseek.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages,
        max_tokens: modelConfig.maxTokens,
        temperature: finalTemperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || "DeepSeek API error";
      throw new Error(errorMsg);
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    });

    const reader = response.body?.getReader();
    if (!reader) {
      const errorResponse = JSON.stringify({error: "No response stream"});
      res.write("data: " + errorResponse + "\n\n");
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {stream: true});
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              const doneResponse = JSON.stringify({
                done: true,
                model: modelConfig.model,
                temperature: finalTemperature,
              });
              res.write("data: " + doneResponse + "\n\n");
              res.end();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                const contentResponse = JSON.stringify({
                  content,
                  done: false,
                  model: modelConfig.model,
                });
                res.write("data: " + contentResponse + "\n\n");
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (streamError) {
      logger.error("Stream processing error", streamError);
      const errorResponse = JSON.stringify({
        error: "Stream processing failed",
      });
      res.write("data: " + errorResponse + "\n\n");
    }

    res.end();
  } catch (error) {
    logger.error("AI chat stream failed", error);
    res.status(500).json({error: "Failed to get AI response"});
  }
});

export const healthCheck = onRequest({
  cors: [config.app.corsOrigin, "https://focusmate-ai-8cad6.web.app", "https://focusmate-ai-8cad6.firebaseapp.com", "http://localhost:3000"],
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "https://focusmate-ai-8cad6.web.app");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

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
