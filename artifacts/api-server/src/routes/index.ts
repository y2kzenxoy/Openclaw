import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import agentRouter from "./agent.js";
import terminalRouter from "./terminal.js";
import browserRouter from "./browser.js";
import filesRouter from "./files.js";
import cameraRouter from "./camera.js";
import settingsRouter from "./settings.js";
import setupRouter from "./setup.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/agent", agentRouter);
router.use("/terminal", terminalRouter);
router.use("/browser", browserRouter);
router.use("/files", filesRouter);
router.use("/camera", cameraRouter);
router.use("/settings", settingsRouter);
router.use("/setup", setupRouter);

export default router;
