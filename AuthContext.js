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
  return {
    id: u.id,
    email: u.email || meta.email || '',
    full_name: meta.full_name || meta.name || meta.display_name || '',
    phone: meta.phone || meta.phone_number || '',
    avatar_url: meta.avatar_url || meta.picture || '',
    provider: u.app_metadata?.provider || 'email',
    registered_at: u.created_at || new Date().toISOString(),
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si existe una sesión de administrador guardada localmente
    let adminSession = null;
    if (Platform.OS === 'web') {
      try {
        const saved = localStorage.getItem('admin_user');
        if (saved) {
          adminSession = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (adminSession) {
      setUser(adminSession);
      setLoading(false);
    } else {
      // 1. Validar si ya existe una sesión activa al abrir la app
      supabase.auth.getSession().then(({ data: { session } }) => {
        const u = session?.user ?? null;
        setUser(u);
        setLoading(false);
        if (u) {
          upsertUser(extractUserRecord(u)).catch(() => {});
        }
      });
    }

    // 2. Escuchar en tiempo real cambios de estado (Login, Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Si somos admin, ignoramos el cambio del auth de supabase
      if (Platform.OS === 'web' && localStorage.getItem('admin_user')) {
        return;
      }
      const u = session?.user ?? null;
      setUser(u);
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

  // Función global para iniciar sesión (soporta admin local)
  const signIn = async (email, password) => {
    if (email.trim().toLowerCase() === 'admin' && password === 'admin') {
      const mockAdminUser = {
        id: 'admin-id-0000',
        email: 'admin@inmoviral.com',
        user_metadata: { full_name: 'Administrador' },
        isAdmin: true
      };
      setUser(mockAdminUser);
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem('admin_user', JSON.stringify(mockAdminUser));
        } catch (e) {
          console.error(e);
        }
      }
      return { data: { user: mockAdminUser }, error: null };
    }
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data?.user) {
      upsertUser(extractUserRecord(result.data.user)).catch(() => {});
    }
    return result;
  };

  const signOut = async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem('admin_user');
        } catch (e) {
          console.error(e);
        }
      }
      setUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const updateUserMetadata = async (metadata) => {
    if (user && user.isAdmin) {
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...metadata
        }
      };
      setUser(updatedUser);
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem('admin_user', JSON.stringify(updatedUser));
        } catch (e) {
          console.error(e);
        }
      }
      return { data: { user: updatedUser }, error: null };
    }

    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });
    if (!error && data?.user) {
      setUser(data.user);
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