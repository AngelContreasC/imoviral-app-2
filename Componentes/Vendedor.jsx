import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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

// ─────────────────────────────────────────────
// TOKENS DE DISEÑO ULTRA-COMPATIBLES
// ─────────────────────────────────────────────
const T = {
  gold:      '#A07840',
  goldHover: '#C39B5F',
  bg:        '#0A0A0A',
  bgAlt:     '#111110',
  text:      '#F5F5F0',
  muted:     '#8A8A84',
  border:    'rgba(255,255,255,0.08)',
  borderMid: 'rgba(255,255,255,0.25)',
  serif:     Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  sans:      Platform.select({ ios: 'System',  android: 'sans-serif', default: 'System' }),
};

const AMENIDADES_KEYS = Array.from({ length: 20 }, (_, i) => `vw_am_${i + 1}`);

const SERVICIOS_VIRALES = [
  { key: 'mudanza',     titleKey: 'vw_srv1_title', descKey: 'vw_srv1_desc' },
  { key: 'redes',       titleKey: 'vw_srv2_title', descKey: 'vw_srv2_desc' },
  { key: 'fotografia',  titleKey: 'vw_srv3_title', descKey: 'vw_srv3_desc' },
  { key: 'asesor',      titleKey: 'vw_srv4_title', descKey: 'vw_srv4_desc' },
];

const TIPO_OPTIONS    = ['Casa', 'Departamento', 'Terreno', 'Local Comercial'];
const OP_OPTIONS      = ['Venta', 'Renta', 'Ambas'];
const ANTIGUEDAD_OPTIONS = [
  { value: 'nueva',  labelKey: 'vw_antiguedad_opt0' },
  { value: 'lt5',    labelKey: 'vw_antiguedad_opt1' },
  { value: '5-10',   labelKey: 'vw_antiguedad_opt2' },
  { value: '10-20',  labelKey: 'vw_antiguedad_opt3' },
  { value: 'gt20',   labelKey: 'vw_antiguedad_opt4' },
];

// ─────────────────────────────────────────────
// SUBCOMPONENTES UNIVERSALES
// ─────────────────────────────────────────────

