const path = require('path');

const {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
  createStoredFilename,
  imageFileFilter,
  isAllowedImageExtension
} = require('../src/middleware/upload');

describe('Phase 3 upload middleware', () => {
  test('allows supported image extensions only', () => {
    expect(ALLOWED_IMAGE_EXTENSIONS).toEqual(['.jpg', '.jpeg', '.png', '.webp']);
    expect(isAllowedImageExtension('photo.jpg')).toBe(true);
    expect(isAllowedImageExtension('photo.webp')).toBe(true);
    expect(isAllowedImageExtension('script.exe')).toBe(false);
  });

  test('creates unique filename preserving extension', () => {
    const storedFilename = createStoredFilename('banner.PNG');

    expect(path.extname(storedFilename)).toBe('.png');
    expect(storedFilename).not.toBe('banner.PNG');
  });

  test('enforces image-like file filter', () => {
    const goodFile = {
      originalname: 'catalog.png',
      mimetype: 'image/png'
    };
    const badFile = {
      originalname: 'catalog.txt',
      mimetype: 'text/plain'
    };
    const successCallback = jest.fn();
    const failureCallback = jest.fn();

    imageFileFilter({}, goodFile, successCallback);
    imageFileFilter({}, badFile, failureCallback);

    expect(successCallback).toHaveBeenCalledWith(null, true);
    expect(failureCallback.mock.calls[0][0].message).toContain('jpg, jpeg, png, and webp');
    expect(MAX_UPLOAD_SIZE_BYTES).toBe(2 * 1024 * 1024);
  });
});
