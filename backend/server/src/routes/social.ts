import { Router } from "express";
import { isAuthenticated } from "../middleware/auth";
import { getUserId, searchUsers } from "../controllers/socialControllers";

const router = Router();
router.use(isAuthenticated);

router.post('/get-user-id', getUserId);
router.post('/search-users', searchUsers)

export default router;