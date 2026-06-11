/**
 * Génère "conformite-rgpd-etapes.docx" : tableau des obligations RGPD STRICTES
 * (33 points obligatoires) + annexe des 9 recommandations reportables.
 *
 * Recentré 2026-05-26 (2e passe) : retrait des mineurs, focus obligatoire.
 *
 * Usage : node scripts/generer-rgpd-docx.cjs
 * Dépendance : docx-js installé globalement (npm install -g docx)
 */

const fs = require('fs');
const path = require('path');

const docxPath = require('child_process')
  .execSync('npm root -g', { encoding: 'utf8' })
  .trim();
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, HeadingLevel,
} = require(path.join(docxPath, 'docx'));

// ─── Palette ───────────────────────────────────────────────────────────────
const COULEUR_PRIMAIRE = '1E3A8A';
const COULEUR_HEADER_TEXTE = 'FFFFFF';
const COULEUR_LIGNE_PAIRE = 'F8FAFC';
const COULEUR_LIGNE_IMPAIRE = 'FFFFFF';
const COULEUR_BORDURE = 'CBD5E1';
const COULEUR_STATUT_A_MENER = 'DC2626';
const COULEUR_STATUT_MUTUALISE = 'D97706';
const COULEUR_STATUT_ACQUIS = '059669';

