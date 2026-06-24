import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';
import { FontAwesome } from '@expo/vector-icons';

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

export default function UserMenu({ activeTab, setActiveTab, onPublicar, onEditarPropiedad, onVolver }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 1024;
  const esES = i18n.language.startsWith('es');

  const [loading, setLoading] = useState(true);
  const [propiedades, setPropiedades] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Cargar propiedades creadas por el usuario
  const cargarPropiedades = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('propiedades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPropiedades(data || []);
    } catch (err) {
      console.error('Error al cargar propiedades del usuario:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar propiedades favoritas (desde localStorage/persistencia local)
  const cargarFavoritos = async () => {
    if (!user) return;
    setLoadingFavs(true);
    try {
      let favIds = [];
      if (Platform.OS === 'web') {
        const saved = localStorage.getItem(`favoritos_${user.id}`);
        if (saved) {
          favIds = JSON.parse(saved);
        }
      }
      
      if (favIds.length > 0) {
        const { data, error } = await supabase
          .from('propiedades')
          .select('*')
          .in('id', favIds);
        
        if (error) throw error;
        setFavoritos(data || []);
      } else {
        setFavoritos([]);
      }
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    } finally {
      setLoadingFavs(false);
    }
  };

  useEffect(() => {
    cargarPropiedades();
    cargarFavoritos();
  }, [user]);

  // Borrar una propiedad
  const handleBorrar = async (propiedad) => {
    const eliminar = async () => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('propiedades')
          .delete()
          .eq('id', propiedad.id);

        if (error) throw error;
        
        // Recargar listas
        cargarPropiedades();
        // Quitar de favoritos si estaba
        removerFavoritoLocal(propiedad.id);
      } catch (err) {
        console.error('Error al eliminar propiedad:', err);
        if (Platform.OS === 'web') {
          alert(esES ? 'Error al eliminar la propiedad.' : 'Error deleting property.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmacion = window.confirm(
        esES 
          ? `¿Estás seguro de que deseas eliminar la publicación "${propiedad.titulo}"? Esta acción no se puede deshacer.`
          : `Are you sure you want to delete the listing "${propiedad.titulo}"? This action cannot be undone.`
      );
      if (confirmacion) {
        eliminar();
      }
    } else {
      Alert.alert(
        esES ? 'Confirmar eliminación' : 'Confirm deletion',
        esES 
          ? `¿Estás seguro de que deseas eliminar la publicación "${propiedad.titulo}"? Esta acción no se puede deshacer.`
          : `Are you sure you want to delete the listing "${propiedad.titulo}"? This action cannot be undone.`,
        [
          { text: esES ? 'Cancelar' : 'Cancel', style: 'cancel' },
          { text: esES ? 'Eliminar' : 'Delete', onPress: eliminar, style: 'destructive' }
        ]
      );
    }
  };

  // Quitar favorito de la lista local
  const removerFavoritoLocal = (id) => {
    if (!user) return;
    try {
      let favIds = [];
      if (Platform.OS === 'web') {
        const saved = localStorage.getItem(`favoritos_${user.id}`);
        if (saved) {
          favIds = JSON.parse(saved);
        }
        const updated = favIds.filter(favId => favId !== id);
        localStorage.setItem(`favoritos_${user.id}`, JSON.stringify(updated));
      }
      setFavoritos(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Renderizar pestañas superiores del panel
  const renderTabs = () => (
    <View style={S.tabBar}>
      {[
        { id: 'dashboard', label: esES ? 'Dashboard' : 'Dashboard', icon: 'bar-chart' },
        { id: 'publicaciones', label: esES ? 'Mis publicaciones' : 'My listings', icon: 'pencil-square-o' },
        { id: 'guardadas', label: esES ? 'Favoritos' : 'Saved', icon: 'heart-o' },
      ].map(tab => (
        <Pressable
          key={tab.id}
          onPress={() => setActiveTab(tab.id)}
          style={[S.tabButton, activeTab === tab.id && S.tabButtonActive]}
        >
          <FontAwesome 
            name={tab.icon} 
            size={14} 
            color={activeTab === tab.id ? '#000' : T.muted} 
            style={{ marginRight: 8 }}
          />
          <Text style={[S.tabButtonText, activeTab === tab.id && S.tabButtonTextActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // Renderizado Pestaña 1: Dashboard
  const renderDashboard = () => {
    const totalPublicaciones = propiedades.length;
    // Métrica simulada de visualizaciones y leads
    const visualizaciones = totalPublicaciones * 45 + 12;
    const leads = totalPublicaciones * 3 + 2;

    return (
      <View style={S.tabContent}>
        <View style={S.welcomeBox}>
          <Text style={S.welcomeTitle}>
            {esES ? 'Panel de Control' : 'Control Panel'}
          </Text>
          <Text style={S.welcomeSubtitle}>
            {esES 
              ? 'Gestiona tus propiedades publicadas, revisa tus estadísticas y actualiza tu portafolio exclusivo.'
              : 'Manage your listed properties, review your statistics and update your exclusive portfolio.'}
          </Text>
        </View>

        <View style={[S.statsGrid, { flexDirection: isWide ? 'row' : 'column' }]}>
          <View style={S.statCard}>
            <Text style={S.statVal}>{totalPublicaciones}</Text>
            <Text style={S.statLabel}>{esES ? 'Publicaciones Totales' : 'Total Listings'}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{visualizaciones}</Text>
            <Text style={S.statLabel}>{esES ? 'Visualizaciones estimadas' : 'Estimated Views'}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{leads}</Text>
            <Text style={S.statLabel}>{esES ? 'Prospectos / Leads' : 'Leads'}</Text>
          </View>
        </View>

        <View style={S.dashboardActions}>
          <Pressable style={S.btnGold} onPress={onPublicar}>
            <FontAwesome name="plus" size={12} color="#000" style={{ marginRight: 8 }} />
            <Text style={S.btnGoldText}>
              {esES ? 'PUBLICAR NUEVA PROPIEDAD' : 'PUBLISH NEW PROPERTY'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Renderizado Pestaña 2: Mis publicaciones
  const renderMisPublicaciones = () => {
    if (loading) {
      return (
        <View style={S.centerLoader}>
          <ActivityIndicator color={T.gold} size="large" />
        </View>
      );
    }

    if (propiedades.length === 0) {
      return (
        <View style={S.emptyBox}>
          <Text style={S.emptyText}>
            {esES ? 'No tienes ninguna propiedad publicada.' : 'You have no published properties.'}
          </Text>
          <Pressable style={[S.btnGold, { marginTop: 20 }]} onPress={onPublicar}>
            <Text style={S.btnGoldText}>{esES ? 'PUBLICAR AHORA' : 'PUBLISH NOW'}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={S.tabContent}>
        <Text style={S.sectionHeading}>
          {esES ? 'Tus Propiedades' : 'Your Properties'} ({propiedades.length})
        </Text>
        
        <View style={S.propertiesList}>
          {propiedades.map(p => (
            <View key={p.id} style={[S.propCard, { flexDirection: width > 640 ? 'row' : 'column' }]}>
              <Image 
                source={{ uri: p.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }} 
                style={S.propImage}
                resizeMode="cover"
              />
              <View style={S.propInfo}>
                <View style={S.propHeaderRow}>
                  <Text style={S.propTag}>{p.operacion?.toUpperCase()}</Text>
                  <Text style={S.propStatusTag}>{p.estatus || 'pendiente'}</Text>
                </View>
                <Text style={S.propTitle} numberOfLines={1}>{p.titulo}</Text>
                <Text style={S.propPrice}>${parseFloat(p.price || p.precio || 0).toLocaleString()} MXN</Text>
                <Text style={S.propLoc} numberOfLines={1}>📍 {p.ubicacion}</Text>
              </View>

              <View style={[S.propActions, { flexDirection: width > 640 ? 'column' : 'row' }]}>
                <Pressable style={S.actionBtnEdit} onPress={() => onEditarPropiedad(p)}>
                  <FontAwesome name="edit" size={14} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={S.actionBtnText}>{esES ? 'Editar' : 'Edit'}</Text>
                </Pressable>
                <Pressable style={S.actionBtnDelete} onPress={() => handleBorrar(p)}>
                  <FontAwesome name="trash" size={14} color="#ff7070" style={{ marginRight: 6 }} />
                  <Text style={[S.actionBtnText, { color: '#ff7070' }]}>{esES ? 'Eliminar' : 'Delete'}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Renderizado Pestaña 3: Guardadas / Favoritos
  const renderGuardadas = () => {
    if (loadingFavs) {
      return (
        <View style={S.centerLoader}>
          <ActivityIndicator color={T.gold} size="large" />
        </View>
      );
    }

    if (favoritos.length === 0) {
      return (
        <View style={S.emptyBox}>
          <Text style={S.emptyText}>
            {esES ? 'No tienes propiedades guardadas.' : 'You have no saved properties.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={S.tabContent}>
        <Text style={S.sectionHeading}>
          {esES ? 'Propiedades Guardadas' : 'Saved Properties'} ({favoritos.length})
        </Text>
        
        <View style={S.propertiesList}>
          {favoritos.map(p => (
            <View key={p.id} style={[S.propCard, { flexDirection: width > 640 ? 'row' : 'column' }]}>
              <Image 
                source={{ uri: p.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }} 
                style={S.propImage}
                resizeMode="cover"
              />
              <View style={S.propInfo}>
                <View style={S.propHeaderRow}>
                  <Text style={S.propTag}>{p.operacion?.toUpperCase()}</Text>
                </View>
                <Text style={S.propTitle} numberOfLines={1}>{p.titulo}</Text>
                <Text style={S.propPrice}>${parseFloat(p.price || p.precio || 0).toLocaleString()} MXN</Text>
                <Text style={S.propLoc} numberOfLines={1}>📍 {p.ubicacion}</Text>
              </View>

              <View style={[S.propActions, { flexDirection: width > 640 ? 'column' : 'row', justifyContent: 'center' }]}>
                <Pressable style={S.actionBtnDelete} onPress={() => removerFavoritoLocal(p.id)}>
                  <FontAwesome name="heart" size={14} color={T.gold} style={{ marginRight: 6 }} />
                  <Text style={[S.actionBtnText, { color: T.gold }]}>{esES ? 'Quitar' : 'Remove'}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={S.root} contentContainerStyle={S.container}>
      <View style={S.headerRow}>
        <Pressable onPress={onVolver} style={S.backBtn}>
          <FontAwesome name="chevron-left" size={10} color={T.gold} style={{ marginRight: 8 }} />
          <Text style={S.backBtnText}>{esES ? 'VOLVER AL INICIO' : 'BACK TO HOME'}</Text>
        </Pressable>
      </View>

      {renderTabs()}

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'publicaciones' && renderMisPublicaciones()}
      {activeTab === 'guardadas' && renderGuardadas()}
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { paddingHorizontal: 24, paddingVertical: 40, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  headerRow: { marginBottom: 32 },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backBtnText: { color: T.gold, fontSize: 10, letterSpacing: 2, fontFamily: T.sans, fontWeight: '700' },
  
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: T.border, marginBottom: 32, gap: 12, flexWrap: 'wrap' },
  tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderColor: 'transparent' },
  tabButtonActive: { borderColor: T.gold, backgroundColor: T.gold, borderBottomWidth: 0 },
  tabButtonText: { color: T.muted, fontFamily: T.sans, fontSize: 13, fontWeight: '500' },
  tabButtonTextActive: { color: '#000', fontWeight: '700' },

  tabContent: { marginTop: 8 },
  welcomeBox: { marginBottom: 32 },
  welcomeTitle: { fontFamily: T.serif, fontSize: 32, color: T.text, fontWeight: '300', marginBottom: 12 },
  welcomeSubtitle: { fontFamily: T.sans, fontSize: 14, color: T.muted, lineHeight: 22, fontWeight: '300' },

  statsGrid: { gap: 16, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: T.bgAlt, borderWidth: 1, borderColor: T.border, padding: 24, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontFamily: T.serif, fontSize: 40, color: T.gold, marginBottom: 8, fontWeight: '400' },
  statLabel: { fontFamily: T.sans, fontSize: 12, color: T.text, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  dashboardActions: { flexDirection: 'row', gap: 16 },
  btnGold: { height: 48, backgroundColor: T.gold, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnGoldText: { color: '#000', fontSize: 11, letterSpacing: 2, fontFamily: T.sans, fontWeight: '700' },

  centerLoader: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { backgroundColor: T.bgAlt, borderWidth: 1, borderColor: T.border, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: T.sans, fontSize: 14, color: T.muted, textAlign: 'center' },

  sectionHeading: { fontFamily: T.serif, fontSize: 24, color: T.text, fontWeight: '300', marginBottom: 24 },
  propertiesList: { gap: 16 },
  propCard: { backgroundColor: T.bgAlt, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  propImage: { width: 140, height: 110 },
  propInfo: { flex: 1, padding: 16, justifyContent: 'center' },
  propHeaderRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  propTag: { fontSize: 9, letterSpacing: 1.5, color: T.gold, fontWeight: '700', fontFamily: T.sans },
  propStatusTag: { fontSize: 9, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', fontFamily: T.sans, borderWidth: 1, borderColor: T.border, paddingHorizontal: 6, paddingVertical: 2 },
  propTitle: { fontFamily: T.serif, fontSize: 18, color: T.text, marginBottom: 4 },
  propPrice: { fontFamily: T.sans, fontSize: 13, color: T.text, fontWeight: '600', marginBottom: 4 },
  propLoc: { fontFamily: T.sans, fontSize: 12, color: T.muted },

  propActions: { padding: 16, justifyContent: 'center', gap: 10, borderLeftWidth: Platform.select({ web: 1, default: 0 }), borderColor: T.border },
  actionBtnEdit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F1E1B', borderWidth: 1, borderColor: T.border, height: 36, paddingHorizontal: 16 },
  actionBtnDelete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,112,112,0.05)', borderWidth: 1, borderColor: 'rgba(255,112,112,0.2)', height: 36, paddingHorizontal: 16 },
  actionBtnText: { fontFamily: T.sans, fontSize: 12, color: '#FFF', fontWeight: '500' }
});
