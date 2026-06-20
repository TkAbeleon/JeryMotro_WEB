import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegisterUser, useRequestOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";
import { Flame, Sun, Moon, Languages, Home } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const registerSchema = z.object({
  full_name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  organization: z.string().optional(),
});

const otpSchema = z.object({
  code: z.string().length(6, "Code de 6 chiffres requis"),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

type Step = "register" | "verify";

export default function RegisterPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("register");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const registerMutation = useRegisterUser();
  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", organization: "" },
  });

  // OTP verification state
  const [otpCode, setOtpCode] = useState("");

  const onRegisterSubmit = async (data: RegisterFormData, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    setError("");
    try {
      const registerData = {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        organization: data.organization
      };
      console.log("Calling registerUser with:", registerData);
      await registerMutation.mutateAsync({ data: registerData });
      console.log("registerUser successful");
      setRegisteredEmail(data.email);

      console.log("Calling requestOtp with:", { email: data.email, via: "email" });
      const otpResult = await requestOtpMutation.mutateAsync({
        data: { email: data.email, via: "email" }
      });
      console.log("requestOtp successful, result:", otpResult);

      setStep("verify");
    } catch (err) {
      console.error("Error in onRegisterSubmit:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const onVerifyOtpSubmit = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    setError("");
    try {
      if (!registeredEmail) return;
      console.log("Calling verifyOtp with:", { email: registeredEmail, code: otpCode });
      const result = await verifyOtpMutation.mutateAsync({
        data: { email: registeredEmail, code: otpCode }
      });
      console.log("verifyOtp successful, result:", result);
      login(result);
      setLocation("/dashboard");
    } catch (err) {
      console.error("Error in onVerifyOtpSubmit:", err);
      setError(err instanceof Error ? err.message : t("auth.otp.error"));
    }
  };

  const resendOtp = async () => {
    if (!registeredEmail) return;
    setError("");
    try {
      console.log("Calling resendOtp with:", { email: registeredEmail, via: "email" });
      const otpResult = await requestOtpMutation.mutateAsync({
        data: { email: registeredEmail, via: "email" }
      });
      console.log("resendOtp successful, result:", otpResult);
    } catch (err) {
      console.error("Error in resendOtp:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
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
          <h2 className="font-heading text-2xl font-bold mb-4">{t("landing.hero.title")}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("landing.hero.subtitle")}</p>
          <div className="mt-8 space-y-3">
            {[
              t("landing.features.1.title"), t("landing.features.2.title"), t("landing.features.4.title")].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-accent">✓</span>
                  <span>{f}</span>
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
            <Link href="/" className="p-2 rounded-md hover:bg-secondary transition-colors">
              <Home className="w-4 h-4" />
            </Link>
          </div>

          {/* Top Controls (Desktop) */}
          <div className="flex items-center justify-end gap-3 mb-6 lg:flex">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="bg-transparent text-sm text-muted-foreground hover:text-foreground outline-none cursor-pointer"
              >
                {Object.entries(LANG_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Home Button */}
            <Link href="/" className="p-2 rounded-md hover:bg-secondary transition-colors">
              <Home className="w-4 h-4" />
            </Link>
          </div>

          {step === "register" ? (
            <>
              <h1 className="font-heading text-2xl font-bold mb-2">{t("auth.register.title")}</h1>
              <p className="text-muted-foreground text-sm mb-8">
                {t("auth.register.hasAccount")}{" "}
                <Link href="/login" className="text-primary hover:underline">{t("auth.register.login")}</Link>
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
              )}

              <Form {...registerForm}>
                <form onSubmit={(e) => { e.preventDefault(); registerForm.handleSubmit(onRegisterSubmit)(e); }} className="space-y-4">
                  <FormField control={registerForm.control} name="full_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.info.fullName")}</FormLabel>
                      <FormControl>
                        <input {...field} data-testid="input-name" placeholder="Rakoto Andriamahefa" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.login.email")}</FormLabel>
                      <FormControl>
                        <input {...field} type="email" data-testid="input-email" placeholder={t("auth.login.emailPlaceholder")} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="organization" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.info.organization")} ({t("common.optional")})</FormLabel>
                      <FormControl>
                        <input {...field} data-testid="input-org" placeholder={t("profile.info.orgPlaceholder")} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.login.password")}</FormLabel>
                      <FormControl>
                        <input {...field} type="password" data-testid="input-password" placeholder="••••••••" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <button
                    type="submit"
                    data-testid="button-submit"
                    disabled={registerMutation.isPending}
                    className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                  >
                    {registerMutation.isPending ? t("auth.register.submitting") : t("auth.register.submit")}
                  </button>
                </form>
              </Form>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-bold mb-2">{t("auth.otp.title")}</h1>
              <p className="text-muted-foreground text-sm mb-8">{t("auth.otp.subtitle")}</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
              )}

              <form onSubmit={onVerifyOtpSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">{t("auth.otp.codeLabel")}</label>
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <button
                  type="submit"
                  disabled={verifyOtpMutation.isPending || otpCode.length < 6}
                  className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                >
                  {verifyOtpMutation.isPending ? t("auth.otp.verifying") : t("auth.otp.verify")}
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={requestOtpMutation.isPending}
                  className="w-full h-10 bg-transparent border border-border text-foreground rounded-md font-semibold text-sm hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  {requestOtpMutation.isPending ? t("auth.otp.resending") : t("auth.otp.resend")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
