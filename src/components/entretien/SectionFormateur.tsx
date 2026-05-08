import type {
  AidesDemandees,
  ConditionsPratiques,
  DemarchesAdministratives,
  EntretienTripartite,
} from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { CaseOuiNon } from './CaseOuiNon';
import { cn } from '@/lib/utils';

/**
 * Sections de l'entretien réservées au formateur référent (CDC §5.2).
 *   - Démarches administratives (4 oui/non + remarques)
 *   - Conditions pratiques (4 textes)
 *   - Aides demandées (3 oui/non + autres)
 *   - Commentaire libre du formateur
 */

interface SectionFormateurProps {
  livretId: string;
  entretien: EntretienTripartite;
}

const DEMARCHES: Array<{ cle: keyof Omit<DemarchesAdministratives, 'remarques'>; libelle: string }> = [
  { cle: 'contratSigne', libelle: 'Contrat signé' },
  { cle: 'visiteMedicale', libelle: 'Visite médicale effectuée' },
  { cle: 'permisConduire', libelle: 'Permis de conduire' },
  { cle: 'voiture', libelle: 'Véhicule personnel' },
];

const CONDITIONS: Array<{ cle: keyof ConditionsPratiques; libelle: string; placeholder: string }> = [
  { cle: 'hebergementCentre', libelle: 'Hébergement pendant les périodes au CFA', placeholder: 'Domicile, internat, location…' },
  { cle: 'hebergementEntreprise', libelle: 'Hébergement pendant les périodes en entreprise', placeholder: 'Domicile, hébergement temporaire…' },
  { cle: 'transportCentre', libelle: 'Transport vers le CFA', placeholder: 'Métro, bus, voiture…' },
  { cle: 'transportEntreprise', libelle: "Transport vers l'entreprise", placeholder: 'Métro, bus, voiture…' },
];

const AIDES: Array<{ cle: keyof Omit<AidesDemandees, 'autres'>; libelle: string }> = [
  { cle: 'logement', libelle: 'Aide au logement' },
  { cle: 'premierEquipement', libelle: 'Aide au premier équipement' },
  { cle: 'permis', libelle: 'Aide au permis de conduire' },
];

export function SectionFormateur({ livretId, entretien }: SectionFormateurProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setDemarches = useLivretStore((s) => s.setDemarchesAdministratives);
  const setConditions = useLivretStore((s) => s.setConditionsPratiques);
  const setAides = useLivretStore((s) => s.setAidesDemandees);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);

  const editable =
    peutEditer(roleActif, 'entretien.demarches-administratives') &&
    peutEncoreEditer('formateur', entretien);
  const editableCommentaire =
    peutEditer(roleActif, 'entretien.commentaires-formateur') &&
    peutEncoreEditer('formateur', entretien);

  return (
    <section className="rounded-lg border border-border border-l-4 border-l-role-formateur bg-card p-4 space-y-5">
      <header>
        <h2 className="text-lg font-medium">Formateur référent</h2>
        <p className="text-xs text-muted-foreground">
          Réservé au formateur référent. Verrouillé après votre signature.
        </p>
      </header>

      {/* ── Démarches administratives ─────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Démarches administratives</h3>
        <div className="space-y-1">
          {DEMARCHES.map((d) => (
            <div
              key={d.cle}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
            >
              <span className="text-sm">{d.libelle}</span>
              <CaseOuiNon
                editable={editable}
                valeur={entretien.demarchesAdministratives[d.cle]}
                onChange={(v) => setDemarches(livretId, { [d.cle]: v })}
                ariaLabel={d.libelle}
              />
            </div>
          ))}
        </div>
        <ChampTexte
          label="Remarques"
          valeur={entretien.demarchesAdministratives.remarques ?? ''}
          editable={editable}
          onChange={(v) => setDemarches(livretId, { remarques: v })}
          placeholder="Précisions, dates, observations…"
        />
      </div>

      {/* ── Conditions pratiques ──────────────────────────────────────────── */}
      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Conditions pratiques</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {CONDITIONS.map((c) => (
            <ChampTexte
              key={c.cle}
              label={c.libelle}
              valeur={entretien.conditionsPratiques[c.cle] ?? ''}
              editable={editable}
              onChange={(v) => setConditions(livretId, { [c.cle]: v })}
              placeholder={c.placeholder}
            />
          ))}
        </div>
      </div>

      {/* ── Aides demandées ───────────────────────────────────────────────── */}
      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Aides demandées</h3>
        <div className="space-y-1">
          {AIDES.map((a) => (
            <div
              key={a.cle}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
            >
              <span className="text-sm">{a.libelle}</span>
              <CaseOuiNon
                editable={editable}
                valeur={entretien.aidesDemandees[a.cle]}
                onChange={(v) => setAides(livretId, { [a.cle]: v })}
                ariaLabel={a.libelle}
              />
            </div>
          ))}
        </div>
        <ChampTexte
          label="Autres aides / précisions"
          valeur={entretien.aidesDemandees.autres ?? ''}
          editable={editable}
          onChange={(v) => setAides(livretId, { autres: v })}
          placeholder="Préciser le type d'aide, l'organisme…"
        />
      </div>

      {/* ── Commentaire libre ──────────────────────────────────────────────── */}
      <div className="border-t border-border pt-3">
        <ChampTexte
          label="Commentaire libre du formateur référent"
          valeur={entretien.commentaires.formateur ?? ''}
          editable={editableCommentaire}
          onChange={(v) => setCommentaire(livretId, 'formateur', v)}
          placeholder="Synthèse, points de vigilance, recommandations…"
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
