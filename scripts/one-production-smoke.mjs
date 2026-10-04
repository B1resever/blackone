const rawBase = process.env.ONE_PRODUCTION_URL?.trim();
if (!rawBase) {
  console.error('BLOCKED: ONE_PRODUCTION_URL is not configured.');
  process.exit(1);
}

const base = rawBase.replace(/\/$/, '');
const timeoutMs = Number(process.env.ONE_SMOKE_TIMEOUT_MS ?? 12000);

async function getJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(base + path, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      redirect: 'follow',
    });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch {}
    return { response, body, text };
  } finally {
    clearTimeout(timer);
  }
}

const failures = [];
const checks = [];

async function check(name, path, validate) {
  try {
    const result = await getJson(path);
    const ok = validate(result);
    checks.push({ name, path, status: result.response.status, ok });
    if (!ok) failures.push(name + ' failed at ' + path + ' (HTTP ' + result.response.status + ')');
  } catch (error) {
    checks.push({ name, path, status: 'ERROR', ok: false });
    failures.push(name + ' failed: ' + (error instanceof Error ? error.message : String(error)));
  }
}

await check('Health', '/one/api/health', ({ response, body }) =>
  response.ok && body?.service === 'ONE API'
);

await check('Readiness', '/one/api/readiness', ({ response, body }) =>
  response.ok && body?.service === 'ONE API' && body?.ready === true
);

await check('Markets', '/one/api/markets', ({ response, body }) =>
  response.ok && Array.isArray(body?.markets) && body.markets.length >= 2
);

console.log('ONE production smoke test');
console.log('=========================');
for (const item of checks) {
  console.log((item.ok ? 'PASS' : 'FAIL') + ' ' + item.name + ' · ' + item.path + ' · ' + item.status);
}

if (failures.length) {
  console.error('\nBLOCKED:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('\nREADY: production API passed smoke checks.');
