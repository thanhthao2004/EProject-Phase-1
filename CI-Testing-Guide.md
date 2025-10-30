## CI/CD: Deploy tạm thời để chạy test và cách chạy local

### “Deploy” ở đây nghĩa là gì?
- Workflow GitHub Actions sẽ dựng một môi trường Docker Compose tạm thời (không phải production) để chạy test. Quy trình: build image → chạy container → chạy test qua API Gateway → hạ toàn bộ stack.
- Quy tắc bảo mật: chỉ API Gateway được mở cổng ra máy host; các service nội bộ chỉ nằm trong network của Docker.

### Các file liên quan
- `.github/workflows/ci.yml`: Pipeline CI – build, `docker compose up`, chờ Gateway sẵn sàng, chạy test, in logs khi lỗi, rồi teardown.
- `docker-compose.ci.yaml`: Compose riêng cho CI/và chạy test local.
  - Chỉ expose API Gateway cổng 3003.
  - Dùng DNS nội bộ cho Mongo/RabbitMQ.
  - Truyền biến môi trường trực tiếp (không cần `.env` trong CI).

### Bộ test đã có
- `tests/integration/gateway.integration.test.js`: Gọi API qua Gateway (luồng products/auth). Chấp nhận 502 khi backend chưa sẵn sàng (tránh flakey trong CI).
- `tests/gateway/routing.test.js`: Kiểm tra route `/auth/*`, `/orders/*` qua Gateway. Chấp nhận 401/403/404/502 tùy trạng thái bảo vệ/sẵn sàng.
- `tests/security/security.test.js`: Đảm bảo chỉ Gateway truy cập được; kiểm tra `/health` của Gateway.

### NPM scripts
- `npm test` → chạy Mocha trên `tests/**/*.test.js` (bộ test CI ở thư mục `tests/`).

### Chạy local (giống CI)
```bash
# Dựng stack CI
docker compose -f docker-compose.ci.yaml -p eproject-ci up -d

# Chờ Gateway sẵn sàng (khuyến nghị)
npx wait-on tcp:localhost:3003 --timeout 90000

# Chạy bộ test CI
npm test

# Hạ stack
docker compose -f docker-compose.ci.yaml -p eproject-ci down -v
```

### Test với Postman
1) Dựng stack như trên.
2) Kiểm tra Gateway:
   - GET `http://localhost:3003/health` → `{ "status": "ok" }` nếu Gateway đã lên.
3) Thử các route qua Gateway (có thể thấy 502 nếu backend đang khởi động):
   - Auth: `GET http://localhost:3003/auth/dashboard` (thường 401/403 hoặc 502).
   - Products: `GET http://localhost:3003/products/api/products` (401/403 hoặc 502).
   - Orders: `GET http://localhost:3003/orders/` (401/403/404 hoặc 502).

Lưu ý:
- Các cổng service nội bộ (3000/3001/3002) không được mở trong CI compose – chủ ý để bảo mật.
- Dùng `/health` để xác nhận Gateway đã sẵn sàng ngay cả khi service phía sau chưa xong.

### Biến môi trường trong CI compose
`docker-compose.ci.yaml` set tối thiểu, ví dụ:
- `MONGODB_AUTH_URI`, `MONGODB_PRODUCT_URI`, `MONGODB_ORDER_URI` → trỏ tới `mongo` trong network Docker (ví dụ `mongodb://mongo:27017/...`).
- `RABBITMQ_URL` → `amqp://guest:guest@rabbitmq:5672`.
- `JWT_SECRET` → `test-secret` (chỉ dùng cho CI).

Ghi đè khi chạy local (tùy chọn):
```bash
AUTH_JWT_SECRET=my-secret \
PRODUCT_JWT_SECRET=my-secret \
ORDER_JWT_SECRET=my-secret \
docker compose -f docker-compose.ci.yaml -p eproject-ci up -d
```

### Vì sao test chấp nhận HTTP 502?
- Để tránh flakey: khi backend (auth/product/order) chưa sẵn sàng, Gateway sẽ trả 502 (Bad Gateway). Gateway vẫn “sống” và báo trạng thái sẵn sàng của downstream qua 502 trong giai đoạn khởi động.

### Gợi ý cho môi trường production (ngoài phạm vi CI này)
- Dùng compose/manifest riêng cho production hoặc Kubernetes.
- Thêm healthcheck/readiness cho từng service.
- Bảo mật secrets qua GitHub Secrets/secret manager (không hardcode).
- Chỉ expose Gateway ra internet; giữ service nội bộ trong network riêng.


