const fleet = [
  {
    id: 'maybach-tifanni',
    name: 'Maybach Tifanni',
    capacity: 10,
    edition: ['Turquoise Edition', 'Edición turquesa'],
    description: [
      'Mercedes Sprinter Maybach Style. 9 VIP seats in the rear and 1 beside the chauffeur.',
      'Mercedes Sprinter Maybach Style. 9 asientos VIP atrás y 1 junto al chofer.',
    ],
    features: [
      ['Turquoise premium leather', 'Cuero premium turquesa'],
      ['Black marble floor', 'Piso de mármol negro'],
      ['Embroidered Maybach emblems', 'Emblemas Maybach bordados'],
      ['Integrated Apple TV', 'Apple TV integrado'],
      ['Ambient lighting', 'Iluminación ambiental'],
      ['Individual climate control', 'Climatización individual'],
      ['Audio system', 'Sistema de audio'],
      ['Full privacy', 'Privacidad total'],
      ['Onboard Wi-Fi', 'Wi-Fi a bordo'],
    ],
    photos: [
      ['exterior', 'Front exterior', 'Exterior delantero'],
      ['door-illustration', 'Open sliding door · Illustration', 'Puerta corrediza abierta · Ilustración'],
      ['cabin', 'Turquoise VIP cabin', 'Cabina VIP turquesa'],
      ['seat', 'Side view of the cabin', 'Vista lateral de la cabina'],
      ['tables', 'Seats with folding tables', 'Asientos con mesas plegables'],
      ['rear', 'Rear exterior', 'Exterior trasero'],
    ],
  },
  {
    id: 'desert-sand',
    name: 'Desert Sand',
    capacity: 15,
    description: [
      'Mercedes Sprinter VIP. Black exterior, cream cabin and an onboard kitchen.',
      'Mercedes Sprinter VIP. Exterior negro, cabina color crema y cocina a bordo.',
    ],
    features: [
      ['Cream cabin', 'Cabina color crema'],
      ['Onboard kitchen', 'Cocina a bordo'],
    ],
    photos: [
      ['exterior', 'Front exterior', 'Exterior delantero'],
      ['door', 'Open sliding door', 'Puerta corrediza abierta'],
      ['entry', 'Cabin entry', 'Acceso a la cabina'],
      ['seat', 'Cream seats', 'Asientos color crema'],
      ['cabin', 'Cabin overview', 'Vista general de la cabina'],
    ],
  },
  {
    id: 'cadillac-escalade',
    name: 'Cadillac Escalade',
    capacity: null,
    description: [
      'Black Cadillac Escalade for private chauffeur service.',
      'Cadillac Escalade negra para servicio privado con chofer.',
    ],
    features: [],
    photos: [],
  },
];

const copy = {
  title: ['B1 Black One VIP | Private Chauffeur Service', 'B1 Black One VIP | Servicio privado con chofer'],
  fleet: ['Fleet', 'Flota'],
  fleetTitle: ['The VIP fleet', 'La flota VIP'],
  inquire: ['Request a price', 'Solicitar precio'],
  language: ['Language', 'Idioma'],
  headline: ['Book a private chauffeur', 'Reserva un chofer privado'],
  requestIntro: [
    'Choose a vehicle and pickup time to request your price.',
    'Elige el vehículo y el horario de recogida para solicitar el precio.',
  ],
  details: ['Vehicle details', 'Detalles del vehículo'],
  services: ['Services', 'Servicios'],
  weddings: ['Weddings & Quinceañeras', 'Bodas y quinceañeras'],
  weddingsDetail: ['Private chauffeur service for your celebration.', 'Servicio privado con chofer para tu celebración.'],
  corporate: ['Corporate Events', 'Eventos corporativos'],
  corporateDetail: ['Punctual, discreet transportation for clients and teams.', 'Traslados puntuales y discretos para clientes y equipos.'],
  airports: ['Airport Transfers', 'Traslados al aeropuerto'],
  airportsDetail: ['Ask B1 about flight monitoring and luggage assistance.', 'Consulta con B1 por el seguimiento de vuelos y la asistencia con equipaje.'],
  vehicle: ['Vehicle', 'Vehículo'],
  pickupDate: ['Pickup date', 'Fecha de recogida'],
  pickupTime: ['Pickup time (local)', 'Hora local de recogida'],
  pickup: ['Pickup location', 'Lugar de recogida'],
  hours: ['Hours', 'Horas'],
  passengers: ['Passengers', 'Pasajeros'],
  whatsapp: ['Request price on WhatsApp', 'Solicitar precio por WhatsApp'],
  concierge: ['Contact B1 Concierge', 'Contactar a B1 Concierge'],
  previous: ['Previous photo', 'Foto anterior'],
  next: ['Next photo', 'Siguiente foto'],
  inquiryGreeting: [
    'Hello B1 Concierge, I’d like to check availability for hourly chauffeur service.',
    'Hola, B1 Concierge. Quisiera consultar la disponibilidad del servicio con chofer por hora.',
  ],
  selectVehicle: ['Select a vehicle', 'Selecciona un vehículo'],
};

const language = document.querySelector('#language');
const vehicleSelect = document.querySelector('#request-vehicle');
const inquiry = document.querySelector('#inquiry');
const passengers = inquiry.elements.namedItem('passengers');
const pickup = inquiry.elements.namedItem('pickup');
const galleries = [];
let localeIndex = 0;

const t = key => copy[key][localeIndex];
const currentVehicle = () => fleet.find(vehicle => vehicle.id === vehicleSelect.value);

