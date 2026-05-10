import type { EvenementOrganisationSuivi, MotifOrganisationSuivi } from '@/types';

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
    description: "Journée d'information dédiée aux maîtres d'apprentissage.",
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
