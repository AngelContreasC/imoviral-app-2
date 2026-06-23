import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';

// ─────────────────────────────────────────────
// TOKENS DE DISEÑO OFICIALES (INMOVIRAL MATCHED)
// ─────────────────────────────────────────────
const T = {
  gold:         '#A07840',
  goldDeep:     '#C49A58',
  bgPage:       '#0F0D0A',
  bgCard:       '#141210',
  bgFilter:     '#0E0C09',
  textMain:     '#F2EDE5',
  textSub:      '#7A6E62',
  textDim:      'rgba(242,237,229,0.5)',
  rentaGreen:   '#1C6B4A',
  border:       'rgba(160,120,64,0.1)',
  borderFocus:  'rgba(160,120,64,0.34)',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const FALLBACK = [
  { id: 1, titulo: 'Departamento Cielo', ubicacion: 'Polanco, CDMX', precio: 32000, habitaciones: 2, banos: 2, m2: 110, imagenes: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'] },
  { id: 2, titulo: 'Loft Copernico', ubicacion: 'Roma Norte, CDMX', precio: 19500, habitaciones: 1, banos: 1, m2: 72, imagenes: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'] },
  { id: 3, titulo: 'Casa Jardines', ubicacion: 'Lomas de Chapultepec, CDMX', precio: 85000, habitaciones: 4, banos: 4, m2: 420, imagenes: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'] },
];

// ─────────────────────────────────────────────
// SUBCOMPONENTES INTERACTIVOS (HOVERS)
// ─────────────────────────────────────────────

function SortPill({ label, active, onPress }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.sortPill,
        active && s.sortPillActive,
        hovered && !active && { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.05)' }
      ]}
    >
      <Text style={[s.sortPillText, active && s.sortPillTextActive, hovered && !active && { color: T.gold }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FooterLink({ label, customStyle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={{ alignSelf: 'flex-start' }}
    >
      <Text style={[s.footerLinkItem, customStyle, hovered && { color: T.gold, transition: 'color 0.2s' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SocialBadge({ net }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={[s.socialBadgeBox, hovered && { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.05)', transform: [{ scale: 1.05 }], transition: 'all 0.2s' }]}
    >
      <Text style={[s.socialBadgeText, hovered && { color: T.gold }]}>{net}</Text>
    </Pressable>
  );
}

function PropCard({ item: p, onVerPropiedad, cardWidth, onEliminar }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);

  return (
    <View style={[s.cardGridCell, { width: cardWidth }]}>
      <Pressable
        onPress={() => typeof onVerPropiedad === 'function' && onVerPropiedad(p.id)}
        onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
        style={({ pressed }) => [
          s.propertyLuxeCard,
          pressed && { opacity: 0.9 },
          hovered && s.propertyCardHovered
        ]}
      >
        <View style={s.cardImageFrame}>
          <Image 
            source={{ uri: p.imagenes?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600' }} 
            style={[s.cardImageEngine, hovered && { transform: [{ scale: 1.04 }] }]} 
            resizeMode="cover" 
          />
          <View style={s.rentBadgeFrame}>
            <Text style={s.rentBadgeText}>{t('props_badge_renta', { defaultValue: 'RENTA' })}</Text>
          </View>
        </View>

        <View style={s.cardDataContent}>
          <Text style={s.cardPriceTag}>
            ${Number(p.precio || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} <Text style={s.cardPriceSuffix}>MXN /mes</Text>
          </Text>
          <Text style={s.cardTitleHeading} numberOfLines={1}>{p.titulo}</Text>
          <Text style={s.cardLocationSub} numberOfLines={1}>📍 {p.ubicacion}</Text>
          
          <View style={s.cardSpecsLineDivider} />

          <View style={s.cardSpecsRowGrid}>
            <Text style={s.specItemLabel}>🛏️ {p.habitaciones} rec</Text>
            <Text style={s.specItemLabel}>🚿 {p.banos} baños</Text>
            {p.m2 && <Text style={s.specItemLabel}>📐 {p.m2} m²</Text>}
          </View>

          <View style={[s.cardCtaButton, hovered && s.cardCtaButtonHovered]}>
            <Text style={[s.cardCtaButtonText, hovered && s.cardCtaButtonTextHovered]}>
              {t('props_ver_propiedad', { defaultValue: 'VER PROPIEDAD' })}
            </Text>
          </View>
        </View>
      </Pressable>

      {user?.isAdmin && (
        <Pressable
          onPress={() => onEliminar && onEliminar(p.id)}
          style={s.deleteButtonAbsolute}
        >
          <Text style={s.deleteButtonText}>🗑️ ELIMINAR</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function PropiedadesRenta({ onVolver, onVerPropiedad }) {
  const { t, i18n } = useTranslation(); // ◄ Agrega ", i18n" aquí
  const { width } = useWindowDimensions();
  const idiomaActual = i18n.language || 'es'; // ◄ Inyecta esta línea mágica

  const [propiedades, setPropiedades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState('reciente');
  const [inputFocused, setInputFocused] = useState(false);

  const handleEliminar = async (id) => {
    const confirmed = Platform.OS === 'web' 
      ? window.confirm('¿Seguro que deseas eliminar esta publicación?') 
      : true;
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('propiedades').delete().eq('id', id);
      if (error) throw error;
      setPropiedades(prev => prev.filter(p => p.id !== id));
      if (Platform.OS === 'web') alert('Propiedad eliminada con éxito.');
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') alert('Error al eliminar: ' + e.message);
    }
  };

  const numColumns = width > 1024 ? 3 : width > 640 ? 2 : 1;
  const isWideFooter = width > 768;

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('propiedades')
          .select('*')
          .in('tipo_transaccion', ['Renta', 'Ambas'])
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setPropiedades(data);
        } else {
          setPropiedades(FALLBACK);
        }
      } catch (e) {
        setPropiedades(FALLBACK);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const listaFiltrada = useMemo(() => {
    return propiedades
      .filter(p => 
        filtro === '' ||
        p.titulo?.toLowerCase().includes(filtro.toLowerCase()) ||
        p.ubicacion?.toLowerCase().includes(filtro.toLowerCase())
      )
      .sort((a, b) => {
        if (orden === 'precio-asc') return (a.precio || 0) - (b.precio || 0);
        if (orden === 'precio-desc') return (b.precio || 0) - (a.precio || 0);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [propiedades, filtro, orden]);

  return (
    <SafeAreaView style={s.pageWrapper}>
      <StatusBar barStyle="light-content" backgroundColor={T.bgPage} />
      
      <ScrollView style={s.mainScroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO */}
        <View style={s.heroFrame}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1800' }} 
            style={StyleSheet.absoluteFillObject} 
            resizeMode="cover" 
          />
          <View style={s.heroGradientOverlay} />
          <View style={s.heroBodyContainer}>
            <Text style={s.heroEyebrow}>{t('props_renta_eyebrow', { defaultValue: 'COLECCIÓN EXCLUSIVA' })}</Text>
            <Text style={s.heroMainHeading}>
              {t('props_renta_title_1', { defaultValue: 'Propiedades' })}{'\n'}
              <Text style={s.heroHeadingItalic}>{t('props_renta_title_em', { defaultValue: 'en Renta' })}</Text>
            </Text>
            <Text style={s.heroSubParagraph}>
              {t('props_renta_sub', { defaultValue: 'Residencias de lujo seleccionadas para quienes exigen lo mejor.' })}
            </Text>
          </View>
        </View>

        {/* BARRA DE FILTROS */}
        <View style={s.filtersStickyBar}>
          <View style={s.filtersFlexInner}>
            <TextInput
              style={[s.searchFieldInput, inputFocused && { borderColor: T.gold }]}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={t('props_search_ph', { defaultValue: 'Buscar por nombre o ubicación...' })}
              placeholderTextColor="rgba(242,237,229,0.3)"
              value={filtro}
              onChangeText={setFiltro}
            />
            <View style={s.sortPillsContainer}>
              <SortPill label={t('props_sort_reciente', { defaultValue: 'Más Recientes' })} active={orden === 'reciente'} onPress={() => setOrden('reciente')} />
              <SortPill label={t('props_sort_precio_asc', { defaultValue: 'Precio ↑' })} active={orden === 'precio-asc'} onPress={() => setOrden('precio-asc')} />
              <SortPill label={t('props_sort_precio_desc', { defaultValue: 'Precio ↓' })} active={orden === 'precio-desc'} onPress={() => setOrden('precio-desc')} />
            </View>
            <Text style={s.resultsCountIndicator}>
              {listaFiltrada.length} {t('props_count_label', { defaultValue: 'PROPIEDADES' })}
            </Text>
          </View>
        </View>

        {/* GRILLA RESPONSIVA */}
        <View style={s.gridLayoutSection}>
          {cargando ? (
            <View style={s.centerFeedback}><ActivityIndicator size="large" color={T.gold} /></View>
          ) : listaFiltrada.length === 0 ? (
            <View style={s.centerFeedback}>
              <Text style={s.emptyStateHeading}>◇ {t('props_empty_title', { defaultValue: 'Sin Resultados' })}</Text>
            </View>
          ) : (
            <View style={s.flexGridWrapper}>
              {listaFiltrada.map((item) => (
                <PropCard key={item.id} item={item} onVerPropiedad={onVerPropiedad} cardWidth={`${100 / numColumns}%`} onEliminar={handleEliminar} />
              ))}
            </View>
          )}
        </View>

        {/* VOLVER */}
        {onVolver && (
          <Pressable onPress={onVolver} style={s.luxeBackButton}>
            <Text style={s.luxeBackButtonText}>← {t('vd_back', { defaultValue: 'VOLVER AL INICIO' })}</Text>
          </Pressable>
        )}

        {/* ─── FOOTER OFICIAL CON HOVERS COMPLETOS ─── */}
        <View style={s.footerContainer}>
          <View style={[s.footerMainRow, !isWideFooter && { flexDirection: 'column', gap: 32 }]}>
            
            {/* Branding & Redes */}
            <View style={s.footerBrandCol}>
              <Text style={s.footerLogoText}>INMOVIRAL</Text>
              <Text style={s.footerBrandDesc}>
                {t('footer.desc')}
              </Text>
              <View style={s.socialFlexRow}>
                {['WH', 'IG', 'FB', 'GM'].map(net => (
                  <SocialBadge key={net} net={net} />
                ))}
              </View>
            </View>

            {/* Links Empresa */}
            <View style={s.footerLinksCol}>
              <Text style={s.footerColHeading}>{t('footer.company_t')}</Text>
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

            {/* Links Catálogo */}
            <View style={s.footerLinksCol}>
              <Text style={s.footerColHeading}>{t('footer.catalog_t')}</Text>
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

            {/* Contacto */}
            <View style={s.footerBrandCol}>
              <Text style={s.footerColHeading}>{t('footer.contact_t')}</Text>
              <FooterLink label="📞 +52 6181630471" />
              <FooterLink label="✉ info@inmoviral.com" />
              <FooterLink label={`📍 ${t('footer.address')}`} />
              <FooterLink label={`🕒 ${t('footer.hours')}`} />
            </View>

          </View>

          {/* Copyright Inferior Interactivo */}
          <View style={s.footerBottomBar}>
            <Text style={s.copyText}>© 2026 INMOVIRAL. All rights reserved.</Text>
            <View style={s.legalLinksRow}>
              <FooterLink label={idiomaActual.startsWith('es') ? 'Política de Privacidad' : 'Privacy Policy'} customStyle={s.copyText} />
              <FooterLink label={idiomaActual.startsWith('es') ? 'Términos de Uso' : 'Terms of Use'} customStyle={s.copyText} />
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// HOJA DE ESTILOS UNIVERSAL BLINDADA
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  pageWrapper: { flex: 1, backgroundColor: T.bgPage },
  mainScroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Hero
  heroFrame: { minHeight: 480, height: '70vh', justifyContent: 'flex-end', backgroundColor: T.bgPage, overflow: 'hidden', position: 'relative' },
  heroGradientOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,13,10,0.65)' },
  heroBodyContainer: { zIndex: 10, paddingHorizontal: 40, paddingBottom: 60, maxWidth: 640 },
  heroEyebrow: { fontFamily: T.sans, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: T.gold, marginBottom: 16, fontWeight: '400' },
  heroMainHeading: { fontFamily: T.serif, fontSize: 56, color: T.textMain, lineHeight: 62, fontWeight: '300', marginBottom: 16 },
  heroHeadingItalic: { fontStyle: 'italic', color: T.goldDeep },
  heroSubParagraph: { fontFamily: T.sans, fontSize: 14, color: 'rgba(242,237,229,0.6)', fontWeight: '300', letterSpacing: 0.5, lineHeight: 22 },

  // Filtros
  filtersStickyBar: { backgroundColor: T.bgCard, borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 20, paddingHorizontal: 40 },
  filtersFlexInner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  searchFieldInput: { flex: 1, minWidth: 260, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)', paddingHorizontal: 16, color: T.textMain, fontSize: 13, fontFamily: T.sans, fontWeight: '300', transition: 'border-color .3s' },
  sortPillsContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sortPill: { height: 36, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', transition: 'all .25s' },
  sortPillActive: { backgroundColor: T.gold, borderColor: T.gold },
  sortPillText: { color: T.textSub, fontSize: 11, fontFamily: T.sans, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '400' },
  sortPillTextActive: { color: T.bgPage, fontWeight: '600' },
  resultsCountIndicator: { fontFamily: T.sans, fontSize: 11, letterSpacing: 2, color: T.gold, textTransform: 'uppercase', fontWeight: '400', marginLeft: 'auto' },

  // Grilla
  gridLayoutSection: { paddingHorizontal: 24, paddingTop: 40, maxWidth: 1400, alignSelf: 'center', width: '100%' },
  flexGridWrapper: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  cardGridCell: { padding: 14 },
  
  // Tarjetas & Sombras
  propertyLuxeCard: { backgroundColor: T.bgCard, borderWidth: 1, borderColor: 'rgba(160,120,64,0.1)', overflow: 'hidden', transition: 'transform 0.3s ease, border-color 0.3s ease' },
  propertyCardHovered: { 
    borderColor: 'rgba(160,120,64,0.35)', 
    transform: [{ translateY: -4 }],
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 18 },
      android: { elevation: 10 },
      default: { boxShadow: '0px 12px 30px rgba(0,0,0,0.65)' }
    })
  },
  cardImageFrame: { width: '100%', aspectRatio: 4/3, overflow: 'hidden', position: 'relative', backgroundColor: '#1C1812' },
  cardImageEngine: { width: '100%', height: '100%', transition: 'transform 0.5s ease' },
  rentBadgeFrame: { position: 'absolute', top: 14, left: 14, backgroundColor: T.rentaGreen, paddingHorizontal: 10, paddingVertical: 4 },
  rentBadgeText: { color: T.textMain, fontSize: 9, fontFamily: T.sans, fontWeight: '600', letterSpacing: 2 },
  
  cardDataContent: { padding: 22 },
  cardPriceTag: { fontFamily: T.serif, fontSize: 22, color: T.goldDeep, fontWeight: '400', marginBottom: 6 },
  cardPriceSuffix: { fontFamily: T.sans, fontSize: 11, color: T.textSub, letterSpacing: 1, fontWeight: '300' },
  cardTitleHeading: { fontFamily: T.serif, fontSize: 20, color: T.textMain, marginBottom: 8, lineHeight: 24 },
  cardLocationSub: { fontFamily: T.sans, fontSize: 12, color: T.textSub, fontWeight: '300', marginBottom: 14, letterSpacing: 0.5 },
  cardSpecsLineDivider: { height: 1, backgroundColor: 'rgba(160,120,64,0.1)', marginBottom: 14 },
  cardSpecsRowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  specItemLabel: { fontSize: 11, color: 'rgba(242,237,229,0.5)', fontFamily: T.sans, fontWeight: '300' },
  
  // Botón Ver Propiedad
  cardCtaButton: { width: '100%', height: 42, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s' },
  cardCtaButtonHovered: { backgroundColor: T.gold, borderColor: T.gold },
  cardCtaButtonText: { color: T.gold, fontSize: 11, fontFamily: T.sans, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '400' },
  cardCtaButtonTextHovered: { color: T.bgPage, fontWeight: '600' },

  centerFeedback: { width: '100%', paddingVertical: 80, justifyContent: 'center', alignItems: 'center' },
  emptyStateHeading: { fontFamily: T.serif, fontSize: 18, color: T.textMain, letterSpacing: 1 },
  luxeBackButton: { alignSelf: 'center', marginTop: 40, marginBottom: 60, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: T.border },
  luxeBackButtonText: { color: T.textSub, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: T.sans, fontWeight: '500' },

  // Footer Config
  footerContainer: { backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: 'rgba(160,120,64,0.12)', paddingHorizontal: 48, paddingTop: 60, paddingBottom: 30, width: '100%' },
  footerMainRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 1200, alignSelf: 'center', marginBottom: 48 },
  footerBrandCol: { flex: 1.5, minWidth: 220, paddingRight: 20 },
  footerLogoText: { fontFamily: T.sans, fontWeight: '300', letterSpacing: 5, fontSize: 20, color: T.textMain, marginBottom: 20 },
  footerBrandDesc: { fontFamily: T.sans, fontSize: 12, color: T.textSub, lineHeight: 20, fontWeight: '300', marginBottom: 24 },
  socialFlexRow: { flexDirection: 'row', gap: 10 },
  socialBadgeBox: { width: 34, height: 34, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', transition: 'all 0.2s' },
  socialBadgeText: { color: T.textSub, fontSize: 10, fontFamily: T.sans, fontWeight: '500' },
  
  footerLinksCol: { flex: 1, minWidth: 140 },
  footerColHeading: { fontFamily: T.sans, fontSize: 11, letterSpacing: 2, color: T.gold, fontWeight: '600', marginBottom: 20, textTransform: 'uppercase' },
  footerLinkItem: { fontFamily: T.sans, fontSize: 12, color: T.textSub, marginBottom: 12, fontWeight: '300' },
  
  footerBottomBar: { width: '100%', maxWidth: 1200, alignSelf: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  copyText: { fontFamily: T.sans, fontSize: 11, color: 'rgba(252,237,225,0.3)', fontWeight: '300' },
  legalLinksRow: { flexDirection: 'row', gap: 24 },

  deleteButtonAbsolute: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    zIndex: 1000,
    elevation: 10,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
    fontFamily: T.sans,
  }
});