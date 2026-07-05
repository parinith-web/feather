import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken.js";
import { getMe, getUsage } from "../controllers/userController.js";

const router = Router();

router.use(verifyFirebaseToken);
router.get("/me", getMe);
router.get("/usage", getUsage);

export default router;