function updateCapacity() {
  const vehicle = currentVehicle();
  if (vehicle?.capacity) {
    passengers.max = vehicle.capacity;
  } else {
    passengers.removeAttribute('max');
  }
}

function createGallery(vehicle) {
  const figure = document.createElement('figure');
  figure.className = 'gallery';
  figure.innerHTML = `
    <img ${vehicle === fleet[0] ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="">
    <figcaption class="gallery-controls">
      <button type="button" data-step="-1" data-label="previous">‹</button>
      <span aria-live="polite" aria-atomic="true"></span>
      <button type="button" data-step="1" data-label="next">›</button>
    </figcaption>`;
  const image = figure.querySelector('img');
  const caption = figure.querySelector('[aria-live]');
  let index = 0;

  function render() {
    const [file, english, spanish] = vehicle.photos[index];
    const label = localeIndex === 0 ? english : spanish;
    image.src = `/images/vip/${vehicle.id}/${file}.webp`;
    image.alt = `${vehicle.name} · ${label}`;
    caption.textContent = `${label} · ${index + 1}/${vehicle.photos.length}`;
  }

  figure.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      index = (index + Number(button.dataset.step) + vehicle.photos.length) % vehicle.photos.length;
      render();
    });
  });
  galleries.push(render);
  return figure;
}

function createVehicleCard(vehicle) {
  const card = document.createElement('article');
  card.className = 'vehicle';
  card.dataset.vehicle = vehicle.id;
  const body = document.createElement('div');
  body.className = 'vehicle-info';
  body.innerHTML = `
    <h3>${vehicle.name}</h3>
    <p class="vehicle-spec" data-spec></p>
    ${vehicle.features.length ? `
      <details class="vehicle-details">
        <summary data-copy="details"></summary>
        <p data-description></p>
        <ul class="features"></ul>
      </details>` : ''}
    <a class="action" href="#availability" data-copy="inquire"></a>`;
  if (vehicle.photos.length) card.append(createGallery(vehicle));
  card.append(body);
  body.querySelector('a').addEventListener('click', event => {
    event.preventDefault();
    vehicleSelect.value = vehicle.id;
    updateCapacity();
    history.replaceState(null, '', '#availability');
    document.querySelector('#availability').scrollIntoView();
    vehicleSelect.focus({ preventScroll: true });
  });
  return card;
}

vehicleSelect.append(new Option('', ''));
vehicleSelect.options[0].disabled = true;
for (const vehicle of fleet) {
  document.querySelector('#fleet-details').append(createVehicleCard(vehicle));
  vehicleSelect.append(new Option(vehicle.name, vehicle.id));
}

function renderLanguage() {
  const locale = language.value === 'es' ? 'es' : 'en';
  localeIndex = locale === 'es' ? 1 : 0;
  document.documentElement.lang = locale;
  document.title = t('title');
  vehicleSelect.options[0].textContent = t('selectVehicle');

  document.querySelectorAll('[data-copy]').forEach(element => {
    element.textContent = t(element.dataset.copy);
  });
  document.querySelectorAll('[data-label]').forEach(button => {
    button.setAttribute('aria-label', t(button.dataset.label));
  });
  for (const vehicle of fleet) {
    const card = document.querySelector(`[data-vehicle="${vehicle.id}"]`);
    const spec = [];
    if (vehicle.edition) spec.push(vehicle.edition[localeIndex]);
    if (vehicle.capacity) spec.push(`${vehicle.capacity} ${t('passengers').toLowerCase()}`);
    card.querySelector('[data-spec]').textContent = spec.join(' · ') || vehicle.description[localeIndex];
    if (!vehicle.features.length) continue;
    card.querySelector('[data-description]').textContent = vehicle.description[localeIndex];
    const features = vehicle.features.map(feature => feature[localeIndex]);
    card.querySelector('.features').replaceChildren(...features.map(feature => {
      const item = document.createElement('li');
      item.textContent = feature;
      return item;
    }));
  }
  galleries.forEach(render => render());
}

const requestedLanguage = new URLSearchParams(location.search).get('lang');
language.value = requestedLanguage === 'es' ? 'es' : 'en';
language.addEventListener('change', () => {
  renderLanguage();
  const url = new URL(location.href);
  if (language.value === 'es') {
    url.searchParams.set('lang', 'es');
  } else {
    url.searchParams.delete('lang');
  }
  history.replaceState(null, '', url);
});
vehicleSelect.addEventListener('change', updateCapacity);
pickup.addEventListener('input', () => pickup.setCustomValidity(''));
inquiry.addEventListener('submit', event => {
  event.preventDefault();
  const vehicle = currentVehicle();
  if (!vehicle) return;
  if (!pickup.value.trim()) {
    pickup.setCustomValidity(localeIndex === 0 ? 'Enter a pickup location.' : 'Ingresa un lugar de recogida.');
    pickup.reportValidity();
    return;
  }
  const data = new FormData(inquiry);
  const fields = [
    ['vehicle', vehicle.name],
    ['pickupDate', data.get('date')],
    ['pickupTime', data.get('time')],
    ['pickup', pickup.value.trim()],
    ['hours', data.get('hours')],
    ['passengers', data.get('passengers')],
  ];
  const message = [t('inquiryGreeting'), '', ...fields.map(([key, value]) => `${t(key)}: ${value}`)].join('\n');
  const link = new URL('https://wa.me/13058501737');
  link.searchParams.set('text', message);
  location.assign(link);
});
updateCapacity();
renderLanguage();
