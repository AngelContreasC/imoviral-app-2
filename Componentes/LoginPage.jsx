import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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

/* ─────────────────────────────────────────────
   TOKENS  (Espejo exacto del diseño premium)
───────────────────────────────────────────── */
const T = {
  bg:           '#0A0A0A',
  bgInput:      '#121212',
  gold:         '#A07840',
  goldHover:    '#C39B5F',
  text:         '#F5F5F0',
  textMuted:    '#A3A3A3',
  borderSubtle: 'rgba(255,255,255,0.10)',
  borderMid:    'rgba(255,255,255,0.20)',
  errorBg:      'rgba(220,50,50,0.12)',
  errorBorder:  'rgba(220,50,50,0.3)',
  errorText:    '#ff7070',
  successBg:    'rgba(160,120,64,0.15)',
  successText:  '#C49A58',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

/* ─────────────────────────────────────────────
   HOOK: Estado de hover compatible web/native
───────────────────────────────────────────── */
function useHover() {
  const [hovered, setHovered] = useState(false);
  const handlers = Platform.select({
    web: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    default: {},
  });
  return [hovered, handlers];
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function LoginPage({ onVolver }) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width > 1024;

  // ── Estados comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState('login'); // 'login' | 'register'

  // ── Estados de registro
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [clientType, setClientType] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // ── Hover states para web
  const [hoverPrimary, hoverPrimaryHandlers] = useHover();
  const [hoverGoogle, hoverGoogleHandlers] = useHover();
  const [hoverForgot, hoverForgotHandlers] = useHover();

  const esES = i18n.language.startsWith('es');
  const cambiarIdioma = (lang) => i18n.changeLanguage(lang);

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
    setSuccess('');
  };

  // ── Lógica Supabase
  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (modo === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        setSuccess(t('login_success_msg', { defaultValue: '¡Sesión iniciada correctamente!' }));
        setTimeout(() => onVolver(), 1200);
      } else {
        if (!acceptTerms) {
          throw new Error(
            esES
              ? 'Debes aceptar los términos y condiciones.'
              : 'You must accept the terms and conditions.'
          );
        }
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone, client_type: clientType },
          },
        });
        if (err) throw err;
        setSuccess(t('register_success_msg', { defaultValue: '¡Cuenta creada! Revisa tu correo para confirmar.' }));
        setFullName(''); setPhone(''); setEmail('');
        setPassword(''); setClientType(''); setAcceptTerms(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const backgroundImage =
    modo === 'login'
      ? 'https://images.pexels.com/photos/773842/pexels-photo-773842.jpeg'
      : 'https://images.unsplash.com/photo-1613621792067-8e28d16b735c?crop=entropy&cs=srgb&fm=jpg&q=85';

  // ────────────────────────────────────────────
  //  FUNCIONES DE RENDER (Evitan la pérdida de foco)
  // ────────────────────────────────────────────
  const renderImagePanel = () => (
    <View style={S.imagePanel}>
      <Image source={{ uri: backgroundImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      {/* Capa 1 — oscurece base */}
      <View style={S.overlayBase} />

      {/* Capa 2 — fade horizontal hacia la derecha */}
      <View style={S.overlayHorizontal} />

      {/* Capa 3 — viñeta vertical top/bottom */}
      <View style={S.overlayVertical} />

      <Pressable onPress={onVolver} style={S.brand}>
        <Text style={S.brandText}>INMOVIRAL</Text>
      </Pressable>

      <View style={S.imageCaption}>
        <Text style={S.captionLabel}>
          {modo === 'login'
            ? t('login_caption_lbl',    { defaultValue: 'Premium Real Estate' })
            : t('register_caption_lbl', { defaultValue: 'Únete a la colección' })}
        </Text>
        <Text style={S.captionQuote}>
          {modo === 'login'
            ? t('login_caption',    { defaultValue: 'Una colección curada de propiedades excepcionales para quienes valoran la exclusividad.' })
            : t('register_caption', { defaultValue: 'Cada propiedad es una solución a medida, diseñada en torno a la visión del cliente.' })}
        </Text>
      </View>
    </View>
  );

  const renderFormPanel = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[S.formScroll, isWide && S.formScrollWide]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Switcher de idioma ── */}
        <View style={S.langSwitcher}>
          {['es', 'en'].map((lang) => (
            <Pressable
              key={lang}
              onPress={() => cambiarIdioma(lang)}
              style={[S.langBtn, i18n.language.startsWith(lang) && S.langBtnActive]}
            >
              <Text style={[S.langBtnText, i18n.language.startsWith(lang) && S.langBtnTextActive]}>
                {lang.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Encabezado ── */}
        <Text style={S.overline}>
          {modo === 'login'
            ? t('login_welcome',    { defaultValue: 'Bienvenido de nuevo' })
            : t('register_overline',{ defaultValue: 'Acceso Privado' })}
        </Text>
        <Text style={S.title}>
          {modo === 'login'
            ? t('login_title',     { defaultValue: 'Inicia sesión' })
            : t('login_title_reg', { defaultValue: 'Crear cuenta' })}
        </Text>
        <Text style={S.subtitle}>
          {modo === 'login'
            ? t('login_subtitle',    { defaultValue: 'Propiedades excepcionales para clientes exigentes.' })
            : t('register_subtitle', { defaultValue: 'Accede a las propiedades más exclusivas del mercado.' })}
        </Text>

        {/* ── Alertas ── */}
        {!!error   && <View style={[S.alert, S.alertError  ]}><Text style={S.alertTextError  }>{error  }</Text></View>}
        {!!success && <View style={[S.alert, S.alertSuccess]}><Text style={S.alertTextSuccess}>{success}</Text></View>}

        {/* ── Campos exclusivos de Registro ── */}
        {modo === 'register' && (
          <>
            <Field label={t('register_name_lbl', { defaultValue: 'Nombre Completo' })}>
              <TextInput
                style={S.input}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor="rgba(255,255,255,0.30)"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </Field>
            <Field label={t('register_phone_lbl', { defaultValue: 'Teléfono' })}>
              <TextInput
                style={S.input}
                placeholder="+52 614 000 0000"
                placeholderTextColor="rgba(255,255,255,0.30)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Field>
          </>
        )}

        {/* ── Correo ── */}
        <Field label={t('login_email_lbl', { defaultValue: 'Correo Electrónico' })}>
          <TextInput
            style={S.input}
            placeholder="tu@email.com"
            placeholderTextColor="rgba(255,255,255,0.30)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </Field>

        {/* ── Contraseña ── */}
        <Field
          label={t('login_pwd_lbl', { defaultValue: 'Contraseña' })}
          right={
            modo === 'login' && (
              <Pressable {...hoverForgotHandlers}>
                <Text style={[S.forgot, hoverForgot && S.forgotHover]}>
                  {t('login_forgot', { defaultValue: '¿Olvidaste?' })}
                </Text>
              </Pressable>
            )
          }
        >
          <View style={S.passwordWrap}>
            <TextInput
              style={[S.input, { flex: 1, borderWidth: 0 }]}
              placeholder={modo === 'login' ? '••••••••' : 'Mínimo 6 caracteres'}
              placeholderTextColor="rgba(255,255,255,0.30)"
              secureTextEntry={!showPwd}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPwd(!showPwd)} style={S.togglePwd}>
              <View>{EyeIcon({ open: showPwd })}</View>
            </Pressable>
          </View>
        </Field>

        {/* ── Campos exclusivos de Registro (tipo cliente + términos) ── */}
        {modo === 'register' && (
          <>
            <Field label={t('register_type_lbl', { defaultValue: 'Tipo de Cliente' })}>
              <View style={S.clientOptions}>
                {['Comprador', 'Vendedor', 'Inversionista'].map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => setClientType(opt)}
                    style={[S.clientOption, clientType === opt && S.clientOptionActive]}
                  >
                    <Text style={[S.clientOptionText, clientType === opt && S.clientOptionTextActive]}>
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <Pressable onPress={() => setAcceptTerms(!acceptTerms)} style={S.terms}>
              <View style={[S.checkbox, acceptTerms && S.checkboxActive]}>
                {acceptTerms && <Text style={S.checkMark}>✓</Text>}
              </View>
              <Text style={S.termsText}>
                {t('register_terms_1', { defaultValue: 'Acepto los ' })}
                <Text style={S.termsEm}>{t('register_terms_em', { defaultValue: 'términos y condiciones' })}</Text>
                {t('register_terms_2', { defaultValue: ' y la política de privacidad de INMOVIRAL.' })}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Botón principal ── */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[S.btnPrimary, hoverPrimary && S.btnPrimaryHover, loading && S.btnPrimaryDisabled]}
          {...hoverPrimaryHandlers}
        >
          {loading
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={S.btnPrimaryText}>
                {modo === 'login'
                  ? t('login_btn',     { defaultValue: 'Iniciar Sesión' })
                  : t('login_btn_reg', { defaultValue: 'Registrarse' })}
              </Text>
          }
        </Pressable>

        {/* ── Divisor ── */}
        <View style={S.divider}>
          <View style={S.dividerLine} />
          <Text style={S.dividerText}>{esES ? 'o' : 'or'}</Text>
          <View style={S.dividerLine} />
        </View>

        {/* ── Botón Google ── */}
        <Pressable
          onPress={handleGoogle}
          style={[S.btnGoogle, hoverGoogle && S.btnGoogleHover]}
          {...hoverGoogleHandlers}
        >
          <GoogleIcon />
          <Text style={S.btnGoogleText}>
            {modo === 'login'
              ? t('login_google',    { defaultValue: 'Continuar con Google' })
              : t('register_google', { defaultValue: 'Registrarse con Google' })}
          </Text>
        </Pressable>

        {/* ── Footer links ── */}
        <View style={S.footerLink}>
          <Text style={S.footerText}>
            {modo === 'login'
              ? t('login_no_account',  { defaultValue: '¿No tienes una cuenta?' })
              : t('login_has_account', { defaultValue: '¿Ya tienes una cuenta?' })}{' '}
          </Text>
          <Pressable onPress={() => cambiarModo(modo === 'login' ? 'register' : 'login')}>
            <Text style={S.footerLinkText}>
              {modo === 'login'
                ? t('login_register_link', { defaultValue: 'Regístrate' })
                : t('login_signin_link',   { defaultValue: 'Inicia sesión' })}
            </Text>
          </Pressable>
        </View>

        <Text style={S.footerSep}>—</Text>

        <View style={S.footerLink}>
          <Text style={S.footerText}>
            {t('login_guest_lbl', { defaultValue: '¿Prefieres continuar sin registrarte?' })}{' '}
          </Text>
          <Pressable onPress={onVolver}>
            <Text style={S.footerLinkText}>
              {t('login_guest_link', { defaultValue: 'Continuar como invitado' })}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ─── RENDER PRINCIPAL ──────────────────────
  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      {isWide ? (
        <View style={S.splitRow}>
          {renderImagePanel()}
          <View style={S.formSide}>
            {renderFormPanel()}
          </View>
        </View>
      ) : (
        renderFormPanel()
      )}
    </SafeAreaView>
  );
}

// ─── Componentes estáticos utilitarios ────────
function Field({ label, right, children }) {
  return (
    <View style={S.field}>
      <View style={S.fieldHead}>
        <Text style={S.fieldLabel}>{label}</Text>
        {right || null}
      </View>
      {children}
    </View>
  );
}

function EyeIcon({ open }) {
  return (
    <Text style={{ color: T.textMuted, fontSize: 16, lineHeight: 18 }}>
      {open ? '🙈' : '👁'}
    </Text>
  );
}

function GoogleIcon() {
  if (Platform.OS === 'web') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57C21.36 18.09 22.56 15.4 22.56 12.25z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.49 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );
  }
  return <Text style={{ color: '#EA4335', fontSize: 16, fontWeight: '700' }}>G</Text>;
}

export async function obtenerPropiedades() {
  const { data, error } = await supabase
    .from('propiedades')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('Error al obtener propiedades:', error); return []; }
  return data;
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  splitRow: { flex: 1, flexDirection: 'row' },
  imagePanel: { flex: 1, position: 'relative', overflow: 'hidden' },
  overlayBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  overlayHorizontal: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(to right, transparent 0%, rgba(10,10,10,0.55) 55%, #0A0A0A 100%)',
    } : {
      backgroundColor: 'rgba(10,10,10,0.35)',
    }),
  },
  overlayVertical: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(to bottom, rgba(10,10,10,0.70) 0%, transparent 28%, transparent 62%, rgba(10,10,10,0.80) 100%)',
    } : {
      backgroundColor: 'rgba(10,10,10,0.25)',
    }),
  },
  brand: { position: 'absolute', top: 48, left: 48, zIndex: 2 },
  brandText: { fontFamily: T.serif, fontSize: 22, letterSpacing: Platform.select({ web: '0.3em', default: 5 }), color: T.text, fontWeight: '300' },
  imageCaption: { position: 'absolute', bottom: 64, left: 48, right: 48, zIndex: 2 },
  captionLabel: { fontSize: 11, letterSpacing: Platform.select({ web: '0.3em', default: 4 }), textTransform: 'uppercase', color: T.gold, marginBottom: 16, fontFamily: T.sans },
  captionQuote: { fontFamily: T.serif, fontSize: 36, lineHeight: Platform.select({ web: undefined, default: 42 }), fontWeight: '300', color: T.text, maxWidth: 520 },
  formSide: { flex: 1, backgroundColor: T.bg },
  formScroll: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 40 },
  formScrollWide: { paddingHorizontal: 96, justifyContent: 'center', minHeight: '100%', maxWidth: 612, alignSelf: 'center', width: '100%' },
  langSwitcher: { flexDirection: 'row', alignSelf: 'flex-end', marginBottom: 32, gap: 8 },
  langBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'transparent' },
  langBtnActive: { backgroundColor: T.gold, borderColor: T.gold },
  langBtnText: { fontSize: 10, letterSpacing: Platform.select({ web: '0.2em', default: 2 }), color: T.textMuted, fontFamily: T.sans, fontWeight: '400' },
  langBtnTextActive: { color: '#000' },
  overline: { fontSize: 11, letterSpacing: Platform.select({ web: '0.3em', default: 4 }), textTransform: 'uppercase', color: T.gold, marginBottom: 16, fontFamily: T.sans },
  title: { fontFamily: T.serif, fontSize: 48, fontWeight: '300', color: T.text, marginBottom: 12, lineHeight: Platform.select({ web: undefined, default: 52 }) },
  subtitle: { fontSize: 14, fontWeight: '300', color: T.textMuted, marginBottom: 40, fontFamily: T.sans, lineHeight: Platform.select({ web: undefined, default: 22 }) },
  alert: { padding: 12, marginBottom: 16, borderWidth: 1 },
  alertError: { backgroundColor: T.errorBg, borderColor: T.errorBorder },
  alertSuccess: { backgroundColor: T.successBg, borderColor: T.gold },
  alertTextError: { color: T.errorText, fontSize: 13, fontFamily: T.sans },
  alertTextSuccess: { color: T.successText, fontSize: 13, fontFamily: T.sans },
  field: { marginBottom: 22 },
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldLabel: { fontSize: 11, letterSpacing: Platform.select({ web: '0.2em', default: 2 }), textTransform: 'uppercase', color: T.textMuted, fontWeight: '300', fontFamily: T.sans },
  forgot: { fontSize: 10, letterSpacing: Platform.select({ web: '0.2em', default: 2 }), textTransform: 'uppercase', color: T.gold, fontFamily: T.sans },
  forgotHover: { color: T.goldHover },
  input: { width: '100%', height: 48, backgroundColor: T.bgInput, borderWidth: 1, borderColor: T.borderSubtle, color: T.text, paddingHorizontal: 16, fontFamily: T.sans, fontSize: 14, fontWeight: '300', borderRadius: 0, outlineStyle: Platform.select({ web: 'none', default: undefined }) },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: T.bgInput, borderWidth: 1, borderColor: T.borderSubtle, borderRadius: 0 },
  togglePwd: { paddingHorizontal: 14, height: '100%', justifyContent: 'center', alignItems: 'center' },
  clientOptions: { flexDirection: 'row', gap: 8 },
  clientOption: { flex: 1, height: 40, borderWidth: 1, borderColor: T.borderSubtle, backgroundColor: T.bgInput, borderRadius: 0, justifyContent: 'center', alignItems: 'center' },
  clientOptionActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.10)' },
  clientOptionText: { fontSize: 11, color: T.textMuted, fontFamily: T.sans, letterSpacing: Platform.select({ web: '0.1em', default: 1 }) },
  clientOptionTextActive: { color: T.gold },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 22 },
  checkbox: { width: 16, height: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)', backgroundColor: T.bgInput, borderRadius: 0, marginTop: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  checkboxActive: { backgroundColor: T.gold, borderColor: T.gold },
  checkMark: { color: '#000', fontSize: 10, fontWeight: '700', lineHeight: Platform.select({ web: undefined, default: 14 }) },
  termsText: { flex: 1, fontSize: 11, color: T.textMuted, fontWeight: '300', lineHeight: Platform.select({ web: undefined, default: 18 }), fontFamily: T.sans },
  termsEm: { color: T.gold },
  btnPrimary: { width: '100%', height: 48, backgroundColor: T.gold, borderRadius: 0, justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 0, borderWidth: 0 },
  btnPrimaryHover: { backgroundColor: T.goldHover },
  btnPrimaryDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#000000', fontSize: 12, fontWeight: '500', letterSpacing: Platform.select({ web: '0.2em', default: 2 }), textTransform: 'uppercase', fontFamily: T.sans },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.borderSubtle },
  dividerText: { fontSize: 10, letterSpacing: Platform.select({ web: '0.3em', default: 3 }), textTransform: 'uppercase', color: T.textMuted, fontFamily: T.sans },
  btnGoogle: { width: '100%', height: 48, backgroundColor: 'transparent', borderWidth: 1, borderColor: T.borderMid, borderRadius: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  btnGoogleHover: { borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.05)' },
  btnGoogleText: { fontSize: 12, letterSpacing: Platform.select({ web: '0.2em', default: 2 }), textTransform: 'uppercase', fontWeight: '300', color: T.text, fontFamily: T.sans },
  footerLink: { marginTop: 32, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' },
  footerText: { fontSize: 12, color: T.textMuted, fontWeight: '300', fontFamily: T.sans },
  footerLinkText: { fontSize: 12, color: T.gold, textTransform: 'uppercase', letterSpacing: Platform.select({ web: '0.2em', default: 2 }), fontFamily: T.sans },
  footerSep: { marginTop: 16, textAlign: 'center', color: T.textMuted, fontSize: 11 }
});