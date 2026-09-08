const assert = require("node:assert/strict");

const frontend = process.env.SMOKE_FRONTEND_URL || "http://localhost:3000";
const backend = process.env.SMOKE_BACKEND_URL || "http://127.0.0.1:3001";
const origin = new URL(frontend).origin;

async function request(base, pathname, options = {}) {
  return fetch(new URL(pathname, base), {
    redirect: "manual", signal: AbortSignal.timeout(15_000), ...options,
  });
}

async function main() {
  assert.equal((await request(frontend, "/login")).status, 200, "login page");
  const dashboard = await request(frontend, "/dashboard");
  assert.equal(dashboard.status, 307, "anonymous dashboard redirects");
  assert.equal(new URL(dashboard.headers.get("location"), frontend).pathname, "/login");

  for (const base of [backend, frontend]) {
    const health = await request(base, "/api/v1/healthz", {
      headers: { "x-request-id": "monorepo-smoke" },
    });
    assert.equal(health.status, 200, `database health via ${base}`);
    assert.equal((await health.json()).database, "connected");
    assert.equal(health.headers.get("x-request-id"), "monorepo-smoke");
    assert.equal((await request(base, "/api/v1/students?page=2&page_size=1")).status, 401);
  }

  const login = await request(frontend, "/api/v1/auth/login", {
    method: "POST", headers: { origin, "content-type": "application/json" }, body: "{}",
  });
  assert.equal(login.status, 400, "allowed-origin request reaches login validation");
  const crossOrigin = await request(frontend, "/api/v1/auth/login", {
    method: "POST", headers: { origin: "https://untrusted.invalid", "content-type": "application/json" }, body: "{}",
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal((await crossOrigin.json()).error.code, "INVALID_ORIGIN");

  const invalidSession = await request(frontend, "/dashboard", {
    headers: { cookie: "sms_access_token=invalid" },
  });
  assert.equal(invalidSession.status, 307, "forged cookie cannot open the dashboard");
  assert.equal(new URL(invalidSession.headers.get("location"), frontend).pathname, "/login");

  // No refresh cookie is sent: this checks cookie forwarding without revoking a session.
  const logout = await request(frontend, "/api/v1/auth/logout", { method: "POST", headers: { origin } });
  assert.equal(logout.status, 200);
  const cleared = logout.headers.getSetCookie();
  assert.equal(cleared.length, 2, "proxy must preserve both Set-Cookie headers");
  assert.ok(cleared.some((value) => /^sms_access_token=/.test(value) && /Path=\//i.test(value)));
  assert.ok(cleared.some((value) => /^sms_refresh_token=/.test(value) && /Path=\/api\/v1\/auth/i.test(value)));
  assert.ok(cleared.every((value) => /HttpOnly/i.test(value) && /Max-Age=0/i.test(value)));

  // Supply a test-account token to check authenticated reads without changing data.
  if (process.env.SMOKE_ACCESS_TOKEN) {
    const headers = { cookie: `sms_access_token=${process.env.SMOKE_ACCESS_TOKEN}` };
    const direct = await request(backend, "/api/v1/auth/me", { headers });
    const proxied = await request(frontend, "/api/v1/auth/me", { headers });
    assert.equal(direct.status, 200);
    assert.equal(proxied.status, 200);
    assert.deepEqual(await proxied.json(), await direct.json());
    assert.equal((await request(frontend, "/dashboard", { headers })).status, 200);
    const route = "/api/v1/students?page=2&page_size=1";
    const directStudents = await request(backend, route, { headers });
    const proxiedStudents = await request(frontend, route, { headers });
    assert.equal(directStudents.status, 200, "test account needs student.read");
    assert.equal(proxiedStudents.status, 200);
    assert.deepEqual(await proxiedStudents.json(), await directStudents.json());
    console.log("PASS authenticated session, dashboard and paginated API forwarding");
  } else {
    console.log("SKIP authenticated reads: set SMOKE_ACCESS_TOKEN for a test account with student.read");
  }
  console.log("PASS login page, navigation guard, database health, API proxy, origin checks and cookie forwarding");
}

main().catch((error) => {
  // Assertion values may contain a session or personal data: print only the message.
  console.error(error.message.split("\n")[0]);
  process.exitCode = 1;
});
