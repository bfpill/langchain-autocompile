import express from 'express';

import controller from "../../controllers/controller"

const router = express.Router();

router.post("/", controller.newChatMessage);

// Export router
export default router;