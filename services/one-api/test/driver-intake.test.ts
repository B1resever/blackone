import assert from 'node:assert/strict';
import { test } from 'node:test';
import { driverApplicationSchema, driverIntakeDetails } from '../src/driver-intake.js';
import { documentUploadSchema, MAX_DOCUMENT_BYTES } from '../src/document-upload.js';
import fileHandler from '../api/driver-document-file.js';

const application = { marketId: 'south-florida', fullName: 'Fixture Driver', email: 'driver@example.invalid', phone: '+13055550100', licenseRegion: 'Florida', vehicleYear: '2025', vehicleMake: 'Cadillac', vehicleModel: 'Escalade', vehicleClassId: 'suv-black', vehicleColor: 'Black', passengerCapacity: 6, payoutMethod: 'bank_transfer', whatsappConsent: true };
test('driver intake stores payout preference as pending and does not retain banking secrets', () => {
  const parsed = driverApplicationSchema.parse({ ...application, bankAccount: 'must-not-be-saved', password: 'must-not-be-saved' });
  const details = driverIntakeDetails(parsed);
  assert.equal(details.payoutSetupStatus, 'pending');
  assert.equal(details.payoutMethod, 'bank_transfer');
  assert.equal(details.whatsappConsent, true);
  assert.ok(details.whatsappConsentRecordedAt);
  assert.equal('bankAccount' in parsed, false);
  assert.equal('password' in parsed, false);
});
test('driver intake refuses excess capacity and a USA-only payment preference in Argentina', () => {
  assert.equal(driverApplicationSchema.safeParse({ ...application, passengerCapacity: 7 }).success, false);
  assert.equal(driverApplicationSchema.safeParse({ ...application, vehicleClassId: 'xl', passengerCapacity: 7 }).success, true);
  assert.equal(driverApplicationSchema.safeParse({ ...application, marketId: 'buenos-aires', payoutMethod: 'zelle' }).success, false);
  const legacy = driverIntakeDetails(driverApplicationSchema.parse({ ...application, whatsappConsent: undefined, payoutMethod: undefined }));
  assert.equal(legacy.whatsappConsent, false);
  assert.equal(legacy.whatsappConsentRecordedAt, null);
});
test('document upload rejects executable types, malformed encodings, spoofed formats and oversized images', () => {
  const png = Buffer.from([137,80,78,71,13,10,26,10]).toString('base64');
  assert.equal(documentUploadSchema.safeParse({ mimeType: 'image/png', base64: png }).success, true);
  for (const value of [
    { mimeType: 'image/svg+xml', base64: Buffer.from('<svg onload="alert(1)"/>').toString('base64') },
    { mimeType: 'image/jpeg', base64: png },
    { mimeType: 'image/png', base64: '!!!' },
    { mimeType: 'image/png', base64: Buffer.alloc(MAX_DOCUMENT_BYTES + 1).toString('base64') },
  ]) assert.equal(documentUploadSchema.safeParse(value).success, false);
});
test('private file endpoint rejects anonymous reads before looking up a document', async () => {
  let status = 0; let body: any; const headers: Record<string,string> = {};
  const res = {setHeader(k:string,v:string){headers[k]=v;},status(code:number){status=code;return this;},json(value:unknown){body=value;return this;}};
  await fileHandler({ method:'GET',headers:{},query:{id:'00000000-0000-4000-8000-000000000001'} } as any,res as any);
  assert.equal(status,401);
  assert.equal(body.error,'unauthorized');
  assert.equal(headers['Cache-Control'],'private, no-store');
});
