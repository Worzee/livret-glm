import type {
  Apprenti,
  DocumentAdministratif,
  FicheSuiviPeriode,
  LieuFiche,
  Livret,
  Role,
} from '@/types';
import { calculerAlerteR7, entretienSigneParTous } from './regles-entretien';
import { estMotifEntretienTripartite } from './organisation-suivi';
import { pointsAlerteNonTraites } from './points-alerte';
import { documentsApprentiVisibles, documentsNonAttestes } from './documents-administratifs';

/**
 * Centre d'alertes du tableau de bord (3 juillet 2026 — préparation démo
 * direction) : « qu'est-ce qui attend MON action ? », par rôle.
 *
 *   - apprenti / maître / formateur : signatures attendues (fiches dont la
 *     période est terminée, entretien initialisé), et pour le formateur :
 *     fiches signées à verrouiller, entretien à initialiser, alertes R7.
 *   - coordo / admin : alertes R7 du périmètre + affectations incomplètes
 *     (aucun droit pédagogique — doctrine inchangée).
 *
 * Le périmètre (`apprentis`) est celui du rôle actif, calculé en amont par
 * `apprentis-accessibles`. Pures fonctions — pas d'effet de bord.
 */

export type TypeAlerte =
  | 'alerte-r7'
  | 'point-alerte-entretien'
  | 'signature-entretien'
  | 'signature-fiche'
  | 'document-a-attester'
  | 'entretien-a-initialiser'
  | 'fiche-a-verrouiller'
  | 'affectation-incomplete';

export interface AlerteTableauBord {
  id: string;
  type: TypeAlerte;
  apprentiId: string;
  apprentiNom: string;
  message: string;
  /** Route de destination — l'apprenti·e est activé·e au clic. */
  lien: string;
  /**
   * Points d'alerte de l'entretien (`point-alerte-entretien`, 8 juillet 2026) :
   * id de la question de la trame + id du livret, pour la case « traité ».
   * Absents pour les autres types d'alerte.
   */
  questionId?: string;
  livretId?: string;
}

/** Signataires d'une fiche selon son lieu (1ᵉʳ juillet 2026). */
const SIGNATAIRES_FICHE: Record<LieuFiche, ReadonlyArray<'apprenti' | 'maitre' | 'formateur'>> = {
  entreprise: ['apprenti', 'maitre'],
  centre: ['apprenti', 'formateur'],
};

function libelleFiche(fiche: FicheSuiviPeriode, lieu: LieuFiche): string {
  return `Période ${fiche.numeroPeriode}${lieu === 'centre' ? ' en centre' : ''}`;
}

function lienFiche(fiche: FicheSuiviPeriode, lieu: LieuFiche): string {
  return lieu === 'centre'
    ? `/livret/fiches-suivi-centre/${fiche.id}`
    : `/livret/fiches-suivi/${fiche.id}`;
}

/** Une période est « échue » quand sa date de fin est passée. */
function periodeEchue(fiche: FicheSuiviPeriode, maintenant: Date): boolean {
  return Date.parse(fiche.dateFin) < maintenant.getTime();
}

/**
 * Alertes d'action pour le rôle actif sur son périmètre, triées par gravité
 * (R7 d'abord) puis par apprenti·e.
 */
