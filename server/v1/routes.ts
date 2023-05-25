import express from "express";
import openCompilerController from "../controllers/controller";

const router = express.Router();

router.post("/api/openCompiler/key", openCompilerController.initCompiler);
router.patch("/api/openCompiler", openCompilerController.compile);

export default router;