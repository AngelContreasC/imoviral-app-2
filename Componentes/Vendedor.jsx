import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';

const T = {
  gold:      '#A07840',
  goldHover: '#C39B5F',
  bg:        '#0A0A0A',
  bgAlt:     '#111110',
  text:      '#F5F5F0',
  muted:     '#8A8A84',
  border:    'rgba(255,255,255,0.08)',
  borderMid: 'rgba(255,255,255,0.25)',
  serif:     Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:      Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const LISTA_AMENIDADES = [
  "Alberca Infinita", "Gimnasio VIP", "Seguridad 24/7", "Cochera Eléctrica",
  "Terraza con Vista", "Acabados de Mármol", "Bodega Privada", "Calefacción Central",
  "Área de Asadores", "Jacuzzi Premium", "Cocina de Chef", "Paneles Solares",
  "Elevador Privado", "Sala de Cine", "Salón de Eventos", "Jardín Amplio",
  "Cava de Vinos", "Domótica Inteligente", "Cuarto de Servicio", "Piso Radiante"
];

const SERVICIOS_VIRALES = [
  { key: 'asesor',      titulo: 'Asesoramiento Agente INMOVIRAL', icon: '💼', desc: 'Acompañamiento legal completo, análisis comparativo de mercado, due diligence notarial y soporte estratégico patrimonial de principio a fin.' },
  { key: 'mudanza',     titulo: 'Ayuda con la Mudanza', icon: '🚚', desc: 'Logística de traslado patrimonial, embalaje técnico y seguro de bienes premium incluido de puerta a puerta.' },
  { key: 'redes',       titulo: 'Exposición en Redes Sociales', icon: '📱', desc: 'Campañas de marketing digital segmentadas en Instagram, Facebook y TikTok Ads para captar leads calificados.' },
  { key: 'fotografia',  titulo: 'Fotografía Profesional', icon: '📷', desc: 'Sesión fotográfica de alta gama, levantamiento cinemático con drones 4K y diseño de tour virtual 360°.' },
  { key: 'limpieza',    titulo: 'Limpieza Profunda Antes de la Visita', icon: '✨', desc: 'Detallado estético de interiores y sanitización profunda pre-visita con estándares de hotel de 5 estrellas.' },
];

// 📷 GALERÍA PREMIUM DE TRANSMISIÓN PARA EL FADE CONTINUO DEL HERO IZQUIERDO
const HERO_GALLERY = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200'
];

const TIPO_OPTIONS    = ['Casa', 'Departamento', 'Terreno', 'Local Comercial'];
const OP_OPTIONS      = ['Venta', 'Renta', 'Ambas'];
const ANTIGUEDAD_OPTIONS = [
  { value: 'nueva',  label: 'Nueva / A Estrenar' },
  { value: 'lt5',    label: 'Menos de 5 años' },
  { value: '5-10',   label: '5 a 10 años' },
  { value: '10-20',  label: '10 a 20 años' },
  { value: 'gt20',   label: 'Más de 20 años' },
];

