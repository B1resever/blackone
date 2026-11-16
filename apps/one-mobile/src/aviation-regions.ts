/** Geographic presets for aviation map exploration. Not flight availability or operator coverage. */
export const aviationRegions = [
  { id: 'florida', title: 'Florida', latitude: 27.6, longitude: -81.5, latitudeDelta: 8.5, longitudeDelta: 10 },
  { id: 'bahamas', title: 'Bahamas', latitude: 24.6, longitude: -76.5, latitudeDelta: 7, longitudeDelta: 9 },
  { id: 'mexico', title: 'Los Cabos', latitude: 23.2, longitude: -109.7, latitudeDelta: 5, longitudeDelta: 6 },
  { id: 'caribbean', title: 'Caribbean', latitude: 18.7, longitude: -68.2, latitudeDelta: 7, longitudeDelta: 13 },
] as const;
