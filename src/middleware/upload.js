const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.txt', '.html'];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

function ensureUploadDirectory(uploadDir) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function isAllowedImageExtension(filename) {
  return ALLOWED_IMAGE_EXTENSIONS.includes(path.extname(filename || '').toLowerCase());
}

function createStoredFilename(originalname) {
  return (originalname || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function imageFileFilter(req, file, callback) {
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
    fileFilter: imageFileFilter
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
