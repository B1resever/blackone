import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

function normalizePhone(value:string){
  const digits=value.replace(/\D/g,"");
  if(digits.length===10) return "+1"+digits;
  if(digits.length===11 && digits.startsWith("1")) return "+"+digits;
  if(value.startsWith("+") && digits.length>=10 && digits.length<=15) return "+"+digits;
  throw new Error("Invalid phone number");
}

export async function POST(request:NextRequest){
  try{
    const { phone, code } = await request.json();
    const normalized=normalizePhone(String(phone ?? ""));
    const otp=String(code ?? "").trim();
    if(!/^\d{6}$/.test(otp)) throw new Error("Enter the 6-digit verification code");

    const sid=process.env.TWILIO_ACCOUNT_SID;
    const token=process.env.TWILIO_AUTH_TOKEN;
    const service=process.env.TWILIO_VERIFY_SERVICE_SID;
    if(!sid || !token || !service){
      return NextResponse.json({error:"B1 phone verification is being configured."},{status:503});
    }

    const body=new URLSearchParams({To:normalized,Code:otp});
    const response=await fetch(`https://verify.twilio.com/v2/Services/${service}/VerificationCheck`,{
      method:"POST",
      headers:{
        Authorization:"Basic "+Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type":"application/x-www-form-urlencoded"
      },
      body,
      cache:"no-store"
    });

    const result=await response.json();
    if(!response.ok || result.status!=="approved"){
      return NextResponse.json({error:"The verification code is incorrect or expired."},{status:401});
    }

    const digits=normalized.replace(/\D/g,"");
    const pool=getDbPool();
    await pool.query(`
      create table if not exists driver_sessions (
        id uuid primary key default gen_random_uuid(),
        driver_id uuid not null references drivers(id) on delete cascade,
        token_hash text not null unique,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null,
        revoked_at timestamptz
      )
    `);
    await pool.query("create index if not exists driver_sessions_driver_idx on driver_sessions(driver_id,expires_at)");

    const driver=await pool.query(
      `select id from drivers
       where status='approved'
         and regexp_replace(coalesce(phone,''), '\\D', '', 'g')=$1
       limit 1`,
      [digits]
    );
    if(!driver.rowCount){
      return NextResponse.json({error:"Driver account is no longer eligible."},{status:403});
    }

    const rawToken=randomBytes(32).toString("hex");
    const tokenHash=createHash("sha256").update(rawToken).digest("hex");
    await pool.query(
      "insert into driver_sessions (driver_id,token_hash,expires_at) values ($1,$2,now()+interval '30 days')",
      [driver.rows[0].id,tokenHash]
    );

    const res=NextResponse.json({ok:true});
    res.cookies.set("b1_driver_session",rawToken,{
      httpOnly:true,
      secure:true,
      sameSite:"lax",
      path:"/",
      maxAge:60*60*24*30
    });
    return res;
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to verify code"},{status:400});
  }
}
