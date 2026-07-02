import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const C = {
  bg:         '#0F0D0A',
  card:       '#141210',
  surface:    '#1A1714',
  gold:       '#A07840',
  goldDeep:   '#C49A58',
  text:       '#F2EDE5',
  textSub:    '#7A6E62',
  textDim:    'rgba(242,237,229,0.40)',
  border:     'rgba(160,120,64,0.12)',
  borderSoft: 'rgba(255,255,255,0.07)',
  green:      'rgba(37,211,102,0.85)',
  greenBg:    'rgba(37,211,102,0.10)',
  greenBdr:   'rgba(37,211,102,0.30)',
  serif:      Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:       Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1800&q=80';
const GUARANTEE_IMAGE = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80';

const CONTACT_PHONE = '+526181630471';
const CONTACT_WA    = 'https://wa.me/526181630471';
const CONTACT_EMAIL = 'info@inmoviral.com';

// 📷 REPOSITORIO MULTIMEDIA DE ALTA GAMA PARA LOS 5 SERVICIOS CORE
const GALERIAS_SERVICIOS = {
  mudanza: [
    'https://images.unsplash.com/photo-1527453303844-40fae2828e4f?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80'
  ],
  socials: [
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
  ],
  studio: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80'
  ],
  advisory: [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80'
  ],
  limpieza: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', // Detallado de cocina de lujo
    'https://images.unsplash.com/photo-1528740561666-42477927365f?w=800&q=80', // Sanitización e interiores pulcro
    'https://images.unsplash.com/photo-1603712449591-2f7e1216c59a?w=800&q=80'  // Sala reluciente de revista
  ]
};

// ─────────────────────────────────────────────
// COMPONENTES DE SOPORTE E INTERACCIÓN NATIVA
// ─────────────────────────────────────────────

function FooterLink({ label, onPress, customStyle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={{ alignSelf: 'flex-start' }}
    >
      <Text style={[styles.footerLinkText, customStyle, hovered && { color: C.gold, transform: [{ translateX: 4 }] }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SocialBadge({ net }) {
  const [hovered, setHovered] = useState(false);

  const handlePress = async () => {
    let url = '';
    if (net === 'IG') {
      url = 'https://www.instagram.com/inmoviralbis?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
    } else if (net === 'WH') {
      url = 'https://wa.me/526181630471';
    } else if (net === 'GM') {
      url = 'mailto:ventas@inmoviral.com.mx';
    } else if (net === 'FB') {
      url = 'https://www.facebook.com';
    }

    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(url);
        }
      } catch (err) {
        console.error("Error al abrir URL:", err);
      }
    }
  };

  const getIconName = () => {
    if (net === 'IG') return 'instagram';
    if (net === 'WH') return 'whatsapp';
    if (net === 'FB') return 'facebook';
    if (net === 'GM') return 'envelope';
    return 'circle';
  };

  const activeColor = hovered ? C.gold : 'rgba(255,255,255,0.4)';

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={[styles.footerSocialBtn, hovered && { borderColor: C.gold, backgroundColor: 'rgba(160,120,64,0.05)', transform: [{ scale: 1.08 }] }]}
    >
      <FontAwesome name={getIconName()} size={14} color={activeColor} />
    </Pressable>
  );
}

