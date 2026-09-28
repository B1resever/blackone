import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const schema=z.object({code:z.string().min(4).max(40)});

export async function POST(request:Request){
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success) return NextResponse.json({error:"Invalid quote code"},{status:400});
    const pool=getDbPool();
    const result=await pool.query(
      `select id,public_code,customer_name,email,pickup,destination,service_type,vehicle_class,quote_total,status
       from ultra_reservation_requests where public_code=$1 limit 1`,
      [parsed.data.code]
    );
    if(!result.rowCount) return NextResponse.json({error:"Quote not found"},{status:404});
    const q=result.rows[0];
    if(q.status!=="quoted") return NextResponse.json({error:"This quote is not available for payment"},{status:400});
    const total=Number(q.quote_total);
    if(!Number.isFinite(total)||total<=0) return NextResponse.json({error:"Quote total is invalid"},{status:400});

    const appUrl=process.env.NEXT_PUBLIC_APP_URL;
    if(!appUrl) return NextResponse.json({error:"NEXT_PUBLIC_APP_URL is not configured"},{status:503});

    const stripe=getStripe();
    const session=await stripe.checkout.sessions.create({
      mode:"payment",
      customer_email:q.email,
      payment_method_types:["card"],
      line_items:[{
        quantity:1,
        price_data:{
          currency:"usd",
          unit_amount:Math.round(total*100),
          product_data:{
            name:"B1 Ultra Exclusive "+q.vehicle_class.replaceAll("_"," ").toUpperCase(),
            description:q.pickup+" -> "+q.destination
          }
        }
      }],
      metadata:{
        product:"ultra_exclusive",
        ultraRequestId:String(q.id),
        publicCode:q.public_code,
        serviceType:q.service_type,
        vehicleClass:q.vehicle_class,
        quotedTotal:String(total)
      },
      success_url:appUrl+"/reservations/ultra-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:appUrl+"/reservations/quote/"+encodeURIComponent(q.public_code)
    });

    try{
      await pool.query("alter table ultra_reservation_requests add column if not exists stripe_checkout_session_id text");
    }catch{}
    await pool.query("update ultra_reservation_requests set stripe_checkout_session_id=$2 where id=$1",[q.id,session.id]);

    return NextResponse.json({url:session.url});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to create payment"},{status:400});
  }
}
