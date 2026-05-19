function createHttpError(status, message, options = {}) {
  const error = new Error(message);
  error.status = status;
  error.expose = options.expose !== false;
  return error;
}

function validateLoginPayload(body = {}) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return {
      errors: ['Invalid username or password.'],
      normalized: { username, password }
    };
  }

  return {
    errors: [],
    normalized: { username, password }
  };
}

function validateSearchQueryValue(rawQuery) {
  const query = String(rawQuery || '').trim();
  const errors = [];

  if (query.length > 100) {
    errors.push('Search keyword must be 100 characters or fewer.');
  }

  return {
    errors,
    value: query
  };
}

function validateProductIdValue(rawId) {
  const value = String(rawId || '').trim();
  const parsed = Number.parseInt(value, 10);

  if (!value || !Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== value) {
    throw createHttpError(400, 'Product ID must be an integer.');
  }

  return parsed;
}

function validateProductPayload(product = {}) {
  const name = String(product.name || '').trim();
  const description = String(product.description || '').trim();
  const priceRaw = String(product.priceRaw || '').trim();
  const category = String(product.category || '').trim();
  const imagePath = product.imagePath || null;
  const errors = [];

  if (!name) {
    errors.push('Product name is required.');
  } else if (name.length > 100) {
    errors.push('Product name must be 100 characters or fewer.');
  }

  if (description.length > 2000) {
    errors.push('Product description must be 2000 characters or fewer.');
  }

  if (!priceRaw) {
    errors.push('Product price is required.');
  } else if (Number.isNaN(Number.parseFloat(priceRaw))) {
    errors.push('Product price must be numeric.');
  } else if (Number.parseFloat(priceRaw) < 0) {
    errors.push('Product price must be non-negative.');
  }

  if (category.length > 100) {
    errors.push('Product category must be 100 characters or fewer.');
  }

  return {
    errors,
    normalizedProduct: {
      name,
      description,
      price: Number.parseFloat(priceRaw),
      priceRaw,
      category,
      imagePath
    }
  };
}

module.exports = {
  createHttpError,
  validateLoginPayload,
  validateProductIdValue,
  validateProductPayload,
  validateSearchQueryValue
};
