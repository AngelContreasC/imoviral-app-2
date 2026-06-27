import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';

const T = {
  gold: '#A07840',
  goldHover: '#C39B5F',
  bg: '#0A0A0A',
  bgAlt: '#111110',
  bgCard: '#161614',
  text: '#F5F5F0',
  textSub: '#8A8A84',
  border: 'rgba(255,255,255,0.08)',
  borderGold: 'rgba(160,120,64,0.2)',
  danger: '#C05050',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

function SidebarItem({ icon, label, isActive, onPress }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.sideItem,
        isActive && s.sideItemActive,
        hovered && !isActive && s.sideItemHover,
      ]}
    >
      <Feather name={icon} size={16} color={isActive ? T.gold : hovered ? T.text : T.textSub} style={{ marginRight: 12 }} />
      <Text style={[s.sideItemText, isActive && { color: T.gold }, hovered && !isActive && { color: T.text }]}>{label}</Text>
      <Feather name="chevron-right" size={14} color={isActive ? T.gold : T.textSub} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

export default function Perfil({ onVolver }) {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 900;
  const esES = i18n.language?.startsWith('es');

  const [activeSection, setActiveSection] = useState('datos');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    if (user) {
      setNombre(user.user_metadata?.full_name || '');
      setTelefono(user.user_metadata?.phone || '');
      setAvatarUri(user.user_metadata?.avatar_url || null);
    }
  }, [user]);

  const obtenerIniciales = () => {
    if (!user) return 'US';
    if (user.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUri;
      if (avatarUri && !avatarUri.startsWith('http') && !avatarUri.startsWith('data:')) {
        try {
          const resp = await fetch(avatarUri);
          const blob = await resp.blob();
          const ext = avatarUri.split('.').pop()?.split('?')[0] || 'jpg';
          const path = `avatars/${user.id}_${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('propiedades')
            .upload(path, blob, { cacheControl: '3600', upsert: true });
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('propiedades')
              .getPublicUrl(path);
            finalAvatarUrl = publicUrlData.publicUrl;
            setAvatarUri(finalAvatarUrl);
          } else {
            console.error("Avatar upload error:", uploadError);
          }
        } catch (uploadErr) {
          console.error("Error processing avatar upload:", uploadErr);
        }
      }

      if (user.isAdmin) {
        // Admin local - save to localStorage
        const updatedAdmin = {
          ...user,
          user_metadata: { ...user.user_metadata, full_name: nombre, phone: telefono, avatar_url: finalAvatarUrl },
        };
        if (Platform.OS === 'web') {
          localStorage.setItem('admin_user', JSON.stringify(updatedAdmin));
        }
        setFeedback(t('profile.save_success'));
      } else {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: nombre, phone: telefono, avatar_url: finalAvatarUrl },
        });
        if (error) throw error;
        setFeedback(t('profile.save_success'));
      }
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      setFeedback(t('profile.save_error'));
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      setFeedback(esES ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    if (newPwd.length < 6) {
      setFeedback(esES ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setFeedback(esES ? 'Contraseña actualizada correctamente.' : 'Password updated successfully.');
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      setFeedback(e.message || t('profile.save_error'));
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(t('profile.delete_confirm'))
      : true;
    if (!confirmed) return;
    try {
      await signOut();
      if (onVolver) onVolver();
    } catch (e) {
      console.error(e);
    }
  };

  const renderDatos = () => (
    <View style={s.sectionContent}>
      <Text style={s.sectionHeading}>{t('profile.section_personal')}</Text>
      <Text style={s.sectionDesc}>{t('profile.section_personal_desc')}</Text>

      {/* Avatar */}
      <View style={s.avatarSection}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={s.avatarLarge} />
        ) : (
          <View style={s.avatarLargePlaceholder}>
            <Text style={s.avatarLargeInitials}>{obtenerIniciales()}</Text>
          </View>
        )}
        <View style={s.avatarActions}>
          <Pressable style={s.avatarBtn} onPress={pickImage}>
            <Feather name="camera" size={14} color={T.gold} />
            <Text style={s.avatarBtnText}>{t('profile.photo_change')}</Text>
          </Pressable>
          {avatarUri && (
            <Pressable style={s.avatarBtn} onPress={() => setAvatarUri(null)}>
              <Feather name="x" size={14} color={T.danger} />
              <Text style={[s.avatarBtnText, { color: T.danger }]}>{t('profile.photo_remove')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_name')}</Text>
        <TextInput style={s.fieldInput} value={nombre} onChangeText={setNombre} placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_email')}</Text>
        <View style={[s.fieldInput, s.fieldReadonly]}>
          <Text style={s.fieldReadonlyText}>{user?.email || ''}</Text>
        </View>
      </View>

      <Text style={[s.sectionHeading, { marginTop: 40 }]}>{t('profile.section_contact')}</Text>
      <Text style={s.sectionDesc}>{t('profile.section_contact_desc')}</Text>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_phone')}</Text>
        <TextInput style={s.fieldInput} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_type')}</Text>
        <View style={[s.fieldInput, s.fieldReadonly]}>
          <Text style={s.fieldReadonlyText}>{user?.user_metadata?.client_type || (esES ? 'Comprador' : 'Buyer')}</Text>
        </View>
      </View>

      <Pressable style={s.saveBtn} onPress={handleSaveProfile} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={s.saveBtnText}>{t('profile.save_btn')}</Text>
        )}
      </Pressable>
    </View>
  );

  const renderPassword = () => (
    <View style={s.sectionContent}>
      <Text style={s.sectionHeading}>{esES ? 'Cambiar Contraseña' : 'Change Password'}</Text>
      <Text style={s.sectionDesc}>{esES ? 'Actualiza tu contraseña de acceso.' : 'Update your access password.'}</Text>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{esES ? 'Nueva contraseña' : 'New password'}</Text>
        <TextInput style={s.fieldInput} value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{esES ? 'Confirmar contraseña' : 'Confirm password'}</Text>
        <TextInput style={s.fieldInput} value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>

      <Pressable style={s.saveBtn} onPress={handleChangePassword} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={s.saveBtnText}>{esES ? 'ACTUALIZAR CONTRASEÑA' : 'UPDATE PASSWORD'}</Text>
        )}
      </Pressable>
    </View>
  );

  const renderDeleteAccount = () => (
    <View style={s.sectionContent}>
      <Text style={s.sectionHeading}>{t('profile.delete_account')}</Text>
      <Text style={s.sectionDesc}>{t('profile.delete_confirm')}</Text>
      <Pressable style={s.deleteBtn} onPress={handleDeleteAccount}>
        <Feather name="alert-triangle" size={14} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={s.deleteBtnText}>{t('profile.delete_btn')}</Text>
      </Pressable>
    </View>
  );

  const sidebarItems = [
    { id: 'datos', icon: 'user', label: esES ? 'Datos' : 'Data' },
    { id: 'password', icon: 'lock', label: esES ? 'Cambiar contraseña' : 'Change password' },
    { id: 'delete', icon: 'trash-2', label: esES ? 'Eliminar cuenta' : 'Delete account' },
  ];

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageContent}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>{t('profile.page_title')}</Text>
      </View>

      {feedback !== '' && (
        <View style={s.feedbackBar}>
          <Text style={s.feedbackText}>{feedback}</Text>
        </View>
      )}

      <View style={[s.mainLayout, { flexDirection: isWide ? 'row' : 'column' }]}>
        {/* Sidebar */}
        <View style={[s.sidebar, { width: isWide ? 280 : '100%', marginBottom: isWide ? 0 : 24 }]}>
          {sidebarItems.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeSection === item.id}
              onPress={() => setActiveSection(item.id)}
            />
          ))}
        </View>

        {/* Content */}
        <View style={[s.contentPanel, { flex: isWide ? 1 : undefined }]}>
          {activeSection === 'datos' && renderDatos()}
          {activeSection === 'password' && renderPassword()}
          {activeSection === 'delete' && renderDeleteAccount()}
        </View>
      </View>

      {onVolver && (
        <Pressable style={s.backBtn} onPress={onVolver}>
          <Text style={s.backBtnText}>{t('vd_back')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  pageContent: { paddingBottom: 60 },

  pageHeader: {
    paddingTop: 100,
    paddingBottom: 32,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.bgAlt,
  },
  pageTitle: { color: T.text, fontSize: 28, fontFamily: T.serif, fontWeight: '400' },

  feedbackBar: {
    backgroundColor: 'rgba(160,120,64,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 32,
    marginTop: 20,
  },
  feedbackText: { color: T.gold, fontSize: 13, fontFamily: T.sans, textAlign: 'center' },

  mainLayout: { padding: 32, maxWidth: 1000, alignSelf: 'center', width: '100%', gap: 32 },

  sidebar: {
    backgroundColor: T.bgAlt,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...Platform.select({ web: { cursor: 'pointer', transition: 'background-color 0.15s ease' }, default: {} }),
  },
  sideItemActive: { borderLeftColor: T.gold, backgroundColor: 'rgba(160,120,64,0.06)' },
  sideItemHover: { backgroundColor: 'rgba(255,255,255,0.03)' },
  sideItemText: { color: T.textSub, fontSize: 13, fontFamily: T.sans, fontWeight: '500' },

  contentPanel: {
    backgroundColor: T.bgAlt,
    borderWidth: 1,
    borderColor: T.border,
    padding: 36,
  },
  sectionContent: {},
  sectionHeading: { color: T.text, fontSize: 22, fontFamily: T.serif, marginBottom: 8 },
  sectionDesc: { color: T.textSub, fontSize: 12, fontFamily: T.sans, lineHeight: 18, marginBottom: 28 },

  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 32 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40 },
  avatarLargePlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.gold,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(160,120,64,0.4)',
  },
  avatarLargeInitials: { color: '#FFF', fontSize: 26, fontWeight: '600' },
  avatarActions: { gap: 10 },
  avatarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 16,
    borderWidth: 1, borderColor: T.border,
  },
  avatarBtnText: { color: T.gold, fontSize: 11, fontFamily: T.sans, letterSpacing: 1 },

  fieldGroup: { marginBottom: 20 },
  fieldLabel: { color: T.gold, fontSize: 10, fontFamily: T.sans, letterSpacing: 2, fontWeight: '500', marginBottom: 8 },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: T.borderGold,
    color: T.text,
    fontFamily: T.sans,
    fontSize: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  fieldReadonly: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: T.border },
  fieldReadonlyText: { color: T.textSub, fontSize: 14, fontFamily: T.sans },

  saveBtn: {
    backgroundColor: T.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 24,
    alignSelf: 'flex-start',
  },
  saveBtnText: { color: '#000', fontSize: 11, fontFamily: T.sans, fontWeight: '600', letterSpacing: 2 },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.danger,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  deleteBtnText: { color: '#FFF', fontSize: 11, fontFamily: T.sans, fontWeight: '600', letterSpacing: 2 },

  backBtn: {
    alignSelf: 'center',
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: T.textSub, fontSize: 10, letterSpacing: 2, fontFamily: T.sans, fontWeight: '500' },
});
