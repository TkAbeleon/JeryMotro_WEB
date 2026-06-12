import { useState } from "react";
import { useListZones, useCreateZone, useDeleteZone, getListZonesQueryKey } from "@workspace/api-client-react";
import { mockZones } from "@/lib/mock-data";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Trash2, Lock, Shield, Target } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";

export default function ZonesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isPremium = user?.role === "admin" || user?.role === "premium";
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius_km: "", min_risk: "", custom_ai_prompt: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const query = useListZones();
  const zones = query.data ?? mockZones;

  const createMutation = useCreateZone({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
        setShowForm(false);
        setForm({ name: "", latitude: "", longitude: "", radius_km: "", min_risk: "", custom_ai_prompt: "" });
      },
    },
  });

  const deleteMutation = useDeleteZone({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
        setDeleteConfirm(null);
      },
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: form.name,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          radius_km: parseFloat(form.radius_km),
          min_risk: form.min_risk ? parseFloat(form.min_risk) : null,
          custom_ai_prompt: form.custom_ai_prompt || null,
        },
      });
    } catch {
      setShowForm(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold mb-2">{t("zones.premium.title")}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">{t("zones.premium.desc")}</p>
        </div>
        <a
          href="/subscriptions"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t("zones.premium.cta")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold">{t("zones.title")}</h1>
            <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
              {t("common.premium")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("zones.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-add-zone"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t("zones.addButton")}
        </button>
      </div>

      {/* Zone cards */}
      {zones.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t("zones.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {zones.map(z => (
            <div key={z.id} data-testid={`card-zone-${z.id}`} className="bg-card border border-card-border rounded-xl p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <button
                  onClick={() => setDeleteConfirm(z.id)}
                  data-testid={`button-delete-zone-${z.id}`}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-heading font-bold text-base mb-1">{z.name}</h3>

              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-mono">{z.latitude.toFixed(4)}, {z.longitude.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">
                    {t("zones.card.radius")}: <span className="text-foreground font-medium">{z.radius_km} km</span>
                  </span>
                  {z.min_risk && (
                    <span className="text-muted-foreground">
                      {t("zones.card.threshold")}: <span className="text-primary font-medium">{(z.min_risk * 100).toFixed(0)}%</span>
                    </span>
                  )}
                </div>
                {z.custom_ai_prompt && (
                  <div className="text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-1.5 italic">
                    "{z.custom_ai_prompt}"
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  {t("zones.card.created")} {new Date(z.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-heading font-bold text-lg mb-5">{t("zones.form.title")}</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("zones.form.name")} *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t("zones.form.namePlaceholder")}
                  required
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("zones.form.latitude")} *</label>
                  <input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="-16.300" required type="number" step="0.001" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("zones.form.longitude")} *</label>
                  <input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="46.200" required type="number" step="0.001" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("zones.form.radius")} *</label>
                  <input value={form.radius_km} onChange={e => setForm(f => ({ ...f, radius_km: e.target.value }))} placeholder="25" required type="number" min="1" max="200" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("zones.form.riskThreshold")}</label>
                  <input value={form.min_risk} onChange={e => setForm(f => ({ ...f, min_risk: e.target.value }))} placeholder="0.5" type="number" min="0" max="1" step="0.1" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("zones.form.aiPrompt")} ({t("common.optional")})</label>
                <textarea value={form.custom_ai_prompt} onChange={e => setForm(f => ({ ...f, custom_ai_prompt: e.target.value }))} placeholder={t("zones.form.aiPromptPlaceholder")} rows={2} className="w-full px-3 py-2 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {createMutation.isPending ? t("zones.form.creating") : t("zones.form.createButton")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-heading font-bold mb-2">{t("zones.delete.title")}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t("zones.delete.confirm")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                {t("common.cancel")}
              </button>
              <button
                onClick={() => { deleteMutation.mutate({ id: deleteConfirm }); setDeleteConfirm(null); }}
                className="flex-1 h-10 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
