import { Document, Page, Text, View } from '@react-pdf/renderer';
import type {
  Apprenti,
  EntretienTripartite,
  Etablissement,
  FicheSuiviPeriode,
  Formateur,
  Formation,
  Livret,
  Maitre,
  QuestionBanque,
  Referentiel,
  SignaturesTripartite,
} from '@/types';
import { libelleRole } from '@/lib/droits';
import { synthetiserCompetences, valeurEffective } from '@/lib/synthese-evaluation';
import { calculerStatsParBloc } from '@/lib/stats-bloc';
import { libelleEvenement } from '@/lib/organisation-suivi';
import { COULEURS, styles } from './styles';
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

interface LivretPdfProps {
  livret: Livret;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
  formation: Formation;
  referentiel: Referentiel;
  /**
   * Établissement (lieu de formation) — résolu via `formation.lieuId` en
   * amont. Peut être `undefined` si l'établissement référencé a été supprimé
   * (cas non nominal, on affiche un fallback).
   */
  etablissement?: Etablissement;
  /**
   * Banque indexée des questions de l'entretien (refonte mai 2026).
   * Permet au PDF de résoudre les libellés depuis les questionId stockées
   * dans `entretien.reponses{Apprenti,Maitre}`.
   */
  banqueQuestions: Record<string, QuestionBanque>;
  /** ISO de la date d'export (test injectable). */
  dateExport?: string;
}

