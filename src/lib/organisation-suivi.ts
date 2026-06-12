import type {
  EvenementOrganisationSuivi,
  MotifOrganisationSuivi,
  NumeroEntretien,
  Role,
} from '@/types';

/**
 * Catalogue des motifs disponibles pour l'organisation du suivi (CDC §5.1).
 * Référence : refonte modulaire mai 2026.
 *
 * Chaque entrée porte les métadonnées d'affichage (libellé, description, aide
 * de saisie pour le commentaire). L'ordre de la liste détermine l'ordre dans
 * le sélecteur d'ajout.
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 */

export interface MetadonneesMotif {
  motif: MotifOrganisationSuivi;
  libelle: string;
  description: string;
  /** Aide affichée comme placeholder dans le textarea de commentaire. */
  placeholderCommentaire: string;
}

export const MOTIFS_ORGANISATION_SUIVI: ReadonlyArray<MetadonneesMotif> = [
  {
    motif: 'reunion-rentree',
    libelle: 'Réunion de rentrée',
    description: 'Présentation de la promo, des intervenant·e·s, des modalités générales.',
    placeholderCommentaire: 'Lieu, horaires, intervenants…',
  },
  {
    motif: 'entretien-individuel',
    libelle: 'Entretien individuel',
    description: 'Premier entretien individuel avec chaque apprenti·e.',
    placeholderCommentaire: 'Modalités (RDV individuel, semaine type…)',
  },
  {
    motif: 'accueil-tuteur',
    libelle: 'Accueil tuteur',
    description: "Journée d'information dédiée aux maîtres / tuteurs.",
    placeholderCommentaire: 'Lieu, horaires, programme abrégé…',
  },
  {
    motif: 'visite-entreprise',
    libelle: 'Visites en entreprise',
    description: 'Visite du formateur référent en entreprise.',
    placeholderCommentaire: 'Objet de la visite, points abordés…',
  },
  {
    motif: 'restitution-activites',
    libelle: 'Restitution des activités',
    description: 'Modalités de restitution périodique en classe.',
    placeholderCommentaire: 'Fréquence et format (ex : oral toutes les 6 semaines).',
  },
  {
    motif: 'bilan-formation',
    libelle: 'Bilans de formation',
    description: 'Bilan intermédiaire ou final de la formation.',
    placeholderCommentaire: 'Période, intervenants, modalités…',
  },
  {
    motif: 'entretien-tripartite-1',
    libelle: 'Entretien Tripartite 1',
    description:
      "Premier entretien tripartite — typiquement dans les 2 mois suivant la signature du contrat (R7).",
    placeholderCommentaire: 'Date prévue, modalités, participants…',
  },
  {
    motif: 'entretien-tripartite-2',
    libelle: 'Entretien Tripartite 2',
    description:
      'Deuxième entretien tripartite — bilan ou réajustement en cours de formation.',
    placeholderCommentaire: 'Date prévue, modalités, participants…',
  },
  {
    motif: 'entretien-tripartite-3',
    libelle: 'Entretien Tripartite 3',
    description:
      'Troisième entretien tripartite — formations longues (2 ans), bilan de progression.',
    placeholderCommentaire: 'Date prévue, modalités, participants…',
  },
  {
    motif: 'entretien-tripartite-4',
    libelle: 'Entretien Tripartite 4',
    description:
      'Quatrième entretien tripartite — formations longues (2 ans), bilan final.',
    placeholderCommentaire: 'Date prévue, modalités, participants…',
  },
  {
    motif: 'autre',
    libelle: 'Autre',
    description: 'Tout événement non couvert par les motifs standards.',
    placeholderCommentaire: 'Conseil de classe, sortie pédagogique, période d\'examen…',
  },
];

const MOTIFS_PAR_CLE: Map<MotifOrganisationSuivi, MetadonneesMotif> = new Map(
  MOTIFS_ORGANISATION_SUIVI.map((m) => [m.motif, m]),
);

/**
 * Renvoie les métadonnées d'un motif (libellé, description, placeholder).
 * Lance une erreur si le motif est inconnu — protection contre les données
 * corrompues côté localStorage.
 */
export function metadonneesMotif(motif: MotifOrganisationSuivi): MetadonneesMotif {
  const meta = MOTIFS_PAR_CLE.get(motif);
  if (!meta) {
    throw new Error(`Motif d'organisation du suivi inconnu : ${motif}`);
  }
  return meta;
}

