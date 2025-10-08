import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login.bind(authController));

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh.bind(authController));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

export default router;
