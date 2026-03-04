import { Router } from "express";
import { isAuthenticated } from "@/middleware/auth";
import { searchUser } from "@/controllers/socialControllers";

const router = Router();
router.use(isAuthenticated);

router.get('/search-user', searchUser);

export default router;