import { Text, View } from 'react-native';
import { theme } from './theme';
export type AirportPickupDetails = {
  airportPickup: boolean;
  flightNumber: string;
  pickupMeeting: 'curbside' | 'meet-and-greet';
  pickupInstructions: string;
};
export function PickupDetails({ details }: { details?: AirportPickupDetails | null }) {
  if (!details?.airportPickup) return null;
  return <View style={{ paddingTop: 10, gap: 5 }}>
    <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>AIRPORT / AEROPUERTO · {details.flightNumber || 'Flight to coordinate / Vuelo a coordinar'}</Text>
    <Text style={{ color: theme.colors.text }}>{details.pickupMeeting === 'curbside' ? 'Curbside / Exterior' : 'Meet & greet / Recepción · coordinate with B1'}</Text>
    {details.pickupInstructions ? <Text style={{ color: theme.colors.muted }}>{details.pickupInstructions}</Text> : null}
  </View>;
}
