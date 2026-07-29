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
              <strong>Responsable de la publication :</strong> Équipe JeryMotro<br />
              <strong>Contact email :</strong> <a href="mailto:contact@jerymotro.mg" className="text-primary hover:underline">contact@jerymotro.mg</a>
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
              <a href="mailto:contact@jerymotro.mg" className="text-primary hover:underline">
                contact@jerymotro.mg
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
              <strong>Tompon'andraikitra :</strong> Ny vondrona JeryMotro<br />
              <strong>Iraka mailaka :</strong> <a href="mailto:contact@jerymotro.mg" className="text-primary hover:underline">contact@jerymotro.mg</a>
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
          title: "Hanan-tsaina sy Fifanarahana",
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
              <a href="mailto:contact@jerymotro.mg" className="text-primary hover:underline">
                contact@jerymotro.mg
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
              <strong>Publication Director:</strong> JeryMotro Team<br />
              <strong>Contact email:</strong> <a href="mailto:contact@jerymotro.mg" className="text-primary hover:underline">contact@jerymotro.mg</a>
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
              <a href="mailto:contact@jerymotro.mg" className="text-primary hover:underline">
                contact@jerymotro.mg
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
      <div className="min-h-[calc(100vh-4rem)] bg-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t("common.back")}
            </Link>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground mb-4">
              {activeContent.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {activeContent.subtitle}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {activeContent.sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border/60 rounded-xl p-6 shadow-md backdrop-blur-md transition-all hover:border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
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
