import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flame } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRequestOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";

const requestOtpSchema = z.object({
  email: z.string().email("Email invalide"),
  via: z.enum(["email", "sms"]).default("email"),
});

type RequestOtpFormData = z.infer<typeof requestOtpSchema>;

type Step = "request" | "verify";

export default function RegisterPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();

  const requestOtpForm = useForm<RequestOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { email: "", via: "email" },
  });

  // Timer logic for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleRequestOtp = async (data: RequestOtpFormData) => {
    setError("");
    try {
      console.log("Calling requestOtp with:", data);
      await requestOtpMutation.mutateAsync({ data });
      console.log("requestOtp successful");
      setUserEmail(data.email);
      setStep("verify");
      setTimer(60); // Start 60-second countdown
    } catch (err) {
      console.error("Error in handleRequestOtp:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la demande de code";
      setError(errorMessage);
    }
  };

  const handleVerifyOtp = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    setError("");
    try {
      if (!userEmail) return;
      console.log("Calling verifyOtp with:", { email: userEmail, code: otpCode });
      const result = await verifyOtpMutation.mutateAsync({
        data: { email: userEmail, code: otpCode }
      });
      console.log("verifyOtp successful, result:", result);
      login(result);
      setLocation("/dashboard");
    } catch (err) {
      console.error("Error in handleVerifyOtp:", err);
      const errorMessage = err instanceof Error ? err.message : t("auth.otp.error");
      setError(errorMessage);
    }
  };

  const handleResendOtp = async () => {
    if (!userEmail) return;
    setError("");
    try {
      console.log("Calling resendOtp with:", { email: userEmail, via: "email" });
      await requestOtpMutation.mutateAsync({
        data: { email: userEmail, via: "email" }
      });
      console.log("resendOtp successful");
      setTimer(60); // Reset timer
    } catch (err) {
      console.error("Error in handleResendOtp:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du renvoi du code");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-col w-[480px] bg-sidebar border-r border-border p-10 justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="JeryMotro" className="h-9 rounded" />
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
              t("subscriptions.cta.free"), t("landing.stat.detections"), t("landing.stat.accuracy")
            ].map((f, i) => (
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/logo.jpg" alt="JeryMotro" className="h-8 rounded" />
            <span className="font-heading font-bold text-lg">JeryMotro</span>
          </div>

          {step === "request" ? (
            <>
              <h1 className="font-heading text-2xl font-bold mb-2">{t("auth.register.title")}</h1>
              <p className="text-muted-foreground text-sm mb-8">
                {t("auth.register.hasAccount")}{" "}
                <Link href="/login" className="text-primary hover:underline">{t("auth.register.login")}</Link>
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
              )}

              <form onSubmit={requestOtpForm.handleSubmit(handleRequestOtp)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">{t("auth.login.email")}</label>
                  <input
                    {...requestOtpForm.register("email")}
                    type="email"
                    placeholder={t("auth.login.emailPlaceholder")}
                    className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  />
                  {requestOtpForm.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">{requestOtpForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Channel selector - for now, let's default to email (as per guide warning) */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{t("auth.otp.via") || "Envoyer par"}:</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      value="email"
                      checked={requestOtpForm.watch("via") === "email"}
                      onChange={(e) => requestOtpForm.setValue("via", e.target.value as "email" | "sms")}
                    />
                    {t("channel.email")}
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      value="sms"
                      checked={requestOtpForm.watch("via") === "sms"}
                      onChange={(e) => requestOtpForm.setValue("via", e.target.value as "email" | "sms")}
                    />
                    {t("channel.sms")}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                >
                  {requestOtpMutation.isPending ? t("auth.otp.sending") : t("auth.otp.sendCode")}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-bold mb-2">{t("auth.otp.title")}</h1>
              <p className="text-muted-foreground text-sm mb-8">{t("auth.otp.subtitle")}{" "}{userEmail}</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">{t("auth.otp.codeLabel")}</label>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
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
                  className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {verifyOtpMutation.isPending ? t("auth.otp.verifying") : t("auth.otp.verify")}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={requestOtpMutation.isPending || timer > 0}
                  className="w-full h-10 bg-transparent border border-border text-foreground rounded-md font-semibold text-sm hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  {timer > 0 ? `${t("auth.otp.resendIn")} ${timer}s` : t("auth.otp.resend")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
