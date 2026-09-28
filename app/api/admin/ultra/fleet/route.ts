import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";

const schema=z.object({
  make:z.string().min(2).max(80),
  model:z.string().min(1).max(100),
  year:z.number().int().min(2022).max(2030),
  color:z.string().min(2).max(50),
  plate:z.string().min(2).max(30),
  capacity:z.number().int().min(1).max(14)
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
        active boolean not null default true,
        created_at timestamptz not null default now()
      )
    `);
    const result=await pool.query(
      `insert into ultra_fleet_vehicles(make,model,year,color,plate,capacity)
       values($1,$2,$3,$4,$5,$6)
       returning id,make,model,year,color,plate,capacity`,
      [d.make,d.model,d.year,d.color,d.plate,d.capacity]
    );
    return NextResponse.json({ok:true,vehicle:result.rows[0]});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to add Ultra Exclusive vehicle"},{status:400});
  }
}
