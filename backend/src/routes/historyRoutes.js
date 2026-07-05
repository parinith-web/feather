import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken.js";
import {
  createHistoryItem,
  listHistory,
  deleteHistoryItemById,
  clearHistory,
} from "../controllers/historyController.js";

const router = Router();

router.use(verifyFirebaseToken);
router.get("/", listHistory);
router.post("/", createHistoryItem);
router.delete("/:id", deleteHistoryItemById);
router.delete("/", clearHistory);

export default router;