// ─── 33 obligations strictes ────────────────────────────────────────────────
const OBLIGATIONS = [
  { num: 1, categorie: 'Gouvernance', point: 'Identifier le responsable de traitement (art. 4.7 + 13.1.a)', pourquoi: "Toute personne doit savoir qui est juridiquement responsable. Le défaut d'information est sanctionnable.", action: "Nommer « GRETA Lyon Métropole » (+ représentant légal, SIRET) dans les mentions légales et le registre.", statut: 'À mener' },
  { num: 2, categorie: 'Gouvernance', point: 'Désigner / contacter le DPO (art. 37)', pourquoi: "Obligatoire pour tout organisme public, sans seuil de volume.", action: "Récupérer le contact du DPO GRETA existant, le publier dans les mentions.", statut: 'Mutualisé GRETA' },
  { num: 3, categorie: 'Gouvernance', point: 'Tenir le registre des activités de traitement (art. 30)', pourquoi: "Pièce exigée en premier lors d'un contrôle CNIL.", action: "Ajouter une fiche « Livret d'apprentissage » au registre GRETA (finalités, données, destinataires, durées, sécurité, sous-traitants).", statut: 'À mener' },
  { num: 4, categorie: 'Base légale', point: 'Identifier et documenter la base légale (art. 6)', pourquoi: "Sans base légale, le traitement est intégralement illicite.", action: "Retenir « mission d'intérêt public » (art. 6.1.e) appuyée sur le Code de l'éducation ; documenter au registre.", statut: 'À mener' },
  { num: 5, categorie: 'Finalités', point: 'Documenter les finalités (art. 5.1.b)', pourquoi: "Interdiction de détourner les données vers un autre usage que celui annoncé.", action: "Lister au registre + mentions : suivi pédagogique, co-édition tripartite, traçabilité signatures, export PDF. Exclure revente / profilage.", statut: 'À mener' },
  { num: 6, categorie: 'Information', point: "Mentions d'information accessibles (art. 13)", pourquoi: "Information due au moment de la collecte. Manquement = cause fréquente de plainte.", action: "Une page mentions légales + politique de confidentialité (accessible depuis le footer) couvrant les 8 items de l'art. 13.", statut: 'À mener' },
  { num: 7, categorie: 'Droits', point: "Droit d'accès (art. 15)", pourquoi: "Droit le plus invoqué ; non-réponse dans le mois = manquement.", action: "Procédure de réponse (email DPO, délai 1 mois) + capacité d'exporter les données d'une personne (l'export PDF y contribue).", statut: 'À mener' },
  { num: 8, categorie: 'Droits', point: 'Droit de rectification (art. 16)', pourquoi: "Correction sans délai d'une donnée inexacte.", action: "Permettre la correction via le coordo + tracer la modification.", statut: 'À mener' },
  { num: 9, categorie: 'Droits', point: "Droit à l'effacement (art. 17)", pourquoi: "Droit limité ici (conservation légale) mais une réponse motivée reste due.", action: "Documenter dans les mentions que l'effacement est différé jusqu'à expiration des durées légales + workflow de suppression à l'expiration.", statut: 'À mener' },
  { num: 10, categorie: 'Droits', point: "Droit d'opposition et de limitation (art. 18 + 21)", pourquoi: "Opposable sous conditions même face à une mission d'intérêt public.", action: "Canal DPO pour examen au cas par cas, documenté dans les mentions.", statut: 'À mener' },
  { num: 11, categorie: 'Droits', point: 'Procédure de réponse aux demandes (art. 12)', pourquoi: "Délai d'1 mois imposé ; non-réponse sanctionnable.", action: "Boîte mail dédiée (dpo@<domaine-greta>) + registre des demandes + modèles de réponse.", statut: 'À mener' },
  { num: 12, categorie: 'Données', point: 'Minimisation des données (art. 5.1.c)', pourquoi: "Toute donnée surnuméraire est illicite.", action: "Auditer les champs collectés, justifier chacun, supprimer le superflu.", statut: 'À mener' },
  { num: 13, categorie: 'Données', point: 'Pas de données sensibles art. 9', pourquoi: "Interdiction de traiter santé, origine, opinions, biométrie sauf exception.", action: "Consigne aux formateurs : pas de données sensibles dans les champs libres. Pas de photo.", statut: 'À mener' },
  { num: 14, categorie: 'Données', point: 'Exactitude et mise à jour (art. 5.1.d)', pourquoi: "Des données inexactes constituent un traitement illicite.", action: "Mise à jour possible par le coordo (déjà en place) + procédure de signalement.", statut: 'À mener' },
  { num: 15, categorie: 'Conservation', point: 'Définir les durées de conservation (art. 5.1.e)', pourquoi: "La conservation indéfinie est interdite.", action: "Définir : durée du contrat + 5 ans d'archivage (à confirmer service archives GRETA) ; documenter au registre.", statut: 'À mener' },
  { num: 16, categorie: 'Conservation', point: 'Purge / anonymisation effective en fin de durée (art. 5.1.e)', pourquoi: "Définir des durées sans les appliquer est un manquement aggravé.", action: "Mécanisme de suppression ou d'anonymisation à l'expiration (job backend ou procédure manuelle tracée).", statut: 'À mener' },
  { num: 17, categorie: 'Sécurité', point: 'HTTPS — chiffrement en transit (art. 32)', pourquoi: "Des données en clair sur le réseau sont interceptables.", action: "Reproduire HTTPS (Let's Encrypt) sur le serveur GRETA + redirection 80 vers 443.", statut: 'Déjà acquis' },
  { num: 18, categorie: 'Sécurité', point: "Authentification + contrôle d'accès (art. 32)", pourquoi: "Sans authentification réelle, n'importe qui accède aux données.", action: "Auth réelle (SSO Entra + MdP local) + matrice de droits appliquée.", statut: 'À mener' },
  { num: 19, categorie: 'Sécurité', point: 'Hashage robuste des mots de passe (art. 32)', pourquoi: "Une fuite ne doit pas révéler les mots de passe en clair.", action: "argon2id (ou bcrypt coût ≥ 12) ; jamais de mot de passe en clair.", statut: 'À mener' },
  { num: 20, categorie: 'Sécurité', point: "Contrôle d'accès vérifié côté backend (art. 32)", pourquoi: "La matrice côté client est falsifiable ; elle doit être doublée côté serveur.", action: "Réimplémenter la vérification des droits côté serveur sur chaque requête.", statut: 'À mener' },
  { num: 21, categorie: 'Sécurité', point: 'Journalisation des accès et mutations (art. 32)', pourquoi: "Sans logs, ni détection ni enquête d'incident possibles.", action: "Logger connexions, accès livret tiers, mutations sensibles, suppressions ; conserver 6-12 mois.", statut: 'À mener' },
  { num: 22, categorie: 'Sécurité', point: 'Sauvegardes + test de restauration (art. 32)', pourquoi: "La perte de données est une atteinte à la disponibilité (art. 32).", action: "Sauvegardes régulières chiffrées + test de restauration périodique.", statut: 'À mener' },
  { num: 23, categorie: 'Sécurité', point: 'Développement sécurisé (art. 32)', pourquoi: "Les vulnérabilités web courantes représentent un risque élevé.", action: "Couvrir XSS / CSRF / IDOR / injection SQL + headers de sécurité (CSP, X-Frame-Options).", statut: 'À mener' },
  { num: 24, categorie: 'Sécurité', point: 'Mises à jour de sécurité (art. 32)', pourquoi: "Une faille connue non corrigée est un manquement.", action: "Politique de patching serveur + suivi CVE des dépendances npm.", statut: 'Mutualisé GRETA' },
  { num: 25, categorie: 'Sous-traitants', point: 'Inventaire + contrats DPA (art. 28)', pourquoi: "Chaque sous-traitant doit avoir un contrat de traitement (DPA).", action: "Lister les sous-traitants (Mailjet, Microsoft, hébergeur) + signer/archiver les DPA.", statut: 'À mener' },
  { num: 26, categorie: 'Sous-traitants', point: 'DPA Microsoft Entra ID (art. 28)', pourquoi: "Microsoft est sous-traitant de l'authentification.", action: "Signer le DPA Microsoft Online Services via le tenant Azure.", statut: 'À mener' },
  { num: 27, categorie: 'Sous-traitants', point: 'DPA Mailjet (art. 28)', pourquoi: "Mailjet est sous-traitant de l'envoi d'emails.", action: "Accepter / signer le DPA Mailjet à l'inscription ; vérifier l'hébergement UE.", statut: 'À mener' },
  { num: 28, categorie: 'Transferts', point: 'Cadrer le transfert hors UE Microsoft (art. 44-49)', pourquoi: "Microsoft implique un transfert vers les USA à encadrer.", action: "Documenter au registre : transfert Microsoft, base juridique Data Privacy Framework.", statut: 'À mener' },
  { num: 29, categorie: 'Privacy by design', point: 'Protection dès la conception (art. 25)', pourquoi: "Obligation légale de concevoir un système protecteur dès l'origine.", action: "Conserver les acquis maquette : matrice de droits, verrous métier, traçabilité R10, suppressions bloquées.", statut: 'Déjà acquis' },
  { num: 30, categorie: 'Privacy by default', point: 'Paramètres restrictifs par défaut (art. 25)', pourquoi: "Visibilité minimale par défaut imposée par la loi.", action: "Conserver : coordo/admin sans droit pédagogique, admin ne peut signer, accès minimal par défaut.", statut: 'Déjà acquis' },
  { num: 31, categorie: 'Démo', point: 'Pas de données réelles en démonstration', pourquoi: "Une démo avec données réelles est un traitement non déclaré.", action: "Maintenir les fixtures fictives + environnement de démo isolé de la production.", statut: 'Déjà acquis' },
  { num: 32, categorie: 'Incidents', point: 'Notification CNIL < 72 h (art. 33)', pourquoi: "Obligation de notifier toute violation à risque sous 72 heures.", action: "Procédure documentée + déclencheur (DPO) + modèle de notification pré-rédigé.", statut: 'À mener' },
  { num: 33, categorie: 'Incidents', point: 'Notification aux personnes si risque élevé (art. 34)', pourquoi: "Obligation d'informer les personnes concernées en cas de risque élevé.", action: "Modèle d'email d'information + canal de communication maîtrisé.", statut: 'À mener' },
];

