const chai = require("chai");
const chaiHttp = require("chai-http");
const waitOn = require("wait-on");

chai.use(chaiHttp);
const { expect } = chai;

describe("API Gateway Integration - Routing via /products", function () {
  this.timeout(60000);

  before(async () => {
    await waitOn({
      resources: ["tcp:localhost:3003"],
      timeout: 45000,
      validateStatus: () => true,
    });
  });

  it("should forward to product service and require auth (401)", async () => {
    const res = await chai.request("http://localhost:3003").get("/products/api/products");
    expect(res).to.have.property("status");
    expect([401, 403]).to.include(res.status);
  });

  it("should route /auth through gateway and allow register or return validation error", async () => {
    const res = await chai
      .request("http://localhost:3003")
      .post("/auth/register")
      .send({ email: "test@example.com", password: "password123" });
    // We accept either created, conflict (if exists), or bad request depending on service behavior
    expect([200, 201, 400, 409]).to.include(res.status);
  });
});


