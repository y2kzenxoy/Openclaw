import { Router, type IRouter } from "express";
import { getSettings, updateSettings, getSafeSettings } from "../lib/settings.js";

const router: IRouter = Router();

router.get("/get", (_req, res) => {
  res.json(getSafeSettings());
});

router.post("/update", (req, res) => {
  const {
    groqApiKey,
    llmModel,
    sshHost,
    sshPort,
    sshUsername,
    sshPassword,
    enableCamera,
    enableFileAccess,
    enableTerminal,
    enableBrowser,
    maxLoops,
    agentTimeout,
  } = req.body;

  const updates: Record<string, any> = {};

  if (groqApiKey !== undefined) updates.groqApiKey = groqApiKey;
  if (llmModel !== undefined) updates.llmModel = llmModel;
  if (sshHost !== undefined) updates.sshHost = sshHost;
  if (sshPort !== undefined) updates.sshPort = parseInt(sshPort);
  if (sshUsername !== undefined) updates.sshUsername = sshUsername;
  if (sshPassword !== undefined) updates.sshPassword = sshPassword;
  if (enableCamera !== undefined) updates.enableCamera = enableCamera;
  if (enableFileAccess !== undefined) updates.enableFileAccess = enableFileAccess;
  if (enableTerminal !== undefined) updates.enableTerminal = enableTerminal;
  if (enableBrowser !== undefined) updates.enableBrowser = enableBrowser;
  if (maxLoops !== undefined) updates.maxLoops = parseInt(maxLoops);
  if (agentTimeout !== undefined) updates.agentTimeout = parseInt(agentTimeout);

  updateSettings(updates);
  res.json(getSafeSettings());
});

export default router;
