import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const airports = readFileSync(new URL('../src/aviation-airports.ts', import.meta.url), 'utf8');
const regions = readFileSync(new URL('../src/aviation-regions.ts', import.meta.url), 'utf8');
const radar = readFileSync(new URL('../app/aviation-radar.tsx', import.meta.url), 'utf8');

test('seven featured airports are unique and cover selected regions', () => {
  const icaos = [...airports.matchAll(/icao: '([A-Z0-9]{4})'/g)].map(m => m[1]);
  assert.equal(icaos.length, 7);
  assert.equal(new Set(icaos).size, 7);
  for (const code of ['KOPF','KFXE','KPBI','MYNN','MMSD','MDPC','TJSJ']) assert.ok(icaos.includes(code));
});
test('region navigation covers Florida, Bahamas, Cabo and Caribbean', () => {
  for (const region of ['florida','bahamas','mexico','caribbean']) assert.ok(regions.includes(`id: '${region}'`));
});
test('radar never shows aircraft markers without a ready verified feed', () => {
  assert.ok(radar.includes("radar.status === 'ready' && radar.feed.flights.map"));
  assert.ok(radar.includes("radar.status === 'stale'"));
});