// ─── 9 recommandations reportables ──────────────────────────────────────────
const RECOMMANDATIONS = [
  { num: 'R1', point: 'AIPD complète', pourquoi: "Non obligatoire ici (0/9 critères CNIL), mais renforce l'accountability et anticipe une réintégration des mineurs.", quand: "Si réintégration des mineurs, ou sur recommandation DPO" },
  { num: 'R2', point: 'Politique RGPD interne formelle', pourquoi: "Document d'accountability ; le GRETA en a probablement déjà une à compléter.", quand: "Mise en production" },
  { num: 'R3', point: 'Notices distinctes par catégorie de personne', pourquoi: "L'information (obligation #6) est obligatoire ; la décliner en notices séparées est un confort.", quand: "Mise en production" },
  { num: 'R4', point: 'Distinction base active / archivage intermédiaire', pourquoi: "Modalité fine des durées (#15-16) ; une purge simple suffit pour être conforme.", quand: "Mise en production" },
  { num: 'R5', point: 'Chiffrement au repos des données non-auth', pourquoi: "Obligatoire seulement pour les données d'authentification ; recommandé pour le reste (données non sensibles).", quand: "Mise en production" },
  { num: 'R6', point: 'Pentest / audit sécurité externe', pourquoi: "Renforce et prouve la sécurité ; non obligatoire pour une structure de cette taille.", quand: "Avant ou peu après mise en production" },
  { num: 'R7', point: "Monitoring élaboré de détection d'incident", pourquoi: "Le principe de détection est couvert par #21 + #32 ; un outillage avancé (SIEM) est un plus.", quand: "Amélioration continue" },
  { num: 'R8', point: 'Hébergement UE — serveur GRETA propre', pourquoi: "Souveraineté ; acquis « gratuitement » à la migration mais pas strictement exigé si DPA en place.", quand: "Migration serveur GRETA" },
  { num: 'R9', point: 'Conformité au référentiel CNIL « Gestion des élèves »', pourquoi: "Outil qui facilite et valide la conformité ; pas une obligation autonome.", quand: "Mise en production" },
];

