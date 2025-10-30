const mongoose = require('mongoose');
// Sử dụng cơ chế Object Document Mapper (ODM) của Mongoose để định nghĩa cấu trúc dữ liệu cho tài liệu đơn hàng trong MongoDB.
// Tạo một schema mới cho đơn hàng với các trường products (mảng tham chiếu đến sản phẩm), totalPrice (giá tổng) và createdAt (ngày tạo).
const orderSchema = new mongoose.Schema({
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
    required: true,
  }],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection : 'orders' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
