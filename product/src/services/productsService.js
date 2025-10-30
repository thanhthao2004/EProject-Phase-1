const ProductsRepository = require(".repositories/productsRepository");

/**
 * Class that ties together the business logic and the data access layer
 */
class ProductsService {
  constructor() {
    this.productsRepository = new ProductsRepository();
  }
  //thực hiện các thao tác nghiệp vụ liên quan đến sản phẩm bằng cách sử dụng ProductsRepository
  //Ví dụ: tạo sản phẩm mới, lấy thông tin sản phẩm, cập nhật sản phẩm, xóa sản phẩm
  async createProduct(product) {
    const createdProduct = await this.productsRepository.create(product);
    return createdProduct;
  }

  async getProductById(productId) {
    const product = await this.productsRepository.findById(productId);
    return product;
  }

  async getProducts() {
    const products = await this.productsRepository.findAll();
    return products;
  }
}

module.exports = ProductsService;
