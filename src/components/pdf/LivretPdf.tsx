import { Document, Image, Page, Text as TextePdf, View } from '@react-pdf/renderer';
import type { ComponentProps, ReactNode } from 'react';
import logoRepublique from '@/assets/logo-republique-francaise.png';
import logoReseauGreta from '@/assets/logo-reseau-greta-cfa.png';
import type {
  Apprenti,
  AttitudeProfessionnelle,
  BlocCompetences,
  Competence,
  DocumentAdministratif,
  Entreprise,
  EntretienTripartite,
  Etablissement,
  FicheSuiviPeriode,
  Formateur,
  Formation,
  LieuFiche,
  Livret,
  Maitre,
  ModeleActivites,
  NiveauAppreciation,
  NiveauMaitrise,
  NiveauMaitriseEntreprise,
  Referentiel,
  SignaturePartie,
  SignaturesTripartite,
} from '@/types';
import { libelleRole } from '@/lib/droits';
import { synthetiserCompetences, valeurEffective } from '@/lib/synthese-evaluation';
import { calculerStatsParBloc } from '@/lib/stats-bloc';
import { grouperParSousFamille } from '@/lib/grouper-competences';
import { libelleEvenement } from '@/lib/organisation-suivi';
import { TRAME_ENTRETIEN, estReponseAlerte, pointsAlerteTrame } from '@/lib/trame-entretien';
import { ATTITUDES_OBLIGATOIRES, lignesSyntheseAttitudes } from '@/lib/attitudes';
import { attitudesRetenues } from '@/lib/selection-attitudes';
import {
  creerSelectionVierge,
  restreindreReferentielALaSelection,
} from '@/lib/selection-competences-entreprise';
import { restreindreReferentielAuxActivitesRetenues } from '@/lib/selection-activites-entreprise';
import { projeterActivites, type ProjectionCompetenceEntree } from '@/lib/projection-activites';
import { COULEURS, COULEURS_APPRECIATION, styles } from './styles';
import {
  couleurEtatFiche,
  formaterDateCourte,
  formaterDateHeure,
  formaterDateLongue,
  libelleAppreciation,
  libelleEtatFiche,
  libelleNiveau,
  libelleOuiNon,
} from './format';

/**
 * Composant `Document` du livret d'apprentissage au format PDF.
 * Référence : cahier des charges v1.3, section 5.6.
 *
 * Structure :
 *   - Page de garde (identité, formation, métadonnées, mention démo)
 *   - Fiches de suivi (ex « Organisation du suivi »)
 *   - Entretien tripartite
 *   - 1 page par période en entreprise (ex « Fiche de suivi »)
 *   - Évaluations finales (compétences par bloc, attitudes)
 *   - Annexes (clôture, historiques de déverrouillage)
 *
 * Le composant n'utilise QUE les primitives `@react-pdf/renderer` (pas de DOM,
 * pas de Tailwind). Les styles partagés sont dans `./styles.ts`.
 */

export interface LivretPdfProps {
  livret: Livret;
  apprenti: Apprenti;
  maitre: Maitre;
  /** Second maître / tuteur optionnel (juin 2026) — affiché en page de garde. */
  maitreSecond?: Maitre;
  formateur: Formateur;
  formation: Formation;
  referentiel: Referentiel;
  /**
   * Établissement (lieu de formation) — résolu via `formation.lieuId` en
   * amont. Peut être `undefined` si l'établissement référencé a été supprimé
   * (cas non nominal, on affiche un fallback).
   */
  etablissement?: Etablissement;
  /** Entreprise d'accueil de l'apprenti·e — résolue via `apprenti.entrepriseId`. */
  entreprise?: Entreprise;
  /**
   * Catalogue global des attitudes professionnelles (juin 2026) — évaluées
   * par le maître lors de l'entretien, synthétisées en évaluation finale.
   */
  attitudes: ReadonlyArray<AttitudeProfessionnelle>;
  /**
   * Modèle d'activités de la formation en mode ACTIVITÉS (juillet 2026 —
   * chantier #4) : les pages de fiches entreprise listent des activités, la
   * Synthèse par compétences est alimentée par leur projection (provenance
   * « via activité X — Période N »). Absent en mode compétences.
   */
  modeleActivites?: ModeleActivites;
  /**
   * Documents administratifs nominatifs de l'apprenti·e (10 juillet 2026) —
   * rappel des attestations de prise de connaissance dans le PDF (obligation
   * pilote). Les documents « réservés à l'apprenti·e » n'exposent pas leur
   * titre (le PDF circule au-delà du cercle apprenti + coordo + admin).
   */
  documents?: DocumentAdministratif[];
  /** ISO de la date d'export (test injectable). */
  dateExport?: string;
}

