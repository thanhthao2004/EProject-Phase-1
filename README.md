# HỆ THỐNG E-COMMERCE MICROSERVICES

## TỔNG QUAN DỰ ÁN

Đây là hệ thống được xây dựng theo **kiến trúc Microservices** sử dụng Node.js, MongoDB, và RabbitMQ, chạy trên Docker container.

Link Github: https://github.com/thanhthao2004/EProject-Phase-1

---

## HỆ THỐNG GIẢI QUYẾT VẤN ĐỀ GÌ?

Hệ thống giải quyết các vấn đề chính:
- **Quản lý người dùng và xác thực**: Đăng ký, đăng nhập với JWT
- **Quản lý sản phẩm**: CRUD sản phẩm
- **Xử lý đơn hàng**: Đặt hàng và theo dõi trạng thái
- **Giao tiếp bất đồng bộ**: Dùng RabbitMQ để xử lý đơn hàng không đồng bộ
- **Bảo mật**: API Gateway làm điểm truy cập tập trung

---

##  KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (POSTMAN)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  API GATEWAY (Port 3003)                    │
│              Điểm truy cập tập trung                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│ AUTH SERVICE │ │ PRODUCT │ │ ORDER       │
│ (Port 3000)  │ │ SERVICE │ │ SERVICE     │
│              │ │(Port    │ │ (Port 3002) │
│              │ │ 3001)   │ │             │
└───────┬──────┘ └────┬────┘ └──────┬──────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     MONGODB (Port 37017) │
        │   (users, products, orders)│
        └──────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   RABBITMQ (Port 5672)   │
        │  Message Queue (AMQP)    │
        │  Management: 15672        │
        └──────────────────────────┘
```

---

##  HỆ THỐNG CÓ BAO NHIÊU DỊCH VỤ?

Hệ thống gồm **4 microservices chính**:

| Service | Port | Container Name | Mô tả |
|---------|------|----------------|-------|
| **API Gateway** | 3003 | api-gateway | Điều hướng requests |
| **Auth Service** | 3000 | auth-service | Xác thực người dùng |
| **Product Service** | 3001 | product-service | Quản lý sản phẩm |
| **Order Service** | 3002 | order-service | Xử lý đơn hàng |

---

##  Ý NGHĨA TỪNG DỊCH VỤ

### 1. **API Gateway** (Port 3003)
- **Chức năng**: Điểm truy cập duy nhất cho tất cả requests
- **Vai trò**:
  - Điều hướng từ `/auth` → auth-service
  - Điều hướng từ `/products` → product-service
  - Điều hướng từ `/orders` → order-service
- **Ưu điểm**: Không cần expose trực tiếp các services

### 2. **Auth Service** (Port 3000)
- **Chức năng**: Xác thực và phân quyền
- **Endpoints**:
  - `POST /login` - Đăng nhập, trả về JWT
  - `POST /register` - Đăng ký tài khoản
- **Bảo mật**: Băm mật khẩu bằng bcrypt, JWT

### 3. **Product Service** (Port 3001)
- **Chức năng**: Quản lý sản phẩm
- **Endpoints**:
  - `POST /api/products` - Tạo sản phẩm
  - `GET /api/products` - Danh sách sản phẩm
  - `GET /api/products/:id` - Sản phẩm theo ID
  - `POST /api/products/buy` - Đặt hàng
- **Tích hợp**: Giao tiếp với Order qua RabbitMQ

### 4. **Order Service** (Port 3002)
- **Chức năng**: Xử lý đơn hàng
- **Hoạt động**:
  - Lắng nghe queue "orders"
  - Lưu đơn vào MongoDB
  - Phản hồi qua queue "products"
- **Kiến trúc**: Chỉ consume RabbitMQ, không expose HTTP endpoints

---

##  CÁC MẪU THIẾT KẾ ĐƯỢC SỬ DỤNG

### 1. **Repository Pattern**
```javascript
// product/src/repositories/productsRepository.js
class ProductsRepository {
  async create(product) { }
  async findById(productId) { }
  async findAll() { }
}
```
- Tách biệt data access và business logic
- Dễ test và bảo trì

### 2. **Service Layer Pattern**
```javascript
// product/src/services/productsService.js
class ProductsService {
  constructor() {
    this.productsRepository = new ProductsRepository();
  }
  async createProduct(product) { }
}
```
- Tạo một lớp business logic riêng
- Controller gọi Service thay vì Repository

### 3. **Middleware Pattern**
```javascript
// product/src/utils/isAuthenticated.js
function isAuthenticated(req, res, next) {
  // Verify JWT token
  // Attach user info to req.user
  next();
}
```
- Xử lý xác thực tập trung
- Tái sử dụng giữa các routes

### 4. **Message Broker Pattern (RabbitMQ)**
- Giao tiếp bất đồng bộ giữa services
- Lỏng lẻo kết nối, dễ scale
- Producer → Queue → Consumer

---

##  CÁC DỊCH VỤ GIAO TIẾP NHƯ THẾ NÀO?

### **1. HTTP Communication (Đồng bộ)**

Client ↔ **API Gateway** ↔ **Auth/Product Service**

```
Client → API Gateway (3003) → Auth Service (3000)
```

### **2. AMQP Communication (Bất đồng bộ)**

**Product Service** ↔ **RabbitMQ** ↔ **Order Service**

```
Product Service → RabbitMQ (orders queue) → Order Service
Order Service → RabbitMQ (products queue) → Product Service
```

#### **Luồng đặt hàng**:
1. Client gọi `POST /api/products/buy`
2. Product gửi message vào "orders"
3. Order consume và lưu đơn hàng
4. Order gửi message vào "products"
5. Product nhận kết quả và trả về Client

---

##  CÁCH CHẠY PROJECT

### **Yêu cầu hệ thống:**
- Docker Desktop
- Node.js 18+
- Git

### **Bước 1: Clone repository**
```bash
git clone <repository-url>
cd EProject-Phase-1
```

### **Bước 2: Cấu hình Environment Variables**

Tạo file `.env` trong mỗi service:

#### `auth/.env`:
```
MONGODB_AUTH_URI=mongodb://mongo:27017/auth
JWT_SECRET=your-secret-key-here
```

#### `product/.env`:
```
MONGODB_PRODUCT_URI=mongodb://mongo:27017/products
RABBITMQ_URI=amqp://rabbitmq:5672
JWT_SECRET=your-secret-key-here
```

#### `order/.env`:
```
MONGODB_ORDER_URI=mongodb://mongo:27017/orders
RABBITMQ_URI=amqp://rabbitmq:5672
```

### **Bước 3: Build và chạy Docker containers**
```bash
docker compose up -d --build
```

### **Bước 4: Kiểm tra containers đang chạy**
```bash
docker ps
```

Bạn sẽ thấy:
- mongo (port 37017)
- rabbitmq (port 5672, management: 15672)
- auth-service
- product-service (port 3001)
- order-service
- api-gateway (port 3003)

### **Bước 5: Kiểm tra logs**
```bash
# Xem logs tất cả services
docker compose logs -f

