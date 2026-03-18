import { Router, type IRouter } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { getSettings } from "../lib/settings.js";

const router: IRouter = Router();
const execAsync = promisify(exec);

interface TerminalSession {
  connected: boolean;
  host: string;
  port: number;
  mode: "ssh" | "local" | "disconnected";
  lastCommand: string;
}

let terminalState: TerminalSession = {
  connected: false,
  host: "",
  port: 2222,
  mode: "disconnected",
  lastCommand: "",
};

async function executeLocal(command: string, timeout: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: timeout * 1000,
      maxBuffer: 1024 * 1024 * 10,
    });
    return { stdout: stdout || "", stderr: stderr || "", exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || err.message || "Command failed",
      exitCode: err.code || 1,
    };
  }
}

async function executeSSH(
  command: string,
  timeout: number,
  settings: ReturnType<typeof getSettings>
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    // Dynamic import to avoid build issues
    const { NodeSSH } = await import("node-ssh");
    const ssh = new NodeSSH();

    await ssh.connect({
      host: settings.sshHost,
      port: settings.sshPort,
      username: settings.sshUsername,
      password: settings.sshPassword || undefined,
      readyTimeout: 10000,
    });

    const result = await ssh.execCommand(command, {
      execOptions: { pty: false },
    });

    ssh.dispose();

    terminalState = {
      connected: true,
      host: settings.sshHost,
      port: settings.sshPort,
      mode: "ssh",
      lastCommand: command,
    };

    return {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      exitCode: result.code || 0,
    };
  } catch (err: any) {
    terminalState = {
      ...terminalState,
      connected: false,
      mode: "disconnected",
    };
    return {
      stdout: "",
      stderr: `SSH Error: ${err.message}. Check Settings for SSH configuration.`,
      exitCode: 1,
    };
  }
}

router.post("/execute", async (req, res) => {
  const { command, timeout = 30 } = req.body;

  if (!command) {
    res.status(400).json({ error: "command is required" });
    return;
  }

  const settings = getSettings();
  const start = Date.now();

  try {
    let result: { stdout: string; stderr: string; exitCode: number };

    // If SSH is configured, use it; otherwise run locally on the server
    if (settings.enableTerminal && settings.sshHost) {
      result = await executeSSH(command, timeout, settings);
    } else {
      // Fall back to local execution on server
      result = await executeLocal(command, timeout);
      terminalState = {
        connected: true,
        host: "localhost (server)",
        port: 0,
        mode: "local",
        lastCommand: command,
      };
    }

    const duration = (Date.now() - start) / 1000;

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      success: result.exitCode === 0,
      duration,
    });
  } catch (err: any) {
    const duration = (Date.now() - start) / 1000;
    res.json({
      stdout: "",
      stderr: err.message || "Command execution failed",
      exitCode: 1,
      success: false,
      duration,
    });
  }
});

router.get("/status", (_req, res) => {
  const settings = getSettings();
  if (!settings.enableTerminal) {
    res.json({ connected: false, mode: "disconnected" });
    return;
  }
  res.json(terminalState);
});

export default router;