export function alertesTableauBord(
  role: Role,
  apprentis: ReadonlyArray<Apprenti>,
  livrets: Readonly<Record<string, Livret>>,
  maintenant: Date = new Date(),
  documents: ReadonlyArray<DocumentAdministratif> = [],
): AlerteTableauBord[] {
  const alertes: AlerteTableauBord[] = [];
  const livretParApprenti = new Map(Object.values(livrets).map((l) => [l.apprentiId, l]));

  for (const apprenti of apprentis) {
    const livret = livretParApprenti.get(apprenti.id);
    if (!livret) continue;
    const nom = `${apprenti.prenom} ${apprenti.nom}`;

    // ── Documents administratifs non attestés (10 juillet 2026) ────────────
    //    Suivi de l'obligation par l'encadrement : formateur (documents non
    //    réservés — `documentsApprentiVisibles` filtre), coordo et admin
    //    (tous). L'apprenti·e a son bandeau dédié sur son tableau de bord.
    if (role === 'formateur' || role === 'coordo' || role === 'admin') {
      for (const d of documentsNonAttestes(
        documentsApprentiVisibles(documents, apprenti.id, role),
      )) {
        alertes.push({
          id: `document-${d.id}`,
          type: 'document-a-attester',
          apprentiId: apprenti.id,
          apprentiNom: nom,
          message: `Document « ${d.titre} » : signature de l'apprenti·e attendue`,
          lien: '/livret/documents',
        });
      }
    }

    // ── R7 : entretien tripartite en retard (formateur / coordo / admin) ───
    if (role === 'formateur' || role === 'coordo' || role === 'admin') {
      const r7 = calculerAlerteR7(apprenti, livret.entretien, maintenant);
      if (r7.declenchee) {
        alertes.push({
          id: `r7-${apprenti.id}`,
          type: 'alerte-r7',
          apprentiId: apprenti.id,
          apprentiNom: nom,
          message: `Entretien tripartite en retard de ${r7.joursDepasses} j (R7)`,
          lien: '/livret/organisation-suivi',
        });
      }
    }

    // ── Coordo / admin : suivi (points d'alerte de l'entretien) + affectations.
    //    Pas de droit pédagogique : marquer un point « traité » est un acte de
    //    gestion, l'entretien lui-même n'est pas touché (8 juillet 2026).
    if (role === 'coordo' || role === 'admin') {
      for (const point of pointsAlerteNonTraites(livret)) {
        alertes.push({
          id: `point-alerte-${apprenti.id}-${point.id}`,
          type: 'point-alerte-entretien',
          apprentiId: apprenti.id,
          apprentiNom: nom,
          message: point.libelle,
          lien: '/livret/entretien',
          questionId: point.id,
          livretId: livret.id,
        });
      }

      const manques: string[] = [];
      if (!apprenti.formationId) manques.push('formation');
      if (!apprenti.maitreApprentissageId) manques.push('maître / tuteur');
      if (!apprenti.formateurReferentId) manques.push('formateur référent');
      if (!apprenti.entrepriseId) manques.push('entreprise');
      if (manques.length > 0) {
        alertes.push({
          id: `affectation-${apprenti.id}`,
          type: 'affectation-incomplete',
          apprentiId: apprenti.id,
          apprentiNom: nom,
          message: `Affectation incomplète : ${manques.join(', ')}`,
          lien: '/admin/affectations',
        });
      }
      continue;
    }

    // ── Signature d'entretien attendue (apprenti / maître / formateur) ─────
    const entretien = livret.entretien;
    if (entretien && !entretienSigneParTous(entretien)) {
      if (!entretien.signatures[role as 'apprenti' | 'maitre' | 'formateur'].signe) {
        alertes.push({
          id: `sig-entretien-${apprenti.id}`,
          type: 'signature-entretien',
          apprentiId: apprenti.id,
          apprentiNom: nom,
          message: 'Entretien tripartite : votre signature est attendue',
          lien: '/livret/entretien',
        });
      }
    }

    // ── Signatures de fiches échues + verrouillages ─────────────────────────
    const parLieu: Array<[LieuFiche, FicheSuiviPeriode[]]> = [
      ['entreprise', livret.fichesSuivi],
      ['centre', livret.fichesSuiviCentre ?? []],
    ];
    for (const [lieu, fiches] of parLieu) {
      const signataires = SIGNATAIRES_FICHE[lieu];
      for (const fiche of fiches) {
        // Fiche entamée, période terminée, ma signature manquante.
        if (
          fiche.etat === 'en-cours' &&
          periodeEchue(fiche, maintenant) &&
          signataires.includes(role as 'apprenti' | 'maitre' | 'formateur') &&
          !fiche.signatures[role as 'apprenti' | 'maitre' | 'formateur'].signe
        ) {
          alertes.push({
            id: `sig-fiche-${fiche.id}`,
            type: 'signature-fiche',
            apprentiId: apprenti.id,
            apprentiNom: nom,
            message: `${libelleFiche(fiche, lieu)} terminée : votre signature est attendue`,
            lien: lienFiche(fiche, lieu),
          });
        }
        // Fiche signée par toutes les parties : le formateur la verrouille.
        if (role === 'formateur' && fiche.etat === 'signee') {
          alertes.push({
            id: `verrou-${fiche.id}`,
            type: 'fiche-a-verrouiller',
            apprentiId: apprenti.id,
            apprentiNom: nom,
            message: `${libelleFiche(fiche, lieu)} signée : à verrouiller`,
            lien: lienFiche(fiche, lieu),
          });
        }
      }
    }

    // ── Entretien à initialiser (formateur — `entretien.gestion`) ──────────
    if (role === 'formateur' && livret.entretien === null) {
      const evenementExiste = livret.organisationSuivi.evenements.some((evt) =>
        estMotifEntretienTripartite(evt.motif),
      );
      if (evenementExiste) {
        alertes.push({
          id: `init-entretien-${apprenti.id}`,
          type: 'entretien-a-initialiser',
          apprentiId: apprenti.id,
          apprentiNom: nom,
          message: 'Entretien tripartite planifié : à initialiser',
          lien: '/livret/entretien',
        });
      }
    }
  }

  const ORDRE: Record<TypeAlerte, number> = {
    'alerte-r7': 0,
    'point-alerte-entretien': 1,
    'signature-entretien': 2,
    'signature-fiche': 3,
    'document-a-attester': 4,
    'entretien-a-initialiser': 5,
    'fiche-a-verrouiller': 6,
    'affectation-incomplete': 7,
  };
  return alertes.sort(
    (a, b) => ORDRE[a.type] - ORDRE[b.type] || a.apprentiNom.localeCompare(b.apprentiNom, 'fr'),
  );
}