/** Libellé court du motif (ex : « Visites en entreprise »). */
export function libelleMotif(motif: MotifOrganisationSuivi): string {
  return metadonneesMotif(motif).libelle;
}

/**
 * Renvoie le titre d'affichage d'un événement : `<libellé motif> — <titre>`
 * si un titre custom est défini, sinon le libellé seul. Utilisé en UI et PDF
 * pour identifier visuellement chaque carte.
 */
export function libelleEvenement(evt: EvenementOrganisationSuivi): string {
  const base = libelleMotif(evt.motif);
  const titre = evt.titre?.trim();
  return titre ? `${base} — ${titre}` : base;
}

/**
 * Crée un événement vierge pour un motif donné. L'id est un UUID court
 * (8 caractères) cohérent avec la convention des autres entités du store.
 */
export function creerEvenementVierge(
  motif: MotifOrganisationSuivi,
  idCustom?: string,
): EvenementOrganisationSuivi {
  return {
    id: idCustom ?? `evt-${crypto.randomUUID().slice(0, 8)}`,
    motif,
    titre: '',
    date: '',
    commentaire: '',
  };
}

export interface VerrouSuppressionEvenement {
  supprimable: boolean;
  /** Message lisible expliquant le blocage. Défini uniquement si non supprimable. */
  raison?: string;
}

/**
 * Indique si un événement peut être supprimé. Cohérent avec
 * `peutSupprimerFichePeriode` : la validation se fait côté UI, le store
 * reste déterministe.
 *
 * Règle : un événement verrouillé doit d'abord être déverrouillé. Évite
 * qu'un clic accidentel sur « Supprimer » fasse perdre une saisie qu'on
 * a justement protégée.
 */
export function peutSupprimerEvenement(
  evt: EvenementOrganisationSuivi,
): VerrouSuppressionEvenement {
  if (evt.verrouille) {
    return {
      supprimable: false,
      raison: 'Déverrouillez d\'abord cet événement pour pouvoir le supprimer.',
    };
  }
  return { supprimable: true };
}

/**
 * Retourne le numéro d'entretien tripartite associé à un motif, ou `null`
 * si le motif n'est pas un entretien. Pratique pour aiguiller l'UI :
 * « cet événement ouvre-t-il un entretien tripartite et lequel ? ».
 */
export function numeroEntretienPourMotif(
  motif: MotifOrganisationSuivi,
): NumeroEntretien | null {
  switch (motif) {
    case 'entretien-tripartite-1':
      return 1;
    case 'entretien-tripartite-2':
      return 2;
    case 'entretien-tripartite-3':
      return 3;
    case 'entretien-tripartite-4':
      return 4;
    default:
      return null;
  }
}

/**
 * Catalogue des motifs proposables pour une formation donnée : les motifs
 * `entretien-tripartite-N` au-delà de `nombreEntretiens` sont masqués
 * (retours coordos juin 2026 — le nombre d'entretiens est défini par le
 * coordo au niveau de la formation). Les autres motifs sont toujours
 * proposés.
 */
export function motifsDisponibles(
  nombreEntretiens: NumeroEntretien,
): ReadonlyArray<MetadonneesMotif> {
  return MOTIFS_ORGANISATION_SUIVI.filter((m) => {
    const n = numeroEntretienPourMotif(m.motif);
    return n === null || n <= nombreEntretiens;
  });
}

/**
 * Motifs proposables dans le sélecteur d'ajout selon le rôle actif
 * (retours coordos juin 2026, 2ᵉ passe) :
 *
 *  - **formateur référent** : uniquement les motifs entretien tripartite
 *    (1..N de la formation) — la planification des autres événements
 *    (réunions, visites, bilans…) relève du coordo ;
 *  - **coordo / admin** : tous les motifs (entretiens compris) ;
 *  - autres rôles : aucun (lecture seule de toute façon).
 *
 * La modification / suppression des événements existants reste régie par la
 * ressource `organisation-suivi` (formateur + coordo + admin), quel que
 * soit le motif.
 */
export function motifsProposablesPourRole(
  nombreEntretiens: NumeroEntretien,
  role: Role,
): ReadonlyArray<MetadonneesMotif> {
  const disponibles = motifsDisponibles(nombreEntretiens);
  if (role === 'coordo' || role === 'admin') return disponibles;
  if (role === 'formateur') {
    return disponibles.filter((m) => numeroEntretienPourMotif(m.motif) !== null);
  }
  return [];
}
