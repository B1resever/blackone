import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canRequestVehicle } from '../src/vehicle-capacity.js';
import { canCarryPassengers } from '../../../apps/one-mobile/src/vehicle-capacity.js';
import { quoteRequestSchema, reservationRequestSchema } from '../src/validation.js';
const trip = { marketId:'south-florida',rideType:'one-way',pickup:'Miami Airport',dropoff:'Brickell Miami',pickupDate:'2099-12-01',pickupTime:'14:00',fullName:'Fixture Passenger',email:'fixture@example.invalid',phone:'+13055550100' };
test('native selection and API agree on XL and Black SUV passenger limits', () => {
  for (const [category, capacity] of [['xl',7],['suv-black',6]] as const) {
    for (const passengers of [0,1,capacity,capacity+1,1.5,NaN]) {
      const allowed = Number.isInteger(passengers) && passengers>=1 && passengers<=capacity;
      assert.equal(canRequestVehicle(category,passengers),allowed);
      assert.equal(canCarryPassengers(category,passengers),allowed);
      for (const schema of [quoteRequestSchema,reservationRequestSchema]) assert.equal(schema.safeParse({...trip,vehicleClass:category,passengers}).success,allowed);
    }
  }
});
test('missing or unknown categories cannot bypass native or API selection', () => {
  assert.equal(canCarryPassengers(null,2),false);
  for(const category of ['', 'unknown', 'confort', 'ultra-exclusive']) { assert.equal(canCarryPassengers(category,2),false); assert.equal(canRequestVehicle(category,2),false); }
});

test('retired categories cannot be used for new quote requests', async () => {
  const { default: handler } = await import('../api/quotes.js');
  let payload: any;
  let status = 0;
  const res = {setHeader(){}, status(code:number){status=code;return this;},json(body:unknown){payload=body;return this;}};
  await handler({method:'POST',headers:{},body:{...trip,vehicleClass:'ultra-exclusive',passengers:7}} as any,res as any);
  assert.equal(status,400);
  assert.equal(payload.error,'invalid_request');
});
