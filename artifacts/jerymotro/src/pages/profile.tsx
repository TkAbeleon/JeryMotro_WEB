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
const profileSchema = z.object({ full_name: z.string().min(2, "Nom requis"), organization: z.string().optional() });
const contactSchema = z.object({
  phone_number: z.string().optional().refine(val => !val || /^\+[1-9][0-9\s]{6,16}$/.test(val), { message: "Format international requis (ex: +261 34 00 000 00)" }),
  whatsapp_number: z.string().optional().refine(val => !val || /^\+[1-9][0-9\s]{6,16}$/.test(val), { message: "Format international requis (ex: +261 34 00 000 00)" }),
});

export default function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const qc = useQueryClient();
  const [saved, setSaved] = useState<"profile" | "contacts" | null>(null);
  const meQ = useGetMe();
  const profile = meQ.data ?? user ?? { id: 0, email: "", full_name: "", organization: "", role: "standard", is_active: false };
  const updateProfileMutation = useUpdateProfile({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMeQueryKey() }); setSaved("profile"); setTimeout(() => setSaved(null), 3000); } } });
  const updateContactsMutation = useUpdateContacts({ mutation: { onSuccess: () => { setSaved("contacts"); setTimeout(() => setSaved(null), 3000); } } });
  const profileForm = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { full_name: profile?.full_name || "", organization: profile?.organization || "" } });
  const contactForm = useForm<z.infer<typeof contactSchema>>({ resolver: zodResolver(contactSchema), defaultValues: { phone_number: profile?.phone_number || "", whatsapp_number: profile?.whatsapp_number || "" } });
  const isPremium = profile?.role === "admin" || profile?.role === "premium";

  return (
    <div className="w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div><h1 className="font-heading text-2xl font-bold">{t("profile.title")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("profile.subtitle")}</p></div>

      <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6">
        <div className="mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-2xl font-heading font-bold text-primary sm:mx-0">{profile?.full_name?.charAt(0) || "U"}</div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="truncate font-heading text-lg font-bold">{profile?.full_name || "Utilisateur"}</h2>
          <div className="truncate text-sm text-muted-foreground">{profile?.email}</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start"><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${isPremium ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{profile?.role || "user"}</span><span className={`rounded-full px-2 py-0.5 text-xs ${profile?.is_active ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>{profile?.is_active ? t("profile.badge.active") : t("profile.badge.inactive")}</span></div>
        </div>
      </div>

      {saved && <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />{t("profile.saved")}</div>}

      <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><h3 className="font-heading font-semibold">{t("profile.info.title")}</h3></div>
        <Form {...profileForm}><form onSubmit={profileForm.handleSubmit(async data => { try { await updateProfileMutation.mutateAsync({ data }); } catch { setSaved("profile"); setTimeout(() => setSaved(null), 3000); } })} className="space-y-4">
          <div><label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{t("profile.info.email")}</label><input value={profile?.email || ""} disabled className="h-10 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm text-muted-foreground cursor-not-allowed" /></div>
          <FormField control={profileForm.control} name="full_name" render={({ field }) => <FormItem><FormLabel>{t("profile.info.fullName")}</FormLabel><FormControl><input {...field} data-testid="input-full-name" className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={profileForm.control} name="organization" render={({ field }) => <FormItem><FormLabel>{t("profile.info.organization")}</FormLabel><FormControl><input {...field} data-testid="input-organization" placeholder={t("profile.info.orgPlaceholder")} className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30" /></FormControl><FormMessage /></FormItem>} />
          <button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile" className="h-10 w-full rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto">{updateProfileMutation.isPending ? t("common.saving") : t("common.save")}</button>
        </form></Form>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><h3 className="font-heading font-semibold">{t("profile.contacts.title")}</h3>{!isPremium && <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{t("profile.contacts.premiumNote")}</span>}</div>
        <p className="mb-5 mt-1 text-xs text-muted-foreground">{t("profile.contacts.subtitle")}</p>
        <Form {...contactForm}><form onSubmit={contactForm.handleSubmit(async data => { const payload = { phone_number: data.phone_number?.trim().replace(/\s/g, "") || null, whatsapp_number: data.whatsapp_number?.trim().replace(/\s/g, "") || null }; try { await updateContactsMutation.mutateAsync({ data: payload }); } catch { setSaved("contacts"); setTimeout(() => setSaved(null), 3000); } })} className="space-y-4">
          <FormField control={contactForm.control} name="phone_number" render={({ field }) => <FormItem><FormLabel>{t("profile.contacts.phone")}</FormLabel><FormControl><input {...field} data-testid="input-phone" placeholder="+261 34 00 000 00" disabled={!isPremium} className={`h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 ${!isPremium ? "cursor-not-allowed opacity-50" : ""}`} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={contactForm.control} name="whatsapp_number" render={({ field }) => <FormItem><FormLabel>{t("profile.contacts.whatsapp")}</FormLabel><FormControl><input {...field} data-testid="input-whatsapp" placeholder="+261 34 00 000 00" disabled={!isPremium} className={`h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 ${!isPremium ? "cursor-not-allowed opacity-50" : ""}`} /></FormControl><FormMessage /></FormItem>} />
          <button type="submit" disabled={updateContactsMutation.isPending || !isPremium} data-testid="button-save-contacts" className="h-10 w-full rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto">{updateContactsMutation.isPending ? t("common.saving") : t("common.save")}</button>
        </form></Form>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6">
        <h3 className="mb-2 font-heading font-semibold">{t("profile.prefs.title")}</h3>
        <div className="flex flex-col gap-3 border-b border-border py-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-medium">{t("profile.prefs.theme")}</div><div className="text-xs text-muted-foreground">{theme === "dark" ? t("profile.prefs.themeDark") : t("profile.prefs.themeLight")}</div></div><button onClick={toggleTheme} className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-xs transition-colors hover:bg-secondary/80 sm:w-auto">{theme === "dark" ? t("profile.prefs.switchToLight") : t("profile.prefs.switchToDark")}</button></div>
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-medium">{t("profile.prefs.language")}</div><div className="text-xs text-muted-foreground">{LANG_LABELS[lang]}</div></div><div className="flex gap-1">{LANGS.map(l => <button key={l} onClick={() => setLang(l)} className={`rounded-md border px-2.5 py-1 text-xs font-medium uppercase transition-colors ${lang === l ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}>{l}</button>)}</div></div>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /><h3 className="font-heading font-semibold text-destructive">{t("profile.danger.title")}</h3></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-medium">{t("profile.danger.logout")}</div><div className="text-xs text-muted-foreground">{t("profile.danger.logoutDesc")}</div></div><button onClick={logout} data-testid="button-logout" className="w-full rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 sm:w-auto">{t("common.logout")}</button></div>
      </div>
    </div>
  );
}
