# Conformité RGPD — Livret d'apprentissage GRETA Lyon Métropole

> Document de travail **recentré sur les obligations strictes**. Identifie le
> minimum légal pour être conforme au RGPD dans le contexte d'un centre de
> formation GRETA. Les améliorations (recommandées mais non obligatoires) sont
> listées à part et reportées à la mise en production.

|                               |                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| **Date de rédaction**         | 2026-05-26 (2ᵉ passe — recentrage obligatoire + retrait mineurs)                   |
| **Statut**                    | Document de travail — à valider par le DPO du GRETA                                |
| **Périmètre**                 | Étape 2 et au-delà (mise en production avec auth réelle, backend, données réelles) |
| **Responsable de traitement** | GRETA Lyon Métropole (à confirmer)                                                 |
| **Pilote métier**             | Guillaume FERRERI                                                                  |

---

## Évolutions de cadrage (2ᵉ passe, 2026-05-26)

| Décision                         | Conséquence                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Retrait des mineurs**          | Les apprenti·e·s mineur·e·s n'auront **pas** de livret numérique dans un premier temps. Suppression de toutes les obligations spécifiques aux mineurs (information des représentants légaux, consentement parental, langage adapté obligatoire). |
| **AIPD reclassée**               | Sans mineurs **ni** traitement à grande échelle, **aucun des 9 critères CNIL n'est rempli** → l'AIPD n'est **plus obligatoire** (cf. §5). Elle passe en recommandation, avec obligation légère de documenter l'analyse de non-assujettissement.  |
| **Recentrage sur l'obligatoire** | Le tableau principal (§3) ne contient plus que les **33 points strictement obligatoires**. Les 9 points recommandés (§4) sont reportés à la mise en production.                                                                                  |

---

## Table des matières