function ServiceCard({ item, isOpen, onToggle, onMail, onWa, cardWidth }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <View style={[styles.serviceCardWrapper, { width: cardWidth }]}>
      <Pressable
        onPress={onToggle}
        onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
        style={[styles.serviceCard, hovered && styles.serviceCardHovered]}
      >
        <View style={[styles.serviceCardBar, hovered && { backgroundColor: C.goldDeep, height: 3 }]} />
        <Text style={[styles.serviceNum, hovered && { color: 'rgba(160,120,64,0.35)' }]}>{item.num}</Text>
        <Text style={styles.serviceTag}>{t(item.tagKey, { defaultValue: item.tag })}</Text>
        <Text style={styles.serviceTitle}>
          {t(item.titleKey, { defaultValue: item.titulo })}{'\n'}
          <Text style={styles.serviceTitleEm}>{t(item.emKey, { defaultValue: item.tituloEm })}</Text>
        </Text>
        <Text style={styles.serviceDesc}>{t(item.descKey, { defaultValue: item.desc })}</Text>

        <View style={styles.featuresList}>
          {item.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureLine, hovered && { backgroundColor: C.goldDeep, width: 24 }]} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.serviceLink}>
          <Text style={[styles.serviceLinkText, hovered && { color: C.goldDeep }]}>
            {t(item.ctaKey, { defaultValue: item.cta })}  →
          </Text>
        </View>

        {isOpen && (
          <View style={styles.contactPanel}>
            <Text style={styles.contactLabel}>{t('sv_panel_call', { defaultValue: 'Un asesor exclusivo se pondrá en contacto a la brevedad.' })}</Text>
            <View style={styles.contactRow}>
              <Pressable onPress={onMail} style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.contactBtnText}>✉️ {t('footer.contact_t', { defaultValue: 'Mandar Correo' })}</Text>
              </Pressable>
              <Pressable onPress={onWa} style={({ pressed }) => [styles.contactBtn, styles.contactBtnWa, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.contactBtnText, styles.contactBtnTextWa]}>💬 WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function PlanCard({ plan, onPress, cardWidth }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <View style={{ width: cardWidth, padding: 12 }}>
      <Pressable
        onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
        style={[styles.planCard, plan.featured && styles.planCardFeatured, hovered && styles.planCardHovered]}
      >
        {plan.featured && (
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>{t('sv_popular', { defaultValue: 'MÁS POPULAR' })}</Text>
          </View>
        )}
        <Text style={styles.planLabel}>{plan.label}</Text>
        <Text style={styles.planTitulo}>{plan.titulo}</Text>
        <View style={styles.planDivider} />
        <Text style={styles.planPrecio}>{plan.precio}</Text>

        <View style={styles.planFeatures}>
          {plan.features.map((f, i) => (
            <View key={i} style={styles.planFeatureRow}>
              <Text style={styles.planFeatureCheck}>✓</Text>
              <Text style={styles.planFeatureText}>{f}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={onPress}
          style={[
            styles.planBtn,
            plan.featured && styles.planBtnFeatured,
            hovered && !plan.featured && { backgroundColor: 'rgba(160,120,64,0.1)', borderColor: C.gold }
          ]}
        >
          <Text style={[styles.planBtnText, plan.featured && styles.planBtnTextFeatured, hovered && !plan.featured && { color: C.gold }]}>
            {plan.cta}
          </Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL INTEGRADO
// ─────────────────────────────────────────────
export default function ServiciosVirales({ onIrLogin, onVolver }) {
  const { t, i18n }    = useTranslation();
  const idiomaActual   = i18n.language || 'es';
  const { width }      = useWindowDimensions();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const carouselFade = useRef(new Animated.Value(1)).current;

  const [cardActiva, setCardActiva] = useState(null);
  const [hoveredBack, setHoveredBack] = useState(false);
  const [hoveredAboutImg, setHoveredAboutImg] = useState(false);
  const [hoveredGarantiaIdx, setHoveredGarantiaIdx] = useState(null);

  const [servicioActivoTab, setServicioActivoTab] = useState('mudanza');
  const [imagenActivaIdx, setImagenActivaIdx] = useState(0);

  // Layout responsivo adaptado para 5 elementos sin dejar huecos negros
  const isLarge = width > 1024;
  const gridWidth = isLarge ? '33.33%' : width > 640 ? '50%' : '100%';
  const planWidth = isLarge ? '33.33%' : width > 640 ? '50%' : '100%';
  const isWideFooter = width > 768;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [fadeAnim]);

  // Motor de transición fluida automática de 2 segundos (Smooth Cross-Fade)
  useEffect(() => {
    const interval = setInterval(() => {
      const fotos = GALERIAS_SERVICIOS[servicioActivoTab];
      const nextIdx = (imagenActivaIdx + 1) % fotos.length;
      
      Animated.timing(carouselFade, { toValue: 0, duration: 250, useNativeDriver: Platform.OS !== 'web' }).start(() => {
        setImagenActivaIdx(nextIdx);
        Animated.timing(carouselFade, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== 'web' }).start();
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [servicioActivoTab, imagenActivaIdx, carouselFade]);

  const animarCambioTab = (tabId) => {
    Animated.timing(carouselFade, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setServicioActivoTab(tabId);
      setImagenActivaIdx(0);
      Animated.timing(carouselFade, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  const abrirUrl = (url) => Linking.openURL(url).catch(() => {});
  const mandarCorreoOficial = () => abrirUrl(`mailto:${CONTACT_EMAIL}?subject=Consulta%20InmoViral%20Premium`);

  // ESTRUCTURA CON LOS 5 SERVICIOS CORE OFICIALES
  const serviciosData = [
    { id: 1, num: '01', tag: 'Logística', tagKey: 'sv_s1_tag', titulo: 'Ayuda con la', titleKey: 'sv_s1_t', tituloEm: 'Mudanza', emKey: 'sv_s1_em', desc: 'Coordinamos cada detalle de tu traslado con empresas certificadas. Desde el embalaje profesional hasta la instalación en tu nuevo hogar.', descKey: 'sv_s1_desc', features: ['Embalaje profesional', 'Transporte asegurado', 'Coordinación total', 'Seguro de bienes incluido'], cta: 'Solicitar Servicio', ctaKey: 'sv_cta_req' },
    { id: 2, num: '02', tag: 'Marketing Digital', tagKey: 'sv_s2_tag', titulo: 'Exposición en', titleKey: 'sv_s2_t', tituloEm: 'Redes Sociales', emKey: 'sv_s2_em', desc: 'Posicionamos tu propiedad frente a miles de compradores e inversionistas activos mediante campañas segmentadas de alto impacto.', descKey: 'sv_s2_desc', features: ['Campañas pagadas', 'Contenido editorial', 'Audiencias de alto valor', 'Reportes de rendimiento'], cta: 'Solicitar Servicio', ctaKey: 'sv_cta_req' },
    { id: 3, num: '03', tag: 'Visual Premium', tagKey: 'sv_s3_tag', titulo: 'Fotografía', titleKey: 'sv_s3_t', tituloEm: 'Profesional', emKey: 'sv_s3_em', desc: 'Capturamos la esencia y el valor de cada propiedad con equipo de alto rendimiento, tours virtuales 360 y video en 4K.', descKey: 'sv_s3_desc', features: ['Fotografía de interiores', 'Video cinematic 4K', 'Tour virtual 360°', 'Entrega en 48 horas'], cta: 'Solicitar Servicio', ctaKey: 'sv_cta_req' },
    { id: 4, num: '04', tag: 'Consultoría', tagKey: 'sv_s4_tag', titulo: 'Asesoramiento', titleKey: 'sv_s4_t', tituloEm: 'Agente INMOVIRAL', emKey: 'sv_s4_em', desc: 'Un experto dedicado a tu operación de principio a fin. Negociación estratégica y acompañamiento legal certificado.', descKey: 'sv_s4_desc', features: ['Agente senior dedicado', 'Análisis de mercado', 'Due diligence legal', 'Soporte de cierre'], cta: 'Agendar Consulta', ctaKey: 'sv_cta_schedule' },
    { id: 5, num: '05', tag: 'Preparación Estética', tagKey: 'sv_s5_tag', titulo: 'Limpieza Profunda', titleKey: 'sv_s5_t', tituloEm: 'Antes de la Visita', emKey: 'sv_s5_em', desc: 'Dejamos tu inmueble en condiciones idénticas a un hotel de 5 estrellas. Una presentación pulcra maximiza el valor percibido por los sinodales e inversionistas.', descKey: 'sv_s5_desc', features: ['Detallado pre-fotografía', 'Sanitización de alta gama', 'Pulido de superficies finas', 'Aromatización ambiental VIP'], cta: 'Solicitar Limpieza', ctaKey: 'sv_cta_clean' }
  ];

  // 3 NUEVOS PAQUETES EXCLUSIVOS E HÍBRIDOS CON LABIA COMERCIAL AVANZADA
  const planesData = [
    { label: 'VIRAL MULTI-HYBRID', titulo: 'Mudanza + Redes + Sanitización', precio: 'Paquete de Entrada Preferencial', features: ['Traslado de bienes con embalaje premium y seguro', 'Campañas segmentadas nativas (IG, FB, TikTok Ads)', 'Limpieza profunda de grado hotelero antes del shooting', 'Informe digital quincenal de leads y llamadas', 'Soporte logístico de campo con un asesor asignado'], featured: false, cta: 'Adquirir Paquete' },
    { label: 'ULTRA CINEMATIC LAUNCH', titulo: 'Lanzamiento VIP de Revista', precio: 'Estructura por Metraje', features: ['Filmación cinemática 4K con drones e interiores', 'Sesión fotográfica de portada estilo Architectural Digest', 'Detallado estético profundo 5 estrellas pre-visita clave', 'Diseño de Landing Page exclusivo dentro de InmoViral', 'Distribución privada en redes de inversionistas VIP'], featured: true, cta: 'Agendar Lanzamiento' },
    { label: 'END-TO-END PATRIMONIAL', titulo: 'Gestión Absoluta de Activos', precio: 'Suscripción Fija Mensual', features: ['Asesoría legal, fiscal y notarial completa', 'Mantenimiento técnico preventivo y correctivo', 'Limpiezas profundas programadas antes de cada visita', 'Coordinación total de contratos de arrendamiento corporativo', 'Auditorías anuales de plusvalía y retorno de inversión'], featured: false, cta: 'Contactar Advisory' }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ════ HERO ════ */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowLine} />
              <Text style={styles.eyebrow}>{t('sv_eyebrow', { defaultValue: 'LO QUE OFRECEMOS' })}</Text>
            </View>
            <Text style={styles.heroTitle}>
              {t('sv_hero_t1', { defaultValue: 'Servicios diseñados' })}{'\n'}
              {t('sv_hero_t2', { defaultValue: 'para ' })}
              <Text style={styles.heroEmphasis}>{t('sv_hero_em', { defaultValue: 'resultados' })}</Text>{'\n'}
              {t('sv_hero_t3', { defaultValue: 'extraordinarios' })}
            </Text>
            <Text style={styles.heroSub}>
              {t('sv_hero_sub', { defaultValue: 'Cada servicio ha sido concebido para acompañar a compradores, vendedores e inversionistas desde la primera consulta hasta mucho después del cierre.' })}
            </Text>
          </View>
        </Animated.View>

        {/* ════ PORTAFOLIO DE 5 SERVICIOS CORE CON ESPACIOS ARREGLADOS ════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('sv_services_label', { defaultValue: 'PORTAFOLIO DE SERVICIOS' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_services_t1', { defaultValue: 'Todo lo que necesitas en un' })}{'\n'}
            {t('sv_services_t2', { defaultValue: 'solo ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_services_em', { defaultValue: 'lugar' })}</Text>
          </Text>

          <View style={styles.flexGridWrapper}>
            {serviciosData.map((item) => (
              <ServiceCard
                key={item.id}
                item={item}
                isOpen={cardActiva === item.id}
                onToggle={() => setCardActiva(cardActiva === item.id ? null : item.id)}
                onMail={mandarCorreoOficial}
                onWa={() => abrirUrl(CONTACT_WA)}
                cardWidth={gridWidth}
              />
            ))}
          </View>
        </View>

        {/* ════ COMPROMISO / GARANTÍAS MINIMALISTAS EDITORIALES ════ */}
        <View style={[styles.section, styles.sectionDark]}>
          <Text style={styles.sectionLabel}>{t('sv_garantias_label', { defaultValue: 'NUESTRO COMPROMISO' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_garantias_t1', { defaultValue: 'Garantías que nos ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_garantias_em', { defaultValue: 'distinguen' })}</Text>
          </Text>

          <View style={[styles.garantiasWrap, { flexDirection: width > 900 ? 'row' : 'column' }]}>
            <Pressable 
              onHoverIn={() => Platform.OS === 'web' && setHoveredAboutImg(true)}
              onHoverOut={() => Platform.OS === 'web' && setHoveredAboutImg(false)}
              style={[styles.garantiaImageWrap, { flex: width > 900 ? 1 : 'none' }]}
            >
              <Image 
                source={{ uri: GUARANTEE_IMAGE }} 
                style={[styles.garantiaImage, hoveredAboutImg && { transform: [{ scale: 1.05 }] }]} 
                resizeMode="cover" 
              />
              <View style={styles.garantiaImageOverlay} />
              <Text style={styles.garantiaImageLabel}>"Exclusividad y orden que definen un nuevo estándar patrimonial."</Text>
            </Pressable>

            <View style={[styles.garantiasList, { flex: width > 900 ? 1.2 : 'none' }]}>
              {[
                { title: 'SOPORTE POST-VENTA ININTERRUMPIDO', subtitle: 'POST-VENTA DELUXE · PREMIUM PARTNER', desc: 'Una vez completado el cierre de la transacción, seguimos a tu disposición absoluta. Te brindamos asesoría continua en temas legales, técnicos y corporativos de por vida.' },
                { title: 'CONSULTORÍA PRIVADA EXCLUSIVA', subtitle: 'PRIVATE ADVISORY · VIP MEMBER', desc: 'Ponemos a tu disposición un asesor de élite senior de forma completamente dedicada. Olvídate de los call centers; aquí tu patrimonio lo maneja un experto.' },
                { title: 'ESTRATEGIA CORPORATIVA ALINEADA', subtitle: 'ENGINEERING OF EXCELLENCE · CORPORATE STANDARD', desc: 'Nuestra estructura de honorarios está diseñada para que ganemos únicamente cuando tú ganes. Transparencia total enfocada en maximizar tu retorno de inversión.' }
              ].map((g, i) => (
                <View key={i} style={styles.garantiaMinimalItem}>
                  <Text style={styles.garantiaMinimalTitle}>{g.title}</Text>
                  <Text style={styles.garantiaMinimalSubtitle}>{g.subtitle}</Text>
                  <Text style={styles.garantiaMinimalDesc}>{g.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ════ VIRAL MEDIA MULTIPESTAÑA CON LOS 5 SERVICIOS CORE Y AUTOMOVIMIENTO ════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VIRAL MEDIA</Text>
          <Text style={styles.sectionTitle}>Galería Multimedia Studio</Text>
          
          <View style={styles.mudanzaCarouselContainer}>
            <View style={styles.mudanzaHeaderRow}>
              {[
                { id: 'mudanza', label: '🚚 Ayuda con la Mudanza' },
                { id: 'socials', label: '📱 Exposición en Redes Sociales' },
                { id: 'studio', label: '📷 Fotografía Profesional' },
                { id: 'advisory', label: '💼 Asesoramiento Agente INMOVIRAL' },
                { id: 'limpieza', label: '✨ Limpieza Profunda Pre-Visita' }
              ].map(tab => (
                <Pressable 
                  key={tab.id} 
                  onPress={() => { setServicioActivoTab(tab.id); setImagenActivaIdx(0); }} 
                  style={[styles.tabSelectorBtn, servicioActivoTab === tab.id && styles.tabSelectorBtnActive]}
                >
                  <Text style={[styles.mudanzaBtnText, servicioActivoTab === tab.id && { color: C.bg }]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Contenedor del Carrusel con Opacidad Animada Continuamente */}
            <Animated.View style={[styles.carouselViewerBox, { opacity: carouselFade }]}>
              <Image source={{ uri: GALERIAS_SERVICIOS[servicioActivoTab][imagenActivaIdx] }} style={styles.carouselImageEngine} resizeMode="cover" />
              <View style={styles.carouselArrowContainer}>
                <Pressable 
                  style={styles.carouselArrowBtn} 
                  onPress={() => {
                    const fotos = GALERIAS_SERVICIOS[servicioActivoTab];
                    const prevIdx = (imagenActivaIdx === 0) ? fotos.length - 1 : imagenActivaIdx - 1;
                    setImagenActivaIdx(prevIdx);
                  }}
                >
                  <Text style={styles.carouselArrowText}>◀</Text>
                </Pressable>
                
                <View style={styles.carouselIndicatorsRow}>
                  {GALERIAS_SERVICIOS[servicioActivoTab].map((_, idx) => (
                    <View key={idx} style={[styles.indicatorDot, imagenActivaIdx === idx && styles.indicatorDotActive]} />
                  ))}
                </View>

                <Pressable 
                  style={styles.carouselArrowBtn} 
                  onPress={() => {
                    const fotos = GALERIAS_SERVICIOS[servicioActivoTab];
                    const nextIdx = (imagenActivaIdx + 1) % fotos.length;
                    setImagenActivaIdx(nextIdx);
                  }}
                >
                  <Text style={styles.carouselArrowText}>▶</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* ════ PAQUETES HÍBRIDOS CON LABIA COMERCIAL AVANZADA ════ */}
        <View style={[styles.section, styles.sectionDark]}>
          <Text style={styles.sectionLabel}>{t('sv_planes_label', { defaultValue: 'PLANES DE SERVICIO' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_planes_t1', { defaultValue: 'Paquetes de Cobertura ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_planes_em', { defaultValue: 'Estratégica' })}</Text>
          </Text>

          <View style={styles.flexGridWrapper}>
            {planesData.map((plan, idx) => (
              <PlanCard key={idx} plan={plan} cardWidth={planWidth} onPress={onIrLogin} />
            ))}
          </View>
        </View>

        {/* BOTÓN VOLVER UNIVERSAL */}
        {onVolver && (
          <Pressable 
            onPress={onVolver}
            onMouseEnter={() => Platform.OS === 'web' && setHoveredBack(true)}
            onMouseLeave={() => Platform.OS === 'web' && setHoveredBack(false)}
            style={[styles.luxeBackButton, hoveredBack && { borderColor: C.gold, backgroundColor: 'rgba(160,120,64,0.15)', transform: [{ scale: 1.02 }] }]}
          >
            <Text style={[styles.luxeBackButtonText, hoveredBack && { color: C.gold }]}>← {t('vd_back', { defaultValue: 'VOLVER AL MENÚ DE INICIO' })}</Text>
          </Pressable>
        )}

        {/* ─── FOOTER OFICIAL CON HOVERS COMPLETOS ─── */}
        <View style={styles.footerContainer}>
          <View style={[styles.footerMainRow, !isWideFooter && { flexDirection: 'column', gap: 32 }]}>
            
            <View style={styles.footerBrandCol}>
              <Text style={styles.footerLogoText}>INMOVIRAL</Text>
              <Text style={styles.footerBrandDesc}>{t('footer.desc')}</Text>
              <View style={styles.socialFlexRow}>
                {['WH', 'IG', 'FB', 'GM'].map(net => (
                  <SocialBadge key={net} net={net} />
                ))}
              </View>
            </View>

            <View style={styles.footerLinksCol}>
              <Text style={styles.footerColHeading}>{t('footer.company_t')}</Text>
              {[
                { es: 'Sobre Nosotros', en: 'About Us' },
                { es: 'Propiedades', en: 'Properties' },
                { es: 'Nuestro Equipo', en: 'Our Team' },
                { es: 'Testimonios', en: 'Testimonials' },
                { es: 'Bolsa de Trabajo', en: 'Careers' }
              ].map(link => (
                <FooterLink key={link.es} label={idiomaActual.startsWith('es') ? link.es : link.en} />
              ))}
            </View>

            <View style={styles.footerLinksCol}>
              <Text style={styles.footerDeltaHeading}>{t('footer.catalog_t')}</Text>
              {[
                { es: 'Residencias de Lujo', en: 'Luxury Homes' },
                { es: 'Departamentos', en: 'Apartments' },
                { es: 'Colección Penthouses', en: 'Penthouses' },
                { es: 'Terrenos', en: 'Land' },
                { es: 'Comercial', en: 'Commercial' }
              ].map(link => (
                <FooterLink key={link.es} label={idiomaActual.startsWith('es') ? link.es : link.en} />
              ))}
            </View>

            <View style={styles.footerBrandCol}>
              <Text style={styles.footerColHeading}>{t('footer.contact_t')}</Text>
              <FooterLink label="📞 +52 6181630471" onPress={() => abrirUrl(`tel:${CONTACT_PHONE}`)} />
              <FooterLink label="✉ ventas@inmoviral.com.mx" onPress={mandarCorreoOficial} />
              <FooterLink label={`📍 ${t('footer.address')}`} />
              <FooterLink label={`🕒 ${t('footer.hours')}`} />
            </View>

          </View>

          <View style={styles.footerBottomBar}>
            <Text style={styles.copyText}>© 2026 INMOVIRAL. All rights reserved.</Text>
            <View style={styles.legalLinksRow}>
              <FooterLink label={idiomaActual.startsWith('es') ? 'Política de Privacidad' : 'Privacy Policy'} customStyle={styles.copyText} />
              <FooterLink label={idiomaActual.startsWith('es') ? 'Términos de Uso' : 'Terms of Use'} customStyle={styles.copyText} />
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// HOJA DE ESTILOS BLINDADA NATIVA Y COMPACTA
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Hero
  hero: { minHeight: 440, justifyContent: 'flex-end', backgroundColor: C.bg, overflow: 'hidden', position: 'relative' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,8,0.78)' },
  heroContent: { paddingHorizontal: 32, paddingTop: 60, paddingBottom: 48, maxWidth: 800 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  eyebrowLine: { width: 32, height: 1, backgroundColor: C.gold, marginRight: 12 },
  eyebrow: { color: C.gold, fontSize: 10, fontFamily: C.sans, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '500' },
  heroTitle: { color: C.text, fontSize: 44, lineHeight: 52, fontFamily: C.serif, fontWeight: '300', marginBottom: 16 },
  heroEmphasis: { color: C.goldDeep, fontStyle: 'italic' },
  heroSub: { color: C.textSub, fontSize: 13, lineHeight: 22, fontFamily: C.sans, fontWeight: '300', maxWidth: 540 },

  // Layout Grid Equilibrado (Ajustado para evitar espacios colgados)
  section: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, backgroundColor: C.bg, alignSelf: 'center', width: '100%', maxWidth: 1400 },
  sectionDark: { backgroundColor: '#0A0806', borderTopWidth: 1, borderTopColor: C.borderSoft, borderBottomWidth: 1, borderBottomColor: C.borderSoft, paddingHorizontal: 32, paddingVertical: 56, width: '100%' },
  sectionLabel: { color: C.gold, fontSize: 10, fontFamily: C.sans, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontWeight: '500' },
  sectionTitle: { color: C.text, fontSize: 32, lineHeight: 38, fontFamily: C.serif, fontWeight: '300', marginBottom: 24 },
  sectionEmphasis: { color: C.goldDeep, fontStyle: 'italic' },
  flexGridWrapper: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start', alignItems: 'stretch' },
  serviceCardWrapper: { padding: 8 },

  // Tarjetas de Servicios
  serviceCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 24, position: 'relative', overflow: 'hidden', height: '100%' },
  serviceCardHovered: { backgroundColor: '#171512', borderColor: 'rgba(160,120,64,0.35)' },
  serviceCardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'transparent' },
  serviceNum: { color: 'rgba(160,120,64,0.12)', fontSize: 52, fontFamily: C.serif, fontWeight: '300', lineHeight: 52, marginBottom: 4 },
  serviceTag: { color: C.gold, fontSize: 9, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontWeight: '500' },
  serviceTitle: { color: C.text, fontSize: 20, lineHeight: 24, fontFamily: C.serif, fontWeight: '400', marginBottom: 10 },
  serviceTitleEm: { color: C.goldDeep, fontStyle: 'italic' },
  serviceDesc: { color: C.textSub, fontSize: 12, lineHeight: 19, fontFamily: C.sans, fontWeight: '300', marginBottom: 16 },
  featuresList: { marginBottom: 16, gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureLine: { width: 14, height: 1, backgroundColor: C.gold, marginRight: 10 },
  featureText: { color: C.textSub, fontSize: 12, fontFamily: C.sans, fontWeight: '300' },
  serviceLink: { marginTop: 'auto', paddingTop: 4 },
  serviceLinkText: { color: C.gold, fontSize: 10, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500' },

  // Panel de Contacto Expandible
  contactPanel: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  contactLabel: { color: C.textSub, fontSize: 12, fontFamily: C.sans, marginBottom: 10, lineHeight: 16 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, height: 38, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  contactBtnWa: { borderColor: C.greenBdr },
  contactBtnText: { color: C.gold, fontSize: 11, fontFamily: C.sans, letterSpacing: 1 },
  contactBtnTextWa: { color: C.green },

  // Garantías Minimalistas Editoriales
  garantiasWrap: { gap: 32, marginTop: 12 },
  garantiaImageWrap: { minHeight: 320, position: 'relative', overflow: 'hidden', backgroundColor: '#1A1714', borderWidth: 1, borderColor: C.border },
  garantiaImage: { width: '100%', height: '100%' },
  garantiaImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,13,10,0.45)' },
  garantiaImageLabel: { position: 'absolute', bottom: 24, left: 24, right: 24, color: C.text, fontFamily: C.serif, fontSize: 18, fontStyle: 'italic', fontWeight: '300', lineHeight: 24 },
  garantiasList: { gap: 4, justifyContent: 'center' },
  garantiaMinimalItem: { paddingVertical: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12 },
  garantiaMinimalTitle: { color: C.text, fontSize: 14, fontFamily: C.sans, letterSpacing: 1.5, fontWeight: '600', marginBottom: 2 },
  garantiaMinimalSubtitle: { color: C.gold, fontSize: 9, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  garantiaMinimalDesc: { color: C.textSub, fontSize: 12, lineHeight: 18, fontFamily: C.sans, fontWeight: '300' },

  // Módulo Media con Nombres Exactos y Carrusel Smooth
  mudanzaCarouselContainer: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 24, marginTop: 12 },
  mudanzaHeaderRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  tabSelectorBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(160,120,64,0.25)', paddingVertical: 8, paddingHorizontal: 16 },
  tabSelectorBtnActive: { backgroundColor: C.gold, borderColor: C.gold },
  mudanzaBtnText: { color: C.gold, fontFamily: C.sans, fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  carouselViewerBox: { width: '100%', aspectRatio: 16/9, minHeight: 300, overflow: 'hidden', position: 'relative' },
  carouselImageEngine: { width: '100%', height: '100%' },
  carouselArrowContainer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  carouselArrowBtn: { width: 42, height: 42, backgroundColor: 'rgba(15,13,10,0.85)', borderWidth: 1, borderColor: 'rgba(160,120,64,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  carouselArrowText: { color: C.text, fontSize: 14 },
  carouselIndicatorsRow: { flexDirection: 'row', gap: 6, alignSelf: 'flex-end', marginBottom: 16, zIndex: 5 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  indicatorDotActive: { backgroundColor: C.gold, width: 16 },

  // Tarjetas de Planes
  planCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.borderSoft, padding: 28, position: 'relative', overflow: 'hidden', height: '100%' },
  planCardFeatured: { borderColor: 'rgba(160,120,64,0.4)', backgroundColor: 'rgba(160,120,64,0.04)' },
  planCardHovered: { borderColor: 'rgba(160,120,64,0.3)', transform: [{ translateY: -4 }] },
  planBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { color: C.bg, fontSize: 9, fontFamily: C.sans, fontWeight: '600', letterSpacing: 1 },
  planLabel: { color: C.gold, fontSize: 9, fontFamily: C.sans, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  planTitulo: { color: C.text, fontSize: 20, fontFamily: C.serif, fontWeight: '400', marginBottom: 16 },
  planDivider: { height: 1, backgroundColor: C.borderSoft, marginBottom: 14 },
  planPrecio: { color: C.goldDeep, fontSize: 14, fontFamily: C.sans, fontWeight: '500', marginBottom: 24 },
  planFeatures: { marginBottom: 28, gap: 10 },
  planFeatureRow: { flexDirection: 'row', alignItems: 'flex-start' },
  planFeatureCheck: { color: C.gold, fontSize: 12, marginRight: 12, marginTop: 1 },
  planFeatureText: { color: C.textSub, fontSize: 12, fontFamily: C.sans, lineHeight: 18, fontWeight: '300', flex: 1 },
  planBtn: { height: 42, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  planBtnFeatured: { backgroundColor: C.gold, borderColor: C.gold },
  planBtnText: { color: C.text, fontSize: 11, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase' },
  planBtnTextFeatured: { color: C.bg, fontWeight: '600' },

  luxeBackButton: { alignSelf: 'center', marginTop: 32, marginBottom: 48, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: C.borderSoft },
  luxeBackButtonText: { color: C.textSub, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: C.sans, fontWeight: '500' },

  // Footer
  footerContainer: { backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: 'rgba(160,120,64,0.12)', paddingHorizontal: 48, paddingTop: 60, paddingBottom: 30, width: '100%' },
  footerMainRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 1200, alignSelf: 'center', marginBottom: 48 },
  footerBrandCol: { flex: 1.5, minWidth: 220, paddingRight: 20 },
  footerLogoText: { fontFamily: C.sans, fontWeight: '300', letterSpacing: 5, fontSize: 20, color: C.text, marginBottom: 20 },
  footerBrandDesc: { fontFamily: C.sans, fontSize: 12, color: C.textSub, lineHeight: 20, fontWeight: '300', marginBottom: 24 },
  socialFlexRow: { flexDirection: 'row', gap: 10 },
  footerSocialBtn: { width: 34, height: 34, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)' },
  footerSocialText: { color: C.textSub, fontSize: 10, fontFamily: C.sans, fontWeight: '500' },
  footerLinksCol: { flex: 1, minWidth: 140 },
  footerColHeading: { fontFamily: C.sans, fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: '600', marginBottom: 20, textTransform: 'uppercase' },
  footerDeltaHeading: { fontFamily: C.sans, fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: '600', marginBottom: 20, textTransform: 'uppercase' },
  footerLinkText: { fontFamily: C.sans, fontSize: 12, color: C.textSub, marginBottom: 12, fontWeight: '300' },
  footerBottomBar: { width: '100%', maxWidth: 1200, alignSelf: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  copyText: { fontFamily: C.sans, fontSize: 11, color: 'rgba(252,237,225,0.3)', fontWeight: '300' },
  legalLinksRow: { flexDirection: 'row', gap: 24 }
});