const test = require("node:test");
const assert = require("node:assert/strict");
const requireRouteWriteToken = require("../middleware/requireRouteWriteToken");

function responseStub() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("route ingestion fails closed when no token is configured", () => {
  const previous = process.env.ROUTE_WRITE_TOKEN;
  delete process.env.ROUTE_WRITE_TOKEN;
  const res = responseStub();
  let continued = false;

  requireRouteWriteToken({ get: () => "Bearer anything" }, res, () => { continued = true; });

  assert.equal(res.statusCode, 503);
  assert.equal(continued, false);
  if (previous !== undefined) process.env.ROUTE_WRITE_TOKEN = previous;
});

test("route ingestion rejects a missing or incorrect bearer token", () => {
  const previous = process.env.ROUTE_WRITE_TOKEN;
  process.env.ROUTE_WRITE_TOKEN = "expected-secret";

  for (const authorization of ["", "Bearer wrong-secret"]) {
    const res = responseStub();
    let continued = false;
    requireRouteWriteToken({ get: () => authorization }, res, () => { continued = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
  }

  if (previous === undefined) delete process.env.ROUTE_WRITE_TOKEN;
  else process.env.ROUTE_WRITE_TOKEN = previous;
});

test("route ingestion accepts the configured bearer token", () => {
  const previous = process.env.ROUTE_WRITE_TOKEN;
  process.env.ROUTE_WRITE_TOKEN = "expected-secret";
  const res = responseStub();
  let continued = false;

  requireRouteWriteToken({ get: () => "Bearer expected-secret" }, res, () => { continued = true; });

  assert.equal(res.statusCode, 200);
  assert.equal(continued, true);
  if (previous === undefined) delete process.env.ROUTE_WRITE_TOKEN;
  else process.env.ROUTE_WRITE_TOKEN = previous;
});