function createProductService(db) {
  function normalizeProductRow(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      imagePath: row.image_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function parseProductId(value) {
    const parsed = Number.parseInt(String(value), 10);

    if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== String(value).trim()) {
      return null;
    }

    return parsed;
  }

  async function listProducts() {
    const rows = await db.all(
      `SELECT id, name, description, price, category, image_path, created_at, updated_at
       FROM products
       ORDER BY datetime(updated_at) DESC, id DESC`
    );

    return rows.map(normalizeProductRow);
  }

  async function searchProducts(query) {
    const searchTerm = (query || '').trim().toLowerCase();

    if (!searchTerm) {
      return listProducts();
    }

    const rows = await db.all(
      `SELECT id, name, description, price, category, image_path, created_at, updated_at
       FROM products
       WHERE LOWER(name) LIKE ? OR LOWER(COALESCE(category, '')) LIKE ?
       ORDER BY datetime(updated_at) DESC, id DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );

    return rows.map(normalizeProductRow);
  }

  async function findProductById(id) {
    const row = await db.get(
      `SELECT id, name, description, price, category, image_path, created_at, updated_at
       FROM products
       WHERE id = ?`,
      [id]
    );

    return normalizeProductRow(row);
  }

  async function createProduct(product) {
    const result = await db.run(
      `INSERT INTO products (name, description, price, category, image_path, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [product.name, product.description, product.price, product.category, product.imagePath]
    );

    return findProductById(result.lastID);
  }

  async function updateProduct(id, product) {
    await db.run(
      `UPDATE products
       SET name = ?, description = ?, price = ?, category = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [product.name, product.description, product.price, product.category, product.imagePath, id]
    );

    return findProductById(id);
  }

  return {
    createProduct,
    findProductById,
    listProducts,
    parseProductId,
    searchProducts,
    updateProduct
  };
}

module.exports = {
  createProductService
};
