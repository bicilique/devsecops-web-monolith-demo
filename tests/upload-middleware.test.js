const path = require('path');

const {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
  createStoredFilename,
  imageFileFilter,
  isAllowedImageExtension
} = require('../src/middleware/upload');

describe('Phase 3 upload middleware', () => {
  test('allows wider extension set on vulnerable branch', () => {
    expect(ALLOWED_IMAGE_EXTENSIONS).toEqual(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.txt', '.html']);
    expect(isAllowedImageExtension('photo.jpg')).toBe(true);
    expect(isAllowedImageExtension('photo.webp')).toBe(true);
    expect(isAllowedImageExtension('payload.txt')).toBe(true);
    expect(isAllowedImageExtension('script.exe')).toBe(false);
  });

  test('keeps mostly original filename on vulnerable branch', () => {
    const storedFilename = createStoredFilename('banner.PNG');

    expect(path.extname(storedFilename)).toBe('.PNG');
    expect(storedFilename).toBe('banner.PNG');
  });

  test('accepts non-image file filter input on vulnerable branch', () => {
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
    expect(failureCallback).toHaveBeenCalledWith(null, true);
    expect(MAX_UPLOAD_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});
