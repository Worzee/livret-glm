# TODO étape 2 — pistes reportées

Ce fichier collecte ce qui sort du périmètre étape 1 (CDC v1.3 + addendum v1.5 + chantiers métier mai 2026) et qui mérite un examen pour les étapes 2 et 3.

Format de chaque entrée :

```
## YYYY-MM-DD — Contexte
- Titre court de la proposition
  Motif : pourquoi reportée (hors scope / coût / à arbitrer)
```

---

## 2026-05-26 — Chantiers à planifier (UI export PDF + signature + conformité RGPD)

### PDF d'export à reprendre

- **Refonte / amélioration** du PDF généré par le bouton « Exporter le livret » (`src/components/pdf/LivretPdf.tsx`, `styles.ts`, `BoutonExportPdf.tsx`, `ExportPdfLazy.tsx`).
  Périmètre à arbitrer avec le pilote avant attaque : mise en page, typographie, ajout/retrait de sections, pagination, alignement charte palette mai 2026, marges, identité visuelle de la page de garde.
  Motif : revue UI/UX à mener avant la prochaine démo pilote — point identifié à ne pas oublier au prochain passage sur le projet.

### Signature électronique manuscrite — ✅ maquette livrée le 12 juin 2026

- **LIVRÉ (volet UI)** : zone de dessin tactile (doigt / stylet / souris) sur `<canvas>` pointer events, implémentée en interne sans dépendance (`ZoneSignature.tsx` + lib `signature-tactile`, seuil anti-clic accidentel 60 px). L'encart de confirmation du bouton « Signer » intègre désormais le tracé obligatoire (entretiens + fiches de période), le PNG est stocké dans `SignaturePartie.trace` et restitué dans l'UI et le PDF d'export. Image statique uniquement (pas de dynamique du tracé — RGPD art. 9).
- **RESTE pour l'étape 2 (valeur probante)** : le tracé est purement déclaratif tant qu'il n'est pas adossé à une session authentifiée + horodatage serveur + journal d'audit (Loi 2000-230, art. 1366 Code civil ; signature « simple » eIDAS). À coupler avec les chantiers 2.2/2.3 et le SSO. Au passage du backend : déporter le stockage des PNG (limite localStorage 5 Mo de la maquette — ~10-20 KB par signature, acceptable en démo, pas en production multi-promos).

### Conformité RGPD — liste opérationnelle consolidée

