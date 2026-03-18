export interface Settings {
  groqApiKey: string;
  llmModel: string;
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshPassword: string;
  enableCamera: boolean;
  enableFileAccess: boolean;
  enableTerminal: boolean;
  enableBrowser: boolean;
  maxLoops: number;
  agentTimeout: number;
}

const defaultSettings: Settings = {
  groqApiKey: process.env["GROQ_API_KEY"] || "",
  llmModel: process.env["LLM_MODEL"] || "llama-3.3-70b-versatile",
  sshHost: process.env["SSH_HOST"] || "",
  sshPort: parseInt(process.env["SSH_PORT"] || "2222"),
  sshUsername: process.env["SSH_USER"] || "mobile",
  sshPassword: "",
  enableCamera: process.env["ENABLE_CAMERA"] !== "false",
  enableFileAccess: process.env["ENABLE_FILE_ACCESS"] !== "false",
  enableTerminal: process.env["ENABLE_TERMINAL"] !== "false",
  enableBrowser: process.env["ENABLE_BROWSER"] !== "false",
  maxLoops: parseInt(process.env["MAX_LOOPS"] || "20"),
  agentTimeout: parseInt(process.env["AGENT_TIMEOUT"] || "180"),
};

let currentSettings: Settings = { ...defaultSettings };

export function getSettings(): Settings {
  return { ...currentSettings };
}

export function updateSettings(updates: Partial<Settings>): Settings {
  currentSettings = { ...currentSettings, ...updates };
  return { ...currentSettings };
}

export function getSafeSettings() {
  const s = getSettings();
  return {
    groqApiKey: s.groqApiKey ? "***configured***" : "",
    llmModel: s.llmModel,
    sshHost: s.sshHost,
    sshPort: s.sshPort,
    sshUsername: s.sshUsername,
    enableCamera: s.enableCamera,
    enableFileAccess: s.enableFileAccess,
    enableTerminal: s.enableTerminal,
    enableBrowser: s.enableBrowser,
    maxLoops: s.maxLoops,
    agentTimeout: s.agentTimeout,
  };
}
