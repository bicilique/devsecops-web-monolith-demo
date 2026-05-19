const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { createHttpError } = require('./validation');

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

function ensureUploadDirectory(uploadDir) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function isAllowedImageExtension(filename) {
  return ALLOWED_IMAGE_EXTENSIONS.includes(path.extname(filename || '').toLowerCase());
}

function createStoredFilename(originalname) {
  const extension = path.extname(originalname || '').toLowerCase();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
}

function imageFileFilter(req, file, callback) {
  if (!isAllowedImageExtension(file.originalname)) {
    callback(createHttpError(400, 'Only jpg, jpeg, png, and webp images are allowed.'));
    return;
  }

  if (!String(file.mimetype || '').startsWith('image/')) {
    callback(createHttpError(400, 'Only image uploads are allowed.'));
    return;
  }

  callback(null, true);
}

function createUploadMiddleware(options = {}) {
  const uploadDir = options.uploadDir || path.join(process.cwd(), 'src', 'public', 'uploads');

  ensureUploadDirectory(uploadDir);

  const storage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, uploadDir);
    },
    filename(req, file, callback) {
      callback(null, createStoredFilename(file.originalname));
    }
  });

  return multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES
    }
  });
}

module.exports = {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
  createStoredFilename,
  createUploadMiddleware,
  ensureUploadDirectory,
  imageFileFilter,
  isAllowedImageExtension
};
