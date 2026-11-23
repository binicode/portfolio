import { Router } from 'express';
import { accountLinkLimiter, authLimiter } from '../../core/middleware/rateLimiter.js';
import { requireCustomer } from './customer-session.js';
import {
  getMe,
  postForgotPassword,
  postLogin,
  postLogout,
  postRegister,
  postResendVerification,
  postResetPassword,
  postVerifyEmail,
} from './saas-auth.controller.js';

const router = Router();

router.post('/register', authLimiter, postRegister);
router.post('/login', authLimiter, postLogin);
router.post('/logout', postLogout);
router.get('/me', requireCustomer, getMe);
router.post('/verify-email', accountLinkLimiter, postVerifyEmail);
router.post('/verify-email/resend', requireCustomer, accountLinkLimiter, postResendVerification);
router.post('/password/forgot', accountLinkLimiter, postForgotPassword);
router.post('/password/reset', accountLinkLimiter, postResetPassword);

export default router;
