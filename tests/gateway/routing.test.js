const chai = require("chai");
const chaiHttp = require("chai-http");
const waitOn = require("wait-on");

chai.use(chaiHttp);
const { expect } = chai;

describe("API Gateway - Basic routing checks", function () {
  this.timeout(60000);

  before(async () => {
    await waitOn({ resources: ["tcp:localhost:3003"], timeout: 45000 });
  });

  it("routes /auth/* to auth service", async () => {
    const res = await chai
      .request("http://localhost:3003")
      .get("/auth/dashboard")
      .catch((err) => err.response);
    // Expect unauthorized since no token
    expect(res).to.have.property("status");
    expect([401, 403]).to.include(res.status);
  });

  it("routes /orders to order service (likely protected)", async () => {
    const res = await chai
      .request("http://localhost:3003")
      .get("/orders/")
      .catch((err) => err.response);
    // Accept unauthorized or not found based on implementation
    expect(res).to.have.property("status");
    expect([401, 403, 404]).to.include(res.status);
  });
});


