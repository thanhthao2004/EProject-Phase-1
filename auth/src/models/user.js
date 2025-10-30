const mongoose = require("mongoose");
//Sử dụng cơ chế Object Document Mapper (ODM) của Mongoose để định nghĩa cấu trúc dữ liệu cho tài liệu người dùng trong MongoDB.
//Tạo một schema mới cho người dùng với các trường username và password, cả hai đều là chuỗi và bắt buộc phải có.
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("User", UserSchema);