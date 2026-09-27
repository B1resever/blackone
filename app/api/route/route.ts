import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  origin: z.string().min(3).max(300),
  destination: z.string().min(3).max(300)
});

function moneyToNumber(value: { units?: string; nanos?: number } | undefined) {
  if (!value) return 0;
  return Number(value.units ?? "0") + Number(value.nanos ?? 0) / 1_000_000_000;
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid route request" }, { status: 400 });

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Maps routing is not configured yet" }, { status: 503 });

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo.estimatedPrice"
    },
    body: JSON.stringify({
      origin: { address: parsed.data.origin },
      destination: { address: parsed.data.destination },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      extraComputations: ["TOLLS"],
      routeModifiers: { avoidTolls: false, avoidHighways: false, avoidFerries: false }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "Unable to calculate route", detail: detail.slice(0, 500) }, { status: 502 });
  }

  const data = await response.json();
  const selected = data.routes?.[0];
  if (!selected) return NextResponse.json({ error: "No driving route found" }, { status: 404 });

  const seconds = Number(String(selected.duration ?? "0s").replace("s", ""));
  const tolls = Array.isArray(selected.travelAdvisory?.tollInfo?.estimatedPrice)
    ? selected.travelAdvisory.tollInfo.estimatedPrice.reduce(
        (sum: number, item: { currencyCode?: string; units?: string; nanos?: number }) =>
          item.currencyCode && item.currencyCode !== "USD" ? sum : sum + moneyToNumber(item),
        0
      )
    : 0;

  return NextResponse.json({
    distanceMiles: Math.round((selected.distanceMeters / 1609.344) * 10) / 10,
    durationMinutes: Math.max(1, Math.round(seconds / 60)),
    tolls: Math.round(tolls * 100) / 100,
    source: "google-routes"
  });
}