function Counter({ label, value, onChange, min = 0, max = 10 }) {
  const [hoverMinus, setHoverMinus] = useState(false);
  const [hoverPlus, setHoverPlus] = useState(false);

  return (
    <View style={s.counterField}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.counterRow}>
        <Pressable 
          onPress={() => onChange(Math.max(min, value - 1))} 
          onMouseEnter={() => Platform.OS === 'web' && setHoverMinus(true)}
          onMouseLeave={() => Platform.OS === 'web' && setHoverMinus(false)}
          style={[s.counterBtn, hoverMinus && s.btnInteractiveHover]}
        >
          <Text style={s.counterBtnText}>−</Text>
        </Pressable>
        <Text style={s.counterValue}>{value}</Text>
        <Pressable 
          onPress={() => onChange(Math.min(max, value + 1))} 
          onMouseEnter={() => Platform.OS === 'web' && setHoverPlus(true)}
          onMouseLeave={() => Platform.OS === 'web' && setHoverPlus(false)}
          style={[s.counterBtn, hoverPlus && s.btnInteractiveHover]}
        >
          <Text style={s.counterBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OptionSelector({ label, options, value, onChange }) {
  const [hoveredOpt, setHoveredOpt] = useState(null);

  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.optionGrid}>
        {options.map(opt => (
          <Pressable 
            key={opt} 
            onPress={() => onChange(opt)} 
            onMouseEnter={() => Platform.OS === 'web' && setHoveredOpt(opt)}
            onMouseLeave={() => Platform.OS === 'web' && setHoveredOpt(null)}
            style={[
              s.optionBtn, 
              value === opt && s.optionBtnActive,
              hoveredOpt === opt && s.btnInteractiveHover
            ]}
          >
            <Text style={[s.optionText, value === opt && s.optionTextActive]}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable 
      onPress={onPress} 
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.chip, 
        active && s.chipActive,
        hovered && s.btnInteractiveHover
      ]}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{active ? '✓ ' : ''}{label}</Text>
    </Pressable>
  );
}

function WebMapContainer({ lat, lng, confirmed, onChange, onConfirm }) {
  const containerId = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const loadLeaflet = async () => {
      if (!window.L) {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
        }
        await new Promise((resolve) => {
          const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve; document.head.appendChild(script);
        });
      }
      const L = window.L;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
      
      const map = L.map(containerId.current).setView([lat || 28.6353, lng || -106.0889], lat ? 16 : 12);
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      const marker = L.marker([lat || 28.6353, lng || -106.0889], { draggable: true }).addTo(map);
      markerRef.current = marker;

      const syncPos = async (nlat, nlng) => {
        onChange(nlat, nlng);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nlat}&lon=${nlng}`, { headers: { 'Accept-Language': 'es', 'User-Agent': 'InmoViral/1.0' } });
          const data = await res.json();
          if (data?.address) {
            const a = data.address;
            onConfirm(nlat, nlng, {
              calle: [a.road, a.house_number].filter(Boolean).join(' ') || '',
              colonia: a.suburb || a.neighbourhood || a.quarter || '',
              ciudad: a.city || a.town || a.village || '', estado: a.state || '', cp: a.postcode || '', busqueda: data.display_name || ''
            });
          }
        } catch (e) { console.log(e); }
      };
      marker.on('dragend', () => { const p = marker.getLatLng(); syncPos(p.lat, p.lng); });
      map.on('click', (e) => { marker.setLatLng(e.latlng); syncPos(e.latlng.lat, e.latlng.lng); });
    };
    
    setTimeout(loadLeaflet, 60);
    return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  return (
    <View style={{ position: 'relative', marginTop: 12 }}>
      <View nativeID={containerId.current} style={[s.webMapFrame, { borderColor: confirmed ? T.gold : 'rgba(220,80,80,0.5)' }]} />
      <View style={s.mapOverlayBadge}>
        <Text style={{ color: confirmed ? T.gold : '#e08a8a', fontSize: 10, fontFamily: T.sans, letterSpacing: 1 }}>{confirmed ? '✓ UBICACIÓN CONFIRMADA' : '📍 SELECCIONA EN EL MAPA / ARRASTRA EL PIN'}</Text>
      </View>
    </View>
  );
}

export default function Vendedor({ onVolver, propiedadParaEditar }) {
  const { t } = useTranslation(); const { user } = useAuth(); const { width } = useWindowDimensions(); const isWide = width > 1024;
  const WIZARD_STEPS = [{ n: 1, label: 'Ubicación' }, { n: 2, label: 'Detalles' }, { n: 3, label: 'Amenidades' }, { n: 4, label: 'Servicios' }];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    tipo: '', operacion: '', busqueda: '', calle: '', colonia: '', ciudad: '', estado: '', cp: '', pais: 'México',
    lat: '', lng: '', recamaras: 1, banos: 1, estacionamientos: 0, antiguedad: '',
    titulo: '', precio: '', superficie: '', descripcion: '', amenidades: [], servicios: [], nombre: '', telefono: '',
    divisa: 'MXN', lada: '+52'
  });

  const [fotos, setFotos] = useState([]); const [enviado, setEnviado] = useState(false); const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(''); const [progresoSubida, setProgresoSubida] = useState('');
  const [mapaPinConfirmado, setMapaPinConfirmado] = useState(false); const [expandedServices, setExpandedServices] = useState([]);

  // Hovers para control del Wizard y Navegación principal
  const [hoverNext, setHoverNext] = useState(false);
  const [hoverPrev, setHoverCE, setHoverPrevState] = useState(false);
  const [hoverBack, setHoverBack] = useState(false);
  const [hoveredMiniInc, setHoveredMiniInc] = useState(null);

  // 🎬 INSTANCIAS DE ANIMACIÓN PARA EL SMOOTH CROSS-FADE DE IMÁGENES
  const heroFade = useRef(new Animated.Value(1)).current;
  const [heroImgIdx, setHeroImgIdx] = useState(0);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (propiedadParaEditar) {
      const telContacto = propiedadParaEditar.telefono_contacto || '';
      const ladaPart = telContacto.startsWith('+') ? telContacto.split(' ')[0] : '+52';
      const telefonoPart = telContacto.startsWith('+') ? telContacto.split(' ').slice(1).join(' ') : telContacto;

      setForm({
        tipo: propiedadParaEditar.tipo_inmueble || '',
        operacion: propiedadParaEditar.operacion || propiedadParaEditar.tipo_transaccion || '',
        busqueda: propiedadParaEditar.ubicacion || '',
        calle: propiedadParaEditar.calle || '',
        colonia: propiedadParaEditar.colonia || '',
        ciudad: propiedadParaEditar.ciudad || '',
        estado: propiedadParaEditar.estado || '',
        cp: propiedadParaEditar.cp || '',
        pais: propiedadParaEditar.pais || 'México',
        lat: propiedadParaEditar.lat ? String(propiedadParaEditar.lat) : '',
        lng: propiedadParaEditar.lng ? String(propiedadParaEditar.lng) : '',
        recamaras: propiedadParaEditar.habitaciones || 1,
        banos: propiedadParaEditar.banos || 1,
        estacionamientos: propiedadParaEditar.estacionamientos || 0,
        antiguedad: propiedadParaEditar.antiguedad || '',
        titulo: propiedadParaEditar.titulo || '',
        precio: propiedadParaEditar.precio ? String(propiedadParaEditar.precio) : '',
        superficie: propiedadParaEditar.m2 ? String(propiedadParaEditar.m2) : '',
        descripcion: propiedadParaEditar.descripcion || '',
        amenidades: propiedadParaEditar.amenidades || [],
        servicios: propiedadParaEditar.servicios_solicitados || [],
        nombre: propiedadParaEditar.nombre_contacto || '',
        telefono: telefonoPart,
        divisa: 'MXN',
        lada: ladaPart
      });
      if (propiedadParaEditar.imagenes) {
        setFotos(propiedadParaEditar.imagenes.map((url, idx) => ({ id: `${url}-${idx}`, uri: url, filename: `photo_${idx}.jpg`, isExisting: true })));
      }
      setMapaPinConfirmado(true);
    } else if (user) {
      const fullPhone = user.user_metadata?.phone || '';
      let ladaPart = '+52';
      let phonePart = fullPhone;
      if (fullPhone.startsWith('+')) {
        if (fullPhone.startsWith('+52')) {
          ladaPart = '+52';
          phonePart = fullPhone.substring(3);
        } else {
          ladaPart = fullPhone.substring(0, 3);
          phonePart = fullPhone.substring(3);
        }
      }
      setForm(prev => ({
        ...prev,
        nombre: prev.nombre || user.user_metadata?.full_name || '',
        lada: ladaPart,
        telefono: prev.telefono || phonePart || ''
      }));
    }
  }, [user, propiedadParaEditar]);

  // 🔄 LOOP AUTOMÁTICO DE DESVANECIMIENTO CRUZADO (CADA 2.5 SEGUNDOS)
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(heroFade, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start(() => {
        setHeroImgIdx((prev) => (prev + 1) % HERO_GALLERY.length);
        Animated.timing(heroFade, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [heroFade]);

  const tituloLetras = form.titulo ? form.titulo.length : 0;
  const descLetras = form.descripcion ? form.descripcion.length : 0;
  const tituloCumple = tituloLetras >= 10; const descCumple = descLetras >= 20;

  const canNext = () => {
    if (step === 1) {
      const baseOk = form.tipo && form.operacion && form.antiguedad;
      return Platform.OS === 'web' ? baseOk && mapaPinConfirmado : baseOk && form.ciudad.trim();
    }
    if (step === 2) return tituloCumple && form.precio.trim() && descCumple && fotos.length >= 3;
    return true;
  };

  const formatearPrecio = (texto) => {
    const conComas = texto.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','); set('precio', conComas);
  };

  const procesarSuperficie = (texto) => {
    let limpio = texto.replace(/[^\d]/g, ''); if (limpio && parseInt(limpio, 10) > 9999) limpio = '9999'; set('superficie', limpio);
  };

  const moverFoto = (index, direccion) => {
    const target = direccion === 'left' ? index - 1 : index + 1; if (target < 0 || target >= fotos.length) return;
    const arr = [...fotos]; const temp = arr[index]; arr[index] = arr[target]; arr[target] = temp; setFotos(arr);
  };

  const toggleAccordionView = (key) => {
    setExpandedServices(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const procesarSeleccionImagenes = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) {
      const espacio = 15 - fotos.length;
      const nuevas = result.assets.slice(0, espacio).map((asset, i) => ({ id: `${asset.uri}-${i}-${Math.random().toString(36).slice(2)}`, uri: asset.uri, filename: asset.fileName || `photo_${Date.now()}_${i}.jpg` }));
      setFotos(prev => [...prev, ...nuevas]);
    }
  };

  const removeFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));
  const toggleServicioSeleccion = (key) => setForm(prev => ({ ...prev, servicios: prev.servicios.includes(key) ? prev.servicios.filter(s => s !== key) : [...prev.servicios, key] }));

  const handleSubmit = async () => {
    if (step < 4) { if (canNext()) setStep(sVal => sVal + 1); return; }
    setErrorEnvio(''); setEnviando(true);
    try {
      const ubicacion = [form.colonia, form.ciudad, form.estado].filter(Boolean).join(', ') || form.busqueda || form.calle;
      const urlsImagenes = [];
      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];
        if (foto.isExisting) {
          urlsImagenes.push(foto.uri);
        } else {
          setProgresoSubida(t('vw_subiendo_foto', { current: i + 1, total: fotos.length }));
          const resp = await fetch(foto.uri); const blob = await resp.blob();
          const path = `${user?.id || 'anonimo'}/${Date.now()}_${i}.${foto.filename?.split('.').pop() || 'jpg'}`;
          const { error: uploadError } = await supabase.storage.from('propiedades').upload(path, blob, { cacheControl: '3600', upsert: false });
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('propiedades').getPublicUrl(path); urlsImagenes.push(publicUrlData.publicUrl);
        }
      }

      // Clean duplicate country code / lada code
      let cleanedTelefono = form.telefono.trim();
      const ladaClean = form.lada.trim();
      if (cleanedTelefono.startsWith(ladaClean)) {
        cleanedTelefono = cleanedTelefono.substring(ladaClean.length).trim();
      }
      cleanedTelefono = cleanedTelefono.replace(/[\s\-()]/g, '');
      const fullTelefonoContacto = `${ladaClean} ${cleanedTelefono}`;

      if (propiedadParaEditar) {
        const isAdmin = user?.isAdmin || user?.email === 'admin@inmoviral.com' || user?.id === 'admin-id-0000';
        const emailContactoFinal = isAdmin ? (propiedadParaEditar.email_contacto || null) : (user?.email || null);
        const avatarContactoFinal = isAdmin ? (propiedadParaEditar.avatar_url_contacto || null) : (user?.user_metadata?.avatar_url || null);

        const { error: updateError } = await supabase.from('propiedades').update({
          titulo: form.titulo, tipo_transaccion: form.operacion === 'Renta' ? 'Renta' : 'Venta', operacion: form.operacion,
          tipo_inmueble: form.tipo, precio: parseFloat(String(form.precio).replace(/[^\d.]/g, '')) || 0, ubicacion, calle: form.calle, colonia: form.colonia, ciudad: form.ciudad, estado: form.estado, cp: form.cp, pais: form.pais,
          lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null, habitaciones: form.recamaras, banos: form.banos, estacionamientos: form.estacionamientos, antiguedad: form.antiguedad, m2: form.superficie ? parseFloat(form.superficie) : null, descripcion: form.descripcion, amenidades: form.amenidades, servicios_solicitados: form.servicios, imagenes: urlsImagenes, nombre_contacto: form.nombre, telefono_contacto: fullTelefonoContacto, email_contacto: emailContactoFinal, avatar_url_contacto: avatarContactoFinal
        }).eq('id', propiedadParaEditar.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('propiedades').insert([{
          user_id: user?.id || null, propietario_id: user?.id || null, titulo: form.titulo, tipo_transaccion: form.operacion === 'Renta' ? 'Renta' : 'Venta', operacion: form.operacion,
          tipo_inmueble: form.tipo, precio: parseFloat(String(form.precio).replace(/[^\d.]/g, '')) || 0, ubicacion, calle: form.calle, colonia: form.colonia, ciudad: form.ciudad, estado: form.estado, cp: form.cp, pais: form.pais,
          lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null, habitaciones: form.recamaras, banos: form.banos, estacionamientos: form.estacionamientos, antiguedad: form.antiguedad, m2: form.superficie ? parseFloat(form.superficie) : null, descripcion: form.descripcion, amenidades: form.amenidades, servicios_solicitados: form.servicios, imagenes: urlsImagenes, nombre_contacto: form.nombre, telefono_contacto: fullTelefonoContacto, email_contacto: user?.email || null, avatar_url_contacto: user?.user_metadata?.avatar_url || null, estatus: 'pendiente'
        }]);
        if (insertError) throw insertError;
      }

      // ✉️ Enviar correo de notificación por EmailJS en el frontend
      try {
        const emailResp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: 'service_tr9ith7',
            template_id: 'template_48abx8o',
            user_id: 'Ytr-HW5hBxuiLfPTy',
            template_params: {
              to_email: user?.email || '',
              email: user?.email || '',
              correo: user?.email || '',
              correo_destinatario: user?.email || '',
              admin_email: user?.email || '',
              from_name: form.nombre,
              reply_to: 'ventas@inmoviral.com.mx',
              titulo: form.titulo,
              tipo: form.tipo,
              operacion: form.operacion,
              precio: form.precio,
              ubicacion: ubicacion,
              descripcion: form.descripcion,
              nombre_contacto: form.nombre,
              telefono_contacto: `${form.lada} ${form.telefono}`,
              correo_contacto: user?.email || '',
              m2: form.superficie || 'N/A',
              habitaciones: form.recamaras,
              banos: form.banos,
              estacionamientos: form.estacionamientos,
              antiguedad: form.antiguedad,
              amenidades: form.amenidades?.join(', ') || 'Ninguna',
              servicios: form.servicios?.join(', ') || 'Ninguno',
              message: propiedadParaEditar 
                ? `Se ha modificado la propiedad:
Título: ${form.titulo}
Tipo: ${form.tipo}
Operación: ${form.operacion}
Precio: $${form.precio}
Ubicación: ${ubicacion}`
                : `Se ha registrado una nueva propiedad:
Título: ${form.titulo}
Tipo: ${form.tipo}
Operación: ${form.operacion}
Precio: $${form.precio}
Ubicación: ${ubicacion}
Contacto: ${form.nombre} (${form.lada} ${form.telefono})`
            }
          })
        });
        if (!emailResp.ok) {
          const errTxt = await emailResp.text();
          console.error('Error al enviar correo en EmailJS:', errTxt);
          if (Platform.OS === 'web') {
            alert('Aviso: La propiedad se guardó pero no se pudo enviar el correo de notificación. Detalles: ' + errTxt);
          }
        }
      } catch (emailErr) {
        console.error('Error al enviar correo por EmailJS:', emailErr);
      }

      setEnviado(true);
    } catch (err) { console.error(err); setErrorEnvio(err.message || 'Error al guardar la propiedad.'); } finally { setEnviando(false); setProgresoSubida(''); }
  };

  if (enviado) {
    return (
      <View style={s.successWrap}>
        <Text style={s.successCheckMark}>✓</Text><Text style={s.successTitle}>¡Propiedad publicada con éxito!</Text>
        <Text style={s.successSub}>Tu registro ha sido enviado correctamente para validación patrimonial.</Text>
        {form.servicios.length > 0 && (
          <View style={s.successServiceBadgeBox}>
            <Text style={s.successServiceBadgeText}>✨ **Atención Logística:** Hemos registrado los servicios opcionales solicitados. Un asesor patrimonial de INMOVIRAL te contactará de forma directa a la brevedad utilizando tu teléfono y LADA para coordinar la agenda de campo.</Text>
          </View>
        )}
        <Pressable onPress={onVolver} style={s.btnSuccessBack}><Text style={s.btnPrimaryText}>VOLVER AL INICIO</Text></Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[s.layoutContainer, isWide && s.layoutContainerWide]}>
          {isWide && (
            <View style={s.leftHeroColumn}>
              {/* 🎬 NODO ASOCIADO AL CAROUSEL DINÁMICO CON CROSS-FADE DE SERVICIOS VIRALES */}
              <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: heroFade }]}>
                <Image source={{ uri: HERO_GALLERY[heroImgIdx] }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              </Animated.View>
              <View style={s.heroDarkOverlay} /><View style={s.heroContentSticky}><View style={s.heroAccentLineRow}><View style={s.heroAccentLine} /><Text style={s.heroEyebrow}>PUBLICAR PROPIEDAD</Text></View><Text style={s.heroTitleText}>Publica tu{'\n'}propiedad <Text style={s.heroTitleItalic}>premium</Text></Text><Text style={s.heroDescText}>Llega de forma directa y exclusiva a miles de compradores e inversionistas calificados de alto valor.</Text></View>
            </View>
          )}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.rightFormColumn, isWide && s.rightFormColumnWide, width <= 768 && { paddingTop: 20 }]} showsVerticalScrollIndicator={false}>
            <View style={s.wizardFormCard}>
              <Text style={s.formMainHeading}>Alta de Inmueble</Text><Text style={s.formStepSubTitle}>{`Paso ${step} de 4`}</Text>
              
              <View style={s.progressRow}>
                {WIZARD_STEPS.map((sItem, idx) => (
                  <React.Fragment key={sItem.n}>
                    <View style={s.progressStepUnit}>
                      <View style={[s.progressCircle, step === sItem.n && s.progressCircleActive, step > sItem.n && s.progressCircleDone]}><Text style={[s.progressCircleText, step === sItem.n && s.progressCircleTextActive, step > sItem.n && s.progressCircleTextDone]}>{step > sItem.n ? '✓' : sItem.n}</Text></View>
                      <Text style={[s.progressStepLabel, step >= sItem.n && s.progressStepLabelActive]}>{sItem.label}</Text>
                    </View>
                    {idx < WIZARD_STEPS.length - 1 && <View style={[s.progressLine, step > sItem.n && s.progressLineActive]} />}
                  </React.Fragment>
                ))}
              </View>

              {step === 1 && (
                <View style={s.animatedStepContainer}>
                  <OptionSelector label="TIPO DE INMUEBLE" options={TIPO_OPTIONS} value={form.tipo} onChange={v => set('tipo', v)} />
                  <OptionSelector label="OPERACIÓN COMERCIAL" options={OP_OPTIONS} value={form.operacion} onChange={v => set('operacion', v)} />
                  <Text style={s.fieldLabel}>DIRECCIÓN DEL INMUEBLE</Text>
                  {[{ k: 'calle', ph: 'Calle y Número Exterior' }, { k: 'colonia', ph: 'Colonia / Fraccionamiento' }, { k: 'ciudad', ph: 'Ciudad' }, { k: 'estado', ph: 'Estado' }, { k: 'cp', ph: 'Código Postal (CP)' }].map(f => (
                    <TextInput key={f.k} style={s.luxuryInput} placeholder={f.ph} placeholderTextColor={T.muted} value={form[f.k]} onChangeText={v => set(f.k, v)} />
                  ))}
                  {Platform.OS === 'web' && (
                    <WebMapContainer lat={form.lat ? parseFloat(form.lat) : null} lng={form.lng ? parseFloat(form.lng) : null} confirmed={mapaPinConfirmado} onChange={(la, ln) => setForm(prev => ({ ...prev, lat: String(la), lng: String(ln) }))} onConfirm={(la, ln, addr) => { setForm(prev => ({ ...prev, lat: String(la), lng: String(ln), ...addr })); setMapaPinConfirmado(true); }} />
                  )}
                  <View style={{ marginTop: 14 }}>
                    <Counter label="RECÁMARAS" value={form.recamaras} onChange={v => set('recamaras', v)} min={1} />
                    <Counter label="BAÑOS COMPLETOS" value={form.banos} onChange={v => set('banos', v)} min={1} />
                    <Counter label="CAJONES DE ESTACIONAMIENTO" value={form.estacionamientos} onChange={v => set('estacionamientos', v)} min={0} />
                  </View>
                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>ANTIGÜEDAD</Text>
                    <View style={{ gap: 6 }}>
                      {ANTIGUEDAD_OPTIONS.map(o => (
                        <Pressable key={o.value} onPress={() => set('antiguedad', o.value)} style={[s.optionBtn, { width: '100%' }, form.antiguedad === o.value && s.optionBtnActive]}><Text style={[s.optionText, form.antiguedad === o.value && s.optionTextActive]}>{o.label}</Text></Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 2 && (
                <View style={s.animatedStepContainer}>
                  <View style={s.labelRowBetween}><Text style={s.fieldLabel}>TÍTULO EXCLUSIVO</Text><Text style={[s.liveCounterText, tituloCumple && s.liveCounterTextValid]}>{tituloLetras}/10</Text></View>
                  <TextInput style={s.luxuryInput} placeholder="Ej. Bonita casa en el Reliz con bonita vista" placeholderTextColor={T.muted} value={form.titulo} onChangeText={v => set('titulo', v)} />
                  <Text style={s.fieldLabel}>PRECIO EVALUADO ($)</Text>
                  <View style={s.hybridInputSelectorBox}>
                    <TextInput style={[s.luxuryInput, { flex: 1, marginBottom: 0 }]} placeholder="0,000,000" placeholderTextColor={T.muted} value={form.precio} onChangeText={formatearPrecio} keyboardType="numeric" maxLength={15} />
                    <View style={s.currencyToggleWrapper}>
                      {['MXN', 'USD'].map(moneda => (
                        <Pressable key={moneda} onPress={() => set('divisa', moneda)} style={[s.currencyMiniBtn, form.divisa === moneda && s.currencyMiniBtnActive]}><Text style={[s.currencyMiniText, form.divisa === moneda && s.currencyMiniTextActive]}>{moneda}</Text></Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={s.labelRowBetween}><Text style={s.fieldLabel}>SUPERFICIE TOTAL M²</Text><Text style={s.liveCounterText}>Max. 9,999 m²</Text></View>
                  <TextInput style={s.luxuryInput} placeholder="Ej. 150" placeholderTextColor={T.muted} value={form.superficie} onChangeText={procesarSuperficie} keyboardType="numeric" maxLength={4} />
                  <View style={s.labelRowBetween}><Text style={s.fieldLabel}>DESCRIPCIÓN EDITORIAL COMPLETA</Text><Text style={[s.liveCounterText, descCumple && s.liveCounterTextValid]}>{descLetras}/20</Text></View>
                  <TextInput style={[s.luxuryInput, s.luxuryTextArea]} placeholder="Ej. Bonita casa en el Reliz con bonita vista, amplios espacios modernos, seguridad las 24 horas y acabados de lujo." placeholderTextColor={T.muted} value={form.descripcion} onChangeText={v => set('descripcion', v)} multiline numberOfLines={4} />
                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>GALERÍA DE IMÁGENES PRESTIGE</Text>
                    <View style={s.fotosFlexGrid}>
                      {fotos.map((f, i) => (
                        <View key={f.id} style={s.fotoPreviewBox}>
                          <Image source={{ uri: f.uri }} style={s.fotoImg} />{i === 0 && <Text style={s.coverBadge}>PORTADA</Text>}
                          
                          <View style={s.photoSorterOverlayRow}>
                            <Pressable disabled={i === 0} onPress={() => moverFoto(i, 'left')} style={[s.arrowMoveBtn, i === 0 && { opacity: 0.2 }]}><Text style={s.arrowMoveText}>◀</Text></Pressable>
                            <Pressable disabled={i === fotos.length - 1} onPress={() => moverFoto(i, 'right')} style={[s.arrowMoveBtn, i === fotos.length - 1 && { opacity: 0.2 }]}><Text style={s.arrowMoveText}>▶</Text></Pressable>
                          </View>
                          <Pressable onPress={() => removeFoto(f.id)} style={s.removeFotoBtn}><Text style={{ color: '#fff', fontSize: 10 }}>✕</Text></Pressable>
                        </View>
                      ))}
                      {fotos.length < 15 && <Pressable onPress={procesarSeleccionImagenes} style={s.addFotoPlaceholder}><Text style={s.addFotoPlusText}>+</Text></Pressable>}
                    </View>
                  </View>
                </View>
              )}

              {step === 3 && (
                <View style={s.animatedStepContainer}>
                  <Text style={s.fieldLabel}>AMENIDADES RESIDENCIALES</Text>
                  <View style={s.chipsFlexRow}>
                    {LISTA_AMENIDADES.map(item => {
                      const active = form.amenidades.includes(item);
                      return <Chip key={item} label={item} active={active} onPress={() => setForm(prev => ({ ...prev, amenidades: active ? prev.amenidades.filter(a => a !== item) : [...prev.amenidades, item] }))} />;
                    })}
                  </View>
                </View>
              )}

              {step === 4 && (
                <View style={s.animatedStepContainer}>
                  <Text style={s.fieldLabel}>CAMPOS DIGITALES VIRALES SOLICITADOS</Text>
                  <View style={{ gap: 10, marginBottom: 20 }}>
                    {SERVICIOS_VIRALES.map(sv => {
                      const isSelected = form.servicios.includes(sv.key); const isExpanded = expandedServices.includes(sv.key);
                      return (
                        <View key={sv.key} style={[s.accordionCardContainer, isSelected && s.accordionCardContainerActive]}>
                          <Pressable onPress={() => toggleAccordionView(sv.key)} style={s.accordionHeaderRow}>
                            <View style={s.accordionLeftInfo}><Text style={s.accordionIconText}>{sv.icon}</Text><Text style={s.accordionTitleText}>{sv.titulo}</Text></View>
                            <View style={s.accordionRightControls}>
                              
                              {/* BADGE DE ACCIÓN INTERACTIVO "+ INCLUIR" CON ESCALADO EN HOVER */}
                              <Pressable 
                                onPress={() => toggleServicioSeleccion(sv.key)} 
                                onMouseEnter={() => Platform.OS === 'web' && setHoveredMiniInc(sv.key)}
                                onMouseLeave={() => Platform.OS === 'web' && setHoveredMiniInc(null)}
                                style={[
                                  s.miniActionBadge, 
                                  isSelected && s.miniActionBadgeActive,
                                  hoveredMiniInc === sv.key && s.btnInteractiveHover
                                ]}
                              >
                                <Text style={[s.miniActionBadgeText, isSelected && s.miniActionBadgeTextActive]}>
                                  {isSelected ? '✓ INCLUIDO' : '+ INCLUIR'}
                                </Text>
                              </Pressable>
                              
                              <Text style={s.accordionArrowLabel}>{isExpanded ? '▲' : '▼'}</Text>
                            </View>
                          </Pressable>
                          {isExpanded && (
                            <View style={s.accordionBodyContent}>
                              <View style={s.accordionDividerLine} /><Text style={s.accordionDescText}>{sv.desc}</Text>
                              <View style={s.accordionPriceRow}>
                                <Text style={s.accordionPriceLabel}>INVERSIÓN ESTIMADA:</Text>
                                {/* 🛠️ FILTRADO DEL ASESOR: PINTA SOLAMENTE GRATIS TOTALMENTE PURIFICADO */}
                                <Text style={[s.accordionPriceValue, sv.key !== 'asesor' && s.accordionPriceValueFlexible]}>
                                  {sv.key === 'asesor' ? 'GRATIS' : 'Nos comunicaremos contigo dependiendo de los requerimientos y el tamaño de la propiedad.'}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <Text style={s.fieldLabel}>NOMBRE COMPLETO DEL CONTACTO</Text>
                  <TextInput style={s.luxuryInput} placeholder="Ej. Elias Javier Quiñonez Reynoso" placeholderTextColor={T.muted} value={form.nombre} onChangeText={v => set('nombre', v)} />
                  <Text style={s.fieldLabel}>TELÉFONO DE CONTACTO DIRECTO</Text>
                  <View style={s.ladaPhoneFlexRow}>
                    <View style={s.ladaInputWrapper}><TextInput style={[s.luxuryInput, { marginBottom: 0, textAlign: 'center' }]} placeholder="+52" placeholderTextColor={T.muted} value={form.lada} onChangeText={v => set('lada', v)} maxLength={4} keyboardType="phone-pad" /></View>
                    <TextInput style={[s.luxuryInput, s.phoneInputBox]} placeholder="614 123 4567" placeholderTextColor={T.muted} value={form.telefono} onChangeText={v => set('telefono', v)} keyboardType="phone-pad" />
                  </View>
                  {errorEnvio ? <View style={s.errorBadgeBox}><Text style={s.errorBadgeText}>{errorEnvio}</Text></View> : null}
                </View>
              )}

              <View style={s.wizardNavRow}>
                {step > 1 && !enviando && (
                  <Pressable 
                    onPress={() => setStep(sVal => sVal - 1)} 
                    onMouseEnter={() => Platform.OS === 'web' && setHoverPrevState(true)}
                    onMouseLeave={() => Platform.OS === 'web' && setHoverPrevState(false)}
                    style={[s.btnSecondary, hoverPrev && s.btnInteractiveHover]}
                  >
                    <Text style={s.btnSecondaryText}>Atrás</Text>
                  </Pressable>
                )}
                
                <Pressable 
                  onPress={handleSubmit} 
                  disabled={!canNext() || enviando} 
                  onMouseEnter={() => Platform.OS === 'web' && canNext() && setHoverNext(true)}
                  onMouseLeave={() => Platform.OS === 'web' && setHoverNext(false)}
                  style={[
                    s.btnPrimary, 
                    (!canNext() || enviando) && s.btnPrimaryDisabled,
                    hoverNext && s.btnInteractiveHover
                  ]}
                >
                  {enviando ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.btnPrimaryText}>{progresoSubida || (step < 4 ? 'Siguiente' : 'Publicar Inmueble')}</Text>}
                </Pressable>
              </View>

              {/* BOTÓN VOLVER TOTALMENTE SANEADO CON EFECTO DE ESCALADO CORPORATIVO */}
              <Pressable 
                onPress={onVolver} 
                onMouseEnter={() => Platform.OS === 'web' && setHoverBack(true)}
                onMouseLeave={() => Platform.OS === 'web' && setHoverBack(false)}
                style={[s.cancelBackLuxeBtn, hoverBack && s.btnInteractiveHover]}
              >
                <Text style={s.cancelBackLuxeBtnText}>← VOLVER AL MENÚ DE INICIO</Text>
              </Pressable>

            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  layoutContainer: { flex: 1, flexDirection: 'column' },
  layoutContainerWide: { flexDirection: 'row' },
  leftHeroColumn: { flex: 1, position: 'relative', justifyContent: 'center', padding: 56 },
  heroDarkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,16,10,0.82)' },
  heroContentSticky: { zIndex: 10, maxWidth: 450 },
  heroAccentLineRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  heroAccentLine: { width: 40, height: 1, backgroundColor: T.gold },
  heroEyebrow: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: T.gold, fontFamily: T.sans, fontWeight: '600' },
  heroTitleText: { fontFamily: T.serif, fontSize: 48, color: T.text, lineHeight: 56, fontWeight: '300', marginBottom: 20 },
  heroTitleItalic: { fontStyle: 'italic', color: T.gold },
  heroDescText: { fontSize: 13, lineHeight: 24, color: T.text, opacity: 0.75, fontFamily: T.sans, fontWeight: '300' },
  rightFormColumn: { backgroundColor: '#0A100A', paddingTop: Platform.select({ web: 100, default: 80 + (Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24)) }) },
  rightFormColumnWide: { borderLeftWidth: 1, borderColor: T.border },
  wizardFormCard: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center', marginVertical: 20 },
  formMainHeading: { fontFamily: T.serif, fontSize: 26, color: T.text, marginBottom: 6 },
  formStepSubTitle: { fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 },
  animatedStepContainer: { paddingBottom: 10 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: T.gold, fontFamily: T.sans, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  luxuryInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: T.border, paddingHorizontal: 16, paddingVertical: 14, color: T.text, fontSize: 13, fontFamily: T.sans, marginBottom: 10 },
  luxuryTextArea: { minHeight: 90, textAlignVertical: 'top' },
  hybridInputSelectorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: T.border, marginBottom: 10, paddingRight: 6 },
  currencyToggleWrapper: { flexDirection: 'row', gap: 4, paddingLeft: 8 },
  currencyMiniBtn: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' },
  currencyMiniBtnActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.15)' },
  currencyMiniText: { color: T.muted, fontSize: 9, fontFamily: T.sans, fontWeight: '700' },
  currencyMiniTextActive: { color: T.gold },
  labelRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  liveCounterText: { fontSize: 10, fontFamily: T.sans, color: T.muted, letterSpacing: 0.5 },
  liveCounterTextValid: { color: T.gold, fontWeight: '600' },
  counterField: { marginBottom: 14 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: T.border, padding: 10 },
  counterValue: { color: T.text, fontSize: 15, fontFamily: T.serif, fontWeight: '600' },
  counterBtn: { width: 32, height: 32, backgroundColor: 'rgba(160,120,64,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)' },
  counterBtnText: { color: T.gold, fontSize: 16, fontWeight: '600' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optionBtn: { flex: 1, minWidth: '45%', paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center' },
  optionBtnActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.15)' },
  optionText: { color: T.muted, fontSize: 11, fontFamily: T.sans, fontWeight: '600' },
  optionTextActive: { color: T.gold },
  fotosFlexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fotoPreviewBox: { width: 105, height: 105, position: 'relative', borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  fotoImg: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: T.gold, color: '#000', fontSize: 7, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', paddingVertical: 2, zIndex: 10 },
  photoSorterOverlayRow: { position: 'absolute', bottom: 4, left: 4, right: 4, flexDirection: 'row', justifyContent: 'space-between', zIndex: 12 },
  arrowMoveBtn: { width: 22, height: 22, backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', justifyContent: 'center', alignItems: 'center' },
  arrowMoveText: { color: T.gold, fontSize: 9, fontWeight: '700' },
  removeFotoBtn: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 15 },
  addFotoPlaceholder: { width: 105, height: 105, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(160,120,64,0.4)', backgroundColor: 'rgba(160,120,64,0.03)', justifyContent: 'center', alignItems: 'center' },
  addFotoPlusText: { color: T.gold, fontSize: 24, fontWeight: '300' },
  chipsFlexRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.02)' },
  chipActive: { borderColor: T.gold, backgroundColor: T.gold },
  chipText: { color: T.muted, fontSize: 11, fontFamily: T.sans },
  chipTextActive: { color: '#000', fontWeight: '600' },
  accordionCardContainer: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: T.border, padding: 16, marginBottom: 4 },
  accordionCardContainerActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.04)' },
  accordionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionLeftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accordionIconText: { fontSize: 16 },
  accordionTitleText: { fontFamily: T.serif, fontSize: 14, color: T.text, fontWeight: '400' },
  accordionRightControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  miniActionBadge: { paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  miniActionBadgeActive: { backgroundColor: T.gold, borderColor: T.gold },
  miniActionBadgeText: { color: T.gold, fontSize: 9, fontWeight: '700', fontFamily: T.sans },
  miniActionBadgeTextActive: { color: '#000' },
  accordionArrowLabel: { color: T.gold, fontSize: 11, width: 14, textAlign: 'center' },
  accordionBodyContent: { marginTop: 12, gap: 8 },
  accordionDividerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  accordionDescText: { fontSize: 12, color: T.muted, lineHeight: 18, fontFamily: T.sans, fontWeight: '300' },
  accordionPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderWidth: 0.5, borderColor: T.border },
  accordionPriceLabel: { fontSize: 9, color: T.gold, letterSpacing: 1, fontWeight: '600', fontFamily: T.sans },
  accordionPriceValue: { fontSize: 12, color: T.gold, fontWeight: '700', fontFamily: T.sans, letterSpacing: 0.5 },
  accordionPriceValueFlexible: { fontSize: 11, textAlign: 'right', flex: 1, paddingLeft: 16, fontWeight: '400', color: T.muted },
  ladaPhoneFlexRow: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' },
  ladaInputWrapper: { width: 75 },
  phoneInputBox: { flex: 1, marginBottom: 0, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: T.border, paddingHorizontal: 16, paddingVertical: 14, color: T.text, fontSize: 13, fontFamily: T.sans },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 20, width: '100%', paddingHorizontal: 4 },
  progressStepUnit: { alignItems: 'center', width: 64 },
  progressCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(184,150,106,0.25)', backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  progressCircleActive: { backgroundColor: T.gold, borderColor: T.gold },
  progressCircleDone: { backgroundColor: 'rgba(184,150,106,0.12)', borderColor: T.gold },
  progressCircleText: { color: T.muted, fontFamily: T.serif, fontSize: 13, fontWeight: '500' },
  progressCircleTextActive: { color: T.bg, fontWeight: '700' },
  progressCircleTextDone: { color: T.gold },
  progressStepLabel: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.muted, textAlign: 'center', marginTop: 6, fontFamily: T.sans, lineHeight: 12 },
  progressStepLabelActive: { color: T.text },
  progressLine: { flex: 1, height: 1, backgroundColor: 'rgba(184,150,106,0.15)', marginBottom: 18, minWidth: 10 },
  progressLineActive: { backgroundColor: T.gold },
  wizardNavRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  
  // ── REPARADO: BOTÓN SECUNDARIO CON FILTRADO CLARO DE TEXTO Y CONTRASTE SÓLIDO POR BORDE
  btnSecondary: { paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: T.gold, backgroundColor: '#141412', justifyContent: 'center' },
  btnSecondaryText: { color: T.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: T.sans, fontWeight: '600' },
  
  btnPrimary: { flex: 1, paddingVertical: 14, backgroundColor: T.gold, justifyContent: 'center', alignItems: 'center', minHeight: 48 },
  btnPrimaryDisabled: { opacity: 0.35 },
  btnPrimaryText: { color: '#000', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', fontFamily: T.sans },
  
  // ── REPARADO: BOTÓN VOLVER PREMIUM CON DISEÑO TOTALMENTE RESALTANTE
  cancelBackLuxeBtn: { alignItems: 'center', marginTop: 32, paddingVertical: 14, borderWidth: 1, borderColor: T.gold, backgroundColor: '#141412' },
  cancelBackLuxeBtnText: { color: T.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: T.sans, fontWeight: '700' },
  
  // Token de Animación de Hover para Botones del Sistema (Cala en 1.03 con Sombra Profunda)
  btnInteractiveHover: {
    transform: [{ scale: 1.03 }],
    borderColor: T.gold,
    boxShadow: Platform.OS === 'web' ? '0px 10px 24px rgba(160, 120, 64, 0.28)' : undefined,
  },

  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: T.bg },
  successCheckMark: { fontSize: 54, color: T.gold, marginBottom: 16 },
  successTitle: { fontFamily: T.serif, fontSize: 24, color: T.text, marginBottom: 8, textAlign: 'center' },
  successSub: { fontSize: 13, color: T.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20, maxWidth: 320, fontFamily: T.sans },
  btnSuccessBack: { width: '100%', maxWidth: 260, paddingVertical: 14, backgroundColor: T.gold, justifyContent: 'center', alignItems: 'center', minHeight: 48, borderRadius: 0 },
  successServiceBadgeBox: { padding: 18, backgroundColor: 'rgba(160,120,64,0.06)', borderWidth: 1, borderColor: T.gold, maxWidth: 460, marginBottom: 28 },
  successServiceBadgeText: { color: T.text, fontSize: 12, lineHeight: 20, fontFamily: T.sans, textAlign: 'center', fontWeight: '300' },
  webMapFrame: { width: '100%', height: 280, borderWidth: 1, backgroundColor: '#141412', overflow: 'hidden' }
});