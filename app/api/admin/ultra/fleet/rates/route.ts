import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";

const schema=z.object({
  vehicleId:z.string().uuid(),
  luggageCapacity:z.number().int().min(0).max(30),
  hourlyRate:z.number().min(0).max(100000),
  minimumHours:z.number().int().min(0).max(24),
  dayRate:z.number().min(0).max(100000),
  includedMiles:z.number().int().min(0).max(5000),
  extraMileRate:z.number().min(0).max(1000),
  waitingHourlyRate:z.number().min(0).max(10000),
  airportBaseRate:z.number().min(0).max(100000),
  meetGreetRate:z.number().min(0).max(10000),
  gratuityPercent:z.number().min(0).max(100),
  cancellationHours:z.number().int().min(0).max(720)
});

export async function POST(request:Request){
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success) return NextResponse.json({error:"Invalid rate card"},{status:400});
    const d=parsed.data;
    const pool=getDbPool();

    const alters=[
      "alter table ultra_fleet_vehicles add column if not exists luggage_capacity integer not null default 0",
      "alter table ultra_fleet_vehicles add column if not exists hourly_rate numeric(10,2)",
      "alter table ultra_fleet_vehicles add column if not exists minimum_hours integer",
      "alter table ultra_fleet_vehicles add column if not exists day_rate numeric(10,2)",
      "alter table ultra_fleet_vehicles add column if not exists included_miles integer",
      "alter table ultra_fleet_vehicles add column if not exists extra_mile_rate numeric(10,2)",
      "alter table ultra_fleet_vehicles add column if not exists waiting_hourly_rate numeric(10,2)",
      "alter table ultra_fleet_vehicles add column if not exists airport_base_rate numeric(10,2)",
      "alter table ultra_fleet_vehicles add column if not exists meet_greet_rate numeric(10,2)",
      "alter table ultra_fleet_vehicles add column if not exists gratuity_percent numeric(5,2)",
      "alter table ultra_fleet_vehicles add column if not exists cancellation_hours integer"
    ];
    for(const sql of alters) await pool.query(sql);

    const result=await pool.query(
      `update ultra_fleet_vehicles
       set luggage_capacity=$2,hourly_rate=$3,minimum_hours=$4,day_rate=$5,
           included_miles=$6,extra_mile_rate=$7,waiting_hourly_rate=$8,
           airport_base_rate=$9,meet_greet_rate=$10,gratuity_percent=$11,
           cancellation_hours=$12
       where id=$1
       returning id,make,model,year,color,plate,capacity,luggage_capacity,
                 hourly_rate,minimum_hours,day_rate,included_miles,extra_mile_rate,
                 waiting_hourly_rate,airport_base_rate,meet_greet_rate,
                 gratuity_percent,cancellation_hours`,
      [d.vehicleId,d.luggageCapacity,d.hourlyRate,d.minimumHours,d.dayRate,d.includedMiles,
       d.extraMileRate,d.waitingHourlyRate,d.airportBaseRate,d.meetGreetRate,d.gratuityPercent,d.cancellationHours]
    );

    if(!result.rowCount) return NextResponse.json({error:"Ultra Exclusive vehicle not found"},{status:404});
    return NextResponse.json({ok:true,vehicle:result.rows[0]});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to save rate card"},{status:400});
  }
}
