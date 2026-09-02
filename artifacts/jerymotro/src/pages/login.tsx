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
import { Flame, Eye, EyeOff, Sun, Moon, Languages, Home, Mail, Smartphone, MessageCircle, ShieldCheck, ArrowLeft } from "lucide-react";

const schema = z.object({ email: z.string().email("Email invalide"), password: z.string().min(4, "Mot de passe requis") });
type FormData = z.infer<typeof schema>;
const otpSchema = z.object({ identifier: z.string().trim().min(1, "Identifiant requis") });
type OtpFormData = z.infer<typeof otpSchema>;
const DEMO_CREDENTIALS = { email: "demo@jerymotro.mg", password: "demo1234" };
const DEMO_TOKEN_DATA = { access_token: "demo-token-jerymotro-2026", token_type: "bearer", user: { id: 1, email: "demo@jerymotro.mg", full_name: "Rakoto Andriamahefa", organization: "Ministère de l'Environnement", role: "admin" as const, is_active: true, phone_number: "+261 34 00 000 00", whatsapp_number: "+261 34 00 000 00" } };
type LoginMode = "password" | "otp";
type OtpStep = "request" | "verify";
type OtpVia = "email" | "sms" | "whatsapp";

function apiError(err: unknown, fallback: string) {
  return (err as { data?: { detail?: string; message?: string }; message?: string })?.data?.detail
    ?? (err as { data?: { detail?: string; message?: string } })?.data?.message
    ?? (err as { message?: string })?.message ?? fallback;
}

