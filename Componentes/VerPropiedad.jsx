import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

const T = {
  gold:         '#A07840',
  goldDeep:     '#C49A58',
  bgPage:       '#0F0D0A',
  bgCard:       '#141210',
  bgFilter:     '#0E0C09',
  textMain:     '#F2EDE5',
  textSub:      '#7A6E62',
  textDim:      'rgba(242,237,229,0.5)',
  border:       'rgba(160,120,64,0.15)',
  borderFocus:  'rgba(160,120,64,0.34)',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const formatPrecio = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('es-MX', { maximumFractionDigits: 0 });
};

export default function VerPropiedad({ propiedadId, onVolver }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  const [propiedad, setPropiedad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [favorito, setFavorito] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [formEnviado, setFormEnviado] = useState(false);

  // Hovers
  const [hoveredVolver, setHoveredVolver] = useState(false);
  const [hoveredBreadcrumb, setHoveredBreadcrumb] = useState(false);
  const [hoveredFav, setHoveredFav] = useState(false);
  const [hoveredThumb, setHoveredThumb] = useState(null);
  const [hoveredEnviar, setHoveredEnviar] = useState(false);
  const [hoveredLlamar, setHoveredLlamar] = useState(false);
  const [hoveredWhatsApp, setHoveredWhatsApp] = useState(false);
  const [hoveredLockMap, setHoveredLockMap] = useState(false);
  const [hoveredLockContact, setHoveredLockContact] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    const cargar = async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from('propiedades')
        .select('*')
        .eq('id', propiedadId)
        .single();

      if (!error && data) {
        setPropiedad(data);
        setMensaje(t('vp_form_mensaje_default', { titulo: data.titulo }));
      } else {
        setPropiedad(null);
      }
      setCargando(false);
    };

    if (propiedadId) {
      cargar();
    } else {
      setCargando(false);
    }
  }, [propiedadId, t]);

  const handleEnviarMensaje = () => {
    if (!nombre || !email) {
      if (Platform.OS === 'web') alert(t('login_email_lbl') + ' & ' + t('register_name_lbl') + ' ' + t('vp_descripcion_title').toLowerCase());
      return;
    }
    setFormEnviado(true);
    setTimeout(() => {
      setFormEnviado(false);
      setNombre('');
      setEmail('');
      setTelefono('');
      if (Platform.OS === 'web') {
        alert(t('register_success_msg', { defaultValue: '¡Mensaje enviado con éxito! Nos comunicaremos contigo.' }));
      }
    }, 1500);
  };

  const abrirTelefono = () => {
    if (propiedad?.telefono_contacto) {
      Linking.openURL(`tel:${propiedad.telefono_contacto}`);
    }
  };

  const abrirWhatsApp = () => {
    if (propiedad?.telefono_contacto) {
      const limpioNum = propiedad.telefono_contacto.replace(/[^\d]/g, '');
      const numConCodigo = limpioNum.length === 10 ? `52${limpioNum}` : limpioNum;
      const texto = encodeURIComponent(t('vp_form_mensaje_default', { titulo: propiedad.titulo }));
      Linking.openURL(`https://wa.me/${numConCodigo}?text=${texto}`);
    }
  };

  if (cargando) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={T.gold} />
      </View>
    );
  }

  if (!propiedad) {
    return (
      <View style={s.notFoundContainer}>
        <Text style={s.notFoundTitle}>{t('vp_not_found_title')}</Text>
        <Text style={s.notFoundText}>{t('vp_not_found_text')}</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => onVolver && onVolver('home')}>
          <Text style={s.backBtnText}>{t('vp_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imagenes = propiedad.imagenes?.length
    ? propiedad.imagenes
    : ['https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&q=80'];

  const esRenta = propiedad.tipo_transaccion === 'Renta';
  const amenidades = propiedad.amenidades || [];
  const extraThumbs = imagenes.length > 4 ? imagenes.length - 4 : 0;
  
  // Breakpoints dinámicos basados en ancho de pantalla
  const esPantallaGrande = width > 1024;
  const esPantallaMediana = width > 768;
  const esCelularPequeno = width < 480;

  // Paddings adaptativos
  const padHoriz = esPantallaGrande ? 60 : esPantallaMediana ? 40 : 16;

  const renderBreadcrumb = () => (
    <View style={[s.breadcrumb, { paddingHorizontal: padHoriz, flexDirection: width > 600 ? 'row' : 'column', alignItems: width > 600 ? 'center' : 'flex-start' }]}>
      <TouchableOpacity 
        onPress={() => onVolver && onVolver(esRenta ? 'renta' : 'venta')}
        onMouseEnter={() => setHoveredVolver(true)}
        onMouseLeave={() => setHoveredVolver(false)}
        style={[s.backArrowBtn, hoveredVolver && s.backArrowBtnHover]}
      >
        <Text style={s.backArrowText}>← {t('vd_back')}</Text>
      </TouchableOpacity>

      <View style={[s.breadcrumbLinksRow, { marginTop: width > 600 ? 0 : 10 }]}>
        <TouchableOpacity onPress={() => onVolver && onVolver('home')}>
          <Text 
            style={[s.breadcrumbLink, hoveredBreadcrumb && s.breadcrumbLinkHover]}
            onMouseEnter={() => setHoveredBreadcrumb(true)}
            onMouseLeave={() => setHoveredBreadcrumb(false)}
          >
            {t('vp_breadcrumb_inicio')}
          </Text>
        </TouchableOpacity>
        <Text style={s.breadcrumbSep}>/</Text>
        <TouchableOpacity onPress={() => onVolver && onVolver(esRenta ? 'renta' : 'venta')}>
          <Text style={s.breadcrumbLink}>
            {esRenta ? t('vp_breadcrumb_renta') : t('vp_breadcrumb_venta')}
          </Text>
        </TouchableOpacity>
        <Text style={s.breadcrumbSep}>/</Text>
        <Text style={s.breadcrumbCurrent} numberOfLines={1}>{propiedad.titulo}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageScrollContent}>
      {renderBreadcrumb()}

      {/* GALERÍA RESPONSIVA */}
      <View style={[s.galleryContainer, { paddingHorizontal: padHoriz }, esPantallaGrande ? s.galleryContainerWide : s.galleryContainerMobile]}>
        <View style={esPantallaGrande ? s.galleryMainWide : s.galleryMainMobile}>
          <Image 
            source={{ uri: imagenes[imagenActiva] || 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200' }} 
            style={s.mainImage} 
            resizeMode="cover" 
          />
          
          <View style={s.badgeFrame}>
            <Text style={s.badgeText}>{esRenta ? t('props_badge_renta') : t('props_badge_venta')}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFavorito(!favorito)}
            onMouseEnter={() => setHoveredFav(true)}
            onMouseLeave={() => setHoveredFav(false)}
            style={[s.favBtn, (favorito || hoveredFav) && s.favBtnActive]}
          >
            <Text style={[s.favIcon, (favorito || hoveredFav) && s.favIconActive]}>
              {favorito ? '❤️' : '🖤'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* THUMBNAILS LIST */}
        <View style={[esPantallaGrande ? s.thumbsContainerWide : s.thumbsContainerMobile]}>
          {imagenes.slice(1, 5).map((img, idx) => {
            const hasExtra = idx === 3 && extraThumbs > 0;
            const absoluteIdx = idx + 1;
            const isHovered = hoveredThumb === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setImagenActiva(absoluteIdx)}
                onMouseEnter={() => setHoveredThumb(idx)}
                onMouseLeave={() => setHoveredThumb(null)}
                style={[
                  esPantallaGrande ? s.thumbWrapWide : s.thumbWrapMobile,
                  isHovered && s.thumbWrapHover
                ]}
              >
                <Image source={{ uri: img }} style={s.thumbImage} resizeMode="cover" />
                {hasExtra && (
                  <View style={s.thumbExtraLayer}>
                    <Text style={s.thumbExtraText}>+{extraThumbs}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CUERPO PRINCIPAL */}
      <View style={[s.mainLayout, { paddingHorizontal: padHoriz }, esPantallaGrande ? s.mainLayoutWide : s.mainLayoutMobile]}>
        
        {/* COLUMNA DETALLES (IZQUIERDA) */}
        <View style={s.detailsColumn}>
          
          {/* ENCABEZADO DE DETALLE */}
          <View style={[s.headerBlock, { flexDirection: width > 600 ? 'row' : 'column', alignItems: width > 600 ? 'flex-start' : 'stretch' }]}>
            <View style={s.headerInfo}>
              <Text style={s.eyebrow}>{t('vp_eyebrow')}</Text>
              <Text style={[s.title, { fontSize: esPantallaMediana ? 32 : 24 }]}>{propiedad.titulo}</Text>
              <Text style={s.locationText}>📍 {user ? propiedad.ubicacion : (propiedad.ciudad && propiedad.estado ? `${propiedad.ciudad}, ${propiedad.estado}` : t('vp_location_locked_title'))}</Text>
            </View>
            <View style={[s.priceBlock, { marginTop: width > 600 ? 0 : 16, alignItems: width > 600 ? 'flex-end' : 'flex-start' }]}>
              <Text style={s.priceTag}>${formatPrecio(propiedad.precio)}</Text>
              <Text style={s.priceSuffix}>{esRenta ? t('props_per_month') : t('vp_precio_total')}</Text>
            </View>
          </View>

          {/* ICONOS ESPECIFICACIONES (DASHBOARD LUXURY RESPONSIVO) */}
          <View style={s.specsGrid}>
            <View style={[s.specBox, { minWidth: esCelularPequeno ? '46%' : 80 }]}>
              <View style={s.specIconBg}><Text style={s.specIcon}>🛏️</Text></View>
              <Text style={s.specValue}>{propiedad.habitaciones || 0}</Text>
              <Text style={s.specLabel}>{t('props_rec')}</Text>
            </View>
            <View style={[s.specBox, { minWidth: esCelularPequeno ? '46%' : 80 }]}>
              <View style={s.specIconBg}><Text style={s.specIcon}>🚿</Text></View>
              <Text style={s.specValue}>{propiedad.banos || 0}</Text>
              <Text style={s.specLabel}>{t('props_banos')}</Text>
            </View>
            <View style={[s.specBox, { minWidth: esCelularPequeno ? '46%' : 80 }]}>
              <View style={s.specIconBg}><Text style={s.specIcon}>📐</Text></View>
              <Text style={s.specValue}>{propiedad.m2 || 0}</Text>
              <Text style={s.specLabel}>M²</Text>
            </View>
            {propiedad.estacionamientos !== undefined && propiedad.estacionamientos !== null && (
              <View style={[s.specBox, { minWidth: esCelularPequeno ? '46%' : 80 }]}>
                <View style={s.specIconBg}><Text style={s.specIcon}>🚗</Text></View>
                <Text style={s.specValue}>{propiedad.estacionamientos}</Text>
                <Text style={s.specLabel}>{t('vp_estacionamiento')}</Text>
              </View>
            )}
          </View>

          {/* SECCIÓN DESCRIPCIÓN */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('vp_descripcion_title')}</Text>
            <View style={s.cardBody}>
              <Text style={s.descriptionText}>
                {propiedad.descripcion || t('vp_descripcion_default')}
              </Text>
            </View>
          </View>

          {/* SECCIÓN AMENIDADES */}
          {amenidades.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('vp_amenidades_title')}</Text>
              <View style={s.cardBody}>
                <View style={s.amenitiesGrid}>
                  {amenidades.map((am, idx) => (
                    <View key={idx} style={[s.amenityItem, { width: esPantallaGrande ? '31%' : esPantallaMediana ? '46%' : '100%' }]}>
                      <Text style={s.amenityCheck}>✓</Text>
                      <Text style={s.amenityText}>{t(am)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* SECCIÓN UBICACIÓN */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('vp_ubicacion_title')}</Text>
            {user ? (
              Platform.OS === 'web' ? (
                <View style={s.mapContainerWeb}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(propiedad.lat && propiedad.lng ? `${propiedad.lat},${propiedad.lng}` : propiedad.ubicacion)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, borderRadius: 4, backgroundColor: '#11100D' }}
                    allowFullScreen=""
                    loading="lazy"
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(propiedad.ubicacion)}`)}
                  style={s.mapPlaceholder}
                >
                  <Text style={s.mapPinIcon}>📍</Text>
                  <Text style={s.mapAddressText}>{propiedad.ubicacion}</Text>
                  <Text style={s.mapCoordsText}>{t('solutions.visit_cta')}</Text>
                </TouchableOpacity>
              )
            ) : (
              <View style={s.lockedContainer}>
                <Text style={s.lockedIcon}>🔒</Text>
                <Text style={s.lockedTitle}>{t('vp_location_locked_title')}</Text>
                <Text style={s.lockedText}>{t('vp_location_locked_text')}</Text>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[s.lockedBtn, hoveredLockMap && s.lockedBtnHover]}
                  onPress={() => onVolver && onVolver('login')}
                  onMouseEnter={() => setHoveredLockMap(true)}
                  onMouseLeave={() => setHoveredLockMap(false)}
                >
                  <Text style={s.lockedBtnText}>{t('navbar.login')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* COLUMNA CONTACTO / SIDEBAR (DERECHA) */}
        <View style={esPantallaGrande ? s.sidebarColumnWide : s.sidebarColumnMobile}>
          {user ? (
            <View style={[s.contactCard, { padding: esPantallaMediana ? 28 : 16 }]}>
              <Text style={s.contactTitle}>{t('vp_contact_title')}</Text>
              <Text style={s.contactSub}>{t('vp_contact_sub')}</Text>

              {/* INFORMACIÓN AGENTE */}
              <View style={s.agentRow}>
                <View style={s.agentAvatar}>
                  <Text style={s.agentAvatarText}>
                    {(propiedad.nombre_contacto || t('vp_agente_default'))[0].toUpperCase()}
                  </Text>
                </View>
                <View style={s.agentInfo}>
                  <Text style={s.agentName}>{propiedad.nombre_contacto || t('vp_agente_default')}</Text>
                  <Text style={s.agentRole}>{t('vp_agente_role')}</Text>
                </View>
              </View>

              {/* FORMULARIO */}
              <View style={s.form}>
                <TextInput
                  style={s.input}
                  placeholder={t('register_name_lbl') || 'Nombre completo'}
                  placeholderTextColor={T.textSub}
                  value={nombre}
                  onChangeText={setNombre}
                />
                <TextInput
                  style={s.input}
                  placeholder={t('login_email_lbl') || 'Correo electrónico'}
                  placeholderTextColor={T.textSub}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput
                  style={s.input}
                  placeholder={t('register_phone_lbl') || 'Teléfono'}
                  placeholderTextColor={T.textSub}
                  keyboardType="phone-pad"
                  value={telefono}
                  onChangeText={setTelefono}
                />
                <TextInput
                  style={[s.input, s.textArea]}
                  placeholder={t('vp_form_mensaje') || 'Mensaje'}
                  placeholderTextColor={T.textSub}
                  multiline
                  numberOfLines={4}
                  value={mensaje}
                  onChangeText={setMensaje}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleEnviarMensaje}
                  onMouseEnter={() => setHoveredEnviar(true)}
                  onMouseLeave={() => setHoveredEnviar(false)}
                  style={[s.submitBtn, hoveredEnviar && s.submitBtnHover]}
                >
                  <Text style={[s.submitBtnText, hoveredEnviar && s.submitBtnTextHover]}>
                    {t('vp_form_enviar')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={s.dividerText}>{t('vp_contact_o')}</Text>

              {/* BOTONES ALTERNATIVOS DE CONTACTO */}
              <View style={s.altActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={abrirTelefono}
                  onMouseEnter={() => setHoveredLlamar(true)}
                  onMouseLeave={() => setHoveredLlamar(false)}
                  style={[s.altBtn, hoveredLlamar && s.altBtnHover]}
                >
                  <Text style={s.altBtnIcon}>📞</Text>
                  <Text style={[s.altBtnText, hoveredLlamar && s.altBtnTextHover]}>
                    {t('vp_llamar')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={abrirWhatsApp}
                  onMouseEnter={() => setHoveredWhatsApp(true)}
                  onMouseLeave={() => setHoveredWhatsApp(false)}
                  style={[s.altBtn, hoveredWhatsApp && s.altBtnHover]}
                >
                  <Text style={s.altBtnIcon}>💬</Text>
                  <Text style={[s.altBtnText, hoveredWhatsApp && s.altBtnTextHover]}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[s.contactCard, { padding: esPantallaMediana ? 28 : 16 }]}>
              <Text style={s.contactTitle}>{t('vp_contact_title')}</Text>
              <View style={s.lockedContainerInner}>
                <Text style={s.lockedIcon}>🔒</Text>
                <Text style={s.lockedTitle}>{t('vp_contact_locked_title')}</Text>
                <Text style={s.lockedText}>{t('vp_contact_locked_text')}</Text>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[s.lockedBtn, hoveredLockContact && s.lockedBtnHover]}
                  onPress={() => onVolver && onVolver('login')}
                  onMouseEnter={() => setHoveredLockContact(true)}
                  onMouseLeave={() => setHoveredLockContact(false)}
                >
                  <Text style={s.lockedBtnText}>{t('navbar.login')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: T.bgPage,
  },
  pageScrollContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: T.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: T.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 400,
  },
  notFoundTitle: {
    fontFamily: T.serif,
    fontSize: 28,
    color: T.textMain,
    marginBottom: 12,
  },
  notFoundText: {
    fontFamily: T.sans,
    fontSize: 14,
    color: T.textSub,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 400,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: T.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 1,
  },
  backBtnText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.gold,
    fontWeight: '600',
    letterSpacing: 2,
  },

  // Breadcrumb
  breadcrumb: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 28,
    paddingBottom: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  backArrowBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    borderRadius: 1,
  },
  backArrowBtnHover: {
    borderColor: T.gold,
    backgroundColor: 'rgba(160,120,64,0.1)',
  },
  backArrowText: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.gold,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  breadcrumbLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.gold,
    letterSpacing: 1.5,
    fontWeight: '400',
    textTransform: 'uppercase',
  },
  breadcrumbLinkHover: {
    color: T.goldDeep,
  },
  breadcrumbSep: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.textSub,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  breadcrumbCurrent: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.textMain,
    letterSpacing: 1.5,
    fontWeight: '300',
    textTransform: 'uppercase',
    maxWidth: 200,
  },

  // Galería
  galleryContainer: {
    gap: 10,
  },
  galleryContainerWide: {
    flexDirection: 'row',
    height: 520,
  },
  galleryContainerMobile: {
    flexDirection: 'column',
  },
  galleryMainWide: {
    flex: 2,
    position: 'relative',
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  galleryMainMobile: {
    width: '100%',
    height: 280,
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  badgeFrame: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: T.gold,
    paddingVertical: 6,
    paddingHorizontal: 14,
    zIndex: 10,
  },
  badgeText: {
    fontFamily: T.sans,
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  favBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 42,
    height: 42,
    backgroundColor: 'rgba(15,13,10,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1,
    zIndex: 10,
    ...Platform.select({
      web: { backdropFilter: 'blur(4px)' }
    })
  },
  favBtnActive: {
    backgroundColor: T.gold,
    borderColor: T.gold,
  },
  favIcon: {
    fontSize: 16,
    color: T.textMain,
  },
  favIconActive: {
    color: '#000',
  },
  thumbsContainerWide: {
    flex: 1,
    flexDirection: 'column',
    gap: 10,
    height: '100%',
  },
  thumbsContainerMobile: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  thumbWrapWide: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 2,
  },
  thumbWrapMobile: {
    flex: 1,
    height: 70,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 2,
  },
  thumbWrapHover: {
    opacity: 0.9,
    borderWidth: 1.5,
    borderColor: T.gold,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbExtraLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,13,10,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbExtraText: {
    fontFamily: T.serif,
    fontSize: 24,
    color: T.textMain,
    fontWeight: '300',
  },

  // Layout Principal
  mainLayout: {
    paddingTop: 40,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  mainLayoutWide: {
    flexDirection: 'row',
    gap: 60,
  },
  mainLayoutMobile: {
    flexDirection: 'column',
    gap: 40,
  },
  detailsColumn: {
    flex: 1.5,
  },
  sidebarColumnWide: {
    width: 380,
  },
  sidebarColumnMobile: {
    width: '100%',
  },

  // Encabezado
  headerBlock: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,120,64,0.15)',
    paddingBottom: 28,
    marginBottom: 28,
    gap: 16,
  },
  headerInfo: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: T.sans,
    fontSize: 10,
    letterSpacing: 3,
    color: T.gold,
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    fontFamily: T.serif,
    color: T.textMain,
    fontWeight: '300',
    lineHeight: 38,
    marginBottom: 10,
  },
  locationText: {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.textSub,
    fontWeight: '300',
  },
  priceBlock: {
    justifyContent: 'center',
  },
  priceTag: {
    fontFamily: T.serif,
    fontSize: 32,
    color: T.goldDeep,
    fontWeight: '400',
  },
  priceSuffix: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.textSub,
    letterSpacing: 1.5,
    marginTop: 4,
  },

  // Specs Dashboard
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,120,64,0.15)',
    paddingBottom: 28,
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  specBox: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#13110E',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.08)',
    paddingVertical: 18,
    borderRadius: 2,
  },
  specIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(160,120,64,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  specIcon: {
    fontSize: 18,
  },
  specValue: {
    fontFamily: T.serif,
    fontSize: 18,
    color: T.textMain,
    fontWeight: '400',
    marginBottom: 2,
  },
  specLabel: {
    fontFamily: T.sans,
    fontSize: 9,
    color: T.textSub,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Secciones
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontFamily: T.serif,
    fontSize: 18,
    color: T.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 18,
    fontWeight: '400',
  },
  cardBody: {
    backgroundColor: '#11100E',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.08)',
    padding: 24,
    borderRadius: 1,
  },
  descriptionText: {
    fontFamily: T.sans,
    fontSize: 14,
    color: 'rgba(242,237,229,0.78)',
    lineHeight: 24,
    fontWeight: '300',
  },

  // Amenidades
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amenityCheck: {
    color: T.gold,
    fontSize: 14,
    marginRight: 8,
    fontWeight: '700',
  },
  amenityText: {
    fontFamily: T.sans,
    fontSize: 13,
    color: 'rgba(242,237,229,0.85)',
    fontWeight: '300',
  },

  // Mapa
  mapContainerWeb: {
    width: '100%',
    height: 380,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.15)',
  },
  mapPlaceholder: {
    backgroundColor: '#11100D',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.12)',
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 2,
  },
  mapPinIcon: {
    fontSize: 32,
    color: T.gold,
    marginBottom: 12,
  },
  mapAddressText: {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.textMain,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 4,
  },
  mapCoordsText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.gold,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 8,
  },

  // Locked styles
  lockedContainer: {
    backgroundColor: '#11100D',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.15)',
    paddingVertical: 50,
    paddingHorizontal: 24,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedContainerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  lockedIcon: {
    fontSize: 28,
    marginBottom: 16,
  },
  lockedTitle: {
    fontFamily: T.serif,
    fontSize: 16,
    color: T.gold,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedText: {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.textSub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  lockedBtn: {
    backgroundColor: T.gold,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 1,
  },
  lockedBtnHover: {
    backgroundColor: T.goldDeep,
  },
  lockedBtnText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Tarjeta de Contacto / Sidebar
  contactCard: {
    backgroundColor: '#11100E',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.12)',
    borderRadius: 1,
  },
  contactTitle: {
    fontFamily: T.serif,
    fontSize: 22,
    color: T.textMain,
    marginBottom: 8,
    fontWeight: '400',
  },
  contactSub: {
    fontFamily: T.sans,
    fontSize: 12,
    color: T.textSub,
    lineHeight: 18,
    marginBottom: 24,
    fontWeight: '300',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 16,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAvatarText: {
    fontFamily: T.sans,
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.textMain,
    fontWeight: '500',
    marginBottom: 2,
  },
  agentRole: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#0a0907',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: T.textMain,
    fontFamily: T.sans,
    fontSize: 13,
    borderRadius: 1,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: T.gold,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 1,
    marginTop: 6,
  },
  submitBtnHover: {
    backgroundColor: T.goldDeep,
  },
  submitBtnText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 2,
  },
  submitBtnTextHover: {
    color: '#000',
  },
  dividerText: {
    fontFamily: T.sans,
    fontSize: 9,
    color: T.textSub,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginVertical: 20,
    textTransform: 'uppercase',
  },
  altActions: {
    flexDirection: 'row',
    gap: 12,
  },
  altBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    gap: 6,
  },
  altBtnHover: {
    backgroundColor: 'rgba(160,120,64,0.1)',
    borderColor: T.gold,
  },
  altBtnIcon: {
    fontSize: 14,
    color: T.gold,
  },
  altBtnText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.textMain,
    fontWeight: '600',
    letterSpacing: 1,
  },
  altBtnTextHover: {
    color: T.gold
  }
});
