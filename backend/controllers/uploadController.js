import cloudinary from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Upload a receipt image, returns hosted URL to attach to a transaction
// @route   POST /api/uploads/receipt
// @access  Private
export const uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const uploadFromBuffer = () =>
    new Promise((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        { folder: 'expense-tracker/receipts', resource_type: 'image' },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      cldStream.end(req.file.buffer);
    });

  const result = await uploadFromBuffer();

  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id },
  });
});
