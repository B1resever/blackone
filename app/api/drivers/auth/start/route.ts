import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

function normalizePhone(value:string){
  const digits=value.replace(/\D/g,"");
  if(digits.length===10) return "+1"+digits;
  if(digits.length===11 && digits.startsWith("1")) return "+"+digits;
  if(value.startsWith("+") && digits.length>=10 && digits.length<=15) return "+"+digits;
  throw new Error("Enter a valid mobile number");
}

export async function POST(request:NextRequest){
  try{
    const { phone } = await request.json();
    const normalized=normalizePhone(String(phone ?? ""));
    const digits=normalized.replace(/\D/g,"");

    const pool=getDbPool();
    const driver=await pool.query(
      `select id from drivers
       where status='approved'
         and regexp_replace(coalesce(phone,''), '\\D', '', 'g')=$1
       limit 1`,
      [digits]
    );

    if(!driver.rowCount){
      return NextResponse.json({error:"Driver account not found or not approved. Complete B1 provider registration first."},{status:404});
    }

    const sid=process.env.TWILIO_ACCOUNT_SID;
    const token=process.env.TWILIO_AUTH_TOKEN;
    const service=process.env.TWILIO_VERIFY_SERVICE_SID;
    if(!sid || !token || !service){
      return NextResponse.json({error:"B1 phone verification is being configured."},{status:503});
    }

    const body=new URLSearchParams({To:normalized,Channel:"sms"});
    const response=await fetch(`https://verify.twilio.com/v2/Services/${service}/Verifications`,{
      method:"POST",
      headers:{
        Authorization:"Basic "+Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type":"application/x-www-form-urlencoded"
      },
      body,
      cache:"no-store"
    });

    if(!response.ok){
      console.error("[driver auth start] verification provider error");
      return NextResponse.json({error:"Unable to send verification code right now."},{status:502});
    }

    return NextResponse.json({ok:true,phone:normalized});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to start verification"},{status:400});
  }
}
