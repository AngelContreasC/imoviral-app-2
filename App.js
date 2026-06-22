import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  Platform, 
  SafeAreaView,
  Animated,
  Easing,
  useWindowDimensions,
  Linking
} from 'react-native';

// ══ 💎 CONFIGURACIÓN BILINGÜE NATIVA ══
import './config/i18n'; 
import { useTranslation } from 'react-i18next';

// Componentes del ecosistema Inmoviral
import LoginPage from './Componentes/LoginPage.jsx';
import PropiedadesVenta from './Componentes/PropiedadesVenta.jsx';
import PropiedadesRenta from './Componentes/PropiedadesRenta.jsx';
import VerPropiedad from './Componentes/VerPropiedad.jsx';
import ServiciosVirales from './Componentes/ServiciosVirales.jsx';
import SobreNosotros from './Componentes/SobreNosotros.jsx';
import Vendedor from './Componentes/Vendedor.jsx';

import { useAuth, AuthProvider } from './AuthContext.js'; 
import { supabase } from './supabaseClient'; 

const LUXURY_FONT = 'Cormorant Garamond, Georgia, serif';
const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'android' ? 'serif' : 'Georgia, serif';
const SANS_FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

/* ─────────────────────────────────────────────
   👑 SUB-COMPONENTES INTERACTIVOS DEL FOOTER
───────────────────────────────────────────── */
function FooterLink({ text, onPress }) {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity 
      onPress={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ paddingVertical: 2 }}
      activeOpacity={0.7}
    >
      <Text style={[styles.footerLinkItem, hovered && styles.footerLinkItemHovered]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function SocialSquare({ label }) {
  const [hovered, setHovered] = useState(false);
  return (
    <View 
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
      style={[styles.socialIconSquare, hovered && styles.socialIconSquareHovered]}
    >
      <Text style={[styles.socialIconInnerText, hovered && styles.socialIconInnerTextHovered]}>
        {label}
      </Text>
    </View>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE DE APLICACIÓN PRINCIPAL
───────────────────────────────────────────── */
function MainApp() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth(); 
  const { width } = useWindowDimensions(); 
  
  const [vista, setVista] = useState('home');
  const [mobileNavAbierto, setMobileNavAbierto] = useState(false); 
  const [userMenuAbierto, setUserMenuAbierto] = useState(false); 
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [propiedades, setPropiedades] = useState([]); 
  
  // Contadores Animados (Count-Up)
  const [countYears, setCountYears] = useState(0);
  const [countProps, setCountProps] = useState(0);

  // Estados de Hovers Interactivos Premium
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredLogin, setHoveredLogin] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);       
  const [hoveredHeroBtn, setHoveredHeroBtn] = useState(false); 
  const [hoveredFeatureIdx, setHoveredFeatureIdx] = useState(null); 
  const [hoveredCardId, setHoveredCardId] = useState(null);   
  const [hoveredAboutImg, setHoveredAboutImg] = useState(false); 
  const [hoveredCtaBtn, setHoveredCtaBtn] = useState(false);   
  const [hoveredLogout, setHoveredLogout] = useState(false);   

  const tickerValue = useRef(new Animated.Value(0)).current;
  const esPantallaGrande = Platform.OS === 'web' && width > 1024;
  const idiomaActual = i18n.language || 'es';

  const obtenerIniciales = () => {
    if (!user) return 'GR';
    if (user.user_metadata?.full_name) {
      const partes = user.user_metadata.full_name.split(' ');
      if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
      return partes[0][0].toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };

  const obtenerNombreUsuario = () => {
    if (!user) return 'Gabriel Ramírez';
    return user.user_metadata?.full_name || user.email || 'Usuario Premium';
  };

  const cambiarIdioma = (idioma) => i18n.changeLanguage(idioma);
  const irAPropiedad = (id) => { setPropiedadSeleccionada(id); setVista('propiedad'); setMobileNavAbierto(false); };
  const navegacionMovil = (destino) => { setVista(destino); setMobileNavAbierto(false); };
  const volverDePropiedad = (destino) => { setPropiedadSeleccionada(null); setVista(destino || 'home'); };
  const abrirWhatsAppOficial = () => Linking.openURL(`https://wa.me/526140000000?text=${encodeURIComponent(t('whatsapp.message'))}`);

  useEffect(() => {
    if (vista !== 'home') return;
    let startYears = 0, startProps = 0;
    const timer = setInterval(() => {
      startYears += 12 / 40; startProps += 150 / 40;
      if (startYears >= 12) { setCountYears(12); setCountProps(150); clearInterval(timer); }
      else { setCountYears(Math.floor(startYears)); setCountProps(Math.floor(startProps)); }
    }, 40);
    return () => setInterval(timer);
  }, [vista]);

  useEffect(() => {
    const cargarCasas = async () => {
      const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
      if (!error && data) setPropiedades(data);
    };
    cargarCasas();
  }, [vista]);

  useEffect(() => {
    const loopAnimation = () => {
      tickerValue.setValue(0);
      Animated.timing(tickerValue, { toValue: -1200, duration: 32000, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }).start(() => loopAnimation());
    };
    loopAnimation();
  }, [tickerValue]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
      * { transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.35s ease, opacity 0.35s ease; }
      @keyframes couturePulse {
        0% { box-shadow: 0 0 0 0 rgba(160, 120, 64, 0.4); transform: scale(1); }
        70% { box-shadow: 0 0 0 15px rgba(160, 120, 64, 0); transform: scale(1.03); }
        100% { box-shadow: 0 0 0 0 rgba(160, 120, 64, 0); transform: scale(1); }
      }
      .whatsapp-luxe-pulse { animation: couturePulse 2.5s infinite ease-in-out; }
      .reveal-section { opacity: 0; transform: translateY(40px); animation: sectionFadeUp 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      @keyframes sectionFadeUp { to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  const renderNavbar = () => (
    <View style={[styles.navBar, isScrolled && styles.navBarScrolled, vista !== 'home' && styles.navBarStaticSolid]}>
      <TouchableOpacity onPress={() => setVista('home')}><Text style={styles.logoText}>INMOVIRAL</Text></TouchableOpacity>
      
      {esPantallaGrande && (
        <View style={styles.navLinksRow}>
          <TouchableOpacity onPress={() => setVista('venta')} onMouseEnter={() => setHoveredNav('venta')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'venta' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'venta' && styles.activeNavLink]}>{t('navbar.buy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVista('renta')} onMouseEnter={() => setHoveredNav('renta')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'renta' && styles.activeNavLink]}>
            <Text style={[styles.navLink, vista === 'renta' && styles.activeNavLink]}>{t('navbar.rent')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVista('servicios')} onMouseEnter={() => setHoveredNav('servicios')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'servicios' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'servicios' && styles.activeNavLink]}>{t('navbar.services')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVista('nosotros')} onMouseEnter={() => setHoveredNav('nosotros')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'nosotros' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'nosotros' && styles.activeNavLink]}>{t('navbar.about')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.navActions}>
        {user ? (
          <View style={styles.navAuthenticatedRow}>
            <TouchableOpacity style={styles.navAvatarCircle} onPress={() => setUserMenuAbierto(true)}>
              <Text style={styles.navAvatarText}>{obtenerIniciales()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.hamMenuButtonAuthenticated} onPress={() => setUserMenuAbierto(true)}>
              <Text style={styles.hamMenuButtonIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        ) : (
          esPantallaGrande ? (
            <TouchableOpacity style={[styles.btnCta, hoveredLogin && styles.btnCtaHover]} onPress={() => setVista('login')} onMouseEnter={() => setHoveredLogin(true)} onMouseLeave={() => setHoveredLogin(false)}>
              <Text style={[styles.btnCtaText, hoveredLogin && styles.btnCtaHoverText]}>{t('navbar.login')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.hamMenuButton} onPress={() => setMobileNavAbierto(true)}>
              <Text style={styles.hamMenuButtonIcon}>☰</Text>
            </TouchableOpacity>
          )
        )}

        <View style={styles.langContainer}>
          <TouchableOpacity onPress={() => cambiarIdioma('es')} style={[styles.langBtn, idiomaActual.startsWith('es') && styles.langBtnActive]}><Text style={styles.langText}>ES</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => cambiarIdioma('en')} style={[styles.langBtn, idiomaActual.startsWith('en') && styles.langBtnActive]}><Text style={styles.langText}>EN</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderUserMenuDrawer = () => {
    if (!userMenuAbierto) return null;
    return (
      <View style={styles.userMenuDrawerOverlay}>
        <TouchableOpacity style={styles.drawerDismissOverlay} activeOpacity={1} onPress={() => setUserMenuAbierto(false)} />
        <View style={styles.userMenuDrawerBody}>
          <View style={styles.drawerProfileHeader}>
            <View style={styles.profileAvatarBox}><Text style={styles.profileAvatarText}>{obtenerIniciales()}</Text></View>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileNameText} numberOfLines={1}>{obtenerNombreUsuario()}</Text>
              <Text style={styles.profileRoleText}>{user?.user_metadata?.client_type || 'Comprador'} · Premium</Text>
            </View>
            <TouchableOpacity onPress={() => setUserMenuAbierto(false)} style={styles.closeDrawerBtn}><Text style={styles.closeDrawerBtnText}>✕</Text></TouchableOpacity>
          </View>

          <View style={styles.roleStripBox}>
            <View style={styles.roleDot} />
            <Text style={styles.roleStripText}>
              {idiomaActual.startsWith('es') ? `Modo ${user?.user_metadata?.client_type || 'Comprador'} activo` : `${user?.user_metadata?.client_type || 'Buyer'} mode active`}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScrollContainer}>
            <Text style={styles.drawerSectionLabel}>{t('menu.my_activity', { defaultValue: 'MI ACTIVIDAD' })}</Text>
            <TouchableOpacity style={[styles.drawerLinkRow, styles.drawerLinkRowActive]}><Text style={styles.drawerLinkRowTextActive}>📊 {t('menu.dashboard', { defaultValue: 'Dashboard' })}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.drawerLinkRow} onPress={() => { setUserMenuAbierto(false); setVista('vendedor'); }}><Text style={styles.drawerLinkRowText}>📝 {t('menu.my_listings', { defaultValue: 'Mis publicaciones' })}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.drawerLinkRow}>
              <Text style={styles.drawerLinkRowText}>❤️ {t('menu.saved_properties', { defaultValue: 'Propiedades guardadas' })}</Text>
              <View style={styles.rowBadge}><Text style={styles.rowBadgeText}>4</Text></View>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.drawerFooterBox}>
            <TouchableOpacity style={[styles.logoutBtn, hoveredLogout && styles.logoutBtnHover]} onMouseEnter={() => setHoveredLogout(true)} onMouseLeave={() => setHoveredLogout(false)} onPress={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} >
              <Text style={[styles.logoutBtnText, hoveredLogout && styles.logoutBtnTextHover]}>🚪 {t('menu.logout', { defaultValue: 'Cerrar Sesión' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderLuxuryMobileMenu = () => {
    if (!mobileNavAbierto) return null;
    return (
      <View style={styles.luxuryOverlayMenu}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.luxuryMenuHeader}>
            <Text style={styles.logoText}>INMOVIRAL</Text>
            <TouchableOpacity onPress={() => setMobileNavAbierto(false)} style={styles.closeMenuBtn}><Text style={styles.closeMenuBtnText}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.luxuryMenuLinksContainer}>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('venta')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>01</Text><Text style={[styles.luxuryMenuLinkText, vista === 'venta' && styles.luxuryActiveLink]}>{t('navbar.buy')}</Text></View></TouchableOpacity>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('renta')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>02</Text><Text style={[styles.luxuryMenuLinkText, vista === 'renta' && styles.luxuryActiveLink]}>{t('navbar.rent')}</Text></View></TouchableOpacity>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('servicios')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>03</Text><Text style={[styles.luxuryMenuLinkText, vista === 'servicios' && styles.luxuryActiveLink]}>{t('navbar.services')}</Text></View></TouchableOpacity>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('nosotros')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>04</Text><Text style={[styles.luxuryMenuLinkText, vista === 'nosotros' && styles.luxuryActiveLink]}>{t('navbar.about')}</Text></View></TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  if (vista === 'login')     return <LoginPage onVolver={() => setVista('home')} />;
  if (vista === 'venta')     return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content"/>{renderNavbar()}{renderUserMenuDrawer()}{renderLuxuryMobileMenu()}<PropiedadesVenta onVerPropiedad={irAPropiedad} /></SafeAreaView>;
  if (vista === 'renta')     return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content"/>{renderNavbar()}{renderUserMenuDrawer()}{renderLuxuryMobileMenu()}<PropiedadesRenta onVerPropiedad={irAPropiedad} /></SafeAreaView>;
  if (vista === 'propiedad') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content"/>{renderNavbar()}{renderUserMenuDrawer()}{renderLuxuryMobileMenu()}<VerPropiedad propiedadId={propiedadSeleccionada} onVolver={volverDePropiedad} /></SafeAreaView>;
  if (vista === 'servicios') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content"/>{renderNavbar()}{renderUserMenuDrawer()}{renderLuxuryMobileMenu()}<ServiciosVirales onIrLogin={() => setVista('login')} /></SafeAreaView>;
  if (vista === 'vendedor')  return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content"/>{renderNavbar()}{renderUserMenuDrawer()}{renderLuxuryMobileMenu()}<Vendedor onVolver={() => setVista('home')} /></SafeAreaView>;
  if (vista === 'nosotros')  return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content"/>{renderNavbar()}{renderUserMenuDrawer()}{renderLuxuryMobileMenu()}<SobreNosotros onIrServicios={() => setVista('servicios')} onIrPropiedades={() => setVista('venta')} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      {renderUserMenuDrawer()}
      {renderLuxuryMobileMenu()}

      <ScrollView contentContainerStyle={styles.scrollContainer} onScroll={(e) => setIsScrolled(e.nativeEvent.contentOffset.y > 50)} scrollEventThrottle={16}>
        
        {/* ══ 1. HERO ══ */}
        <View style={styles.heroSection}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=85" }} style={styles.heroBg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBody}>
            <Text style={styles.heroTag}>{t('hero.tag')}</Text>
            <Text style={styles.heroTitle}>
              {t('hero.title_part1')}{'\n'}
              <Text style={styles.heroTitleItalic}>{t('hero.title_italic')}</Text> {'\n'}
              {t('hero.title_part2')}
            </Text>
            <Text style={styles.heroDesc}>{t('hero.description')}</Text>
            <View style={styles.heroActionsRow}>
              <TouchableOpacity style={[styles.btnPrimary, hoveredHeroBtn && styles.btnPrimaryHovered]} onPress={() => setVista('venta')} onMouseEnter={() => setHoveredHeroBtn(true)} onMouseLeave={() => setHoveredHeroBtn(false)}>
                <Text style={styles.btnTextBlack}>{t('hero.cta_portfolio')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setVista('servicios')}>
                <Text style={styles.btnTextWhite}>{t('hero.cta_clients')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.heroCounterBar}>
            <View style={styles.hcItem}><Text style={styles.hcNum}>0{countYears}</Text><Text style={styles.hcLabel}>{t('hero.counter_years')}</Text></View>
            <View style={styles.hcItem}><Text style={styles.hcNum}>{countProps}+</Text><Text style={styles.hcLabel}>{t('hero.counter_sold')}</Text></View>
            <View style={styles.hcItem}><Text style={styles.hcNum}>5</Text><Text style={styles.hcLabel}>{t('hero.counter_satisfied')}</Text></View>
          </View>
        </View>

        {/* ══ 2. TICKER MARQUEE ══ */}
        <View style={styles.tickerBar}>
          <Animated.View style={[styles.tickerInnerLoop, { transform: [{ translateX: tickerValue }] }]}>
            <Text style={styles.tickerText}>{t('ticker.text')}</Text>
          </Animated.View>
        </View>

        {/* ══ 3. FEATURES SECTOR ══ */}
        <View className="reveal-section" style={styles.featuresSection}>
          <View style={styles.featuresGrid}>
            {[
              { id: 1, json_base: 'features.residential', svg: <path d="M3 21h4v-4H3v4zm0-6h4v-4H3v4zm6 6h4v-6H9v6zm0-10h4V7H9v4zm6 10h4V11h-4v10zm0-12h4V3h-4v6z"/> },
              { id: 2, json_base: 'features.premium', svg: <><rect x="2" y="6" width="20" height="14" rx="1"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"/></> },
              { id: 3, json_base: 'features.investment', svg: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/> },
              { id: 4, json_base: 'features.advisory', svg: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/> }
            ].map((feat, idx) => (
              <View key={feat.id} style={[styles.featureItem, hoveredFeatureIdx === idx && styles.featureItemHovered]} onMouseEnter={() => setHoveredFeatureIdx(idx)} onMouseLeave={() => setHoveredFeatureIdx(null)}>
                <Text style={styles.featureNum}>0{feat.id}</Text>
                <View style={styles.featureIconWrap}>
                  {Platform.OS === 'web' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#A07840" strokeWidth="1.2" strokeLinecap="round" style={{ width: 24, height: 24 }}>{feat.svg}</svg>
                  ) : ( <View style={{ width: 24, height: 24, backgroundColor: 'rgba(160,120,64,0.1)' }} /> )}
                </View>
                <Text style={styles.featureTitle}>{t(`${feat.json_base}.t1`)} {t(`${feat.json_base}.t2`)}</Text>
                <Text style={styles.featureText}>{t(`${feat.json_base}.d`)}</Text>
                <View style={[styles.cardGoldIndicator, hoveredFeatureIdx === idx && styles.cardGoldIndicatorActive]} />
              </View>
            ))}
          </View>
        </View>

        {/* ══ 4. NUESTRAS SOLUCIONES ══ */}
        <View className="reveal-section" style={styles.solutionsSection}>
          <Text style={styles.solutionsLabel}>{t('solutions.label')}</Text>
          <Text style={styles.solutionsTitle}>{t('solutions.title')}</Text>
          <View style={styles.solutionsGrid}>
            <View style={[styles.solutionCard, hoveredCardId === 'lux' && styles.solutionCardHovered]} onMouseEnter={() => setHoveredCardId('lux')} onMouseLeave={() => setHoveredCardId(null)}>
              <View style={styles.solContent}>
                <Text style={styles.solTag}>{t('solutions.lux_houses.tag')}</Text>
                <Text style={styles.solCardTitle}>{t('solutions.lux_houses.title')}</Text>
                <Text style={styles.solCardText}>{t('solutions.lux_houses.desc')}</Text>
                <TouchableOpacity style={styles.solLink}><Text style={styles.solLinkText}>{t('solutions.visit_cta')}</Text></TouchableOpacity>
              </View>
              <View style={styles.solImgWrap}>
                <Image source={{ uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600" }} style={styles.solImg} />
                <View style={[styles.technicalOverlay, hoveredCardId === 'lux' && styles.technicalOverlayActive]}>
                  <Text style={styles.techOverlayTitle}>{t('solutions.profile_label')}</Text>
                  <Text style={styles.techOverlayText}>{t('solutions.lux_houses.profile')}</Text>
                </View>
              </View>
              <View style={[styles.cardGoldIndicator, hoveredCardId === 'lux' && styles.cardGoldIndicatorActive]} />
            </View>

            <View style={[styles.solutionCard, hoveredCardId === 'prem' && styles.solutionCardHovered]} onMouseEnter={() => setHoveredCardId('prem')} onMouseLeave={() => setHoveredCardId(null)}>
              <View style={styles.solContent}>
                <Text style={styles.solTag}>{t('solutions.premium_apts.tag')}</Text>
                <Text style={styles.solCardTitle}>{t('solutions.premium_apts.title')}</Text>
                <Text style={styles.solCardText}>{t('solutions.premium_apts.desc')}</Text>
                <TouchableOpacity style={styles.solLink}><Text style={styles.solLinkText}>{t('solutions.visit_cta')}</Text></TouchableOpacity>
              </View>
              <View style={styles.solImgWrap}>
                <Image source={{ uri: "https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=600" }} style={styles.solImg} />
                <View style={[styles.technicalOverlay, hoveredCardId === 'prem' && styles.technicalOverlayActive]}>
                  <Text style={styles.techOverlayTitle}>{t('solutions.profile_label')}</Text>
                  <Text style={styles.techOverlayText}>{t('solutions.premium_apts.profile')}</Text>
                </View>
              </View>
              <View style={[styles.cardGoldIndicator, hoveredCardId === 'prem' && styles.cardGoldIndicatorActive]} />
            </View>
          </View>
        </View>

        {/* ══ 5. SOBRE NOSOTROS ══ */}
        <View className="reveal-section" style={styles.aboutSection}>
          <View style={styles.aboutGrid}>
            <TouchableOpacity activeOpacity={1} style={styles.aboutImgWrap} onMouseEnter={() => setHoveredAboutImg(true)} onMouseLeave={() => setHoveredAboutImg(false)}>
              <Image source={{ uri: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800" }} style={[styles.aboutImg, hoveredAboutImg && styles.aboutImgZoomed]} />
            </TouchableOpacity>
            <View style={styles.aboutContent}>
              <Text style={styles.aboutLabel}>{t('about.label')}</Text>
              <Text style={styles.aboutTitleText}>{t('about.title')}{'\n'}<Text style={styles.aboutTitleItalic}>{t('about.title_italic')}</Text></Text>
              <Text style={styles.aboutDescriptionText}>{t('about.desc')}</Text>
              <TouchableOpacity style={styles.btnOutlineLight} onPress={() => setVista('nosotros')}><Text style={styles.btnTextWhite}>{t('about.cta')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ══ 6. FINAL CTA BANNER ══ */}
        <View style={styles.finalCtaSection}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600" }} style={styles.ctaBgImage} />
          <View style={styles.ctaDarkLayer} />
          <View style={styles.ctaContentWrapper}>
            <Text style={styles.ctaSubLabel}>{t('cta.label')}</Text>
            <Text style={styles.ctaMainTitle}>{t('cta.title')}</Text>
            <TouchableOpacity style={[styles.ctaGoldButton, hoveredCtaBtn && styles.ctaGoldButtonHovered]} onPress={() => setVista('venta')} onMouseEnter={() => setHoveredCtaBtn(true)} onMouseLeave={() => setHoveredCtaBtn(false)}>
              <Text style={[styles.ctaGoldButtonText, hoveredCtaBtn && styles.ctaGoldButtonTextHover]}>{t('cta.cta_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ 7. 👑 LUXURY 4-COLUMN FOOTER INTERACTIVO SIN FLECHAS MATCHEADO ══ */}
        <View style={styles.footerContainer}>
          <View style={[styles.footerGrid, { flexDirection: width > 768 ? 'row' : 'column' }]}>
            
            {/* Columna 1: Marca & Redes Animadas */}
            <View style={[styles.footerColumnUnit, { width: width > 768 ? '30%' : '100%' }]}>
              <Text style={styles.footerLogoText}>INMOVIRAL</Text>
              <Text style={styles.footerBrandDesc}>
                {idiomaActual.startsWith('es')
                  ? 'Bienes raíces premium para estilos de vida modernos. Servicios de venta, renta y asesoría en mercados nacionales e internacionales.'
                  : 'Premium real estate for modern lifestyles. Sales, leasing, and advisory services across domestic and international markets.'}
              </Text>
              <View style={styles.footerSocialContainer}>
                {['WH', 'IG', 'FB', 'GM'].map((red) => (
                  <SocialSquare key={red} label={red} />
                ))}
              </View>
            </View>

            {/* Columna 2: Empresa Animada */}
            <View style={[styles.footerColumnUnit, { width: width > 768 ? '20%' : '100%' }]}>
              <Text style={styles.footerColTitle}>{idiomaActual.startsWith('es') ? 'EMPRESA' : 'COMPANY'}</Text>
              <FooterLink text={idiomaActual.startsWith('es') ? 'Sobre Nosotros' : 'About Us'} onPress={() => setVista('nosotros')} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Propiedades' : 'Properties'} onPress={() => setVista('venta')} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Nuestro Equipo' : 'Our Team'} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Testimonios' : 'Testimonials'} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Bolsa de Trabajo' : 'Careers'} />
            </View>

            {/* Columna 3: Catálogo Animado */}
            <View style={[styles.footerColumnUnit, { width: width > 768 ? '20%' : '100%' }]}>
              <Text style={styles.footerColTitle}>{idiomaActual.startsWith('es') ? 'CATÁLOGO' : 'CATALOG'}</Text>
              <FooterLink text={idiomaActual.startsWith('es') ? 'Residencias de Lujo' : 'Luxury Homes'} onPress={() => setVista('venta')} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Departamentos' : 'Apartments'} onPress={() => setVista('venta')} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Colección Penthouses' : 'Penthouses'} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Terrenos' : 'Land'} />
              <FooterLink text={idiomaActual.startsWith('es') ? 'Comercial' : 'Commercial'} />
            </View>

            {/* Columna 4: Contacto */}
            <View style={[styles.footerColumnUnit, { width: width > 768 ? '22%' : '100%' }]}>
              <Text style={styles.footerColTitle}>{idiomaActual.startsWith('es') ? 'CONTACTO' : 'CONTACT'}</Text>
              <Text style={styles.footerInfoItem}>📞 +52 6181630471</Text>
              <Text style={styles.footerInfoItem}>✉️ info@inmoviral.com</Text>
              <Text style={styles.footerInfoItem}>📍 Chihuahua, Chih, México</Text>
              <Text style={styles.footerInfoItem}>🕒 {idiomaActual.startsWith('es') ? 'Lun–Vie: 9:00 AM – 7:00 PM' : 'Mon–Fri: 9:00 AM – 7:00 PM'}</Text>
            </View>

          </View>

          {/* Copyright Inferior */}
          <View style={styles.footerBottomBar}>
            <Text style={styles.footerCopyright}>© 2026 INMOVIRAL. All rights reserved.</Text>
            <View style={styles.footerBottomRightLinks}>
              <Text style={styles.footerCopyrightLink}>{idiomaActual.startsWith('es') ? 'Política de Privacidad' : 'Privacy Policy'}</Text>
              <Text style={styles.footerCopyrightLink}>{idiomaActual.startsWith('es') ? 'Términos de Uso' : 'Terms of Use'}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() { return <AuthProvider><MainApp /></AuthProvider>; }

/* ─────────────────────────────────────────────
   💎 ESTILOS COMPLEMENTARIOS DRAWER NATIVO SANEADOS
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060606' },
  scrollContainer: { paddingBottom: 0 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, position: Platform.OS === 'web' ? 'fixed' : 'relative', top: 0, left: 0, right: 0, zIndex: 999, backgroundColor: '#060606', borderBottomWidth: 1, borderBottomColor: 'rgba(160,120,64,0.05)', paddingTop: 20, paddingBottom: 20 },
  navBarScrolled: { backgroundColor: '#0c0c0c', paddingTop: 14, paddingBottom: 14, borderBottomColor: 'rgba(160,120,64,0.15)' },
  navBarStaticSolid: { backgroundColor: '#0c0c0c', paddingTop: 14, paddingBottom: 14, borderBottomColor: 'rgba(160,120,64,0.12)' },
  logoText: { fontFamily: LUXURY_FONT, fontSize: 24, fontWeight: '400', color: '#fff', letterSpacing: 7.5, textTransform: 'uppercase' },
  navLinksRow: { flexDirection: 'row', gap: 28 },
  navLink: { color: '#a3a3a3', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  navLinkItemHovered: { transform: [{ scale: 1.04 }] },
  activeNavLink: { color: '#A07840' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btnCta: { borderWidth: 1, borderColor: 'rgba(160,120,64,0.6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 1 },
  btnCtaHover: { backgroundColor: '#A07840', borderColor: '#A07840' },
  btnCtaText: { color: '#A07840', fontSize: 11, fontWeight: '400', letterSpacing: 2 },
  btnCtaHoverText: { color: '#000000', fontWeight: '700' },
  langContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 1, alignItems: 'center' },
  langBtn: { paddingVertical: 5, paddingHorizontal: 10 },
  langBtnActive: { backgroundColor: '#A07840' },
  langText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  
  navAuthenticatedRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navAvatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A07840', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  navAvatarText: { color: '#F2EDE5', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  hamMenuButtonAuthenticated: { padding: 4 },
  hamMenuButton: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)' },
  hamMenuButtonIcon: { color: '#A07840', fontSize: 16 },

  userMenuDrawerOverlay: { ...StyleSheet.absoluteFillObject, position: 'fixed', zIndex: 10000, flexDirection: 'row', justifyContent: 'flex-end' },
  drawerDismissOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  userMenuDrawerBody: { width: 320, backgroundColor: '#111111', borderLeftWidth: 1, borderColor: '#1E1E1C', height: '100%', paddingVertical: 20 },
  drawerProfileHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#1E1E1C', gap: 12 },
  profileAvatarBox: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#9A7C50', justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { color: '#F2EDE5', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  profileInfoBox: { flex: 1 },
  profileNameText: { fontSize: 14, fontWeight: '500', color: '#F2EDE5', marginBottom: 2 },
  profileRoleText: { fontSize: 10, color: '#9A7C50', letterSpacing: 1, textTransform: 'uppercase' },
  closeDrawerBtn: { padding: 6 },
  closeDrawerBtnText: { color: '#555', fontSize: 16 },
  roleStripBox: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#0A0A09', borderBottomWidth: 1, borderColor: '#1E1E1C', flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9A7C50' },
  roleStripText: { fontSize: 11, color: '#666' },
  drawerScrollContainer: { flex: 1, marginTop: 16 },
  drawerSectionLabel: { fontSize: 10, color: '#3A3A38', letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8 },
  drawerLinkRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  drawerLinkRowActive: { backgroundColor: '#1A1A18', borderLeftWidth: 2, borderColor: '#9A7C50' },
  drawerLinkRowText: { fontSize: 13, color: '#888', flex: 1 },
  drawerLinkRowTextActive: { fontSize: 13, color: '#F2EDE5', fontWeight: '500' },
  rowBadge: { backgroundColor: '#9A7C50', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 18, alignItems: 'center' },
  rowBadgeMuted: { backgroundColor: '#1E1E1C' },
  rowBadgeText: { color: '#F2EDE5', fontSize: 9, fontWeight: '700' },
  rowBadgeTextMuted: { color: '#555', fontSize: 9 },
  drawerInnerDivider: { height: 1, backgroundColor: '#1A1A18', marginVertical: 12, marginHorizontal: 16 },
  drawerFooterBox: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderColor: '#1A1A18' },
  logoutBtn: { width: '100%', borderWidth: 1, borderColor: '#2A2A28', paddingVertical: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  logoutBtnHover: { borderColor: '#7A2020', backgroundColor: '#1A0A0A' },
  logoutBtnText: { color: '#666', fontSize: 13, fontWeight: '500' },
  logoutBtnTextHover: { color: '#C05050' },

  heroSection: { height: 750, justifyContent: 'center', paddingHorizontal: 24, position: 'relative' },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,6,0.75)' },
  heroBody: { zIndex: 10, maxWidth: 850 },
  heroTag: { color: '#A07840', fontSize: 10, fontWeight: '600', letterSpacing: 4, marginBottom: 25 },
  heroTitle: { fontFamily: LUXURY_FONT, fontSize: Platform.OS === 'web' ? 56 : 28, color: '#fff', lineHeight: Platform.OS === 'web' ? 72 : 42, letterSpacing: 3 },
  heroTitleItalic: { fontStyle: 'italic', color: '#fff' },
  heroDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 24, marginVertical: 30, maxWidth: 520 },
  heroActionsRow: { flexDirection: 'row', gap: 16 },
  btnPrimary: { backgroundColor: '#A07840', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 1 },
  btnGhost: { paddingVertical: 16, paddingHorizontal: 5 },
  btnTextBlack: { color: '#000', fontWeight: '700', fontSize: 11, letterSpacing: 2 },
  btnTextWhite: { color: '#e5e5e5', fontWeight: '500', fontSize: 11, letterSpacing: 2 },
  heroCounterBar: { position: 'absolute', bottom: 50, left: 50, right: 50, flexDirection: 'row', gap: 80 },
  hcItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hcNum: { fontFamily: SERIF_FONT, fontSize: 34, color: '#fff' },
  hcLabel: { color: '#737373', fontSize: 9, letterSpacing: 2, maxWidth: 110 },
  tickerBar: { backgroundColor: '#A07840', paddingVertical: 18, overflow: 'hidden' },
  tickerInnerLoop: { flexDirection: 'row', width: 3200 },
  tickerText: { fontFamily: SERIF_FONT, color: '#ffffff', fontSize: 10, letterSpacing: 4.5 },
  featuresSection: { paddingVertical: 100, paddingHorizontal: 24, backgroundColor: '#ffffff' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 30, justifyContent: 'center' },
  featureItem: { width: Platform.OS === 'web' ? '23%' : '100%', minWidth: 260, padding: 35, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  featureItemHovered: { backgroundColor: '#efede7' },
  featureNum: { fontSize: 12, color: '#A07840', fontWeight: '600', marginBottom: 25 },
  featureIconWrap: { marginBottom: 20 },
  featureTitle: { fontFamily: SERIF_FONT, fontSize: 24, color: '#0a0a0a', marginBottom: 18 },
  featureText: { color: '#525252', fontSize: 13, lineHeight: 22 },
  solutionsSection: { paddingVertical: 100, paddingHorizontal: 24, backgroundColor: '#efede7' },
  solutionsLabel: { color: '#A07840', fontSize: 11, fontWeight: '600', letterSpacing: 5, marginBottom: 16, textAlign: 'center' },
  solutionsTitle: { fontFamily: LUXURY_FONT, fontSize: 34, color: '#0a0a0a', textAlign: 'center', marginBottom: 65 },
  solutionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 40, justifyContent: 'center' },
  solutionCard: { flexDirection: Platform.OS === 'web' ? 'row' : 'column-reverse', backgroundColor: '#fff', width: Platform.OS === 'web' ? '47%' : '100%', minWidth: 300 },
  solutionCardHovered: { backgroundColor: '#e5e2db' },
  cardGoldIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 0, backgroundColor: '#A07840' },
  cardGoldIndicatorActive: { height: 3 },
  solContent: { flex: 1.1, padding: 35 },
  solTag: { color: '#A07840', fontSize: 9, fontWeight: '600', marginBottom: 14 },
  solCardTitle: { fontFamily: SERIF_FONT, fontSize: 24, color: '#0a0a0a', marginBottom: 18 },
  solCardText: { color: '#525252', fontSize: 13, lineHeight: 23, marginBottom: 22 },
  solLink: { borderBottomWidth: 1, borderBottomColor: '#A07840', paddingBottom: 4 },
  solLinkText: { color: '#0a0a0a', fontSize: 10, fontWeight: '700' },
  solImgWrap: { flex: 0.9, minHeight: 240, overflow: 'hidden', position: 'relative' },
  solImg: { width: '100%', height: '100%' },
  technicalOverlay: { position: 'absolute', top: '100%', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,12,12,0.92)', padding: 24, justifyContent: 'center' },
  technicalOverlayActive: { top: 0 },
  techOverlayTitle: { fontFamily: LUXURY_FONT, color: '#A07840', fontSize: 16 },
  techOverlayText: { color: '#a3a3a3', fontSize: 12, lineHeight: 22 },
  aboutSection: { paddingVertical: 90, paddingHorizontal: 24, backgroundColor: '#0a0a0a' },
  aboutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 50, alignItems: 'center' },
  aboutImgWrap: { flex: 1, minWidth: 480, height: 400, overflow: 'hidden' },
  aboutImg: { width: '100%', height: '100%' },
  aboutImgZoomed: { transform: [{ scale: 1.03 }] },
  aboutContent: { flex: 1 },
  aboutLabel: { color: '#A07840', fontSize: 11, fontWeight: '600', letterSpacing: 4, marginBottom: 16 },
  aboutTitleText: { fontFamily: LUXURY_FONT, fontSize: 36, color: '#fff', lineHeight: 46, marginBottom: 22 },
  aboutTitleItalic: { fontStyle: 'italic', color: '#A07840' },
  aboutDescriptionText: { color: '#a3a3a3', fontSize: 14, lineHeight: 26, marginBottom: 20 },
  btnOutlineLight: { borderBottomWidth: 1, borderBottomColor: '#A07840', paddingVertical: 8, marginTop: 12 },
  finalCtaSection: { height: 400, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  ctaBgImage: { ...StyleSheet.absoluteFillObject },
  ctaDarkLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,6,0.82)' },
  ctaContentWrapper: { zIndex: 10, alignItems: 'center', paddingHorizontal: 24 },
  ctaSubLabel: { color: '#A07840', fontSize: 11, fontWeight: '600', letterSpacing: 5, marginBottom: 18 },
  ctaMainTitle: { fontFamily: LUXURY_FONT, fontSize: 42, color: '#fff', textAlign: 'center', marginBottom: 35 },
  ctaGoldButton: { borderWidth: 1, borderColor: '#A07840', paddingVertical: 18, paddingHorizontal: 36 },
  ctaGoldButtonHovered: { backgroundColor: '#A07840' },
  ctaGoldButtonText: { color: '#A07840', fontSize: 11, letterSpacing: 2 },
  ctaGoldButtonTextHover: { color: '#000000', fontWeight: '700' },

  // ══ 💎 ESTILOS EXCLUSIVOS DEL FOOTER 4 COLUMNAS PREMIUM ══
  footerContainer: { paddingVertical: 80, paddingHorizontal: 60, backgroundColor: '#0F0D0A', borderTopWidth: 1, borderColor: 'rgba(160,120,64,0.2)' },
  footerGrid: { justifyContent: 'space-between', gap: 40, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  footerColumnUnit: { gap: 14, marginBottom: 20 },
  footerLogoText: { fontFamily: LUXURY_FONT, fontSize: 24, fontWeight: '400', color: '#FDFBF8', letterSpacing: 8, textTransform: 'uppercase', marginBottom: 10 },
  footerBrandDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 22, fontWeight: '300', fontFamily: SANS_FONT },
  footerSocialContainer: { flexDirection: 'row', gap: 14, marginTop: 15 },
  
  socialIconSquare: { width: 36, height: 36, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  socialIconSquareHovered: { borderColor: '#A07840', backgroundColor: 'rgba(160,120,64,0.15)', transform: [{ scale: 1.15 }] },
  socialIconInnerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500', textTransform: 'uppercase' },
  socialIconInnerTextHovered: { color: '#A07840', fontWeight: '700' },
  
  footerColTitle: { fontFamily: SERIF_FONT, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, fontWeight: '400', textTransform: 'uppercase', marginBottom: 10 },
  footerLinkTouch: { paddingVertical: 2 },
  
  footerLinkItem: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '300', marginBottom: 4, fontFamily: SANS_FONT },
  footerLinkItemHovered: { color: '#A07840', transform: [{ scale: 1.05 }] },
  
  footerInfoItem: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 22, fontWeight: '300', fontFamily: SANS_FONT },
  footerBottomBar: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginTop: 40, paddingTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  footerCopyright: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: SANS_FONT },
  footerBottomRightLinks: { flexDirection: 'row', gap: 24 },
  footerCopyrightLink: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: SANS_FONT }
});