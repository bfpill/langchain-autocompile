import express from "express";
import openCompilerController from "../controllers/controller";

const router = express.Router();

router.post("/", openCompilerController.initCompiler);
router.patch("/", openCompilerController.compile);

export default router;