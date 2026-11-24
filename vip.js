// Shared pricing snapshot from config/b1-vip-hourly-rates.json; keep in sync with server configuration.
let metrics=null;
const rates = {"currency":"USD","minimumHours":4,"maximumRadiusMiles":50,"vehicles":{"maybach-tifanni":{"minimumPackageCents":108000,"additionalHourCents":27000,"gratuityBasisPoints":1500},"desert-sand":{"minimumPackageCents":108000,"additionalHourCents":27000,"gratuityBasisPoints":1500},"cadillac-escalade":{"minimumPackageCents":81000,"additionalHourCents":20250,"gratuityBasisPoints":1500},"rolls-royce-cullinan":{"minimumPackageCents":162000,"additionalHourCents":40500,"gratuityBasisPoints":1500},"range-rover-sv":{"minimumPackageCents":94500,"additionalHourCents":23625,"gratuityBasisPoints":1500},"classic-car":{"minimumPackageCents":54000,"additionalHourCents":13500,"gratuityBasisPoints":1500}}};


const fleet = [
  {id:'rolls-royce-cullinan',name:'Rolls-Royce Cullinan',capacity:null,edition:['Ultra Luxury · On request','Ultra lujo · Bajo solicitud'],description:['Availability subject to confirmation.','Disponibilidad sujeta a confirmación.'],features:[],photos:[]},
  {
    id: 'maybach-tifanni',
    name: 'Maybach Tifanni',
    capacity: 10,
    edition: ['Turquoise Edition', 'Edición turquesa'],
    choicePhoto: ['door-illustration', 'illustration'],
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
      ['door-illustration', 'Open sliding door · Illustration', 'Puerta corrediza abierta · Ilustración'],
      ['exterior', 'Front exterior', 'Exterior delantero'],
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
    edition: ['Cream cabin', 'Cabina color crema'],
    choicePhoto: ['door', 'doorOpen'],
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
    name: 'Cadillac Escalade-V ESV',
    capacity: null,
    description: [
      'Black Cadillac Escalade for private chauffeur service.',
      'Cadillac Escalade negra para servicio privado con chofer.',
    ],
    features: [],
    photos: [],
  },
  {id:'range-rover-sv',name:'Range Rover SV',capacity:null,edition:['Executive SUV · On request','SUV ejecutivo · Bajo solicitud'],description:['Availability subject to confirmation.','Disponibilidad sujeta a confirmación.'],features:[],photos:[]},
  {id:'classic-car',name:'Classic Car',capacity:null,edition:['Photo & video · On request','Foto y video · Bajo solicitud'],description:['Photo and video sessions only; availability subject to confirmation.','Solo sesiones de foto y video; disponibilidad sujeta a confirmación.'],features:[],photos:[]},
];
const reservationOrder = ["maybach-tifanni","desert-sand","cadillac-escalade","rolls-royce-cullinan","range-rover-sv","classic-car"];
fleet.sort((a,b)=>reservationOrder.indexOf(a.id)-reservationOrder.indexOf(b.id));

