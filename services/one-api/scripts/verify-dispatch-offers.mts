// Uses fictitious data only on the explicitly pinned isolated validation branch.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createSession } from '../src/auth.js';
import createOffer from '../api/admin-dispatch-offer.js';
import driverOffer from '../api/driver-dispatch-offer.js';
import driverJobs from '../api/driver-jobs.js';
import manualAssign from '../api/admin-reservation-update.js';
assert.equal(process.env.ONE_TEST_BRANCH_ID,'br-crimson-hill-avv1kiko');
assert.ok(process.env.ONE_TEST_DATABASE_URL);
assert.equal(new URL(process.env.ONE_TEST_DATABASE_URL!).hostname, 'ep-orange-cell-av3w3jlz-pooler.c-11.us-east-1.aws.neon.tech', 'Production and unrelated database hosts are forbidden');
process.env.DATABASE_URL=process.env.ONE_TEST_DATABASE_URL;
process.env.ONE_ADMIN_API_TOKEN=randomBytes(32).toString('hex');
const sql=neon(process.env.DATABASE_URL!);
const suffix=randomBytes(6).toString('hex');
async function call(handler:any,body:any,token:string|undefined,method='POST'){let status=0;let data:any;const res={setHeader(){},status(code:number){status=code;return this;},json(value:any){data=value;return this;}};await handler({method,headers:token?{authorization:'Bearer '+token}:{},body,query:{}},res);return{status,data};}
async function fixtureDriver(index:number){
 const users=await sql`insert into one_users(role,full_name,email,status) values('driver','Dispatch Isolated Fixture',${'dispatch-'+suffix+'-'+index+'@example.invalid'},'active') returning id`;
 const id=String(users[0].id);
 await sql`insert into one_driver_profiles(user_id,onboarding_status,verification_status,home_market_id,compliance_status,available_for_assignment,intake_details) values(${id},'approved','approved','south-florida','approved',true,'{"whatsappConsent":true}'::jsonb)`;
 await sql`insert into one_driver_vehicles(driver_user_id,vehicle_class_id,make,model,vehicle_year,color,passenger_capacity,status) values(${id},'suv-black','Cadillac','Escalade',2025,'Black',5,'approved')`;
 for(const type of ['driver_license','insurance','vehicle_registration','background_check','other']) await sql`insert into one_driver_documents(driver_user_id,document_type,document_number,file_url,expires_on,status) values(${id},${type},${type==='other'?'vehicle_photo':'FIXTURE'},'https://example.invalid/isolated-evidence',case when ${type}='other' then null else current_date+365 end,'approved')`;
 const session=await createSession(id);return{id,token:session.token};
}
const drivers=await Promise.all([fixtureDriver(1),fixtureDriver(2)]);
let sequence=0;
async function reservation(passengers=4,payment='paid'){
 const code='ONE-DISPATCH-'+suffix+'-'+(++sequence);
 await sql`insert into one_reservations(request_code,market_id,ride_type,pickup_text,dropoff_text,pickup_date_text,pickup_time_text,passenger_count,vehicle_class_id,guest_full_name,guest_phone,status,payment_status,quote_amount_minor,quote_currency) values(${code},'south-florida','one-way','PRIVATE PICKUP ADDRESS','PRIVATE DROPOFF ADDRESS','2099-12-01','14:00',${passengers},'suv-black','PRIVATE PASSENGER','PRIVATE PHONE','confirmed',${payment},10000,'USD')`;
 return code;
}
async function offer(code:string){const result=await call(createOffer,{requestCode:code,driverAmountMinor:7500,summary:'MIA area → Brickell area'},process.env.ONE_ADMIN_API_TOKEN);assert.equal(result.status,200);return new URL(result.data.offerUrl).hash.split('token=')[1];}
const code=await reservation();const token=await offer(code);
const preview=await call(driverOffer,{token,action:'preview'},drivers[0].token);
assert.equal(preview.status,200);assert.equal(Number(preview.data.offer.amount_minor),7500);
assert.equal(JSON.stringify(preview.data).includes('PRIVATE'),false);
const accepted=await Promise.all(drivers.map(d=>call(driverOffer,{token,action:'accept'},d.token)));
assert.deepEqual(accepted.map(r=>r.status).sort(),[200,409]);
const winner=accepted[0].status===200?0:1;
const assigned=await sql`select assigned_driver_user_id from one_reservations where request_code=${code}`;
assert.equal(assigned[0].assigned_driver_user_id,drivers[winner].id);
assert.equal((await call(driverOffer,{token,action:'accept'},drivers[winner].token)).status,200);
const winnerJobs=await call(driverJobs,{},drivers[winner].token,'GET');const winnerTrip=winnerJobs.data.trips.find((trip:any)=>trip.request_code===code);assert.equal(winnerTrip.guest_full_name,'PRIVATE PASSENGER');assert.equal(Number(winnerTrip.driver_offer_amount_minor),7500);
const loserJobs=await call(driverJobs,{},drivers[1-winner].token,'GET');assert.equal(loserJobs.data.trips.some((trip:any)=>trip.request_code===code),false);
const events=await sql`select count(*)::integer as total from one_trip_events e join one_reservations r on r.id=e.reservation_id where r.request_code=${code} and event_type='driver_assigned'`;
assert.equal(events[0].total,1);
const crowdedToken=await offer(await reservation(6));assert.equal((await call(driverOffer,{token:crowdedToken,action:'accept'},drivers[0].token)).status,409);
const expCode=await reservation();const expired=await offer(expCode);await sql`update one_reservations set driver_offer_expires_at=now()-interval '1 second' where request_code=${expCode}`;assert.equal((await call(driverOffer,{token:expired,action:'accept'},drivers[0].token)).status,409);
const rotationCode=await reservation();const old=await offer(rotationCode);const rotated=await offer(rotationCode);assert.equal((await call(driverOffer,{token:old,action:'preview'},drivers[0].token)).status,409);
await sql`update one_driver_profiles set intake_details='{"whatsappConsent":false}'::jsonb where user_id=${drivers[0].id}`;assert.equal((await call(driverOffer,{token:rotated,action:'accept'},drivers[0].token)).status,409);await sql`update one_driver_profiles set intake_details='{"whatsappConsent":true}'::jsonb where user_id=${drivers[0].id}`;
await sql`insert into one_driver_documents(driver_user_id,document_type,document_number,file_url,expires_on,status) values(${drivers[0].id},'driver_license','EXPIRED-FIXTURE','https://example.invalid/expired',current_date-1,'approved')`;
assert.equal((await call(driverOffer,{token:rotated,action:'accept'},drivers[0].token)).status,409);
await sql`insert into one_driver_documents(driver_user_id,document_type,document_number,file_url,expires_on,status) values(${drivers[0].id},'driver_license','CURRENT-FIXTURE','https://example.invalid/current',current_date+365,'approved')`;
const unpaid=await reservation(4,'not_started');assert.equal((await call(createOffer,{requestCode:unpaid,driverAmountMinor:7500,summary:'MIA → Brickell'},process.env.ONE_ADMIN_API_TOKEN)).status,409);
const raceCode=await reservation();const raceToken=await offer(raceCode);
const race=await Promise.all([call(manualAssign,{requestCode:raceCode,assignedDriverUserId:drivers[0].id},process.env.ONE_ADMIN_API_TOKEN),call(driverOffer,{token:raceToken,action:'accept'},drivers[1].token)]);
assert.equal(race.filter(r=>r.status===200).length,1);
const raceEvents=await sql`select count(*)::integer as total from one_trip_events e join one_reservations r on r.id=e.reservation_id where r.request_code=${raceCode} and event_type='driver_assigned'`;
assert.equal(raceEvents[0].total,1);
console.log('PASS: simultaneous drivers produce one assignment/event; winner retry is idempotent; preview hides passenger/private addresses; capacity, expiry, rotated links, consent, expired latest evidence and unpaid reservations are blocked; manual assignment racing a WhatsApp claim produces one winner. Isolated fixtures only.');
process.exit(0);
