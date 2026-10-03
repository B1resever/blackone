import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReservationProvider } from '../src/reservation-context';
import { AuthProvider } from '../src/auth-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ReservationProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#02080E' },
            headerTintColor: '#F7FBFF',
            headerShadowVisible: false,
            contentStyle: { backgroundColor: '#02080E' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ title: 'My ONE' }} />
          <Stack.Screen name="book" options={{ title: 'Book a Ride' }} />
          <Stack.Screen name="vehicles" options={{ title: 'Choose Vehicle' }} />
          <Stack.Screen name="review" options={{ title: 'Review Reservation' }} />
          <Stack.Screen name="confirmation" options={{ headerShown: false }} />
          <Stack.Screen name="status" options={{ title: 'My Reservation' }} />
          <Stack.Screen name="legal" options={{ title: 'Help & Legal' }} />
          <Stack.Screen name="driver" options={{ title: 'Drive with ONE' }} />
          <Stack.Screen name="driver-access" options={{ title: 'ONE Driver' }} />
          <Stack.Screen name="safety" options={{ title: 'ONE Safety' }} />
        </Stack>
        </ReservationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
