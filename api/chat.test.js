"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const handler = require("./chat.js");

function makeResponse() {
  return {
    headers: {},
    statusCode: 200,
    payload: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };
}

function makeRequest(overrides = {}) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { messages: [{ role: "user", content: "Hello Abdullah AI" }] },
    ...overrides
  };
}

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return data; }
  };
}

test("rejects methods other than POST", async () => {
  const res = makeResponse();
  await handler(makeRequest({ method: "GET" }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "POST");
});

test("rejects non-JSON requests", async () => {
  const res = makeResponse();
  await handler(makeRequest({ headers: { "content-type": "text/plain" } }), res);
  assert.equal(res.statusCode, 415);
});

test("requires a server-side API key", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const res = makeResponse();
  await handler(makeRequest(), res);
  assert.equal(res.statusCode, 503);
  if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = oldKey;
});

test("rejects an empty conversation", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  const res = makeResponse();
  await handler(makeRequest({ body: { messages: [] } }), res);
  assert.equal(res.statusCode, 400);
  if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = oldKey;
});

test("requires the last valid message to come from the user", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  const res = makeResponse();
  await handler(makeRequest({
    body: { messages: [{ role: "assistant", content: "Earlier reply" }] }
  }), res);
  assert.equal(res.statusCode, 400);
  if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = oldKey;
});

test("rejects messages above the character limit", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  const res = makeResponse();
  await handler(makeRequest({
    body: { messages: [{ role: "user", content: "x".repeat(3501) }] }
  }), res);
  assert.equal(res.statusCode, 413);
  if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = oldKey;
});

test("sends validated messages to the provider and returns its reply", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = global.fetch;
  const oldModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = "server-test-key";
  process.env.OPENAI_MODEL = "test-model";
  let requestUrl;
  let requestOptions;
  global.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return jsonResponse(200, { output_text: "Hello from the test model" });
  };

  try {
    const res = makeResponse();
    await handler(makeRequest(), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.reply, "Hello from the test model");
    assert.equal(requestUrl, "https://api.openai.com/v1/responses");
    assert.equal(requestOptions.headers.Authorization, "Bearer server-test-key");
    const sent = JSON.parse(requestOptions.body);
    assert.equal(sent.model, "test-model");
    assert.equal(sent.input[0].content, "Hello Abdullah AI");
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = oldModel;
  }
});

test("maps provider usage limits to HTTP 429", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => jsonResponse(429, { error: { type: "rate_limit_error" } });
  try {
    const res = makeResponse();
    await handler(makeRequest(), res);
    assert.equal(res.statusCode, 429);
    assert.match(res.payload.error, /usage limit|busy/i);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("maps provider timeouts to HTTP 504", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    throw error;
  };
  try {
    const res = makeResponse();
    await handler(makeRequest(), res);
    assert.equal(res.statusCode, 504);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("rejects empty provider output", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => jsonResponse(200, { output_text: "" });
  try {
    const res = makeResponse();
    await handler(makeRequest(), res);
    assert.equal(res.statusCode, 502);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