export function LivretPdf({
  livret,
  apprenti,
  maitre,
  maitreSecond,
  formateur,
  formation,
  referentiel,
  etablissement,
  entreprise,
  attitudes,
  modeleActivites,
  documents,
  dateExport,
}: LivretPdfProps) {
  const date = dateExport ?? new Date().toISOString();
  const nomComplet = `${apprenti.prenom} ${apprenti.nom}`;
  // 13 juin 2026 : le PDF ne présente que les attitudes RETENUES pour ce
  // livret (choix fait à l'entretien) — filtre unique en amont des pages.
  const attitudesDuLivret = attitudesRetenues(attitudes, livret.attitudesSelectionnees ?? []);

  return (
    <Document
      title={`Livret d'apprentissage - ${nomComplet}`}
      author="GRETA Lyon Métropole"
      subject={`Livret de ${formation.intitule}`}
      creator="Maquette Livret GRETA - étape 1"
    >
      <PageDeGarde
        apprenti={apprenti}
        maitre={maitre}
        maitreSecond={maitreSecond}
        formateur={formateur}
        formation={formation}
        etablissement={etablissement}
        entreprise={entreprise}
        livret={livret}
        dateExport={date}
      />
      {/* Documents administratifs (10 juillet 2026) — miroir de la partie 1
          du livret papier, en tête comme dans le document d'origine. */}
      {documents && documents.length > 0 && <PageDocumentsAdministratifs documents={documents} />}
      <PageOrganisation livret={livret} />
      {livret.entretien && (
        <PageEntretien
          entretien={livret.entretien}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
        />
      )}
      {livret.fichesSuivi.map((fiche) => (
        <PageFiche
          key={fiche.id}
          fiche={fiche}
          referentiel={referentiel}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
          attitudes={attitudesDuLivret}
          modeleActivites={modeleActivites}
        />
      ))}
      {(livret.fichesSuiviCentre ?? []).map((fiche) => (
        <PageFiche
          key={fiche.id}
          fiche={fiche}
          referentiel={referentiel}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
          lieu="centre"
        />
      ))}
      <PageEvaluationFinale
        livret={livret}
        referentiel={referentiel}
        attitudes={attitudesDuLivret}
        modeleActivites={modeleActivites}
      />
      <PageAnnexes livret={livret} />
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents partiels (16 juin 2026) — réutilisent les sections ci-dessus pour
// exporter séparément une période, un entretien, ou les fiches de suivi.
// Mêmes données que `LivretPdf` (cf. `LivretPdfProps`).
// ─────────────────────────────────────────────────────────────────────────────

/** PDF d'une seule période (entreprise ou centre) : page de garde + la fiche. */
export function PeriodePdf({
  fiche,
  livret,
  apprenti,
  maitre,
  maitreSecond,
  formateur,
  formation,
  referentiel,
  etablissement,
  entreprise,
  attitudes,
  modeleActivites,
  dateExport,
  lieu = 'entreprise',
}: LivretPdfProps & { fiche: FicheSuiviPeriode; lieu?: LieuFiche }) {
  const date = dateExport ?? new Date().toISOString();
  const nomComplet = `${apprenti.prenom} ${apprenti.nom}`;
  const estCentre = lieu === 'centre';
  return (
    <Document
      title={`Période ${estCentre ? 'en centre ' : ''}${fiche.numeroPeriode} - ${nomComplet}`}
      author="GRETA Lyon Métropole"
      subject={`Période en ${estCentre ? 'centre' : 'entreprise'} - ${formation.intitule}`}
      creator="Maquette Livret GRETA - étape 1"
    >
      <PageDeGarde
        apprenti={apprenti}
        maitre={maitre}
        maitreSecond={maitreSecond}
        formateur={formateur}
        formation={formation}
        etablissement={etablissement}
        entreprise={entreprise}
        livret={livret}
        dateExport={date}
      />
      <PageFiche
        fiche={fiche}
        referentiel={referentiel}
        apprenti={apprenti}
        maitre={maitre}
        formateur={formateur}
        lieu={lieu}
        attitudes={
          estCentre ? undefined : attitudesRetenues(attitudes, livret.attitudesSelectionnees ?? [])
        }
        modeleActivites={estCentre ? undefined : modeleActivites}
      />
    </Document>
  );
}

/** PDF de l'entretien tripartite : page de garde + l'entretien. */
export function EntretienPdf({
  livret,
  apprenti,
  maitre,
  maitreSecond,
  formateur,
  formation,
  etablissement,
  entreprise,
  dateExport,
}: LivretPdfProps) {
  const date = dateExport ?? new Date().toISOString();
  const nomComplet = `${apprenti.prenom} ${apprenti.nom}`;
  const entretien = livret.entretien;
  return (
    <Document
      title={`Entretien tripartite - ${nomComplet}`}
      author="GRETA Lyon Métropole"
      subject={`Entretien tripartite - ${formation.intitule}`}
      creator="Maquette Livret GRETA - étape 1"
    >
      <PageDeGarde
        apprenti={apprenti}
        maitre={maitre}
        maitreSecond={maitreSecond}
        formateur={formateur}
        formation={formation}
        etablissement={etablissement}
        entreprise={entreprise}
        livret={livret}
        dateExport={date}
      />
      {entretien && (
        <PageEntretien
          entretien={entretien}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
        />
      )}
    </Document>
  );
}

/** PDF des fiches de suivi (événements d'organisation) : page de garde + section. */
export function FichesSuiviPdf({
  livret,
  apprenti,
  maitre,
  maitreSecond,
  formateur,
  formation,
  etablissement,
  entreprise,
  dateExport,
}: LivretPdfProps) {
  const date = dateExport ?? new Date().toISOString();
  const nomComplet = `${apprenti.prenom} ${apprenti.nom}`;
  return (
    <Document
      title={`Fiches de suivi - ${nomComplet}`}
      author="GRETA Lyon Métropole"
      subject={`Fiches de suivi - ${formation.intitule}`}
      creator="Maquette Livret GRETA - étape 1"
    >
      <PageDeGarde
        apprenti={apprenti}
        maitre={maitre}
        maitreSecond={maitreSecond}
        formateur={formateur}
        formation={formation}
        etablissement={etablissement}
        entreprise={entreprise}
        livret={livret}
        dateExport={date}
      />
      <PageOrganisation livret={livret} />
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/** Remplace les tirets longs par des tirets simples (demande pilote, 3 juillet 2026). */
function remplacerTiretsLongs(node: ReactNode): ReactNode {
  if (typeof node === 'string') return node.replace(/—/g, '-');
  if (Array.isArray(node)) return node.map((n) => remplacerTiretsLongs(n));
  return node;
}

/**
 * Props du `Text` non-SVG de react-pdf (la variante SVG, qui exige `x`/`y`,
 * est écartée de l'union — le PDF du livret n'en utilise pas).
 */
type ProprietesTexte = Exclude<
  ComponentProps<typeof TextePdf>,
  { x: string | number; y: string | number }
>;

/**
 * `Text` local : toutes les chaînes rendues dans le PDF (littéraux, données,
 * helpers de format) passent par ce wrapper — un « — » ne peut pas atteindre
 * le document. Ne pas importer `Text` de @react-pdf/renderer directement.
 */
function Text(props: ProprietesTexte) {
  const { children, render, ...reste } = props;
  // `render` n'est transmis que s'il existe : react-pdf teste la présence de
  // la prop, un `render={undefined}` explicite le fait planter.
  if (render) {
    return <TextePdf {...reste} render={(args) => remplacerTiretsLongs(render(args))} />;
  }
  return <TextePdf {...reste}>{remplacerTiretsLongs(children)}</TextePdf>;
}

/** Style de texte coloré d'un niveau de maîtrise (tokens du site). */
function styleNiveau(n: NiveauMaitrise | NiveauMaitriseEntreprise | null | undefined) {
  switch (n) {
    case 'maitrise':
      return styles.niveauMaitrise;
    case 'partiel':
      return styles.niveauPartiel;
    case 'non-maitrise':
      return styles.niveauNonMaitrise;
    case 'non-fait':
      return styles.niveauNonFait;
    default:
      return { color: COULEURS.texteSecondaire };
  }
}

/** Pastille pleine ++/+/-/-- aux couleurs du sélecteur du site. */
function PastilleAppreciation({ niveau }: { niveau: NiveauAppreciation | null | undefined }) {
  if (!niveau) return <Text style={styles.appreciationVide}>Non renseigné</Text>;
  return (
    <Text style={[styles.pastilleAppreciation, { backgroundColor: COULEURS_APPRECIATION[niveau] }]}>
      {libelleAppreciation(niveau)}
    </Text>
  );
}

/** Ligne « label + pastille d'appréciation » (attitudes, appréciations). */
function ChampAppreciation({
  label,
  niveau,
}: {
  label: string;
  niveau: NiveauAppreciation | null | undefined;
}) {
  return (
    <View style={styles.paireAppreciation}>
      <Text style={styles.paireAppreciationLabel}>{label}</Text>
      <PastilleAppreciation niveau={niveau} />
    </View>
  );
}

/**
 * Ligne « label : Oui/Non » aux couleurs du site. La couleur suit la
 * POLARITÉ de la question (7 juillet 2026) : la réponse d'alerte est rouge,
 * la réponse « norme » verte — sur la rubrique « Difficultés éventuelles »,
 * c'est donc « Oui » (difficulté déclarée) qui s'affiche en rouge.
 */
function ChampOuiNon({
  label,
  valeur,
  estAlerte,
}: {
  label: string;
  valeur: boolean | null | undefined;
  /** La réponse donnée est-elle un point d'alerte (cf. `estReponseAlerte`) ? */
  estAlerte: boolean;
}) {
  const couleur =
    valeur === null || valeur === undefined
      ? { color: COULEURS.texteSecondaire }
      : estAlerte
        ? styles.niveauNonMaitrise
        : styles.niveauMaitrise;
  return (
    <Text style={styles.paire}>
      <Text style={styles.paireLabel}>{label} : </Text>
      <Text style={couleur}>{libelleOuiNon(valeur)}</Text>
    </Text>
  );
}

/** Ligne de synthèse par bloc, compteurs colorés aux couleurs des niveaux. */
function LigneStats({
  titre,
  stats,
}: {
  titre: string;
  stats: { maitrise: number; partiel: number; nonMaitrise: number; nonEvalue: number };
}) {
  return (
    <Text style={{ fontSize: 9, marginTop: 2 }}>
      {titre} - <Text style={styles.niveauMaitrise}>Maîtrisé : {stats.maitrise}</Text> ·{' '}
      <Text style={styles.niveauPartiel}>En cours : {stats.partiel}</Text> ·{' '}
      <Text style={styles.niveauNonMaitrise}>Non maîtrisé : {stats.nonMaitrise}</Text> ·{' '}
      <Text style={{ color: COULEURS.texteSecondaire }}>Non évalué : {stats.nonEvalue}</Text>
    </Text>
  );
}

function PiedDePage({ dateExport }: { dateExport: string }) {
  return (
    <View style={styles.piedDePage} fixed>
      <Text>GRETA Lyon Métropole - Maquette de démonstration (aucune valeur officielle)</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages} - Exporté le ${formaterDateCourte(dateExport)}`
        }
      />
    </View>
  );
}

function Champ({ label, valeur }: { label: string; valeur: string | undefined }) {
  return (
    <Text style={styles.paire}>
      <Text style={styles.paireLabel}>{label} : </Text>
      <Text style={styles.paireValeur}>{valeur && valeur.length > 0 ? valeur : '-'}</Text>
    </Text>
  );
}

function ParagrapheLibre({ titre, valeur }: { titre: string; valeur: string | undefined }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.h3}>{titre}</Text>
      {valeur && valeur.trim().length > 0 ? (
        <Text style={styles.paragraphe}>{valeur}</Text>
      ) : (
        <Text style={styles.vide}>(non renseigné)</Text>
      )}
    </View>
  );
}

function CarteSignature({
  role,
  signature,
  nom,
}: {
  role: 'apprenti' | 'maitre' | 'formateur';
  signature: SignaturePartie;
  nom: string;
}) {
  const styleRole =
    role === 'apprenti'
      ? styles.signatureCarteApprenti
      : role === 'maitre'
        ? styles.signatureCarteMaitre
        : styles.signatureCarteFormateur;
  return (
    <View style={[styles.signatureCarte, styleRole]}>
      <Text style={styles.signatureLabel}>{libelleRole(role)}</Text>
      <Text style={{ fontSize: 9, marginBottom: 4 }}>{nom}</Text>
      {signature.signe ? (
        <>
          {/* Signature manuscrite tactile (juin 2026) — absente sur les
              signatures antérieures au chantier. */}
          {signature.trace && (
            <Image
              src={signature.trace}
              style={{ height: 32, objectFit: 'contain', objectPosition: 'left', marginBottom: 2 }}
            />
          )}
          <Text style={styles.signatureValeur}>
            Signé le {formaterDateHeure(signature.dateSignature)}
          </Text>
        </>
      ) : (
        <Text style={styles.signatureManquante}>Signature manquante</Text>
      )}
    </View>
  );
}

function BlocSignaturesPdf({
  signatures,
  apprenti,
  maitre,
  formateur,
  lieu,
}: {
  signatures: SignaturesTripartite;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
  /**
   * 2 signataires par lieu de fiche (1ᵉʳ juillet 2026) : entreprise =
   * apprenti·e + maître / tuteur ; centre = apprenti·e + formateur référent.
   * Sans `lieu` (entretien tripartite), les 3 parties signent (R9) — la vague
   * du 1ᵉʳ juillet avait masqué à tort la carte du formateur sur les
   * entretiens (corrigé le 3 juillet 2026).
   */
  lieu?: LieuFiche;
}) {
  const estEntretien = lieu === undefined;
  return (
    <View style={styles.signaturesRangee} wrap={false}>
      <CarteSignature
        role="apprenti"
        signature={signatures.apprenti}
        nom={`${apprenti.prenom} ${apprenti.nom}`}
      />
      {(estEntretien || lieu === 'entreprise') && (
        <CarteSignature
          role="maitre"
          signature={signatures.maitre}
          nom={`${maitre.prenom} ${maitre.nom}`}
        />
      )}
      {(estEntretien || lieu === 'centre') && (
        <CarteSignature
          role="formateur"
          signature={signatures.formateur}
          nom={`${formateur.prenom} ${formateur.nom}`}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Page de garde
// ─────────────────────────────────────────────────────────────────────────────

export function PageDeGarde({
  apprenti,
  maitre,
  maitreSecond,
  formateur,
  formation,
  etablissement,
  entreprise,
  livret,
  dateExport,
}: {
  apprenti: Apprenti;
  maitre: Maitre;
  maitreSecond?: Maitre;
  formateur: Formateur;
  formation: Formation;
  etablissement?: Etablissement;
  entreprise?: Entreprise;
  livret: Livret;
  dateExport: string;
}) {
  // Fallback : si l'établissement est introuvable (cas non nominal — soft
  // delete d'un lieu encore référencé), on affiche un libellé générique.
  const libelleLieu = etablissement
    ? `${etablissement.nom}${etablissement.ville ? ` (${etablissement.ville})` : ''}`
    : 'Établissement non spécifié';
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.garde}>
        <View>
          {/* Logo officiel scindé (3 juillet 2026) : Marianne à gauche,
              réseau GRETA CFA à droite, titre du document en dessous. */}
          <View style={styles.gardeMarque}>
            <Image src={logoRepublique} style={styles.gardeLogoRepublique} />
            <Image src={logoReseauGreta} style={styles.gardeLogoReseau} />
          </View>
          <View style={styles.gardeTitreBloc}>
            <Text style={styles.gardeTitre}>Livret d'apprentissage</Text>
            <Text style={styles.gardeSousTitre}>GRETA Lyon Métropole</Text>
          </View>

          <View style={styles.gardeBlocIdentite}>
            <Text style={styles.gardeNom}>
              {apprenti.prenom} {apprenti.nom}
            </Text>
            <Text style={styles.gardeFormation}>
              {formation.intitule} - promotion {formation.annee}
            </Text>
          </View>

          <View style={styles.gardeMetadonnees}>
            <Ligne label="Date de naissance" valeur={formaterDateLongue(apprenti.dateNaissance)} />
            <Ligne
              label="Contrat d'apprentissage"
              valeur={`du ${formaterDateCourte(apprenti.contratDebut)} au ${formaterDateCourte(apprenti.contratFin)}`}
            />
            <Ligne label="Centre de formation" valeur={libelleLieu} />
            <Ligne label="Maître / Tuteur" valeur={`${maitre.prenom} ${maitre.nom}`} />
            <Ligne
              label="Entreprise d'accueil"
              valeur={entreprise?.raisonSociale ?? maitre.entreprise}
            />
            <Ligne label="Fonction du maître" valeur={maitre.fonction} />
            {maitreSecond && (
              <Ligne
                label="Second maître / tuteur"
                valeur={`${maitreSecond.prenom} ${maitreSecond.nom}${
                  maitreSecond.entreprise !== maitre.entreprise
                    ? ` (${maitreSecond.entreprise})`
                    : ''
                }`}
              />
            )}
            <Ligne label="Formateur référent" valeur={`${formateur.prenom} ${formateur.nom}`} />
          </View>

          {livret.cloture && (
            <View style={styles.encartCloture}>
              <Text style={styles.encartTitre}>Livret clôturé</Text>
              <Text>
                Clôturé le {formaterDateHeure(livret.cloture.dateCloture)} par{' '}
                {livret.cloture.auteurNom} ({libelleRole(livret.cloture.auteurRole)}).
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.gardeBandeauDemo}>
            MAQUETTE DE DÉMONSTRATION - DONNÉES FICTIVES - AUCUNE VALEUR OFFICIELLE
          </Text>
          <Text style={styles.gardeMentions}>
            Document généré le {formaterDateLongue(dateExport)} · cahier des charges v1.3 · maquette
            étape 1
          </Text>
        </View>
      </View>
      <PiedDePage dateExport={dateExport} />
    </Page>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.gardeMetadonneesLigne}>
      <Text style={styles.gardeMetadonneesLabel}>{label}</Text>
      <Text style={styles.gardeMetadonneesValeur}>{valeur}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Fiches de suivi (anciennement « Organisation du suivi »)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Documents administratifs nominatifs (10 juillet 2026) — rappel des
 * attestations de prise de connaissance (demande pilote : « rappel des
 * documents signés dans le PDF de synthèse »). Les documents réservés à
 * l'apprenti·e sont listés SANS leur titre : le PDF exporté circule au-delà
 * du cercle apprenti·e + coordo + admin.
 */
export function PageDocumentsAdministratifs({ documents }: { documents: DocumentAdministratif[] }) {
  const tries = [...documents].sort((a, b) => a.deposeLe.localeCompare(b.deposeLe));
  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <Text style={styles.h1}>Documents administratifs</Text>
        <Text style={[styles.italique, { marginBottom: 12 }]}>
          Documents nominatifs remis à l'apprenti·e (partie 1 du livret) : l'apprenti·e atteste de
          leur prise de connaissance par une signature manuscrite, obligatoire pour chaque document.
        </Text>
        {tries.map((d) => (
          <View key={d.id} style={[styles.encart, { marginBottom: 8 }]} wrap={false}>
            <Text style={styles.h3}>
              {d.reserveApprenti ? 'Document réservé à l’apprenti·e' : d.titre}
            </Text>
            <Text style={{ fontSize: 8, color: '#666', marginBottom: 4 }}>
              Déposé le {formaterDateCourte(d.deposeLe)} par {d.deposeParNom}
            </Text>
            {d.attestation.signe ? (
              <>
                {d.attestation.trace && (
                  <Image
                    src={d.attestation.trace}
                    style={{
                      height: 28,
                      objectFit: 'contain',
                      objectPosition: 'left',
                      marginBottom: 2,
                    }}
                  />
                )}
                <Text style={styles.signatureValeur}>
                  Prise de connaissance attestée le {formaterDateHeure(d.attestation.dateSignature)}
                </Text>
              </>
            ) : (
              <Text style={styles.signatureManquante}>
                Attestation de prise de connaissance manquante (obligatoire)
              </Text>
            )}
          </View>
        ))}
      </View>
    </Page>
  );
}

export function PageOrganisation({ livret }: { livret: Livret }) {
  const o = livret.organisationSuivi;

  /** Combine date + commentaire en une chaîne PDF. */
  const fmt = (c: { date?: string; commentaire?: string }): string => {
    const date = c.date ? formaterDateLongue(c.date) : '';
    const comm = c.commentaire?.trim() ?? '';
    const parts = [date, comm].filter(Boolean);
    return parts.length ? parts.join(' - ') : '-';
  };

  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <Text style={styles.h1}>Fiches de suivi</Text>
        <Text style={[styles.italique, { marginBottom: 12 }]}>
          Cette section détaille l'organisation pédagogique mise en place pour la promotion.
        </Text>
        {o.evenements.length === 0 ? (
          <Text style={styles.italique}>
            Aucun événement n'a encore été ajouté à l'organisation du suivi.
          </Text>
        ) : (
          o.evenements.map((evt) => (
            <Champ key={evt.id} label={libelleEvenement(evt)} valeur={fmt(evt)} />
          ))
        )}
        <View style={[styles.encart, { marginTop: 12 }]}>
          <Text>
            Dernière modification : {formaterDateHeure(o.modifieLe)} · auteur : {o.modifiePar}
          </Text>
        </View>
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Entretien tripartite
// ─────────────────────────────────────────────────────────────────────────────

export function PageEntretien({
  entretien,
  apprenti,
  maitre,
  formateur,
}: {
  entretien: EntretienTripartite;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
}) {
  const ap = entretien.appreciationMaitre;
  const c = entretien.commentaires;
  // Trame officielle GRETA (« première visite ») : rubriques + points d'alerte.
  const alertes = pointsAlerteTrame(entretien.reponsesTrame);
  const sigRL = entretien.signatures.representantLegal;

  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <Text style={styles.h1}>Entretien tripartite</Text>
        <Champ
          label="Date de l'entretien"
          valeur={entretien.dateEntretien ? formaterDateLongue(entretien.dateEntretien) : undefined}
        />

        {TRAME_ENTRETIEN.map((rubrique) => (
          <View key={rubrique.id}>
            <Text style={styles.h2}>{rubrique.titre}</Text>
            {rubrique.questions.map((q) => {
              const v = entretien.reponsesTrame[q.id];
              return q.type === 'oui-non' ? (
                <ChampOuiNon
                  key={q.id}
                  label={q.libelle}
                  valeur={typeof v === 'boolean' ? v : null}
                  estAlerte={estReponseAlerte(q, typeof v === 'boolean' ? v : undefined)}
                />
              ) : (
                <ParagrapheLibre
                  key={q.id}
                  titre={q.libelle}
                  valeur={typeof v === 'string' ? v : ''}
                />
              );
            })}
          </View>
        ))}
        {alertes.length > 0 && (
          <View style={[styles.encart, { marginTop: 6 }]}>
            <Text style={styles.encartTitre}>
              Points d'alerte ({alertes.length}) : action du GRETA CFA (DDF / coordonnateur)
            </Text>
            {alertes.map((q) => (
              <Text key={q.id} style={{ fontSize: 9, marginTop: 2 }}>
                • {q.libelle}
              </Text>
            ))}
          </View>
        )}

        {/* Appréciation générale du maître = 4 attitudes obligatoires de la
            trame officielle. Juillet 2026 : les attitudes RETENUES s'évaluent
            désormais sur chaque fiche de période entreprise (cf. PageFiche). */}
        <Text style={styles.h3}>Attitudes professionnelles obligatoires (maître)</Text>
        {ATTITUDES_OBLIGATOIRES.map((o) => (
          <ChampAppreciation key={o.cle} label={o.libelle} niveau={ap[o.cle]} />
        ))}
        {ap.commentaires && (
          <ParagrapheLibre titre="Commentaires du maître" valeur={ap.commentaires} />
        )}

        {/* 1ᵉʳ juillet 2026 : 3 commentaires individuels — un par partie. */}
        <Text style={styles.h2}>Commentaires</Text>
        <ParagrapheLibre titre="Apprenti·e" valeur={c.apprenti} />
        <ParagrapheLibre titre="Maître / Tuteur" valeur={c.maitre} />
        <ParagrapheLibre titre="Formateur référent" valeur={c.formateur} />

        <Text style={styles.h2}>Signatures</Text>
        <BlocSignaturesPdf
          signatures={entretien.signatures}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
        />
        {sigRL?.signe && (
          <Text style={{ fontSize: 9, marginTop: 4 }}>
            Représentant légal : signé le {formaterDateHeure(sigRL.dateSignature)}
          </Text>
        )}
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Fiche de suivi par période
// ─────────────────────────────────────────────────────────────────────────────

export function PageFiche({
  fiche,
  referentiel,
  apprenti,
  maitre,
  formateur,
  lieu = 'entreprise',
  attitudes,
  modeleActivites,
}: {
  fiche: FicheSuiviPeriode;
  referentiel: Referentiel;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
  lieu?: LieuFiche;
  /**
   * Attitudes RETENUES pour le livret (juillet 2026) — évaluées par le
   * maître / tuteur à chaque période en entreprise. Ignoré au centre.
   */
  attitudes?: ReadonlyArray<AttitudeProfessionnelle>;
  /** Modèle d'activités (mode activités — chantier #4) : lignes d'activités. */
  modeleActivites?: ModeleActivites;
}) {
  const competencesById = new Map(
    referentiel.blocs.flatMap((b) => b.competences.map((c) => [c.id, c])),
  );
  const activitesById = new Map((modeleActivites?.activites ?? []).map((a) => [a.id, a]));
  const enModeActivites = !!modeleActivites;
  const estCentre = lieu === 'centre';

  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={styles.h1}>
            {estCentre ? 'Période en Centre' : 'Période en Entreprise'} n° {fiche.numeroPeriode}
          </Text>
          <Text style={[styles.badgeEtat, { backgroundColor: couleurEtatFiche(fiche.etat) }]}>
            {libelleEtatFiche(fiche.etat)}
          </Text>
        </View>
        <Text style={styles.italique}>
          Du {formaterDateLongue(fiche.dateDebut)} au {formaterDateLongue(fiche.dateFin)}
        </Text>

        {/* La zone « Suivi GRETA CFA » a été retirée partout (1ᵉʳ juillet
            2026) : tout se rédige dans les observations de fin de période.
            Juillet 2026 : la fiche centre n'a plus de tableau de compétences
            ni d'attitudes — observations et signatures uniquement. */}

        {/* Tableau tri-colonnes (compétences + évaluations + retour apprenti)
            — fiches ENTREPRISE uniquement. */}
        {!estCentre && (
          <>
            <Text style={styles.h2}>Activités et évaluations</Text>
            {fiche.suiviEntreprise.length === 0 ? (
              <Text style={styles.vide}>
                {enModeActivites ? 'Aucune activité évaluée.' : 'Aucune compétence évaluée.'}
              </Text>
            ) : (
              <View style={styles.tableau}>
                <View style={[styles.tableauLigne, styles.tableauEnTete]}>
                  <Text style={[styles.tableauCellule, { width: '40%' }]}>
                    {enModeActivites ? 'Activité' : 'Compétence'}
                  </Text>
                  <Text style={[styles.tableauCellule, { width: '25%' }]}>
                    Évaluation entreprise
                  </Text>
                  <Text style={[styles.tableauCelluleDerniere, { width: '35%' }]}>
                    Retour {apprenti.prenom}
                  </Text>
                </View>
                {fiche.suiviEntreprise.map((l, idx) => {
                  // Chantier #4 : une ligne d'activité se résout dans le
                  // modèle ; une ligne de compétence dans le référentiel.
                  const act = l.activiteId ? activitesById.get(l.activiteId) : null;
                  const comp = l.competenceId ? competencesById.get(l.competenceId) : null;
                  const libelleC =
                    act?.libelle ??
                    comp?.libelle ??
                    l.libelleLibre ??
                    (enModeActivites ? 'Activité hors modèle' : 'Activité hors référentiel');
                  return (
                    <View
                      key={l.id}
                      style={
                        idx === fiche.suiviEntreprise.length - 1
                          ? styles.tableauLigneSansBordure
                          : styles.tableauLigne
                      }
                      wrap={false}
                    >
                      <Text style={[styles.tableauCellule, { width: '40%' }]}>{libelleC}</Text>
                      <Text style={[styles.tableauCellule, { width: '25%' }]}>
                        <Text style={styleNiveau(l.evaluationEntreprise)}>
                          {libelleNiveau(l.evaluationEntreprise)}
                        </Text>
                      </Text>
                      <Text style={[styles.tableauCelluleDerniere, { width: '35%' }]}>
                        {l.retourApprenti || '-'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Attitudes professionnelles de la période (juillet 2026) — retenues
            à l'entretien, évaluées par le maître / tuteur à chaque période. */}
        {!estCentre && attitudes && attitudes.length > 0 && (
          <>
            <Text style={styles.h2}>Attitudes professionnelles (maître / tuteur)</Text>
            {attitudes.map((a) => (
              <ChampAppreciation
                key={a.id}
                label={a.libelle}
                niveau={fiche.evaluationsAttitudes?.[a.id] ?? undefined}
              />
            ))}
          </>
        )}

        {/* Observations — au centre, pas de zone maître / tuteur. */}
        <Text style={styles.h2}>Observations</Text>
        <ParagrapheLibre titre="Apprenti·e" valeur={fiche.observations.apprenti} />
        {!estCentre && (
          <ParagrapheLibre titre="Maître / Tuteur" valeur={fiche.observations.maitre} />
        )}
        <ParagrapheLibre titre="Formateur référent" valeur={fiche.observations.formateur} />

        {/* Signatures */}
        <Text style={styles.h2}>Signatures</Text>
        <BlocSignaturesPdf
          signatures={fiche.signatures}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
          lieu={lieu}
        />

        {/* Historique de déverrouillages — si présent */}
        {fiche.historiqueDeverrouillages.length > 0 && (
          <View style={[styles.encart, { marginTop: 8 }]}>
            <Text style={styles.encartTitre}>
              Historique des déverrouillages ({fiche.historiqueDeverrouillages.length})
            </Text>
            {fiche.historiqueDeverrouillages.map((entree) => (
              <View key={entree.id} style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 8, color: COULEURS.texteSecondaire }}>
                  {formaterDateHeure(entree.dateIso)} - {entree.auteurNom} (
                  {libelleRole(entree.auteurRole)})
                </Text>
                <Text style={{ fontSize: 9 }}>{entree.motif}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Évaluations finales
// ─────────────────────────────────────────────────────────────────────────────

type LigneGrillePdf =
  | { kind: 'sousFamille'; libelle: string }
  | { kind: 'competence'; competence: Competence; indente: boolean };

/**
 * Aplatit un bloc en lignes de grille PDF : un titre par sous-famille suivi de
 * ses compétences-feuilles (indentées), les feuilles directes restant à plat.
 * On n'affiche que les libellés (la hiérarchie est portée par le retrait).
 */
function construireLignesGrillePdf(bloc: BlocCompetences): LigneGrillePdf[] {
  const rows: LigneGrillePdf[] = [];
  for (const g of grouperParSousFamille(bloc)) {
    if (g.sousFamille) rows.push({ kind: 'sousFamille', libelle: g.sousFamille });
    for (const c of g.competences) {
      rows.push({ kind: 'competence', competence: c, indente: !!g.sousFamille });
    }
  }
  return rows;
}

function PageEvaluationFinale({
  livret,
  referentiel,
  attitudes,
  modeleActivites,
}: {
  livret: Livret;
  referentiel: Referentiel;
  /** Catalogue global des attitudes professionnelles (juin 2026). */
  attitudes: ReadonlyArray<AttitudeProfessionnelle>;
  /** Modèle d'activités (mode activités — chantier #4) : Synthèse projetée. */
  modeleActivites?: ModeleActivites;
}) {
  // Juillet 2026 : la Synthèse ne présente QUE ce qui est prévu en stage —
  // sélection de compétences, ou compétences couvertes par les activités
  // retenues (mode activités, chantier #4) — colonne « Acquis en entreprise ».
  const selection = modeleActivites
    ? (livret.selectionActivitesEntreprise ?? creerSelectionVierge())
    : (livret.selectionCompetencesEntreprise ?? creerSelectionVierge());
  const referentielSelectionne = modeleActivites
    ? restreindreReferentielAuxActivitesRetenues(referentiel, modeleActivites, selection)
    : restreindreReferentielALaSelection(referentiel, selection);
  // Héritage : last-write-wins direct, ou projection des activités évaluées
  // (provenance « via activité X — Période N »).
  const synthese: Map<string, ProjectionCompetenceEntree> = modeleActivites
    ? projeterActivites(livret.fichesSuivi, modeleActivites, referentielSelectionne)
    : synthetiserCompetences(livret.fichesSuivi, referentielSelectionne);
  const activitesById = new Map((modeleActivites?.activites ?? []).map((a) => [a.id, a]));
  const lignes = livret.evaluationFinaleCompetences.lignes;
  const stats = calculerStatsParBloc(referentielSelectionne, lignes, synthese);
  // 3 juillet 2026 : 4 attitudes obligatoires (appréciation du maître) en
  // tête du tableau, puis les retenues — agrégées last-write-wins depuis les
  // fiches de période entreprise (juillet 2026).
  const lignesAttitudes = lignesSyntheseAttitudes(
    attitudes,
    livret.attitudesSelectionnees ?? [],
    livret.entretien,
    livret.fichesSuivi,
  );

  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <Text style={styles.h1}>Synthèse</Text>

        <Text style={styles.h2}>Synthèse par bloc de compétences</Text>
        {stats.map((s) => (
          <View key={s.bloc.id} style={[styles.encart, { marginBottom: 6 }]}>
            <Text style={styles.encartTitre}>{s.bloc.libelle}</Text>
            <LigneStats titre="Entreprise" stats={s.entreprise} />
          </View>
        ))}

        <Text style={styles.h2}>
          {modeleActivites
            ? 'Compétences couvertes par les activités en entreprise'
            : 'Compétences abordées en entreprise'}
        </Text>
        {referentielSelectionne.blocs.map((bloc) => (
          <View key={bloc.id} style={{ marginBottom: 8 }} wrap={false}>
            <Text style={styles.h3}>{bloc.libelle}</Text>
            <View style={styles.tableau}>
              <View style={[styles.tableauLigne, styles.tableauEnTete]}>
                <Text style={[styles.tableauCellule, { width: modeleActivites ? '45%' : '60%' }]}>
                  Compétence
                </Text>
                <Text style={[styles.tableauCellule, { width: '25%' }]}>Acquis entreprise</Text>
                <Text
                  style={[
                    styles.tableauCelluleDerniere,
                    { width: modeleActivites ? '30%' : '15%' },
                  ]}
                >
                  Source
                </Text>
              </View>
              {construireLignesGrillePdf(bloc).map((row, idx, rows) => {
                const styleLigne =
                  idx === rows.length - 1 ? styles.tableauLigneSansBordure : styles.tableauLigne;
                if (row.kind === 'sousFamille') {
                  return (
                    <View key={`sf-${idx}`} style={[styleLigne, styles.tableauEnTete]}>
                      <Text style={[styles.tableauCelluleDerniere, { width: '100%' }]}>
                        {row.libelle}
                      </Text>
                    </View>
                  );
                }
                const c = row.competence;
                const ligne = lignes.find((l) => l.competenceId === c.id) ?? {
                  competenceId: c.id,
                  acquisEntreprise: null,
                };
                const ent = valeurEffective(ligne, synthese);
                // Provenance de la projection (mode activités — chantier #4).
                const activiteId = synthese.get(c.id)?.activiteId;
                const libelleActivite = activiteId
                  ? activitesById.get(activiteId)?.libelle
                  : undefined;
                const sourceTexte =
                  ent.source === 'synthese'
                    ? libelleActivite
                      ? `via « ${libelleActivite} »${
                          ent.numeroPeriode !== undefined ? ` (Période ${ent.numeroPeriode})` : ''
                        }`
                      : ent.numeroPeriode !== undefined
                        ? `Période ${ent.numeroPeriode}`
                        : 'fiches'
                    : ent.source === 'manuelle'
                      ? 'final'
                      : '-';
                return (
                  <View key={c.id} style={styleLigne}>
                    <Text
                      style={[
                        styles.tableauCellule,
                        {
                          width: modeleActivites ? '45%' : '60%',
                          paddingLeft: row.indente ? 10 : 0,
                        },
                      ]}
                    >
                      {c.libelle}
                    </Text>
                    <Text style={[styles.tableauCellule, { width: '25%' }]}>
                      <Text style={styleNiveau(ent.valeur)}>{libelleNiveau(ent.valeur)}</Text>
                    </Text>
                    <Text
                      style={[
                        styles.tableauCelluleDerniere,
                        { width: modeleActivites ? '30%' : '15%', fontSize: 8 },
                      ]}
                    >
                      {sourceTexte}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Synthèse des attitudes professionnelles (juillet 2026) : évaluées
            par le maître / tuteur à chaque période en entreprise —
            last-write-wins ; les 4 obligatoires viennent de l'entretien. */}
        <Text style={styles.h2}>Attitudes professionnelles</Text>
        <View style={styles.tableau}>
          <View style={[styles.tableauLigne, styles.tableauEnTete]}>
            <Text style={[styles.tableauCellule, { width: '60%' }]}>Attitude</Text>
            <Text style={[styles.tableauCellule, { width: '20%' }]}>Dernier niveau</Text>
            <Text style={[styles.tableauCelluleDerniere, { width: '20%' }]}>Source</Text>
          </View>
          {lignesAttitudes.map((ligne, idx) => (
            <View
              key={ligne.id}
              style={
                idx === lignesAttitudes.length - 1
                  ? styles.tableauLigneSansBordure
                  : styles.tableauLigne
              }
            >
              <Text style={[styles.tableauCellule, { width: '60%' }]}>
                {ligne.obligatoire ? `${ligne.libelle} (obligatoire)` : ligne.libelle}
              </Text>
              <Text style={[styles.tableauCellule, { width: '20%' }]}>
                <Text
                  style={
                    ligne.niveau
                      ? {
                          color: COULEURS_APPRECIATION[ligne.niveau],
                          fontFamily: 'Helvetica-Bold',
                        }
                      : { color: COULEURS.texteSecondaire }
                  }
                >
                  {libelleAppreciation(ligne.niveau)}
                </Text>
              </Text>
              <Text style={[styles.tableauCelluleDerniere, { width: '20%', fontSize: 8 }]}>
                {ligne.niveau === null
                  ? '-'
                  : ligne.obligatoire
                    ? 'Entretien'
                    : ligne.numeroPeriode !== undefined
                      ? `Période ${ligne.numeroPeriode}`
                      : '-'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Annexes (clôture, historiques globaux)
// ─────────────────────────────────────────────────────────────────────────────

function PageAnnexes({ livret }: { livret: Livret }) {
  const totalDeverrouillages = livret.fichesSuivi.reduce(
    (n, f) => n + f.historiqueDeverrouillages.length,
    0,
  );
  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <Text style={styles.h1}>Annexes</Text>

        <Text style={styles.h2}>Statut de clôture</Text>
        {livret.cloture ? (
          <View style={styles.encartCloture}>
            <Text>
              Livret clôturé le {formaterDateHeure(livret.cloture.dateCloture)} par{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{livret.cloture.auteurNom}</Text> (
              {libelleRole(livret.cloture.auteurRole)}).
            </Text>
          </View>
        ) : (
          <Text style={styles.vide}>Le livret n'a pas été clôturé à la date d'export.</Text>
        )}

        <Text style={styles.h2}>Historique des déverrouillages (R10)</Text>
        {totalDeverrouillages === 0 ? (
          <Text style={styles.vide}>Aucun déverrouillage à signaler.</Text>
        ) : (
          livret.fichesSuivi
            .filter((f) => f.historiqueDeverrouillages.length > 0)
            .map((f) => (
              <View key={f.id} style={[styles.encart, { marginBottom: 6 }]}>
                <Text style={styles.encartTitre}>Période {f.numeroPeriode}</Text>
                {f.historiqueDeverrouillages.map((entree) => (
                  <View key={entree.id} style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 8, color: COULEURS.texteSecondaire }}>
                      {formaterDateHeure(entree.dateIso)} - {entree.auteurNom} (
                      {libelleRole(entree.auteurRole)})
                    </Text>
                    <Text style={{ fontSize: 9 }}>{entree.motif}</Text>
                  </View>
                ))}
              </View>
            ))
        )}

        <Text style={[styles.italique, { marginTop: 24, fontSize: 8 }]}>
          Document généré par la maquette du livret d'apprentissage GRETA Lyon Métropole (étape 1),
          cahier des charges v1.3. Ce document n'a aucune valeur officielle.
        </Text>
      </View>
    </Page>
  );
}
