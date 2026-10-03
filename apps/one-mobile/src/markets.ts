export type ServiceMarket = {
  id: 'south-florida' | 'buenos-aires';
  countryCode: 'US' | 'AR';
  label: string;
  currency: 'USD' | 'ARS';
  timeZone: string;
  areas: string[];
  status: 'launch';
};

export const WORLDWIDE_DOWNLOAD = true;

export const serviceMarkets: ServiceMarket[] = [
  {
    id: 'south-florida',
    countryCode: 'US',
    label: 'South Florida',
    currency: 'USD',
    timeZone: 'America/New_York',
    areas: ['Miami-Dade', 'Broward', 'Palm Beach', 'Airports', 'Ports'],
    status: 'launch',
  },
  {
    id: 'buenos-aires',
    countryCode: 'AR',
    label: 'Buenos Aires',
    currency: 'ARS',
    timeZone: 'America/Argentina/Buenos_Aires',
    areas: ['CABA', 'Aeroparque', 'Ezeiza', 'Zona Norte', 'Tigre', 'Pilar'],
    status: 'launch',
  },
];

export function formatMoney(amount: number, currency: ServiceMarket['currency'], locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