function channelMeta(via: OtpVia) {
  if (via === "email") return { label: "Email", type: "email", placeholder: "vous@exemple.mg", icon: Mail, hint: "Utilisez l’adresse e-mail déjà associée à votre compte." };
  if (via === "sms") return { label: "SMS", type: "tel", placeholder: "+261 32 00 000 00", icon: Smartphone, hint: "Utilisez le numéro SMS déjà enregistré sur votre compte." };
  return { label: "WhatsApp", type: "tel", placeholder: "+261 32 00 000 00", icon: MessageCircle, hint: "Utilisez le numéro WhatsApp déjà enregistré sur votre compte." };
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
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const loginMutation = useLoginUser();
  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const otpForm = useForm<OtpFormData>({ resolver: zodResolver(otpSchema), defaultValues: { identifier: "" } });

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const switchMode = (next: LoginMode) => { setMode(next); setError(""); setShowRegisterPrompt(false); setOtpStep("request"); setOtpCode(""); setCooldown(0); };

  const buildOtpPayload = (identifier: string) => {
    const normalized = identifier.trim();
    if (otpVia === "email") return { via: otpVia, email: normalized };
    if (otpVia === "sms") return { via: otpVia, phone_number: normalized };
    return { via: otpVia, whatsapp_number: normalized };
  };

  const validateIdentifier = (identifier: string) => {
    if (otpVia === "email") return z.string().email("Email invalide").safeParse(identifier.trim()).success;
    return /^\+?\d{7,15}$/.test(identifier.replace(/[\s()-]/g, ""));
  };

  const requestOtp = async ({ identifier }: OtpFormData) => {
    setError(""); setShowRegisterPrompt(false);
    if (!validateIdentifier(identifier)) { setError(otpVia === "email" ? "Email invalide." : "Numéro invalide. Utilisez un numéro au format international, par exemple +261320000000."); return; }
    try {
      await requestOtpMutation.mutateAsync({ data: buildOtpPayload(identifier) });
      setOtpIdentifier(identifier.trim()); setOtpCode(""); setOtpStep("verify"); setCooldown(60);
    } catch (err) {
      const message = apiError(err, "Impossible d'envoyer le code OTP.");
      setError(message);
      if ((err as { status?: number })?.status === 404 || /aucun compte|créer un compte|assoc[ií]é/i.test(message)) setShowRegisterPrompt(true);
    }
  };

  const resendOtp = async () => {
    if (!otpIdentifier || cooldown || requestOtpMutation.isPending) return;
    setError("");
    try { await requestOtpMutation.mutateAsync({ data: buildOtpPayload(otpIdentifier) }); setOtpCode(""); setCooldown(60); }
    catch (err) { setError(apiError(err, "Impossible d'envoyer le code OTP.")); }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) { setError("Veuillez saisir les 6 chiffres du code."); return; }
    setError("");
    try {
      const result = await verifyOtpMutation.mutateAsync({ data: { ...buildOtpPayload(otpIdentifier), code: otpCode } });
      login(result); setLocation("/dashboard");
    } catch (err) { setError(apiError(err, "Code OTP invalide ou expiré.")); }
  };

  const onSubmit = async (data: FormData, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault(); setError("");
    if (data.email === DEMO_CREDENTIALS.email && data.password === DEMO_CREDENTIALS.password) { login(DEMO_TOKEN_DATA); setLocation("/dashboard"); return; }
    try { const result = await loginMutation.mutateAsync({ data }); login(result); setLocation("/dashboard"); }
    catch (err) { setError(apiError(err, t("auth.login.error"))); }
  };

  const meta = channelMeta(otpVia);
  const ChannelIcon = meta.icon;

  return <div className="min-h-screen bg-background flex">
    <div className="hidden lg:flex flex-col w-[480px] bg-sidebar border-r border-border p-10 justify-between">
      <div className="flex items-center gap-3"><img src="/logo.png" alt="JeryMotro" className="h-9 rounded" /><span className="font-heading font-bold text-xl">JeryMotro</span></div>
      <div><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6"><Flame className="w-6 h-6 text-primary" /></div><h2 className="font-heading text-2xl font-bold mb-4 leading-tight">{t("landing.hero.title")}</h2><p className="text-muted-foreground text-sm leading-relaxed mb-8">{t("landing.hero.subtitle")}</p><div className="grid grid-cols-2 gap-4">{[{ v: "127", lKey: "landing.mock.detectionsToday" as const }, { v: "89%", lKey: "landing.mock.precision" as const }, { v: "23", lKey: "landing.mock.activeClusters" as const }, { v: "22", lKey: "landing.stats.coverage" as const }].map(s => <div key={s.lKey} className="bg-card/50 rounded-lg p-4 border border-border"><div className="font-heading text-xl font-bold text-primary">{s.v}</div><div className="text-xs text-muted-foreground mt-0.5">{t(s.lKey)}</div></div>)}</div></div>
      <p className="text-xs text-muted-foreground">{t("common.copyright")}</p>
    </div>
    <div className="flex-1 flex items-center justify-center p-8"><div className="w-full max-w-[400px]">
      <div className="flex items-center justify-between mb-8 lg:hidden"><div className="flex items-center gap-2"><img src="/logo.png" alt="JeryMotro" className="h-8 rounded" /><span className="font-heading font-bold text-lg">JeryMotro</span></div><Link href="/" className="p-2 rounded-md hover:bg-secondary"><Home className="w-4 h-4" /></Link></div>
      <div className="flex items-center justify-end gap-2 mb-6"><button onClick={toggleTheme} className="p-2 rounded-md hover:bg-secondary">{theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button><div className="flex items-center gap-1"><Languages className="w-4 h-4 text-muted-foreground" /><select value={lang} onChange={e => setLang(e.target.value as any)} className="bg-transparent text-xs sm:text-sm text-muted-foreground outline-none">{Object.entries(LANG_LABELS).map(([key]) => <option key={key} value={key}>{key.toUpperCase()}</option>)}</select></div><Link href="/" className="p-2 rounded-md hover:bg-secondary"><Home className="w-4 h-4" /></Link></div>
      <h1 className="font-heading text-2xl font-bold mb-2">{t("auth.login.title")}</h1><p className="text-muted-foreground text-sm mb-6">{t("auth.login.noAccount")} <Link href="/register" className="text-primary hover:underline">{t("auth.login.createAccount")}</Link></p>
      <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-secondary border border-border mb-6" role="tablist"><button type="button" role="tab" aria-selected={mode === "password"} onClick={() => switchMode("password")} className={`h-9 rounded-md text-sm font-medium ${mode === "password" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Mot de passe</button><button type="button" role="tab" aria-selected={mode === "otp"} onClick={() => switchMode("otp")} className={`h-9 rounded-md text-sm font-medium ${mode === "otp" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Code OTP</button></div>
      {mode === "password" ? <><div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground"><span className="text-primary font-medium">{t("auth.login.demo")}:</span> demo@jerymotro.mg / demo1234</div>{error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}<Form {...form}><form onSubmit={e => { e.preventDefault(); form.handleSubmit(onSubmit)(e); }} className="space-y-4"><FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>{t("auth.login.email")}</FormLabel><FormControl><input {...field} type="email" data-testid="input-email" placeholder={t("auth.login.emailPlaceholder")} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="password" render={({ field }) => <FormItem><FormLabel>{t("auth.login.password")}</FormLabel><FormControl><div className="relative"><input {...field} type={showPassword ? "text" : "password"} data-testid="input-password" placeholder="••••••••" className="w-full h-10 px-3 pr-10 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></FormControl><FormMessage /></FormItem>} /><button type="submit" data-testid="button-submit" disabled={loginMutation.isPending} className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50">{loginMutation.isPending ? t("auth.login.submitting") : t("auth.login.submit")}</button></form></Form></> : <div className="space-y-5">
        {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
        {showRegisterPrompt && <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm"><p className="font-medium">Aucun compte trouvé</p><p className="mt-1 text-muted-foreground">Cet identifiant n’est associé à aucun compte JeryMotro. Créez un compte pour continuer.</p><Link href="/register" className="inline-flex mt-3 h-9 px-3 items-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">Créer un compte</Link></div>}
        {otpStep === "request" ? <>
          <div className="rounded-xl border border-border bg-card/40 p-4"><div className="flex items-start gap-3"><div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-primary" /></div><div><p className="text-sm font-medium">Connexion par code</p><p className="text-xs text-muted-foreground mt-1">Choisissez votre canal puis utilisez l’identifiant déjà enregistré sur votre compte.</p></div></div></div>
          <div className="space-y-2"><label className="text-sm font-medium leading-none">Recevoir le code via</label><div className="grid grid-cols-3 gap-2">{(["email", "sms", "whatsapp"] as OtpVia[]).map(via => { const m = channelMeta(via); const Icon = m.icon; return <button key={via} type="button" onClick={() => { setOtpVia(via); setError(""); setShowRegisterPrompt(false); otpForm.setValue("identifier", ""); }} className={`h-11 rounded-md border text-sm flex items-center justify-center gap-2 ${otpVia === via ? "border-primary bg-primary/10 text-foreground" : "border-input bg-secondary text-muted-foreground"}`}><Icon className="w-4 h-4" />{m.label}</button>; })}</div></div>
          <Form {...otpForm}><form onSubmit={e => { e.preventDefault(); otpForm.handleSubmit(requestOtp)(e); }} className="space-y-4"><FormField control={otpForm.control} name="identifier" render={({ field }) => <FormItem><FormLabel>{meta.label}</FormLabel><FormControl><input {...field} type={meta.type} data-testid="input-otp-identifier" placeholder={meta.placeholder} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" /></FormControl><p className="text-xs text-muted-foreground">{meta.hint}</p><FormMessage /></FormItem>} /><button type="submit" disabled={requestOtpMutation.isPending} className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50">{requestOtpMutation.isPending ? "Envoi..." : "Envoyer le code"}</button></form></Form>
        </> : <>
          <div className="text-center rounded-xl border border-border bg-card/40 p-5"><div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3"><ChannelIcon className="w-4 h-4 text-primary" /></div><p className="text-sm font-medium">Code de connexion</p><p className="text-xs text-muted-foreground mt-1 break-all">{otpIdentifier}</p><p className="text-xs text-muted-foreground mt-1">Envoyé via {meta.label}</p></div>
          <div className="flex justify-center"><InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} aria-label="Code OTP" inputMode="numeric"><InputOTPGroup>{Array.from({ length: 6 }, (_, i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup></InputOTP></div>
          <button type="button" onClick={verifyOtp} disabled={verifyOtpMutation.isPending || otpCode.length !== 6} className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50">{verifyOtpMutation.isPending ? "Vérification..." : "Se connecter"}</button>
          <div className="flex items-center justify-between text-xs"><button type="button" onClick={() => { setOtpStep("request"); setError(""); setShowRegisterPrompt(false); }} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3.5 h-3.5" />Changer de {otpVia === "email" ? "e-mail" : "numéro"}</button><button type="button" onClick={resendOtp} disabled={cooldown > 0 || requestOtpMutation.isPending} className="text-primary hover:underline disabled:text-muted-foreground">{cooldown ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code"}</button></div>
        </>}
      </div>}
    </div></div>
  </div>;
}
