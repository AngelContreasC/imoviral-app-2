import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { FontAwesome, Feather } from '@expo/vector-icons';

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
import SobreNosotrosSection from './Componentes/SobreNosotrosSection.jsx';
import Vendedor from './Componentes/Vendedor.jsx';
import Footer from './Componentes/Footer';
import UserMenu from './Componentes/UserMenu';
import Dashboard from './Componentes/Dashboard.jsx';
import NuestroProceso from './Componentes/NuestroProceso.jsx';
import Testimonios from './Componentes/Testimonios.jsx';
import NuestrasSoluciones from './Componentes/NuestrasSoluciones.jsx';
import Resenas from './Componentes/Resenas.jsx';
import Chat from './Componentes/Chat.jsx';
import Perfil from './Componentes/Perfil.jsx';
import Configuracion from './Componentes/Configuracion.jsx';
import InteractiveMap from './Componentes/InteractiveMap';

import { useAuth, AuthProvider } from './AuthContext.js';
import { supabase } from './supabaseClient';

const LUXURY_FONT = 'Cormorant Garamond, Georgia, serif';
const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'android' ? 'serif' : 'Georgia, serif';
const SANS_FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

const MOCK_PROPERTIES = [];

const TICKER_PHRASES = [
  'LUXURY RESIDENCES',
  'PREMIUM REAL ESTATE INVESTMENTS',
  'EXCLUSIVE LISTINGS',
  'SEAMLESS TRANSACTIONS',
  'EXCLUSIVE MARKET ACCESS',
  'CONFIDENTIAL NEGOTIATIONS',
];

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24);
const safeTopPadding = Platform.OS === 'web' ? 0 : STATUS_BAR_HEIGHT;

const formatPrecioHome = (num) => {
  if (num === null || num === undefined) return '0';
  const val = Number(num);
  if (isNaN(val)) return '0';
  if (val >= 1e12) {
    return val.toExponential(2);
  }
  return val.toLocaleString('es-MX', { maximumFractionDigits: 0 });
};

