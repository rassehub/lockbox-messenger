import { Router } from "express";
import { isAuthenticated } from "@/middleware/auth";
import { getUserId, searchUsers } from "@/controllers/socialControllers";

const router = Router();
router.use(isAuthenticated);

router.get('/get-user-id', getUserId);
router.get('search-users', searchUsers)

export default router;