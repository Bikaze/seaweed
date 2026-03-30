import express from 'express';
import { getUploadUrl, confirmUpload, getDownloadUrl } from '../controllers/tickets.js';

const router = express.Router();

router.post('/upload-request', getUploadUrl);
router.post('/confirm', confirmUpload);
router.get('/download-request', getDownloadUrl);

export default router;