import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(2).max(200)
});

const B1_KEY_LOCATIONS = [
  { name: "Miami International Airport", aliases: ["mia", "miami airport"] },
  { name: "Fort Lauderdale-Hollywood International Airport", aliases: ["fll", "fort lauderdale airport"] },
  { name: "Palm Beach International Airport", aliases: ["pbi", "palm beach airport"] },
  { name: "Miami-Opa Locka Executive Airport", aliases: ["opf", "opa locka airport"] },
  { name: "Fort Lauderdale Executive Airport", aliases: ["fxe", "executive airport"] },
  { name: "PortMiami", aliases: ["port miami", "miami cruise port"] },
  { name: "Port Everglades", aliases: ["fort lauderdale port", "cruise port"] },
  { name: "Miami Beach Marina", aliases: ["miami marina", "marina"] },
  { name: "Bayside Marketplace", aliases: ["bayside"] },
  { name: "Brickell", aliases: ["brickell"] },
  { name: "Miami Beach", aliases: ["south beach", "sobe"] },
  { name: "Bal Harbour", aliases: ["bal harbour"] },
  { name: "Aventura", aliases: ["aventura"] },
  { name: "Sunny Isles Beach", aliases: ["sunny isles"] },
  { name: "Kendall", aliases: ["kendall"] },
  { name: "Key Biscayne", aliases: ["key biscayne"] },
  { name: "Key Largo", aliases: ["key largo"] },
  { name: "Coral Gables", aliases: ["coral gables"] },
  { name: "Coconut Grove", aliases: ["coconut grove", "the grove"] },
  { name: "Doral", aliases: ["doral"] },
  { name: "Kaseya Center", aliases: ["kaseya", "miami heat arena"] },
  { name: "Hard Rock Stadium", aliases: ["hard rock stadium"] },
  { name: "Miami Beach Convention Center", aliases: ["miami convention center"] },
  { name: "Broward County Convention Center", aliases: ["broward convention center"] },
  { name: "Seminole Hard Rock Hotel & Casino Hollywood", aliases: ["hard rock casino", "guitar hotel"] },
  { name: "Fontainebleau Miami Beach", aliases: ["fontainebleau"] }
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

    const query = input.toLowerCase();

    const preferred = B1_KEY_LOCATIONS
      .map((item) => {
        const terms = [item.name, ...item.aliases].map((value) => value.toLowerCase());
        const exact = terms.some((value) => value === query);
        const starts = terms.some((value) => value.startsWith(query));
        const wordStarts = terms.some((value) => value.split(/\\s+/).some((word) => word.startsWith(query)));
        const score = exact ? 0 : starts ? 1 : wordStarts ? 2 : 99;
        return { item, score };
      })
      .filter(({ score }) => score < 99)
      .sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name))
      .slice(0, 5)
      .map(({ item }) => ({
        id: `b1:${item.name}`,
        label: item.name,
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