// ─── Glossaire (par catégorie) ───────────────────────────────────────────────
const GLOSSAIRE = [
  {
    titre: 'A. Acteurs et gouvernance',
    termes: [
      { terme: 'RGPD', definition: "Règlement Général sur la Protection des Données (UE 2016/679), applicable depuis mai 2018. Encadre tout traitement de données personnelles de personnes physiques.", enjeu: "Toute structure traitant des données doit s'y conformer, sous peine de sanctions pouvant atteindre 20 M€ ou 4 % du chiffre d'affaires mondial." },
      { terme: 'CNIL', definition: "Commission Nationale de l'Informatique et des Libertés : autorité française de contrôle de l'application du RGPD.", enjeu: "C'est elle qui contrôle, sanctionne, reçoit les plaintes et qu'il faut notifier en cas de violation de données." },
      { terme: 'Responsable de traitement', definition: "L'entité (ici le GRETA Lyon Métropole) qui décide pourquoi et comment les données sont traitées.", enjeu: "Elle porte la responsabilité juridique de la conformité ; c'est à elle que les personnes réclament leurs droits." },
      { terme: 'DPO (Délégué à la Protection des Données)', definition: "Personne chargée de veiller à la conformité RGPD et de servir d'interlocuteur à la CNIL et aux personnes concernées.", enjeu: "Obligatoire pour un organisme public. Il valide les choix (mentions, durées) et reçoit les demandes d'exercice des droits." },
      { terme: 'Sous-traitant', definition: "Prestataire qui traite des données pour le compte du responsable (ici Microsoft pour le SSO, Mailjet pour les emails).", enjeu: "Chaque sous-traitant doit être encadré par un contrat (DPA), sinon le responsable est en infraction." },
      { terme: 'DPA (contrat de sous-traitance)', definition: "Data Processing Agreement : contrat imposé par l'art. 28 qui fixe les obligations du sous-traitant (sécurité, finalité limitée, suppression en fin de contrat).", enjeu: "Sans DPA signé, le recours à un prestataire qui touche aux données est illicite." },
      { terme: 'Accountability', definition: "Principe de responsabilisation : non seulement être conforme, mais pouvoir le prouver par une documentation.", enjeu: "En cas de contrôle, l'absence de traces écrites aggrave systématiquement toute sanction." },
      { terme: 'Registre des activités de traitement', definition: "Inventaire documenté de tous les traitements de données de l'organisme (art. 30).", enjeu: "Pièce exigée en premier par la CNIL lors d'un contrôle ; son absence est un manquement direct." },
      { terme: 'AIPD', definition: "Analyse d'Impact relative à la Protection des Données : étude approfondie des risques, obligatoire seulement pour les traitements à risque élevé (art. 35).", enjeu: "Non obligatoire ici (0 des 9 critères CNIL rempli depuis le retrait des mineurs) — mais redevient obligatoire si les mineurs sont réintégrés." },
    ],
  },
  {
    titre: 'B. Fondements du traitement',
    termes: [
      { terme: 'Base légale', definition: "Justification juridique qui rend un traitement licite ; l'art. 6 en prévoit six (consentement, contrat, obligation légale, mission d'intérêt public, etc.).", enjeu: "Sans base légale identifiée, l'intégralité du traitement est illégale." },
      { terme: "Mission d'intérêt public", definition: "Base légale (art. 6.1.e) adaptée aux services publics agissant dans le cadre de leurs missions.", enjeu: "Permet de traiter les données sans recueillir le consentement — cohérent avec le rôle éducatif du GRETA et plus solide que le consentement." },
      { terme: 'Finalité', definition: "Objectif précis et déclaré pour lequel les données sont collectées.", enjeu: "Interdiction d'utiliser les données pour un autre but que celui annoncé (pas de revente, pas de profilage)." },
      { terme: 'Minimisation', definition: "Principe de ne collecter que les données strictement nécessaires à la finalité (art. 5.1.c).", enjeu: "Toute donnée superflue est une infraction et un risque inutile en cas de fuite." },
      { terme: 'Données sensibles (art. 9)', definition: "Catégories particulières révélant la santé, l'origine, les opinions politiques/religieuses, l'orientation sexuelle ou les données biométriques.", enjeu: "Interdiction de principe de les traiter ; les champs de commentaires libres sont le point de vigilance à surveiller." },
      { terme: 'Durée de conservation', definition: "Période maximale pendant laquelle les données peuvent être conservées (art. 5.1.e).", enjeu: "La conservation indéfinie est interdite : il faut définir une durée ET l'appliquer effectivement." },
      { terme: 'Archivage intermédiaire', definition: "Conservation à accès restreint après la fin de l'usage courant, pour répondre à une obligation légale.", enjeu: "Permet de respecter les obligations (comptables, pédagogiques) sans garder les données en accès « actif » quotidien." },
      { terme: 'Anonymisation', definition: "Suppression irréversible de tout élément permettant d'identifier une personne.", enjeu: "Une donnée réellement anonymisée sort du champ du RGPD ; c'est une alternative à la suppression en fin de durée." },
      { terme: 'Privacy by design', definition: "Intégration de la protection des données dès la conception du système (art. 25).", enjeu: "Obligation légale déjà bien acquise dans la maquette (matrice de droits, verrous métier, traçabilité)." },
      { terme: 'Privacy by default', definition: "Réglage des paramètres au plus protecteur par défaut (art. 25).", enjeu: "Un nouvel utilisateur ne doit avoir accès qu'au strict minimum ; coordo/admin sans droit pédagogique par défaut." },
    ],
  },
  {
    titre: 'C. Droits des personnes concernées',
    termes: [
      { terme: "Mentions d'information", definition: "Texte informant la personne de l'usage de ses données au moment de la collecte (art. 13).", enjeu: "Obligation dont l'absence est la cause la plus fréquente de plainte pour les services en ligne." },
      { terme: "Droit d'accès", definition: "Droit d'obtenir confirmation et copie de ses propres données (art. 15).", enjeu: "Le droit le plus invoqué ; une non-réponse sous 1 mois constitue un manquement." },
      { terme: 'Droit de rectification', definition: "Droit de faire corriger une donnée personnelle inexacte ou incomplète (art. 16).", enjeu: "Une donnée fausse maintenue en base est elle-même une infraction (principe d'exactitude)." },
      { terme: "Droit à l'effacement (droit à l'oubli)", definition: "Droit de demander la suppression de ses données (art. 17).", enjeu: "Limité ici par les obligations légales de conservation, mais une réponse motivée reste due." },
      { terme: "Droit d'opposition", definition: "Droit de s'opposer à un traitement pour des raisons tenant à sa situation particulière (art. 21).", enjeu: "Opposable même face à une mission d'intérêt public, sous conditions ; chaque refus doit être motivé." },
      { terme: 'Droit à la limitation', definition: "Droit de demander le gel temporaire de l'usage des données le temps d'un examen (art. 18).", enjeu: "Suppose un mécanisme de mise en pause des traitements en cours d'instruction." },
      { terme: 'Portabilité', definition: "Droit de récupérer ses données dans un format réutilisable (art. 20).", enjeu: "NON applicable ici : réservée aux traitements fondés sur le consentement ou un contrat, d'où son écartement." },
      { terme: 'Violation de données', definition: "Tout incident de sécurité entraînant la perte, l'altération, l'accès non autorisé ou la divulgation de données.", enjeu: "Déclenche l'obligation de notification à la CNIL sous 72 h, et aux personnes si le risque est élevé." },
    ],
  },
  {
    titre: 'D. Sécurité technique',
    termes: [
      { terme: 'HTTPS / TLS', definition: "Protocole qui chiffre les échanges entre le navigateur de l'utilisateur et le serveur.", enjeu: "Sans lui, les données (dont les mots de passe) circulent en clair et sont interceptables sur le réseau." },
      { terme: 'Chiffrement en transit / au repos', definition: "Protection des données pendant leur circulation (transit) ou leur stockage sur disque (repos).", enjeu: "Le transit limite l'interception ; le repos limite l'impact d'un vol de disque ou d'une fuite de sauvegarde." },
      { terme: 'Hashage', definition: "Transformation irréversible d'un mot de passe en une empreinte impossible à inverser.", enjeu: "Une fuite de la base ne révèle pas les mots de passe en clair, contrairement à un stockage direct." },
      { terme: 'argon2id / bcrypt', definition: "Algorithmes de hashage de mots de passe reconnus et résistants (recommandés par l'OWASP).", enjeu: "Les algorithmes obsolètes (MD5, SHA-1) sont cassables en quelques heures avec un GPU moderne." },
      { terme: 'SSO (authentification unique)', definition: "Single Sign-On : connexion via un compte existant (ici Microsoft) sans créer de nouveau mot de passe.", enjeu: "Moins de mots de passe à gérer pour les personnels GRETA et sécurité déléguée à Microsoft." },
      { terme: 'Entra ID', definition: "Service d'identité Microsoft (ex-Azure Active Directory) pour les comptes professionnels.", enjeu: "Fournit le SSO et impose nativement le 2FA pour les personnels GRETA, sans développement supplémentaire." },
      { terme: '2FA / MFA', definition: "Authentification à deux (ou plusieurs) facteurs : mot de passe + un second élément (code, téléphone).", enjeu: "Bloque l'accès au compte même si le mot de passe est volé." },
      { terme: 'Matrice de droits', definition: "Table définissant qui (quel rôle) peut faire quoi (quelle action).", enjeu: "Doit être vérifiée côté serveur : la version côté navigateur est falsifiable par un utilisateur malveillant." },
      { terme: 'OWASP Top 10', definition: "Liste de référence des 10 vulnérabilités web les plus critiques, tenue par la fondation OWASP.", enjeu: "Socle minimal d'un développement sécurisé ; couvert en premier par tout audit ou pentest." },
      { terme: 'XSS / CSRF / IDOR / Injection SQL', definition: "Familles d'attaques web courantes : injection de script, falsification de requête, accès à une ressource d'autrui, injection de commande base de données.", enjeu: "Chacune peut compromettre tout ou partie des données ; à neutraliser dès la conception." },
      { terme: 'Headers de sécurité (CSP, X-Frame-Options…)', definition: "En-têtes HTTP qui durcissent le comportement du navigateur contre certaines attaques.", enjeu: "Défense simple et efficace contre le XSS et le détournement d'affichage (clickjacking)." },
      { terme: 'Rate limiting', definition: "Limitation du nombre de requêtes autorisées sur une période pour un même utilisateur ou une même IP.", enjeu: "Empêche le test massif de mots de passe (force brute) et le scan de jetons d'activation." },
      { terme: 'Journalisation (logs)', definition: "Enregistrement horodaté des connexions, accès et actions sensibles.", enjeu: "Sans logs, il est impossible de détecter un incident ou d'enquêter après coup (exigence de l'art. 32)." },
      { terme: 'SIEM', definition: "Outil avancé de centralisation et d'analyse automatisée des journaux de sécurité.", enjeu: "Utile pour une détection fine, mais non obligatoire pour une structure de cette taille." },
      { terme: 'Pentest', definition: "Test d'intrusion réalisé par un tiers pour détecter les failles avant un attaquant.", enjeu: "Recommandé pour prouver la sécurité avant mise en production ; non strictement obligatoire ici." },
      { terme: 'CVE', definition: "Référence publique standardisée d'une faille de sécurité connue dans un logiciel.", enjeu: "Il faut suivre les CVE des dépendances (npm) et appliquer les correctifs rapidement." },
      { terme: "Token (jeton)", definition: "Chaîne aléatoire à usage et durée limités (ici : activation de compte, réinitialisation de mot de passe).", enjeu: "Stocké hashé et expirant, c'est le mécanisme sécurisé pour l'activation par email sans transmettre de mot de passe." },
    ],
  },
  {
    titre: 'E. Sous-traitance et transferts internationaux',
    termes: [
      { terme: 'Transfert hors UE', definition: "Envoi ou accès à des données depuis un pays situé hors de l'Union européenne.", enjeu: "Interdit par défaut (art. 44-49) sauf garanties appropriées — le cas de Microsoft, dont des datacenters sont aux USA." },
      { terme: 'Data Privacy Framework (DPF)', definition: "Accord UE-USA (2023) autorisant les transferts vers les entreprises américaines qui y adhèrent.", enjeu: "Base juridique du recours à Microsoft ; à surveiller car un tel accord peut être annulé par la justice européenne (cf. Privacy Shield)." },
      { terme: 'Clauses Contractuelles Types (CCT)', definition: "Modèles de contrat validés par la Commission européenne pour encadrer un transfert hors UE.", enjeu: "Garantie complémentaire au DPF pour sécuriser juridiquement le transfert." },
      { terme: 'Mailjet', definition: "Service français d'envoi d'emails transactionnels (sous-traitant retenu pour les emails d'activation).", enjeu: "Hébergement en France : simplifie la conformité (pas de transfert hors UE) et la délivrabilité des emails." },
    ],
  },
  {
    titre: 'F. Sigles et notions connexes',
    termes: [
      { terme: 'eIDAS', definition: "Règlement européen (910/2014) sur l'identification électronique et les services de confiance (dont la signature électronique).", enjeu: "Encadre la valeur juridique de la future signature manuscrite — relève du droit civil, distinct du RGPD." },
      { terme: 'RGAA', definition: "Référentiel Général d'Amélioration de l'Accessibilité : norme d'accessibilité numérique des services publics.", enjeu: "Obligation distincte du RGPD, avec ses propres sanctions ; à traiter dans un chantier séparé." },
      { terme: 'PASSI', definition: "Prestataire d'Audit de la Sécurité des Systèmes d'Information, qualifié par l'ANSSI.", enjeu: "Référence pour commander un pentest fiable et reconnu en cas de contrôle." },
      { terme: "Référentiel CNIL « Gestion des élèves »", definition: "Cadre sectoriel publié par la CNIL pour les traitements relatifs à la scolarité et la formation.", enjeu: "S'y aligner facilite et valide implicitement la conformité (catégories de données, durées de référence)." },
      { terme: 'Mutualisé GRETA', definition: "Statut d'une obligation déjà couverte au niveau de l'établissement (ex. DPO, politique de patching).", enjeu: "Action réduite côté projet, mais à vérifier et documenter auprès de la DSI ou du DPO du GRETA." },
    ],
  },
];