const copy = {
 mileageEstimate:['Mileage estimate (outbound only)','Estimación por millas (solo ida)'],
 tollEstimate:['Estimated tolls','Peajes estimados'],
 tollUnknown:['Tolls pending confirmation','Peajes pendientes de confirmación'],
 estimateTotal:['Estimated subtotal before unconfirmed charges','Subtotal estimado antes de cargos pendientes'],
 transferEstimateNotice:['Mileage estimate only. Concierge must confirm minimum fare, return mileage and tolls before payment.','Estimación por millas. Concierge debe confirmar tarifa mínima, millas de regreso y peajes antes del pago.'],
 hourlyTollNotice:['Known itinerary tolls only; additional stops and tolls require confirmation.','Peajes del itinerario conocido; paradas y peajes adicionales sujetos a confirmación.'],
 privateQuote:['Contact B1 Concierge for a private quote: 305-850-1737','Contacta a B1 Concierge para una cotización privada: 305-850-1737'],
 validateRoute:['Hourly estimate only — route and availability must be confirmed.','Estimación por hora — recorrido y disponibilidad sujetos a confirmación.'],
 classicOnly:['Classic Car is available for photo and video only; contact Concierge.','Classic Car disponible solo para fotografía y video; contacta a Concierge.'],
 chooseTip:['Choose chauffeur gratuity','Elige la propina del chofer'],
 routeUnavailable:['Google Maps unavailable. Concierge must confirm the route.','Google Maps no disponible. Concierge debe confirmar el recorrido.'],
 routePending:['Calculating route…','Calculando recorrido…'],
 transferPending:['Transfer fare requires concierge confirmation.','La tarifa del traslado requiere confirmación de Concierge.'],
 selectTip:['Select your gratuity to see the total.','Selecciona la propina para ver el total.'],
 distanceLabel:['Distance (one way)','Distancia (ida)'],
 durationLabel:['Estimated driving time','Tiempo estimado de viaje'],
 placesUnavailable:['Address suggestions unavailable. Enter the full address.','Sugerencias no disponibles. Ingresa la dirección completa.'],
  photoPending:['Vehicle photography pending confirmation','Fotografía de la unidad pendiente de confirmación'],
  referenceImage:['Reference image · actual vehicle may vary','Imagen de referencia · la unidad puede variar'],
  stepOne:['01 — Select your vehicle','01 — Elige tu vehículo'],
  stepTwo:['02 — Your journey','02 — Tu viaje'],
  changeVehicle:['Change vehicle','Cambiar vehículo'],
  occasion: ['Service description (optional)','Descripción del servicio (opcional)'],
  privateRide: ['Private chauffeur','Chofer privado'],
  specialEvents: ['Special events','Eventos especiales'],
  photoVideo: ['Photo & video','Foto y video'],
  nightOut: ['VIP night out','Salida VIP'],
  onRequest: ['Available on request · Confirmation required','Bajo solicitud · Requiere confirmación'],
  backHome: ['Back to B1','Volver a B1'],
  heroKicker: ['PRIVATE CHAUFFEUR · SOUTH FLORIDA','CHOFER PRIVADO · SUR DE FLORIDA'],
  heroTitle: ['Luxury Private Transportation','Transportación Privada de Lujo'],
  heroDescription: ['Private chauffeurs. Exceptional service.','Choferes privados. Servicio excepcional.'],
  heroReserve: ['Reserve','Reservar'],
  heroFleet: ['Discover the collection','Descubre la colección'],
  title: ['B1 Black One VIP | Private Chauffeur Service', 'B1 Black One VIP | Servicio privado con chofer'],
  fleet: ['Fleet', 'Flota'],
  fleetTitle: ['The private collection', 'La colección privada'],
  inquire: ['Book now', 'Reservar ahora'],
  language: ['Language', 'Idioma'],
  headline: ['Book a private chauffeur', 'Reserva un chofer privado'],
  requestIntro: [
    'Choose your vehicle and schedule your ride.',
    'Elige tu vehículo y programa tu viaje.',
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
  whatsapp: ['Confirm details on WhatsApp', 'Confirmar datos por WhatsApp'],
  review: ['Review reservation', 'Revisar reserva'],
  sendRequest: ['Send reservation request', 'Enviar solicitud de reserva'],
  requestSaving: ['Sending your request…', 'Enviando tu solicitud…'],
  requestSaved: ['Request received. B1 will confirm availability and payment.', 'Solicitud recibida. B1 confirmará la disponibilidad y el pago.'],
  requestUnavailable: ['Online requests are unavailable. You can continue on WhatsApp.', 'La solicitud en línea no está disponible. Puedes continuar por WhatsApp.'],
  requestRoute: ['The hourly service area is limited to 50 miles from pickup. Check the destination or select a transfer.', 'El servicio por hora se limita a 50 millas desde la recogida. Revisa el destino o selecciona un traslado.'],
  requestCapacity: ['Contact B1 on WhatsApp to confirm this vehicle’s capacity.', 'Contacta a B1 por WhatsApp para confirmar la capacidad de este vehículo.'],
  requestDetails: ['Check your trip date, passenger count and contact details.', 'Revisa la fecha, la cantidad de pasajeros y tus datos de contacto.'],
  reviewTitle: ['Review your reservation', 'Revisa tu reserva'],
  reviewNote: [
    'B1 Concierge confirms availability and payment details. Your card is not charged on this page.',
    'B1 Concierge confirma disponibilidad y datos de pago. Esta página no realiza cargos.',
  ],
  transferReview: [
    'B1 Concierge will confirm the route, final price and payment details before you pay.',
    'B1 Concierge confirmará la ruta, el precio final y los datos de pago antes de que pagues.',
  ],
  close: ['Close', 'Cerrar'],
  edit: ['Edit', 'Editar'],
  gallery: ['See photos', 'Ver fotos'],
  doorOpen: ['Door open', 'Puerta abierta'],
  fleetVideo: ['B1 Black One video', 'Video de B1 Black One'],
  fullName: ['Full name', 'Nombre completo'],
  email: ['Email', 'Correo electrónico'],
  phone: ['Phone', 'Teléfono'],
  guide: ['Guide me', 'Guiame'],
  conciergeWelcome: ['I can guide you through your reservation.', 'Puedo guiarte durante la reserva.'],
  conciergeVehicle: ['First, choose a vehicle.', 'Primero, elige un vehículo.'],
  conciergeField: ['Your next step', 'Tu siguiente paso'],
  conciergeReady: ['Your details are ready. Continue to review your reservation.', 'Tus datos están listos. Continúa para revisar tu reserva.'],
  serviceType: ['Service', 'Servicio'],
  hourly: ['Hourly', 'Por hora'],
  transfer: ['Transfer', 'Traslado'],
  destination: ['Drop-off location', 'Destino'],
  routeMap: ['View route map', 'Ver ruta en el mapa'],
  hourlyNote: ['Hourly service stays within a 50-mile radius of pickup.', 'El servicio por hora se limita a un radio de 50 millas desde la recogida.'],
  transferNote: [
    'We quote the transfer using driving distance and time, including the vehicle’s return to the pickup point.',
    'Cotizamos el traslado según las millas y el tiempo de conducción, incluido el regreso del vehículo al punto de recogida.',
  ],
  creditOnly: ['Credit card only', 'Solo tarjeta de crédito'],
  paymentAuthorization: [
    'The cardholder must sign an authorization for the exact charge and the separate card hold before we process payment.',
    'El titular debe firmar la autorización por el importe exacto del cobro y la retención separada antes de procesar el pago.',
  ],
  inactiveMethods: ['Unavailable payment methods', 'Métodos de pago no disponibles'],
  servicePrice: ['Service price', 'Precio del servicio'],
  gratuity: ['Gratuity', 'Propina'],
  total: ['Total payable', 'Total a pagar'],
  hold: ['Separate card hold', 'Bloqueo separado en la tarjeta'],
  paymentTerms: ['Payment, cancellations and vehicle care', 'Pago, cancelaciones y cuidado del vehículo'],
  care: [
    'Confirmed reservations are non-cancelable by the customer. Completed trips are non-refundable except when required by law or when B1 approves a refund for a service issue. Contact B1 about a service problem. Your rights regarding billing errors or unauthorized charges are preserved. The separate card hold is based on the service price before gratuity. A signed agreement covers care of the cabin, seats and cleanliness.',
    'El cliente no puede cancelar una reserva confirmada. Los viajes completados no son reembolsables, salvo cuando la ley lo exija o B1 apruebe un reembolso por un problema del servicio. Contacta a B1 si hubo un inconveniente. Conservas tus derechos ante errores de facturación o cargos no autorizados. La retención separada se calcula sobre el precio del servicio antes de la propina. Se firma un acuerdo de cuidado de la cabina, los asientos y la limpieza.',
  ],
  illustration: ['Illustration', 'Ilustración'],
  concierge: ['Contact B1 Concierge', 'Contactar a B1 Concierge'],
  previous: ['Previous photo', 'Foto anterior'],
  next: ['Next photo', 'Siguiente foto'],
  inquiryGreeting: [
    'Hello B1 Concierge, I’d like to check availability for private chauffeur service.',
    'Hola, B1 Concierge. Quisiera consultar la disponibilidad del servicio privado con chofer.',
  ],
};

const language = document.querySelector('#language');
const vehicleOptions = document.querySelector('#vehicle-options');
const fleetVideo = document.querySelector('#fleet-video');
const inquiry = document.querySelector('#inquiry');
const passengers = inquiry.elements.namedItem('passengers');
const pickup = inquiry.elements.namedItem('pickup');
const destination = inquiry.elements.namedItem('destination');
const hours = inquiry.elements.namedItem('hours');
const service = inquiry.elements.namedItem('service');
const routeMap = document.querySelector('#route-map');
const quote = document.querySelector('#hourly-price');
const galleries = [];
const galleryDialog = document.querySelector('#fleet-dialog');
const galleryContent = document.querySelector('#gallery-content');
const reviewDialog = document.querySelector('#review-dialog');
const conciergeMessage = document.querySelector('#concierge-message');
const sendRequestButton = document.querySelector('#submit-vip-request');
const requestStatus = document.querySelector('#vip-request-status');
const editReviewButton = reviewDialog.querySelector('form button');
let savedRequest;
let requestInProgress = false;
let requestEnabled = false;
let galleryVehicle;
let galleryRender;
let guiding = false;
let localeIndex = 0;

const t = key => copy[key][localeIndex];
const currentVehicle = () => fleet.find(vehicle => vehicle.id === inquiry.elements.namedItem('vehicle').value);
const isTransfer = () => service.value === 'transfer';

function updateCapacity() {
  const vehicle = currentVehicle();
  if (vehicle?.capacity) {
    passengers.max = vehicle.capacity;
  } else {
    passengers.removeAttribute('max');
  }
}

function refreshPrice() {
 const live=document.querySelector('#live-price'), vehicle=currentVehicle();
 const selected=inquiry.querySelector('input[name="tip"]:checked');
 const tipBps=selected?Number(selected.value):null;
 const rows=[];
 if(!vehicle){live.replaceChildren();quote.replaceChildren();return;}
 if((vehicle.id==='classic-car'&&isTransfer())||metrics?.distanceMeters>rates.maximumRadiusMiles*1609.344){const message=t(vehicle.id==='classic-car'?'classicOnly':'privateQuote');live.textContent=message;quote.textContent=message;return;}
 if(isTransfer()&&!metrics){live.textContent=t('transferPending');quote.textContent=t('transferPending');return;}
 if(!isTransfer()&&(!hours.value||!hours.validity.valid)){live.replaceChildren();quote.replaceChildren();return;}
 const rate=rates.vehicles[vehicle.id];
 const subtotal=isTransfer()?Math.round(metrics.distanceMeters/1609.344*607.5):rate.minimumPackageCents+(Number(hours.value)-rates.minimumHours)*rate.additionalHourCents;
 const toll=Number.isFinite(metrics?.tollCents)&&metrics.tollCents>=0?metrics.tollCents:null;
 rows.push([t(isTransfer()?'mileageEstimate':'servicePrice'),money(subtotal)]);
 if(metrics){rows.push([t('distanceLabel'),(metrics.distanceMeters/1609.344).toFixed(1)+' mi'],[t('durationLabel'),Math.ceil(metrics.durationSeconds/60)+' min']);}
 rows.push([t('tollEstimate'),toll===null?t('tollUnknown'):money(toll)]);
 if(tipBps!==null){const tip=Math.round(subtotal*tipBps/10000);rows.push([t('gratuity')+' ('+(tipBps/100)+'%)',money(tip)],[t('estimateTotal'),money(subtotal+tip+(toll??0))]);}
 else rows.push([t('selectTip'),'']);
 rows.push([t(isTransfer()?'transferEstimateNotice':'hourlyTollNotice'),'']);
 for(const node of [live,quote]){node.replaceChildren();for(const [label,value] of rows){const l=document.createElement('span'),v=document.createElement('strong');l.textContent=node===quote&&label.startsWith(t('gratuity')+' (')?t('gratuity'):label;v.textContent=value;if(!value){l.className='quote-note';node.append(l);}else{node.append(l,v);}}}
}

function money(cents) {
  return new Intl.NumberFormat(localeIndex === 0 ? 'en-US' : 'es-US', {
    style: 'currency', currency: rates.currency, minimumFractionDigits: 2,
  }).format(cents / 100);
}

function refreshRoute() {
  const origin = pickup.value.trim();
  const end = destination.value.trim();
  const showMap = origin && end;
  routeMap.hidden = !showMap;
  if (!showMap) {
    routeMap.removeAttribute('href');
    return;
  }
  const map = new URL('https://www.google.com/maps/dir/');
  map.search = new URLSearchParams({
    api: '1', origin, destination: end, travelmode: 'driving',
  }).toString();
  routeMap.href = map;
}

function refreshService() {
  const transfer = isTransfer();
  hours.disabled = transfer;
  hours.required = !transfer;
  document.querySelector('label[data-hourly-only]').hidden = transfer;
  document.querySelector('#service-note').textContent = t(transfer ? 'transferNote' : 'hourlyNote');
  refreshRoute();
}

function chooseVehicle(vehicle) {
  vehicleOptions.querySelector(`input[value="${vehicle.id}"]`).checked = true;
  updateCapacity();
  guiding = true;
  refreshConcierge();
  location.hash='#availability';
  showPage();
  inquiry.elements.namedItem('service').focus({preventScroll:true});
}

function openGallery(vehicle, photo) {
  galleryVehicle = vehicle;
  document.querySelector('#gallery-title').textContent = vehicle.name;
  const gallery = createGallery(vehicle, photo);
  galleryContent.replaceChildren(gallery.figure);
  galleryRender = gallery.render;
  galleryDialog.showModal();
  galleryRender();
}

function createVehicleOption(vehicle) {
  const card = document.createElement('div');
  card.className = 'vehicle-choice';
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'vehicle';
  input.value = vehicle.id;
  input.required = true;
  label.append(input);
  if (vehicle.choicePhoto) {
    const [file, note] = vehicle.choicePhoto;
    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'photo-button';
    preview.dataset.galleryButton = vehicle.id;
    const image = document.createElement('img');
    image.src = `/images/vip/${vehicle.id}/${file}.webp`;
    image.alt = '';
    preview.append(image);
    preview.addEventListener('click', () => openGallery(vehicle, file));
    card.append(preview);
    if (note) {
      const caption = document.createElement('small');
      caption.dataset.copy = note;
      card.append(caption);
    }
  }
  const name = document.createElement('b');
  name.textContent = vehicle.name;
  const spec = document.createElement('small');
  spec.dataset.optionSpec = vehicle.id;
  label.append(name, spec);
  const reserve = document.createElement('button');
  reserve.type = 'button';
  reserve.className = 'action';
  reserve.dataset.copy = 'inquire';
  reserve.addEventListener('click', () => chooseVehicle(vehicle));
  card.append(label, reserve);
  return card;
}

function createGallery(vehicle, initialPhoto) {
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
  let index = Math.max(0, vehicle.photos.findIndex(([file]) => file === initialPhoto));

  function render() {
    const [file, english, spanish] = vehicle.photos[index];
    const label = localeIndex === 0 ? english : spanish;
    image.src = `/images/vip/${vehicle.id}/${file}.webp`;
    image.alt = `${vehicle.name} · ${label}`;
    caption.textContent = `${label} · ${index + 1}/${vehicle.photos.length}`;
  }

  figure.querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-label', t(button.dataset.label));
    button.addEventListener('click', () => {
      index = (index + Number(button.dataset.step) + vehicle.photos.length) % vehicle.photos.length;
      render();
    });
  });
  if (initialPhoto) return { figure, render };
  galleries.push(render);
  return figure;
}

