import React, { useEffect, useRef, useState } from 'react';
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
  Linking,
  Modal,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';
import PropertyMap from './PropertyMap';
import { FontAwesome } from '@expo/vector-icons';
import Chat from './Chat.jsx';

// ─── DESIGN TOKENS (INMOVIRAL MATCHED LUXURY DARK) ───
const T = {
  bgPage: '#0F0D0A',
  bgCard: '#141210',
  bgFilter: '#0E0C09',
  textMain: '#F2EDE5',
  textSub: '#7A6E62',
  textDim: 'rgba(242,237,229,0.5)',
  border: 'rgba(160,120,64,0.15)',
  borderFocus: 'rgba(160,120,64,0.34)',
  gold: '#A07840',
  goldLight: '#C49A58',
  white: '#FDFBF8',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Jost, Montserrat, sans-serif' }),
};

const formatPrecio = (num) => {
  if (num === null || num === undefined) return '0';
  const val = Number(num);
  if (isNaN(val)) return '0';
  if (val >= 1e12) {
    return val.toExponential(2);
  }
  return val.toLocaleString('es-MX', { maximumFractionDigits: 0 });
};

const formatTelefonoRender = (tel) => {
  if (!tel) return '';
  let limpio = tel.trim();
  // Remove duplicate "+52 +52" or similar
  limpio = limpio.replace(/\+52\s*\+52/g, '+52');
  return limpio;
};

