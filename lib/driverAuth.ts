import { createHash } from "crypto";
import { getDbPool } from "@/lib/db";

export async function getDriverBySessionToken(rawToken:string|undefined){
  if(!rawToken) return null;
  const tokenHash=createHash("sha256").update(rawToken).digest("hex");
  const pool=getDbPool();
  const result=await pool.query(
    `select d.id,d.first_name,d.last_name,d.phone,d.status
     from driver_sessions s
     join drivers d on d.id=s.driver_id
     where s.token_hash=$1
       and s.revoked_at is null
       and s.expires_at>now()
       and d.status='approved'
     limit 1`,
    [tokenHash]
  ).catch(()=>({rows:[]}));
  return result.rows[0] ?? null;
}
