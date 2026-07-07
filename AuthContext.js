import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';
import { fetchModerators, upsertUser } from './Componentes/systemSync';

// Creación del contexto de autenticación
const AuthContext = createContext({});

// Helper: normalizes user data across providers (email/password, Google, etc.)
// Google stores name in 'name' or 'full_name', avatar in 'picture' or 'avatar_url'
function extractUserRecord(u) {
  const meta = u.user_metadata || {};
  const isVentas = u.email === 'ventas@inmoviral.com.mx';
  return {
    id: u.id,
    email: u.email || meta.email || '',
    full_name: meta.full_name || meta.name || meta.display_name || '',
    phone: meta.phone || meta.phone_number || '',
    avatar_url: meta.avatar_url || meta.picture || '',
    provider: u.app_metadata?.provider || 'email',
    registered_at: u.created_at || new Date().toISOString(),
    isAdmin: isVentas,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSetUser = (u) => {
    if (u) {
      const isVentas = u.email === 'ventas@inmoviral.com.mx';
      u.isAdmin = isVentas;
    }
    setUser(u);
  };

  useEffect(() => {
    // 1. Validar si ya existe una sesión activa al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      handleSetUser(u);
      setLoading(false);
      if (u) {
        upsertUser(extractUserRecord(u)).catch(() => {});
      }
    });

    // 2. Escuchar en tiempo real cambios de estado (Login, Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      handleSetUser(u);
      setLoading(false);
      if (u) {
        upsertUser(extractUserRecord(u)).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkModerator() {
      if (user && !user.isAdmin) {
        try {
          const mods = await fetchModerators();
          const isMod = mods.includes(user.id);
          if (user.isModerator !== isMod) {
            setUser(prev => prev ? { ...prev, isModerator: isMod } : null);
          }
        } catch (e) {
          console.error("Error checking moderator status:", e);
        }
      }
    }
    checkModerator();
  }, [user]);

  // Función global para iniciar sesión
  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data?.user) {
      handleSetUser(result.data.user);
      upsertUser(extractUserRecord(result.data.user)).catch(() => {});
    }
    return result;
  };

  const signOut = async () => {
    try {
      handleSetUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const updateUserMetadata = async (metadata) => {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });
    if (!error && data?.user) {
      handleSetUser(data.user);
    }
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUserMetadata, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar la autenticación en cualquier pantalla
export const useAuth = () => useContext(AuthContext);