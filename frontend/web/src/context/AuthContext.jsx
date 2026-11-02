
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

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiRequest("/auth/me");
      const currentUser =
        response?.user ?? response?.data?.user ?? response?.data ?? response;

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      setUser(null);

      if (error.status !== 401) {
        console.error("Unable to load the current user:", error.message);
      }

      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
  async (credentials) => {
    await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    });

    const currentUser = await refreshUser();

    if (!currentUser) {
      throw new Error(
        "Login succeeded, but the user session could not be loaded. Please check your backend session configuration.",
      );
    }

    return currentUser;
  },
  [refreshUser],
);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
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
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