// ─── Helpers UI ──────────────────────────────────────────────────────────────
function bordureCellule() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: COULEUR_BORDURE };
  return { top: b, bottom: b, left: b, right: b };
}
function couleurStatut(s) {
  if (s === 'À mener') return COULEUR_STATUT_A_MENER;
  if (s === 'Mutualisé GRETA') return COULEUR_STATUT_MUTUALISE;
  return COULEUR_STATUT_ACQUIS;
}
function celluleTexte(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.TOP,
    borders: bordureCellule(),
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, bold: opts.bold || false, color: opts.color || '0F172A', font: 'Calibri', size: opts.size || 18 })],
    })],
  });
}
function celluleParagraphe(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.TOP,
    borders: bordureCellule(),
    children: [new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 240 },
      children: [new TextRun({ text, font: 'Calibri', size: 18 })],
    })],
  });
}
function celluleStatut(statut, opts = {}) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    borders: bordureCellule(),
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: statut, bold: true, color: couleurStatut(statut), font: 'Calibri', size: 18 })],
    })],
  });
}
function celluleDefinition(definition, enjeu, width, fill) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.TOP,
    borders: bordureCellule(),
    children: [
      new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, after: 40 },
        children: [new TextRun({ text: definition, font: 'Calibri', size: 18 })] }),
      new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 240 },
        children: [
          new TextRun({ text: 'Enjeu : ', bold: true, color: COULEUR_PRIMAIRE, font: 'Calibri', size: 18 }),
          new TextRun({ text: enjeu, italics: true, font: 'Calibri', size: 18 }),
        ] }),
    ],
  });
}

