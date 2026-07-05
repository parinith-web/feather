import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken.js";
import { upload } from "../middleware/upload.js";
import { removeBackground } from "../controllers/bgController.js";

const router = Router();

router.use(verifyFirebaseToken);
router.post("/remove", upload.single("image"), removeBackground);

export default router;