/* ─────────────────────────────────────────────
   COMPONENTE DE APLICACIÓN PRINCIPAL
───────────────────────────────────────────── */
function MainApp() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();

  const esPantallaGrande = width > 768;
  const idiomaActual = i18n.language || 'es';

  const [vista, setVista] = useState('home');
  const [dashboardTab, setDashboardTab] = useState('dashboard');
  const [propiedadParaEditar, setPropiedadParaEditar] = useState(null);
  const [mobileNavAbierto, setMobileNavAbierto] = useState(false);
  const [userMenuAbierto, setUserMenuAbierto] = useState(false);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [propiedades, setPropiedades] = useState([]);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const propiedadesPorPagina = 6;
  const totalPaginas = Math.ceil(propiedades.length / propiedadesPorPagina);

  const listaPropiedadesPaginada = useMemo(() => {
    if (!propiedades || propiedades.length === 0) return [];
    const pageIndex = paginaActual > totalPaginas ? 1 : paginaActual;
    return propiedades.slice((pageIndex - 1) * propiedadesPorPagina, pageIndex * propiedadesPorPagina);
  }, [propiedades, paginaActual, totalPaginas]);

  const propiedadesMapa = useMemo(() => {
    return propiedades;
  }, [propiedades]);

  // Contadores Animados (Count-Up)
  const [countYears, setCountYears] = useState(0);
  const [countProps, setCountProps] = useState(0);

  // Referencia animada de scroll continuo y sus interpolaciones premium
  const scrollY = useRef(new Animated.Value(0)).current;
  const [hoveredLogin, setHoveredLogin] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [hoveredHeroBtn, setHoveredHeroBtn] = useState(false);
  const [hoveredFeatureIdx, setHoveredFeatureIdx] = useState(null);
  const [hoveredCtaBtn, setHoveredCtaBtn] = useState(false);
  const [hoveredPublishNav, setHoveredPublishNav] = useState(false);

  const tickerValue = useRef(new Animated.Value(0)).current;

  // Interpolación de fondo y bordes para el Navbar premium
  const navBgColor = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(6, 6, 6, 0)', '#0C0C0C'],
    extrapolate: 'clamp',
  });

  const navBorderColor = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(160, 120, 64, 0)', 'rgba(160, 120, 64, 0.15)'],
    extrapolate: 'clamp',
  });

  const navPaddingTop = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [20 + safeTopPadding, 14 + safeTopPadding],
    extrapolate: 'clamp',
  });

  const navPaddingBottom = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [20, 14],
    extrapolate: 'clamp',
  });

  const animatedNavBarStyle = esPantallaGrande ? {
    backgroundColor: (vista === 'home' || vista === 'propiedad') ? navBgColor : '#0C0C0C',
    borderBottomColor: (vista === 'home' || vista === 'propiedad') ? navBorderColor : 'rgba(160, 120, 64, 0.15)',
    paddingTop: (vista === 'home' || vista === 'propiedad') ? navPaddingTop : 14 + safeTopPadding,
    paddingBottom: (vista === 'home' || vista === 'propiedad') ? navPaddingBottom : 14,
  } : {
    position: 'relative',
    top: undefined,
    left: undefined,
    right: undefined,
    width: '100%',
    backgroundColor: '#0C0C0C',
    borderBottomColor: 'rgba(160, 120, 64, 0.15)',
    paddingTop: 8,
    paddingBottom: 8,
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const obtenerIniciales = () => {
    if (!user) return 'GR';
    if (user.user_metadata?.full_name) {
      const partes = user.user_metadata.full_name.split(' ');
      if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
      return partes[0][0].toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };

  const cambiarIdioma = (idioma) => i18n.changeLanguage(idioma);
  const irAPropiedad = (id) => { setPropiedadSeleccionada(id); setVista('propiedad'); setMobileNavAbierto(false); };
  const navegacionMovil = (destino) => { setVista(destino); setMobileNavAbierto(false); };
  const volverDePropiedad = (destino) => { setPropiedadSeleccionada(null); setVista(destino || 'home'); };

  useEffect(() => {
    if (vista !== 'home') return;
    let startYears = 0, startProps = 0;
    const timer = setInterval(() => {
      startYears += 12 / 40; startProps += 150 / 40;
      if (startYears >= 12) { setCountYears(12); setCountProps(150); clearInterval(timer); }
      else { setCountYears(Math.floor(startYears)); setCountProps(Math.floor(startProps)); }
    }, 40);
    return () => clearInterval(timer);
  }, [vista]);

  useEffect(() => {
    const cargarCasas = async () => {
      const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
      if (!error && data) setPropiedades(data);
    };
    cargarCasas();
  }, [vista]);

  useEffect(() => {
    if (user && vista === 'login') {
      setVista('home');
    }
  }, [user, vista]);

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
    <Animated.View style={[styles.navBar, animatedNavBarStyle, !esPantallaGrande && { paddingHorizontal: 12 }]}>
      <TouchableOpacity onPress={() => setVista('home')}>
        <Text style={[styles.logoText, !esPantallaGrande && { fontSize: 16, letterSpacing: 3 }]}>INMOVIRAL</Text>
      </TouchableOpacity>

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

      <View style={[styles.navActions, !esPantallaGrande && { gap: 8 }]}>
        {user ? (
          <View style={[styles.navAuthenticatedRow, !esPantallaGrande && { gap: 8 }]}>
            <TouchableOpacity
              style={[
                styles.navPublishBtn,
                hoveredPublishNav && styles.navPublishBtnHover,
                vista === 'vendedor' && styles.navPublishBtnActive,
                !esPantallaGrande && { paddingHorizontal: 8, marginRight: 0 }
              ]}
              disabled={vista === 'vendedor'}
              onPress={() => setVista('vendedor')}
              onMouseEnter={() => Platform.OS === 'web' && vista !== 'vendedor' && setHoveredPublishNav(true)}
              onMouseLeave={() => Platform.OS === 'web' && setHoveredPublishNav(false)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather
                  name="plus"
                  size={12}
                  color={vista === 'vendedor' ? '#525252' : hoveredPublishNav ? '#C39B5F' : '#A07840'}
                />
                {esPantallaGrande && (
                  <Text style={[
                    styles.navPublishBtnText,
                    hoveredPublishNav && styles.navPublishBtnTextHover,
                    vista === 'vendedor' && styles.navPublishBtnTextActive,
                    { marginLeft: 5 }
                  ]}>
                    {idiomaActual.startsWith('es') ? 'PUBLICAR' : 'PUBLISH'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navAvatarCircle} onPress={() => setUserMenuAbierto(true)}>
              {user?.user_metadata?.avatar_url ? (
                <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.navAvatarImage} />
              ) : (
                <Text style={styles.navAvatarText}>{obtenerIniciales()}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.hamMenuButtonAuthenticated} onPress={() => esPantallaGrande ? setUserMenuAbierto(true) : setMobileNavAbierto(true)}>
              <Text style={styles.hamMenuButtonIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        ) : (
          esPantallaGrande ? (
            <TouchableOpacity style={[styles.btnCta, hoveredLogin && styles.btnCtaHover]} onPress={() => setVista('login')} onMouseEnter={() => setHoveredLogin(true)} onMouseLeave={() => setHoveredLogin(false)}>
              <Text style={[styles.btnCtaText, hoveredLogin && styles.btnCtaHoverText]}>{t('navbar.login')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={styles.btnCtaMobile} onPress={() => setVista('login')}>
                <Text style={styles.btnCtaMobileText}>{t('navbar.login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hamMenuButton} onPress={() => setMobileNavAbierto(true)}>
                <Text style={styles.hamMenuButtonIcon}>☰</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        <View style={styles.langContainer}>
          <TouchableOpacity onPress={() => cambiarIdioma('es')} style={[styles.langBtn, idiomaActual.startsWith('es') && styles.langBtnActive]}><Text style={styles.langText}>ES</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => cambiarIdioma('en')} style={[styles.langBtn, idiomaActual.startsWith('en') && styles.langBtnActive]}><Text style={styles.langText}>EN</Text></TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderLuxuryMobileMenu = () => {
    if (!mobileNavAbierto || esPantallaGrande) return null;
    return (
      <View style={styles.luxuryOverlayMenu}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.luxuryMenuHeader}>
            <Text style={styles.logoText}>INMOVIRAL</Text>

            <View style={[styles.langContainer, { marginRight: 12 }]}>
              <TouchableOpacity onPress={() => cambiarIdioma('es')} style={[styles.langBtn, idiomaActual.startsWith('es') && styles.langBtnActive]}><Text style={styles.langText}>ES</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => cambiarIdioma('en')} style={[styles.langBtn, idiomaActual.startsWith('en') && styles.langBtnActive]}><Text style={styles.langText}>EN</Text></TouchableOpacity>
            </View>

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

  if (vista === 'login') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <ScrollView contentContainerStyle={{ paddingTop: 0 }} keyboardShouldPersistTaps="handled">
        <LoginPage onVolver={() => setVista('home')} />
        <Footer onNavigate={setVista} />
      </ScrollView>
    </SafeAreaView>
  );
  if (vista === 'venta') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<PropiedadesVenta onVerPropiedad={irAPropiedad} /></SafeAreaView>;
  if (vista === 'renta') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<PropiedadesRenta onVerPropiedad={irAPropiedad} /></SafeAreaView>;
  if (vista === 'propiedad') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<VerPropiedad propiedadId={propiedadSeleccionada} onVolver={volverDePropiedad} onStartChat={(roomId) => { setChatRoomId(roomId); setVista('chat'); }} onEditarPropiedad={(prop) => { setPropiedadParaEditar(prop); setVista('vendedor'); }} /></SafeAreaView>;
  if (vista === 'servicios') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<ServiciosVirales onIrLogin={() => setVista('login')} onVolver={() => setVista('home')} /></SafeAreaView>;
  if (vista === 'vendedor') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<Vendedor propiedadParaEditar={propiedadParaEditar} onVolver={() => { setPropiedadParaEditar(null); if (user) { setVista('dashboard'); setDashboardTab('publicaciones'); } else { setVista('home'); } }} onVerPropiedadPublicada={(id) => irAPropiedad(id)} /></SafeAreaView>;
  if (vista === 'nosotros') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<SobreNosotros onIrServicios={() => setVista('servicios')} onIrPropiedades={() => setVista('venta')} /></SafeAreaView>;

  if (vista === 'resenas') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Resenas onVolver={() => setVista('home')} />
    </SafeAreaView>
  );

  if (vista === 'chat') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Chat initialRoomId={chatRoomId} onVolver={() => { setChatRoomId(null); setVista('home'); }} />
    </SafeAreaView>
  );

  if (vista === 'perfil') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Perfil onVolver={() => setVista('home')} />
    </SafeAreaView>
  );

  if (vista === 'configuracion') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Configuracion onVolver={() => setVista('home')} />
    </SafeAreaView>
  );

  if (vista === 'dashboard') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        {renderNavbar()}
        <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
        {renderLuxuryMobileMenu()}
        <Dashboard
          activeTab={dashboardTab}
          setActiveTab={setDashboardTab}
          onPublicar={() => {
            setPropiedadParaEditar(null);
            setVista('vendedor');
          }}
          onEditarPropiedad={(propiedad) => {
            setPropiedadParaEditar(propiedad);
            setVista('vendedor');
          }}
          onVolver={() => setVista('home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        {/* ══ 1. HERO ══ */}
        <View style={[styles.heroSection, width <= 768 && { height: undefined, minHeight: 650, paddingVertical: 100 }]}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=85" }} style={styles.heroBg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBody}>
            <Text style={styles.heroTag}>{t('hero.tag')}</Text>
            <Text style={[styles.heroTitle, { fontSize: width > 768 ? 56 : 28, lineHeight: width > 768 ? 72 : 42 }]}>
              {t('hero.title_part1')}{'\n'}
              <Text style={styles.heroTitleItalic}>{t('hero.title_italic')}</Text> {'\n'}
              {t('hero.title_part2')}
            </Text>
            <Text style={styles.heroDesc}>{t('hero.description')}</Text>
            <View style={[
              styles.heroActionsRow,
              !esPantallaGrande && {
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 12,
                width: '100%'
              }
            ]}>
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  hoveredHeroBtn && styles.btnPrimaryHovered,
                  !esPantallaGrande && { width: '100%', alignItems: 'center', paddingVertical: 14 }
                ]}
                onPress={() => setVista('venta')}
                onMouseEnter={() => setHoveredHeroBtn(true)}
                onMouseLeave={() => setHoveredHeroBtn(false)}
              >
                <Text style={[styles.btnTextBlack, { textAlign: 'center' }]}>{t('hero.cta_portfolio')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnGhost,
                  !esPantallaGrande && { width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14 }
                ]}
                onPress={() => setVista('servicios')}
              >
                <Text style={[styles.btnTextWhite, { textAlign: 'center' }]}>{t('hero.cta_clients')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[
            styles.heroCounterBar,
            width <= 768 && {
              position: 'relative',
              bottom: undefined,
              left: undefined,
              right: undefined,
              marginTop: 40,
              flexDirection: 'row',
              justifyContent: 'space-around',
              gap: 16
            }
          ]}>
            <View style={styles.hcItem}><Text style={styles.hcNum}>0{countYears}</Text><Text style={styles.hcLabel}>{t('hero.counter_years')}</Text></View>
            <View style={styles.hcItem}><Text style={styles.hcNum}>{countProps}+</Text><Text style={styles.hcLabel}>{t('hero.counter_sold')}</Text></View>
            <View style={styles.hcItem}><Text style={styles.hcNum}>5</Text><Text style={styles.hcLabel}>{t('hero.counter_satisfied')}</Text></View>
          </View>
        </View>

        {/* ══ 2. TICKER MARQUEE ══ */}
        <View style={styles.tickerBar}>
          <Animated.View style={[styles.tickerInnerLoop, { transform: [{ translateX: tickerValue }] }]}>
            {[...TICKER_PHRASES, ...TICKER_PHRASES, ...TICKER_PHRASES].map((phrase, idx) => (
              <View key={idx} style={styles.tickerItem}>
                <Text style={styles.tickerText}>{phrase}</Text>
                <Text style={styles.tickerSeparator}>✦</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* ══ 3. FEATURES SECTOR ══ */}
        <View className="reveal-section" style={styles.featuresSection}>
          <View style={styles.featuresGrid}>
            {[
              { id: 1, json_base: 'features.residential', svg: <path d="M3 21h4v-4H3v4zm0-6h4v-4H3v4zm6 6h4v-6H9v6zm0-10h4V7H9v4zm6 10h4V11h-4v10zm0-12h4V3h-4v6z" /> },
              { id: 2, json_base: 'features.premium', svg: <><rect x="2" y="6" width="20" height="14" rx="1" /><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="9.5" y1="13.5" x2="14.5" y2="13.5" /></> },
              { id: 3, json_base: 'features.investment', svg: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /> },
              { id: 4, json_base: 'features.advisory', svg: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /> }
            ].map((feat, idx) => (
              <View key={feat.id} style={[styles.featureItem, { width: width > 1024 ? '23%' : width > 640 ? '47%' : '100%' }, hoveredFeatureIdx === idx && styles.featureItemHovered]} onMouseEnter={() => setHoveredFeatureIdx(idx)} onMouseLeave={() => setHoveredFeatureIdx(null)}>
                <Text style={styles.featureNum}>0{feat.id}</Text>
                <View style={styles.featureIconWrap}>
                  {Platform.OS === 'web' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#A07840" strokeWidth="1.2" strokeLinecap="round" style={{ width: 24, height: 24 }}>{feat.svg}</svg>
                  ) : (<View style={{ width: 24, height: 24, backgroundColor: 'rgba(160,120,64,0.1)' }} />)}
                </View>
                <Text style={styles.featureTitle}>{t(`${feat.json_base}.t1`)} {t(`${feat.json_base}.t2`)}</Text>
                <Text style={styles.featureText}>{t(`${feat.json_base}.d`)}</Text>
                <View style={[styles.cardGoldIndicator, hoveredFeatureIdx === idx && styles.cardGoldIndicatorActive]} />
              </View>
            ))}
          </View>
        </View>

        {/* ══ 4. NUESTRAS SOLUCIONES ══ */}
        <View className="reveal-section">
          <NuestrasSoluciones onNavigate={(destino) => setVista(destino)} />
        </View>

        {/* ══ 5. PROPIEDADES DESTACADAS ══ */}
        <View className="reveal-section" style={styles.featuredPropsSection}>
          <Text style={styles.featuredPropsLabel}>{idiomaActual.startsWith('es') ? 'COLECCIÓN EXCLUSIVA' : 'EXCLUSIVE COLLECTION'}</Text>
          <Text style={styles.featuredPropsTitle}>{idiomaActual.startsWith('es') ? 'Propiedades Destacadas' : 'Featured Properties'}</Text>

          <View style={styles.propsGrid}>
            {listaPropiedadesPaginada.map((prop) => {
              const isHovered = hoveredPropertyId === prop.id;
              return (
                <TouchableOpacity
                  key={prop.id}
                  style={[styles.propCardItem, { width: width > 1024 ? '31%' : width > 640 ? '47%' : '100%' }]}
                  onPress={() => irAPropiedad(prop.id)}
                  onMouseEnter={() => Platform.OS === 'web' && setHoveredPropertyId(prop.id)}
                  onMouseLeave={() => Platform.OS === 'web' && setHoveredPropertyId(null)}
                  activeOpacity={0.9}
                >
                  <View style={styles.propCardImageWrap}>
                    <Image
                      source={{ uri: prop.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600' }}
                      style={[
                        styles.propCardImage,
                        isHovered && styles.propCardImageZoomed
                      ]}
                      resizeMode="cover"
                    />
                    <View style={styles.propOperationTag}>
                      <Text style={styles.propOperationText}>
                        {prop.operacion?.toUpperCase() === 'RENTA' ? (idiomaActual.startsWith('es') ? 'RENTA' : 'RENT') : (idiomaActual.startsWith('es') ? 'VENTA' : 'SALE')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.propCardInfo}>
                    <Text style={styles.propCardTitle} numberOfLines={1}>
                      {prop.titulo}
                    </Text>
                    <Text style={styles.propCardPrice}>
                      ${formatPrecioHome(prop.price || prop.precio)} MXN
                    </Text>
                    <Text style={styles.propCardLocation} numberOfLines={1}>
                      📍 {prop.ubicacion}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Flechitas de Navegación de Páginas */}
          {totalPaginas > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity 
                disabled={paginaActual === 1} 
                onPress={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                style={[styles.pageArrowBtn, paginaActual === 1 && styles.pageArrowBtnDisabled]}
              >
                <Feather name="arrow-left" size={16} color={paginaActual === 1 ? 'rgba(255,255,255,0.15)' : '#A07840'} />
              </TouchableOpacity>
              
              <Text style={styles.pageIndicatorText}>
                {paginaActual} / {totalPaginas}
              </Text>

              <TouchableOpacity 
                disabled={paginaActual === totalPaginas} 
                onPress={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                style={[styles.pageArrowBtn, paginaActual === totalPaginas && styles.pageArrowBtnDisabled]}
              >
                <Feather name="arrow-right" size={16} color={paginaActual === totalPaginas ? 'rgba(255,255,255,0.15)' : '#A07840'} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ══ 5b. MAPA INTERACTIVO DE PROPIEDADES ══ */}
        <View className="reveal-section" style={styles.mapSection}>
          <Text style={styles.featuredPropsLabel}>{idiomaActual.startsWith('es') ? 'UBICACIONES EXCLUSIVAS' : 'EXCLUSIVE LOCATIONS'}</Text>
          <Text style={styles.featuredPropsTitle}>{idiomaActual.startsWith('es') ? 'Explora en el Mapa' : 'Explore on the Map'}</Text>
          <View style={styles.mapContainer}>
            <InteractiveMap 
              propiedades={propiedadesMapa} 
              onSelectProperty={irAPropiedad} 
              user={user}
              onRequireLogin={() => setVista('login')}
              onDeleteProperty={(id) => setPropiedades(prev => prev.filter(p => p.id !== id))}
            />
          </View>
        </View>

        {/* ══ NUESTRO PROCESO ══ */}
        <View className="reveal-section">
          <NuestroProceso />
        </View>

        {/* ══ 6. SOBRE NOSOTROS ══ */}
        <View className="reveal-section">
          <SobreNosotrosSection onNavigate={(destino) => setVista(destino)} />
        </View>

        {/* ══ TESTIMONIOS ══ */}
        <View className="reveal-section">
          <Testimonios onNavigate={(destino) => setVista(destino)} />
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

        {/* FOOTER */}
        <Footer onNavigate={setVista} />

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

export default function App() { return <AuthProvider><MainApp /></AuthProvider>; }

/* ─────────────────────────────────────────────
   💎 ESTILOS COMPLEMENTARIOS SANEADOS CONTRA CRASHES NATÍVOS
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060606' },
  scrollContainer: { paddingBottom: 0 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    ...Platform.select({
      web: { position: 'fixed' },
      default: { position: 'absolute' }
    }),
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1,
  },
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
  btnCtaMobile: {
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 1,
  },
  btnCtaMobileText: {
    color: '#A07840',
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 1.5,
    fontFamily: SANS_FONT,
  },
  langContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 1, alignItems: 'center' },
  langBtn: { paddingVertical: 5, paddingHorizontal: 10 },
  langBtnActive: { backgroundColor: '#A07840' },
  langText: { color: '#fff', fontSize: 9, fontWeight: '600' },

  navAuthenticatedRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  navPublishBtn: {
    borderWidth: 1,
    borderColor: '#A07840',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 2,
    marginRight: 4,
    backgroundColor: 'transparent',
  },
  navPublishBtnHover: {
    backgroundColor: 'rgba(160, 120, 64, 0.1)',
    borderColor: '#C39B5F',
  },
  navPublishBtnActive: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navPublishBtnText: {
    color: '#A07840',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: SANS_FONT
  },
  navPublishBtnTextHover: {
    color: '#C39B5F',
  },
  navPublishBtnTextActive: {
    color: '#525252',
  },

  navAvatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A07840', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent', overflow: 'hidden' },
  navAvatarImage: { width: '100%', height: '100%', borderRadius: 17 },
  navAvatarText: { color: '#F2EDE5', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  hamMenuButtonAuthenticated: { padding: 4 },
  hamMenuButton: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)' },
  hamMenuButtonIcon: { color: '#A07840', fontSize: 16 },

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
  tickerInnerLoop: { flexDirection: 'row', width: 5000 },
  tickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 48 },
  tickerText: { fontFamily: SANS_FONT, color: '#ffffff', fontSize: 11, fontWeight: '400', letterSpacing: 2.5, textTransform: 'uppercase' },
  tickerSeparator: { fontSize: 8, color: '#ffffff', opacity: 0.6, marginLeft: 48 },
  featuresSection: { paddingVertical: 100, paddingHorizontal: 24, backgroundColor: '#ffffff' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 30, justifyContent: 'center' },
  featureItem: { minWidth: 260, padding: 35, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  featureItemHovered: { backgroundColor: '#efede7' },
  featureNum: { fontSize: 12, color: '#A07840', fontWeight: '600', marginBottom: 25 },
  featureIconWrap: { marginBottom: 20 },
  featureTitle: { fontFamily: SERIF_FONT, fontSize: 24, color: '#0a0a0a', marginBottom: 18 },
  featureText: { color: '#525252', fontSize: 13, lineHeight: 22 },
  cardGoldIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 0, backgroundColor: '#A07840' },
  cardGoldIndicatorActive: { height: 3 },
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

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 40,
  },
  pageArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#A07840',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pageArrowBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  pageIndicatorText: {
    color: '#FFFFFF',
    fontFamily: SANS_FONT,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  featuredPropsSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#060606',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapContainer: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    marginTop: 20,
  },
  featuredPropsLabel: {
    color: '#A07840',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 5,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuredPropsTitle: {
    fontFamily: LUXURY_FONT,
    fontSize: 34,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 65,
  },
  propsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    justifyContent: 'center',
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  propCardItem: {
    minWidth: 280,
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  propCardImageWrap: {
    height: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  propCardImage: {
    width: '100%',
    height: '100%',
  },
  propCardImageZoomed: {
    transform: [{ scale: 1.06 }],
  },
  propOperationTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(10, 10, 10, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.3)',
  },
  propOperationText: {
    color: '#A07840',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: SANS_FONT,
  },
  propCardInfo: {
    padding: 20,
  },
  propCardTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
  },
  propCardPrice: {
    color: '#A07840',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: SANS_FONT,
    marginBottom: 8,
  },
  propCardLocation: {
    color: '#8A8A84',
    fontSize: 12,
    fontFamily: SANS_FONT,
  },

  // ══ 📱 ESTILOS EXCLUSIVOS DEL MENÚ HAMBURGUESA LUXURY ══
  luxuryOverlayMenu: {
    position: 'absolute',
    ...Platform.select({
      web: { position: 'fixed' },
      default: { position: 'absolute' }
    }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0C0C0C',
    zIndex: 10000,
    padding: 24,
  },
  luxuryMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 40,
  },
  closeMenuBtn: {
    padding: 8,
  },
  closeMenuBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
  },
  luxuryMenuLinksContainer: {
    gap: 32,
    marginTop: 20,
  },
  luxuryMenuLinkWrap: {
    paddingVertical: 12,
  },
  luxuryMenuFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  luxuryMenuIndex: {
    fontFamily: SANS_FONT,
    fontSize: 10,
    color: '#A07840',
    fontWeight: '500',
  },
  luxuryMenuLinkText: {
    fontFamily: LUXURY_FONT,
    fontSize: 28,
    color: '#a3a3a3',
    fontWeight: '300',
  },
  luxuryActiveLink: {
    color: '#fff',
  },
});