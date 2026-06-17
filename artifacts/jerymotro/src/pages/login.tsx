import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { Flame, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(4, "Mot de passe requis"),
});
type FormData = z.infer<typeof schema>;

const DEMO_CREDENTIALS = { email: "demo@jerymotro.mg", password: "demo1234" };
const DEMO_TOKEN_DATA = {
  access_token: "demo-token-jerymotro-2026",
  token_type: "bearer",
  user: {
    id: 1,
    email: "demo@jerymotro.mg",
    full_name: "Rakoto Andriamahefa",
    organization: "Ministère de l'Environnement",
    role: "admin" as const,
    is_active: true,
    phone_number: "+261 34 00 000 00",
    whatsapp_number: "+261 34 00 000 00",
  },
};

export default function LoginPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useLoginUser();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    setError("");
    // Demo shortcut — does not touch the backend
    if (data.email === DEMO_CREDENTIALS.email && data.password === DEMO_CREDENTIALS.password) {
      login(DEMO_TOKEN_DATA);
      setLocation("/dashboard");
      return;
    }
    try {
      const result = await loginMutation.mutateAsync({ data });
      login(result);
      setLocation("/dashboard");
    } catch (err: unknown) {
      // Show the real API error message when available
      const apiMsg =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ??
        (err as { data?: { detail?: string; message?: string } })?.data?.message ??
        (err as { message?: string })?.message;
      setError(apiMsg || t("auth.login.error"));
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[480px] bg-sidebar border-r border-border p-10 justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="JeryMotro" className="h-9 rounded" />
          <span className="font-heading font-bold text-xl">JeryMotro</span>
        </div>

        <div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-4 leading-tight">
            {t("landing.hero.title")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            {t("landing.hero.subtitle")}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { v: "127", lKey: "landing.stat.detections" as const },
              { v: "89%", lKey: "landing.stat.accuracy" as const },
              { v: "23", lKey: "landing.stat.clusters" as const },
              { v: "22", lKey: "landing.stat.regions" as const },
            ].map(s => (
              <div key={s.lKey} className="bg-card/50 rounded-lg p-4 border border-border">
                <div className="font-heading text-xl font-bold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t(s.lKey)}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("common.copyright")}</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/logo.jpg" alt="JeryMotro" className="h-8 rounded" />
            <span className="font-heading font-bold text-lg">JeryMotro</span>
          </div>

          <h1 className="font-heading text-2xl font-bold mb-2">{t("auth.login.title")}</h1>
          <p className="text-muted-foreground text-sm mb-8">
            {t("auth.login.noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline">{t("auth.login.createAccount")}</Link>
          </p>

          <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <span className="text-primary font-medium">{t("auth.login.demo")}:</span> demo@jerymotro.mg / demo1234
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.login.email")}</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        data-testid="input-email"
                        placeholder={t("auth.login.emailPlaceholder")}
                        className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.login.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          data-testid="input-password"
                          placeholder="••••••••"
                          className="w-full h-10 px-3 pr-10 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <button
                type="submit"
                data-testid="button-submit"
                disabled={loginMutation.isPending}
                className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loginMutation.isPending ? t("auth.login.submitting") : t("auth.login.submit")}
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
