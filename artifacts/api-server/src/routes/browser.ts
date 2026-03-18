import { Router, type IRouter } from "express";
import { getBrowserState, updateBrowserState, setPendingAction, consumePendingAction } from "../lib/browserState.js";
import { getSettings } from "../lib/settings.js";

const router: IRouter = Router();

// Try to use Playwright if available
async function tryPlaywright(action: string, url?: string, selector?: string, value?: string, script?: string) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    if (url) await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    let result = "";

    switch (action) {
      case "navigate":
        result = `Navigated to ${url}`;
        break;
      case "click":
        if (selector) {
          await page.click(selector, { timeout: 5000 });
          result = `Clicked: ${selector}`;
        }
        break;
      case "fill":
        if (selector && value) {
          await page.fill(selector, value);
          result = `Filled ${selector} with: ${value}`;
        }
        break;
      case "scrape":
        result = await page.evaluate(() => document.body.innerText);
        result = result.slice(0, 5000);
        break;
      case "screenshot":
        const screenshotBuffer = await page.screenshot({ type: "jpeg", quality: 60 });
        result = screenshotBuffer.toString("base64");
        break;
      case "evaluate":
        if (script) {
          const evalResult = await page.evaluate(script);
          result = JSON.stringify(evalResult);
        }
        break;
    }

    const pageUrl = page.url();
    const pageTitle = await page.title();

    await browser.close();

    return { success: true, result, url: pageUrl, title: pageTitle };
  } catch (err: any) {
    return { success: false, result: err.message, url: url || "", title: "" };
  }
}

router.post("/navigate", async (req, res) => {
  const { url, source = "shortcuts" } = req.body;
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const settings = getSettings();
  if (!settings.enableBrowser) {
    res.json({ success: false, result: "Browser automation is disabled in settings" });
    return;
  }

  updateBrowserState({
    active: true,
    currentUrl: url,
    lastAction: `navigate: ${url}`,
    source,
  });

  // Try Playwright for actual browsing
  const playwrightResult = await tryPlaywright("navigate", url);

  if (playwrightResult.success) {
    updateBrowserState({
      currentUrl: playwrightResult.url || url,
      currentTitle: playwrightResult.title,
    });
  }

  res.json({
    success: true,
    result: playwrightResult.success ? `Opened ${url} in browser` : `URL queued for Safari via Shortcuts: ${url}`,
    url: playwrightResult.url || url,
    title: playwrightResult.title || "",
  });
});

router.post("/action", async (req, res) => {
  const { action, selector, value, script } = req.body;
  if (!action) {
    res.status(400).json({ error: "action is required" });
    return;
  }

  const state = getBrowserState();
  const playwrightResult = await tryPlaywright(action, state.currentUrl, selector, value, script);

  updateBrowserState({
    lastAction: `${action}: ${selector || value || script || ""}`,
  });

  res.json({
    success: playwrightResult.success,
    result: playwrightResult.result,
    url: playwrightResult.url || state.currentUrl || "",
    title: playwrightResult.title || state.currentTitle || "",
  });
});

router.post("/screenshot", async (req, res) => {
  const state = getBrowserState();
  const playwrightResult = await tryPlaywright("screenshot", state.currentUrl || "about:blank");

  if (playwrightResult.success) {
    updateBrowserState({ lastScreenshot: playwrightResult.result });
    res.json({
      success: true,
      imageData: `data:image/jpeg;base64,${playwrightResult.result}`,
      url: playwrightResult.url || state.currentUrl || "",
    });
  } else {
    res.json({
      success: false,
      imageData: "",
      url: state.currentUrl || "",
    });
  }
});

router.get("/status", (_req, res) => {
  const state = getBrowserState();
  res.json({
    active: state.active,
    currentUrl: state.currentUrl,
    currentTitle: state.currentTitle,
    lastAction: state.lastAction,
    source: state.source,
  });
});

// Apple Shortcuts webhook — iPad calls this when Safari does something
router.post("/shortcuts-webhook", (req, res) => {
  const { action, url, pageContent, pageTitle, screenshotBase64, timestamp } = req.body;

  console.log(`[Shortcuts webhook] action=${action}, url=${url}, title=${pageTitle}`);

  updateBrowserState({
    active: true,
    currentUrl: url,
    currentTitle: pageTitle,
    lastAction: action,
    source: "shortcuts",
    lastScreenshot: screenshotBase64,
  });

  const pending = consumePendingAction();

  res.json({
    received: true,
    nextAction: pending ? JSON.stringify(pending) : "",
    data: pageContent ? pageContent.slice(0, 2000) : "",
  });
});

export default router;
