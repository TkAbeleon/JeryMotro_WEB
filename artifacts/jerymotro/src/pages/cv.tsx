import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, GraduationCap, Briefcase, Award, Heart, User, Code, FileDown, Globe } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { AppShell } from "@/components/layout/AppShell";

export default function CvPage() {
  const { lang, t } = useI18n();

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell isPublic>
      <div className="min-h-[calc(100vh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8 text-foreground print:bg-white print:text-black">
        <div className="max-w-4xl mx-auto">
          {/* Header Controls (Hidden on print) */}
          <div className="flex justify-between items-center mb-8 print:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t("common.back")}
            </Link>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/10"
            >
              <FileDown className="w-4 h-4" />
              <span>{lang === "mg" ? "Hamoaka PDF / Hanonta" : lang === "en" ? "Print / Export PDF" : "Imprimer / Exporter PDF"}</span>
            </button>
          </div>

          {/* Main CV Container */}
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xl print:shadow-none print:border-none">
            {/* Identity Hero Banner */}
            <div className="bg-primary/10 border-b border-border/80 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 print:bg-green-50 print:border-b-2">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-primary/20 shadow-md flex-shrink-0">
                <img
                  src="/profil.jpg"
                  alt="RANDRIAMANANTENA Tsiky Ny Antsa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80";
                  }}
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground print:text-green-900">
                  RANDRIAMANANTENA Tsiky Ny Antsa
                </h1>
                <p className="text-primary font-semibold text-lg mt-1 print:text-green-700">
                  {lang === "mg" ? "Mpianatra Licence 3 Génie Logiciel" : lang === "en" ? "L3 Software Engineering Student" : "Étudiant Licence 3 Génie Logiciel"}
                </p>
                <div className="text-muted-foreground text-xs mt-1 print:text-neutral-600">
                  ESP-Antsirabe (École Supérieure Polytechnique d'Antsirabe)
                </div>

                {/* Quick Contacts */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-mono">+261 34 86 046 17</span>
                  </span>
                  <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="font-mono">randriamanantenatsikynyantsa@gmail.com</span>
                  </a>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Mahazoarivo Antsirabe</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Grid Layout (Sidebar + Main) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12">
              {/* Sidebar Section */}
              <aside className="lg:col-span-4 bg-secondary/30 border-r border-border/80 p-6 space-y-8 print:col-span-4 print:bg-neutral-50 print:border-r-2">
                {/* Profile Objective */}
                <div>
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>{lang === "mg" ? "Mombamomba" : lang === "en" ? "Profile" : "Profil"}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lang === "mg"
                      ? "Mpianatra injeniera amin'ny génie logiciel amin'ny hoavy. Mampiaraka ny fahaiza-manao ara-teknika amin'ny traikefa amin'ny fitantanana tetikasa sy ny fitarihana kanto."
                      : lang === "en"
                        ? "Future software engineer, combining technical skills with practical experience in project management, media, and artistic direction."
                        : "Futur ingénieur en génie logiciel, j'allie mes compétences techniques à une expérience pratique en gestion de projet, en animation radio et en direction artistique."}
                  </p>
                </div>

                {/* Personal Skills / Languages */}
                <div>
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span>{lang === "mg" ? "Fahaiza-manao" : lang === "en" ? "Key Skills" : "Compétences"}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      lang === "mg" ? "Fitantanana tetikasa" : lang === "en" ? "Project Management" : "Gestion d'équipe",
                      lang === "mg" ? "Fifandraisana" : lang === "en" ? "Communication" : "Communication",
                      lang === "mg" ? "Fandraisana andraikitra" : lang === "en" ? "Responsibility" : "Responsibilité",
                      lang === "mg" ? "Teny Malagasy" : lang === "en" ? "Malagasy Language" : "Malagasy (Maternelle)",
                      lang === "mg" ? "Teny Frantsay" : lang === "en" ? "French Language" : "Français (Courant)",
                    ].map((skill) => (
                      <span
                        key={skill}
                        className="bg-background border border-border/80 text-foreground text-xs font-medium px-2.5 py-1 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>{lang === "mg" ? "Réseaux / Fifandraisana" : lang === "en" ? "Social Networks" : "Réseaux sociaux"}</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <a
                      href="https://github.com/TkAbeleon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <GithubIcon />
                      <div>
                        <div className="font-semibold text-foreground">GitHub</div>
                        <div className="text-xs font-mono">github.com/TkAbeleon</div>
                      </div>
                    </a>

                    <a
                      href="https://www.linkedin.com/in/tsiky-ny-antsa-randriamanantena-7451b328a/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group mt-3"
                    >
                      <LinkedInIcon />
                      <div>
                        <div className="font-semibold text-foreground">LinkedIn</div>
                        <div className="text-xs">Profil professionnel</div>
                      </div>
                    </a>

                    <a
                      href="https://www.facebook.com/abeleon.tk/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group mt-3"
                    >
                      <FacebookIcon />
                      <div>
                        <div className="font-semibold text-foreground">Facebook</div>
                        <div className="text-xs font-mono">abeleon.tk</div>
                      </div>
                    </a>
                  </div>
                </div>
              </aside>

              {/* Main Section */}
              <main className="lg:col-span-8 p-6 sm:p-8 space-y-8 print:col-span-8">
                {/* Experience */}
                <section>
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2 border-b border-border/60 pb-1.5 print:text-green-800">
                    <Briefcase className="w-4.5 h-4.5" />
                    <span>{lang === "mg" ? "Traikefa" : lang === "en" ? "Experiences" : "Expériences professionnelles"}</span>
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <h4 className="font-heading font-bold text-foreground text-base">
                          {lang === "mg" ? "Internship — Feon'ny Firaisankina Radio" : "Stage — Feon'ny Firaisankina Radio"}
                        </h4>
                        <span className="text-xs text-muted-foreground font-semibold bg-secondary px-2 py-0.5 rounded-md">
                          Oct 2025 - Jan 2026
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 pl-1">
                        <li>{lang === "mg" ? "Famoronana sy fanatanterahana tranonkala fitantanana ankoho" : lang === "en" ? "Design and implementation of a web application for classifieds management" : "Conception et réalisation d'un site web de gestion d'annonces"}</li>
                        <li>{lang === "mg" ? "Fandraisana anjara amin'ny fanitsiana fandaharana radio" : lang === "en" ? "Assisted in audio editing and mixing for radio broadcasts" : "Contribution au montage des émissions radio"}</li>
                        <li>{lang === "mg" ? "Fahatakarana ny fifandraisana ara-mediatika" : lang === "en" ? "Acquired practical understanding of media communication workflows" : "Acquisition d'une compréhension pratique sur la communication médiatique"}</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <h4 className="font-heading font-bold text-foreground text-base">
                          {lang === "mg" ? "Animateur / Réalisateur — Feon'ny Firaisankina Radio" : "Réalisateur & Animateur — Feon'ny Firaisankina Radio"}
                        </h4>
                        <span className="text-xs text-muted-foreground font-semibold bg-secondary px-2 py-0.5 rounded-md">
                          2019 - 2022
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lang === "mg" ? "Mpanatontosa sy mpanentana fandaharana ho an'ny ankizy 'Ankizy Miaralalao'" : lang === "en" ? "Producer and host of the children's radio show 'Ankizy Miaralalao'" : "Réalisateur et animateur d'une émission pour enfants 'Ankizy Miaralalao'"}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <h4 className="font-heading font-bold text-foreground text-base">
                          {lang === "mg" ? "Mpanorina — Vondrona Mozika 'Miantsa Fiderana'" : "Fondateur & Président — Groupe Musical 'Miantsa Fiderana'"}
                        </h4>
                        <span className="text-xs text-muted-foreground font-semibold bg-secondary px-2 py-0.5 rounded-md">
                          2022 - 2024
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 pl-1">
                        <li>{lang === "mg" ? "Nanorina vondrona mpihira tao amin'ny Lycée Luthérien Betafo" : lang === "en" ? "Founded a choral and music group at Lycée Privé Luthérien de Betafo" : "Fondateur du groupe musical au sein du Lycée Privé Luthérien de Betafo"}</li>
                        <li>{lang === "mg" ? "Prezida sy lehiben'ny amboara (chef de chœur) nandritra ny roa taona" : lang === "en" ? "Served as president and choir director for two years" : "Président de cet ensemble musical durant deux ans, tout en assurant les fonctions de chef de chœur"}</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Formation */}
                <section>
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2 border-b border-border/60 pb-1.5 print:text-green-800">
                    <GraduationCap className="w-4.5 h-4.5" />
                    <span>{lang === "mg" ? "Fianarana sy Diampianarana" : lang === "en" ? "Education" : "Formation"}</span>
                  </h2>

                  <div className="space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <div>
                        <h4 className="font-heading font-bold text-foreground text-base">
                          {lang === "mg" ? "Licence 3 Génie Logiciel" : lang === "en" ? "Bachelor of Science in Software Engineering (L3)" : "Licence 3 Génie Logiciel"}
                        </h4>
                        <p className="text-sm text-muted-foreground">ESP-Antsirabe (École Supérieure Polytechnique d'Antsirabe)</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold bg-secondary px-2 py-0.5 rounded-md">
                        2025 - 2026
                      </span>
                    </div>

                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <div>
                        <h4 className="font-heading font-bold text-foreground text-base">
                          {lang === "mg" ? "Baccalauréat Serie D (Siantifika)" : lang === "en" ? "Scientific High School Baccalaureate (Série D)" : "Baccalauréat Série D"}
                        </h4>
                        <p className="text-sm text-muted-foreground">Lycée Privé Luthérien Betafo</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold bg-secondary px-2 py-0.5 rounded-md">
                        2023
                      </span>
                    </div>
                  </div>
                </section>

                {/* Projects */}
                <section>
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2 border-b border-border/60 pb-1.5 print:text-green-800">
                    <Code className="w-4.5 h-4.5" />
                    <span>{lang === "mg" ? "Tetikasa Natao" : lang === "en" ? "Academic Projects" : "Projets phares"}</span>
                  </h2>

                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>
                      <strong className="text-foreground">JeryMotro</strong> — {lang === "mg" ? "Tetikasa fanaraha-maso ny afo sateraita eto Madagasikara (XGBoost, React, Node.js)" : lang === "en" ? "Satellite wildfire surveillance platform for Madagascar using XGBoost, React, and Node.js" : "Plateforme intelligente de surveillance et d'alerte précoce des feux de brousse à Madagascar (XGBoost, React, Node.js)."}
                    </li>
                    <li>
                      <strong className="text-foreground">CorpusManagerWebUI</strong> — {lang === "mg" ? "Fampiharana Qt/C++ hitantanana feo sy fiteny" : lang === "en" ? "C++ / Qt native application for vocal corpus management with modern styling" : "Application native C++ / Qt de gestion de corpus vocaux avec interface utilisateur moderne."}
                    </li>
                    <li>
                      <strong className="text-foreground">Malagasy Linguistic Analysis</strong> — {lang === "mg" ? "Famakafakana ny teny malagasy sy famakiana ny Chiffre de Vigenère amin'ny Python" : lang === "en" ? "Python toolkit for Malagasy linguistic analysis and Vigenère cipher cryptanalysis" : "Outils en Python pour l'analyse linguistique de la langue malgache et cryptanalyse du chiffre de Vigenère."}
                    </li>
                    <li>
                      <strong className="text-foreground">Site Web Dynamique</strong> — {lang === "mg" ? "Tranonkala PHP/MySQL hitantanana feo sy mozika" : lang === "en" ? "PHP / MySQL dynamic website for music score management" : "Site web dynamique en PHP / MySQL pour la gestion de partitions de musique."}
                    </li>
                  </ul>
                </section>

                {/* Interests / Loisirs */}
                <section>
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2 border-b border-border/60 pb-1.5 print:text-green-800">
                    <Heart className="w-4.5 h-4.5" />
                    <span>{lang === "mg" ? "Finakafakàna sy Loisirs" : lang === "en" ? "Interests & Hobbies" : "Domaines d'intérêt & Loisirs"}</span>
                  </h2>

                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <p className="mb-2">
                      <strong className="text-foreground">{lang === "mg" ? "Mozika" : "Musique"} :</strong>{" "}
                      {lang === "mg"
                        ? "Milalao piano sy orgue, mitarika antoko mpihira ary mamorona feon-kira."
                        : lang === "en"
                          ? "Piano and organ performance, choir directing, and musical composition."
                          : "Pratique assidue du piano et de l'orgue, direction de chœur et composition musicale."}
                    </p>
                    <p className="mb-2">
                      <strong className="text-foreground">{lang === "mg" ? "Haisoratra" : "Littérature"} :</strong>{" "}
                      {lang === "mg"
                        ? "Mpamponina ao amin'ny HAVATSA-UPEM (Fikambanan'ny mpanoratra sy ny poeta malagasy)."
                        : lang === "en"
                          ? "Member of HAVATSA-UPEM (Union of Malagasy Poets and Writers), writing malagasy poetry."
                          : "Membre de l'association HAVATSA-UPEM (Union des Poètes et Écrivains Malgaches), écriture poétique."}
                    </p>
                    <p>
                      <strong className="text-foreground">{lang === "mg" ? "Fanatanjahantena" : "Sport"} :</strong>{" "}
                      {lang === "mg"
                        ? "Footing (hazakazaka) ho an'ny fahasalamana sy faharetana."
                        : lang === "en"
                          ? "Regular footing for endurance and physical discipline."
                          : "Pratique régulière du footing (course à pied) pour l'endurance et le bien-être."}
                    </p>
                  </div>
                </section>
              </main>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Inline SVGs for social icons to ensure complete safety and standalone rendering ───

function GithubIcon() {
  return (
    <svg className="w-5 h-5 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-5 h-5 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
