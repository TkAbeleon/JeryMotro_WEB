import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCw, Search, Shield, ShieldCheck, Trash2, UserCheck, UserX, UsersRound, X } from "lucide-react";
import { AsyncStateInline } from "@/components/ui/async-state";
import { useI18n } from "@/hooks/use-i18n";
import {
  activateAdminUser,
  createAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  type AdminUser,
  type AdminUserCreatePayload,
  type AdminUserRole,
} from "@/lib/admin-users-api";

type UserForm = {
  email: string;
  password: string;
  full_name: string;
  organization: string;
  role: AdminUserRole;
  phone_number: string;
  whatsapp_number: string;
  phone_verified: boolean;
  is_active: boolean;
};

const EMPTY: UserForm = {
  email: "",
  password: "",
  full_name: "",
  organization: "",
  role: "standard",
  phone_number: "",
  whatsapp_number: "",
  phone_verified: false,
  is_active: true,
};

function RoleBadge({ role, t }: { role: AdminUserRole; t: (key: any) => string }) {
  const Icon = role === "admin" ? ShieldCheck : role === "premium" ? Shield : UserCheck;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[10px] font-bold">
      <Icon className="h-3 w-3" />
      {t(`admin.user.role.${role}`)}
    </span>
  );
}

function UserModal({
  initial,
  edit,
  busy,
  onClose,
  onSubmit,
  t,
}: {
  initial: UserForm;
  edit: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (form: UserForm) => void;
  t: (key: any) => string;
}) {
  const [form, setForm] = useState<UserForm>(initial);
  const set = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const valid = form.email.trim().length > 3 && (!edit ? form.password.length >= 8 : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{t("admin.badge")}</p>
            <h2 className="mt-1 font-heading text-lg font-semibold">{edit ? t("admin.user.edit") : t("admin.user.create")}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form className="max-h-[78vh] overflow-y-auto p-5" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(form); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="field-label">{t("admin.user.email")}</span><input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="field-input" /></label>
            <label><span className="field-label">{t("admin.user.fullName")}</span><input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="field-input" /></label>
            <label><span className="field-label">{t("admin.user.organization")}</span><input value={form.organization} onChange={(e) => set("organization", e.target.value)} className="field-input" /></label>
            <label><span className="field-label">{t("admin.user.phone")}</span><input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} className="field-input" placeholder="+261 34 00 000 00" /></label>
            <label><span className="field-label">{t("admin.user.whatsapp")}</span><input value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} className="field-input" placeholder="+261 32 00 000 00" /></label>
            <label><span className="field-label">{t("admin.user.role")}</span><select value={form.role} onChange={(e) => set("role", e.target.value as AdminUserRole)} className="field-input"><option value="standard">{t("admin.user.role.standard")}</option><option value="premium">{t("admin.user.role.premium")}</option><option value="admin">{t("admin.user.role.admin")}</option></select></label>
            <label><span className="field-label">{t("admin.user.password")}{edit && <span className="ml-1 text-muted-foreground">({t("common.optional")})</span>}</span><input type="password" required={!edit} minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} className="field-input" /></label>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 rounded-xl border border-border/70 bg-muted/20 p-3">
            <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={form.phone_verified} onChange={(e) => set("phone_verified", e.target.checked)} />{t("admin.user.phoneVerified")}</label>
            <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />{t("admin.user.active")}</label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-xs font-semibold">{t("common.cancel")}</button>
            <button disabled={!valid || busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{edit ? t("common.save") : t("common.create")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsersPanel() {
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AdminUserRole | "all">("all");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ user?: AdminUser } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAdminUsers({
        q: search,
        role: role === "all" ? undefined : role,
        is_active: active === "all" ? undefined : active === "active",
        limit: 100,
      });
      setUsers(response.users);
      setTotal(response.total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.user.loadError"));
    } finally {
      setLoading(false);
    }
  }, [search, role, active, t]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => ({
    active: users.filter((u) => u.is_active).length,
    extended: users.filter((u) => u.role === "premium").length,
    admins: users.filter((u) => u.role === "admin").length,
  }), [users]);

  const submit = async (form: UserForm) => {
    setBusy(-1);
    try {
      if (modal?.user) {
        const payload = { ...form, password: form.password || undefined };
        delete (payload as any).password;
        await updateAdminUser(modal.user.id, { ...form, password: form.password || undefined });
      } else {
        const payload: AdminUserCreatePayload = { ...form };
        await createAdminUser(payload);
      }
      setModal(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.user.saveError"));
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (user: AdminUser) => {
    setBusy(user.id);
    try {
      if (user.is_active) await deactivateAdminUser(user.id);
      else await activateAdminUser(user.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.user.actionError"));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (user: AdminUser) => {
    if (!window.confirm(t("admin.user.deleteConfirm"))) return;
    setBusy(user.id);
    try {
      await deleteAdminUser(user.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.user.actionError"));
    } finally {
      setBusy(null);
    }
  };

  const toForm = (user?: AdminUser): UserForm => user ? ({
    email: user.email,
    password: "",
    full_name: user.full_name || "",
    organization: user.organization || "",
    role: user.role,
    phone_number: user.phone_number || "",
    whatsapp_number: user.whatsapp_number || "",
    phone_verified: user.phone_verified,
    is_active: user.is_active,
  }) : EMPTY;

  if (loading) return <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("admin.loading")}</div>;

  return (
    <section className="space-y-5">
      {error && <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["admin.user.stats.total", total, UsersRound],
          ["admin.user.stats.active", stats.active, UserCheck],
          ["admin.user.stats.extended", stats.extended, Shield],
        ].map(([key, value, Icon]) => <div key={key as string} className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 text-xl font-bold">{value as number}</p><p className="text-xs text-muted-foreground">{t(key as string)}</p></div>)}
      </div>
      <div className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.user.search")} className="field-input pl-9" /></div>
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="field-input lg:w-44"><option value="all">{t("common.all")}</option><option value="standard">{t("admin.user.role.standard")}</option><option value="premium">{t("admin.user.role.premium")}</option><option value="admin">{t("admin.user.role.admin")}</option></select>
          <select value={active} onChange={(e) => setActive(e.target.value as any)} className="field-input lg:w-40"><option value="all">{t("common.all")}</option><option value="active">{t("common.active")}</option><option value="inactive">{t("common.inactive")}</option></select>
          <button onClick={() => void load()} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold"><RefreshCw className="h-3.5 w-3.5" />{t("common.refresh")}</button>
          <button onClick={() => setModal({})} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" />{t("admin.user.create")}</button>
        </div>
      </div>
      {!users.length ? <AsyncStateInline type="empty" title={t("admin.user.empty.title")} description={t("admin.user.empty.description")} /> :
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs"><thead className="border-b border-border/70 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">{t("admin.user.email")}</th><th className="px-4 py-3">{t("admin.user.organization")}</th><th className="px-4 py-3">{t("admin.user.role")}</th><th className="px-4 py-3">{t("admin.user.status")}</th><th className="px-4 py-3 text-right">{t("admin.user.actions")}</th></tr></thead><tbody className="divide-y divide-border/60">{users.map((user) => <tr key={user.id} className="hover:bg-muted/20"><td className="px-4 py-3"><div className="font-semibold">{user.full_name || "—"}</div><div className="text-muted-foreground">{user.email}</div></td><td className="px-4 py-3">{user.organization || "—"}</td><td className="px-4 py-3"><RoleBadge role={user.role} t={t} /></td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${user.is_active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{user.is_active ? t("common.active") : t("common.inactive")}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button title={t("common.edit")} onClick={() => setModal({ user })} className="rounded-lg p-2 hover:bg-muted"><Edit3 className="h-3.5 w-3.5" /></button><button title={user.is_active ? t("admin.user.deactivate") : t("admin.user.activate")} disabled={busy === user.id} onClick={() => void toggle(user)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-50">{busy === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}</button><button title={t("common.delete")} onClick={() => void remove(user)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table>
          </div>
          <div className="divide-y divide-border/60 md:hidden">{users.map((user) => <article key={user.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{user.full_name || user.email}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div><RoleBadge role={user.role} t={t} /></div><div className="mt-3 text-xs text-muted-foreground">{user.organization || "—"}</div><div className="mt-4 flex gap-2"><button onClick={() => setModal({ user })} className="flex-1 rounded-lg border px-3 py-2 text-xs font-semibold">{t("common.edit")}</button><button onClick={() => void toggle(user)} className="rounded-lg border px-3 py-2 text-xs">{user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button><button onClick={() => void remove(user)} className="rounded-lg border border-destructive/20 px-3 py-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>
        </div>}
      {modal && <UserModal initial={toForm(modal.user)} edit={!!modal.user} busy={busy === -1} onClose={() => setModal(null)} onSubmit={submit} t={t} />}
    </section>
  );
}
