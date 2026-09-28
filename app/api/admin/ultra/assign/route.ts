import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";

const schema=z.object({
  requestId:z.string().uuid(),
  driverId:z.string().uuid(),
  vehicleId:z.string().uuid()
});

export async function POST(request:Request){
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success) return NextResponse.json({error:"Invalid assignment"},{status:400});
    const d=parsed.data;
    const pool=getDbPool();
    const client=await pool.connect();
    try{
      await client.query("begin");
      await client.query(`
        create table if not exists ultra_assignments(
          id uuid primary key default gen_random_uuid(),
          request_id uuid not null unique references ultra_reservation_requests(id) on delete cascade,
          driver_id uuid not null references drivers(id) on delete restrict,
          ultra_vehicle_id uuid not null references ultra_fleet_vehicles(id) on delete restrict,
          assigned_at timestamptz not null default now(),
          accepted_at timestamptz,
          status text not null default 'assigned' check(status in ('assigned','accepted_verified','en_route','arrived','passenger_onboard','completed','cancelled'))
        )
      `);

      const reservation=await client.query("select status from ultra_reservation_requests where id=$1 for update",[d.requestId]);
      if(!reservation.rowCount) throw new Error("Ultra Exclusive reservation not found");
      if(reservation.rows[0].status!=="confirmed") throw new Error("Only confirmed reservations can be assigned");

      const driver=await client.query("select id from drivers where id=$1 and status='approved'",[d.driverId]);
      if(!driver.rowCount) throw new Error("Chauffeur is not approved");

      const vehicle=await client.query("select id from ultra_fleet_vehicles where id=$1 and active=true",[d.vehicleId]);
      if(!vehicle.rowCount) throw new Error("Ultra Exclusive vehicle is not active");

      await client.query(
        `insert into ultra_assignments(request_id,driver_id,ultra_vehicle_id)
         values($1,$2,$3)
         on conflict(request_id) do update set driver_id=excluded.driver_id, ultra_vehicle_id=excluded.ultra_vehicle_id, assigned_at=now(), status='assigned'`,
        [d.requestId,d.driverId,d.vehicleId]
      );
      await client.query("commit");
      return NextResponse.json({ok:true,status:"assigned"});
    }catch(error){
      await client.query("rollback");
      throw error;
    }finally{
      client.release();
    }
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to assign reservation"},{status:400});
  }
}
