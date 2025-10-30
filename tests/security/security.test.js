const http = require("http");
const waitOn = require("wait-on");
const { expect } = require("chai");

function tryHttpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      resolve({ ok: true, statusCode: res.statusCode });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.setTimeout(5000, () => {
      req.destroy(new Error("timeout"));
    });
  });
}

describe("Security - Only API Gateway is accessible from host", function () {
  this.timeout(60000);

  before(async () => {
    await waitOn({ resources: ["tcp:localhost:3003"], timeout: 45000 });
  });

  it("gateway on 3003 should be reachable", async () => {
    const result = await tryHttpGet("http://localhost:3003/health").catch((e) => {
      return { ok: false, error: e };
    });
    expect(result.ok).to.equal(true);
  });

  [3000, 3001, 3002].forEach((port) => {
    it(`direct service port ${port} should NOT be reachable`, async () => {
      const result = await tryHttpGet(`http://localhost:${port}/`).catch((e) => e);
      // Expect a connection error (ECONNREFUSED) or timeout
      expect(result).to.be.instanceOf(Error);
    });
  });
});


