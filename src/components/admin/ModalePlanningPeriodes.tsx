import { useEffect, useId, useMemo, useState } from 'react';
import { AlertCircle, CalendarRange, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Formation, LieuFiche, Livret, PeriodeFormation } from '@/types';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import {
  evaluerVerrouPeriode,
  libellePeriode,
  type SaisiePeriode,
  validerSaisiePeriode,
} from '@/lib/validation-periode-formation';
import { cn } from '@/lib/utils';

/**
 * Modale de gestion du planning d'une formation (refonte mai 2026 —
 * chantier #1, étendue 17 juin 2026 : périodes en centre de formation).
 *
 * Affiche **deux** plannings de périodes indépendants — en entreprise et en
 * centre — via le sous-composant `SectionPeriodes`. Chaque période génère une
 * fiche dans le livret de chaque apprenti·e de la promo (entreprise →
 * `fichesSuivi`, centre → `fichesSuiviCentre`).
 *
 * Juillet 2026 : la section « Nombre d'entretiens tripartites » a disparu —
 * l'entretien tripartite est désormais unique et obligatoire pour toutes les
 * formations (le suivi ultérieur passe par les fiches de suivi).
 */

interface ModalePlanningPeriodesProps {
  ouvert: boolean;
  formation: Formation;
  onFermer: () => void;
}

const SAISIE_VIDE: SaisiePeriode = { titre: '', dateDebut: '', dateFin: '' };

export function ModalePlanningPeriodes({
  ouvert,
  formation,
  onFermer,
}: ModalePlanningPeriodesProps) {
  const livretsTous = useLivretStore((s) => s.livrets);
  const apprentis = useUtilisateursStore((s) => s.apprentis);

  const titreId = useId();

  // Livrets de la promo (pour évaluer le verrou modif/suppression).
  const livretsPromo = useMemo(
    () =>
      Object.values(livretsTous).filter(
        (l) => apprentis[l.apprentiId]?.formationId === formation.id,
      ),
    [livretsTous, apprentis, formation.id],
  );

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titreId}
    >
      <button
        type="button"
        aria-label="Fermer la modale"
        onClick={onFermer}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      <div className="relative w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <CalendarRange className="h-5 w-5 shrink-0 texte-couleur-role" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Planning des périodes : {formation.intitule}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formation.annee} · {livretsPromo.length} apprenti·e·s rattaché·e·s. Chaque période
                génère une fiche dans le livret de chacun·e.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-4">
          {/* Périodes en entreprise ─────────────────────────────────────── */}
          <SectionPeriodes formation={formation} lieu="entreprise" livretsPromo={livretsPromo} />

          {/* Périodes en centre de formation (17 juin 2026) ─────────────── */}
          <SectionPeriodes formation={formation} lieu="centre" livretsPromo={livretsPromo} />
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section d'un planning (entreprise ou centre) : liste + formulaire d'édition
// ─────────────────────────────────────────────────────────────────────────────

interface SectionPeriodesProps {
  formation: Formation;
  lieu: LieuFiche;
  livretsPromo: Livret[];
}

