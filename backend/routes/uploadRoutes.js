import express from 'express';
import { uploadReceipt } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/receipt', protect, upload.single('receipt'), uploadReceipt);

export default router;
