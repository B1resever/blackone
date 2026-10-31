import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickupDetails, reservationWithPickupDetails } from '../src/pickup-details.js';
const details = {airportPickup:true,flightNumber:' aa1234 ',pickupMeeting:'curbside',pickupInstructions:' Terminal 2 '};
test('airport coordination details survive storage without exposing internal reservation notes', () => {
  const normalized = pickupDetails(details);
  assert.equal(normalized?.flightNumber,'AA1234');
  const row = reservationWithPickupDetails({request_code:'ONE-FIXTURE',notes:JSON.stringify({pickupDetails:normalized,customerNotes:'private notes',internal:'not for driver'})});
  assert.deepEqual(row.pickup_details,normalized);
  assert.equal('notes' in row,false);
  assert.equal('internal' in row,false);
});
test('legacy reservations and non-airport trips remain readable without airport data', () => {
  for (const notes of [null,'legacy free text','{}','[]']) assert.equal(reservationWithPickupDetails({notes}).pickup_details,null);
  assert.equal(pickupDetails({...details,airportPickup:false}),null);
});
test('invalid modes, oversized instructions and malformed flight identifiers are refused', () => {
  for(const patch of [{pickupMeeting:'automatic-tracking'},{flightNumber:'<script>'},{pickupInstructions:'x'.repeat(501)}]) assert.equal(pickupDetails({...details,...patch}),null);
});

test('meet-and-greet preview does not calculate a payable fare before Operations confirmation', async () => {
  const { default: handler } = await import('../api/quotes.js');
  let code = 0;
  let result: any;
  const req = { method:'POST', headers:{}, body:{marketId:'south-florida',rideType:'hourly',pickup:'Miami Airport',pickupDate:'2099-12-01',pickupTime:'14:00',hourlyHours:2,passengers:2,vehicleClass:'suv-black',...details,pickupMeeting:'meet-and-greet'} };
  const res = {setHeader(){}, status(next:number){code=next;return this;}, json(data:unknown){result=data;return this;}};
  await handler(req as any,res as any);
  assert.equal(code,200);
  assert.equal(result.status,'manual_confirmation');
  assert.equal(result.amountMinor,null);
});
