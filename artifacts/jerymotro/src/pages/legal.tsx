import { Link } from "wouter";
import { ArrowLeft, Shield, Mail, Scale, FileText } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { AppShell } from "@/components/layout/AppShell";

export default function LegalPage() {
  const { lang, t } = useI18n();

  const content = {
    fr: {
      title: "Mentions Légales",
      subtitle: "Informations réglementaires concernant la plateforme JeryMotro.",
      sections: [
        {
          icon: Scale,
          title: "Éditeur de la plateforme",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              JeryMotro est un projet de surveillance environnementale à Madagascar.<br />
              <strong>Responsable de la publication :</strong> RANDRIAMANANTENA Tsiky Ny Antsa<br />
              <strong>Contact email :</strong> <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">randriamanantenatsikynyantsa@gmail.com</a>
            </p>
          ),
        },
        {
          icon: Shield,
          title: "Hébergement",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cette plateforme est hébergée de manière autonome et sécurisée.<br />
              <strong>Fournisseur DNS :</strong> DuckDNS<br />
              <strong>Infrastructure :</strong> Serveurs sécurisés situés dans l'espace économique européen.
            </p>
          ),
        },
        {
          icon: FileText,
          title: "Propriété Intellectuelle",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Le code source de l'application JeryMotro est protégé par les lois sur la propriété intellectuelle.
              Les données satellitaires proviennent du service NASA FIRMS et sont soumises aux conditions d'utilisation de la NASA.
            </p>
          ),
        },
        {
          icon: Mail,
          title: "Contact",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Pour toute question ou signalement d'anomalie concernant cette plateforme, veuillez nous écrire à :{" "}
              <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">
                randriamanantenatsikynyantsa@gmail.com
              </a>.
            </p>
          ),
        },
      ],
    },
    mg: {
      title: "Filazana Ara-dalàna",
      subtitle: "Fampahalalana momba ny lalàna mifehy ny sehatra JeryMotro.",
      sections: [
        {
          icon: Scale,
          title: "Mpamorona ny sehatra",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              JeryMotro dia tetikasa fanaraha-maso ny tontolo iainana eto Madagasikara.<br />
              <strong>Tompon'andraikitra :</strong> RANDRIAMANANTENA Tsiky Ny Antsa<br />
              <strong>Mailaka :</strong> <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">randriamanantenatsikynyantsa@gmail.com</a>
            </p>
          ),
        },
        {
          icon: Shield,
          title: "Fampiantranoana",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ity sehatra ity dia ampiantranoina amin'ny fomba azo antoka.<br />
              <strong>Mpanome DNS :</strong> DuckDNS<br />
              <strong>Fotodrafitrasa :</strong> Mpizara azo antoka any Eoropa.
            </p>
          ),
        },
        {
          icon: FileText,
          title: "Fifanarahana",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ny kaody loharanon'ny JeryMotro dia arovana amin'ny lalàna.
              Ny angon-drakitra sateraita dia avy amin'ny NASA FIRMS ary mifanaraka amin'ny fitsipika mifehy azy ireo.
            </p>
          ),
        },
        {
          icon: Mail,
          title: "Fifandraisana",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Raha misy fanontaniana dia azonao atao ny manoratra aminay :{" "}
              <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">
                randriamanantenatsikynyantsa@gmail.com
              </a>.
            </p>
          ),
        },
      ],
    },
    en: {
      title: "Legal Notice",
      subtitle: "Regulatory information about the JeryMotro platform.",
      sections: [
        {
          icon: Scale,
          title: "Platform Editor",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              JeryMotro is an environmental monitoring project for Madagascar.<br />
              <strong>Publication Director:</strong> RANDRIAMANANTENA Tsiky Ny Antsa<br />
              <strong>Contact email:</strong> <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">randriamanantenatsikynyantsa@gmail.com</a>
            </p>
          ),
        },
        {
          icon: Shield,
          title: "Hosting Provider",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              This platform is self-hosted securely.<br />
              <strong>DNS Provider:</strong> DuckDNS<br />
              <strong>Infrastructure:</strong> Secure servers located within the European Economic Area.
            </p>
          ),
        },
        {
          icon: FileText,
          title: "Intellectual Property",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              The source code of the JeryMotro application is protected by intellectual property laws.
              Satellite data is provided by the NASA FIRMS service and is subject to NASA's terms of use.
            </p>
          ),
        },
        {
          icon: Mail,
          title: "Contact Us",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              For any questions or support requests, please contact us at:{" "}
              <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">
                randriamanantenatsikynyantsa@gmail.com
              </a>.
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