const referencePhotos={"rolls-royce-cullinan":["Rolls-Royce Cullinan Black (26).jpg","Damian B Oh","4.0"]};
function referencePhoto(vehicle){const ref=referencePhotos[vehicle.id];if(!ref)return null;const fig=document.createElement('figure');fig.className='reference-photo';const img=document.createElement('img');img.src='https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(ref[0])+'?width=1280';img.alt=vehicle.name;img.loading='lazy';const cap=document.createElement('figcaption');const label=document.createElement('span');label.dataset.copy='referenceImage';label.textContent=t('referenceImage');const credit=document.createElement('a');credit.href='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(ref[0]);credit.textContent=ref[1];credit.target='_blank';credit.rel='noopener';const license=document.createElement('a');license.href='https://creativecommons.org/licenses/by-sa/'+ref[2]+'/';license.textContent='CC BY-SA '+ref[2];license.target='_blank';license.rel='noopener';cap.append(label,document.createTextNode(' · '),credit,document.createTextNode(' · '),license);fig.append(img,cap);return fig;}
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
  else if (vehicle.id === 'cadillac-escalade') {
    const image = document.createElement('img');
    image.className = 'collection-escalade';
    image.src = '/images/fleet/Escalade.png';
    image.alt = 'Black Cadillac Escalade';
    image.loading = 'lazy';
    card.append(image);
  }
  else if(referencePhotos[vehicle.id])card.append(referencePhoto(vehicle));
  else {const note=document.createElement('p');note.className='photo-pending';note.dataset.copy='photoPending';card.append(note);}
  card.append(body);
  body.querySelector('a').addEventListener('click', event => {
    event.preventDefault();
    chooseVehicle(vehicle);
  });
  return card;
}

