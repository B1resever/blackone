import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";

const schema=z.object({
  requestId:z.string().uuid(),
  base:z.number().min(0).max(100000),
  mileage:z.number().min(0).max(100000),
  tolls:z.number().min(0).max(100000),
  parking:z.number().min(0).max(100000),
  waiting:z.number().min(0).max(100000),
  gratuity:z.number().min(0).max(100000),
  extras:z.number().min(0).max(100000),
  note:z.string().max(800).optional().default("")
});

export async function POST(request:Request){
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success) return NextResponse.json({error:"Invalid quote"},{status:400});
    const d=parsed.data;
    const pool=getDbPool();

    const alters=[
      "alter table ultra_reservation_requests add column if not exists quote_base numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_mileage numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_tolls numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_parking numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_waiting numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_gratuity numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_extras numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_total numeric(10,2)",
      "alter table ultra_reservation_requests add column if not exists quote_note text",
      "alter table ultra_reservation_requests add column if not exists quoted_at timestamptz"
    ];
    for(const sql of alters) await pool.query(sql);

    const total=d.base+d.mileage+d.tolls+d.parking+d.waiting+d.gratuity+d.extras;
    const updated=await pool.query(
      "update ultra_reservation_requests set quote_base=$2,quote_mileage=$3,quote_tolls=$4,quote_parking=$5,quote_waiting=$6,quote_gratuity=$7,quote_extras=$8,quote_total=$9,quote_note=$10,quoted_at=now(),status='quoted' where id=$1 returning public_code",
      [d.requestId,d.base,d.mileage,d.tolls,d.parking,d.waiting,d.gratuity,d.extras,total,d.note]
    );

    if(!updated.rowCount) return NextResponse.json({error:"Ultra Exclusive request not found"},{status:404});
    return NextResponse.json({ok:true,publicCode:updated.rows[0].public_code,total});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to save quote"},{status:400});
  }
}
