import { Router } from 'express';

import { login, logout, register, me } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.delete('/logout', logout);
router.post('/register', register);
router.get('/me', me);


export default router;