// ─── Largeurs (paysage A4, content width = 16838 - 2*720 = 15398 DXA) ───────
const W_NUM = 480, W_CAT = 1500, W_POINT = 3400, W_POURQUOI = 4000, W_ACTION = 4010, W_STATUT = 1208;
const TOTAL_W = W_NUM + W_CAT + W_POINT + W_POURQUOI + W_ACTION + W_STATUT;

// ─── Tableau principal (obligations) ─────────────────────────────────────────
const headerRow = new TableRow({
  tableHeader: true,
  children: [
    celluleTexte('#', { width: W_NUM, align: AlignmentType.CENTER, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 20 }),
    celluleTexte('Catégorie', { width: W_CAT, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 20 }),
    celluleTexte('Obligation', { width: W_POINT, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 20 }),
    celluleTexte("Pourquoi c'est obligatoire", { width: W_POURQUOI, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 20 }),
    celluleTexte('Action minimale pour être conforme', { width: W_ACTION, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 20 }),
    celluleTexte('Statut', { width: W_STATUT, align: AlignmentType.CENTER, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 20 }),
  ],
});
const dataRows = OBLIGATIONS.map((row, idx) => {
  const fill = idx % 2 === 0 ? COULEUR_LIGNE_PAIRE : COULEUR_LIGNE_IMPAIRE;
  return new TableRow({
    children: [
      celluleTexte(String(row.num), { width: W_NUM, align: AlignmentType.CENTER, fill, bold: true }),
      celluleTexte(row.categorie, { width: W_CAT, fill, bold: true, color: '4338CA' }),
      celluleTexte(row.point, { width: W_POINT, fill, bold: true }),
      celluleParagraphe(row.pourquoi, { width: W_POURQUOI, fill }),
      celluleParagraphe(row.action, { width: W_ACTION, fill }),
      celluleStatut(row.statut, { width: W_STATUT, fill }),
    ],
  });
});
const tableauObligations = new Table({
  width: { size: TOTAL_W, type: WidthType.DXA },
  columnWidths: [W_NUM, W_CAT, W_POINT, W_POURQUOI, W_ACTION, W_STATUT],
  rows: [headerRow, ...dataRows],
});