for (const vehicle of fleet) {
  const card=createVehicleCard(vehicle);
  document.querySelector('#fleet-details').append(card);
  if(['maybach-tifanni','desert-sand'].includes(vehicle.id))card.hidden=true;
  vehicleOptions.append(createVehicleOption(vehicle));
}


function renderLanguage() {
  const locale = language.value === 'es' ? 'es' : 'en';
  localeIndex = locale === 'es' ? 1 : 0;
  document.documentElement.lang = locale;
  document.title = t('title');
  fleetVideo.setAttribute('aria-label', t('fleetVideo'));

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
    const optionSpec = document.querySelector(`[data-option-spec="${vehicle.id}"]`);
    optionSpec.textContent = spec.join(' · ');
    optionSpec.hidden = !spec.length;
    const preview = vehicleOptions.querySelector(`[data-gallery-button="${vehicle.id}"]`);
    if (preview) preview.setAttribute('aria-label', `${t('gallery')}: ${vehicle.name}`);
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
  if (galleryDialog.open) galleryRender();
  refreshService();
  refreshConcierge();
  renderSelectedVehicle();
}

const requestedLanguage = new URLSearchParams(location.search).get('lang') || (()=>{try{return localStorage.getItem('b1-language')}catch{return null}})();
language.value = requestedLanguage === 'es' ? 'es' : 'en';
language.addEventListener('change', () => {
  try { localStorage.setItem('b1-language', language.value); } catch {}
  renderLanguage();
  const url = new URL(location.href);
  if (language.value === 'es') {
    url.searchParams.set('lang', 'es');
  } else {
    url.searchParams.delete('lang');
  }
  history.replaceState(null, '', url);
});
function nextField() {
  for (const name of ['date', 'time', 'pickup', 'destination', 'hours', 'passengers', 'fullName', 'email', 'phone']) {
    const field = inquiry.elements.namedItem(name);
    if (!field.disabled && (!field.validity.valid || !field.value.trim())) return field;
  }
  return null;
}

