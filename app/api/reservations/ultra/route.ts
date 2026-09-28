import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";

const schema=z.object({
  service:z.enum(["one_way","airport_fbo","hourly","full_day","event_vip","custom"]),
  vehicle:z.enum(["s_class","escalade_esv","luxury_sprinter","signature"]),
  pickup:z.string().min(3).max(300),
  destination:z.string().min(3).max(300),
  date:z.string().min(1),
  time:z.string().min(1),
  reservedHours:z.coerce.number().min(2).max(24).optional(),
  flightNumber:z.string().max(80).optional().default(""),
  eventName:z.string().max(160).optional().default(""),
  passengers:z.coerce.number().min(1).max(14),
  luggage:z.coerce.number().min(0).max(20),
  name:z.string().min(2).max(120),
  phone:z.string().min(7).max(40),
  email:z.string().email(),
  notes:z.string().max(1200).optional().default("")
});

function code(){
  return "B1X-"+Math.random().toString(36).slice(2,8).toUpperCase();
}

export async function POST(request:Request){
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success) return NextResponse.json({error:"Invalid Ultra Exclusive request"},{status:400});
    const d=parsed.data;
    const pool=getDbPool();

    await pool.query(`
      create table if not exists ultra_reservation_requests (
        id uuid primary key default gen_random_uuid(),
        public_code text not null unique,
        service_type text not null,
        vehicle_class text not null,
        pickup text not null,
        destination text not null,
        service_date date not null,
        start_time time not null,
        reserved_hours integer,
        flight_number text,
        event_name text,
        passengers integer not null,
        luggage integer not null,
        customer_name text not null,
        phone text not null,
        email text not null,
        notes text,
        status text not null default 'quote_requested' check(status in ('quote_requested','quoted','confirmed','cancelled')),
        created_at timestamptz not null default now()
      )
    `);

    let publicCode=code();
    for(let i=0;i<3;i++){
      try{
        await pool.query(
          `insert into ultra_reservation_requests
           (public_code,service_type,vehicle_class,pickup,destination,service_date,start_time,reserved_hours,flight_number,event_name,passengers,luggage,customer_name,phone,email,notes)
           values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [publicCode,d.service,d.vehicle,d.pickup,d.destination,d.date,d.time,d.reservedHours??null,d.flightNumber||null,d.eventName||null,d.passengers,d.luggage,d.name,d.phone,d.email,d.notes||null]
        );
        return NextResponse.json({ok:true,publicCode,status:"quote_requested"});
      }catch(error){
        if(i===2) throw error;
        publicCode=code();
      }
    }
    throw new Error("Unable to create request");
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to submit request"},{status:400});
  }
}
