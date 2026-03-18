import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { getSettings } from "../lib/settings.js";
import { addMessage, getHistory, clearHistory, getGroqMessages } from "../lib/chatHistory.js";
import { getBrowserState } from "../lib/browserState.js";

const router: IRouter = Router();

function getGroqClient() {
  const settings = getSettings();
  const apiKey = settings.groqApiKey || process.env["GROQ_API_KEY"] || "";
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");
  return new Groq({ apiKey });
}

const SYSTEM_PROMPT = `You are an AI agent with control over an iPad. You can:
- Execute terminal commands on the iPad via SSH (use the /api/terminal/execute endpoint)
- Control Safari browser automatically (use /api/browser/navigate and /api/browser/action)
- Read and write files (use /api/files endpoints)
- Analyze camera images with vision
- Search the web using DuckDuckGo
- Remember context from the entire conversation

When the user asks you to do something on their iPad, tell them what you're doing and what results you got. Be concise and helpful. If a feature isn't configured (like SSH), guide them to set it up in Settings.

You are running on a Replit server. The user accesses you through a web UI on their iPad. Be friendly and clear about what's possible vs. what requires additional setup.`;

router.post("/chat", async (req, res) => {
  try {
    const { message, includeTools = true } = req.body;
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    addMessage({ role: "user", content: message });

    const settings = getSettings();
    const groq = getGroqClient();
    const history = getGroqMessages();

    // Build context about current state
    const browserState = getBrowserState();
    const contextNote = browserState.active
      ? `\n[Browser context: Currently viewing ${browserState.currentUrl || "unknown"} - ${browserState.currentTitle || ""}]`
      : "";

    const completion = await groq.chat.completions.create({
      model: settings.llmModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + contextNote },
        ...history,
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    const rawContent = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Extract thinking tags if present (deepseek-r1 style)
    let thinking: string | undefined;
    let content = rawContent;
    const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      thinking = thinkMatch[1].trim();
      content = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    }

    const assistantMsg = addMessage({
      role: "assistant",
      content,
      thinking,
    });

    res.json({
      reply: content,
      thinking,
      toolsUsed: [],
      messageId: assistantMsg.id,
    });
  } catch (err: any) {
    console.error("Agent chat error:", err);
    const errMsg = err.message?.includes("GROQ_API_KEY")
      ? "Groq API key not configured. Please add it in Settings."
      : "The AI agent encountered an issue. Please try again.";

    const msg = addMessage({ role: "assistant", content: errMsg });
    res.json({ reply: errMsg, messageId: msg.id, toolsUsed: [] });
  }
});

router.get("/history", (_req, res) => {
  res.json({ messages: getHistory() });
});

router.delete("/history", (_req, res) => {
  clearHistory();
  res.json({ success: true, message: "Conversation history cleared" });
});

export default router;