function refreshConcierge() {
  if (!guiding) {
    conciergeMessage.textContent = t('conciergeWelcome');
    return;
  }
  if (!currentVehicle()) {
    conciergeMessage.textContent = t('conciergeVehicle');
    return;
  }
  const field = nextField();
  const label = field?.closest('label').querySelector('[data-copy]').textContent;
  conciergeMessage.textContent = field ? `${t('conciergeField')}: ${label}.` : t('conciergeReady');
}

document.querySelector('#concierge-next').addEventListener('click', () => {
  guiding = true;
  refreshConcierge();
  if (!currentVehicle()) vehicleOptions.querySelector('input').focus();
  else (nextField() ?? inquiry.querySelector('[type=submit]')).focus();
});

document.querySelector('#gallery-book').addEventListener('click', () => {
  galleryDialog.close();
  chooseVehicle(galleryVehicle);
});

vehicleOptions.addEventListener('change', () => {
  updateCapacity();
  guiding = true;
  refreshConcierge();
});
hours.min = rates.minimumHours;
hours.value = rates.minimumHours;
service.addEventListener('change', () => {
  refreshService();
  refreshConcierge();
});
inquiry.addEventListener('input', refreshConcierge);
for (const address of [pickup, destination]) address.addEventListener('input', refreshRoute);

