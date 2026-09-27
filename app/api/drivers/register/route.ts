import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif","application/pdf"]);

function textValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function required(form: FormData, key: string) {
  const value = textValue(form,key);
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

async function fileValue(form: FormData, key: string) {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) throw new Error(`Missing ${key}`);
  if (value.size > MAX_FILE_BYTES) throw new Error(`${key} exceeds 5 MB`);
  if (!allowedTypes.has(value.type)) throw new Error(`${key} file type is not supported`);
  const bytes = Buffer.from(await value.arrayBuffer());
  return { name:value.name, type:value.type, size:value.size, bytes };
}

async function ensureSchema() {
  const pool = getDbPool();
  await pool.query(`
    create table if not exists driver_applications (
      id uuid primary key default gen_random_uuid(),
      first_name text not null,
      last_name text not null,
      phone text not null,
      email text not null,
      address text not null,
      city text not null,
      state text not null,
      zip text not null,
      license_number text not null,
      license_state text not null,
      license_expires date not null,
      vehicle_make text not null,
      vehicle_model text not null,
      vehicle_year integer not null,
      vehicle_color text not null,
      vehicle_vin text not null,
      vehicle_plate text not null,
      vehicle_type text not null,
      vehicle_capacity integer not null,
      registration_state text not null,
      registration_expires date not null,
      insurance_company text not null,
      insurance_policy text not null,
      insurance_expires date not null,
      status text not null default 'pending' check (status in ('pending','approved','rejected','needs_update')),
      submitted_at timestamptz not null default now(),
      reviewed_at timestamptz
    )
  `);
  await pool.query(`
    create table if not exists driver_application_documents (
      id uuid primary key default gen_random_uuid(),
      application_id uuid not null references driver_applications(id) on delete cascade,
      document_type text not null check (document_type in ('provider_photo','license_front','license_back','vehicle_registration','insurance')),
      file_name text not null,
      content_type text not null,
      file_size integer not null,
      file_bytes bytea not null,
      created_at timestamptz not null default now(),
      unique(application_id, document_type)
    )
  `);
  const alters = [
    "alter table driver_applications add column if not exists address text",
    "alter table driver_applications add column if not exists city text",
    "alter table driver_applications add column if not exists state text",
    "alter table driver_applications add column if not exists zip text",
    "alter table driver_applications add column if not exists vehicle_vin text",
    "alter table driver_applications add column if not exists vehicle_type text",
    "alter table driver_applications add column if not exists registration_state text",
    "alter table driver_applications add column if not exists insurance_company text",
    "alter table driver_applications add column if not exists insurance_policy text"
  ];
  for (const sql of alters) await pool.query(sql);
  await pool.query("create index if not exists driver_applications_status_idx on driver_applications(status, submitted_at desc)");
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const firstName = required(form,"firstName");
    const lastName = required(form,"lastName");
    const phone = required(form,"phone");
    const email = required(form,"email").toLowerCase();
    const address = required(form,"address");
    const city = required(form,"city");
    const state = required(form,"state");
    const zip = required(form,"zip");
    const licenseNumber = required(form,"licenseNumber");
    const licenseState = required(form,"licenseState");
    const licenseExpires = required(form,"licenseExpires");
    const make = required(form,"make");
    const model = required(form,"model");
    const year = Number(required(form,"year"));
    const color = required(form,"color");
    const vin = required(form,"vin");
    const plate = required(form,"plate");
    const vehicleType = required(form,"vehicleType");
    const capacity = Number(required(form,"capacity"));
    const registrationState = required(form,"registrationState");
    const registrationExpires = required(form,"registrationExpires");
    const insuranceCompany = required(form,"insuranceCompany");
    const insurancePolicy = required(form,"insurancePolicy");
    const insuranceExpires = required(form,"insuranceExpires");

    if (!email.includes("@")) throw new Error("Enter a valid email");
    if (!Number.isInteger(year) || year < 2000 || year > 2030) throw new Error("Invalid vehicle year");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) throw new Error("Invalid capacity");
    if (vin.length < 11 || vin.length > 17) throw new Error("Invalid VIN");

    const [photo,licenseFront,licenseBack,registration,insurance] = await Promise.all([
      fileValue(form,"providerPhoto"),
      fileValue(form,"licenseFront"),
      fileValue(form,"licenseBack"),
      fileValue(form,"registrationFile"),
      fileValue(form,"insuranceFile")
    ]);

    await ensureSchema();
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query("begin");
      const existing = await client.query(
        "select id from driver_applications where lower(email)=lower($1) and status in ('pending','approved') limit 1",
        [email]
      );
      if (existing.rowCount) throw new Error("An active application already exists for this email");

      const application = await client.query(
        `insert into driver_applications
          (first_name,last_name,phone,email,address,city,state,zip,license_number,license_state,license_expires,
           vehicle_make,vehicle_model,vehicle_year,vehicle_color,vehicle_vin,vehicle_plate,vehicle_type,vehicle_capacity,
           registration_state,registration_expires,insurance_company,insurance_policy,insurance_expires)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
         returning id`,
        [firstName,lastName,phone,email,address,city,state,zip,licenseNumber,licenseState,licenseExpires,make,model,year,color,vin,plate,vehicleType,capacity,registrationState,registrationExpires,insuranceCompany,insurancePolicy,insuranceExpires]
      );
      const id = application.rows[0].id;

      for (const [type,file] of [
        ["provider_photo",photo],
        ["license_front",licenseFront],
        ["license_back",licenseBack],
        ["vehicle_registration",registration],
        ["insurance",insurance]
      ] as const) {
        await client.query(
          `insert into driver_application_documents
            (application_id,document_type,file_name,content_type,file_size,file_bytes)
           values ($1,$2,$3,$4,$5,$6)`,
          [id,type,file.name,file.type,file.size,file.bytes]
        );
      }

      await client.query("commit");
      return NextResponse.json({ ok:true, applicationId:id, status:"pending" });
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit application";
    return NextResponse.json({ error:message }, { status:400 });
  }
}
