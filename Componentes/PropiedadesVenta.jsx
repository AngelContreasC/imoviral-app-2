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
  Linking,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
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
  border:       'rgba(160,120,64,0.1)',
  borderFocus:  'rgba(160,120,64,0.34)',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const FALLBACK = [
  { id: 1, titulo: 'Penthouse Ébano', ubicacion: 'Santa Fe, CDMX', precio: 12000000, habitaciones: 3, banos: 3, m2: 280, imagenes: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'] },
  { id: 2, titulo: 'Casa Jardines', ubicacion: 'Lomas de Chapultepec, CDMX', precio: 85000000, habitaciones: 4, banos: 4, m2: 420, imagenes: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'] },
  { id: 3, titulo: 'Residencia Serena', ubicacion: 'Bosques de las Lomas, CDMX', precio: 95000000, habitaciones: 5, banos: 5, m2: 580, imagenes: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'] },
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

  const activeColor = hovered ? T.gold : 'rgba(255,255,255,0.4)';

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={[s.socialBadgeBox, hovered && { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.05)', transform: [{ scale: 1.05 }], transition: 'all 0.2s' }]}
    >
      <FontAwesome name={getIconName()} size={14} color={activeColor} />
    </Pressable>
  );
}

function PropCard({ item: p, onVerPropiedad, cardWidth, onEliminar }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [isFavorito, setIsFavorito] = useState(false);

  useEffect(() => {
    if (user) {
      if (Platform.OS === 'web') {
        const saved = localStorage.getItem(`favoritos_${user.id}`);
        if (saved) {
          const list = JSON.parse(saved);
          setIsFavorito(list.includes(p.id));
        }
      }
    }
  }, [user, p.id]);

  const handleToggleFavorito = () => {
    if (!user) {
      alert(t('props_fav_login_alert', { defaultValue: 'Debes iniciar sesión para guardar favoritos.' }));
      return;
    }
    try {
      let list = [];
      if (Platform.OS === 'web') {
        const saved = localStorage.getItem(`favoritos_${user.id}`);
        if (saved) {
          list = JSON.parse(saved);
        }
        if (list.includes(p.id)) {
          list = list.filter(id => id !== p.id);
          setIsFavorito(false);
        } else {
          list.push(p.id);
          setIsFavorito(true);
        }
        localStorage.setItem(`favoritos_${user.id}`, JSON.stringify(list));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const favRight = user?.isAdmin ? 130 : 24;

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
        {/* Encuadre de Imagen */}
        <View style={s.cardImageFrame}>
          <Image 
            source={{ uri: p.imagenes?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600' }} 
            style={[s.cardImageEngine, hovered && { transform: [{ scale: 1.04 }] }]} 
            resizeMode="cover" 
          />
          {/* Badge VENTA Estilo de tu CSS (Fondo Dorado, Texto Oscuro) */}
          <View style={s.saleBadgeFrame}>
            <Text style={s.saleBadgeText}>{t('props_badge_venta', { defaultValue: 'VENTA' })}</Text>
          </View>
        </View>

        {/* Cuerpo de la Tarjeta */}
        <View style={s.cardDataContent}>
          <Text style={s.cardPriceTag}>
            ${Number(p.precio || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} <Text style={s.cardPriceSuffix}>MXN</Text>
          </Text>
          <Text style={s.cardTitleHeading} numberOfLines={1}>{p.titulo}</Text>
          <Text style={s.cardLocationSub} numberOfLines={1}>📍 {p.ubicacion}</Text>
          
          <View style={s.cardSpecsLineDivider} />

          <View style={s.cardSpecsRowGrid}>
            <Text style={s.specItemLabel}>🛏️ {p.habitaciones} rec</Text>
            <Text style={s.specItemLabel}>🚿 {p.banos} baños</Text>
            {p.m2 && <Text style={s.specItemLabel}>📐 {p.m2} m²</Text>}
          </View>

          {/* Botón CTA Dinámico */}
          <View style={[s.cardCtaButton, hovered && s.cardCtaButtonHovered]}>
            <Text style={[s.cardCtaButtonText, hovered && s.cardCtaButtonTextHovered]}>
              {t('props_ver_propiedad', { defaultValue: 'VER PROPIEDAD' })}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable 
        onPress={handleToggleFavorito}
        style={{ 
          position: 'absolute', 
          top: 24, 
          right: favRight, 
          zIndex: 100, 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          width: 34, 
          height: 34, 
          borderRadius: 17, 
          justifyContent: 'center', 
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)'
        }}
      >
        <FontAwesome name={isFavorito ? 'heart' : 'heart-o'} size={14} color={isFavorito ? '#A07840' : '#FFF'} />
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
export default function PropiedadesVenta({ onVolver, onVerPropiedad }) {
  const { t, i18n } = useTranslation(); // ◄ Agrega ", i18n" aquí
  const { width } = useWindowDimensions();
  const idiomaActual = i18n.language || 'es'; // ◄ Inyecta esta línea mágica

  const [propiedades, setPropiedades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
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
          .in('tipo_transaccion', ['Venta', 'Ambas'])
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
      .filter(p => {
        const matchText = filtro === '' ||
          p.titulo?.toLowerCase().includes(filtro.toLowerCase()) ||
          p.ubicacion?.toLowerCase().includes(filtro.toLowerCase());
          
        const matchType = filtroTipo === 'Todos' ||
          p.tipo_inmueble?.toLowerCase() === filtroTipo.toLowerCase();
          
        return matchText && matchType;
      })
      .sort((a, b) => {
        if (orden === 'precio-asc') return (a.precio || 0) - (b.precio || 0);
        if (orden === 'precio-desc') return (b.precio || 0) - (a.precio || 0);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [propiedades, filtro, filtroTipo, orden]);

  return (
    <SafeAreaView style={s.pageWrapper}>
      <StatusBar barStyle="light-content" backgroundColor={T.bgPage} />
      
      <ScrollView style={s.mainScroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO CINEMÁTICO DE VENTA (70vh / 480px) */}
        <View style={s.heroFrame}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800' }} 
            style={StyleSheet.absoluteFillObject} 
            resizeMode="cover" 
          />
          <View style={s.heroGradientOverlay} />
          <View style={s.heroBodyContainer}>
            <Text style={s.heroEyebrow}>{t('props_venta_eyebrow', { defaultValue: 'COLECCIÓN EXCLUSIVA' })}</Text>
            <Text style={s.heroMainHeading}>
              {t('props_venta_title_1', { defaultValue: 'Propiedades' })}{'\n'}
              <Text style={s.heroHeadingItalic}>{t('props_venta_title_em', { defaultValue: 'en Venta' })}</Text>
            </Text>
            <Text style={s.heroSubParagraph}>
              {t('props_venta_sub', { defaultValue: 'Residencias de lujo seleccionadas para quienes exigen lo mejor.' })}
            </Text>
          </View>
        </View>

        {/* BARRA DE FILTROS PREMIUM */}
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
              {['Todos', 'Casa', 'Departamento', 'Terreno', 'Local'].map(tipo => (
                <SortPill
                  key={tipo}
                  label={tipo === 'Todos' ? t('props_filter_todos', { defaultValue: 'Todos' }) : t(`props_filter_${tipo.toLowerCase()}`, { defaultValue: tipo })}
                  active={filtroTipo === tipo}
                  onPress={() => setFiltroTipo(tipo)}
                />
              ))}
            </View>
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

        {/* GRILLA RESPONSIVA ELÁSTICA */}
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
              <FooterLink label="✉ ventas@inmoviral.com.mx" />
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
  heroGradientOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to top, #0F0D0A 0%, rgba(15,13,10,0.35) 60%, rgba(15,13,10,0.55) 100%)' 
  },
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
  cardGridCell: { padding: 14, position: 'relative' },
  
  // Tarjetas & Hovers/Sombras
  propertyLuxeCard: { backgroundColor: T.bgCard, borderWidth: 1, borderColor: 'rgba(160,120,64,0.1)', overflow: 'hidden', transition: 'transform 0.3s ease, border-color 0.3s ease' },
  propertyCardHovered: { 
    borderColor: 'rgba(160,120,64,0.35)', 
    transform: [{ translateY: -4 }],
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 18 },
      android: { elevation: 10 },
      default: { boxUnderline: '0px 12px 30px rgba(0,0,0,0.65)' }
    })
  },
  cardImageFrame: { width: '100%', aspectRatio: 4/3, overflow: 'hidden', position: 'relative', backgroundColor: '#1C1812' },
  cardImageEngine: { width: '100%', height: '100%', transition: 'transform 0.5s ease' },
  
  // Badge de Venta Oficial (Fondo Dorado, Letra Oscura)
  saleBadgeFrame: { position: 'absolute', top: 14, left: 14, backgroundColor: T.gold, paddingHorizontal: 10, paddingVertical: 4 },
  saleBadgeText: { color: '#0F0D0A', fontSize: 10, fontFamily: T.sans, fontWeight: '700', letterSpacing: 2 },
  
  cardDataContent: { padding: 22 },
  cardPriceTag: { fontFamily: T.serif, fontSize: 22, color: T.goldDeep, fontWeight: '400', marginBottom: 6 },
  cardPriceSuffix: { fontFamily: T.sans, fontSize: 12, color: T.textSub, letterSpacing: 1, fontWeight: '300' },
  cardTitleHeading: { fontFamily: T.serif, fontSize: 20, color: T.textMain, marginBottom: 8, lineHeight: 24 },
  cardLocationSub: { fontFamily: T.sans, fontSize: 12, color: T.textSub, fontWeight: '300', marginBottom: 14, letterSpacing: 0.5 },
  cardSpecsLineDivider: { height: 1, backgroundColor: 'rgba(160,120,64,0.1)', marginBottom: 14 },
  cardSpecsRowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  specItemLabel: { fontSize: 11, color: 'rgba(242,237,229,0.5)', fontFamily: T.sans, fontWeight: '300' },
  
  // Botones
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