import {
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  HardHat,
  ListChecks,
  UserCog,
} from 'lucide-react';
import type { EntretienTripartite, NiveauAppreciation } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer, type Ressource } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import {
  CRITERES_APPRECIATION,
  TRAME_ENTRETIEN,
  estReponseAlerte,
  pointsAlerteTrame,
  type QuestionTrame,
  type RubriqueTrame,
} from '@/lib/trame-entretien';
import { cn } from '@/lib/utils';
import { CaseOuiNon } from './CaseOuiNon';

/**
 * Trame officielle de l'entretien tripartite (« première visite »).
 * Référence : document GRETA (réunion juin 2026), cf. `lib/trame-entretien`.
 *
 * Rubriques thématiques (questions conjointes maître + apprenti·e), grille
 * d'appréciation enrichie des descriptions par niveau et récapitulatif des
 * « points d'alerte » (réponses « Non ») listant les actions à mener par le
 * GRETA CFA (DDF / coordonnateur).
 *
 * Co-saisie par le formateur référent et le maître / tuteur (`entretien.trame`)
 * tant que l'entretien n'est pas signé par les 3 parties (R9).
 */

interface SectionTrameEntretienProps {
  livretId: string;
  entretien: EntretienTripartite;
  /** R9 : signé par les 3 parties → entretien figé, tout en lecture seule. */
  entretienVerrouille: boolean;
}

// Chaque niveau porte sa couleur (du vert au rouge), alignée sur le
// sélecteur des attitudes professionnelles (1ᵉʳ juillet 2026).
const NIVEAUX: ReadonlyArray<{
  cle: NiveauAppreciation;
  symbole: string;
  classeSymbole: string;
  classesActif: string;
}> = [
  {
    cle: 'plusplus',
    symbole: '++',
    classeSymbole: 'text-appreciation-plusplus',
    classesActif:
      'border-appreciation-plusplus bg-appreciation-plusplus/10 ring-1 ring-appreciation-plusplus',
  },
  {
    cle: 'plus',
    symbole: '+',
    classeSymbole: 'text-appreciation-plus',
    classesActif: 'border-appreciation-plus bg-appreciation-plus/10 ring-1 ring-appreciation-plus',
  },
  {
    cle: 'moins',
    symbole: '−',
    classeSymbole: 'text-appreciation-moins',
    classesActif:
      'border-appreciation-moins bg-appreciation-moins/10 ring-1 ring-appreciation-moins',
  },
  {
    cle: 'moinsmoins',
    symbole: '−−',
    classeSymbole: 'text-appreciation-moinsmoins',
    classesActif:
      'border-appreciation-moinsmoins bg-appreciation-moinsmoins/10 ring-1 ring-appreciation-moinsmoins',
  },
];

