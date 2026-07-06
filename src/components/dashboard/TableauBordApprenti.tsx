import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HardHat,
  Notebook,
  Target,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import type { Apprenti, Livret } from '@/types';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useEntreprisesStore } from '@/store/useEntreprisesStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { useApprentiActifStore } from '@/store/useApprentiActifStore';
import { calculerResumeLivret, classesBadgeCas, libelleCas } from '@/lib/etat-livret';
import { calculerAlerteR7 } from '@/lib/regles-entretien';
import { libelleFichePeriode } from '@/lib/validation-fiche-periode';
import {
  echeanceEntretien,
  entretienTenu,
  joursRestants,
  periodeCourante,
  progressionFiches,
} from '@/lib/recap-apprenti';
import { cn } from '@/lib/utils';

/**
 * Tableau de bord récapitulatif de l'apprenti·e (18 juin 2026).
 *
 * Le rôle apprenti·e n'a qu'un seul livret : la liste de sélection du tableau
 * de bord générique n'a pas de sens pour lui/elle. Cette vue la remplace par
 * un récapitulatif personnel — formation, intervenants, échéances et
 * progression — avec des accès rapides vers les sections du livret.
 */

interface TableauBordApprentiProps {
  apprenti: Apprenti;
  livret: Livret;
}

function formatFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export function TableauBordApprenti({ apprenti, livret }: TableauBordApprentiProps) {
  const formations = useFormationsStore((s) => s.formations);
  const etablissements = useEtablissementsStore((s) => s.etablissements);
  const entreprises = useEntreprisesStore((s) => s.entreprises);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);
  const setApprentiActif = useApprentiActifStore((s) => s.setApprentiActif);
  const navigate = useNavigate();

  // L'apprenti·e est son propre apprenti·e actif·ve : on le/la sélectionne pour
  // que la navigation (sidebar + accès rapides) fonctionne sans clic préalable.
  useEffect(() => {
    setApprentiActif(apprenti.id);
  }, [apprenti.id, setApprentiActif]);

  const formation = formations[apprenti.formationId];
  const etablissement = formation ? etablissements[formation.lieuId] : undefined;
  const entreprise = entreprises[apprenti.entrepriseId];
  const histoEntreprises = apprenti.historiqueEntreprises ?? [];
  const derniereAffectation = histoEntreprises[histoEntreprises.length - 1];
  const maitre = maitres[apprenti.maitreApprentissageId];
  const maitreSecond = apprenti.maitreApprentissageSecondId
    ? maitres[apprenti.maitreApprentissageSecondId]
    : undefined;
  const formateur = formateurs[apprenti.formateurReferentId];

  const resume = calculerResumeLivret(apprenti, livret);
  const alerte = calculerAlerteR7(apprenti, livret.entretien);
  const echeance = echeanceEntretien(livret);
  const fichesCentre = livret.fichesSuiviCentre ?? [];
  const periodeEnt = periodeCourante(livret.fichesSuivi, 'entreprise');
  const periodeCen = periodeCourante(fichesCentre, 'centre');
  const progEnt = progressionFiches(livret.fichesSuivi, 'entreprise');
  const progCen = progressionFiches(fichesCentre, 'centre');
  const entretienRealise = entretienTenu(livret);
  const jrContrat = joursRestants(apprenti.contratFin);

  function aller(route: string) {
    setApprentiActif(apprenti.id);
    navigate(route);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Mon livret d'apprentissage</h1>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
              classesBadgeCas(resume.cas),
            )}
          >
            {libelleCas(resume.cas)}
          </span>
        </div>
        <p className="text-muted-foreground">
          Bonjour <strong>{apprenti.prenom}</strong>, voici un aperçu de votre formation, de vos
          échéances et de votre progression.
        </p>
      </header>

      {/* Alerte R7 — entretien tripartite tardif. */}
      {alerte.declenchee && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Votre <strong>entretien tripartite</strong> n'a pas encore eu lieu. Il était attendu
            avant le <strong>{formatFr(alerte.dateButoir)}</strong> ({alerte.joursDepasses} jour
            {alerte.joursDepasses > 1 ? 's' : ''} de retard). Rapprochez-vous de votre formateur
            référent.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Ma formation ─────────────────────────────────────────────── */}
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="h-4 w-4 text-role-apprenti" aria-hidden="true" />
            Ma formation
          </h2>
          <dl className="space-y-2 text-sm">
            <Ligne label="Diplôme préparé">
              {formation?.intitule ?? '—'}
              {formation?.annee ? ` (${formation.annee})` : ''}
            </Ligne>
            <Ligne label="Centre de formation" Icon={Building2}>
              {etablissement
                ? `${etablissement.nom}${etablissement.ville ? ` — ${etablissement.ville}` : ''}`
                : '—'}
            </Ligne>
            <Ligne label="Entreprise d'accueil" Icon={Briefcase}>
              {entreprise ? (
                <>
                  {entreprise.raisonSociale}
                  {entreprise.ville ? (
                    <span className="text-muted-foreground"> — {entreprise.ville}</span>
                  ) : null}
                  {derniereAffectation ? (
                    <span className="block text-xs font-normal text-muted-foreground">
                      depuis le {formatFr(derniereAffectation.dateIso)}
                      {histoEntreprises.length > 1 ? ' · changement en cours de contrat' : ''}
                    </span>
                  ) : null}
                </>
              ) : (
                '—'
              )}
            </Ligne>
            <Ligne label="Contrat">
              du {formatFr(apprenti.contratDebut)} au {formatFr(apprenti.contratFin)}
            </Ligne>
            <Ligne label="Maître / tuteur" Icon={HardHat}>
              {maitre ? (
                <>
                  {maitre.prenom} {maitre.nom}
                  {maitre.entreprise ? (
                    <span className="text-muted-foreground"> — {maitre.entreprise}</span>
                  ) : null}
                  {maitreSecond ? (
                    <span className="text-muted-foreground">
                      {' '}
                      et {maitreSecond.prenom} {maitreSecond.nom}
                    </span>
                  ) : null}
                </>
              ) : (
                '—'
              )}
            </Ligne>
            <Ligne label="Formateur référent" Icon={UserCog}>
              {formateur ? `${formateur.prenom} ${formateur.nom}` : '—'}
            </Ligne>
          </dl>
        </section>

        {/* ── Mes échéances ────────────────────────────────────────────── */}
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-role-apprenti" aria-hidden="true" />
            Mes échéances
          </h2>
          <dl className="space-y-2 text-sm">
            <Ligne label="Entretien tripartite" Icon={ClipboardList}>
              {echeance ? (
                <>
                  Entretien tripartite
                  {echeance.datePrevue ? (
                    <span className="text-muted-foreground">
                      {' '}
                      — prévu le {formatFr(echeance.datePrevue)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground"> — à planifier</span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Réalisé
                </span>
              )}
            </Ligne>
            <Ligne label="Période en entreprise" Icon={Notebook}>
              <PeriodeEnCours fiche={periodeEnt} />
            </Ligne>
            <Ligne label="Période en centre" Icon={GraduationCap}>
              <PeriodeEnCours fiche={periodeCen} />
            </Ligne>
            <Ligne label="Fin de contrat">
              {formatFr(apprenti.contratFin)}
              <span className="text-muted-foreground">
                {' '}
                {jrContrat > 0
                  ? `(dans ${jrContrat} jour${jrContrat > 1 ? 's' : ''})`
                  : '(échéance atteinte)'}
              </span>
            </Ligne>
          </dl>
        </section>

        {/* ── Ma progression ───────────────────────────────────────────── */}
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-role-apprenti" aria-hidden="true" />
            Ma progression
          </h2>
          <div className="space-y-3">
            <Jauge
              label="Périodes en entreprise signées"
              valeur={progEnt.signees}
              total={progEnt.total}
            />
            <Jauge
              label="Périodes en centre signées"
              valeur={progCen.signees}
              total={progCen.total}
            />
            <Jauge
              label="Entretien tripartite réalisé"
              valeur={entretienRealise ? 1 : 0}
              total={1}
            />
          </div>
        </section>
      </div>

      {/* ── Accès rapides ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Accès rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AccesRapide
            label="Fiches de suivi"
            Icon={CalendarRange}
            onClick={() => aller('/livret/organisation-suivi')}
          />
          <AccesRapide
            label="Période en Entreprise"
            Icon={Notebook}
            onClick={() => aller('/livret/fiches-suivi')}
          />
          <AccesRapide
            label="Période en Centre"
            Icon={GraduationCap}
            onClick={() => aller('/livret/fiches-suivi-centre')}
          />
          <AccesRapide
            label="Évaluation finale"
            Icon={Target}
            onClick={() => aller('/livret/evaluation-finale')}
          />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function Ligne({
  label,
  Icon,
  children,
}: {
  label: string;
  Icon?: typeof GraduationCap;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function PeriodeEnCours({ fiche }: { fiche: Parameters<typeof libelleFichePeriode>[0] | null }) {
  if (!fiche) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Toutes signées
      </span>
    );
  }
  return (
    <>
      {libelleFichePeriode(fiche)}
      <span className="text-muted-foreground">
        {' '}
        — du {formatFr(fiche.dateDebut)} au {formatFr(fiche.dateFin)}
      </span>
    </>
  );
}

function Jauge({ label, valeur, total }: { label: string; valeur: number; total: number }) {
  const pct = total > 0 ? Math.round((valeur / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="text-xs font-medium text-muted-foreground">
          {valeur}/{total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div
          className="h-full rounded-full bg-role-apprenti transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AccesRapide({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: typeof GraduationCap;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="carte-survol-role group flex items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-5 w-5 shrink-0 text-role-apprenti" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}
