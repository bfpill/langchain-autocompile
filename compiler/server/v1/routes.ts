import express from "express";
import openCompilerController from "../controllers/controller";

const router = express.Router();

router.patch("/", openCompilerController.init);
router.post("/", openCompilerController.compile);

export default router;