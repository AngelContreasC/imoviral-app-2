/**
 * ServiciosVirales.jsx
 * InmoViral — Servicios premium universales
 * React Native / Expo Universal (iOS · Android · Web)
 *
 * Cumple estrictamente:
 *  ✅ CERO etiquetas HTML
 *  ✅ CERO propiedades CSS abreviadas
 *  ✅ Hovers con Platform.OS === 'web' + onHoverIn/onHoverOut
 *  ✅ export default function ServiciosVirales({ onIrLogin, onVolver })
 *  ✅ i18next bilingüe con { i18n, t }
 *  ✅ FlatList/map dentro de ScrollView — sin FlatList vertical anidado
 *  ✅ useWindowDimensions para grilla responsiva
 *  ✅ Footer oficial InmoViral con micro-hovers dorados
 */

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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

// ─────────────────────────────────────────────
// PALETA OFICIAL INMOVIRAL
// ─────────────────────────────────────────────
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
};

// ─────────────────────────────────────────────
// DATOS ESTÁTICOS
// ─────────────────────────────────────────────
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800';
const GUARANTEE_IMAGE =
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?crop=entropy&cs=srgb&fm=jpg&q=85&w=900';
const CONTACT_PHONE = '+526181630471';
const CONTACT_WA    = 'https://wa.me/526181630471';
const CONTACT_EMAIL = 'info@inmoviral.com';

const TAB_SECTIONS = [
  { id: 'compra',      label: 'Para Compradores' },
  { id: 'venta',      label: 'Para Vendedores'   },
  { id: 'inversion',  label: 'Para Inversionistas' },
  { id: 'adicionales',label: 'Servicios Adicionales' },
];

const SERVICIOS = [
  {
    id: 1,
    num: '01',
    tag: 'Logística',
    titulo: 'Ayuda con la',
    tituloEm: 'Mudanza',
    desc: 'Coordinamos cada detalle de tu traslado con empresas certificadas. Desde el embalaje profesional hasta la instalación en tu nuevo hogar — sin estrés, sin imprevistos.',
    features: ['Embalaje profesional', 'Transporte asegurado', 'Coordinación total del traslado', 'Seguro de bienes incluido', 'Instalación en destino'],
    cta: 'Solicitar Servicio',
    tabId: 'compra',
  },
  {
    id: 2,
    num: '02',
    tag: 'Marketing Digital',
    titulo: 'Exposición en',
    tituloEm: 'Redes Sociales',
    desc: 'Posicionamos tu propiedad frente a miles de compradores e inversionistas activos. Campañas segmentadas en Instagram, Facebook y TikTok con resultados medibles.',
    features: ['Campañas pagadas segmentadas', 'Contenido editorial profesional', 'Audiencias de alto valor', 'Reportes semanales de rendimiento', 'Difusión en portales premium'],
    cta: 'Solicitar Servicio',
    tabId: 'venta',
  },
  {
    id: 3,
    num: '03',
    tag: 'Visual Premium',
    titulo: 'Fotografía',
    tituloEm: 'Profesional',
    desc: 'Capturamos la esencia y el valor de cada propiedad con equipo de alto rendimiento. Imágenes editoriales, video cinematic y tour virtual 360° que elevan tu listado.',
    features: ['Fotografía editorial de interiores', 'Video cinematic 4K con drone', 'Tour virtual 360°', 'Edición y postproducción premium', 'Entrega en 48 horas'],
    cta: 'Solicitar Servicio',
    tabId: 'inversion',
  },
  {
    id: 4,
    num: '04',
    tag: 'Consultoría',
    titulo: 'Asesoramiento',
    tituloEm: 'Agente INMOVIRAL',
    desc: 'Un experto dedicado a tu operación de principio a fin. Negociación estratégica, análisis de mercado y acompañamiento legal para que tomes decisiones con certeza.',
    features: ['Agente senior dedicado exclusivamente', 'Análisis comparativo de mercado', 'Negociación experta de precio y condiciones', 'Due diligence legal y notarial completo', 'Soporte 5 años post-cierre'],
    cta: 'Agendar Consulta',
    tabId: 'adicionales',
  },
];

