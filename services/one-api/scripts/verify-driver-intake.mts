// Run only on the isolated one-driver-onboarding-validation Neon branch.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createSession } from '../src/auth.js';
import intake from '../api/driver-applications.js';
import approveApplication from '../api/admin-driver-application-update.js';
import documents from '../api/driver-documents.js';
import approveDocument from '../api/admin-driver-documents.js';
import file from '../api/driver-document-file.js';
import availability from '../api/driver-availability.js';
import { probeDatabase } from '../src/readiness.js';

assert.equal(process.env.ONE_TEST_BRANCH_ID, 'br-crimson-hill-avv1kiko', 'Explicit isolated validation branch is required');
assert.ok(process.env.ONE_TEST_DATABASE_URL, 'Dedicated test database URL required');
assert.equal(new URL(process.env.ONE_TEST_DATABASE_URL!).hostname, 'ep-orange-cell-av3w3jlz-pooler.c-11.us-east-1.aws.neon.tech', 'Production and unrelated database hosts are forbidden');
process.env.DATABASE_URL = process.env.ONE_TEST_DATABASE_URL;
process.env.ONE_ADMIN_API_TOKEN = randomBytes(32).toString('hex');
const sql = neon(process.env.DATABASE_URL!);
const suffix = randomBytes(6).toString('hex');
const email = `fixture-${suffix}@example.invalid`;
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5n0AAAAASUVORK5CYII=';
async function call(handler:any, method:string, body:any = {}, token?:string, query:any = {}) {
  let status = 0; let data:any; const headers:Record<string,string> = {};
  const res = {setHeader(k:string,v:string){headers[k]=v;},status(value:number){status=value;return this;},json(value:any){data=value;return this;},send(value:any){data=value;return this;}};
  await handler({method,body,headers:token?{authorization:'Bearer '+token}:{},query},res);
  return {status,data,headers};
}
const applied = await call(intake,'POST',{marketId:'south-florida',fullName:'B1 Isolated Fixture',email,phone:'+13055550100',licenseRegion:'Florida',vehicleYear:'2025',vehicleMake:'Cadillac',vehicleModel:'Escalade',vehicleClassId:'suv-black',plateNumber:'FIXTURE',vehicleColor:'Black',passengerCapacity:5,payoutMethod:'bank_transfer',whatsappConsent:true});
assert.equal(applied.status,201);
const approved = await call(approveApplication,'POST',{applicationCode:applied.data.applicationCode,status:'approved'},process.env.ONE_ADMIN_API_TOKEN);
assert.equal(approved.status,200);
const driverId = approved.data.driverUserId;
const vehicle = await sql`select passenger_capacity, color from one_driver_vehicles where id = ${approved.data.driverVehicleId}`;
assert.equal(vehicle[0].passenger_capacity,5);
assert.equal(vehicle[0].color,'Black');
const profiles = await sql`select intake_details from one_driver_profiles where user_id=${driverId}`;
assert.equal(profiles[0].intake_details.payoutSetupStatus,'pending');
const session = await createSession(driverId);
let photoId = '';
for (const type of ['driver_license','insurance','vehicle_registration','background_check','other']) {
  const uploaded = await call(documents,'POST',{documentType:type,documentNumber:type==='other'?'vehicle_photo':'FIXTURE',...(type==='other'?{}:{expiresOn:'2099-12-01'}),fileUpload:{mimeType:'image/png',base64:png}},session.token);
  assert.equal(uploaded.status,201);
  if(type==='other') photoId=uploaded.data.document.id;
  const review = await call(approveDocument,'POST',{documentId:uploaded.data.document.id,status:'approved'},process.env.ONE_ADMIN_API_TOKEN);
  assert.equal(review.status,200);
}
const own = await call(file,'GET',{},session.token,{id:photoId});
assert.equal(own.status,200);
assert.deepEqual(own.data,Buffer.from(png,'base64'));
assert.equal(own.headers['Cache-Control'],'private, no-store');
assert.equal((await call(file,'GET',{},undefined,{id:photoId})).status,401);
assert.equal((await call(file,'GET',{},process.env.ONE_ADMIN_API_TOKEN,{id:photoId})).status,200);
const otherUser = await sql`insert into one_users (role,full_name,email,status) values ('driver','Other Isolated Fixture',${'other-'+email},'active') returning id`;
const otherSession = await createSession(String(otherUser[0].id));
assert.equal((await call(file,'GET',{},otherSession.token,{id:photoId})).status,404);
const ready = await call(availability,'GET',{},session.token);
assert.equal(ready.data.availability.compliance_status,'approved');
const replaced = await call(documents,'POST',{documentType:'other',documentNumber:'vehicle_photo',fileUpload:{mimeType:'image/png',base64:png}},session.token);
assert.equal(replaced.status,201);
assert.equal((await call(availability,'POST',{available:true},session.token)).status,409);
assert.equal(await probeDatabase(process.env.DATABASE_URL!),true);
console.log('PASS: intake → application approval → private uploads → document review; own/admin reads succeed, other driver 404, anonymous 401; pending replacement blocks availability; database readiness passes. Test fixtures exist only in the isolated validation branch.');

process.exit(0);
