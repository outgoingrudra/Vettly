
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import apiRequest from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load the currently authenticated user.
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiRequest("/auth/me");

      const currentUser =
        response?.data?.user ??
        response?.user ??
        null;

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      setUser(null);

      if (error?.status !== 401) {
        console.error(
          "Unable to load the current user:",
          error?.message || error
        );
      }

      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Check the existing session when the application loads.
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login.
  const login = useCallback(
    async (credentials) => {
      await apiRequest("/auth/login", {
        method: "POST",
        body: credentials,
      });

      // Verify the session using the backend.
      const currentUser = await refreshUser();

      if (!currentUser) {
        throw new Error(
          "Login succeeded, but the user session could not be loaded. Please try again."
        );
      }

      return currentUser;
    },
    [refreshUser]
  );

  // Logout.
  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(
        "Logout request failed:",
        error?.message || error
      );

      throw error;
    } finally {
      // Clear local authentication state.
      setUser(null);
    }
  }, []);

  const value = {
    user,
    setUser,

    authLoading,

    isAuthenticated: Boolean(user),

    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