function bookingDetails() {
  const data = new FormData(inquiry);
  return [
    ['vehicle', currentVehicle().name],
    ['serviceType', t(isTransfer() ? 'transfer' : 'hourly')],
    ['occasion', data.get('occasion')?.trim() || '—'],
    ['pickupDate', data.get('date')],
    ['pickupTime', data.get('time')],
    ['pickup', pickup.value.trim()],
    ['destination', destination.value.trim()],
    ...(!isTransfer() ? [['hours', data.get('hours')]] : []),
    ['passengers', data.get('passengers')],

    ['fullName', data.get('fullName').trim()],
    ['email', data.get('email').trim()],
    ['phone', data.get('phone').trim()],
  ];
}

inquiry.addEventListener('submit', event => {
  event.preventDefault();
  if (!currentVehicle() || !inquiry.reportValidity()) return;
  const missing = nextField();
  if (missing) {
    guiding = true;
    refreshConcierge();
    missing.focus();
    return;
  }
  const summary = document.querySelector('#booking-summary');
  summary.replaceChildren();
  for (const [key, value] of bookingDetails()) {
    const label = document.createElement('dt');
    const detail = document.createElement('dd');
    label.textContent = t(key);
    detail.textContent = value;
    summary.append(label, detail);
  }
  document.querySelector('#review-note').textContent = t(metrics?.distanceMeters>rates.maximumRadiusMiles*1609.344?'privateQuote':isTransfer()?'transferEstimateNotice':'validateRoute');
  requestStatus.textContent = '';
  sendRequestButton.hidden = true;
  sendRequestButton.disabled = false;
  reviewDialog.showModal();
  refreshPrice();
});

reviewDialog.addEventListener('cancel', event => {
  if (requestInProgress) event.preventDefault();
});

reviewDialog.addEventListener('close', () => {
  if (reviewDialog.open) return;
  quote.replaceChildren();
  document.querySelector('#booking-summary').replaceChildren();
});