# Xem logs một service cụ thể
docker logs api-gateway
docker logs product-service
docker logs auth-service
```

---

##  CÁCH TEST TỪNG CHỨC NĂNG VỚI POSTMAN

> **LƯU Ý**: Tất cả requests phải gửi qua API Gateway (port 3003) để chứng minh các services đang chạy trên Docker.

### **1. TẠO TÀI KHOẢN NGƯỜI DÙNG**

**Request:**
```
Method: POST
URL: http://localhost:3003/auth/register
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "username": "testuser",
  "password": "password123"
}
```

**Response mong đợi:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "testuser"
}
```

**Screenshot minh chứng**: ![Đăng ký thành công]

---

### **2. TIẾN HÀNH ĐĂNG NHẬP THÀNH CÔNG**

**Request:**
```
Method: POST
URL: http://localhost:3003/auth/login
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "username": "testuser",
  "password": "password123"
}
```

**Response mong đợi:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**LƯU Ý**: Sao chép token để dùng cho các requests tiếp theo!

**Screenshot minh chứng**: ![Đăng nhập thành công]

---

### **3. TẠO THÔNG TIN SẢN PHẨM MỚI**

**Request:**
```
Method: POST
URL: http://localhost:3003/products/api/products
Headers:
  Content-Type: application/json
  Authorization: Bearer {token-từ-bước-2}
Body (raw JSON):
{
  "name": "Laptop Gaming ASUS",
  "description": "Laptop gaming cao cấp với RTX 3060",
  "price": 25000000
}
```

**Response mong đợi:**
```json
{
  "_id": "68fc9d20a7a539fb44dcb9f5",
  "name": "Laptop Gaming ASUS",
  "description": "Laptop gaming cao cấp với RTX 3060",
  "price": 25000000
}
```

**LƯU Ý**: Sao chép `_id` để dùng cho các bước tiếp theo!

**Screenshot minh chứng**: ![Tạo sản phẩm thành công]

---

### **4. HIỂN THỊ THÔNG TIN SẢN PHẨM THEO ID**