export default function VerPropiedad({ propiedadId, onVolver, onStartChat, onEditarPropiedad }) {
  const { t, i18n } = useTranslation();
  const { width, height } = useWindowDimensions();
  const { user, updateUserMetadata } = useAuth();
  const scrollViewRef = useRef(null);

  const [propiedad, setPropiedad] = useState(null);
  const [similares, setSimilares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [favorito, setFavorito] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);

  // Lightbox Modal state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Form State
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [formEnviado, setFormEnviado] = useState(false);

  // Hover states (Web only)
  const [hoveredVolver, setHoveredVolver] = useState(false);
  const [hoveredSchedule, setHoveredSchedule] = useState(false);
  const [hoveredInfo, setHoveredInfo] = useState(false);
  const [hoveredEnviar, setHoveredEnviar] = useState(false);
  const [hoveredLlamar, setHoveredLlamar] = useState(false);
  const [hoveredWhatsApp, setHoveredWhatsApp] = useState(false);
  const [hoveredCta, setHoveredCta] = useState(false);
  const [hoveredChat, setHoveredChat] = useState(false);

  useEffect(() => {
    if (user && propiedadId) {
      let isFav = false;
      const cloudFavs = user.user_metadata?.favoritos || [];
      isFav = cloudFavs.includes(propiedadId);
      
      if (!isFav && Platform.OS === 'web') {
        try {
          const saved = localStorage.getItem(`favoritos_${user.id}`);
          if (saved) {
            const list = JSON.parse(saved);
            isFav = list.includes(propiedadId);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setFavorito(isFav);
    } else {
      setFavorito(false);
    }
  }, [user, propiedadId]);

  const handleChatWithSeller = async () => {
    if (!user) {
      alert(t('props_fav_login_alert', { defaultValue: 'Debes iniciar sesión para chatear con el vendedor.' }));
      return;
    }
    try {
      const roomId = await Chat.crearSala(propiedad, user);
      if (onStartChat) {
        onStartChat(roomId);
      }
    } catch (e) {
      console.error("Error starting chat:", e);
    }
  };

  const handleToggleFavorito = async () => {
    if (!user) {
      alert(t('props_fav_login_alert', { defaultValue: 'Debes iniciar sesión para guardar favoritos.' }));
      return;
    }
    try {
      let list = user.user_metadata?.favoritos || [];
      if (Platform.OS === 'web' && list.length === 0) {
        try {
          const saved = localStorage.getItem(`favoritos_${user.id}`);
          if (saved) {
            list = JSON.parse(saved);
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (list.includes(propiedadId)) {
        list = list.filter(id => id !== propiedadId);
        setFavorito(false);
      } else {
        list = [...list, propiedadId];
        setFavorito(true);
      }

      await updateUserMetadata({ favoritos: list });

      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(`favoritos_${user.id}`, JSON.stringify(list));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }

    const cargarData = async () => {
      setCargando(true);
      // Fetch property
      const { data, error } = await supabase
        .from('propiedades')
        .select('*')
        .eq('id', propiedadId)
        .single();

      if (!error && data) {
        setPropiedad(data);
        setImagenActiva(0);
        setMensaje(t('vp_form_mensaje_default', { titulo: data.titulo, defaultValue: `Hola, me interesa obtener información sobre la propiedad: ${data.titulo}` }));

        // Auto-sync contact details if this is the user's own property and details are missing or malformed
        const esPropietario = user && (
          data.user_id === user.id || 
          data.propietario_id === user.id ||
          (data.nombre_contacto && data.nombre_contacto.toLowerCase() === (user.user_metadata?.full_name || '').toLowerCase())
        );

        if (esPropietario) {
          const cleanedTel = formatTelefonoRender(data.telefono_contacto);
          const needsSync = !data.email_contacto || !data.avatar_url_contacto || data.telefono_contacto !== cleanedTel || !data.user_id || !data.propietario_id;

          if (needsSync) {
            const syncPropertyContact = async () => {
              try {
                const updatedFields = {
                  email_contacto: user.email,
                  avatar_url_contacto: user.user_metadata?.avatar_url || null,
                  telefono_contacto: cleanedTel,
                  user_id: user.id,
                  propietario_id: user.id
                };
                const { data: updatedData } = await supabase
                  .from('propiedades')
                  .update(updatedFields)
                  .eq('id', data.id)
                  .select('*')
                  .single();
                if (updatedData) {
                  setPropiedad(updatedData);
                }
              } catch (e) {
                console.error("Error auto-syncing property contact metadata:", e);
              }
            };
            syncPropertyContact();
          }
        } else {
          // Fallback: If contact details are missing, try to resolve them from reviews or other listings of this user
          const fetchMissingContactInfo = async () => {
            try {
              let foundAvatar = data.avatar_url_contacto;
              let foundEmail = data.email_contacto;

              if (!foundAvatar) {
                const { data: resenaData } = await supabase
                  .from('resenas')
                  .select('avatar_url')
                  .eq('nombre_usuario', data.nombre_contacto)
                  .not('avatar_url', 'is', null)
                  .limit(1);
                if (resenaData && resenaData.length > 0) {
                  foundAvatar = resenaData[0].avatar_url;
                }
              }

              if (!foundAvatar || !foundEmail) {
                const { data: otherProps } = await supabase
                  .from('propiedades')
                  .select('avatar_url_contacto, email_contacto')
                  .eq('nombre_contacto', data.nombre_contacto)
                  .or('avatar_url_contacto.not.is.null,email_contacto.not.is.null')
                  .limit(1);
                if (otherProps && otherProps.length > 0) {
                  if (!foundAvatar) foundAvatar = otherProps[0].avatar_url_contacto;
                  if (!foundEmail) foundEmail = otherProps[0].email_contacto;
                }
              }

              if (foundAvatar !== data.avatar_url_contacto || foundEmail !== data.email_contacto) {
                setPropiedad(prev => ({
                  ...prev,
                  avatar_url_contacto: foundAvatar,
                  email_contacto: foundEmail
                }));
              }
            } catch (e) {
              console.error("Error resolving missing contact info:", e);
            }
          };
          fetchMissingContactInfo();
        }

        // Fetch similar properties
        const { data: similarData, error: similarError } = await supabase
          .from('propiedades')
          .select('*')
          .eq('tipo_transaccion', data.tipo_transaccion)
          .neq('id', data.id)
          .limit(2);

        if (!similarError && similarData) {
          setSimilares(similarData);
        }
      } else {
        setPropiedad(null);
      }
      setCargando(false);
    };

    if (propiedadId) {
      cargarData();
    } else {
      setCargando(false);
    }
  }, [propiedadId, t]);

  const handleEnviarMensaje = () => {
    if (!nombre || !email) {
      if (Platform.OS === 'web') {
        alert(idiomaActual.startsWith('es') ? 'Nombre y Correo electrónico son requeridos.' : 'Name and Email are required.');
      }
      return;
    }
    setFormEnviado(true);
    setTimeout(() => {
      setFormEnviado(false);
      setNombre('');
      setEmail('');
      setTelefono('');
      if (Platform.OS === 'web') {
        alert(t('vp_contact_success_msg', { defaultValue: '¡Mensaje enviado con éxito! Nos comunicaremos contigo.' }));
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

  const abrirLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxVisible(true);
  };

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % imagenes.length);
  };

  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
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

  // Breakpoints
  const esPantallaGrande = width > 1024;
  const esPantallaMediana = width > 768;
  const padHoriz = esPantallaGrande ? 60 : esPantallaMediana ? 40 : 16;
  const idiomaActual = i18n.language || 'es';
  const esES = idiomaActual.startsWith('es');

  // Hover Helpers
  const hoverProps = (setHover) => Platform.OS === 'web' ? {
    onMouseEnter: () => { setHover(true); },
    onMouseLeave: () => { setHover(false); }
  } : {};

  // Formatted stats
  const areaLabel = propiedad.m2 ? `${propiedad.m2} M²` : 'N/A';
  const recLabel = propiedad.habitaciones ? String(propiedad.habitaciones) : '0';
  const banLabel = propiedad.banos ? String(propiedad.banos) : '0';
  
  const getAntiguedadLabel = (val) => {
    if (!val) return 'N/A';
    if (val === 'nueva') return esES ? 'A Estrenar' : 'Brand New';
    if (val === 'lt5') return esES ? 'Menos de 5 años' : 'Under 5 years';
    if (val === '5-10') return esES ? '5 a 10 años' : '5 to 10 years';
    if (val === '10-20') return esES ? '10 a 20 años' : '10 to 20 years';
    if (val === 'gt20') return esES ? 'Más de 20 años' : 'Over 20 years';
    return `${val} ${t('vp_years', { defaultValue: 'Años' })}`;
  };
  const lotLabel = getAntiguedadLabel(propiedad.antiguedad);

  return (
    <View style={{ flex: 1 }}>
      {/* Fullscreen Lightbox Modal (Mercado Libre Zoom style) */}
      <Modal
        visible={lightboxVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
      >
        <View style={s.modalBackdrop}>
          {/* Header row in modal */}
          <View style={s.modalHeader}>
            <Text style={s.modalIndex}>
              {lightboxIndex + 1} / {imagenes.length}
            </Text>
            <TouchableOpacity
              onPress={() => setLightboxVisible(false)}
              style={s.modalCloseBtn}
            >
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Centered Workspace */}
          <View style={s.modalWorkspace}>
            {/* Left navigation arrow (only shown if there are multiple images) */}
            {imagenes.length > 1 && (
              <TouchableOpacity
                onPress={prevPhoto}
                style={[s.modalNavArrow, s.modalNavArrowLeft]}
              >
                <Text style={s.modalArrowText}>‹</Text>
              </TouchableOpacity>
            )}

            {/* Main Image */}
            <View style={s.modalMainImageWrap}>
              <Image
                source={{ uri: imagenes[lightboxIndex] }}
                style={s.modalMainImage}
                resizeMode="contain"
              />
            </View>

            {/* Right navigation arrow (only shown if there are multiple images) */}
            {imagenes.length > 1 && (
              <TouchableOpacity
                onPress={nextPhoto}
                style={[s.modalNavArrow, s.modalNavArrowRight]}
              >
                <Text style={s.modalArrowText}>›</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Thumbnails Scrollbar (only shown if there are multiple images) */}
          {imagenes.length > 1 && (
            <View style={s.modalThumbsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.modalThumbsScrollContent}>
                {imagenes.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setLightboxIndex(idx)}
                    style={[
                      s.modalThumbWrap,
                      lightboxIndex === idx && s.modalThumbWrapActive
                    ]}
                  >
                    <Image source={{ uri: img }} style={s.modalThumbImg} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        style={s.page}
        contentContainerStyle={s.pageScrollContent}
      >

        {/* ══ PROPERTY HEADER (HERO) ══ */}
        <View style={[s.propHeader, { minHeight: esPantallaGrande ? 460 : 340, height: 'auto' }]}>
          <Image source={{ uri: imagenes[imagenActiva] }} style={s.propBgImage} resizeMode="cover" />
          <View style={s.propOverlay} />

          <View style={[s.propHeaderBody, { paddingHorizontal: padHoriz }, !esPantallaGrande && { paddingTop: 20 }]}>
            {/* Breadcrumb */}
            <View style={s.breadcrumb}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => onVolver && onVolver(esRenta ? 'renta' : 'venta')}
                  {...hoverProps(setHoveredVolver)}
                  style={[s.backArrowBtn, hoveredVolver && s.backArrowBtnHover]}
                >
                  <Text style={s.backArrowText}>← {t('vd_back', { defaultValue: 'Volver' })}</Text>
                </TouchableOpacity>

                {(() => {
                  const isAdmin = user?.isAdmin || user?.email === 'admin@inmoviral.com' || user?.id === 'admin-id-0000';
                  const canEdit = user && (isAdmin || user.id === propiedad.user_id || user.id === propiedad.propietario_id);
                  if (!canEdit) return null;
                  return (
                    <TouchableOpacity
                      onPress={() => onEditarPropiedad && onEditarPropiedad(propiedad)}
                      style={s.editPropertyHeaderBtn}
                    >
                      <FontAwesome name="edit" size={11} color="#000" style={{ marginRight: 6 }} />
                      <Text style={s.editPropertyHeaderBtnText}>{esES ? 'EDITAR PROPIEDAD' : 'EDIT PROPERTY'}</Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
              <View style={s.breadcrumbLinks}>
                <TouchableOpacity onPress={() => onVolver && onVolver('home')}>
                  <Text style={s.breadcrumbText}>{t('vp_breadcrumb_inicio')}</Text>
                </TouchableOpacity>
                <Text style={s.breadcrumbSep}>/</Text>
                <TouchableOpacity onPress={() => onVolver && onVolver(esRenta ? 'renta' : 'venta')}>
                  <Text style={s.breadcrumbText}>{esRenta ? t('vp_breadcrumb_renta') : t('vp_breadcrumb_venta')}</Text>
                </TouchableOpacity>
                <Text style={s.breadcrumbSep}>/</Text>
                <Text style={s.breadcrumbCurrent} numberOfLines={1}>{propiedad.titulo}</Text>
              </View>
            </View>

            {/* Tag */}
            <View style={s.propTagRow}>
              <View style={s.propTagLine} />
              <Text style={s.propTagText}>
                {propiedad.tipo_inmueble || 'Propiedad'} · {esRenta ? 'PRESTIGE RENTAL' : 'PRESTIGE SALE'}
              </Text>
            </View>

            {/* Title */}
            <Text style={s.propTitle} numberOfLines={2}>{propiedad.titulo}</Text>

            {/* Location (Only showing general city/state for guest or full address for logged in) */}
            <View style={s.propLocationRow}>
              <Text style={s.propLocationText}>
                {user ? propiedad.ubicacion : (propiedad.ciudad && propiedad.estado ? `${propiedad.ciudad}, ${propiedad.estado}, MX` : t('vp_location_locked_title'))}
              </Text>
            </View>

            {/* Price & Stats Row */}
            <View style={s.priceStatsRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <View>
                  <Text style={s.priceLabel}>{t('vp_listing_price', { defaultValue: 'LISTING PRICE' })}</Text>
                  <Text style={s.priceAmount}>
                    ${formatPrecio(propiedad.precio)} <Text style={s.priceCurrency}>MXN</Text>
                  </Text>
                </View>

                {/* Botón de Favorito */}
                <TouchableOpacity
                  onPress={handleToggleFavorito}
                  style={{
                    backgroundColor: favorito ? 'rgba(160,120,64,0.15)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: favorito ? T.gold : 'rgba(255,255,255,0.15)',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    alignSelf: 'flex-end',
                    marginBottom: 2,
                  }}
                >
                  <FontAwesome
                    name={favorito ? 'heart' : 'heart-o'}
                    size={16}
                    color={favorito ? T.gold : '#FFF'}
                  />
                  <Text style={{
                    fontFamily: T.sans,
                    fontSize: 12,
                    fontWeight: '600',
                    color: favorito ? T.gold : '#FFF',
                    letterSpacing: 1
                  }}>
                    {favorito ? (esES ? 'GUARDADO' : 'SAVED') : (esES ? 'GUARDAR' : 'SAVE')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.statsContainer}>
                <View style={s.statBox}>
                  <Text style={s.statNum}>{recLabel}</Text>
                  <Text style={s.statLabel}>{t('props_rec', { defaultValue: 'Recámaras' })}</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={s.statNum}>{banLabel}</Text>
                  <Text style={s.statLabel}>{t('props_banos', { defaultValue: 'Baños' })}</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={s.statNum}>{areaLabel}</Text>
                  <Text style={s.statLabel}>{t('vp_area', { defaultValue: 'Superficie' })}</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={s.statNum}>{lotLabel}</Text>
                  <Text style={s.statLabel}>{t('vp_age_label', { defaultValue: 'Antigüedad' })}</Text>
                </View>
              </View>
            </View>

          </View>
        </View>

        {/* ══ CLEAN GALLERY SECTION (NO PLACEHOLDERS) ══ */}
        <View style={[s.galleryGridSection, { paddingHorizontal: padHoriz }]}>
          <View style={s.galleryContainer}>
            {/* Main active image - fits standard proportions and uses contain to keep full document visible */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => abrirLightbox(imagenActiva)}
              style={[s.mainImageContainer, { height: esPantallaGrande ? 480 : 300 }]}
            >
              <Image
                source={{ uri: imagenes[imagenActiva] }}
                style={s.mainImage}
                resizeMode="contain"
              />
              <View style={s.zoomIconOverlay}>
                <Text style={s.zoomIconText}>{t('vp_click_zoom', { defaultValue: 'AGRANDAR FOTO' })}</Text>
              </View>
            </TouchableOpacity>

            {/* Horizontal thumbnails below main image (Only rendered if property has multiple images) */}
            {imagenes.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.thumbsHorizontal}
                contentContainerStyle={s.thumbsHorizontalContent}
              >
                {imagenes.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setImagenActiva(idx)}
                    style={[
                      s.thumbItemHoriz,
                      imagenActiva === idx && s.thumbItemHorizActive
                    ]}
                  >
                    <Image source={{ uri: img }} style={s.thumbImg} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* ══ MAIN CONTENT LAYOUT (DARK LUXURY) ══ */}
        <View style={[s.propertyContent, { paddingHorizontal: padHoriz }]}>
          <View style={[s.layoutColumns, esPantallaGrande ? s.layoutColumnsWeb : s.layoutColumnsMobile]}>

            {/* Left Column */}
            <View style={s.mainColumn}>

              {/* Overview */}
              <View style={s.contentBlock}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionHeaderLine} />
                  <Text style={s.sectionHeaderLabel}>{t('vp_overview', { defaultValue: 'Overview' })}</Text>
                </View>
                <Text style={s.contentBlockTitle}>{t('vp_architecture_title', { defaultValue: 'AN ARCHITECTURAL STATEMENT' })}</Text>

                {propiedad.descripcion ? (
                  propiedad.descripcion.split('\n').filter(Boolean).map((para, i) => (
                    <Text key={i} style={s.blockParagraph}>{para}</Text>
                  ))
                ) : (
                  <Text style={s.blockParagraph}>{t('vp_descripcion_default')}</Text>
                )}
              </View>

              {/* Specifications */}
              <View style={s.contentBlock}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionHeaderLine} />
                  <Text style={s.sectionHeaderLabel}>{t('vp_specifications', { defaultValue: 'Specifications' })}</Text>
                </View>
                <Text style={s.contentBlockTitle}>{t('vp_specs_details', { defaultValue: 'PROPERTY DETAILS' })}</Text>

                <View style={s.specGrid}>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('vp_type', { defaultValue: 'TYPE' })}</Text>
                    <Text style={s.specCellValue}>{propiedad.tipo_inmueble || 'Casa'}</Text>
                  </View>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('vp_operation', { defaultValue: 'OPERATION' })}</Text>
                    <Text style={s.specCellValue}>{propiedad.tipo_transaccion || 'Venta'}</Text>
                  </View>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('vp_total_area', { defaultValue: 'TOTAL AREA' })}</Text>
                    <Text style={s.specCellValue}>{areaLabel}</Text>
                  </View>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('vp_age_label', { defaultValue: 'AGE' })}</Text>
                    <Text style={s.specCellValue}>{lotLabel}</Text>
                  </View>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('props_rec', { defaultValue: 'BEDROOMS' })}</Text>
                    <Text style={s.specCellValue}>{recLabel}</Text>
                  </View>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('props_banos', { defaultValue: 'BATHROOMS' })}</Text>
                    <Text style={s.specCellValue}>{banLabel}</Text>
                  </View>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('vp_estacionamiento', { defaultValue: 'GARAGE' })}</Text>
                    <Text style={s.specCellValue}>
                      {propiedad.estacionamientos || 0} {idiomaActual.startsWith('es') ? 'Autos' : 'Cars'}
                    </Text>
                  </View>
                  <View style={s.specCell}>
                    <Text style={s.specCellLabel}>{t('vp_status', { defaultValue: 'STATUS' })}</Text>
                    <Text style={s.specCellValue}>
                      {idiomaActual.startsWith('es') ? 'Disponible' : 'Available'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Amenities */}
              {amenidades.length > 0 && (
                <View style={s.contentBlock}>
                  <View style={s.sectionHeader}>
                    <View style={s.sectionHeaderLine} />
                    <Text style={s.sectionHeaderLabel}>{t('vp_amenidades_title', { defaultValue: 'Amenities' })}</Text>
                  </View>
                  <Text style={s.contentBlockTitle}>{t('vp_features_finishes', { defaultValue: 'FEATURES & FINISHES' })}</Text>

                  <View style={s.amenitiesGrid}>
                    {amenidades.map((am, idx) => (
                      <View key={idx} style={[s.amenityCell, { width: esPantallaMediana ? '48%' : '100%' }]}>
                        <Text style={s.amenityCheck}>✓</Text>
                        <Text style={s.amenityText}>{t(am, { defaultValue: am })}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Location & Map (Fully locked behind user session check) */}
              <View style={s.contentBlock}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionHeaderLine} />
                  <Text style={s.sectionHeaderLabel}>{t('vp_ubicacion_title', { defaultValue: 'Location' })}</Text>
                </View>
                <Text style={s.contentBlockTitle}>
                  {propiedad.colonia || propiedad.ciudad || 'PRESTIGE RESIDENTIAL'}
                </Text>

                {user ? (
                  <>
                    {/* Written Address details */}
                    <View style={s.addressTextBox}>
                      <Text style={s.addressLabel}>{t('vp_address_written', { defaultValue: 'DIRECCIÓN DE LA PROPIEDAD' })}</Text>
                      <Text style={s.addressContentText}>
                        {propiedad.ubicacion}
                      </Text>
                      <Text style={s.locationDescText}>
                        {t('vp_location_description', { defaultValue: 'Situada en una de las zonas residenciales más prestigiosas, con excelente plusvalía, accesos rápidos y cercanía a escuelas, centros de negocios y gastronomía de alto nivel.' })}
                      </Text>
                    </View>

                    {/* Map Frame */}
                    <View style={s.mapFrame}>
                      <PropertyMap lat={propiedad.lat} lng={propiedad.lng} titulo={propiedad.titulo} ubicacion={propiedad.ubicacion} />
                    </View>
                  </>
                ) : (
                  <View style={s.lockedMapContainer}>
                    <Text style={s.lockedMapTitle}>{t('vp_location_locked_title')}</Text>
                    <Text style={s.lockedMapText}>{t('vp_location_locked_text')}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={s.lockedMapBtn}
                      onPress={() => onVolver && onVolver('login')}
                    >
                      <Text style={s.lockedMapBtnText}>{t('navbar.login', { defaultValue: 'INICIAR SESIÓN' })}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            </View>

            {/* Right Column (Sidebar Card) */}
            <View style={s.sidebarColumn}>
              <View style={s.sidebarCard}>
                <Text style={s.sidebarPriceLabel}>{t('vp_listing_price', { defaultValue: 'LISTING PRICE' })}</Text>
                <Text style={s.sidebarPrice}>${formatPrecio(propiedad.precio)} <Text style={s.sidebarPriceCurrency}>MXN</Text></Text>

                {propiedad.m2 && (
                  <Text style={s.sidebarPriceSub}>
                    MXN · ${formatPrecio(Math.round(propiedad.precio / propiedad.m2))} / M²
                  </Text>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  {...hoverProps(setHoveredSchedule)}
                  style={[s.btnPrimaryFull, hoveredSchedule && s.btnPrimaryFullHover]}
                >
                  <Text style={s.btnPrimaryFullText}>{t('solutions.visit_cta', { defaultValue: 'AGENDAR VISITA →' })}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  {...hoverProps(setHoveredInfo)}
                  style={[s.btnOutlineFull, hoveredInfo && s.btnOutlineFullHover]}
                >
                  <Text style={[s.btnOutlineFullText, hoveredInfo && s.btnOutlineFullTextHover]}>{t('vp_contact_title', { defaultValue: 'SOLICITAR INFO' })}</Text>
                </TouchableOpacity>

                <View style={s.sidebarDivider} />

                {/* Agent Details */}
                {user ? (
                  <View>
                    <View style={s.agentRow}>
                      {propiedad.avatar_url_contacto ? (
                        <Image source={{ uri: propiedad.avatar_url_contacto }} style={s.agentAvatarImage} />
                      ) : (
                        <View style={s.agentAvatar}>
                          <Text style={s.agentAvatarText}>
                            {(propiedad.nombre_contacto || t('vp_agente_default'))[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={s.agentName}>{propiedad.nombre_contacto || t('vp_agente_default')}</Text>
                        <Text style={s.agentRole}>{t('vp_agente_role')}</Text>
                      </View>
                    </View>

                    {/* Agent Contacts */}
                    <View style={s.agentContacts}>
                      {propiedad.telefono_contacto && (
                        <TouchableOpacity onPress={abrirTelefono} style={s.agentContactLink}>
                          <Text style={s.agentContactText}>Tel: {formatTelefonoRender(propiedad.telefono_contacto)}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`mailto:${propiedad.email_contacto || 'info@inmoviral.com'}`)}
                        style={s.agentContactLink}
                      >
                        <Text style={s.agentContactText}>Email: {propiedad.email_contacto || 'info@inmoviral.com'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={s.sidebarDivider} />

                    {/* Quick message form */}
                    <View style={s.quickForm}>
                      <TextInput
                        style={s.formInput}
                        placeholder={t('register_name_lbl', { defaultValue: 'Nombre completo' })}
                        placeholderTextColor={T.textSub}
                        value={nombre}
                        onChangeText={setNombre}
                      />
                      <TextInput
                        style={s.formInput}
                        placeholder={t('login_email_lbl', { defaultValue: 'Correo electrónico' })}
                        placeholderTextColor={T.textSub}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                      />
                      <TextInput
                        style={s.formInput}
                        placeholder={t('register_phone_lbl', { defaultValue: 'Teléfono' })}
                        placeholderTextColor={T.textSub}
                        keyboardType="phone-pad"
                        value={telefono}
                        onChangeText={setTelefono}
                      />
                      <TextInput
                        style={[s.formInput, s.formTextArea]}
                        placeholder={t('vp_form_mensaje', { defaultValue: 'Mensaje' })}
                        placeholderTextColor={T.textSub}
                        multiline
                        numberOfLines={3}
                        value={mensaje}
                        onChangeText={setMensaje}
                      />

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleEnviarMensaje}
                        {...hoverProps(setHoveredEnviar)}
                        style={[s.submitBtn, hoveredEnviar && s.submitBtnHover]}
                      >
                        <Text style={s.submitBtnText}>{t('vp_form_enviar', { defaultValue: 'ENVIAR MENSAJE' })}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleChatWithSeller}
                        {...hoverProps(setHoveredChat)}
                        style={[s.chatBtn, hoveredChat && s.chatBtnHover]}
                      >
                        <Text style={s.chatBtnText}>{t('chat.start_chat', { defaultValue: 'CHATEAR CON EL VENDEDOR' })}</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={s.formOrText}>{t('vp_contact_o')}</Text>

                    <View style={s.actionRow}>
                      <TouchableOpacity
                        onPress={abrirTelefono}
                        {...hoverProps(setHoveredLlamar)}
                        style={[s.altActionBtn, hoveredLlamar && s.altActionBtnHover]}
                      >
                        <Text style={[s.altActionBtnText, hoveredLlamar && s.altActionBtnTextHover]}>{t('vp_llamar')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={abrirWhatsApp}
                        {...hoverProps(setHoveredWhatsApp)}
                        style={[s.altActionBtn, hoveredWhatsApp && s.altActionBtnHover]}
                      >
                        <Text style={[s.altActionBtnText, hoveredWhatsApp && s.altActionBtnTextHover]}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                ) : (
                  <View style={s.lockedFormContainer}>
                    <Text style={s.lockedFormTitle}>{t('vp_contact_locked_title')}</Text>
                    <Text style={s.lockedFormText}>{t('vp_contact_locked_text')}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={s.lockedFormBtn}
                      onPress={() => onVolver && onVolver('login')}
                    >
                      <Text style={s.lockedFormBtnText}>{t('navbar.login', { defaultValue: 'INICIAR SESIÓN' })}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={s.sidebarDivider} />

                {/* Quick Facts */}
                <View style={s.quickFacts}>
                  <View style={s.factRow}>
                    <Text style={s.factKey}>{idiomaActual.startsWith('es') ? 'ID de propiedad' : 'Property ID'}</Text>
                    <Text style={s.factVal}>INV-{String(propiedad.id).padStart(4, '0')}</Text>
                  </View>
                  <View style={s.factRow}>
                    <Text style={s.factKey}>{idiomaActual.startsWith('es') ? 'Estado' : 'Status'}</Text>
                    <View style={s.factStatusRow}>
                      <View style={s.statusDot} />
                      <Text style={s.factVal}>{idiomaActual.startsWith('es') ? 'Disponible' : 'Available'}</Text>
                    </View>
                  </View>
                  <View style={s.factRow}>
                    <Text style={s.factKey}>{idiomaActual.startsWith('es') ? 'Publicado' : 'Listed'}</Text>
                    <Text style={s.factVal}>{idiomaActual.startsWith('es') ? 'Junio 2026' : 'June 2026'}</Text>
                  </View>
                </View>

              </View>
            </View>

          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: T.bgPage,
  },
  pageScrollContent: {
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: T.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 450,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: T.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 450,
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

  // ══ FULLSCREEN LIGHTBOX MODAL (Mercado Libre Zoom Style) ══
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,7,5,0.98)',
    justifyContent: 'space-between',
    paddingVertical: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    height: 50,
  },
  modalIndex: {
    fontFamily: T.serif,
    fontSize: 16,
    color: T.white,
    letterSpacing: 1.5,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  modalCloseText: {
    fontSize: 18,
    color: T.white,
    fontWeight: '300',
  },
  modalWorkspace: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  modalNavArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalNavArrowLeft: {},
  modalNavArrowRight: {},
  modalArrowText: {
    fontSize: 28,
    color: T.white,
    fontWeight: '300',
    marginTop: -4,
  },
  modalMainImageWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalMainImage: {
    width: '100%',
    height: '100%',
    maxWidth: 900,
  },
  modalThumbsContainer: {
    height: 90,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  modalThumbsScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  modalThumbWrap: {
    width: 70,
    height: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    opacity: 0.6,
  },
  modalThumbWrapActive: {
    borderColor: T.gold,
    opacity: 1,
  },
  modalThumbImg: {
    width: '100%',
    height: '100%',
  },

  // ══ HERO HEADER ══
  propHeader: {
    position: 'relative',
    justifyContent: 'flex-end',
    backgroundColor: T.bgPage,
    overflow: 'hidden',
  },
  propBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  propOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,9,5,0.7)',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to right, rgba(12,9,5,0.88) 0%, rgba(12,9,5,0.45) 55%, rgba(12,9,5,0.15) 100%)',
      }
    })
  },
  propHeaderBody: {
    position: 'relative',
    zIndex: 5,
    paddingBottom: 40,
    paddingTop: Platform.select({
      web: 110,
      default: 110 + (Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24))
    }),
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
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
    backgroundColor: 'rgba(160,120,64,0.15)',
  },
  backArrowText: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.goldLight,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  breadcrumbLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  breadcrumbText: {
    fontFamily: T.sans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  breadcrumbSep: {
    fontFamily: T.sans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8,
  },
  breadcrumbCurrent: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.goldLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    maxWidth: 200,
  },
  propTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  propTagLine: {
    width: 30,
    height: 1,
    backgroundColor: T.goldLight,
    marginRight: 10,
  },
  propTagText: {
    fontFamily: T.sans,
    fontSize: 10,
    fontWeight: '400',
    color: T.goldLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  propTitle: {
    fontFamily: T.serif,
    fontSize: Platform.OS === 'web' ? 44 : 32,
    fontWeight: '300',
    color: T.textMain,
    lineHeight: Platform.OS === 'web' ? 52 : 38,
    marginBottom: 12,
  },
  propLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 6,
  },
  propLocationText: {
    fontFamily: T.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '300',
  },
  priceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 24,
    flexWrap: 'wrap',
    gap: 20,
  },
  priceLabel: {
    fontFamily: T.sans,
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  priceAmount: {
    fontFamily: T.serif,
    fontSize: 32,
    color: T.textMain,
  },
  priceCurrency: {
    fontFamily: T.sans,
    fontSize: 14,
    color: T.goldLight,
    fontWeight: '400',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statNum: {
    fontFamily: T.serif,
    fontSize: 20,
    color: T.textMain,
  },
  statLabel: {
    fontFamily: T.sans,
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // ══ GALLERY CONTAINER ══
  galleryGridSection: {
    backgroundColor: T.bgPage,
    paddingTop: 16,
    paddingBottom: 0,
  },
  galleryContainer: {
    marginTop: 10,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  mainImageContainer: {
    width: '100%',
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  thumbsHorizontal: {
    marginTop: 12,
    flexDirection: 'row',
  },
  thumbsHorizontalContent: {
    gap: 10,
  },
  thumbItemHoriz: {
    width: 80,
    height: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  thumbItemHorizActive: {
    borderColor: T.gold,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  zoomIconOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(15,13,10,0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIconText: {
    fontFamily: T.sans,
    fontSize: 9.5,
    color: T.white,
    letterSpacing: 1,
    fontWeight: '500',
  },

  // ══ TWO COLUMN CONTENT LAYOUT ══
  propertyContent: {
    backgroundColor: T.bgPage,
    paddingVertical: 80,
  },
  layoutColumns: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  layoutColumnsWeb: Platform.select({
    web: {
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: 80,
    },
    default: {}
  }),
  layoutColumnsMobile: {
    flexDirection: 'column',
    gap: 48,
  },
  mainColumn: {
    flex: 1,
  },
  sidebarColumn: {
    width: '100%',
  },

  contentBlock: {
    marginBottom: 56,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLine: {
    width: 24,
    height: 1,
    backgroundColor: T.gold,
    marginRight: 10,
  },
  sectionHeaderLabel: {
    fontFamily: T.sans,
    fontSize: 10,
    fontWeight: '400',
    color: T.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  contentBlockTitle: {
    fontFamily: T.serif,
    fontSize: 26,
    color: T.textMain,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 20,
    fontWeight: '400',
  },
  blockParagraph: {
    fontFamily: T.sans,
    fontSize: 14,
    color: 'rgba(242,237,229,0.75)',
    lineHeight: 26,
    fontWeight: '300',
    marginBottom: 16,
  },

  // Specs Grid
  specGrid: {
    borderWidth: 1,
    borderColor: T.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specCell: {
    width: '50%',
    padding: 20,
    borderWidth: 0.5,
    borderColor: T.border,
    backgroundColor: T.bgCard,
    ...Platform.select({
      web: {
        width: '25%',
      }
    })
  },
  specCellLabel: {
    fontFamily: T.sans,
    fontSize: 9,
    color: T.gold,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  specCellValue: {
    fontFamily: T.serif,
    fontSize: 17,
    fontWeight: '500',
    color: T.textMain,
  },

  // Amenities checklist
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    columnGap: 20,
  },
  amenityCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amenityCheck: {
    fontFamily: T.sans,
    fontSize: 14,
    fontWeight: '700',
    color: T.gold,
  },
  amenityText: {
    fontFamily: T.sans,
    fontSize: 13.5,
    color: 'rgba(242,237,229,0.85)',
    fontWeight: '300',
  },

  // Written Address & Map block
  addressTextBox: {
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    padding: 24,
    marginBottom: 16,
  },
  addressLabel: {
    fontFamily: T.sans,
    fontSize: 9,
    color: T.gold,
    letterSpacing: 1.5,
    marginBottom: 8,
    fontWeight: '600',
  },
  addressContentText: {
    fontFamily: T.serif,
    fontSize: 18,
    color: T.textMain,
    marginBottom: 10,
    fontWeight: '500',
  },
  locationDescText: {
    fontFamily: T.sans,
    fontSize: 12.5,
    color: T.textSub,
    lineHeight: 20,
    fontWeight: '300',
  },
  mapFrame: {
    height: 280,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: T.bgCard,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  mapLink: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(15,13,10,0.85)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mapLinkLabel: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.white,
    letterSpacing: 1,
    fontWeight: '400',
  },

  // Locked map/form styles
  lockedMapContainer: {
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 60,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedMapTitle: {
    fontFamily: T.serif,
    fontSize: 16,
    color: T.goldLight,
    letterSpacing: 1.5,
    fontWeight: '500',
    marginBottom: 6,
  },
  lockedMapText: {
    fontFamily: T.sans,
    fontSize: 12.5,
    color: T.textSub,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 320,
  },
  lockedMapBtn: {
    backgroundColor: T.gold,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 1,
  },
  lockedMapBtnText: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.white,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // ══ SIDEBAR CARD ══
  sidebarCard: {
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    padding: 32,
  },
  sidebarPriceLabel: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.gold,
    letterSpacing: 1.5,
    marginBottom: 8,
    fontWeight: '600',
  },
  sidebarPrice: {
    fontFamily: T.serif,
    fontSize: 30,
    color: T.textMain,
    fontWeight: '400',
    marginBottom: 4,
  },
  sidebarPriceCurrency: {
    fontFamily: T.sans,
    fontSize: 14,
    color: T.gold,
  },
  sidebarPriceSub: {
    fontFamily: T.sans,
    fontSize: 11.5,
    color: T.textSub,
    marginBottom: 24,
    fontWeight: '300',
  },
  btnPrimaryFull: {
    width: '100%',
    backgroundColor: T.gold,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnPrimaryFullHover: {
    backgroundColor: T.goldLight,
  },
  btnPrimaryFullText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.white,
    letterSpacing: 1.5,
    fontWeight: '400',
  },
  btnOutlineFull: {
    width: '100%',
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineFullHover: {
    backgroundColor: T.gold,
  },
  btnOutlineFullText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.textMain,
    letterSpacing: 1.5,
    fontWeight: '400',
  },
  btnOutlineFullTextHover: {
    color: T.white,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 24,
  },

  // Agent Details inside Sidebar
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  agentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: T.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAvatarText: {
    fontFamily: T.sans,
    fontSize: 18,
    color: T.white,
    fontWeight: '700',
  },
  agentAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  agentName: {
    fontFamily: T.serif,
    fontSize: 17,
    color: T.textMain,
    fontWeight: '500',
  },
  agentRole: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.textSub,
    letterSpacing: 1,
    marginTop: 2,
  },
  agentContacts: {
    gap: 8,
  },
  agentContactLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentContactText: {
    fontFamily: T.sans,
    fontSize: 12.5,
    color: 'rgba(242,237,229,0.7)',
    fontWeight: '300',
  },

  // Sidebar Form
  quickForm: {
    gap: 10,
  },
  formInput: {
    backgroundColor: '#0a0907',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 12.5,
    color: T.textMain,
    fontFamily: T.sans,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  },
  formTextArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: T.gold,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnHover: {
    backgroundColor: T.goldLight,
  },
  submitBtnText: {
    fontFamily: T.sans,
    fontSize: 10.5,
    color: T.white,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  chatBtn: {
    borderWidth: 1,
    borderColor: T.gold,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  chatBtnHover: {
    backgroundColor: 'rgba(160,120,64,0.1)',
  },
  chatBtnText: {
    fontFamily: T.sans,
    fontSize: 10.5,
    color: T.gold,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  formOrText: {
    fontFamily: T.sans,
    fontSize: 9,
    color: T.textSub,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginVertical: 16,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  altActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    gap: 6,
  },
  altActionBtnHover: {
    borderColor: T.gold,
    backgroundColor: 'rgba(160,120,64,0.06)',
  },
  altActionBtnText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.textMain,
    fontWeight: '500',
  },
  altActionBtnTextHover: {
    color: T.gold,
  },

  lockedFormContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  lockedFormTitle: {
    fontFamily: T.serif,
    fontSize: 15,
    color: T.gold,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  lockedFormText: {
    fontFamily: T.sans,
    fontSize: 12,
    color: T.textSub,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  lockedFormBtn: {
    backgroundColor: T.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  lockedFormBtnText: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.white,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Quick Facts
  quickFacts: {
    gap: 12,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  factKey: {
    fontFamily: T.sans,
    fontSize: 11.5,
    color: T.textSub,
  },
  factVal: {
    fontFamily: T.sans,
    fontSize: 11.5,
    color: T.textMain,
    fontWeight: '500',
  },
  factStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.goldLight,
  },

  // ══ SIMILAR LISTINGS SECTION ══
  similarSection: {
    backgroundColor: T.bgPage,
    paddingVertical: 80,
  },
  similarHeader: {
    marginBottom: 44,
  },
  similarTitleText: {
    fontFamily: T.serif,
    fontSize: 26,
    color: T.textMain,
    letterSpacing: 1,
    fontWeight: '400',
    marginTop: 6,
  },
  similarGrid: {
    gap: 20,
  },
  similarGridWeb: Platform.select({
    web: {
      flexDirection: 'row',
    },
    default: {}
  }),
  similarGridMobile: {
    flexDirection: 'column',
  },
  similarCard: {
    flex: 1,
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  similarCardWeb: {
    flexDirection: 'row',
    minHeight: 260,
  },
  similarCardMobile: {
    flexDirection: 'column-reverse',
  },
  similarCardBody: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  similarCardTag: {
    fontFamily: T.sans,
    fontSize: 9,
    color: T.gold,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 10,
  },
  similarCardTitle: {
    fontFamily: T.serif,
    fontSize: 22,
    color: T.textMain,
    letterSpacing: 0.5,
    lineHeight: 26,
    marginBottom: 8,
    fontWeight: '400',
  },
  similarCardPrice: {
    fontFamily: T.sans,
    fontSize: 12.5,
    color: T.goldLight,
    fontWeight: '500',
    marginBottom: 12,
  },
  similarCardDesc: {
    fontFamily: T.sans,
    fontSize: 12.5,
    color: T.textSub,
    lineHeight: 18,
    fontWeight: '300',
    marginBottom: 20,
  },
  similarCardBtn: {
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  similarCardBtnText: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.textMain,
    letterSpacing: 1,
    fontWeight: '500',
  },
  similarCardImgWrap: {
    width: '100%',
    height: 220,
    ...Platform.select({
      web: {
        width: 220,
        height: '100%',
      }
    })
  },
  similarCardImg: {
    width: '100%',
    height: '100%',
  },

  // ══ CTA BANNER ══
  ctaBanner: {
    height: 380,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBannerBg: {
    ...StyleSheet.absoluteFillObject,
  },
  ctaBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,9,5,0.75)',
  },
  ctaBannerContent: {
    position: 'relative',
    zIndex: 2,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ctaBannerLabel: {
    fontFamily: T.sans,
    fontSize: 10,
    color: T.goldLight,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 16,
  },
  ctaBannerTitle: {
    fontFamily: T.serif,
    fontSize: 36,
    color: T.white,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 44,
    marginBottom: 28,
  },
  btnPrimary: {
    backgroundColor: T.gold,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  btnPrimaryHover: {
    backgroundColor: T.goldLight,
  },
  btnPrimaryText: {
    fontFamily: T.sans,
    fontSize: 10.5,
    color: T.white,
    letterSpacing: 1.5,
    fontWeight: '500',
  },

  // ══ FOOTER ══
  footer: {
    backgroundColor: T.bgPage,
    paddingTop: 80,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: T.border,
  },
  footerTop: {
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 50,
    gap: 40,
  },
  footerTopRow: {
    flexDirection: 'row',
  },
  footerTopCol: {
    flexDirection: 'column',
  },
  footerCol: {
    flex: 1,
    gap: 12,
  },
  footerLogo: {
    fontFamily: T.serif,
    fontSize: 24,
    color: T.white,
    letterSpacing: 6,
    fontWeight: '400',
    marginBottom: 8,
  },
  footerTagline: {
    fontFamily: T.sans,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 20,
    fontWeight: '300',
    marginBottom: 12,
  },
  footerSocialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerSocialBadge: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSocialBadgeText: {
    fontFamily: T.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  footerColTitle: {
    fontFamily: T.sans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  footerColLink: {
    fontFamily: T.sans,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '300',
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    flexWrap: 'wrap',
    gap: 16,
  },
  footerBottomText: {
    fontFamily: T.sans,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.25)',
  },
  footerBottomLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  footerBottomLinkText: {
    fontFamily: T.sans,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.25)',
  },
  editPropertyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A07840',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#A07840',
    borderRadius: 0,
    marginLeft: 12,
  },
  editPropertyHeaderBtnText: {
    color: '#000',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
