import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";

const schema=z.object({
  make:z.string().min(2).max(80),
  model:z.string().min(1).max(100),
  year:z.number().int().min(2022).max(2030),
  color:z.string().min(2).max(50),
  plate:z.string().min(2).max(30),
  capacity:z.number().int().min(1).max(14),
  luggageCapacity:z.number().int().min(0).max(30)
});

export async function POST(request:Request){
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success) return NextResponse.json({error:"Invalid Ultra Exclusive vehicle"},{status:400});
    const d=parsed.data;
    const pool=getDbPool();
    await pool.query(`
      create table if not exists ultra_fleet_vehicles(
        id uuid primary key default gen_random_uuid(),
        make text not null,
        model text not null,
        year integer not null,
        color text not null,
        plate text not null unique,
        capacity integer not null,
        luggage_capacity integer not null default 0,
        hourly_rate numeric(10,2),
        minimum_hours integer,
        day_rate numeric(10,2),
        included_miles integer,
        extra_mile_rate numeric(10,2),
        waiting_hourly_rate numeric(10,2),
        airport_base_rate numeric(10,2),
        meet_greet_rate numeric(10,2),
        gratuity_percent numeric(5,2),
        cancellation_hours integer,
        active boolean not null default true,
        created_at timestamptz not null default now()
      )
    `);
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
      `insert into ultra_fleet_vehicles(make,model,year,color,plate,capacity,luggage_capacity)
       values($1,$2,$3,$4,$5,$6,$7)
       returning id,make,model,year,color,plate,capacity,luggage_capacity,
                 hourly_rate,minimum_hours,day_rate,included_miles,extra_mile_rate,
                 waiting_hourly_rate,airport_base_rate,meet_greet_rate,gratuity_percent,cancellation_hours`,
      [d.make,d.model,d.year,d.color,d.plate,d.capacity,d.luggageCapacity]
    );
    return NextResponse.json({ok:true,vehicle:result.rows[0]});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to add Ultra Exclusive vehicle"},{status:400});
  }
}
