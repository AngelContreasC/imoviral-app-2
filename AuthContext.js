import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

// Creación del contexto de autenticación
const AuthContext = createContext({});

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
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    // 2. Escuchar en tiempo real cambios de estado (Login, Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Si somos admin, ignoramos el cambio del auth de supabase
      if (Platform.OS === 'web' && localStorage.getItem('admin_user')) {
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    return await supabase.auth.signInWithPassword({ email, password });
  };

  // Función global para cerrar sesión
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

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar la autenticación en cualquier pantalla
export const useAuth = () => useContext(AuthContext);