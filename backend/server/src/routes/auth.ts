import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';

import { login, logout, register, me, wsTicket } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.delete('/logout', isAuthenticated, logout);
router.post('/register', register);
router.get('/me', isAuthenticated, me);
router.post('/ws-ticket', isAuthenticated, wsTicket);


export default router;