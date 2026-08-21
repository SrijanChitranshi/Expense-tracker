import express from 'express';
import {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
  getYearlySummary,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/yearly-summary', getYearlySummary);

export default router;
