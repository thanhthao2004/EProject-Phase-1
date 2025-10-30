# E-COMMERCE MICROSERVICES PROJECT - TÀI LIỆU CHI TIẾT

## 📋 TỔNG QUAN DỰ ÁN

Đây là một hệ thống E-commerce được xây dựng theo kiến trúc **Microservices** với 4 services chính:
- **API Gateway** (Port 3003): Điều hướng requests
- **Auth Service** (Port 3000): Xác thực người dùng
- **Product Service** (Port 3001): Quản lý sản phẩm
- **Order Service** (Port 3002): Xử lý đơn hàng

## 🏗️ KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  API GATEWAY                                │
│                   (Port 3003)                              │
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
        │     MONGODB DATABASE     │
        │   (3 Collections)        │
        └──────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      RABBITMQ            │
        │   (Message Broker)       │
        └──────────────────────────┘
```

## 🔄 LUỒNG HOẠT ĐỘNG CHI TIẾT

### 1. **API GATEWAY** (`api-gateway/index.js`)

**Chức năng:** Điều hướng tất cả requests từ client đến các microservices

**Luồng code:**
```javascript
// Dòng 1-4: Import dependencies
const express = require("express");
const httpProxy = require("http-proxy");

// Dòng 5-6: Khởi tạo proxy server và Express app
const proxy = httpProxy.createProxyServer();
const app = express();

// Dòng 7: Comment giải thích internal URIs
// Dòng 8-10: Route /auth requests đến auth service
app.use("/auth", (req, res) => {
  proxy.web(req, res, { target: "http://auth:3000" });
});

// Dòng 12-15: Route /products requests đến product service  
app.use("/products", (req, res) => {
  proxy.web(req, res, { target: "http://product:3001" });
});

// Dòng 17-20: Route /orders requests đến order service
app.use("/orders", (req, res) => {
  proxy.web(req, res, { target: "http://order:3002" });
});

// Dòng 22-26: Khởi động server trên port 3003
const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
```

### 2. **AUTH SERVICE** - Xác thực người dùng

#### **2.1 Entry Point** (`auth/index.js`)
```javascript
// Dòng 1: Load environment variables
require("dotenv").config();

// Dòng 2-5: Import và khởi tạo App class
const App = require("./src/app");
const app = new App();
app.start();
```

#### **2.2 App Class** (`auth/src/app.js`)
```javascript
// Dòng 1-5: Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const authMiddleware = require("./middlewares/authMiddleware");
const AuthController = require("./controllers/authController");

// Dòng 7-14: Constructor - khởi tạo app, controller, connect DB, set middlewares và routes
class App {
  constructor() {
    this.app = express();
    this.authController = new AuthController();
    this.connectDB();
    this.setMiddlewares();
    this.setRoutes();
  }

  // Dòng 16-22: Kết nối MongoDB
  async connectDB() {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  }

  // Dòng 29-32: Set up middlewares (JSON parsing)
  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  // Dòng 34-38: Định nghĩa routes
  setRoutes() {
    this.app.post("/login", (req, res) => this.authController.login(req, res));
    this.app.post("/register", (req, res) => this.authController.register(req, res));
    this.app.get("/dashboard", authMiddleware, (req, res) => res.json({ message: "Welcome to dashboard" }));
  }

