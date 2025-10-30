const Product = require("../models/product");

/**
 * Class that contains the business logic for the product repository interacting with the product model
 */
//Chứa các phương thức để tương tác với cơ sở dữ liệu sản phẩm Create, Read, Update, Delete (CRUD)
class ProductsRepository {
  async create(product) {
    const createdProduct = await Product.create(product);
    return createdProduct.toObject();
  }

  async findById(productId) {
    const product = await Product.findById(productId).lean();
    return product;
  }

  async findAll() {
    const products = await Product.find().lean();
    return products;
  }
}

module.exports = ProductsRepository;