// ─── Tableau recommandations ─────────────────────────────────────────────────
const RW_NUM = 600, RW_POINT = 4500, RW_POURQUOI = 7100, RW_QUAND = 3198;
const recoHeader = new TableRow({
  tableHeader: true,
  children: [
    celluleTexte('#', { width: RW_NUM, align: AlignmentType.CENTER, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_STATUT_MUTUALISE, size: 20 }),
    celluleTexte('Recommandation (non obligatoire)', { width: RW_POINT, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_STATUT_MUTUALISE, size: 20 }),
    celluleTexte('Pourquoi utile (mais non obligatoire ici)', { width: RW_POURQUOI, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_STATUT_MUTUALISE, size: 20 }),
    celluleTexte("Quand l'envisager", { width: RW_QUAND, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_STATUT_MUTUALISE, size: 20 }),
  ],
});
const recoRows = RECOMMANDATIONS.map((row, idx) => {
  const fill = idx % 2 === 0 ? COULEUR_LIGNE_PAIRE : COULEUR_LIGNE_IMPAIRE;
  return new TableRow({
    children: [
      celluleTexte(row.num, { width: RW_NUM, align: AlignmentType.CENTER, fill, bold: true, color: COULEUR_STATUT_MUTUALISE }),
      celluleTexte(row.point, { width: RW_POINT, fill, bold: true }),
      celluleParagraphe(row.pourquoi, { width: RW_POURQUOI, fill }),
      celluleTexte(row.quand, { width: RW_QUAND, fill }),
    ],
  });
});
const tableauReco = new Table({
  width: { size: RW_NUM + RW_POINT + RW_POURQUOI + RW_QUAND, type: WidthType.DXA },
  columnWidths: [RW_NUM, RW_POINT, RW_POURQUOI, RW_QUAND],
  rows: [recoHeader, ...recoRows],
});

// ─── Tableaux du glossaire (un par catégorie) ────────────────────────────────
const GW_TERME = 3200, GW_DEF = 12198;
const glossaireElements = [];
let nbTermes = 0;
GLOSSAIRE.forEach((cat) => {
  glossaireElements.push(new Paragraph({
    spacing: { before: 220, after: 80 },
    children: [new TextRun({ text: cat.titre, bold: true, color: COULEUR_PRIMAIRE, font: 'Calibri', size: 22 })],
  }));
  const rows = [
    new TableRow({ tableHeader: true, children: [
      celluleTexte('Terme', { width: GW_TERME, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 19 }),
      celluleTexte('Définition et enjeu', { width: GW_DEF, bold: true, color: COULEUR_HEADER_TEXTE, fill: COULEUR_PRIMAIRE, size: 19 }),
    ] }),
    ...cat.termes.map((t, idx) => {
      const fill = idx % 2 === 0 ? COULEUR_LIGNE_PAIRE : COULEUR_LIGNE_IMPAIRE;
      nbTermes += 1;
      return new TableRow({ children: [
        celluleTexte(t.terme, { width: GW_TERME, fill, bold: true, color: '4338CA' }),
        celluleDefinition(t.definition, t.enjeu, GW_DEF, fill),
      ] });
    }),
  ];
  glossaireElements.push(new Table({
    width: { size: GW_TERME + GW_DEF, type: WidthType.DXA },
    columnWidths: [GW_TERME, GW_DEF],
    rows,
  }));
});

const titreGlossaire = new Paragraph({
  spacing: { before: 280, after: 60 },
  pageBreakBefore: true,
  children: [new TextRun({ text: 'Partie 3 — Glossaire des termes et enjeux', bold: true, color: COULEUR_PRIMAIRE, font: 'Calibri', size: 24 })],
});
const introGlossaire = new Paragraph({
  spacing: { before: 0, after: 120 },
  children: [new TextRun({ text: "Définition de chaque terme technique ou juridique employé dans ce document, avec l'enjeu concret pour le projet, afin de comprendre la portée de chaque obligation.", italics: true, color: '475569', font: 'Calibri', size: 18 })],
});

