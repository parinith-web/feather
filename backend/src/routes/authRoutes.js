import { Router } from "express";
import { syncUser } from "../controllers/authController.js";

const router = Router();

router.post("/sync", syncUser);

export default router;
