import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth-context';
import { getSessionToken, driverDispatchOffer, type DriverDispatchOffer } from '../src/auth-client';
import { theme } from '../src/theme';

export default function DriverOfferScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(params.token) ? params.token : '';
  const { user } = useAuth();
  const [offer, setOffer] = useState<DriverDispatchOffer | null>(null);
  const [assigned, setAssigned] = useState(false);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const pending = useRef(false);
  const owner = useRef(user?.id);
  owner.current = user?.id;

  useEffect(() => {
    let current = true;
    setOffer(null);setAssigned(false);setMessage('');
    if (!token || user?.role !== 'driver') return;
    setWorking(true);
    driverDispatchOffer(token,'preview').then(result => {
      if (!current) return;
      if (result.status === 'assigned') setAssigned(true);
      else setOffer(result.offer ?? null);
    }).catch(() => {if(current)setMessage('Offer unavailable, expired or not compatible with your approved profile. / Oferta no disponible, vencida o incompatible.');})
      .finally(() => {if(current)setWorking(false);});
    return () => {current=false;};
  }, [token,user?.id,user?.role]);

  async function accept() {
    if (!offer || pending.current || working) return;
    pending.current = true;setWorking(true);setMessage('');
    const originalOwner = owner.current;
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken || owner.current !== originalOwner) return;
      const result = await driverDispatchOffer(token,'accept',sessionToken);
      if (owner.current === originalOwner && result.status === 'assigned') {setAssigned(true);setOffer(null);}
    } catch (error) {
      if (owner.current !== originalOwner) return;
      const code = error instanceof Error ? error.message : '';
      setMessage(code === 'offer_unavailable_or_ineligible'
        ? 'This offer is no longer available for your profile. / Esta oferta ya no está disponible para tu perfil.'
        : 'Acceptance was not confirmed. Open Assigned Trips before retrying. / Aceptación sin confirmar: revisá tus viajes asignados antes de reintentar.');
    } finally {pending.current=false;setWorking(false);}
  }

  return <SafeAreaView style={s.safe} edges={['bottom']}><ScrollView contentContainerStyle={s.page}>
    <Text style={s.kicker}>B1 ONE · WHATSAPP</Text>
    <Text style={s.title}>Trip offer / Oferta de viaje</Text>
    {!token ? <Text style={s.help}>Invalid invitation. Open the full link from WhatsApp. / Abrí el enlace completo de WhatsApp.</Text>
      : user?.role !== 'driver' ? <>
        <Text style={s.help}>Sign in with your approved driver account, then return here. Registration alone does not enable acceptance. / Iniciá sesión como conductor aprobado y volvé a esta oferta.</Text>
        <Pressable style={s.button} onPress={()=>router.push('/account')} accessibilityRole="button"><Text style={s.buttonText}>SIGN IN / INICIAR SESIÓN</Text></Pressable>
        <Pressable style={s.button} onPress={()=>router.push('/driver-access')} accessibilityRole="button"><Text style={s.buttonText}>ACTIVATE APPROVED ACCESS / ACTIVAR ACCESO</Text></Pressable>
      </> : assigned ? <>
        <Text style={s.help}>Assigned to you. Passenger and pickup details are now in your driver account. / Viaje asignado: los detalles completos están en tu cuenta.</Text>
        <Pressable style={s.button} onPress={()=>router.replace('/driver-access')} accessibilityRole="button"><Text style={s.buttonText}>OPEN ASSIGNED TRIPS / VER VIAJES</Text></Pressable>
      </> : offer ? <View style={s.card}>
        <Text style={s.summary}>{offer.summary}</Text>
        <Text style={s.help}>{offer.pickup_date_text} · {offer.pickup_time_text} · {offer.market_id}</Text>
        <Text style={s.help}>{offer.vehicle_class_id.toUpperCase()} · {offer.passenger_count} passenger(s) / pasajeros</Text>
        <Text style={s.summary}>{new Intl.NumberFormat(undefined,{style:'currency',currency:offer.currency}).format(Number(offer.amount_minor)/100)}</Text>
        <Text style={s.help}>Driver offer; charges under your platform plan are separate. / Oferta al conductor; los cargos de tu plan se registran aparte.</Text>
        <Text style={s.help}>Confirm your schedule is free for this service. The first eligible driver to confirm gets the trip. Opening this link does not reserve it. / Confirmá que tu agenda esté libre para este servicio. El primero habilitado que confirme obtiene el viaje. Abrir el enlace no lo reserva.</Text>
        <Pressable style={[s.button,working&&s.disabled]} onPress={accept} disabled={working} accessibilityRole="button"><Text style={s.buttonText}>{working?'CONFIRMING / CONFIRMANDO…':'ACCEPT TRIP / ACEPTAR VIAJE'}</Text></Pressable>
      </View> : working ? <Text style={s.help}>Loading offer / Cargando oferta…</Text> : null}
    {message ? <Text style={s.help} accessibilityRole="alert">{message}</Text> : null}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:theme.colors.background},page:{padding:22,gap:16},kicker:{color:theme.colors.cyan,fontWeight:'800'},title:{fontSize:30,fontWeight:'900',color:theme.colors.text},help:{fontSize:15,lineHeight:23,color:theme.colors.muted},summary:{fontSize:22,fontWeight:'800',color:theme.colors.text},card:{padding:18,gap:15,borderRadius:18,backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border},button:{padding:17,backgroundColor:theme.colors.cyan,borderRadius:12,marginTop:10},buttonText:{color:theme.colors.onAccent,fontWeight:'800',textAlign:'center'},disabled:{opacity:0.5}});
