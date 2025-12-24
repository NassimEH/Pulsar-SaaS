import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un token existe et récupérer les infos utilisateur
    if (token) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalide, supprimer
        logout();
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Erreur de connexion';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (e) {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const newToken = data.access_token;
      
      // Mettre à jour le token
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      
      // Récupérer les infos utilisateur avec le nouveau token (sans attendre useEffect)
      const userResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${newToken}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      } else {
        // Si erreur, nettoyer
        localStorage.removeItem('auth_token');
        setToken(null);
        throw new Error('Impossible de récupérer les informations utilisateur');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Erreur de connexion' };
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          full_name: fullName || null
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erreur d\'inscription';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (e) {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Après inscription, connecter automatiquement
      const loginResult = await login(email, password);
      return loginResult;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Erreur d\'inscription' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

