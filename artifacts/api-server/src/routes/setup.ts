import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/guide", (req, res) => {
  const host = req.headers.host || "your-replit-url.replit.app";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const appUrl = `${protocol}://${host}`;
  const webhookUrl = `${appUrl}/api/browser/shortcuts-webhook`;

  const steps = [
    {
      step: 1,
      title: "Install a-Shell on iPad",
      description: "Open the App Store on your iPad and install 'a-Shell' (free). This is your iPad's terminal app.",
      command: "",
    },
    {
      step: 2,
      title: "Open a-Shell and enable SSH",
      description: "Open a-Shell, then run the command below to start an SSH server on your iPad.",
      command: "sshd",
    },
    {
      step: 3,
      title: "Find your iPad's IP address",
      description: "Go to Settings > Wi-Fi > tap your network > find the IP Address (e.g., 192.168.1.100).",
      command: "",
    },
    {
      step: 4,
      title: "Configure SSH in Agent Settings",
      description: "In this app, go to Settings tab and enter your iPad's IP address as SSH Host, port 2222, and your iPad username.",
      command: "",
    },
    {
      step: 5,
      title: "Install Apple Shortcuts on iPad",
      description: "Open the Shortcuts app (pre-installed on iPad). Create a new shortcut to send Safari page info to the agent.",
      command: "",
    },
    {
      step: 6,
      title: "Create Safari Shortcut",
      description: "In Shortcuts: Add action 'Get Details of Safari Webpage' (get URL + Name), then 'Get Contents of URL' (POST to webhook URL below). Run this shortcut from Safari Share sheet.",
      command: `Webhook URL: ${webhookUrl}`,
    },
    {
      step: 7,
      title: "Test the connection",
      description: "Open Safari on your iPad, navigate to any page, tap Share > Run your Shortcut. The agent will receive the page info.",
      command: "",
    },
    {
      step: 8,
      title: "Camera access",
      description: "Open this web app in Safari on your iPad. Tap the Camera tab and allow camera access when prompted.",
      command: "",
    },
  ];

  const permissions = [
    "Camera access (for Camera panel - required in Safari on iPad)",
    "Local network access (for SSH terminal connection to iPad)",
    "Shortcut automation access (for Safari browser control)",
    "File system read/write via a-Shell (for file operations)",
    "Internet access for Groq AI API",
  ];

  res.json({
    steps,
    qrCodeUrl: appUrl,
    shortcutsUrl: `shortcuts://create`,
    permissions,
    webhookUrl,
  });
});

export default router;
