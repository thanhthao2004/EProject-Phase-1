const express = require("express");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer();
const app = express();
// Basic health endpoint so the gateway is reachable without proxying downstream services
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Harden proxy: return 502 instead of crashing when targets are down
proxy.on("error", (err, req, res) => {
  if (!res.headersSent) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Bad gateway", message: err.message }));
  }
});
//Endpoint Internal URI là "http://product:3001" (product-service), "http://order:3002" (order-service), "http://auth:3000" (auth-service)
// Route requests to the auth service
app.use("/auth", (req, res) => {
  proxy.web(req, res, { target: "http://auth:3000" });
});

// Route requests to the product service
app.use("/products", (req, res) => {
  proxy.web(req, res, { target: "http://product:3001" });
});

// Route requests to the order service
app.use("/orders", (req, res) => {
  proxy.web(req, res, { target: "http://order:3002" });
});

// Start the server
const port = process.env.PORT || 3003; //API Gateway chạy cổng 3003
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