function SectionPeriodes({ formation, lieu, livretsPromo }: SectionPeriodesProps) {
  const ajouter = useFormationsStore((s) => s.ajouterPeriode);
  const modifier = useFormationsStore((s) => s.modifierPeriode);
  const supprimer = useFormationsStore((s) => s.supprimerPeriode);
  const formationCourante = useFormationsStore((s) => s.formations[formation.id] ?? formation);

  const estCentre = lieu === 'centre';
  const cle = estCentre ? 'periodesCentre' : 'periodes';
  // Préfixe des `data-testid` : l'entreprise conserve `planning-*` (specs E2E
  // existantes), le centre prend `planning-centre-*` pour éviter les doublons.
  const tid = estCentre ? 'planning-centre' : 'planning';

  const [editionId, setEditionId] = useState<string | null>(null);
  const [saisie, setSaisie] = useState<SaisiePeriode>(SAISIE_VIDE);
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);
  // 1ᵉʳ juillet 2026 : le formulaire d'ajout est masqué par défaut derrière
  // un bouton ; les erreurs de champ vide n'apparaissent qu'après une
  // tentative d'ajout (et non dès l'ouverture du formulaire).
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [tentative, setTentative] = useState(false);

  const periodes = useMemo(
    () => [...formationCourante[cle]].sort((a, b) => a.numero - b.numero),
    [formationCourante, cle],
  );

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  function reinitFormulaire() {
    setEditionId(null);
    setSaisie(SAISIE_VIDE);
    setErreurServeur(null);
    setTentative(false);
    setFormulaireOuvert(false);
  }

  function commencerEdition(p: PeriodeFormation) {
    setEditionId(p.id);
    setSaisie({ titre: p.titre ?? '', dateDebut: p.dateDebut, dateFin: p.dateFin });
    setErreurServeur(null);
    setTentative(false);
    setFormulaireOuvert(true);
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreurServeur(null);
    // Le bouton reste cliquable : une soumission invalide révèle les erreurs
    // (pattern tentativeSoumission du projet) sans rien écrire dans le store.
    if (!validation.ok) {
      setTentative(true);
      return;
    }
    const result = editionId
      ? modifier(formation.id, editionId, saisie, lieu)
      : ajouter(formation.id, saisie, lieu);
    if (!result.ok) {
      setErreurServeur(result.raison ?? 'Erreur inconnue.');
      return;
    }
    reinitFormulaire();
  }

  function declencherSuppression(p: PeriodeFormation) {
    if (confirmationSuppression !== p.id) {
      setConfirmationSuppression(p.id);
      return;
    }
    const result = supprimer(formation.id, p.id, lieu);
    setConfirmationSuppression(null);
    if (!result.ok) {
      setErreurServeur(result.raison ?? 'Suppression refusée.');
    }
  }

  // Validation live pour feedback dans le formulaire d'ajout/édition.
  const validation = validerSaisiePeriode(saisie, formationCourante[cle], editionId ?? undefined);
  // Erreur d'un champ affichée seulement après une tentative d'ajout, ou dès
  // que le champ porte une valeur incohérente (R11/R12) — jamais à l'ouverture.
  const erreurDebut =
    tentative || saisie.dateDebut !== '' ? validation.erreurs.dateDebut : undefined;
  const erreurFin = tentative || saisie.dateFin !== '' ? validation.erreurs.dateFin : undefined;

  const titreListe = estCentre
    ? `Périodes en centre définies (${periodes.length})`
    : `Périodes en entreprise définies (${periodes.length})`;
  const libelleAjout = estCentre
    ? 'Ajouter une période en centre'
    : 'Ajouter une période en entreprise';
  const titreForm = editionId
    ? estCentre
      ? 'Modifier la période en centre'
      : 'Modifier la période'
    : libelleAjout;
  const placeholderTitre = estCentre ? "Ex : Regroupement d'automne" : "Ex : Période d'automne";

  return (
    <section className="space-y-2" data-testid={`section-periodes-${lieu}`}>
      <h3 className="text-sm font-medium">{titreListe}</h3>
      {periodes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
          Aucune période planifiée{estCentre ? ' en centre' : ''}. Ajoutez la première via le bouton
          ci-dessous.
        </p>
      ) : (
        <ul className="space-y-2">
          {periodes.map((p) => {
            const verrouModif = evaluerVerrouPeriode(p, livretsPromo, 'modification', lieu);
            const verrouSuppr = evaluerVerrouPeriode(p, livretsPromo, 'suppression', lieu);
            const enEdition = editionId === p.id;
            const enConfirmation = confirmationSuppression === p.id;

            return (
              <li
                key={p.id}
                className={cn(
                  'flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm',
                  enEdition && 'actif-couleur-role',
                  enConfirmation && 'border-red-300 bg-red-50/40',
                )}
              >
                <CalendarRange
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{libellePeriode(p)}</p>
                  <p className="text-xs text-muted-foreground">
                    Du {formaterDateCourte(p.dateDebut)} au {formaterDateCourte(p.dateFin)}
                  </p>
                  {!verrouModif.peut && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] italic text-amber-700">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      {verrouModif.raison}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!verrouModif.peut}
                  onClick={() => commencerEdition(p)}
                  aria-label={`Modifier ${libellePeriode(p)}`}
                  className={cn(
                    'rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground',
                    !verrouModif.peut && 'opacity-40 cursor-not-allowed hover:bg-background',
                  )}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={!verrouSuppr.peut}
                  onClick={() => declencherSuppression(p)}
                  aria-label={
                    enConfirmation
                      ? `Confirmer la suppression de ${libellePeriode(p)}`
                      : `Supprimer ${libellePeriode(p)}`
                  }
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                    enConfirmation
                      ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                      : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                    !verrouSuppr.peut && 'opacity-40 cursor-not-allowed hover:bg-background',
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {enConfirmation && <span className="text-xs font-medium">Confirmer</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Formulaire ajout / édition — masqué par défaut derrière un bouton
          (1ᵉʳ juillet 2026). ─────────────────────────────────────────── */}
      {!formulaireOuvert ? (
        <button
          type="button"
          onClick={() => setFormulaireOuvert(true)}
          data-testid={`${tid}-ouvrir-ajout`}
          className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {libelleAjout}
        </button>
      ) : (
        <div className="rounded-md border border-border bg-secondary/20 p-3 space-y-3">
          <h4 className="text-sm font-medium">{titreForm}</h4>
          <form onSubmit={soumettre} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-medium" htmlFor={`${tid}-titre`}>
                  Titre <span className="text-muted-foreground">(optionnel)</span>
                </label>
                <input
                  id={`${tid}-titre`}
                  type="text"
                  value={saisie.titre ?? ''}
                  onChange={(e) => setSaisie((s) => ({ ...s, titre: e.target.value }))}
                  placeholder={placeholderTitre}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid={`${tid}-titre`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor={`${tid}-debut`}>
                  Date de début <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${tid}-debut`}
                  type="date"
                  value={saisie.dateDebut}
                  onChange={(e) => setSaisie((s) => ({ ...s, dateDebut: e.target.value }))}
                  className={cn(
                    'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                    erreurDebut ? 'border-red-400' : 'border-input',
                  )}
                  data-testid={`${tid}-debut`}
                />
                {erreurDebut && (
                  <p className="text-xs text-red-700" role="alert">
                    {erreurDebut}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor={`${tid}-fin`}>
                  Date de fin <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${tid}-fin`}
                  type="date"
                  value={saisie.dateFin}
                  onChange={(e) => setSaisie((s) => ({ ...s, dateFin: e.target.value }))}
                  className={cn(
                    'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                    erreurFin ? 'border-red-400' : 'border-input',
                  )}
                  data-testid={`${tid}-fin`}
                />
                {erreurFin && (
                  <p className="text-xs text-red-700" role="alert">
                    {erreurFin}
                  </p>
                )}
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bouton-plein-couleur-role px-3 py-1.5 text-sm font-medium"
                  data-testid={`${tid}-soumettre`}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {editionId ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={reinitFormulaire}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
            {erreurServeur && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-2 py-1.5 text-xs text-red-900"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {erreurServeur}
              </p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}

function formaterDateCourte(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
