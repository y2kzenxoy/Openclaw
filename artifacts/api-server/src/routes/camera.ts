import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { getSettings } from "../lib/settings.js";

const router: IRouter = Router();

router.post("/analyze", async (req, res) => {
  const {
    imageData,
    prompt = "Describe this image in detail. Identify objects, text, people, and anything interesting.",
    mimeType = "image/jpeg",
  } = req.body;

  if (!imageData) {
    res.status(400).json({ error: "imageData is required" });
    return;
  }

  const settings = getSettings();
  if (!settings.enableCamera) {
    res.json({
      description: "Camera analysis is disabled in settings.",
      model: settings.llmModel,
    });
    return;
  }

  const apiKey = settings.groqApiKey || process.env["GROQ_API_KEY"] || "";
  if (!apiKey) {
    res.json({
      description: "Groq API key not configured. Please add it in Settings.",
      model: "none",
    });
    return;
  }

  try {
    // Clean up data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");

    const groq = new Groq({ apiKey });

    // Use llama-4-scout-17b-16e-instruct for vision (supports images)
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ] as any,
        },
      ],
      max_tokens: 1024,
    });

    const description = completion.choices[0]?.message?.content || "Unable to analyze image.";

    res.json({
      description,
      objects: [],
      confidence: 0.95,
      model: "llama-4-scout-17b-16e-instruct",
    });
  } catch (err: any) {
    console.error("Vision error:", err);
    // Fallback response
    res.json({
      description: `Image analysis failed: ${err.message}. Try a different prompt or check your API key.`,
      model: settings.llmModel,
    });
  }
});

export default router;
