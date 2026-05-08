import type { AppreciationMaitre, EntretienTripartite } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { CaseOuiNon } from './CaseOuiNon';
import { SelecteurAppreciation } from '@/components/common/SelecteurAppreciation';
import { cn } from '@/lib/utils';

/**
 * Sections de l'entretien réservées au maître d'apprentissage (CDC §5.2).
 *   - 3 questions textuelles + case oui/non "déjà formé un·e apprenti·e"
 *   - Grille d'appréciation : 4 critères × 4 niveaux (++, +, -, --)
 *   - Commentaire libre du maître
 */

interface SectionMaitreProps {
  livretId: string;
  entretien: EntretienTripartite;
}

const CRITERES_APPRECIATION: Array<{
  cle: keyof Omit<AppreciationMaitre, 'commentaires'>;
  libelle: string;
}> = [
  { cle: 'ponctualite', libelle: 'Ponctualité et assiduité' },
  { cle: 'comprehensionConsignes', libelle: 'Compréhension des consignes' },
  { cle: 'qualiteTravail', libelle: 'Qualité du travail fourni' },
  { cle: 'integration', libelle: "Intégration dans l'équipe" },
];

export function SectionMaitre({ livretId, entretien }: SectionMaitreProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setReponses = useLivretStore((s) => s.setReponsesMaitre);
  const setAppreciation = useLivretStore((s) => s.setAppreciationMaitre);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);

  const editableQuestions =
    peutEditer(roleActif, 'entretien.questions-maitre') &&
    peutEncoreEditer('maitre', entretien);
  const editableAppreciation =
    peutEditer(roleActif, 'entretien.appreciation-maitre') &&
    peutEncoreEditer('maitre', entretien);
  const editableCommentaire =
    peutEditer(roleActif, 'entretien.commentaires-maitre') &&
    peutEncoreEditer('maitre', entretien);

  return (
    <section className="rounded-lg border border-border border-l-4 border-l-role-maitre bg-card p-4 space-y-5">
      <header>
        <h2 className="text-lg font-medium">Maître d'apprentissage</h2>
        <p className="text-xs text-muted-foreground">
          Réservé au maître d'apprentissage. Verrouillé après votre signature.
        </p>
      </header>

      {/* ── Questions ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Questions</h3>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm">Avez-vous déjà formé un·e apprenti·e auparavant ?</span>
          <CaseOuiNon
            editable={editableQuestions}
            valeur={entretien.reponsesMaitre.dejaFormeApprenti}
            onChange={(v) => setReponses(livretId, { dejaFormeApprenti: v })}
            ariaLabel="Avez-vous déjà formé un·e apprenti·e ?"
          />
        </div>

        {entretien.reponsesMaitre.dejaFormeApprenti === true && (
          <ChampTexte
            label="Si oui, quels diplômes / combien d'apprenti·e·s ?"
            valeur={entretien.reponsesMaitre.siOuiDiplomes ?? ''}
            editable={editableQuestions}
            onChange={(v) => setReponses(livretId, { siOuiDiplomes: v })}
            placeholder="Ex : 3 CAP Cuisine sur 8 ans"
          />
        )}

        <ChampTexte
          label="Objectifs en termes d'embauche à l'issue du contrat"
          valeur={entretien.reponsesMaitre.objectifsEmbauche ?? ''}
          editable={editableQuestions}
          onChange={(v) => setReponses(livretId, { objectifsEmbauche: v })}
          placeholder="Embauche envisagée, conditions…"
        />

        <ChampTexte
          label="Organisation prévue de l'accueil et du tutorat"
          valeur={entretien.reponsesMaitre.organisationAccueil ?? ''}
          editable={editableQuestions}
          onChange={(v) => setReponses(livretId, { organisationAccueil: v })}
          placeholder="Tuteur·rice·s désigné·e·s, fréquence des points…"
        />
      </div>

      {/* ── Grille d'appréciation 4×4 ───────────────────────────────────────── */}
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-medium">
          Appréciation générale <span className="text-xs text-muted-foreground font-normal">(++ très bien · + bien · – à améliorer · – – insuffisant)</span>
        </h3>
        <div className="space-y-2">
          {CRITERES_APPRECIATION.map((c) => (
            <div
              key={c.cle}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
            >
              <span className="text-sm">{c.libelle}</span>
              <SelecteurAppreciation
                editable={editableAppreciation}
                valeur={entretien.appreciationMaitre[c.cle]}
                onChange={(v) => setAppreciation(livretId, { [c.cle]: v ?? undefined })}
                ariaLabel={c.libelle}
              />
            </div>
          ))}
        </div>
        <ChampTexte
          label="Commentaires d'appréciation"
          valeur={entretien.appreciationMaitre.commentaires ?? ''}
          editable={editableAppreciation}
          onChange={(v) => setAppreciation(livretId, { commentaires: v })}
          placeholder="Précisions sur l'appréciation portée."
        />
      </div>

      {/* ── Commentaire libre ───────────────────────────────────────────────── */}
      <div className="space-y-1 border-t border-border pt-3">
        <ChampTexte
          label="Commentaire libre du maître d'apprentissage"
          valeur={entretien.commentaires.maitre ?? ''}
          editable={editableCommentaire}
          onChange={(v) => setCommentaire(livretId, 'maitre', v)}
          placeholder="Tout ce que vous souhaitez ajouter…"
          rows={3}
        />
      </div>
    </section>
  );
}

interface ChampTexteProps {
  label: string;
  valeur: string;
  editable: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

function ChampTexte({ label, valeur, editable, onChange, placeholder, rows = 2 }: ChampTexteProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium block">{label}</label>
      {editable ? (
        <textarea
          rows={rows}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p className={cn('text-sm whitespace-pre-wrap', !valeur && 'text-muted-foreground italic')}>
          {valeur || 'Non renseigné'}
        </p>
      )}
    </div>
  );
}