export function SectionTrameEntretien({
  livretId,
  entretien,
  entretienVerrouille,
}: SectionTrameEntretienProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setReponseTrame = useLivretStore((s) => s.setReponseTrameEntretien);
  const setAppreciation = useLivretStore((s) => s.setAppreciationMaitre);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);

  const editableTrame = peutEditer(roleActif, 'entretien.trame') && !entretienVerrouille;
  const editableGrille =
    peutEditer(roleActif, 'entretien.appreciation-maitre') && !entretienVerrouille;

  const reponses = entretien.reponsesTrame;
  const alertes = pointsAlerteTrame(reponses);

  return (
    <div className="space-y-4">
      {/* Bandeau d'aide à la lecture : un « Non » = difficulté à traiter. */}
      <div
        role="note"
        className="bandeau-info-couleur-role flex items-start gap-2 rounded-lg border p-3 text-xs"
      >
        <ListChecks className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Trame officielle de la première visite tripartite (questions communes au maître / tuteur
          et à l'apprenti·e). Une réponse <strong>signalée en rouge</strong> indique une difficulté
          à traiter par le GRETA CFA (DDF / coordonnateur) ; elle est reprise dans le récapitulatif
          en bas de page.
        </p>
      </div>

      {TRAME_ENTRETIEN.map((rubrique) => (
        <RubriqueTrameCarte
          key={rubrique.id}
          rubrique={rubrique}
          reponses={reponses}
          editable={editableTrame}
          onChange={(questionId, valeur) => setReponseTrame(livretId, questionId, valeur)}
        />
      ))}

      {/* Synthèse — grille d'appréciation enrichie (maître / tuteur). */}
      <section className="rounded-lg border border-border border-l-4 border-l-role-maitre bg-card p-4 space-y-3">
        <header className="flex items-start gap-2">
          <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-role-maitre" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-medium text-role-maitre">
              Synthèse de la période et bilan de l'intégration
            </h2>
            <p className="text-xs text-muted-foreground">
              Appréciation du maître / tuteur : sélectionnez le niveau correspondant pour chaque
              critère.
            </p>
          </div>
        </header>
        {CRITERES_APPRECIATION.map((critere) => (
          <LigneAppreciation
            key={critere.cle}
            critere={critere}
            valeur={entretien.appreciationMaitre[critere.cle]}
            editable={editableGrille}
            onChange={(niveau) => setAppreciation(livretId, { [critere.cle]: niveau })}
          />
        ))}
      </section>

      {/* Juillet 2026 : l'évaluation des attitudes professionnelles a quitté
          l'entretien — elle se fait sur chaque fiche de période entreprise
          (cf. SectionAttitudesFiche). L'entretien conserve le CHOIX des
          attitudes (section « Choix des attitudes professionnelles »). */}

      {/* Récapitulatif des points d'alerte (réponses « Non »). */}
      <RecapAlertes alertes={alertes} />

      {/* Commentaires individuels de fin d'entretien (1ᵉʳ juillet 2026 : la
          zone commune devient 3 commentaires — un par partie, chacun figé à
          la signature de son auteur·rice). */}
      <section className="space-y-3">
        <header>
          <h2 className="text-base font-semibold">Commentaires</h2>
          <p className="text-xs text-muted-foreground">
            Un commentaire par partie : chacun est figé dès la signature de son auteur·rice.
          </p>
        </header>
        <div className="grid gap-3 md:grid-cols-3">
          {COMMENTAIRES_ENTRETIEN.map(({ role, ressource, titre, bordure, classeRole, Icon }) => {
            const editable =
              peutEditer(roleActif, ressource) &&
              peutEncoreEditer(role, entretien) &&
              !entretienVerrouille;
            const valeur = entretien.commentaires[role] ?? '';
            return (
              <article
                key={role}
                className={cn(
                  'rounded-lg border border-border border-l-4 bg-card p-3 space-y-2',
                  bordure,
                )}
              >
                <span
                  className={cn('inline-flex items-center gap-1.5 text-sm font-medium', classeRole)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {titre}
                </span>
                {editable ? (
                  <textarea
                    rows={3}
                    value={valeur}
                    onChange={(e) => setCommentaire(livretId, role, e.target.value)}
                    placeholder="Votre commentaire sur cet entretien…"
                    aria-label={`Commentaire : ${titre}`}
                    className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <p
                    className={cn(
                      'min-h-[4rem] whitespace-pre-wrap text-sm',
                      !valeur && 'text-muted-foreground italic',
                    )}
                  >
                    {valeur || 'Aucun commentaire.'}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** Cartes de commentaires individuels de l'entretien — une par partie. */
const COMMENTAIRES_ENTRETIEN: ReadonlyArray<{
  role: 'apprenti' | 'maitre' | 'formateur';
  ressource: Ressource;
  titre: string;
  bordure: string;
  classeRole: string;
  Icon: typeof GraduationCap;
}> = [
  {
    role: 'apprenti',
    ressource: 'entretien.commentaires-apprenti',
    titre: 'Apprenti·e',
    bordure: 'border-l-role-apprenti',
    classeRole: 'text-role-apprenti',
    Icon: GraduationCap,
  },
  {
    role: 'maitre',
    ressource: 'entretien.commentaires-maitre',
    titre: 'Maître / Tuteur',
    bordure: 'border-l-role-maitre',
    classeRole: 'text-role-maitre',
    Icon: HardHat,
  },
  {
    role: 'formateur',
    ressource: 'entretien.commentaires-formateur',
    titre: 'Formateur référent',
    bordure: 'border-l-role-formateur',
    classeRole: 'text-role-formateur',
    Icon: UserCog,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Rubrique thématique
// ─────────────────────────────────────────────────────────────────────────────

function RubriqueTrameCarte({
  rubrique,
  reponses,
  editable,
  onChange,
}: {
  rubrique: RubriqueTrame;
  reponses: Record<string, string | boolean | null>;
  editable: boolean;
  onChange: (questionId: string, valeur: string | boolean | null) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="text-base font-semibold">{rubrique.titre}</h2>
      {rubrique.intro && <p className="text-xs text-muted-foreground">{rubrique.intro}</p>}
      <div className="space-y-3">
        {rubrique.questions.map((q) => (
          <ChampTrame
            key={q.id}
            question={q}
            valeur={reponses[q.id]}
            editable={editable}
            onChange={(valeur) => onChange(q.id, valeur)}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Champ d'une question (texte ou oui/non, avec mise en évidence des « Non »)
// ─────────────────────────────────────────────────────────────────────────────

function ChampTrame({
  question,
  valeur,
  editable,
  onChange,
}: {
  question: QuestionTrame;
  valeur: string | boolean | null | undefined;
  editable: boolean;
  onChange: (valeur: string | boolean | null) => void;
}) {
  const id = `trame-q-${question.id}`;

  if (question.type === 'oui-non') {
    // 7 juillet 2026 : l'alerte suit la polarité de la question — « Non » sur
    // les questions positives, « Oui » sur la rubrique « Difficultés ».
    const estAlerte = estReponseAlerte(question, typeof valeur === 'boolean' ? valeur : undefined);
    // Pas de flex-wrap : un libellé long passe sur 2 lignes (flex-1) et le
    // sélecteur Oui/Non reste aligné à droite comme les autres questions.
    return (
      <div
        data-testid={`trame-q-${question.id}`}
        className={cn(
          'flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5',
          estAlerte ? 'border-amber-300 bg-amber-50' : 'border-transparent',
        )}
      >
        <span className="flex flex-1 items-center gap-1.5 text-sm">
          {estAlerte && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
          )}
          <span>{question.libelle}</span>
        </span>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <CaseOuiNon
            editable={editable}
            valeur={typeof valeur === 'boolean' ? valeur : null}
            onChange={(v) => onChange(v)}
            ariaLabel={question.libelle}
            polarite={question.alerteSi === 'oui' ? 'oui-negatif' : 'oui-positif'}
          />
          {estAlerte && question.aide && (
            <span className="text-xs text-amber-700">{question.aide}</span>
          )}
        </div>
      </div>
    );
  }

  const valeurTexte = typeof valeur === 'string' ? valeur : '';
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {question.libelle}
      </label>
      {question.aide && <p className="text-xs text-muted-foreground">{question.aide}</p>}
      {editable ? (
        <textarea
          id={id}
          rows={2}
          value={valeurTexte}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p
          className={cn(
            'text-sm whitespace-pre-wrap',
            !valeurTexte && 'text-muted-foreground italic',
          )}
        >
          {valeurTexte || 'Non renseigné'}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne de la grille d'appréciation (critère + 4 niveaux décrits)
// ─────────────────────────────────────────────────────────────────────────────

function LigneAppreciation({
  critere,
  valeur,
  editable,
  onChange,
}: {
  critere: (typeof CRITERES_APPRECIATION)[number];
  valeur: NiveauAppreciation | undefined;
  editable: boolean;
  onChange: (niveau: NiveauAppreciation) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{critere.libelle}</span>
      <div className="grid gap-1.5 sm:grid-cols-4">
        {NIVEAUX.map(({ cle, symbole, classeSymbole, classesActif }) => {
          const actif = valeur === cle;
          return (
            <button
              key={cle}
              type="button"
              disabled={!editable}
              onClick={() => onChange(cle)}
              aria-pressed={actif}
              data-testid={`appreciation-${critere.cle}-${cle}`}
              className={cn(
                'rounded-md border p-2 text-left text-xs transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                actif ? classesActif : 'border-input bg-background hover:bg-secondary',
                !editable && 'cursor-not-allowed opacity-70',
              )}
            >
              <span className={cn('block font-semibold', classeSymbole)}>{symbole}</span>
              <span className="block text-muted-foreground">{critere.descriptions[cle]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Récapitulatif des points d'alerte (réponses « Non »)
// ─────────────────────────────────────────────────────────────────────────────

function RecapAlertes({ alertes }: { alertes: QuestionTrame[] }) {
  if (alertes.length === 0) {
    return (
      <section
        data-testid="trame-recap-alertes"
        className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
      >
        <ClipboardCheck className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>Aucun point d'alerte : aucune réponse « Non » à ce stade de l'entretien.</p>
      </section>
    );
  }
  return (
    <section
      data-testid="trame-recap-alertes"
      className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        Points d'alerte ({alertes.length}) : action à mener par le GRETA CFA
      </h2>
      <ul className="list-disc space-y-1 pl-6 text-sm text-amber-900">
        {alertes.map((q) => (
          <li key={q.id}>
            {q.libelle}
            {q.aide ? ` : ${q.aide}` : ''}
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-700">
        Le formateur communique ces points au DDF ou au coordonnateur de la formation.
      </p>
    </section>
  );
}