sendRequestButton.addEventListener('click', async () => {
  return; // Server intake suspended for revised quotes; concierge confirmation only.
  const data = new FormData(inquiry);
  const details = {
    vehicleId: currentVehicle().id,
    pickupDate: data.get('date'),
    pickupTime: data.get('time'),
    pickup: pickup.value.trim(),
    destination: destination.value.trim(),
    hours: Number(hours.value),
    passengers: Number(passengers.value),
    fullName: data.get('fullName').trim(),
    email: data.get('email').trim(),
    phone: data.get('phone').trim(),
  };
  const signature = JSON.stringify(details);
  if (savedRequest?.signature !== signature) {
    savedRequest = { signature, id: crypto.randomUUID(), completed: false };
  }
  const attempt = savedRequest;
  if (attempt.completed) {
    requestStatus.textContent = `${t('requestSaved')} ${attempt.id}`;
    sendRequestButton.disabled = true;
    return;
  }
  requestInProgress = true;
  sendRequestButton.disabled = true;
  editReviewButton.disabled = true;
  requestStatus.textContent = t('requestSaving');
  try {
    const response = await fetch('/one/api/vip-hourly-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...details, requestId: attempt.id }),
    });
    const result = await response.json();
    if (response.ok && result.requestId === attempt.id && result.status === 'requested') {
      attempt.completed = true;
      requestStatus.textContent = `${t('requestSaved')} ${attempt.id}`;
    } else if (result.error === 'vehicle_capacity_unverified') {
      requestStatus.textContent = t('requestCapacity');
    } else if (result.error === 'hourly_radius_exceeded') {
      requestStatus.textContent = t('requestRoute');
    } else if (response.status === 400 || result.error === 'pickup_time_invalid') {
      requestStatus.textContent = t('requestDetails');
    } else {
      requestStatus.textContent = t('requestUnavailable');
    }
  } catch {
    requestStatus.textContent = t('requestUnavailable');
  } finally {
    requestInProgress = false;
    editReviewButton.disabled = false;
    sendRequestButton.disabled = attempt.completed;
  }
});

fetch('/one/api/vip-hourly-request')
  .then(response => response.ok ? response.json() : null)
  .then(result => {
    requestEnabled = result?.enabled === true;
    // Manual concierge confirmation until supplier inventory and server pricing are synchronized.
  })
  .catch(() => {});
document.querySelector('#request-confirmation').addEventListener('click', () => {
  const details = bookingDetails();
  const message = [t('inquiryGreeting'), '', ...details.map(([key, value]) => `${t(key)}: ${value}`), ...Array.from(quote.children).filter(node=>node.tagName==='SPAN').map(node=>node.classList.contains('quote-note')?node.textContent:node.textContent+': '+(node.nextElementSibling?.textContent??''))].join('\n');
  const link = new URL('https://wa.me/13058501737');
  link.searchParams.set('text', message);
  location.assign(link);
});
updateCapacity();
renderLanguage();



const filmToggle = document.querySelector('#film-toggle');
const syncFilm = () => {filmToggle.textContent=fleetVideo.paused?'▶':'Ⅱ';filmToggle.setAttribute('aria-label',language.value==='es'?(fleetVideo.paused?'Reproducir video':'Pausar video'):(fleetVideo.paused?'Play video':'Pause video'));};
filmToggle.addEventListener('click',()=>{if(fleetVideo.paused)fleetVideo.play().catch(syncFilm);else fleetVideo.pause();});
for(const event of ['play','pause'])fleetVideo.addEventListener(event,syncFilm);
language.addEventListener('change',syncFilm);
if(matchMedia('(prefers-reduced-motion: reduce)').matches)fleetVideo.pause();
syncFilm();

