import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUpdateProfile, useUpdateContacts, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { User, Building2, Phone, Mail, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useI18n, LANG_LABELS, type Lang } from "@/hooks/use-i18n";

const LANGS: Lang[] = ["fr", "mg", "en"];

const profileSchema = z.object({
  full_name: z.string().min(2, "Nom requis"),
  organization: z.string().optional(),
});

const contactSchema = z.object({
  phone_number: z.string().optional().refine(val => !val || /^\+[1-9][0-9\s]{6,16}$/.test(val), {
    message: "Format international requis (ex: +261 34 00 000 00)",
  }),
  whatsapp_number: z.string().optional().refine(val => !val || /^\+[1-9][0-9\s]{6,16}$/.test(val), {
    message: "Format international requis (ex: +261 34 00 000 00)",
  }),
});

export default function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const qc = useQueryClient();
  const [saved, setSaved] = useState<"profile" | "contacts" | null>(null);

  const meQ = useGetMe();
  const profile = meQ.data ?? user ?? {
    id: 0,
    email: "",
    full_name: "",
    organization: "",
    role: "standard",
    is_active: false,
  };

  const updateProfileMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setSaved("profile");
        setTimeout(() => setSaved(null), 3000);
      },
    },
  });
  const updateContactsMutation = useUpdateContacts({
    mutation: {
      onSuccess: () => {
        setSaved("contacts");
        setTimeout(() => setSaved(null), 3000);
      },
    },
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name || "", organization: profile?.organization || "" },
  });

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { phone_number: profile?.phone_number || "", whatsapp_number: profile?.whatsapp_number || "" },
  });

  const isPremium = profile?.role === "admin" || profile?.role === "premium";

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("profile.subtitle")}</p>
      </div>

      {/* Profile header */}
      <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-heading font-bold text-primary flex-shrink-0">
          {profile?.full_name?.charAt(0) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-lg font-bold truncate">{profile?.full_name || "Utilisateur"}</h2>
          <div className="text-sm text-muted-foreground truncate">{profile?.email}</div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${isPremium ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {profile?.role || "user"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${profile?.is_active ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>
              {profile?.is_active ? t("profile.badge.active") : t("profile.badge.inactive")}
            </span>
          </div>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent text-sm px-4 py-3 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          {t("profile.saved")}
        </div>
      )}

      {/* Profile form */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold">{t("profile.info.title")}</h3>
        </div>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(async (data) => {
            try { await updateProfileMutation.mutateAsync({ data }); }
            catch { setSaved("profile"); setTimeout(() => setSaved(null), 3000); }
          })} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {t("profile.info.email")}
              </label>
              <input value={profile?.email || ""} disabled className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <FormField control={profileForm.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.info.fullName")}</FormLabel>
                <FormControl>
                  <input {...field} data-testid="input-full-name" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={profileForm.control} name="organization" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.info.organization")}</FormLabel>
                <FormControl>
                  <input {...field} data-testid="input-organization" placeholder={t("profile.info.orgPlaceholder")} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile" className="h-10 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {updateProfileMutation.isPending ? t("common.saving") : t("common.save")}
            </button>
          </form>
        </Form>
      </div>

      {/* Contacts form */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold">{t("profile.contacts.title")}</h3>
          {!isPremium && (
            <span className="ml-2 text-xs bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full">
              {t("profile.contacts.premiumNote")}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-5">{t("profile.contacts.subtitle")}</p>
        <Form {...contactForm}>
          <form onSubmit={contactForm.handleSubmit(async (data) => {
            const payload = {
              phone_number: data.phone_number?.trim().replace(/\s/g, "") || null,
              whatsapp_number: data.whatsapp_number?.trim().replace(/\s/g, "") || null,
            };
            try { await updateContactsMutation.mutateAsync({ data: payload }); }
            catch { setSaved("contacts"); setTimeout(() => setSaved(null), 3000); }
          })} className="space-y-4">
            <FormField control={contactForm.control} name="phone_number" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.contacts.phone")}</FormLabel>
                <FormControl>
                  <input {...field} data-testid="input-phone" placeholder="+261 34 00 000 00" disabled={!isPremium} className={`w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all ${!isPremium ? "opacity-50 cursor-not-allowed" : ""}`} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={contactForm.control} name="whatsapp_number" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.contacts.whatsapp")}</FormLabel>
                <FormControl>
                  <input {...field} data-testid="input-whatsapp" placeholder="+261 34 00 000 00" disabled={!isPremium} className={`w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all ${!isPremium ? "opacity-50 cursor-not-allowed" : ""}`} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <button type="submit" disabled={updateContactsMutation.isPending || !isPremium} data-testid="button-save-contacts" className="h-10 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {updateContactsMutation.isPending ? t("common.saving") : t("common.save")}
            </button>
          </form>
        </Form>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h3 className="font-heading font-semibold mb-4">{t("profile.prefs.title")}</h3>

        {/* Theme */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm font-medium">{t("profile.prefs.theme")}</div>
            <div className="text-xs text-muted-foreground">
              {theme === "dark" ? t("profile.prefs.themeDark") : t("profile.prefs.themeLight")}
            </div>
          </div>
          <button onClick={toggleTheme} className="text-xs bg-secondary border border-border px-3 py-1.5 rounded-md hover:bg-secondary/80 transition-colors">
            {theme === "dark" ? t("profile.prefs.switchToLight") : t("profile.prefs.switchToDark")}
          </button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium">{t("profile.prefs.language")}</div>
            <div className="text-xs text-muted-foreground">{LANG_LABELS[lang]}</div>
          </div>
          <div className="flex gap-1">
            {LANGS.map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors font-medium uppercase ${lang === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary text-muted-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-destructive/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="font-heading font-semibold text-destructive">{t("profile.danger.title")}</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{t("profile.danger.logout")}</div>
            <div className="text-xs text-muted-foreground">{t("profile.danger.logoutDesc")}</div>
          </div>
          <button onClick={logout} data-testid="button-logout" className="text-sm border border-destructive/30 text-destructive px-4 py-2 rounded-lg hover:bg-destructive/10 transition-colors">
            {t("common.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