**Request:**
```
Method: GET
URL: http://localhost:3003/products/api/products/68fc9d20a7a539fb44dcb9f5
Headers:
  Authorization: Bearer {token-từ-bước-2}
```

**Response mong đợi:**
```json
{
  "_id": "68fc9d20a7a539fb44dcb9f5",
  "name": "Laptop Gaming ASUS",
  "description": "Laptop gaming cao cấp với RTX 3060",
  "price": 25000000
}
```

**Screenshot minh chứng**: ![Lấy sản phẩm theo ID thành công]

---

### *** 5. THỰC HIỆN THAO TÁC ĐẶT HÀNG**

**Request:**
```
Method: POST
URL: http://localhost:3003/products/api/products/buy
Headers:
  Content-Type: application/json
  Authorization: Bearer {token-từ-bước-2}
Body (raw JSON):
{
  "ids": ["68fc9d20a7a539fb44dcb9f5"]
}
```

**Response mong đợi:**
```json
{
  "status": "completed",
  "products": [
    {
      "_id": "68fc9d20a7a539fb44dcb9f5",
      "name": "Laptop Gaming ASUS",
      "price": 25000000
    }
  ],
  "totalPrice": 25000000,
  "username": "testuser",
  "orderId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Giải thích luồng:**
1. Product Service gửi message vào RabbitMQ queue "orders"
2. Order Service consume và lưu đơn vào MongoDB
3. Order Service gửi message vào queue "products"
4. Product Service nhận kết quả và trả về Client

**Screenshot minh chứng**: ![Đặt hàng thành công]

---

### **📋 6. XEM DANH SÁCH SẢN PHẨM**

**Request:**
```
Method: GET
URL: http://localhost:3003/products/api/products
Headers:
  Authorization: Bearer {token-từ-bước-2}
```

**Response mong đợi:**
```json
[
  {
    "_id": "68fc9d20a7a539fb44dcb9f5",
    "name": "Laptop Gaming ASUS",
    "description": "Laptop gaming cao cấp với RTX 3060",
    "price": 25000000
  }
]
```

**Screenshot minh chứng**: ![Danh sách sản phẩm]

---

##  KIỂM TRA DOCKER CONTAINERS

### **Xem containers đang chạy:**
```bash
docker ps
```

### **Xem logs real-time:**
```bash
# Tất cả services
docker compose logs -f

# Product service
docker logs product-service -f

# Order service
docker logs order-service -f
```

### **Kiểm tra RabbitMQ:**
Truy cập: http://localhost:15672
- Username: `guest`
- Password: `guest`

Tại đây bạn sẽ thấy các queues: `orders` và `products`

---

## CẤU TRÚC PROJECT

```
EProject-Phase-1/
├── api-gateway/          # API Gateway service
│   ├── index.js
│   ├── Dockerfile
│   └── package.json
├── auth/                 # Auth service
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── middlewares/
│   └── Dockerfile
├── product/              # Product service
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── utils/
│   └── Dockerfile
├── order/                # Order service
│   ├── src/
│   │   ├── app.js
│   │   ├── models/
│   │   └── utils/
│   └── Dockerfile
├── docker-compose.yaml   # Docker orchestration
└── README.md            # Tài liệu này
```

---

## TROUBLESHOOTING

### **Lỗi: Cannot connect to MongoDB**
```bash
# Kiểm tra MongoDB container
docker ps | grep mongo

# Khởi động lại MongoDB
docker restart mongo
```

### **Lỗi: Cannot connect to RabbitMQ**
```bash
# Kiểm tra RabbitMQ container
docker ps | grep rabbitmq

# Khởi động lại RabbitMQ
docker restart rabbitmq

# Chờ 30 giây để RabbitMQ khởi động hoàn toàn
```

### **Lỗi: Unauthorized (401)**
- Kiểm tra token JWT có hợp lệ không
- Đảm bảo header: `Authorization: Bearer {token}`

### **Services không restart sau khi code changes**
```bash
# Rebuild containers
docker compose up -d --build
```

---

## GIẢI THÍCH KIẾN TRÚC

### **Tại sao dùng Microservices?**
- Scale độc lập
- Phát triển song song
- Công nghệ đa dạng
- Fault isolation

### **Tại sao dùng RabbitMQ?**
- Giao tiếp bất đồng bộ
- Reliability
- Decoupling giữa services
- Hỗ trợ nhiều pattern (queue, publish/subscribe)

### **Tại sao dùng API Gateway?**
- Single entry point
- Load balancing
- Auth tập trung
- Rate limiting
- Monitoring

---