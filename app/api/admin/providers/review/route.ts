import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

type ReviewAction = "approve" | "needs_update" | "reject";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const applicationId = String(body.applicationId ?? "");
    const action = String(body.action ?? "") as ReviewAction;
    const note = String(body.note ?? "").trim();

    if (!applicationId) {
      return NextResponse.json({ error: "Application is required" }, { status: 400 });
    }
    if (!["approve","needs_update","reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid review action" }, { status: 400 });
    }
    if ((action === "needs_update" || action === "reject") && !note) {
      return NextResponse.json({ error: "A review note is required" }, { status: 400 });
    }

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query("begin");

      await client.query(`
        alter table driver_applications
        add column if not exists review_note text
      `);

      const app = await client.query(
        `select *
         from driver_applications
         where id=$1
         for update`,
        [applicationId]
      );

      if (!app.rowCount) throw new Error("Provider application not found");
      const row = app.rows[0];

      if (action === "approve") {
        const driver = await client.query(
          `insert into drivers (email,first_name,last_name,phone,status,online)
           values ($1,$2,$3,$4,'approved',false)
           on conflict (email) do update
             set first_name=excluded.first_name,
                 last_name=excluded.last_name,
                 phone=excluded.phone,
                 status='approved'
           returning id`,
          [row.email,row.first_name,row.last_name,row.phone]
        );

        await client.query(
          `insert into vehicles (driver_id,make,model,year,color,plate,capacity,class,active)
           values ($1,$2,$3,$4,$5,$6,$7,'private_transportation',true)`,
          [driver.rows[0].id,row.vehicle_make,row.vehicle_model,row.vehicle_year,row.vehicle_color,row.vehicle_plate,row.vehicle_capacity]
        );

        await client.query(
          `update driver_applications
           set status='approved', review_note=$2, reviewed_at=now()
           where id=$1`,
          [applicationId,note || "Approved by B1"]
        );
      } else {
        await client.query(
          `update driver_applications
           set status=$2, review_note=$3, reviewed_at=now()
           where id=$1`,
          [applicationId, action, note]
        );
      }

      await client.query("commit");
      return NextResponse.json({ ok:true, status:action === "approve" ? "approved" : action });
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to review provider";
    return NextResponse.json({ error:message }, { status:400 });
  }
}