  // Dòng 40-42: Khởi động server trên port 3000
  start() {
    this.server = this.app.listen(3000, () => console.log("Server started on port 3000"));
  }
}
```

#### **2.3 Auth Controller** (`auth/src/controllers/authController.js`)

**Login Flow:**
```javascript
// Dòng 12-22: Login method
async login(req, res) {
  // Dòng 13: Extract username và password từ request body
  const { username, password } = req.body;

  // Dòng 15: Gọi authService.login() để xác thực
  const result = await this.authService.login(username, password);

  // Dòng 17-21: Trả về token nếu thành công, error nếu thất bại
  if (result.success) {
    res.json({ token: result.token });
  } else {
    res.status(400).json({ message: result.message });
  }
}
```

**Register Flow:**
```javascript
// Dòng 24-40: Register method
async register(req, res) { 
  // Dòng 25: Lấy user data từ request body
  const user = req.body;

  try {
    // Dòng 28: Kiểm tra username đã tồn tại chưa
    const existingUser = await this.authService.findUserByUsername(user.username);

    // Dòng 30-33: Nếu username đã tồn tại, throw error
    if (existingUser) {
      console.log("Username already taken")
      throw new Error("Username already taken");
    }

    // Dòng 35-36: Tạo user mới và trả về kết quả
    const result = await this.authService.register(user);
    res.json(result);
  } catch (err) {
    // Dòng 37-39: Handle error
    res.status(400).json({ message: err.message });
  }
}
```

#### **2.4 Auth Service** (`auth/src/services/authService.js`)

**Login Logic:**
```javascript
// Dòng 20-36: Login method
async login(username, password) {
  // Dòng 21: Tìm user theo username
  const user = await this.userRepository.getUserByUsername(username);

  // Dòng 23-25: Nếu không tìm thấy user, return error
  if (!user) {
    return { success: false, message: "Invalid username or password" };
  }

  // Dòng 27-31: So sánh password với bcrypt
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, message: "Invalid username or password" };
  }

  // Dòng 33-35: Tạo JWT token và return success
  const token = jwt.sign({ id: user._id }, config.jwtSecret);
  return { success: true, token };
}
```

**Register Logic:**
```javascript
// Dòng 38-43: Register method
async register(user) {
  // Dòng 39: Tạo salt cho bcrypt
  const salt = await bcrypt.genSalt(10);
  
  // Dòng 40: Hash password với salt
  user.password = await bcrypt.hash(user.password, salt);

  // Dòng 42: Tạo user trong database
  return await this.userRepository.createUser(user);
}
```

#### **2.5 User Model** (`auth/src/models/user.js`)
```javascript
// Dòng 1-2: Import mongoose
const mongoose = require("mongoose");

// Dòng 4-13: Định nghĩa User Schema
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

// Dòng 15: Export User model
module.exports = mongoose.model("User", UserSchema);
```

#### **2.6 Auth Middleware** (`auth/src/middlewares/authMiddleware.js`)
```javascript
// Dòng 8-22: Middleware function
module.exports = function(req, res, next) {
  // Dòng 9: Lấy token từ header
  const token = req.header("x-auth-token");

  // Dòng 11-13: Kiểm tra token có tồn tại không
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Dòng 16: Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (e) {
    // Dòng 19-21: Handle invalid token
    res.status(400).json({ message: "Token is not valid" });
  }
};
```

### 3. **PRODUCT SERVICE** - Quản lý sản phẩm

#### **3.1 App Class** (`product/src/app.js`)
```javascript
// Dòng 1-6: Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const MessageBroker = require("./utils/messageBroker");
const productsRouter = require("./routes/productRoutes");

// Dòng 8-15: Constructor
class App {
  constructor() {
    this.app = express();
    this.connectDB();
    this.setMiddlewares();
    this.setRoutes();
    this.setupMessageBroker();
  }

  // Dòng 35-36: Setup routes
  setRoutes() {
    this.app.use("/api/products", productsRouter);
  }

  // Dòng 39-41: Setup RabbitMQ connection
  setupMessageBroker() {
    MessageBroker.connect();
  }

  // Dòng 43-46: Start server on port 3001
  start() {
    this.server = this.app.listen(3001, () =>
      console.log("Server started on port 3001")
    );
  }
}
```

#### **3.2 Product Routes** (`product/src/routes/productRoutes.js`)
```javascript
// Dòng 1-6: Import dependencies
const express = require("express");
const ProductController = require("../controllers/productController");
const isAuthenticated = require("../utils/isAuthenticated");

// Dòng 8-9: Setup router và controller
const router = express.Router();
const productController = new ProductController();

