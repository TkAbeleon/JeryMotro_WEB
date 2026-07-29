import { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, AuthToken } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: AuthToken) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Decode JWT token to check expiration
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true; // If we can't decode, consider it expired
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(typeof window === "undefined" ? false : true);

  useEffect(() => {
    const storedToken = localStorage.getItem("jerymotro_token");
    const storedUser = localStorage.getItem("jerymotro_user");

    if (storedToken && storedUser) {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem("jerymotro_token");
        localStorage.removeItem("jerymotro_user");
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("jerymotro_token");
        localStorage.removeItem("jerymotro_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data: AuthToken) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("jerymotro_token", data.access_token);
    localStorage.setItem("jerymotro_user", JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("jerymotro_token");
    localStorage.removeItem("jerymotro_user");
    window.location.href = "/";
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const isAdmin = user?.role === "admin";
  const isPremium = user?.role === "admin" || user?.role === "premium";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, hasRole, isAdmin, isPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
