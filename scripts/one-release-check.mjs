import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];

function readJson(relative) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    failures.push('Missing ' + relative);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch {
    failures.push('Invalid JSON in ' + relative);
    return null;
  }
}

function requireFile(relative) {
  if (!fs.existsSync(path.join(root, relative))) failures.push('Missing ' + relative);
}

function requireValue(condition, message) {
  if (!condition) failures.push(message);
}

const app = readJson('apps/one-mobile/app.json');
const eas = readJson('apps/one-mobile/eas.json');

if (app?.expo) {
  requireValue(app.expo.name === 'ONE', 'Expo app name must be ONE');
  requireValue(app.expo.ios?.bundleIdentifier === 'com.blackone.one', 'iOS bundle ID must be com.blackone.one');
  requireValue(app.expo.android?.package === 'com.blackone.one', 'Android package must be com.blackone.one');
  requireValue(Array.isArray(app.expo.plugins) && app.expo.plugins.some((p) => p === 'expo-notifications'), 'expo-notifications plugin is required');

  if (!app.expo.extra?.eas?.projectId) {
    failures.push('EAS projectId is not configured in app.json. Run EAS project initialization before store builds.');
  }

  if (!app.expo.icon) failures.push('Final app icon is not configured in app.json');
  if (!app.expo.android?.adaptiveIcon) failures.push('Android adaptive icon is not configured in app.json');
  if (!app.expo.splash && !app.expo.plugins?.some((p) => Array.isArray(p) && p[0] === 'expo-splash-screen')) {
    warnings.push('Custom splash branding is not configured');
  }
}

if (eas) {
  requireValue(eas.build?.production?.distribution === 'store', 'EAS production build must use store distribution');
  requireValue(Boolean(eas.build?.production?.autoIncrement), 'EAS production build must auto-increment');
}

[
  'privacy.html',
  'terms.html',
  'delete-account.html',
  'support.html',
  'payment-success.html',
  'payment-cancelled.html',
  'api/one/health.ts',
  'api/one/readiness.ts',
  'api/one/stripe-webhook.ts',
  '.github/workflows/one-store-build.yml',
  '.github/workflows/one-store-submit.yml',
].forEach(requireFile);

for (let i = 1; i <= 7; i += 1) {
  const prefix = String(i).padStart(4, '0') + '_';
  const dir = path.join(root, 'services/one-api/db/migrations');
  const match = fs.existsSync(dir) && fs.readdirSync(dir).some((name) => name.startsWith(prefix));
  if (!match) failures.push('Missing database migration ' + String(i).padStart(4, '0'));
}

console.log('ONE release gate');
console.log('================');

if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((item) => console.log('- ' + item));
}

if (failures.length) {
  console.error('\nBLOCKED:');
  failures.forEach((item) => console.error('- ' + item));
  console.error('\nResolve these items before spending an EAS store build.');
  process.exit(1);
}

console.log('\nREADY: repository-side store release requirements passed.');
