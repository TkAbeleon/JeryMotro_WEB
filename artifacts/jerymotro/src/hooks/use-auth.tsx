import { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, AuthToken } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: AuthToken) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER: UserProfile = {
  id: 1,
  email: "demo@jerymotro.mg",
  full_name: "Rakoto Andriamahefa",
  organization: "Ministère de l'Environnement",
  role: "admin",
  is_active: true,
  phone_number: "+261 34 00 000 00",
  whatsapp_number: "+261 34 00 000 00",
};
const DEMO_TOKEN = "demo-token-jerymotro-2026";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("jerymotro_token");
    const storedUser = localStorage.getItem("jerymotro_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("jerymotro_token");
        localStorage.removeItem("jerymotro_user");
      }
    } else {
      // Auto-login with demo account for prototype preview
      setToken(DEMO_TOKEN);
      setUser(DEMO_USER);
      localStorage.setItem("jerymotro_token", DEMO_TOKEN);
      localStorage.setItem("jerymotro_user", JSON.stringify(DEMO_USER));
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
    window.location.href = "/login";
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
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