- **33 obligations RGPD strictes** (+ 9 recommandations reportables) consolidées dans [`conformite-rgpd.md`](conformite-rgpd.md) : gouvernance (responsable, DPO, registre), mentions d'information, droits des personnes, sécurité technique (hachage MdP, contrôle d'accès backend, journalisation, sauvegardes), sous-traitants (DPA Microsoft Entra, DPA Mailjet), gestion d'incidents (notification CNIL < 72 h).
  Périmètre : étape 2 et au-delà (auth réelle + backend + base de données + données réelles).
  Motif : panorama préparatoire à la mise en production. **Validation finale par le DPO du GRETA avant déploiement.**
  **Recentrage 2ᵉ passe (2026-05-26)** : retrait des mineurs (pas de livret numérique pour eux dans un premier temps) → **AIPD non obligatoire** (aucun des 9 critères CNIL rempli, cf. `conformite-rgpd.md` §5).
  Phases identifiées :
  - **Pré-production** — cadrage juridique et documentation (registre, mentions, base légale, durées, inventaire sous-traitants)
  - **Mise en production étape 2** — mise en œuvre technique (auth forte, hachage MdP, contrôle d'accès backend, logs, sauvegardes, DPA Microsoft + Mailjet)
  - **Exploitation continue** — revue annuelle des durées, purges automatiques, suivi CVE, pentest (recommandé)

---

## 2026-05-26 — Cadrage étape 2 (cible : authentification réelle + gestion comptes)

Trois chantiers majeurs structurellement liés. Détails complets dans `PROJECT-STATUS.md §12`.

### Chantier 2.1 — SSO Microsoft Entra ID pour les personnels GRETA

- **Backend Node.js** à introduire (Express ou équivalent) avec `openid-client` v5
- **Tenant cible** : `GRETA CFA Lyon Métropole` (ID `bc139aaa-fea0-465b-8d3d-be26ed74675d`)
- **Référent Entra** : Guillaume FERRERI (Global Admin tenant)
- **Couverture** : comptes internes GRETA (coordo, formateur, admin) → connexion via Microsoft 365 sans saisie de mot de passe
- **Mapping** : rôle livret dérivé d'un groupe ou claim Entra (à arbitrer côté pilote — par défaut, table de correspondance email ↔ rôle dans la base applicative)
- **Playbook complet déjà disponible** : `playbook-sso-entra-greta.md` (issu du projet Suivi Pédagogique, gain ~1 jour de tâtonnement sur les pièges)
- **Estimation** : 1 jour bien rythmé (DNS + HTTPS + Entra + code + tests)
- **Pré-requis** : domaine public + HTTPS valide + reverse proxy + accès Global Admin tenant — tous déjà en place sur le VPS GRETA-Hostinger

### Chantier 2.2 — Création de nouveaux comptes + validation par email

> **Spécification technique complète et décisions actées : [`chantier-creation-comptes.md`](chantier-creation-comptes.md)** (session de cadrage du 2026-05-26 avec le pilote). Couvre aussi le chantier 2.3 (gestion mots de passe).

Pour les comptes **non couverts par le SSO** (apprenti·e·s + maîtres d'apprentissage = personnes hors annuaire GRETA).

- Interface CRUD admin/coordo déjà en place côté frontend — il faut ajouter le déclencheur email à la création
- Génération d'un **lien d'activation** signé (JWT ou token random + table de validation) envoyé par email
- Définition du mot de passe au premier clic sur le lien
- **Politique mot de passe à définir avec le pilote** : longueur minimale, complexité, expiration du lien (24 h ? 7 j ?)
- Vérification d'unicité de l'email côté serveur (déjà côté client dans la maquette)
- **Stack mail à intégrer** : SMTP + templates HTML — probablement via service tiers (Brevo / Postmark / Mailjet) pour éviter les pièges de délivrabilité d'un SMTP auto-hébergé
- **Estimation** : 2-3 jours (intégration mail + templates + workflow d'activation + tests)

### Chantier 2.3 — Gestion des mots de passe

- Stockage côté backend : **bcrypt** ou **argon2** (jamais en localStorage, jamais en clair)
- Workflow « Mot de passe oublié » avec lien email à durée limitée
- Page profil avec changement de mot de passe (saisie ancien + nouveau)
- Expiration optionnelle du mot de passe (à arbitrer — pratique métier GRETA ?)
- **2FA optionnel** pour les rôles sensibles (admin, coordo) — à arbitrer avec le pilote
- **Estimation** : 1,5-2 jours

### Articulation des 3 chantiers

Ordre recommandé :

1. **Backend minimal** (Node Express + base de données + auth middleware) — en parallèle du frontend qui continue de tourner en mode démo localStorage
2. **SSO Entra ID** (chantier 2.1) — couvre les comptes internes GRETA en premier (impact friction maximal pour les utilisateurs cibles : Sophie DUBOIS, Martine LEFÈVRE, Guillaume FERRERI)
3. **Création + validation email** (chantier 2.2) + **gestion mot de passe** (chantier 2.3) — pour les comptes apprenti·e·s + maîtres d'apprentissage

---

## 2026-05-26 — Vague chantiers métier mai 2026 (livrés, suivis)

### Chantier #1 — Planning au niveau formation

- **Re-création de fiches après changement de formation d'un·e apprenti·e** — à valider sur le terrain. La cascade `useFormationsStore` → `useLivretStore` crée bien les fiches à la création d'un·e apprenti·e via `creerLivretVierge(planning)`. Mais si un·e apprenti·e change de formation **en cours de parcours**, son livret existant garde ses anciennes fiches.
  Motif : cas limite à confronter au terrain réel avant industrialisation.

### Chantier #2 — 2 entretiens tripartites

- **3ᵉ entretien tripartite (E3) ?** — possible besoin métier de bilan final en plus de E1 (initial) et E2 (mi-parcours).
  Motif : à arbitrer avec le pilote selon retours utilisateur. Le modèle actuel est `entretien1 | entretien2` mais peut évoluer en `entretiens: Record<number, EntretienTripartite>` sans casser la sémantique.
- **Section « Sélection des compétences » dans E2 ?** — aujourd'hui visible uniquement dans E1 (cohérent avec l'auto-marquage à la 3ᵉ signature E1). Si E2 doit pouvoir « ré-ouvrir » la sélection, il faudra un mécanisme dédié.
  Motif : à arbitrer avec le pilote.

### Chantier #5 — Import XLSX utilisateurs

- **Import avec affectation pré-remplie** — actuellement les apprenti·e·s importé·e·s sont créé·e·s sans formation/maître/formateur (à finaliser dans `/admin/affectations`). Ajout possible : colonnes Email_Maitre / Email_Formateur / Intitule_Formation dans le modèle pour pré-affecter.
  Motif : initialement écarté par le pilote (« le reste se fera dans l'affectation initiale »). À reproposer si le volume d'imports augmente.

---

## 2026-05-17 — Vague 3 (sélection par stagiaire des compétences en entreprise)

- **Mécanisme de re-validation conjointe après invalidation R10**
  Motif : la maquette autorise actuellement le formateur seul à figer une sélection revue après invalidation. Une vraie re-validation à 2 (formateur + maître) nécessitera un mécanisme dédié quand l'authentification réelle sera en place (étape 2).
- **Notifications email** sur invalidation R10 vers le maître concerné
  Motif : hors scope étape 1 (pas de stack mail), à coupler à l'auth réelle (chantier 2.2).

## 2026-05-16 — Sprint 5 + extensions métier

- **Signature manuscrite tactile** (canvas au doigt + souris, via `signature_pad`)
  Motif : coût estimé 1,5 à 2 jours. Polish UX uniquement en étape 1 (signature actuelle déjà claire avec horodatage ISO + confirmation 2 clics). En étape 2 — combinée à une session authentifiée et un horodatage serveur — elle acquiert un poids juridique (Loi 2000-230, art. 1366 Code civil). Piège anticipé : stockage des PNG base64 (10-20 KB chacun) sur la limite localStorage 5 Mo → compression / SVG vectoriel à prévoir.

---

## Étape 2 — autres pistes structurelles

- **Notifications email métier** (entretien à programmer, fiche à signer, alerte R7, invalidation R10, livret clôturé…)
  Motif : nécessite stack mail (SMTP, templates, queue). Couplé naturellement à 2.2 ci-dessus.
- **Multi-établissement** (plusieurs GRETA, isolation des données)
  Motif : impacte le modèle de données + tous les filtres existants. À arbitrer selon ambition étape 2.
- **Backup automatique** des données (au-delà du localStorage navigateur)
  Motif : nécessite back-end persistant — devient natif avec l'étape 2.
- **Monitoring centralisé** (Uptime Kuma, logs, alerting)
  Motif : hors scope étape 1, à mettre en place avec la prod.
- **Historique granulaire** (audit log toutes mutations — CDC §12)
  Motif : aujourd'hui seul R10 + `modifieLe` minimal. Audit complet en étape 2 (devient possible avec backend + auth).
- **Combobox custom shadcn** pour remplacer les `<select>` natifs
  Motif : sur les `<select>` natifs, l'option sélectionnée dans le dropdown garde le style natif du navigateur (bleu Windows par exemple). Non stylable de manière fiable cross-OS. Si gênant en démo finale, remplacer par un composant custom.

---

## Étape 2 — dette technique à nettoyer

Quelques composants/mutations sont devenus orphelins après les chantiers mai 2026, à nettoyer lors d'un passage knip :

- `src/components/livret/ModaleFichePeriode.tsx` — remplacée par `ModalePlanningPeriodes` (chantier #1)
- `useLivretStore.ajouterFichePeriode` / `modifierFichePeriode` / `supprimerFichePeriode` — remplacées par la cascade depuis `useFormationsStore`

Pas critique pour la démo. À traiter lors du démarrage de l'étape 2.

---

_Maintenu à jour à chaque vague de livraison. Cf. PROJECT-STATUS.md §8 pour le statut courant._