// ─── Bloc d'en-tête ──────────────────────────────────────────────────────────
const titre = new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 0, after: 100 },
  children: [new TextRun({ text: 'Conformité RGPD — Livret d’apprentissage GRETA Lyon Métropole', bold: true, color: COULEUR_PRIMAIRE, font: 'Calibri', size: 32 })],
});
const sousTitre = new Paragraph({
  spacing: { before: 0, after: 60 },
  children: [new TextRun({ text: 'Obligations strictes pour la mise en conformité — apprenti·e·s majeur·e·s', italics: true, color: '475569', font: 'Calibri', size: 22 })],
});
const meta = new Paragraph({
  spacing: { before: 0, after: 120 },
  children: [
    new TextRun({ text: 'Date : ', bold: true, font: 'Calibri', size: 18 }),
    new TextRun({ text: '2026-05-26 (2e passe — recentrage obligatoire + retrait mineurs)    ', font: 'Calibri', size: 18 }),
    new TextRun({ text: 'Statut : ', bold: true, font: 'Calibri', size: 18 }),
    new TextRun({ text: 'Document de travail — à valider par le DPO du GRETA', font: 'Calibri', size: 18 }),
  ],
});
const note = new Paragraph({
  spacing: { before: 0, after: 120 },
  children: [
    new TextRun({ text: 'Périmètre : ', bold: true, font: 'Calibri', size: 18 }),
    new TextRun({ text: "apprenti·e·s majeur·e·s uniquement (les mineur·e·s n'auront pas de livret numérique dans un premier temps), ~300 personnes/an, aucune donnée sensible, base légale « mission d'intérêt public ». ", font: 'Calibri', size: 18 }),
    new TextRun({ text: "L'AIPD n'est pas obligatoire dans ce contexte (0 des 9 critères CNIL rempli) — il reste recommandé de documenter cette analyse de non-assujettissement.", italics: true, font: 'Calibri', size: 18 }),
  ],
});
const legende = new Paragraph({
  spacing: { before: 0, after: 200 },
  children: [
    new TextRun({ text: 'Légende du statut : ', bold: true, font: 'Calibri', size: 18 }),
    new TextRun({ text: 'À mener  ', bold: true, color: COULEUR_STATUT_A_MENER, font: 'Calibri', size: 18 }),
    new TextRun({ text: '(chantier à initier)   |   ', font: 'Calibri', size: 18 }),
    new TextRun({ text: 'Mutualisé GRETA  ', bold: true, color: COULEUR_STATUT_MUTUALISE, font: 'Calibri', size: 18 }),
    new TextRun({ text: '(action côté projet réduite)   |   ', font: 'Calibri', size: 18 }),
    new TextRun({ text: 'Déjà acquis  ', bold: true, color: COULEUR_STATUT_ACQUIS, font: 'Calibri', size: 18 }),
    new TextRun({ text: '(à conserver / reproduire)', font: 'Calibri', size: 18 }),
  ],
});

const titreObligations = new Paragraph({
  spacing: { before: 0, after: 100 },
  children: [new TextRun({ text: 'Partie 1 — Les 33 obligations strictes', bold: true, color: COULEUR_PRIMAIRE, font: 'Calibri', size: 24 })],
});
const titreReco = new Paragraph({
  spacing: { before: 280, after: 60 },
  pageBreakBefore: true,
  children: [new TextRun({ text: 'Partie 2 — Les 9 recommandations reportables (NON obligatoires)', bold: true, color: COULEUR_STATUT_MUTUALISE, font: 'Calibri', size: 24 })],
});
const introReco = new Paragraph({
  spacing: { before: 0, after: 160 },
  children: [new TextRun({ text: "Ces points ne sont pas requis pour être en conformité dans le contexte décrit. Ils renforcent la sécurité ou facilitent la démonstration de conformité, et peuvent être mis en œuvre après la mise en production, en amélioration continue.", italics: true, color: '475569', font: 'Calibri', size: 18 })],
});

const avertissement = new Paragraph({
  spacing: { before: 240, after: 60 },
  children: [new TextRun({ text: "Avertissement : ce document est un panorama opérationnel recentré sur le minimum légal et ne constitue pas un avis juridique. La validation finale doit passer par le DPO du GRETA. Tout changement de périmètre (réintégration des mineurs, montée en volume, ajout de données sensibles ou de photos) peut faire basculer des points de « recommandé » à « obligatoire » — l'AIPD en particulier.", italics: true, color: '64748B', font: 'Calibri', size: 16 })],
});

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'GRETA Lyon Métropole — Maquette Livret',
  title: 'Conformité RGPD — Obligations strictes',
  description: 'Tableau des obligations RGPD strictes pour la plateforme Livret d’apprentissage (recentré, sans mineurs)',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 18 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Calibri', color: COULEUR_PRIMAIRE },
        paragraph: { spacing: { before: 0, after: 120 }, outlineLevel: 0 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
        margin: { top: 720, right: 720, bottom: 720, left: 720 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'Conformité RGPD — Livret d’apprentissage GRETA Lyon Métropole', italics: true, color: '64748B', font: 'Calibri', size: 16 })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Document de travail — à valider par le DPO du GRETA — Page ', font: 'Calibri', size: 16, color: '64748B' }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '64748B' }),
          new TextRun({ text: ' / ', font: 'Calibri', size: 16, color: '64748B' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '64748B' }),
        ],
      })] }),
    },
    children: [
      titre, sousTitre, meta, note, legende,
      titreObligations, tableauObligations,
      titreReco, introReco, tableauReco,
      titreGlossaire, introGlossaire, ...glossaireElements,
      avertissement,
    ],
  }],
});

const sortie = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '..', 'conformite-rgpd-etapes.docx');
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(sortie, buffer);
  console.log('Fichier généré : ' + sortie);
  console.log('Taille : ' + (buffer.length / 1024).toFixed(1) + ' KB');
  console.log('Obligations : ' + OBLIGATIONS.length + ' | Recommandations : ' + RECOMMANDATIONS.length + ' | Termes glossaire : ' + nbTermes);
});