const PASOS = [
  { num: '01', titulo: 'Consulta Inicial',     desc: 'Analizamos tu perfil, objetivos y presupuesto para diseñar la estrategia óptima.' },
  { num: '02', titulo: 'Selección y Análisis', desc: 'Curación de propiedades o compradores que encajan exactamente con tus criterios.' },
  { num: '03', titulo: 'Negociación Experta',  desc: 'Gestionamos cada detalle contractual para proteger tus intereses en todo momento.' },
  { num: '04', titulo: 'Cierre y Soporte',     desc: 'Acompañamiento notarial, entrega formal y soporte continuo post-operación.' },
];

const GARANTIAS = [
  { icon: '◈', titulo: '5 años de soporte post-venta',    desc: 'Una vez cerrada la operación, seguimos siendo tu punto de contacto para cualquier consulta legal, técnica o de mantenimiento.' },
  { icon: '◉', titulo: 'Asesor dedicado exclusivo',        desc: 'Cada cliente cuenta con un asesor principal. Nunca serás redirigido a un desconocido.' },
  { icon: '◆', titulo: 'Comisión alineada a resultados',  desc: 'Nuestros honorarios están estructurados para que nuestros intereses sean exactamente los mismos que los tuyos.' },
  { icon: '◎', titulo: 'Respuesta en menos de 2 horas',   desc: 'Nos comprometemos a responder cualquier consulta en un plazo máximo de 2 horas durante días hábiles.' },
];

const PLANES = [
  {
    label: 'Esencial',
    titulo: 'Consulta & Cierre',
    precio: 'Comisión estándar de mercado',
    features: ['Asesoría en búsqueda o venta', '1 asesor asignado', 'Gestión notarial básica', 'Soporte por 6 meses post-cierre', 'Acceso a portafolio activo'],
    featured: false,
    cta: 'Comenzar',
  },
  {
    label: 'Premium',
    titulo: 'Servicio Integral',
    precio: 'Comisión preferencial + acceso exclusivo',
    features: ['Todo lo del plan Esencial', 'Asesor senior dedicado', 'Acceso a propiedades off-market', 'Estrategia de negociación avanzada', 'Due diligence legal completo', 'Soporte 5 años post-cierre', 'Reportes de mercado mensuales'],
    featured: true,
    cta: 'Solicitar acceso',
  },
  {
    label: 'Corporativo',
    titulo: 'Portafolio & Inversión',
    precio: 'Estructura a medida — cotizar',
    features: ['Todo lo del plan Premium', 'Análisis de portafolio inmobiliario', 'Vehículos de inversión estructurados', 'Gestión de activos en renta', 'Reportes trimestrales de rendimiento', 'Acceso a red de inversionistas'],
    featured: false,
    cta: 'Contactar equipo',
  },
];

const TESTIMONIOS = [
  { texto: 'En tres meses encontramos la propiedad que llevábamos dos años buscando. La atención fue impecable de principio a fin.', nombre: 'Miguel & Laura Fernández', rol: 'Compradores — Residencia Diamante' },
  { texto: 'Vendieron mi penthouse en 47 días al precio que yo pedía. La estrategia de marketing fue completamente diferente a lo que había visto antes.', nombre: 'Rodrigo Salinas', rol: 'Vendedor — Penthouse Sierra Alta' },
  { texto: 'Mi portafolio creció un 34% en valor en 18 meses. Lo que más valoro es que siempre actúan con mis intereses primero.', nombre: 'Grupo Varela Capital', rol: 'Inversionista Institucional' },
];

// ─────────────────────────────────────────────
// HELPER: número de columnas
// ─────────────────────────────────────────────
const getCols = (w) => {
  if (w >= 1024) return 3;
  if (w >= 640)  return 2;
  return 1;
};

