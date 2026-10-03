export type RouteMetrics = {
  distanceMeters: number;
  durationSeconds: number;
};

export type PlaceSuggestion = {
  id: string;
  label: string;
  mainText: string;
  secondaryText: string;
};

function getMapsKey() {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY?.trim();
  if (!key) throw new Error('GOOGLE_MAPS_SERVER_KEY is not configured');
  return key;
}

export async function computeRoute(pickup: string, dropoff: string): Promise<RouteMetrics> {
  const key = getMapsKey();

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
    },
    body: JSON.stringify({
      origin: { address: pickup },
      destination: { address: dropoff },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'IMPERIAL',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error('Google Routes failed: ' + response.status + ' ' + body.slice(0, 300));
  }

  const data = (await response.json()) as {
    routes?: Array<{ distanceMeters?: number; duration?: string }>;
  };
  const route = data.routes?.[0];
  if (!route?.distanceMeters || !route.duration) {
    throw new Error('Google Routes returned no usable route');
  }

  const durationSeconds = Number(route.duration.replace(/s$/, ''));
  if (!Number.isFinite(durationSeconds)) {
    throw new Error('Google Routes returned an invalid duration');
  }

  return {
    distanceMeters: route.distanceMeters,
    durationSeconds,
  };
}

export async function autocompletePlaces(input: string, regionCode?: string): Promise<PlaceSuggestion[]> {
  const key = getMapsKey();

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
    },
    body: JSON.stringify({
      input,
      ...(regionCode ? { includedRegionCodes: [regionCode.toLowerCase()] } : {}),
      languageCode: 'en',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error('Google Places failed: ' + response.status + ' ' + body.slice(0, 300));
  }

  const data = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
  };

  return (data.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction?.placeId))
    .slice(0, 6)
    .map((prediction) => ({
      id: prediction.placeId!,
      label: prediction.text?.text ?? '',
      mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
    }));
}