const bookingScreen=document.querySelector('#booking-screen');
const hero=document.querySelector('.vip-hero');
fleetVideo.defaultPlaybackRate=.5;
fleetVideo.playbackRate=.5;
fleetVideo.addEventListener('loadedmetadata',()=>{fleetVideo.playbackRate=.5;});
function renderSelectedVehicle(){
 const target=document.querySelector('#selected-vehicle');
 const v=currentVehicle();
 target.replaceChildren();
 if(!v)return;
 const img=document.createElement('img');
 if(v.photos.length)img.src='/images/vip/'+v.id+'/'+(v.choicePhoto?.[0]||v.photos[0][0])+'.webp';
 else if(v.id==='cadillac-escalade')img.src='/images/fleet/Escalade.png';
 if(img.hasAttribute('src')){img.alt=v.name;target.append(img);}else if(referencePhotos[v.id])target.append(referencePhoto(v));
 const name=document.createElement('h3');name.textContent=v.name;target.append(name);
 const note=document.createElement('p');note.textContent=v.description[localeIndex];target.append(note);
}
function showPage(){
 const booking=location.hash==='#availability'||location.hash==='#fleet';
 const details=location.hash==='#availability'&&!!currentVehicle();
 const wasBooking=!bookingScreen.hidden;
 bookingScreen.hidden=!booking;hero.hidden=booking;
 document.querySelector('#fleet').hidden=details;
 document.querySelector('#availability').hidden=!details;
 document.body.classList.toggle('landing-mode',!booking);
 if(booking){fleetVideo.pause();renderSelectedVehicle();window.scrollTo(0,0);}
 else{window.scrollTo(0,0);if(wasBooking&&!matchMedia('(prefers-reduced-motion: reduce)').matches)fleetVideo.play().catch(()=>{});}
}
language.addEventListener('change',renderSelectedVehicle);
document.querySelectorAll('[data-book-featured]').forEach(button=>button.addEventListener('click',()=>chooseVehicle(fleet.find(v=>v.id===button.dataset.bookFeatured))));
window.addEventListener('hashchange',showPage);
showPage();

/* Existing server-side Google Places and Routes endpoints; no keys exposed to browser. */
let routeTimer,routeSerial=0;
const routeStatus=document.querySelector('#route-metrics');

async function postMaps(path,body,signal){const res=await fetch('/one/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});if(!res.ok)throw Error('maps unavailable');return res.json();}
function showMetrics(){if(!metrics)return;routeStatus.textContent=t('distanceLabel')+': '+(metrics.distanceMeters/1609.344).toFixed(1)+' mi · '+t('durationLabel')+': '+Math.ceil(metrics.durationSeconds/60)+' min';}
function scheduleMetrics(){clearTimeout(routeTimer);const serial=++routeSerial;metrics=null;const from=pickup.value.trim(),to=destination.value.trim();routeStatus.textContent='';if(from.length<3||to.length<3)return;routeTimer=setTimeout(async()=>{routeStatus.textContent=t('routePending');try{const result=await postMaps('route',{pickup:from,dropoff:to,vip:true,pickupDate:inquiry.elements.namedItem('date').value,pickupTime:inquiry.elements.namedItem('time').value});if(serial!==routeSerial)return;if(!Number.isFinite(result.distanceMeters)||!Number.isFinite(result.durationSeconds))throw Error();metrics=result;showMetrics();refreshPrice();}catch{if(serial===routeSerial)routeStatus.textContent=t('routeUnavailable');}},700);}
for(const field of [pickup,destination]){
 let timer,controller,version=0;
 const list=document.createElement('div');list.className='places-results';list.hidden=true;field.after(list);field.autocomplete='off';
 field.addEventListener('input',()=>{clearTimeout(timer);controller?.abort();const seq=++version;list.replaceChildren();list.hidden=true;const input=field.value.trim();if(input.length<3)return;timer=setTimeout(async()=>{controller=new AbortController();try{const result=await postMaps('places',{input,marketId:'south-florida'},controller.signal);if(seq!==version)return;for(const suggestion of result.suggestions||[]){const b=document.createElement('button');b.type='button';b.textContent=suggestion.label;b.addEventListener('click',()=>{field.value=suggestion.label;list.hidden=true;version++;refreshRoute();scheduleMetrics();refreshConcierge();});list.append(b);}list.hidden=!list.children.length;}catch(e){if(seq!==version||e.name==='AbortError')return;list.textContent=t('placesUnavailable');list.hidden=false;}},350);});
 field.addEventListener('keydown',e=>{if(e.key==='Escape')list.hidden=true;});
 document.addEventListener('pointerdown',e=>{if(e.target!==field&&!list.contains(e.target))list.hidden=true;});
 field.addEventListener('change',scheduleMetrics);
 field.addEventListener('input',()=>{clearTimeout(routeTimer);routeSerial++;metrics=null;routeStatus.textContent='';refreshPrice();});
}
for(const name of ['date','time'])inquiry.elements.namedItem(name).addEventListener('change',()=>{scheduleMetrics();refreshPrice();});
inquiry.addEventListener('input',refreshPrice);
inquiry.addEventListener('change',refreshPrice);
language.addEventListener('change',()=>{refreshPrice();showMetrics();});
document.querySelectorAll('[data-book-featured],#fleet-details .action').forEach(b=>b.addEventListener('click',refreshPrice));
refreshPrice();
