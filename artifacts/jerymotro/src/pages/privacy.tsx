import { Link } from "wouter";
import { ArrowLeft, Key, Lock, Eye, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { AppShell } from "@/components/layout/AppShell";

export default function PrivacyPage() {
  const { lang, t } = useI18n();

  const content = {
    fr: {
      title: "Politique de Confidentialité",
      subtitle: "Comment nous collectons, traitons et protégeons vos données personnelles.",
      sections: [
        {
          icon: Eye,
          title: "Collecte des données",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Nous collectons uniquement les informations nécessaires au bon fonctionnement de JeryMotro :
              votre adresse e-mail lors de l'inscription pour la gestion des alertes, et des cookies techniques
              strictement nécessaires pour mémoriser votre langue et votre session d'authentification.
            </p>
          ),
        },
        {
          icon: Lock,
          title: "Sécurité et traitement",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vos informations sont stockées dans des bases de données hautement sécurisées (Supabase/PostgreSQL)
              avec un chiffrement des mots de passe. Vos données ne sont jamais vendues, partagées, ou divulguées
              à des tiers à des fins commerciales.
            </p>
          ),
        },
        {
          icon: Key,
          title: "Vos droits (RGPD)",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Conformément à la réglementation sur la protection des données personnelles, vous disposez d'un droit
              d'accès, de rectification, de portabilité et de suppression de vos données personnelles. Vous pouvez
              exercer ces droits ou supprimer votre compte directement depuis votre profil d'utilisateur.
            </p>
          ),
        },
        {
          icon: CheckCircle2,
          title: "Alertes et notifications",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              En configurant des alertes par Email, SMS ou WhatsApp, vous acceptez que vos coordonnées (email, numéro de téléphone)
              soient traitées par nos pipelines automatisés (n8n, WAHA) dans le seul but de vous envoyer les alertes de feux
              de brousse que vous avez configurées.
            </p>
          ),
        },
      ],
    },
    mg: {
      title: "Politika Tsiambaratelo",
      subtitle: "Ny fomba fanangonana, fikarakarana ary fiarovana ny angon-drakitra manokana momba anao.",
      sections: [
        {
          icon: Eye,
          title: "Fanangonana angon-drakitra",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ny JeryMotro dia tsy manangona afa-tsy ny fampahalalana ilaina ihany:
              ny adiresy mailakao rehefa misoratra anarana ho an'ny fampandrenesana, ary cookies ara-teknika
              mba hitadidy ny fiteninao sy ny fidiranao.
            </p>
          ),
        },
        {
          icon: Lock,
          title: "Fiarovana ny angona",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ny mombamomba anao dia tehirizina amina tahiry azo antoka tsara (Supabase/PostgreSQL).
              Ny angonao dia tsy hamidy, ho zaraina na homena an'iza na an'iza ho an'ny varotra.
            </p>
          ),
        },
        {
          icon: Key,
          title: "Ny zonao",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Manana zo hijery, hanova, ary hamafa ny mombamomba anao ianao amin'ny fotoana rehetra.
              Azonao atao izany mivantana ao amin'ny pejin'ny mombamomba anao (Profile).
            </p>
          ),
        },
        {
          icon: CheckCircle2,
          title: "Fampandrenesana",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Rehefa manamboatra fampandrenesana amin'ny Mailaka, SMS na WhatsApp ianao dia manaiky fa ny adiresinao na
              ny laharana findainao dia hampiasain'ny rafitra mandeha ho azy (n8n, WAHA) handefasana ny fampandrenesana afo fotsiny.
            </p>
          ),
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      subtitle: "How we collect, process, and protect your personal data.",
      sections: [
        {
          icon: Eye,
          title: "Data Collection",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              We only collect information strictly necessary for the proper functioning of JeryMotro:
              your email address during registration to manage alerts, and technical session cookies
              to remember your language and authentication state.
            </p>
          ),
        },
        {
          icon: Lock,
          title: "Security and Processing",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your information is stored in highly secure databases (Supabase/PostgreSQL) with password hashing.
              Your personal data is never sold, shared, or disclosed to third parties for commercial purposes.
            </p>
          ),
        },
        {
          icon: Key,
          title: "Your Rights (GDPR)",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              In accordance with data protection regulations, you have the right to access, rectify, port,
              and delete your personal data. You can exercise these rights or delete your account at any time
              directly from your user profile.
            </p>
          ),
        },
        {
          icon: CheckCircle2,
          title: "Alerts & Notifications",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              By setting up Email, SMS or WhatsApp notifications, you agree that your contact information
              will be processed by our automated pipelines (n8n, WAHA) for the sole purpose of sending you
              the wildfire alerts you have subscribed to.
            </p>
          ),
        },
      ],
    },
  };

  const activeContent = content[lang as "fr" | "mg" | "en"] || content.fr;

  return (
    <AppShell isPublic>
      <div className="jm-info-page min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="jm-info-page-header">
            <Link
              href="/"
              className="jm-info-back mb-6 inline-flex items-center gap-2 px-3.5 py-2.5 text-sm text-muted-foreground group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t("common.back")}
            </Link>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground mb-3 sm:text-4xl">
              {activeContent.title}
            </h1>
            <p className="text-muted-foreground text-base leading-7 sm:text-lg">
              {activeContent.subtitle}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-5">
            {activeContent.sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={idx}
                  className="jm-info-card p-5 sm:p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="jm-info-icon-well p-2.5 rounded-2xl text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-heading text-xl font-semibold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  {section.body}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