export function LivretPdf({
  livret,
  apprenti,
  maitre,
  formateur,
  formation,
  referentiel,
  etablissement,
  banqueQuestions,
  dateExport,
}: LivretPdfProps) {
  const date = dateExport ?? new Date().toISOString();
  const nomComplet = `${apprenti.prenom} ${apprenti.nom}`;

  return (
    <Document
      title={`Livret d'apprentissage — ${nomComplet}`}
      author="GRETA Lyon Métropole"
      subject={`Livret de ${formation.intitule}`}
      creator="Maquette Livret GRETA — étape 1"
    >
      <PageDeGarde
        apprenti={apprenti}
        maitre={maitre}
        formateur={formateur}
        formation={formation}
        etablissement={etablissement}
        livret={livret}
        dateExport={date}
      />
      <PageOrganisation livret={livret} />
      {livret.entretien1 && (
        <PageEntretien
          numero={1}
          entretien={livret.entretien1}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
          banqueQuestions={banqueQuestions}
        />
      )}
      {livret.entretien2 && (
        <PageEntretien
          numero={2}
          entretien={livret.entretien2}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
          banqueQuestions={banqueQuestions}
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
        />
      ))}
      <PageEvaluationFinale livret={livret} referentiel={referentiel} />
      <PageAnnexes livret={livret} />
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants utilitaires
// ─────────────────────────────────────────────────────────────────────────────

function PiedDePage({ dateExport }: { dateExport: string }) {
  return (
    <View style={styles.piedDePage} fixed>
      <Text>GRETA Lyon Métropole — Maquette de démonstration (aucune valeur officielle)</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages} — Exporté le ${formaterDateCourte(dateExport)}`
        }
      />
    </View>
  );
}

function Champ({ label, valeur }: { label: string; valeur: string | undefined }) {
  return (
    <View style={styles.paire}>
      <Text style={styles.paireLabel}>{label}</Text>
      <Text style={styles.paireValeur}>{valeur && valeur.length > 0 ? valeur : '—'}</Text>
    </View>
  );
}

function ParagrapheLibre({ titre, valeur }: { titre: string; valeur: string | undefined }) {
  return (
    <View style={{ marginBottom: 6 }}>
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
  signature: SignaturesTripartite[keyof SignaturesTripartite];
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
        <Text style={styles.signatureValeur}>
          Signé le {formaterDateHeure(signature.dateSignature)}
        </Text>
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
}: {
  signatures: SignaturesTripartite;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
}) {
  return (
    <View style={styles.signaturesRangee} wrap={false}>
      <CarteSignature
        role="apprenti"
        signature={signatures.apprenti}
        nom={`${apprenti.prenom} ${apprenti.nom}`}
      />
      <CarteSignature
        role="maitre"
        signature={signatures.maitre}
        nom={`${maitre.prenom} ${maitre.nom}`}
      />
      <CarteSignature
        role="formateur"
        signature={signatures.formateur}
        nom={`${formateur.prenom} ${formateur.nom}`}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Page de garde
// ─────────────────────────────────────────────────────────────────────────────

function PageDeGarde({
  apprenti,
  maitre,
  formateur,
  formation,
  etablissement,
  livret,
  dateExport,
}: {
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
  formation: Formation;
  etablissement?: Etablissement;
  livret: Livret;
  dateExport: string;
}) {
  // Fallback : si l'établissement est introuvable (cas non nominal — soft
  // delete d'un lieu encore référencé), on affiche un libellé générique.
  const libelleLieu = etablissement
    ? `${etablissement.nom}${etablissement.ville ? ` — ${etablissement.ville}` : ''}`
    : 'Établissement non spécifié';
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.garde}>
        <View>
          <View style={styles.gardeMarque}>
            <Text style={styles.gardeLogo}>GLM</Text>
            <View>
              <Text style={styles.gardeTitre}>Livret d'apprentissage</Text>
              <Text style={styles.gardeSousTitre}>GRETA Lyon Métropole</Text>
            </View>
          </View>

          <View style={styles.gardeBlocIdentite}>
            <Text style={styles.gardeNom}>
              {apprenti.prenom} {apprenti.nom}
            </Text>
            <Text style={styles.gardeFormation}>
              {formation.intitule} — promotion {formation.annee}
            </Text>
          </View>

          <View style={styles.gardeMetadonnees}>
            <Ligne label="Date de naissance" valeur={formaterDateLongue(apprenti.dateNaissance)} />
            <Ligne
              label="Contrat d'apprentissage"
              valeur={`du ${formaterDateCourte(apprenti.contratDebut)} au ${formaterDateCourte(apprenti.contratFin)}`}
            />
            <Ligne label="Centre de formation" valeur={libelleLieu} />
            <Ligne
              label="Maître / Tuteur"
              valeur={`${maitre.prenom} ${maitre.nom}`}
            />
            <Ligne label="Entreprise" valeur={maitre.entreprise} />
            <Ligne label="Fonction du maître" valeur={maitre.fonction} />
            <Ligne
              label="Formateur référent"
              valeur={`${formateur.prenom} ${formateur.nom}`}
            />
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
            MAQUETTE DE DÉMONSTRATION — DONNÉES FICTIVES — AUCUNE VALEUR OFFICIELLE
          </Text>
          <Text style={styles.gardeMentions}>
            Document généré le {formaterDateLongue(dateExport)} ·{' '}
            cahier des charges v1.3 · maquette étape 1
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

function PageOrganisation({ livret }: { livret: Livret }) {
  const o = livret.organisationSuivi;

  /** Combine date + commentaire en une chaîne lisible pour le PDF. */
  const fmt = (c: { date?: string; commentaire?: string }): string => {
    const date = c.date ? formaterDateLongue(c.date) : '';
    const comm = c.commentaire?.trim() ?? '';
    if (date && comm) return `${date} — ${comm}`;
    return date || comm || '—';
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

function PageEntretien({
  numero,
  entretien,
  apprenti,
  maitre,
  formateur,
  banqueQuestions,
}: {
  numero: 1 | 2;
  entretien: EntretienTripartite;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
  banqueQuestions: Record<string, QuestionBanque>;
}) {
  const ap = entretien.appreciationMaitre;
  const da = entretien.demarchesAdministratives;
  const cp = entretien.conditionsPratiques;
  const ai = entretien.aidesDemandees;
  const c = entretien.commentaires;

  /** Restitue chaque question sélectionnée + sa réponse (texte ou oui/non). */
  const renduQuestions = (
    ids: ReadonlyArray<string>,
    reponses: Record<string, string | boolean | null>,
    cible: 'apprenti' | 'maitre',
  ) => {
    const items = ids
      .map((id) => banqueQuestions[id])
      .filter((q): q is QuestionBanque => !!q && q.cible === cible);
    if (items.length === 0) {
      return (
        <Text style={styles.vide}>
          Aucune question sélectionnée pour {cible === 'apprenti' ? "l'apprenti·e" : 'le maître'}.
        </Text>
      );
    }
    return items.map((q) => {
      const v = reponses[q.id];
      if (q.type === 'oui-non') {
        return (
          <Champ
            key={q.id}
            label={q.libelle}
            valeur={libelleOuiNon(typeof v === 'boolean' ? v : null)}
          />
        );
      }
      const txt = typeof v === 'string' ? v : '';
      return <ParagrapheLibre key={q.id} titre={q.libelle} valeur={txt} />;
    });
  };

  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <Text style={styles.h1}>Entretien tripartite n° {numero}</Text>
        <Champ
          label="Date de l'entretien"
          valeur={entretien.dateEntretien ? formaterDateLongue(entretien.dateEntretien) : undefined}
        />

        <Text style={styles.h2}>Apprenti·e</Text>
        {renduQuestions(
          entretien.questionsApprentiSelectionnees,
          entretien.reponsesApprenti,
          'apprenti',
        )}

        <Text style={styles.h2}>Maître / Tuteur</Text>
        {renduQuestions(
          entretien.questionsMaitreSelectionnees,
          entretien.reponsesMaitre,
          'maitre',
        )}

        <Text style={styles.h3}>Appréciations (maître)</Text>
        <Champ label="Ponctualité" valeur={libelleAppreciation(ap.ponctualite)} />
        <Champ
          label="Compréhension consignes"
          valeur={libelleAppreciation(ap.comprehensionConsignes)}
        />
        <Champ label="Qualité du travail" valeur={libelleAppreciation(ap.qualiteTravail)} />
        <Champ label="Intégration" valeur={libelleAppreciation(ap.integration)} />
        {ap.commentaires && (
          <ParagrapheLibre titre="Commentaires du maître" valeur={ap.commentaires} />
        )}

        <Text style={styles.h2}>Démarches administratives</Text>
        <Champ label="Contrat signé" valeur={libelleOuiNon(da.contratSigne)} />
        <Champ label="Visite médicale" valeur={libelleOuiNon(da.visiteMedicale)} />
        <Champ label="Permis de conduire" valeur={libelleOuiNon(da.permisConduire)} />
        <Champ label="Voiture" valeur={libelleOuiNon(da.voiture)} />
        {da.remarques && <ParagrapheLibre titre="Remarques" valeur={da.remarques} />}

        <Text style={styles.h2}>Conditions pratiques</Text>
        <Champ label="Hébergement (centre)" valeur={cp.hebergementCentre} />
        <Champ label="Hébergement (entreprise)" valeur={cp.hebergementEntreprise} />
        <Champ label="Transport (centre)" valeur={cp.transportCentre} />
        <Champ label="Transport (entreprise)" valeur={cp.transportEntreprise} />

        <Text style={styles.h2}>Aides demandées</Text>
        <Champ label="Logement" valeur={libelleOuiNon(ai.logement)} />
        <Champ label="Premier équipement" valeur={libelleOuiNon(ai.premierEquipement)} />
        <Champ label="Permis" valeur={libelleOuiNon(ai.permis)} />
        {ai.autres && <ParagrapheLibre titre="Autres aides" valeur={ai.autres} />}

        <Text style={styles.h2}>Commentaires</Text>
        <ParagrapheLibre titre="Apprenti·e" valeur={c.apprenti} />
        <ParagrapheLibre titre="Maître" valeur={c.maitre} />
        <ParagrapheLibre titre="Formateur" valeur={c.formateur} />

        <Text style={styles.h2}>Signatures</Text>
        <BlocSignaturesPdf
          signatures={entretien.signatures}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
        />
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section : Fiche de suivi par période
// ─────────────────────────────────────────────────────────────────────────────

function PageFiche({
  fiche,
  referentiel,
  apprenti,
  maitre,
  formateur,
}: {
  fiche: FicheSuiviPeriode;
  referentiel: Referentiel;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
}) {
  const competencesById = new Map(
    referentiel.blocs.flatMap((b) => b.competences.map((c) => [c.id, c])),
  );

  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={styles.h1}>Période en Entreprise n° {fiche.numeroPeriode}</Text>
          <Text
            style={[
              styles.badgeEtat,
              { backgroundColor: couleurEtatFiche(fiche.etat) },
            ]}
          >
            {libelleEtatFiche(fiche.etat)}
          </Text>
        </View>
        <Text style={styles.italique}>
          Du {formaterDateLongue(fiche.dateDebut)} au {formaterDateLongue(fiche.dateFin)}
        </Text>

        {/* Suivi GRETA CFA — 2 zones de texte (refonte mai 2026) */}
        <Text style={styles.h2}>Suivi de la formation au GRETA CFA</Text>
        <ParagrapheLibre titre="Apprenti·e" valeur={fiche.suiviGretaCfa.apprenti} />
        <ParagrapheLibre titre="Formateur référent" valeur={fiche.suiviGretaCfa.formateur} />

        {/* Tableau tri-colonnes (compétences + évaluations + retour apprenti) */}
        <Text style={styles.h2}>Activités et évaluations</Text>
        {fiche.suiviEntreprise.length === 0 ? (
          <Text style={styles.vide}>Aucune compétence évaluée.</Text>
        ) : (
          <View style={styles.tableau}>
            <View style={[styles.tableauLigne, styles.tableauEnTete]}>
              <Text style={[styles.tableauCellule, { width: '34%' }]}>Compétence</Text>
              <Text style={[styles.tableauCellule, { width: '16%' }]}>Évaluation entreprise</Text>
              <Text style={[styles.tableauCellule, { width: '16%' }]}>Évaluation centre</Text>
              <Text style={[styles.tableauCelluleDerniere, { width: '34%' }]}>
                Retour {apprenti.prenom}
              </Text>
            </View>
            {fiche.suiviEntreprise.map((l, idx) => {
              const comp = l.competenceId ? competencesById.get(l.competenceId) : null;
              const libelleC = comp
                ? `${comp.code} — ${comp.libelle}`
                : (l.libelleLibre ?? 'Activité hors référentiel');
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
                  <Text style={[styles.tableauCellule, { width: '34%' }]}>{libelleC}</Text>
                  <Text style={[styles.tableauCellule, { width: '16%' }]}>
                    {libelleNiveau(l.evaluationEntreprise)}
                  </Text>
                  <Text style={[styles.tableauCellule, { width: '16%' }]}>
                    {libelleNiveau(l.evaluationGreta)}
                  </Text>
                  <Text style={[styles.tableauCelluleDerniere, { width: '34%' }]}>
                    {l.retourApprenti || '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Observations */}
        <Text style={styles.h2}>Observations</Text>
        <ParagrapheLibre titre="Apprenti·e" valeur={fiche.observations.apprenti} />
        <ParagrapheLibre titre="Maître / Tuteur" valeur={fiche.observations.maitre} />
        <ParagrapheLibre titre="Formateur référent" valeur={fiche.observations.formateur} />

        {/* Signatures */}
        <Text style={styles.h2}>Signatures</Text>
        <BlocSignaturesPdf
          signatures={fiche.signatures}
          apprenti={apprenti}
          maitre={maitre}
          formateur={formateur}
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
                  {formaterDateHeure(entree.dateIso)} — {entree.auteurNom} (
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

function PageEvaluationFinale({
  livret,
  referentiel,
}: {
  livret: Livret;
  referentiel: Referentiel;
}) {
  const synthese = synthetiserCompetences(livret.fichesSuivi, referentiel);
  const lignes = livret.evaluationFinaleCompetences.lignes;
  const stats = calculerStatsParBloc(referentiel, lignes, synthese);

  return (
    <Page size="A4" style={styles.page}>
      <PiedDePage dateExport={new Date().toISOString()} />
      <View>
        <Text style={styles.h1}>Évaluation finale</Text>

        <Text style={styles.h2}>Synthèse par bloc de compétences</Text>
        {stats.map((s) => (
          <View key={s.bloc.id} style={[styles.encart, { marginBottom: 6 }]}>
            <Text style={styles.encartTitre}>
              {s.bloc.code} — {s.bloc.libelle}
            </Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>
              Entreprise — Maîtrisé : {s.entreprise.maitrise} · En cours :{' '}
              {s.entreprise.partiel} · Non maîtrisé : {s.entreprise.nonMaitrise} · Non
              évalué : {s.entreprise.nonEvalue}
            </Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>
              Centre — Maîtrisé : {s.centre.maitrise} · En cours : {s.centre.partiel} ·
              Non maîtrisé : {s.centre.nonMaitrise} · Non évalué : {s.centre.nonEvalue}
            </Text>
          </View>
        ))}

        <Text style={styles.h2}>Compétences (entreprise / centre)</Text>
        {referentiel.blocs.map((bloc) => (
          <View key={bloc.id} style={{ marginBottom: 8 }} wrap={false}>
            <Text style={styles.h3}>
              {bloc.code} — {bloc.libelle}
            </Text>
            <View style={styles.tableau}>
              <View style={[styles.tableauLigne, styles.tableauEnTete]}>
                <Text style={[styles.tableauCellule, { width: '50%' }]}>Compétence</Text>
                <Text style={[styles.tableauCellule, { width: '20%' }]}>Acquis entreprise</Text>
                <Text style={[styles.tableauCellule, { width: '20%' }]}>Acquis centre</Text>
                <Text style={[styles.tableauCelluleDerniere, { width: '10%' }]}>Source</Text>
              </View>
              {bloc.competences.map((c, idx) => {
                const ligne = lignes.find((l) => l.competenceId === c.id) ?? {
                  competenceId: c.id,
                  acquisEntreprise: null,
                  acquisCentre: null,
                };
                const ent = valeurEffective(ligne, synthese, 'acquisEntreprise');
                const cen = valeurEffective(ligne, synthese, 'acquisCentre');
                return (
                  <View
                    key={c.id}
                    style={
                      idx === bloc.competences.length - 1
                        ? styles.tableauLigneSansBordure
                        : styles.tableauLigne
                    }
                  >
                    <Text style={[styles.tableauCellule, { width: '50%' }]}>
                      {c.code} — {c.libelle}
                    </Text>
                    <Text style={[styles.tableauCellule, { width: '20%' }]}>
                      {libelleNiveau(ent.valeur)}
                    </Text>
                    <Text style={[styles.tableauCellule, { width: '20%' }]}>
                      {libelleNiveau(cen.valeur)}
                    </Text>
                    <Text style={[styles.tableauCelluleDerniere, { width: '10%', fontSize: 8 }]}>
                      {ent.source === 'synthese' || cen.source === 'synthese' ? 'fiches' : 'final'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={styles.h2}>Attitudes professionnelles</Text>
        <View style={styles.tableau}>
          <View style={[styles.tableauLigne, styles.tableauEnTete]}>
            <Text style={[styles.tableauCellule, { width: '45%' }]}>Attitude</Text>
            <Text style={[styles.tableauCellule, { width: '15%' }]}>Maître</Text>
            <Text style={[styles.tableauCellule, { width: '15%' }]}>Formateur</Text>
            <Text style={[styles.tableauCelluleDerniere, { width: '25%' }]}>Commentaire</Text>
          </View>
          {referentiel.attitudes.map((a, idx) => {
            const ligne = livret.evaluationFinaleAttitudes.lignes.find(
              (l) => l.attitudeId === a.id,
            );
            const commentaire = [ligne?.commentaireMaitre, ligne?.commentaireFormateur]
              .filter(Boolean)
              .join(' — ');
            return (
              <View
                key={a.id}
                style={
                  idx === referentiel.attitudes.length - 1
                    ? styles.tableauLigneSansBordure
                    : styles.tableauLigne
                }
              >
                <Text style={[styles.tableauCellule, { width: '45%' }]}>{a.libelle}</Text>
                <Text style={[styles.tableauCellule, { width: '15%' }]}>
                  {libelleAppreciation(ligne?.evaluationMaitre)}
                </Text>
                <Text style={[styles.tableauCellule, { width: '15%' }]}>
                  {libelleAppreciation(ligne?.evaluationFormateur)}
                </Text>
                <Text style={[styles.tableauCelluleDerniere, { width: '25%' }]}>
                  {commentaire || '—'}
                </Text>
              </View>
            );
          })}
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
                      {formaterDateHeure(entree.dateIso)} — {entree.auteurNom} (
                      {libelleRole(entree.auteurRole)})
                    </Text>
                    <Text style={{ fontSize: 9 }}>{entree.motif}</Text>
                  </View>
                ))}
              </View>
            ))
        )}

        <Text style={[styles.italique, { marginTop: 24, fontSize: 8 }]}>
          Document généré par la maquette du livret d'apprentissage GRETA Lyon Métropole —
          étape 1, cahier des charges v1.3. Ce document n'a aucune valeur officielle.
        </Text>
      </View>
    </Page>
  );
}
