
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
        response?.data?.user ?? response?.user ?? null;

      if (!currentUser) {
        setUser(null);
        return null;
      }

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      setUser(null);

      if (error.status !== 401) {
        console.error(
          "Unable to load the current user:",
          error.message
        );
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
          "Login succeeded, but the user session could not be loaded."
        );
      }

      return currentUser;
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
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
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}


// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// import apiRequest from "../services/api.js";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   // 1. Hardcode a mock logged-in user with host/organization privileges
//   const [user, setUser] = useState({
//     id: "usr_mock_123",
//     name: "Soumya Mondal",
//     email: "test@vettly.local",
//     role: "ORGANIZATION", // change to "HOST" if your routes check for HOST
//     organizationId: "org_mock_123",
//   });
  
//   // 2. Set authLoading to false right away so protected routes render immediately
//   const [authLoading, setAuthLoading] = useState(false);

//   const refreshUser = useCallback(async () => {
//     // Return the mock user without hitting /api/v1/auth/me
//     return user;
//   }, [user]);

//   useEffect(() => {
//     // Disabled network call to /api/v1/auth/me during UI development
//     setAuthLoading(false);
//   }, []);

//   const login = useCallback(
//     async (credentials) => {
//       return user;
//     },
//     [user]
//   );

//   const logout = useCallback(async () => {
//     setUser(null);
//   }, []);

//   const value = {
//     user,
//     setUser,
//     authLoading,
//     isAuthenticated: Boolean(user),
//     login,
//     logout,
//     refreshUser,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);

//   if (!context) {
//     throw new Error(
//       "useAuth must be used inside AuthProvider"
//     );
//   }

//   return context;
// }
