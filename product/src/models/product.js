const mongoose = require("mongoose");
// Sử dụng cơ chế Object Document Mapper (ODM) của Mongoose để định nghĩa cấu trúc dữ liệu cho tài liệu sản phẩm trong MongoDB.
// Tạo một schema mới cho sản phẩm với các trường name (tên sản phẩm), price (giá sản phẩm) và description (mô tả sản phẩm).
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
}, { collection : 'products' });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
