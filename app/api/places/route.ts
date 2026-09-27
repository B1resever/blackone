import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(2).max(200)
});

const B1_KEY_LOCATIONS = [
  "Miami International Airport",
  "Fort Lauderdale-Hollywood International Airport",
  "Palm Beach International Airport",
  "Miami-Opa Locka Executive Airport",
  "Fort Lauderdale Executive Airport",
  "PortMiami",
  "Port Everglades",
  "Miami Beach Marina",
  "Bayside Marketplace",
  "Brickell",
  "Miami Beach",
  "Bal Harbour",
  "Aventura",
  "Sunny Isles Beach",
  "Kaseya Center",
  "Hard Rock Stadium",
  "Miami Beach Convention Center",
  "Broward County Convention Center",
  "Seminole Hard Rock Hotel & Casino Hollywood",
  "Fontainebleau Miami Beach"
];

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid search" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Places service is not configured" }, { status: 500 });
    }

    const input = parsed.data.input.trim();

    const preferred = B1_KEY_LOCATIONS
      .filter((name) => name.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 4)
      .map((name) => ({
        id: `b1:${name}`,
        label: name,
        source: "b1"
      }));

    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["us"],
        locationBias: {
          circle: {
            center: { latitude: 25.7617, longitude: -80.1918 },
            radius: 241402
          }
        }
      }),
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[api/places] Google Places error", data);
      return NextResponse.json({ suggestions: preferred });
    }

    const google = Array.isArray(data.suggestions)
      ? data.suggestions
          .map((item: any) => item?.placePrediction)
          .filter(Boolean)
          .map((prediction: any) => ({
            id: prediction.placeId ?? prediction.text?.text,
            label: prediction.text?.text ?? "",
            source: "google"
          }))
          .filter((item: any) => item.label)
          .slice(0, 6)
      : [];

    const seen = new Set<string>();
    const suggestions = [...preferred, ...google].filter((item) => {
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[api/places] failed", error);
    return NextResponse.json({ error: "Unable to search places" }, { status: 500 });
  }
}
