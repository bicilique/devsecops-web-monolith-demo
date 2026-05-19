const express = require('express');
const {
  createHttpError,
  validateProductIdValue,
  validateProductPayload,
  validateSearchQueryValue
} = require('../middleware/validation');

function normalizeProductInput(body, file, fallbackImagePath = null) {
  const nextImagePath = file ? `/uploads/${file.filename}` : fallbackImagePath;

  return {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    priceRaw: String(body.price || '').trim(),
    category: String(body.category || '').trim(),
    imagePath: nextImagePath
  };
}

function createProductsRouter({ productService, auditService, requireAuth, upload }) {
  const router = express.Router();
  const uploadSingle = upload.single('image');

  function renderProductForm(res, options) {
    res.status(options.status || 200).render('product-form', {
      title: options.title,
      heading: options.heading,
      formAction: options.formAction,
      submitLabel: options.submitLabel,
      product: options.product,
      errorMessages: options.errorMessages || []
    });
  }

  function handleUpload(req, res, next) {
    uploadSingle(req, res, (err) => {
      if (err) {
        const normalizedError =
          err.code === 'LIMIT_FILE_SIZE'
            ? createHttpError(400, 'Image upload must be 2MB or smaller.')
            : err;
        next(normalizedError);
        return;
      }

      next();
    });
  }

  router.get('/admin/products', requireAuth, async (req, res, next) => {
    try {
      const products = await productService.listProducts();

      res.render('products', {
        title: 'Product Catalog',
        heading: 'Product Catalog',
        products,
        query: '',
        errorMessages: []
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/products/search', requireAuth, async (req, res, next) => {
    try {
      const searchValidation = validateSearchQueryValue(req.query.q);
      const products =
        searchValidation.errors.length > 0
          ? await productService.listProducts()
          : await productService.searchProducts(searchValidation.value);

      res.render('products', {
        title: 'Product Search',
        heading: searchValidation.value ? `Search Results for "${searchValidation.value}"` : 'Product Catalog',
        products,
        query: searchValidation.value,
        errorMessages: searchValidation.errors
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/products/new', requireAuth, (req, res) => {
    renderProductForm(res, {
      title: 'Add Product',
      heading: 'Add Product',
      formAction: '/admin/products',
        submitLabel: 'Create product',
        product: {
          name: '',
          description: '',
          price: '',
          category: '',
          imagePath: ''
        },
        errorMessages: []
      });
  });

  router.post('/admin/products', requireAuth, handleUpload, async (req, res, next) => {
    try {
      const draftProduct = normalizeProductInput(req.body, req.file);
      const validation = validateProductPayload(draftProduct);

      if (validation.errors.length > 0) {
        renderProductForm(res, {
          status: 400,
          title: 'Add Product',
          heading: 'Add Product',
          formAction: '/admin/products',
          submitLabel: 'Create product',
          product: {
            ...draftProduct,
            price: draftProduct.priceRaw
          },
          errorMessages: validation.errors
        });
        return;
      }

      const createdProduct = await productService.createProduct(validation.normalizedProduct);
      await auditService.logProductAction({
        username: req.session.user.username,
        action: 'created product',
        entityId: createdProduct.id,
        metadata: {
          name: createdProduct.name,
          category: createdProduct.category
        }
      });

      res.redirect(`/admin/products/${createdProduct.id}`);
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/products/:id', requireAuth, async (req, res, next) => {
    try {
      const productId = validateProductIdValue(req.params.id);

      const product = await productService.findProductById(productId);

      if (!product) {
        next(createHttpError(404, 'Product not found.'));
        return;
      }

      res.render('product-detail', {
        title: product.name,
        product
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/products/:id/edit', requireAuth, async (req, res, next) => {
    try {
      const productId = validateProductIdValue(req.params.id);

      const product = await productService.findProductById(productId);

      if (!product) {
        next(createHttpError(404, 'Product not found.'));
        return;
      }

      renderProductForm(res, {
        title: 'Edit Product',
        heading: 'Edit Product',
        formAction: `/admin/products/${product.id}`,
        submitLabel: 'Save changes',
        product,
        errorMessages: []
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/products/:id', requireAuth, handleUpload, async (req, res, next) => {
    try {
      const productId = validateProductIdValue(req.params.id);

      const existingProduct = await productService.findProductById(productId);

      if (!existingProduct) {
        next(createHttpError(404, 'Product not found.'));
        return;
      }

      const draftProduct = normalizeProductInput(req.body, req.file, existingProduct.imagePath);
      const validation = validateProductPayload(draftProduct);

      if (validation.errors.length > 0) {
        renderProductForm(res, {
          status: 400,
          title: 'Edit Product',
          heading: 'Edit Product',
          formAction: `/admin/products/${productId}`,
          submitLabel: 'Save changes',
          product: {
            ...existingProduct,
            ...draftProduct,
            price: draftProduct.priceRaw
          },
          errorMessages: validation.errors
        });
        return;
      }

      const updatedProduct = await productService.updateProduct(productId, validation.normalizedProduct);
      await auditService.logProductAction({
        username: req.session.user.username,
        action: 'updated product',
        entityId: updatedProduct.id,
        metadata: {
          name: updatedProduct.name,
          category: updatedProduct.category
        }
      });

      res.redirect(`/admin/products/${updatedProduct.id}`);
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/audit-logs', requireAuth, async (req, res, next) => {
    try {
      const auditLogs = await auditService.listAuditLogs();

      res.render('audit-logs', {
        title: 'Audit Logs',
        auditLogs
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = {
  createProductsRouter,
  normalizeProductInput
};
