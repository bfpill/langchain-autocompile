import express from 'express';

import controller from "../../controllers/controller"

const router = express.Router();

router.patch("/", controller.init);
router.post("/", controller.newChatMessage);
router.post("/run", controller.run);

// Export router
export default router;