// ─────────────────────────────────────────────
// SUBCOMPONENTE: HoverText (link con micro-hover dorado en web)
// ─────────────────────────────────────────────
function HoverLink({ text, onPress, style, textStyle }) {
  const [hovered, setHovered] = useState(false);
  const hoverProps = Platform.OS === 'web'
    ? { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
    : {};
  return (
    <Pressable
      onPress={onPress}
      style={[style]}
      {...hoverProps}
    >
      <Text style={[textStyle, hovered && { color: C.gold }]}>{text}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// SUBCOMPONENTE: Tarjeta de servicio
// ─────────────────────────────────────────────
function ServiceCard({ item, isOpen, onToggle, onCall, onWa, isWide, cardWidth }) {
  const [hovered, setHovered] = useState(false);
  const hoverProps = Platform.OS === 'web'
    ? { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
    : {};

  return (
    <View
      style={[
        styles.serviceCard,
        isWide && styles.serviceCardWide,
        hovered && styles.serviceCardHovered,
        { width: cardWidth },
      ]}
      {...hoverProps}
    >
      {/* Barra superior activa en hover */}
      {hovered && <View style={styles.serviceCardBar} />}

      <Text style={[styles.serviceNum, hovered && styles.serviceNumHovered]}>{item.num}</Text>
      <Text style={styles.serviceTag}>{item.tag}</Text>
      <Text style={styles.serviceTitle}>
        {item.titulo}{'\n'}
        <Text style={styles.serviceTitleEm}>{item.tituloEm}</Text>
      </Text>
      <Text style={styles.serviceDesc}>{item.desc}</Text>

      <View style={styles.featuresList}>
        {item.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <View style={styles.featureLine} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.serviceLink, pressed && { opacity: 0.75 }]}
      >
        <Text style={styles.serviceLinkText}>{item.cta}  →</Text>
      </Pressable>

      {isOpen && (
        <View style={styles.contactPanel}>
          <Text style={styles.contactLabel}>Un asesor se pondrá en contacto a la brevedad.</Text>
          <View style={styles.contactRow}>
            <Pressable
              onPress={onCall}
              style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.75 }]}
            >
              <Text style={styles.contactBtnText}>📞  Llamar Ahora</Text>
            </Pressable>
            <Pressable
              onPress={onWa}
              style={({ pressed }) => [styles.contactBtn, styles.contactBtnWa, pressed && { opacity: 0.75 }]}
            >
              <Text style={[styles.contactBtnText, styles.contactBtnTextWa]}>💬  WhatsApp</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// SUBCOMPONENTE: Tarjeta de plan
// ─────────────────────────────────────────────
function PlanCard({ plan, onPress, cardWidth }) {
  const [hovered, setHovered] = useState(false);
  const hoverProps = Platform.OS === 'web'
    ? { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
    : {};
  return (
    <View
      style={[
        styles.planCard,
        plan.featured && styles.planCardFeatured,
        hovered && !plan.featured && styles.planCardHovered,
        { width: cardWidth },
      ]}
      {...hoverProps}
    >
      {plan.featured && (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>Más Popular</Text>
        </View>
      )}
      <Text style={styles.planLabel}>{plan.label}</Text>
      <Text style={styles.planTitulo}>{plan.titulo}</Text>
      <View style={styles.planDivider} />
      <Text style={styles.planPrecio}>{plan.precio}</Text>

      <View style={styles.planFeatures}>
        {plan.features.map((f) => (
          <View key={f} style={styles.planFeatureRow}>
            <Text style={styles.planFeatureCheck}>✓</Text>
            <Text style={styles.planFeatureText}>{f}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.planBtn,
          plan.featured && styles.planBtnFeatured,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={[styles.planBtnText, plan.featured && styles.planBtnTextFeatured]}>
          {plan.cta}
        </Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────
// SUBCOMPONENTE: Footer oficial bilingüe
// ─────────────────────────────────────────────
function FooterInmoViral({ t, idiomaActual, onIrLogin }) {
  const abrirUrl = (url) => Linking.openURL(url).catch(() => {});

  const linksEmpresa = idiomaActual.startsWith('en')
    ? ['About Us', 'Properties', 'Services', 'Contact']
    : ['Sobre Nosotros', 'Propiedades', 'Servicios', 'Contacto'];

  const linksCatalogo = idiomaActual.startsWith('en')
    ? ['Luxury Homes', 'Apartments', 'Commercial', 'Off-Market']
    : ['Residencias de Lujo', 'Departamentos', 'Comercial', 'Off-Market'];

  return (
    <View style={styles.footer}>
      {/* Línea superior */}
      <View style={styles.footerTopLine} />

      <View style={styles.footerInner}>
        {/* Col 1 — Marca */}
        <View style={styles.footerCol}>
          <Text style={styles.footerBrand}>INMO<Text style={styles.footerBrandAccent}>VIRAL</Text></Text>
          <Text style={styles.footerDesc}>{t('footer.desc', { defaultValue: 'Especialistas en bienes raíces premium. Conectamos personas con propiedades que transforman su vida.' })}</Text>
          <View style={styles.footerSocials}>
            {['IG', 'FB', 'TK', 'YT'].map((s) => (
              <HoverLink
                key={s}
                text={s}
                onPress={() => {}}
                style={styles.footerSocialBtn}
                textStyle={styles.footerSocialText}
              />
            ))}
          </View>
        </View>

        {/* Col 2 — Empresa */}
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>{t('footer.company_t', { defaultValue: 'Empresa' })}</Text>
          {linksEmpresa.map((l) => (
            <HoverLink
              key={l}
              text={l}
              onPress={l.includes('Login') ? onIrLogin : () => {}}
              style={styles.footerLink}
              textStyle={styles.footerLinkText}
            />
          ))}
        </View>

        {/* Col 3 — Catálogo */}
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>{t('footer.catalog_t', { defaultValue: 'Catálogo' })}</Text>
          {linksCatalogo.map((l) => (
            <HoverLink
              key={l}
              text={l}
              onPress={() => {}}
              style={styles.footerLink}
              textStyle={styles.footerLinkText}
            />
          ))}
        </View>

        {/* Col 4 — Contacto */}
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>{t('footer.contact_t', { defaultValue: 'Contacto' })}</Text>
          <HoverLink
            text={'📞  ' + CONTACT_PHONE}
            onPress={() => abrirUrl(`tel:${CONTACT_PHONE}`)}
            style={styles.footerLink}
            textStyle={styles.footerLinkText}
          />
          <HoverLink
            text={'✉️  ' + CONTACT_EMAIL}
            onPress={() => abrirUrl(`mailto:${CONTACT_EMAIL}`)}
            style={styles.footerLink}
            textStyle={styles.footerLinkText}
          />
          <Text style={styles.footerContactInfo}>
            {'📍  '}{t('footer.address', { defaultValue: 'Chihuahua, Chih., México' })}
          </Text>
          <Text style={styles.footerContactInfo}>
            {'🕒  '}{t('footer.hours', { defaultValue: 'Lun–Vie 9:00–19:00' })}
          </Text>
        </View>
      </View>

      {/* Pie inferior */}
      <View style={styles.footerBottom}>
        <View style={styles.footerBottomLine} />
        <View style={styles.footerBottomRow}>
          <Text style={styles.footerCopy}>© {new Date().getFullYear()} InmoViral. {t('footer.rights', { defaultValue: 'Todos los derechos reservados.' })}</Text>
          <View style={styles.footerLegal}>
            {['Privacidad', 'Términos'].map((l) => (
              <HoverLink
                key={l}
                text={l}
                onPress={() => {}}
                style={styles.footerLegalLink}
                textStyle={styles.footerLegalText}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function ServiciosVirales({ onIrLogin, onVolver }) {
  const { t, i18n }    = useTranslation();
  const idiomaActual   = i18n.language || 'es';
  const { width }      = useWindowDimensions();
  const scrollRef      = useRef(null);
  const sectionOffsets = useRef({});

  const [tabActiva, setTabActiva]   = useState('compra');
  const [cardActiva, setCardActiva] = useState(null);

  const cols       = getCols(width);
  const H_PAD      = 20;
  const GAP        = 14;
  const cardWidth  = (width - H_PAD * 2 - GAP * (cols - 1)) / cols;

  const registrarSeccion = (id) => (e) => {
    sectionOffsets.current[id] = e.nativeEvent.layout.y;
  };

  const scrollASeccion = (id) => {
    setTabActiva(id);
    const y = sectionOffsets.current[id];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });
    }
  };

  const abrirUrl = (url) => Linking.openURL(url).catch(() => {});

  // ── RENDER ────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ════ HERO ════ */}
        <View style={styles.hero}>
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
        </View>

        {/* ════ TABS ════ */}
        <View style={styles.tabsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {TAB_SECTIONS.map((tab) => {
              const active = tabActiva === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => scrollASeccion(tab.id)}
                  style={({ pressed }) => [styles.tabBtn, active && styles.tabBtnActive, pressed && { opacity: 0.75 }]}
                >
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{tab.label}</Text>
                  {active && <View style={styles.tabUnderline} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ════ SERVICIOS GRID ════ */}
        <View style={styles.section} onLayout={registrarSeccion('compra')}>
          <Text style={styles.sectionLabel}>{t('sv_services_label', { defaultValue: 'PORTAFOLIO DE SERVICIOS' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_services_t1', { defaultValue: 'Todo lo que necesitas en un' })}{'\n'}
            {t('sv_services_t2', { defaultValue: 'solo ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_services_em', { defaultValue: 'lugar' })}</Text>
          </Text>

          {/* Grilla responsiva con .map() — sin FlatList anidado */}
          <View style={styles.servicesGrid}>
            {SERVICIOS.map((item, idx) => {
              const rowIdx    = Math.floor(idx / cols);
              const colIdx    = idx % cols;
              const isLastRow = rowIdx === Math.floor((SERVICIOS.length - 1) / cols);
              const isLastCol = colIdx === cols - 1;

              // Registrar secciones de tab
              const extraLayout =
                item.tabId === 'venta'       ? registrarSeccion('venta')
                : item.tabId === 'inversion' ? registrarSeccion('inversion')
                : item.tabId === 'adicionales' ? registrarSeccion('adicionales')
                : undefined;

              return (
                <View
                  key={item.id}
                  onLayout={extraLayout}
                  style={[
                    styles.serviceCardWrapper,
                    !isLastCol  && { marginRight: GAP },
                    !isLastRow  && { marginBottom: GAP },
                  ]}
                >
                  <ServiceCard
                    item={item}
                    isOpen={cardActiva === item.id}
                    onToggle={() => setCardActiva((c) => (c === item.id ? null : item.id))}
                    onCall={() => abrirUrl(`tel:${CONTACT_PHONE}`)}
                    onWa={() => abrirUrl(CONTACT_WA)}
                    isWide={false}
                    cardWidth={cardWidth}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ════ PROCESO ════ */}
        <View style={[styles.section, styles.sectionDark]}>
          <Text style={styles.sectionLabel}>{t('sv_proceso_label', { defaultValue: 'CÓMO TRABAJAMOS' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_proceso_t1', { defaultValue: 'Un proceso ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_proceso_em', { defaultValue: 'claro' })}</Text>
            {t('sv_proceso_t2', { defaultValue: '\ny sin sorpresas' })}
          </Text>

          <View style={styles.pasosGrid}>
            {PASOS.map((paso, i) => (
              <View
                key={paso.num}
                style={[
                  styles.pasoCard,
                  i < PASOS.length - 1 && { marginBottom: GAP },
                  cols > 1 && {
                    width: (width - H_PAD * 2 - GAP) / 2,
                    marginRight: i % 2 === 0 ? GAP : 0,
                  },
                ]}
              >
                <View style={styles.pasoNumWrap}>
                  <Text style={styles.pasoNum}>{paso.num}</Text>
                </View>
                <Text style={styles.pasoTitle}>{paso.titulo}</Text>
                <Text style={styles.pasoDesc}>{paso.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════ GARANTÍAS ════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('sv_garantias_label', { defaultValue: 'NUESTRO COMPROMISO' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_garantias_t1', { defaultValue: 'Garantías que nos ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_garantias_em', { defaultValue: 'distinguen' })}</Text>
          </Text>

          {/* Imagen + lista */}
          <View style={styles.garantiasWrap}>
            <View style={styles.garantiaImageWrap}>
              <Image source={{ uri: GUARANTEE_IMAGE }} style={styles.garantiaImage} resizeMode="cover" />
              <View style={styles.garantiaImageOverlay} />
              <Text style={styles.garantiaImageLabel}>
                {'La confianza se construye\nresultado por resultado.'}
              </Text>
            </View>

            <View style={styles.garantiasList}>
              {GARANTIAS.map((g, i) => (
                <View
                  key={g.titulo}
                  style={[styles.garantiaItem, i < GARANTIAS.length - 1 && styles.garantiaItemBorder]}
                >
                  <View style={styles.garantiaIconWrap}>
                    <Text style={styles.garantiaIcon}>{g.icon}</Text>
                  </View>
                  <View style={styles.garantiaTextWrap}>
                    <Text style={styles.garantiaTitle}>{g.titulo}</Text>
                    <Text style={styles.garantiaDesc}>{g.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ════ PLANES ════ */}
        <View style={[styles.section, styles.sectionDark]}>
          <Text style={styles.sectionLabel}>{t('sv_planes_label', { defaultValue: 'PLANES DE SERVICIO' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_planes_t1', { defaultValue: 'El nivel de servicio ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_planes_em', { defaultValue: 'que mereces' })}</Text>
          </Text>

          <View style={styles.planesGrid}>
            {PLANES.map((plan, idx) => {
              const colIdx   = idx % cols;
              const isLast   = colIdx === cols - 1 || idx === PLANES.length - 1;
              return (
                <View
                  key={plan.label}
                  style={[
                    styles.planWrapper,
                    !isLast && cols > 1 && { marginRight: GAP },
                    cols === 1 && { marginBottom: GAP },
                  ]}
                >
                  <PlanCard
                    plan={plan}
                    onPress={() => typeof onIrLogin === 'function' && onIrLogin()}
                    cardWidth={cardWidth}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ════ TESTIMONIOS ════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('sv_testimonios_label', { defaultValue: 'CASOS DE ÉXITO' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_testimonios_t1', { defaultValue: 'Lo que dicen ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_testimonios_em', { defaultValue: 'nuestros clientes' })}</Text>
          </Text>

          <View style={styles.testimoniosGrid}>
            {TESTIMONIOS.map((test, idx) => {
              const colIdx = idx % cols;
              const isLast = colIdx === cols - 1 || idx === TESTIMONIOS.length - 1;
              return (
                <View
                  key={test.nombre}
                  style={[
                    styles.testimonioWrapper,
                    !isLast && cols > 1 && { marginRight: GAP },
                    cols === 1 && { marginBottom: GAP },
                  ]}
                >
                  <View style={[styles.testimonioCard, { width: cardWidth }]}>
                    <Text style={styles.testimonioText}>"{test.texto}"</Text>
                    <View style={styles.testDivider} />
                    <Text style={styles.testimonioName}>{test.nombre}</Text>
                    <Text style={styles.testimonioRole}>{test.rol}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ════ CTA FINAL ════ */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaGlow} />
          <View style={styles.ctaEyebrowRow}>
            <View style={styles.ctaEyebrowLine} />
            <Text style={styles.ctaEyebrow}>{t('sv_cta_eyebrow', { defaultValue: 'COMENZAR HOY' })}</Text>
            <View style={styles.ctaEyebrowLine} />
          </View>
          <Text style={styles.ctaTitle}>
            {t('sv_cta_t1', { defaultValue: 'Tu próxima operación,\ncon expertos a tu ' })}
            <Text style={styles.ctaTitleEm}>{t('sv_cta_em', { defaultValue: 'lado' })}</Text>
          </Text>
          <Text style={styles.ctaSub}>
            {t('sv_cta_sub', { defaultValue: 'Agenda una consulta sin costo y descubre cómo InmoViral puede transformar tu experiencia inmobiliaria.' })}
          </Text>
          <View style={styles.ctaBtns}>
            <Pressable
              onPress={() => typeof onIrLogin === 'function' && onIrLogin()}
              style={({ pressed }) => [styles.ctaBtnGold, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.ctaBtnGoldText}>{t('sv_cta_btn1', { defaultValue: 'AGENDAR CONSULTA' })}</Text>
            </Pressable>
            <Pressable
              onPress={() => abrirUrl(CONTACT_WA)}
              style={({ pressed }) => [styles.ctaBtnOutline, pressed && { opacity: 0.75 }]}
            >
              <Text style={styles.ctaBtnOutlineText}>{t('sv_cta_btn2', { defaultValue: 'ESCRIBIR POR WHATSAPP' })}</Text>
            </Pressable>
          </View>
        </View>

        {/* ════ FOOTER OFICIAL ════ */}
        <FooterInmoViral t={t} idiomaActual={idiomaActual} onIrLogin={onIrLogin} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// ESTILOS — StyleSheet.create (camelCase, sin abreviaciones)
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // ── HERO ────────────────────────────────────
  hero: {
    minHeight: 420,
    justifyContent: 'flex-end',
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,8,0.76)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 44,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyebrowLine: {
    width: 32,
    height: 1,
    backgroundColor: C.gold,
    marginRight: 12,
  },
  eyebrow: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: C.text,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  heroEmphasis: {
    color: C.goldDeep,
    fontStyle: 'italic',
  },
  heroSub: {
    color: C.textSub,
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '300',
    letterSpacing: 0.2,
    maxWidth: 520,
  },

  // ── TABS ────────────────────────────────────
  tabsBar: {
    backgroundColor: '#111110',
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    position: 'relative',
  },
  tabBtnActive: {},
  tabBtnText: {
    color: C.textSub,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tabBtnTextActive: {
    color: C.gold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: C.gold,
  },

  // ── SECTIONS ────────────────────────────────
  section: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: C.bg,
  },
  sectionDark: {
    backgroundColor: '#0E0C09',
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  sectionLabel: {
    color: C.gold,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '300',
    letterSpacing: -0.3,
    marginBottom: 32,
  },
  sectionEmphasis: {
    color: C.goldDeep,
    fontStyle: 'italic',
  },

  // ── SERVICES GRID ───────────────────────────
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceCardWrapper: {},
  serviceCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  serviceCardWide: {},
  serviceCardHovered: {
    backgroundColor: '#1C1916',
    borderColor: 'rgba(160,120,64,0.28)',
  },
  serviceCardBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.gold,
  },
  serviceNum: {
    color: 'rgba(160,120,64,0.14)',
    fontSize: 52,
    fontWeight: '300',
    lineHeight: 54,
    marginBottom: 10,
    letterSpacing: -1,
  },
  serviceNumHovered: {
    color: 'rgba(160,120,64,0.28)',
  },
  serviceTag: {
    color: C.gold,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  serviceTitle: {
    color: C.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '400',
    marginBottom: 12,
  },
  serviceTitleEm: {
    color: C.goldDeep,
    fontStyle: 'italic',
  },
  serviceDesc: {
    color: C.textSub,
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '300',
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLine: {
    width: 18,
    height: 1,
    backgroundColor: C.gold,
    marginRight: 10,
    flexShrink: 0,
  },
  featureText: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.2,
    flex: 1,
  },
  serviceLink: {
    alignSelf: 'flex-start',
    paddingTop: 2,
    paddingBottom: 2,
  },
  serviceLinkText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── CONTACT PANEL ───────────────────────────
  contactPanel: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  contactLabel: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '300',
    marginBottom: 14,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.30)',
  },
  contactBtnWa: {
    borderColor: C.greenBdr,
  },
  contactBtnText: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  contactBtnTextWa: {
    color: C.green,
  },

  // ── PASOS ───────────────────────────────────
  pasosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  pasoCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderSoft,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    flex: 1,
    minWidth: 140,
  },
  pasoNumWrap: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: '#0E0C09',
  },
  pasoNum: {
    color: C.gold,
    fontSize: 16,
    fontWeight: '300',
  },
  pasoTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 10,
  },
  pasoDesc: {
    color: C.textSub,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '300',
  },

  // ── GARANTÍAS ───────────────────────────────
  garantiasWrap: {
    gap: 24,
  },
  garantiaImageWrap: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  garantiaImage: {
    width: '100%',
    height: 240,
  },
  garantiaImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(10,10,8,0.55)',
  },
  garantiaImageLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 18,
    backgroundColor: 'rgba(10,10,8,0.82)',
    color: C.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  garantiasList: {
    gap: 0,
  },
  garantiaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 18,
    paddingBottom: 18,
  },
  garantiaItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.borderSoft,
  },
  garantiaIconWrap: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
    backgroundColor: C.card,
  },
  garantiaIcon: {
    color: C.gold,
    fontSize: 16,
  },
  garantiaTextWrap: {
    flex: 1,
  },
  garantiaTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  garantiaDesc: {
    color: C.textSub,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '300',
  },

  // ── PLANES ──────────────────────────────────
  planesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  planWrapper: {},
  planCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderSoft,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 14,
  },
  planCardFeatured: {
    borderColor: 'rgba(160,120,64,0.40)',
    backgroundColor: 'rgba(160,120,64,0.05)',
  },
  planCardHovered: {
    borderColor: 'rgba(160,120,64,0.30)',
  },
  planBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: C.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: {
    color: C.bg,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  planLabel: {
    color: C.gold,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  planTitulo: {
    color: C.text,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
    marginBottom: 16,
  },
  planDivider: {
    height: 1,
    backgroundColor: C.borderSoft,
    marginBottom: 12,
  },
  planPrecio: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 18,
    marginBottom: 20,
  },
  planFeatures: {
    marginBottom: 24,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  planFeatureCheck: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  planFeatureText: {
    color: C.textSub,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '300',
    flex: 1,
  },
  planBtn: {
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  planBtnFeatured: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  planBtnText: {
    color: C.text,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  planBtnTextFeatured: {
    color: C.bg,
    fontWeight: '600',
  },

  // ── TESTIMONIOS ─────────────────────────────
  testimoniosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  testimonioWrapper: {
    marginBottom: 14,
  },
  testimonioCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderSoft,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
  },
  testimonioText: {
    color: C.text,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '300',
    marginBottom: 20,
  },
  testDivider: {
    width: 32,
    height: 1,
    backgroundColor: C.gold,
    marginBottom: 16,
  },
  testimonioName: {
    color: C.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  testimonioRole: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── CTA FINAL ───────────────────────────────
  ctaSection: {
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 64,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  ctaGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(160,120,64,0.06)',
    transform: [{ translateX: -300 }, { translateY: -300 }],
  },
  ctaEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  ctaEyebrowLine: {
    width: 30,
    height: 1,
    backgroundColor: C.gold,
  },
  ctaEyebrow: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  ctaTitle: {
    color: C.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  ctaTitleEm: {
    color: C.goldDeep,
    fontStyle: 'italic',
  },
  ctaSub: {
    color: C.textSub,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '300',
    maxWidth: 480,
    marginBottom: 32,
  },
  ctaBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  ctaBtnGold: {
    height: 48,
    paddingHorizontal: 28,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnGoldText: {
    color: C.bg,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  ctaBtnOutline: {
    height: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ctaBtnOutlineText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── FOOTER ──────────────────────────────────
  footer: {
    backgroundColor: '#0A0806',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerTopLine: {
    height: 1,
    backgroundColor: 'rgba(160,120,64,0.20)',
  },
  footerInner: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
  },
  footerCol: {
    minWidth: 140,
    flex: 1,
  },
  footerBrand: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  footerBrandAccent: {
    color: C.gold,
  },
  footerDesc: {
    color: C.textSub,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '300',
    marginBottom: 18,
    maxWidth: 240,
  },
  footerSocials: {
    flexDirection: 'row',
    gap: 10,
  },
  footerSocialBtn: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSocialText: {
    color: C.textSub,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerColTitle: {
    color: C.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  footerLink: {
    paddingVertical: 5,
  },
  footerLinkText: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 18,
  },
  footerContactInfo: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 18,
    paddingVertical: 5,
  },
  footerBottom: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  footerBottomLine: {
    height: 1,
    backgroundColor: C.borderSoft,
    marginBottom: 18,
  },
  footerBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerCopy: {
    color: 'rgba(122,110,98,0.60)',
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  footerLegal: {
    flexDirection: 'row',
    gap: 16,
  },
  footerLegalLink: {
    paddingVertical: 2,
  },
  footerLegalText: {
    color: 'rgba(122,110,98,0.60)',
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
});