// Dòng 11-13: Define routes với authentication middleware
router.post("/", isAuthenticated, productController.createProduct);
router.post("/buy", isAuthenticated, productController.createOrder);
router.get("/", isAuthenticated, productController.getProducts);
```

#### **3.3 Product Controller** (`product/src/controllers/productController.js`)

**Create Product Flow:**
```javascript
// Dòng 17-37: createProduct method
async createProduct(req, res, next) {
  try {
    // Dòng 19-22: Kiểm tra authorization header
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Dòng 23: Tạo Product instance từ request body
    const product = new Product(req.body);

    // Dòng 25-28: Validate product data
    const validationError = product.validateSync();
    if (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // Dòng 30: Save product to database
    await product.save({ timeout: 30000 });

    // Dòng 32: Return created product
    res.status(201).json(product);
  } catch (error) {
    // Dòng 33-36: Handle errors
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
```

**Create Order Flow (Phức tạp nhất):**
```javascript
// Dòng 39-86: createOrder method
async createOrder(req, res, next) {
  try {
    // Dòng 41-44: Kiểm tra authentication
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Dòng 46-47: Lấy product IDs từ request body
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });

    // Dòng 49-55: Tạo order ID và lưu vào ordersMap
    const orderId = uuid.v4();
    this.ordersMap.set(orderId, { 
      status: "pending", 
      products, 
      username: req.user.username
    });

    // Dòng 57-61: Gửi message đến RabbitMQ orders queue
    await messageBroker.publishMessage("orders", {
      products,
      username: req.user.username,
      orderId,
    });

    // Dòng 63-71: Consume message từ products queue
    messageBroker.consumeMessage("products", (data) => {
      const orderData = JSON.parse(JSON.stringify(data));
      const { orderId } = orderData;
      const order = this.ordersMap.get(orderId);
      if (order) {
        this.ordersMap.set(orderId, { ...order, ...orderData, status: 'completed' });
        console.log("Updated order:", order);
      }
    });

    // Dòng 74-78: Long polling để chờ order completed
    let order = this.ordersMap.get(orderId);
    while (order.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      order = this.ordersMap.get(orderId);
    }

    // Dòng 80-81: Return completed order
    return res.status(201).json(order);
  } catch (error) {
    // Dòng 82-85: Handle errors
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
```

#### **3.4 Message Broker** (`product/src/utils/messageBroker.js`)
```javascript
// Dòng 1-6: Import amqplib và define MessageBroker class
const amqp = require("amqplib");

class MessageBroker {
  constructor() {
    this.channel = null;
  }

  // Dòng 8-21: Connect to RabbitMQ
  async connect() {
    console.log("Connecting to RabbitMQ...");
    setTimeout(async () => {
      try {
        const connection = await amqp.connect("amqp://rabbitmq:5672");
        this.channel = await connection.createChannel();
        await this.channel.assertQueue("products");
        console.log("RabbitMQ connected");
      } catch (err) {
        console.error("Failed to connect to RabbitMQ:", err.message);
      }
    }, 20000);
  }

  // Dòng 23-37: Publish message to queue
  async publishMessage(queue, message) {
    if (!this.channel) {
      console.error("No RabbitMQ channel available.");
      return;
    }
    try {
      await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    } catch (err) {
      console.log(err);
    }
  }

  // Dòng 39-55: Consume message from queue
  async consumeMessage(queue, callback) {
    if (!this.channel) {
      console.error("No RabbitMQ channel available.");
      return;
    }
    try {
      await this.channel.consume(queue, (message) => {
        const content = message.content.toString();
        const parsedContent = JSON.parse(content);
        callback(parsedContent);
        this.channel.ack(message);
      });
    } catch (err) {
      console.log(err);
    }
  }
}
```

### 4. **ORDER SERVICE** - Xử lý đơn hàng

#### **4.1 App Class** (`order/src/app.js`)
```javascript
// Dòng 1-6: Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const Order = require("./models/order");
const amqp = require("amqplib");
const config = require("./config");

// Dòng 7-12: Constructor
class App {
  constructor() {
    this.app = express();
    this.connectDB();
    this.setupOrderConsumer();
  }

  // Dòng 27-68: Setup RabbitMQ consumer
  async setupOrderConsumer() {
    console.log("Connecting to RabbitMQ...");
    
    setTimeout(async () => {
      try {
        // Dòng 33: Connect to RabbitMQ
        const amqpServer = "amqp://rabbitmq:5672";
        const connection = await amqp.connect(amqpServer);
        console.log("Connected to RabbitMQ");
        
        // Dòng 35-36: Create channel và assert queue
        const channel = await connection.createChannel();
        await channel.assertQueue("orders");

        // Dòng 38-63: Consume messages từ orders queue
        channel.consume("orders", async (data) => {
          console.log("Consuming ORDER service");
          
          // Dòng 41: Parse message data
          const { products, username, orderId } = JSON.parse(data.content);

          // Dòng 43-47: Tạo Order instance
          const newOrder = new Order({
            products,
            user: username,
            totalPrice: products.reduce((acc, product) => acc + product.price, 0),
          });

          // Dòng 49-50: Save order to database
          await newOrder.save();

          // Dòng 52-54: Send ACK
          channel.ack(data);
          console.log("Order saved to DB and ACK sent to ORDER queue");

          // Dòng 56-62: Send message to products queue
          const { user, products: savedProducts, totalPrice } = newOrder.toJSON();
          channel.sendToQueue(
            "products",
            Buffer.from(JSON.stringify({ orderId, user, products: savedProducts, totalPrice }))
          );
        });
      } catch (err) {
        console.error("Failed to connect to RabbitMQ:", err.message);
      }
    }, 10000);
  }
}
```

## 🔄 LUỒNG HOẠT ĐỘNG TỔNG THỂ

### **Scenario: User đặt hàng**

1. **User Login:**
   ```
   POST localhost:3003/auth/login
   → API Gateway → Auth Service (3000)
   → Return JWT Token
   ```

2. **User tạo sản phẩm:**
   ```
   POST localhost:3003/products
   → API Gateway → Product Service (3001)
   → Save to MongoDB
   ```

3. **User đặt hàng:**
   ```
   POST localhost:3003/products/buy
   → API Gateway → Product Service (3001)
   → Publish message to RabbitMQ "orders" queue
   → Order Service (3002) consumes message
   → Order Service saves order to MongoDB
   → Order Service publishes to "products" queue
   → Product Service receives confirmation
   → Return order details to user
   ```

## 🧪 TEST CASES

### **Auth Service Tests** (`auth/src/test/authController.test.js`)
- ✅ Register new user
- ✅ Register duplicate username (should fail)
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Login with wrong password

### **Product Service Tests** (`product/src/test/product.test.js`)
- ✅ Create product with valid data
- ✅ Create product with missing name (should fail)
- ✅ Authentication required for all endpoints

## 🔧 CONFIGURATION

### **Environment Variables:**
- `MONGODB_AUTH_URI`: MongoDB connection cho Auth service
- `MONGODB_PRODUCT_URI`: MongoDB connection cho Product service  
- `MONGODB_ORDER_URI`: MongoDB connection cho Order service
- `JWT_SECRET`: Secret key cho JWT tokens
- `RABBITMQ_URI`: RabbitMQ connection string

### **Ports:**
- API Gateway: 3003
- Auth Service: 3000
- Product Service: 3001
- Order Service: 3002

## 🚀 DEPLOYMENT REQUIREMENTS

1. **Docker containers** cho tất cả services
2. **MongoDB** database
3. **RabbitMQ** message broker
4. **Network isolation** - chỉ API Gateway accessible từ bên ngoài
5. **CI/CD pipeline** với GitHub Actions
6. **Integration tests** đảm bảo tất cả requests qua API Gateway

## ⚠️ SECURITY NOTES

- Tất cả services phải được bảo vệ bởi API Gateway
- Không được truy cập trực tiếp vào internal services
- JWT tokens được sử dụng cho authentication
- Passwords được hash với bcrypt
- Message queues đảm bảo asynchronous communication