1. [Hypothèses retenues](#1-hypothèses-retenues)
2. [Périmètre écarté ou hors champ](#2-périmètre-écarté-ou-hors-champ)
3. [Tableau des obligations strictes (33 points)](#3-tableau-des-obligations-strictes-33-points)
4. [Recommandations reportables (9 points)](#4-recommandations-reportables-9-points)
5. [Le cas de l'AIPD — pourquoi non obligatoire ici](#5-le-cas-de-laipd--pourquoi-non-obligatoire-ici)
6. [Chantiers obligatoires par phase](#6-chantiers-obligatoires-par-phase)
7. [Sujets connexes hors RGPD strict](#7-sujets-connexes-hors-rgpd-strict)
8. [Avertissement](#8-avertissement)

---

## 1. Hypothèses retenues

- **Responsable de traitement** : GRETA Lyon Métropole (établissement public local d'enseignement)
- **Hébergement cible** : serveur GRETA propre (UE)
- **Domaine cible** : nom de domaine GRETA propre (sortie de DuckDNS)
- **Mise en production** : étape 2 (auth réelle Entra ID + backend Node + base de données)
- **Personnes concernées** :
  - **Apprenti·e·s majeur·e·s uniquement** — les mineur·e·s n'auront pas de livret numérique dans un premier temps
  - **Maîtres / Tuteurs** : employés d'entreprises tierces (majeurs)
  - **Personnels GRETA** : formateurs, coordos, admin (salariés)
- **Données traitées** : état civil, données scolaires nominatives, évaluations pédagogiques, contrat d'apprentissage, email, **image de signature manuscrite** (tracé tactile capté dès la maquette ; valeur probante eIDAS à l'étape 2 — donnée personnelle ordinaire, **image statique uniquement, pas de dynamique du tracé** pour rester hors biométrie art. 9), logs d'activité. **Pas de photo, pas de données sensibles (art. 9).**
- **Base légale** : mission d'intérêt public (art. 6.1.e RGPD) appuyée sur le Code de l'éducation
- **Volumétrie** : ~300 utilisateurs/an — **pas un traitement « à grande échelle »** au sens CNIL

---

## 2. Périmètre écarté ou hors champ

### 2.1 — Écarté suite au retrait des mineurs

| Point                                           | Raison                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Information des représentants légaux**        | Plus de mineur·e·s sur la plateforme → plus de parents à informer dans ce cadre               |
| **Consentement parental (< 15 ans)**            | Sans objet — pas de mineur·e·s                                                                |
| **Langage adapté obligatoire (niveau 3ᵉ)**      | Reste une bonne pratique de clarté, mais n'est plus une obligation renforcée liée aux mineurs |
| **AIPD au titre des « personnes vulnérables »** | Critère CNIL « mineurs » supprimé → l'AIPD n'est plus obligatoire (cf. §5)                    |

### 2.2 — Non applicable au contexte (RGPD)

| Point                                | Raison                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Droit à la portabilité (art. 20)** | Réservé aux traitements fondés sur le consentement ou un contrat. La mission d'intérêt public n'est pas éligible. |
| **Cookies / ePrivacy**               | Aucun tracker/analytics (CDC §20). Cookie de session futur = essentiel au service, pas de consentement requis.    |
| **Articulation Pronote**             | Simple lien sortant, pas de traitement ni de sous-traitance. Une mention suffit.                                  |

### 2.3 — Hors RGPD strict (à traiter ailleurs)

| Point                            | Nature                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| **PCA / PRA**                    | Continuité de service — niveau infrastructure GRETA, pas RGPD                              |
| **Signature électronique eIDAS** | Règlement eIDAS 910/2014 (droit civil), pas RGPD — cf. CDC v1.5 §14.C                      |
| **Nom de domaine GRETA propre**  | Technique / confiance — pas une obligation RGPD (mais utile à la délivrabilité des emails) |

---

## 3. Tableau des obligations strictes (33 points)

Ce tableau ne contient **que les obligations dont le manquement constitue une infraction directe au RGPD** susceptible de sanction CNIL.

**Légende du statut :**

- **À mener** — chantier à initier
- **Mutualisé GRETA** — action côté projet réduite, dépend DSI / DPO GRETA
- **Déjà acquis** — en place dans la maquette, à conserver / reproduire

|   # | Catégorie          | Obligation                                                   | Pourquoi c'est obligatoire                                                                        | Action minimale pour être conforme                                                                                                        | Statut          |
| --: | ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
|   1 | Gouvernance        | Identifier le responsable de traitement (art. 4.7 + 13.1.a)  | Toute personne doit savoir qui est juridiquement responsable. Défaut d'information sanctionnable. | Nommer « GRETA Lyon Métropole » (+ représentant légal, SIRET) dans les mentions légales et le registre.                                   | À mener         |
|   2 | Gouvernance        | Désigner / contacter le DPO (art. 37)                        | Obligatoire pour tout organisme public, sans seuil.                                               | Récupérer le contact du DPO GRETA existant, le publier dans les mentions.                                                                 | Mutualisé GRETA |
|   3 | Gouvernance        | Tenir le registre des activités de traitement (art. 30)      | Pièce exigée en premier lors d'un contrôle CNIL.                                                  | Ajouter une fiche « Livret d'apprentissage » au registre GRETA (finalités, données, destinataires, durées, sécurité, sous-traitants).     | À mener         |
|   4 | Base légale        | Identifier et documenter la base légale (art. 6)             | Sans base légale, traitement intégralement illicite.                                              | Retenir « mission d'intérêt public » (art. 6.1.e) appuyée sur le Code de l'éducation ; documenter au registre.                            | À mener         |
|   5 | Finalités          | Documenter les finalités (art. 5.1.b)                        | Interdiction de détourner les données vers un autre usage.                                        | Lister au registre + mentions : suivi pédagogique, co-édition tripartite, traçabilité signatures, export PDF. Exclure revente/profilage.  | À mener         |
|   6 | Information        | Mentions d'information accessibles (art. 13)                 | Information due au moment de la collecte. Manquement = cause fréquente de plainte.                | Une page mentions légales + politique de confidentialité (accessible depuis le footer) couvrant les 8 items de l'art. 13.                 | À mener         |
|   7 | Droits             | Droit d'accès (art. 15)                                      | Droit le plus invoqué ; non-réponse dans le mois = manquement.                                    | Procédure de réponse (email DPO, délai 1 mois) + capacité d'exporter les données d'une personne (l'export PDF existant y contribue).      | À mener         |
|   8 | Droits             | Droit de rectification (art. 16)                             | Correction sans délai d'une donnée inexacte.                                                      | Permettre la correction via le coordo + tracer la modification.                                                                           | À mener         |
|   9 | Droits             | Droit à l'effacement (art. 17)                               | Droit limité ici (conservation légale) mais une réponse motivée reste due.                        | Documenter dans les mentions que l'effacement est différé jusqu'à expiration des durées légales + workflow de suppression à l'expiration. | À mener         |
|  10 | Droits             | Droit d'opposition et de limitation (art. 18 + 21)           | Opposable sous conditions même face à une mission d'intérêt public.                               | Canal DPO pour examen au cas par cas, documenté dans les mentions.                                                                        | À mener         |
|  11 | Droits             | Procédure de réponse aux demandes (art. 12)                  | Délai 1 mois imposé ; non-réponse sanctionnable.                                                  | Boîte mail dédiée (`dpo@<domaine-greta>`) + registre des demandes + modèles de réponse.                                                   | À mener         |
|  12 | Données            | Minimisation des données (art. 5.1.c)                        | Toute donnée surnuméraire est illicite.                                                           | Auditer les champs collectés, justifier chacun, supprimer le superflu.                                                                    | À mener         |
|  13 | Données            | Pas de données sensibles art. 9                              | Interdiction de traiter santé, origine, opinions, biométrie sauf exception.                       | Consigne aux formateurs : pas de données sensibles dans les champs libres. Pas de photo.                                                  | À mener         |
|  14 | Données            | Exactitude et mise à jour (art. 5.1.d)                       | Données inexactes = traitement illicite.                                                          | Mise à jour possible par le coordo (déjà en place) + procédure de signalement.                                                            | À mener         |
|  15 | Conservation       | Définir les durées de conservation (art. 5.1.e)              | Conservation indéfinie interdite.                                                                 | Définir : durée du contrat + 5 ans d'archivage (à confirmer service archives GRETA) ; documenter au registre.                             | À mener         |
|  16 | Conservation       | Purge / anonymisation effective en fin de durée (art. 5.1.e) | Définir des durées sans les appliquer = manquement aggravé.                                       | Mécanisme de suppression ou d'anonymisation à l'expiration (job backend ou procédure manuelle tracée).                                    | À mener         |
|  17 | Sécurité           | HTTPS — chiffrement en transit (art. 32)                     | Données en clair sur le réseau = interception possible.                                           | Reproduire HTTPS (Let's Encrypt) sur le serveur GRETA + redirection 80→443.                                                               | Déjà acquis     |
|  18 | Sécurité           | Authentification + contrôle d'accès (art. 32)                | Sans auth réelle, n'importe qui accède aux données.                                               | Auth réelle (SSO Entra + MdP local) + matrice de droits appliquée.                                                                        | À mener         |
|  19 | Sécurité           | Hashage robuste des mots de passe (art. 32)                  | Une fuite ne doit pas révéler les MdP.                                                            | argon2id (ou bcrypt coût ≥ 12) ; jamais en clair.                                                                                         | À mener         |
|  20 | Sécurité           | Contrôle d'accès vérifié côté backend (art. 32)              | La matrice client est falsifiable ; elle doit être doublée serveur.                               | Réimplémenter la vérification des droits côté serveur sur chaque requête.                                                                 | À mener         |
|  21 | Sécurité           | Journalisation des accès et mutations (art. 32)              | Sans logs, pas de détection ni d'enquête d'incident.                                              | Logger connexions, accès livret tiers, mutations sensibles, suppressions ; conserver 6-12 mois.                                           | À mener         |
|  22 | Sécurité           | Sauvegardes + test de restauration (art. 32)                 | Perte de données = atteinte à la disponibilité (art. 32).                                         | Sauvegardes régulières chiffrées + test de restauration périodique.                                                                       | À mener         |
|  23 | Sécurité           | Développement sécurisé (art. 32)                             | Vulnérabilités web courantes = risque élevé.                                                      | Couvrir XSS / CSRF / IDOR / injection SQL + headers de sécurité (CSP, X-Frame-Options).                                                   | À mener         |
|  24 | Sécurité           | Mises à jour de sécurité (art. 32)                           | Faille connue non corrigée = manquement.                                                          | Politique de patching serveur + suivi CVE des dépendances npm.                                                                            | Mutualisé GRETA |
|  25 | Sous-traitants     | Inventaire + contrats DPA (art. 28)                          | Chaque sous-traitant doit avoir un contrat RGPD.                                                  | Lister les sous-traitants (Mailjet, Microsoft, hébergeur) + signer/archiver les DPA.                                                      | À mener         |
|  26 | Sous-traitants     | DPA Microsoft Entra ID (art. 28)                             | Microsoft = sous-traitant de l'authentification.                                                  | Signer le DPA Microsoft Online Services via le tenant Azure.                                                                              | À mener         |
|  27 | Sous-traitants     | DPA Mailjet (art. 28)                                        | Mailjet = sous-traitant de l'envoi d'emails.                                                      | Accepter/signer le DPA Mailjet à l'inscription ; vérifier hébergement UE.                                                                 | À mener         |
|  28 | Transferts         | Cadrer le transfert hors UE Microsoft (art. 44-49)           | Microsoft implique un transfert USA à encadrer.                                                   | Documenter au registre : transfert Microsoft, base juridique Data Privacy Framework.                                                      | À mener         |
|  29 | Privacy by design  | Protection dès la conception (art. 25)                       | Obligation légale de concevoir protecteur.                                                        | Conserver les acquis maquette : matrice de droits, verrous métier, traçabilité R10, suppressions bloquées.                                | Déjà acquis     |
|  30 | Privacy by default | Paramètres restrictifs par défaut (art. 25)                  | Visibilité minimale par défaut imposée.                                                           | Conserver : coordo/admin sans droit pédagogique, admin ne peut signer, accès minimal par défaut.                                          | Déjà acquis     |
|  31 | Démo               | Pas de données réelles en démonstration                      | Démo avec données réelles = traitement non déclaré.                                               | Maintenir les fixtures fictives + environnement de démo isolé.                                                                            | Déjà acquis     |
|  32 | Incidents          | Notification CNIL < 72 h (art. 33)                           | Obligation de notifier toute violation à risque sous 72 h.                                        | Procédure documentée + déclencheur (DPO) + modèle de notification pré-rédigé.                                                             | À mener         |
|  33 | Incidents          | Notification aux personnes si risque élevé (art. 34)         | Obligation d'informer les personnes en cas de risque élevé.                                       | Modèle d'email d'information + canal de communication maîtrisé.                                                                           | À mener         |

### Synthèse du tableau

| Statut                | Nombre                                                                            |
| --------------------- | --------------------------------------------------------------------------------- |
| **À mener**           | 26                                                                                |
| **Mutualisé GRETA**   | 2 (DPO, mises à jour sécurité)                                                    |
| **Déjà acquis**       | 5 (HTTPS, privacy by design, privacy by default, démo fictive, + acquis partiels) |
| **Total obligatoire** | **33**                                                                            |

---

## 4. Recommandations reportables (9 points)

Ces points **ne sont pas obligatoires** pour être en conformité dans notre contexte. Ils renforcent la sécurité ou facilitent la démonstration de conformité, et peuvent être mis en œuvre **après la mise en production**, lors d'une phase d'amélioration continue.

|   # | Recommandation                                            | Pourquoi c'est utile (mais non obligatoire ici)                                                                            | Quand l'envisager                                            |
| --: | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
|  R1 | **AIPD complète**                                         | Non obligatoire (cf. §5), mais renforce l'accountability et anticipe une éventuelle évolution (ajout des mineurs un jour). | Si les mineurs sont réintégrés, ou sur recommandation du DPO |
|  R2 | **Politique RGPD interne formelle**                       | Document d'accountability ; le GRETA en a probablement déjà une à compléter.                                               | Mise en production                                           |
|  R3 | **Notices distinctes par catégorie de personne**          | L'information (point #6) est obligatoire ; la décliner en 3 notices séparées est une modalité de confort.                  | Mise en production                                           |
|  R4 | **Distinction base active / archivage intermédiaire**     | Modalité fine de mise en œuvre des durées (#15-16) ; utile mais une purge simple suffit pour être conforme.                | Mise en production                                           |
|  R5 | **Chiffrement au repos des données non-auth**             | Obligatoire seulement pour les données d'authentification ; recommandé pour le reste vu la non-sensibilité des données.    | Mise en production                                           |
|  R6 | **Pentest / audit sécurité externe**                      | Renforce et prouve la sécurité (#17-24) ; non obligatoire pour une structure de cette taille.                              | Avant ou peu après mise en production                        |
|  R7 | **Monitoring élaboré de détection d'incident**            | Le principe de détection est couvert par #21 + #32 ; un outillage avancé (SIEM) est un plus.                               | Amélioration continue                                        |
|  R8 | **Hébergement UE — serveur GRETA propre**                 | Souveraineté ; acquis « gratuitement » à la migration GRETA mais pas strictement exigé si DPA en place.                    | Migration serveur GRETA                                      |
|  R9 | **Conformité au référentiel CNIL « Gestion des élèves »** | Outil qui facilite et valide la conformité ; s'y aligner simplifie, mais ce n'est pas une obligation autonome.             | Mise en production                                           |

---

## 5. Le cas de l'AIPD — pourquoi non obligatoire ici

L'**Analyse d'Impact relative à la Protection des Données** (art. 35 RGPD) est obligatoire uniquement quand un traitement est susceptible d'engendrer un **risque élevé**. La CNIL fournit une liste de **9 critères** ; une AIPD est obligatoire dès que **2 critères** sont remplis.

| Critère CNIL                                            | Notre cas                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| 1. Évaluation / scoring                                 | Évaluation pédagogique humaine, pas de profilage automatisé → **non** |
| 2. Décision automatisée avec effet juridique            | Décisions prises par des humains → **non**                            |
| 3. Surveillance systématique                            | Pas de surveillance → **non**                                         |
| 4. Données sensibles (art. 9) ou hautement personnelles | Aucune → **non**                                                      |
| 5. Données à grande échelle                             | ~300 personnes/an → **non**                                           |
| 6. Croisement de jeux de données                        | Aucun → **non**                                                       |
| 7. Personnes vulnérables (mineurs…)                     | **Plus de mineurs** → **non**                                         |
| 8. Usage innovant / nouvelles technologies              | Stack web classique → **non**                                         |
| 9. Exclusion d'un droit / d'un contrat                  | Aucune → **non**                                                      |

**Conclusion : 0 critère sur 9 rempli → l'AIPD n'est pas obligatoire.**

> **Obligation résiduelle légère** : il reste recommandé (accountability) de **documenter cette analyse de non-assujettissement** dans le registre — une demi-page suffit, attestant que les critères ont été examinés et qu'aucun n'est rempli. Ce n'est pas une AIPD, juste une trace de la décision.

> **Point de vigilance** : si les **mineurs sont réintégrés** plus tard (livret numérique pour les < 18 ans), le critère 7 s'active et **l'AIPD redevient obligatoire**. À réévaluer à ce moment-là.

---

## 6. Chantiers obligatoires par phase

### Phase 1 — Pré-production (cadrage juridique et documentaire)

- #1 Responsable de traitement
- #2 Contact DPO
- #3 Registre des traitements
- #4 Base légale
- #5 Finalités
- #6 Mentions d'information
- #12 Audit de minimisation
- #13 Consigne « pas de données sensibles »
- #15 Définition des durées de conservation
- #25 Inventaire des sous-traitants
- _(+ R-AIPD : documenter la non-nécessité de l'AIPD — demi-page)_

### Phase 2 — Mise en production étape 2 (mise en œuvre technique)

- #7 à #11 Implémentation des droits + procédure de réponse
- #14 Process de mise à jour
- #16 Purge / anonymisation effective
- #17 HTTPS sur serveur GRETA
- #18 Authentification + contrôle d'accès
- #19 Hashage MdP
- #20 Contrôle d'accès backend
- #21 Journalisation
- #22 Sauvegardes
- #23 Développement sécurisé
- #26 DPA Microsoft Entra
- #27 DPA Mailjet
- #28 Cadrage transfert Microsoft
- #32 Procédure notification CNIL
- #33 Procédure notification personnes

### Phase 3 — Exploitation continue

- #14 Revue annuelle d'exactitude
- #16 Exécution des purges
- #21 Revue des logs
- #22 Test de restauration périodique
- #24 Suivi CVE et patching

---

## 7. Sujets connexes hors RGPD strict

| Sujet                                       | Nature                                               | Référence              |
| ------------------------------------------- | ---------------------------------------------------- | ---------------------- |
| **RGAA** (accessibilité numérique)          | Obligation distincte des organismes publics          | Loi 2005, décret 2019  |
| **eIDAS 910/2014** (signature électronique) | Valeur probatoire de la signature manuscrite à venir | CDC v1.5 §14.C         |
| **Code de l'éducation**                     | Durées de conservation des livrets                   | Service archives GRETA |

---

## 8. Avertissement

Ce document est un **panorama opérationnel recentré sur le minimum légal**. **Il ne constitue pas un avis juridique.** La validation finale doit passer par le **DPO du GRETA Lyon Métropole**.

Le classement « obligatoire / recommandé » repose sur le contexte précis décrit en §1 (apprenti·e·s majeur·e·s, ~300 personnes/an, données non sensibles, base mission d'intérêt public). **Tout changement de ce périmètre** (réintégration des mineurs, montée en volume, ajout de données sensibles ou de photos) **peut faire basculer des points de « recommandé » à « obligatoire »** — l'AIPD en particulier (cf. §5).

---

_Document maintenu à jour à chaque évolution majeure du périmètre. Cf. [`PROJECT-STATUS.md`](PROJECT-STATUS.md) §8 et [`TODO-etape-2.md`](TODO-etape-2.md). Spécification du chantier création de comptes : [`chantier-creation-comptes.md`](chantier-creation-comptes.md)._
