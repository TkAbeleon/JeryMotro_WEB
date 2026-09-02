import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useLoginUser, useRequestOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";
import { Flame, Eye, EyeOff, Sun, Moon, Languages, Home, Mail, Smartphone, ShieldCheck, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(4, "Mot de passe requis"),
});
type FormData = z.infer<typeof schema>;

const otpRequestSchema = z.object({
  email: z.string().email("Email invalide"),
});
type OtpRequestFormData = z.infer<typeof otpRequestSchema>;

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

type LoginMode = "password" | "otp";
type OtpStep = "request" | "verify";
type OtpVia = "email" | "sms";

function getApiError(err: unknown, fallback: string) {
  const apiMsg =
    (err as { data?: { detail?: string; message?: string } })?.data?.detail ??
    (err as { data?: { detail?: string; message?: string } })?.data?.message ??
    (err as { message?: string })?.message;
  return apiMsg || fallback;
}

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("request");
  const [otpVia, setOtpVia] = useState<OtpVia>("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const loginMutation = useLoginUser();
  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const otpForm = useForm<OtpRequestFormData>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError("");
    setOtpStep("request");
    setOtpCode("");
    setResendCooldown(0);
  };

  const requestOtp = async (data: OtpRequestFormData) => {
    setError("");
    try {
      await requestOtpMutation.mutateAsync({ data: { email: data.email, via: otpVia } });
      setOtpEmail(data.email);
      setOtpStep("verify");
      setOtpCode("");
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getApiError(err, t("auth.otp.requestError")));
    }
  };

  const resendOtp = async () => {
    if (!otpEmail || resendCooldown > 0 || requestOtpMutation.isPending) return;
    setError("");
    try {
      await requestOtpMutation.mutateAsync({ data: { email: otpEmail, via: otpVia } });
      setOtpCode("");
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getApiError(err, t("auth.otp.requestError")));
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError(t("auth.otp.invalidCode"));
      return;
    }
    setError("");
    try {
      const result = await verifyOtpMutation.mutateAsync({ data: { email: otpEmail, code: otpCode } });
      login(result);
      setLocation("/dashboard");
    } catch (err: unknown) {
      setError(getApiError(err, t("auth.otp.verifyError")));
    }
  };

  const onSubmit = async (data: FormData, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    setError("");
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
      setError(getApiError(err, t("auth.login.error")));
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-col w-[480px] bg-sidebar border-r border-border p-10 justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="JeryMotro" className="h-9 rounded" />
          <span className="font-heading font-bold text-xl">JeryMotro</span>
        </div>

        <div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-4 leading-tight">{t("landing.hero.title")}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">{t("landing.hero.subtitle")}</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { v: "127", lKey: "landing.mock.detectionsToday" as const },
              { v: "89%", lKey: "landing.mock.precision" as const },
              { v: "23", lKey: "landing.mock.activeClusters" as const },
              { v: "22", lKey: "landing.stats.coverage" as const },
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

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="JeryMotro" className="h-8 rounded" />
              <span className="font-heading font-bold text-lg">JeryMotro</span>
            </div>
            <Link href="/" className="p-2 rounded-md hover:bg-secondary transition-colors"><Home className="w-4 h-4" /></Link>
          </div>

          <div className="flex items-center justify-end gap-2 mb-6">
            <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-transparent text-xs sm:text-sm text-muted-foreground hover:text-foreground outline-none cursor-pointer">
                {Object.entries(LANG_LABELS).map(([key, label]) => <option key={key} value={key}>{key.toUpperCase()}</option>)}
              </select>
            </div>
            <Link href="/" className="p-2 rounded-md hover:bg-secondary transition-colors"><Home className="w-4 h-4" /></Link>
          </div>

          <h1 className="font-heading text-2xl font-bold mb-2">{t("auth.login.title")}</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {t("auth.login.noAccount")} {" "}
            <Link href="/register" className="text-primary hover:underline">{t("auth.login.createAccount")}</Link>
          </p>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-secondary border border-border mb-6" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "password"} onClick={() => switchMode("password")} className={`h-9 rounded-md text-sm font-medium transition-colors ${mode === "password" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t("auth.login.passwordMode")}
            </button>
            <button type="button" role="tab" aria-selected={mode === "otp"} onClick={() => switchMode("otp")} className={`h-9 rounded-md text-sm font-medium transition-colors ${mode === "otp" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t("auth.login.otpMode")}
            </button>
          </div>

          {mode === "password" ? (
            <>
              <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                <span className="text-primary font-medium">{t("auth.login.demo")}:</span> demo@jerymotro.mg / demo1234
              </div>
              {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>{t("auth.login.email")}</FormLabel><FormControl>
                      <input {...field} type="email" data-testid="input-email" placeholder={t("auth.login.emailPlaceholder")} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>{t("auth.login.password")}</FormLabel><FormControl>
                      <div className="relative"><input {...field} type={showPassword ? "text" : "password"} data-testid="input-password" placeholder="••••••••" className="w-full h-10 px-3 pr-10 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                      </div>
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <button type="submit" data-testid="button-submit" disabled={loginMutation.isPending} className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                    {loginMutation.isPending ? t("auth.login.submitting") : t("auth.login.submit")}
                  </button>
                </form>
              </Form>
            </>
          ) : (
            <div className="space-y-5">
              {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
              {otpStep === "request" ? (
                <>
                  <div className="rounded-xl border border-border bg-card/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-primary" /></div>
                      <div><p className="text-sm font-medium">{t("auth.otp.title")}</p><p className="text-xs text-muted-foreground mt-1">{t("auth.otp.description")}</p></div>
                    </div>
                  </div>
                  <Form {...otpForm}>
                    <form onSubmit={(e) => { e.preventDefault(); otpForm.handleSubmit(requestOtp)(e); }} className="space-y-4">
                      <FormField control={otpForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>{t("auth.login.email")}</FormLabel><FormControl>
                          <input {...field} type="email" data-testid="input-otp-email" placeholder={t("auth.login.emailPlaceholder")} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                        </FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="space-y-2">
                        <FormLabel>{t("auth.otp.channel")}</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {(["email", "sms"] as OtpVia[]).map(via => (
                            <button key={via} type="button" onClick={() => setOtpVia(via)} className={`h-11 rounded-md border text-sm flex items-center justify-center gap-2 transition-colors ${otpVia === via ? "border-primary bg-primary/10 text-foreground" : "border-input bg-secondary text-muted-foreground hover:text-foreground"}`}>
                              {via === "email" ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                              {via === "email" ? t("channel.email") : t("channel.sms")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button type="submit" disabled={requestOtpMutation.isPending} className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                        {requestOtpMutation.isPending ? t("auth.otp.sending") : t("auth.otp.send")}
                      </button>
                    </form>
                  </Form>
                </>
              ) : (
                <>
                  <div className="text-center rounded-xl border border-border bg-card/40 p-5">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3"><Mail className="w-4 h-4 text-primary" /></div>
                    <p className="text-sm font-medium">{t("auth.otp.codeTitle")}</p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">{otpEmail}</p>
                  </div>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} aria-label={t("auth.otp.codeLabel")} inputMode="numeric">
                      <InputOTPGroup>
                        {Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <button type="button" onClick={verifyOtp} disabled={verifyOtpMutation.isPending || otpCode.length !== 6} className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                    {verifyOtpMutation.isPending ? t("auth.otp.verifying") : t("auth.otp.verify")}
                  </button>
                  <div className="flex items-center justify-between text-xs">
                    <button type="button" onClick={() => { setOtpStep("request"); setError(""); }} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-3.5 h-3.5" />{t("auth.otp.changeEmail")}</button>
                    <button type="button" onClick={resendOtp} disabled={resendCooldown > 0 || requestOtpMutation.isPending} className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline">
                      {resendCooldown > 0 ? t("auth.otp.resendIn").replace("{{seconds}}", String(resendCooldown)) : t("auth.otp.resend")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
