export type Language = 'en' | 'es' | 'pt' | 'fr';

const catalog = {
  en: {
    modernTransport: 'MODERN TRANSPORT',
    hero1: 'YOUR RIDE.',
    hero2: 'YOUR TIME.',
    hero3: 'YOUR ONE.',
    heroBody: 'Professional rides. Transparent pricing. Verified drivers. Move different.',
    bookRide: 'BOOK A RIDE',
    driveWithOne: 'DRIVE WITH ONE',
    oneWay: 'One Way',
    hourly: 'Hourly',
    roundTrip: 'Round Trip',
    pickup: 'Pickup',
    pickupPlaceholder: 'Enter pickup location',
    dropoff: 'Drop-off',
    dropoffPlaceholder: 'Enter destination',
    estimate: 'GET ESTIMATE',
    choose: 'Choose your ONE',
    safety: 'ONE SAFETY',
    safetyTitle: 'Know your driver.\nKnow your ride.',
    safetyBody: 'Verified drivers, live tracking, a unique ride code and in-app support.',
    exploreSafety: 'Explore ONE Safety',
    globalAccess: 'Available to download worldwide',
    serviceAreas: 'Ride service is activated market by market.',
    markets: 'SERVICE AREAS',
    marketMiami: 'South Florida',
    marketBuenosAires: 'Buenos Aires',
    marketStatusLive: 'Launch market',
    language: 'Language'
  },
  es: {
    modernTransport: 'TRANSPORTE MODERNO',
    hero1: 'TU VIAJE.',
    hero2: 'TU TIEMPO.',
    hero3: 'TU ONE.',
    heroBody: 'Viajes profesionales. Precios transparentes. Choferes verificados. Muévete diferente.',
    bookRide: 'RESERVAR VIAJE',
    driveWithOne: 'CONDUCIR CON ONE',
    oneWay: 'Solo ida',
    hourly: 'Por hora',
    roundTrip: 'Ida y vuelta',
    pickup: 'Recogida',
    pickupPlaceholder: 'Ingresa lugar de recogida',
    dropoff: 'Destino',
    dropoffPlaceholder: 'Ingresa destino',
    estimate: 'OBTENER PRECIO',
    choose: 'Elige tu ONE',
    safety: 'ONE SAFETY',
    safetyTitle: 'Conoce a tu chofer.\nConoce tu viaje.',
    safetyBody: 'Choferes verificados, seguimiento en vivo, código único de viaje y soporte dentro de la app.',
    exploreSafety: 'Ver ONE Safety',
    globalAccess: 'Disponible para descargar en todo el mundo',
    serviceAreas: 'El servicio de viajes se activa mercado por mercado.',
    markets: 'ÁREAS DE SERVICIO',
    marketMiami: 'Sur de Florida',
    marketBuenosAires: 'Buenos Aires',
    marketStatusLive: 'Mercado de lanzamiento',
    language: 'Idioma'
  },
  pt: {
    modernTransport: 'TRANSPORTE MODERNO',
    hero1: 'SUA VIAGEM.',
    hero2: 'SEU TEMPO.',
    hero3: 'SEU ONE.',
    heroBody: 'Viagens profissionais. Preços transparentes. Motoristas verificados. Mova-se diferente.',
    bookRide: 'RESERVAR VIAGEM',
    driveWithOne: 'DIRIGIR COM ONE',
    oneWay: 'Só ida',
    hourly: 'Por hora',
    roundTrip: 'Ida e volta',
    pickup: 'Embarque',
    pickupPlaceholder: 'Digite o local de embarque',
    dropoff: 'Destino',
    dropoffPlaceholder: 'Digite o destino',
    estimate: 'OBTER PREÇO',
    choose: 'Escolha seu ONE',
    safety: 'ONE SAFETY',
    safetyTitle: 'Conheça seu motorista.\nConheça sua viagem.',
    safetyBody: 'Motoristas verificados, rastreamento ao vivo, código único da viagem e suporte no app.',
    exploreSafety: 'Ver ONE Safety',
    globalAccess: 'Disponível para download no mundo todo',
    serviceAreas: 'O serviço de viagens é ativado mercado por mercado.',
    markets: 'ÁREAS DE SERVIÇO',
    marketMiami: 'Sul da Flórida',
    marketBuenosAires: 'Buenos Aires',
    marketStatusLive: 'Mercado de lançamento',
    language: 'Idioma'
  },
  fr: {
    modernTransport: 'TRANSPORT MODERNE',
    hero1: 'VOTRE TRAJET.',
    hero2: 'VOTRE TEMPS.',
    hero3: 'VOTRE ONE.',
    heroBody: 'Trajets professionnels. Tarifs transparents. Chauffeurs vérifiés. Déplacez-vous autrement.',
    bookRide: 'RÉSERVER',
    driveWithOne: 'CONDUIRE AVEC ONE',
    oneWay: 'Aller simple',
    hourly: 'À l’heure',
    roundTrip: 'Aller-retour',
    pickup: 'Départ',
    pickupPlaceholder: 'Saisissez le lieu de départ',
    dropoff: 'Destination',
    dropoffPlaceholder: 'Saisissez la destination',
    estimate: 'OBTENIR LE PRIX',
    choose: 'Choisissez votre ONE',
    safety: 'ONE SAFETY',
    safetyTitle: 'Connaissez votre chauffeur.\nConnaissez votre trajet.',
    safetyBody: 'Chauffeurs vérifiés, suivi en direct, code unique de trajet et assistance dans l’app.',
    exploreSafety: 'Voir ONE Safety',
    globalAccess: 'Disponible au téléchargement dans le monde entier',
    serviceAreas: 'Le service de transport est activé marché par marché.',
    markets: 'ZONES DE SERVICE',
    marketMiami: 'Sud de la Floride',
    marketBuenosAires: 'Buenos Aires',
    marketStatusLive: 'Marché de lancement',
    language: 'Langue'
  },
} as const;

export type TranslationKey = keyof typeof catalog.en;

export const supportedLanguages: Array<{ code: Language; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
  { code: 'fr', label: 'FR' },
];

export function getDeviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    const language = locale.split('-')[0];
    if (language === 'es' || language === 'pt' || language === 'fr') return language;
  } catch {
    // Fall back to English on runtimes without Intl locale data.
  }
  return 'en';
}

export function t(language: Language, key: TranslationKey): string {
  return catalog[language][key] ?? catalog.en[key];
}