function Counter({ label, value, onChange, min = 0, max = 10 }) {
  return (
    <View style={s.counterField}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.counterRow}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={s.counterBtn}>
          <Text style={s.counterBtnText}>−</Text>
        </Pressable>
        <Text style={s.counterValue}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={s.counterBtn}>
          <Text style={s.counterBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OptionSelector({ label, options, value, onChange }) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.optionGrid}>
        {options.map(opt => (
          <Pressable key={opt} onPress={() => onChange(opt)} style={[s.optionBtn, value === opt && s.optionBtnActive]}>
            <Text style={[s.optionText, value === opt && s.optionTextActive]}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>
        {active ? '✓ ' : ''}{label}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: MapaPicker (Seguro para Compilador)
// ─────────────────────────────────────────────
function WebMapContainer({ lat, lng, confirmed, onChange, onConfirm }) {
  const containerId = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const loadLeaflet = async () => {
      if (!window.L) {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();

      const initLat = lat || 28.6353;
      const initLng = lng || -106.0889;

      const map = L.map(containerId.current).setView([initLat, initLng], lat ? 16 : 12);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      const syncPos = async (nlat, nlng) => {
        onChange(nlat, nlng);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nlat}&lon=${nlng}`, {
            headers: { 'Accept-Language': 'es', 'User-Agent': 'InmoViral/1.0' }
          });
          const data = await res.json();
          if (data?.address) {
            const a = data.address;
            onConfirm(nlat, nlng, {
              calle: [a.road, a.house_number].filter(Boolean).join(' ') || '',
              colonia: a.suburb || a.neighbourhood || a.quarter || '',
              ciudad: a.city || a.town || a.village || '',
              estado: a.state || '',
              cp: a.postcode || '',
              busqueda: data.display_name || ''
            });
          }
        } catch (e) { console.log(e); }
      };

      marker.on('dragend', () => {
        const p = marker.getLatLng();
        syncPos(p.lat, p.lng);
      });
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        syncPos(e.latlng.lat, e.latlng.lng);
      });
    };

    loadLeaflet();
    return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  return (
    <View style={{ position: 'relative', marginTop: 12 }}>
      {/* Spread dinámico para evitar errores estáticos de atributos en la View nativa */}
      <View 
        {...(Platform.OS === 'web' ? { id: containerId.current } : {})} 
        style={[s.webMapFrame, { borderColor: confirmed ? T.gold : 'rgba(220,80,80,0.4)' }]} 
      />
      <View style={s.mapOverlayBadge}>
        <Text style={{ color: confirmed ? T.gold : '#e08a8a', fontSize: 10, fontFamily: T.sans, letterSpacing: 1 }}>
          {confirmed ? '✓ UBICACIÓN CONFIRMADA' : '📍 SELECCIONA EN EL MAPA'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Vendedor({ onVolver }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 1024;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    tipo: '', operacion: '', busqueda: '', calle: '', colonia: '', ciudad: '', estado: '', cp: '', pais: 'México',
    lat: '', lng: '', recamaras: 1, banos: 1, estacionamientos: 0, antiguedad: '',
    titulo: '', precio: '', superficie: '', descripcion: '', amenidades: [], servicios: [], nombre: '', telefono: '',
  });

  const [fotos, setFotos] = useState([]);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [progresoSubida, setProgresoSubida] = useState('');
  const [mapaPinConfirmado, setMapaPinConfirmado] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        nombre: prev.nombre || user.user_metadata?.full_name || '',
        telefono: prev.telefono || user.user_metadata?.phone || '',
      }));
    }
  }, [user]);

  const canNext = () => {
    if (step === 1) {
      const baseOk = form.tipo && form.operacion && form.antiguedad;
      if (Platform.OS === 'web') return baseOk && mapaPinConfirmado;
      return baseOk && form.ciudad.trim();
    }
    if (step === 2) {
      return form.titulo.trim() && form.precio.trim() && form.descripcion.trim() && fotos.length >= 3;
    }
    return true;
  };

  const procesarSeleccionImagenes = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const espacio = 15 - fotos.length;
      const nuevas = result.assets.slice(0, espacio).map((asset, i) => ({
        id: `${asset.uri}-${i}-${Math.random().toString(36).slice(2)}`,
        uri: asset.uri,
        filename: asset.fileName || `photo_${Date.now()}_${i}.jpg`,
      }));
      setFotos(prev => [...prev, ...nuevas]);
    }
  };

  const removeFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));

  const handleSubmit = async () => {
    if (step < 4) {
      if (canNext()) setStep(s => s + 1);
      return;
    }

    setErrorEnvio('');
    setEnviando(true);

    try {
      const ubicacion = [form.colonia, form.ciudad, form.estado].filter(Boolean).join(', ') || form.busqueda || form.calle;
      const precioNumerico = parseFloat(String(form.precio).replace(/[^\d.]/g, '')) || 0;
      const urlsImagenes = [];

      for (let i = 0; i < fotos.length; i++) {
        setProgresoSubida(t('vw_subiendo_foto', { current: i + 1, total: fotos.length }));
        const foto = fotos[i];
        const resp = await fetch(foto.uri);
        const blob = await resp.blob();
        
        const ext = foto.filename?.split('.').pop() || 'jpg';
        const path = `${user?.id || 'anonimo'}/${Date.now()}_${i}.${ext}`;

        const { error: uploadError } = await supabase.storage.from('propiedades').upload(path, blob, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('propiedades').getPublicUrl(path);
        urlsImagenes.push(publicUrlData.publicUrl);
      }

      const nuevaPropiedad = {
        user_id: user?.id || null, propietario_id: user?.id || null, titulo: form.titulo,
        tipo_transaccion: form.operacion === 'Renta' ? 'Renta' : 'Venta', operacion: form.operacion,
        tipo_inmueble: form.tipo, precio: precioNumerico, ubicacion, calle: form.calle, colonia: form.colonia,
        ciudad: form.ciudad, estado: form.estado, cp: form.cp, pais: form.pais,
        lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null,
        habitaciones: form.recamaras, banos: form.banos, estacionamientos: form.estacionamientos,
        antiguedad: form.antiguedad, m2: form.superficie ? parseFloat(String(form.superficie).replace(/[^\d.]/g, '')) : null,
        descripcion: form.descripcion, amenidades: form.amenidades, servicios_solicitados: form.servicios,
        imagenes: urlsImagenes, nombre_contacto: form.nombre, telefono_contacto: form.telefono, estatus: 'pendiente',
      };

      const { error: insertError } = await supabase.from('propiedades').insert([nuevaPropiedad]);
      if (insertError) throw insertError;

      setEnviado(true);
    } catch (err) {
      console.error(err);
      setErrorEnvio(err.message || t('vw_error_publicar'));
    } finally {
      setEnviando(false);
      setProgresoSubida('');
    }
  };

  if (enviado) {
    return (
      <View style={s.successWrap}>
        <Text style={s.successCheckMark}>✓</Text>
        <Text style={s.successTitle}>{t('vw_publicado_msg', { defaultValue: '¡Propiedad publicada!' })}</Text>
        <Text style={s.successSub}>{t('vw_publicado_anonimo')}</Text>
        <Pressable onPress={onVolver} style={s.btnPrimary}><Text style={s.btnPrimaryText}>{t('vw_volver')}</Text></Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[s.layoutContainer, isWide && s.layoutContainerWide]}>
          
          {/* COLUMNA IZQUIERDA: HERO EDITORIAL */}
          {isWide && (
            <View style={s.leftHeroColumn}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200' }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <View style={s.heroDarkOverlay} />
              <View style={s.heroContentSticky}>
                <View style={s.heroAccentLineRow}>
                  <View style={s.heroAccentLine} />
                  <Text style={s.heroEyebrow}>{t('vd_eyebrow')}</Text>
                </View>
                <Text style={s.heroTitleText}>
                  {t('vd_h1_1')} {'\n'}{t('vd_h1_2')} <Text style={s.heroTitleItalic}>{t('vd_h1_em')}</Text>{'\n'}{t('vd_h1_3')}
                </Text>
                <Text style={s.heroDescText}>{t('vd_hero_sub')}</Text>
              </View>
            </View>
          )}

          {/* COLUMNA DERECHA: FORMULARIO */}
          <ScrollView contentContainerStyle={[s.rightFormColumn, isWide && s.rightFormColumnWide]} showsVerticalScrollIndicator={false}>
            <View style={s.wizardFormCard}>
              <Text style={s.formMainHeading}>{t('vd_form_titulo')}</Text>
              <Text style={s.formStepSubTitle}>{t(`vw_step${step}_sub`, { defaultValue: `Paso ${step} de 4` })}</Text>

              {/* ═══ PASO 1 ═══ */}
              {step === 1 && (
                <View style={s.animatedStepContainer}>
                  <OptionSelector label={t('vd_f_tipo')} options={TIPO_OPTIONS} value={form.tipo} onChange={v => set('tipo', v)} />
                  <OptionSelector label={t('vd_f_operacion')} options={OP_OPTIONS} value={form.operacion} onChange={v => set('operacion', v)} />

                  <Text style={s.fieldLabel}>{t('vd_f_direccion')}</Text>
                  {[
                    { k: 'calle',   ph: 'Calle y Número' },
                    { k: 'colonia', ph: 'Colonia o Fraccionamiento' },
                    { k: 'ciudad',  ph: 'Ciudad' },
                    { k: 'estado',  ph: 'Estado' },
                    { k: 'cp',      ph: 'Código Postal' },
                  ].map(f => (
                    <TextInput key={f.k} style={s.luxuryInput} placeholder={f.ph} placeholderTextColor={T.muted} value={form[f.k]} onChangeText={v => set(f.k, v)} />
                  ))}

                  {Platform.OS === 'web' && (
                    <WebMapContainer 
                      lat={form.lat ? parseFloat(form.lat) : null} 
                      lng={form.lng ? parseFloat(form.lng) : null} 
                      confirmed={mapaPinConfirmado}
                      onChange={(la, ln) => setForm(prev => ({ ...prev, lat: String(la), lng: String(ln) }))}
                      onConfirm={(la, ln, addr) => {
                        setMapaPinConfirmado(true);
                        setForm(prev => ({ ...prev, lat: String(la), lng: String(ln), ...addr }));
                      }}
                    />
                  )}

                  <View style={{ marginTop: 14 }}>
                    <Counter label={t('vw_recamaras')} value={form.recamaras} onChange={v => set('recamaras', v)} min={1} />
                    <Counter label={t('vw_banos')} value={form.banos} onChange={v => set('banos', v)} min={1} />
                    <Counter label={t('vw_estacionamientos')} value={form.estacionamientos} onChange={v => set('estacionamientos', v)} min={0} />
                  </View>

                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{t('vw_antiguedad')}</Text>
                    <View style={{ gap: 6 }}>
                      {ANTIGUEDAD_OPTIONS.map(o => (
                        <Pressable key={o.value} onPress={() => set('antiguedad', o.value)} style={[s.optionBtn, { width: '100%' }, form.antiguedad === o.value && s.optionBtnActive]}>
                          <Text style={[s.optionText, form.antiguedad === o.value && s.optionTextActive]}>{t(o.labelKey)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* ═══ PASO 2 ═══ */}
              {step === 2 && (
                <View style={s.animatedStepContainer}>
                  <Text style={s.fieldLabel}>{t('vw_titulo')}</Text>
                  <TextInput style={s.luxuryInput} placeholder="Título de la publicación" placeholderTextColor={T.muted} value={form.titulo} onChangeText={v => set('titulo', v)} />

                  <Text style={s.fieldLabel}>{t('vd_f_precio')}</Text>
                  <TextInput style={s.luxuryInput} placeholder="$0.00" placeholderTextColor={T.muted} value={form.precio} onChangeText={v => set('precio', v)} />

                  <Text style={s.fieldLabel}>{t('vd_f_superficie')}</Text>
                  <TextInput style={s.luxuryInput} placeholder="Superficie m²" placeholderTextColor={T.muted} value={form.superficie} onChangeText={v => set('superficie', v)} />

                  <Text style={s.fieldLabel}>{t('vd_f_descripcion')}</Text>
                  <TextInput style={[s.luxuryInput, s.luxuryTextArea]} placeholder={t('vd_f_descripcion_ph')} placeholderTextColor={T.muted} value={form.descripcion} onChangeText={v => set('descripcion', v)} multiline numberOfLines={4} />

                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{t('vw_fotos_label')}</Text>
                    <View style={s.fotosFlexGrid}>
                      {fotos.map((f, i) => (
                        <View key={f.id} style={s.fotoPreviewBox}>
                          <Image source={{ uri: f.uri }} style={s.fotoImg} />
                          {i === 0 && <Text style={s.coverBadge}>{t('vw_fotos_portada')}</Text>}
                          <Pressable onPress={() => removeFoto(f.id)} style={s.removeFotoBtn}><Text style={{ color: '#fff', fontSize: 10 }}>✕</Text></Pressable>
                        </View>
                      ))}
                      {fotos.length < 15 && (
                        <Pressable onPress={procesarSeleccionImagenes} style={s.addFotoPlaceholder}>
                          <Text style={s.addFotoPlusText}>+</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* ═══ PASO 3 ═══ */}
              {step === 3 && (
                <View style={s.animatedStepContainer}>
                  <Text style={s.fieldLabel}>{t('vw_amenidades_label')}</Text>
                  <View style={s.chipsFlexRow}>
                    {AMENIDADES_KEYS.map(k => (
                      <Chip key={k} label={t(k)} active={form.amenidades.includes(k)} onPress={() => setForm(prev => ({
                        ...prev, amenidades: prev.amenidades.includes(k) ? prev.amenidades.filter(a => a !== k) : [...prev.amenidades, k]
                      }))} />
                    ))}
                  </View>
                </View>
              )}

              {/* ═══ PASO 4 ═══ */}
              {step === 4 && (
                <View style={s.animatedStepContainer}>
                  <Text style={s.fieldLabel}>{t('vw_servicios_label')}</Text>
                  <View style={{ gap: 12, marginBottom: 20 }}>
                    {SERVICIOS_VIRALES.map(sv => {
                      const active = form.servicios.includes(sv.key);
                      return (
                        <Pressable key={sv.key} onPress={() => setForm(prev => ({ ...prev, servicios: prev.servicios.includes(sv.key) ? prev.servicios.filter(s => s !== sv.key) : [...prev.servicios, sv.key] }))} style={[s.serviceLuxeCard, active && s.serviceLuxeCardActive]}>
                          <Text style={s.srvTitle}>{t(sv.titleKey)}</Text>
                          <Text style={s.srvDesc}>{t(sv.descKey)}</Text>
                          <Text style={s.srvActionTag}>{active ? '✓ INCLUIDO' : '+ AGREGAR'}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={s.fieldLabel}>{t('vd_f_nombre')}</Text>
                  <TextInput style={s.luxuryInput} placeholder="Tu nombre" placeholderTextColor={T.muted} value={form.nombre} onChangeText={v => set('nombre', v)} />

                  <Text style={s.fieldLabel}>{t('vd_f_telefono')}</Text>
                  <TextInput style={s.luxuryInput} placeholder="+52" placeholderTextColor={T.muted} value={form.telefono} onChangeText={v => set('telefono', v)} keyboardType="phone-pad" />

                  {errorEnvio ? <View style={s.errorBadgeBox}><Text style={s.errorBadgeText}>{errorEnvio}</Text></View> : null}
                </View>
              )}

              {/* NAV ROW */}
              <View style={s.wizardNavRow}>
                {step > 1 && !enviando && (
                  <Pressable onPress={() => setStep(s => s - 1)} style={s.btnSecondary}>
                    <Text style={s.btnSecondaryText}>{t('vw_anterior')}</Text>
                  </Pressable>
                )}
                <Pressable onPress={handleSubmit} disabled={!canNext() || enviando} style={[s.btnPrimary, (!canNext() || enviando) && s.btnPrimaryDisabled]}>
                  {enviando ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={s.btnPrimaryText}>{progresoSubida || (step < 4 ? t('vw_siguiente') : t('vw_publicar_btn'))}</Text>
                  )}
                </Pressable>
              </View>

              <Pressable onPress={onVolver} style={s.cancelBackBtn}>
                <Text style={s.cancelBackBtnText}>← {t('vd_back')}</Text>
              </Pressable>

            </View>
          </ScrollView>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// COMPILER-SAFE STYLE SHEET
// ─────────────────────────────────────────────
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
  rightFormColumn: { flex: 1, backgroundColor: '#0A100A' },
  rightFormColumnWide: { borderLeftWidth: 1, borderColor: T.border },
  wizardFormCard: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center', marginVertical: 20 },
  formMainHeading: { fontFamily: T.serif, fontSize: 26, color: T.text, marginBottom: 6 },
  formStepSubTitle: { fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 },
  animatedStepContainer: { paddingBottom: 10 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: T.gold, fontFamily: T.sans, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  luxuryInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: T.border, paddingHorizontal: 16, paddingVertical: 14, color: T.text, fontSize: 13, fontFamily: T.sans, marginBottom: 10 },
  luxuryTextArea: { minHeight: 90, textAlignVertical: 'top' },
  counterField: { marginBottom: 14 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: T.border, padding: 10 },
  counterBtn: { width: 32, height: 32, backgroundColor: 'rgba(160,120,64,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)' },
  counterBtnText: { color: T.gold, fontSize: 16, fontWeight: '600' },
  counterValue: { color: T.text, fontSize: 15, fontFamily: T.serif, fontWeight: '600' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optionBtn: { flex: 1, minWidth: '45%', paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center' },
  optionBtnActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.15)' },
  optionText: { color: T.muted, fontSize: 11, fontFamily: T.sans, fontWeight: '600' },
  optionTextActive: { color: T.gold },
  fotosFlexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fotoPreviewBox: { width: 95, height: 95, position: 'relative', borderWidth: 1, borderColor: T.border },
  fotoImg: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.gold, color: '#000', fontSize: 8, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', paddingVertical: 2 },
  removeFotoBtn: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  addFotoPlaceholder: { width: 95, height: 95, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(160,120,64,0.4)', backgroundColor: 'rgba(160,120,64,0.03)', justifyContent: 'center', alignItems: 'center' },
  addFotoPlusText: { color: T.gold, fontSize: 24, fontWeight: '300' },
  chipsFlexRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.02)' },
  chipActive: { borderColor: T.gold, backgroundColor: T.gold },
  chipText: { color: T.muted, fontSize: 11, fontFamily: T.sans },
  chipTextActive: { color: '#000', fontWeight: '600' },
  serviceLuxeCard: { padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: T.border, gap: 4 },
  serviceLuxeCardActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.05)' },
  srvTitle: { fontFamily: T.serif, fontSize: 15, color: T.text },
  srvDesc: { fontSize: 11, color: T.muted, lineHeight: 16, fontWeight: '300', fontFamily: T.sans },
  srvActionTag: { fontSize: 9, letterSpacing: 1, fontWeight: '600', color: T.gold, marginTop: 4 },
  errorBadgeBox: { padding: 14, backgroundColor: 'rgba(220,80,80,0.1)', borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', marginTop: 12 },
  errorBadgeText: { color: '#e08a8a', fontSize: 12, fontFamily: T.sans },
  webMapFrame: { width: '100%', height: 280, borderWidth: 1, overflow: 'hidden' },
  
  // Centrado limpio y nativo sin transform destructivos
  mapOverlayBadge: { 
    position: 'absolute', 
    bottom: 10, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(10,10,10,0.9)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  
  wizardNavRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnSecondary: { paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: T.borderMid, justifyContent: 'center' },
  btnSecondaryText: { color: T.muted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: T.sans },
  btnPrimary: { flex: 1, paddingVertical: 14, backgroundColor: T.gold, justifyContent: 'center', alignItems: 'center', minHeight: 48 },
  btnPrimaryDisabled: { opacity: 0.35 },
  btnPrimaryText: { color: '#000', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', fontFamily: T.sans },
  cancelBackBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 8 },
  cancelBackBtnText: { color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontFamily: T.sans },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: T.bg },
  successCheckMark: { fontSize: 54, color: T.gold, marginBottom: 16 },
  successTitle: { fontFamily: T.serif, fontSize: 24, color: T.text, marginBottom: 8, textAlign: 'center' },
  successSub: { fontSize: 13, color: T.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20, maxWidth: 320, fontFamily: T.sans }
});