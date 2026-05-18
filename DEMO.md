# Démo — Livret d'apprentissage GRETA Lyon Métropole

Référence : cahier des charges v1.3, section 25.

> **Intention.** Ce script est à la fois le livrable final présenté à la direction et le test
> d'intégration qui valide l'étape 1. Il doit être exécutable en **10 minutes chrono**, sans
> hésitation, sans bug, et sans dépendre d'explications orales du présentateur.

---

## 1. URL et accès

| | |
|---|---|
| **URL publique** | https://livret-glm.duckdns.org |
| **Basic Auth** | `demo` / *(mot de passe communiqué de vive voix — jamais par mail)* |
| **Navigateurs validés** | Chrome ≥ 120, Firefox ≥ 120 |
| **Mobile / desktop** | Tester en desktop pour la démo (le mobile reste fonctionnel mais l'effet visuel est moins lisible) |

---

## 2. Pré-démo — checklist (T-15 min)

- [ ] `bash scripts/verifier-vps.sh` retourne `11 OK / 0 KO`
- [ ] Données réinitialisées : footer → bouton **« Réinitialiser la démo »** → confirmer
- [ ] Le rôle actif par défaut est **Formateur référent** (Sophie DUBOIS)
- [ ] Bandeau orange **« MAQUETTE DE DÉMONSTRATION »** bien visible en haut
- [ ] Navigateur en plein écran, onglet unique, aucune extension qui parasite (AdBlock peut bloquer rien dans cette app, mais les barres de password manager polluent les captures)
- [ ] Son du poste coupé
- [ ] Connexion Internet du présentateur stable (la maquette est statique, mais Basic Auth + TLS demandent une requête)
- [ ] Document PDF de secours téléchargé localement la veille (cf. § Plan B)

---

## 3. Script minuté (10 minutes)

> Notation : `🎯` = point de valeur à appuyer, `🗣️` = phrase clé à prononcer.

### 00:00 — 01:00 · Introduction et vue formateur

1. Ouvrir l'URL, saisir le Basic Auth devant le public.
   - 🗣️ *« L'accès est protégé par mot de passe et HTTPS, hébergé sur un VPS européen, sans aucun tracker ni télémétrie. »*
2. L'application charge sur le **Tableau de bord du formateur référent** (rôle par défaut).
3. Pointer le **bandeau démo** persistant en haut de l'écran et le **role switcher** en haut à droite (5 rôles : apprenti·e, maître, formateur, coordo, admin).
4. Montrer rapidement les **6 cartes apprenti·e·s** du tableau de bord (Léa MARTIN — cas principal, Théo DUBOIS — « bon élève », Sofia PEREIRA — alerte R7, Minh NGUYEN — démarrage, Aya KOUAMÉ — désaccord R10, Luca BIANCHI — mi-parcours).
5. Cliquer sur **« Ouvrir le livret de Léa MARTIN »**.

### 01:00 — 02:30 · Navigation dans un livret

1. Page **Organisation du suivi** : champs pré-remplis par le formateur (réunion rentrée, visites, bilans).
   - 🎯 Vu côté apprenti et maître, ces champs seront en lecture seule.
2. **Entretien tripartite** : montrer la fiche complète signée le 28/10/2025.
   - Faire défiler les sections : motivations, organisation accueil, **appréciations du maître** (++/+/-/--), démarches admin, conditions pratiques, signatures.
3. **Fiches de suivi** (sidebar) : 3 fiches alignées chronologiquement.
   - Période 1 : verrouillée 🔒 — Période 2 : signée — Période 3 : en cours.
4. Cliquer sur **Période 3** (en cours).

### 02:30 — 05:30 · Co-édition tripartite (cœur de valeur)

1. Sur la fiche Période 3, montrer les **3 colonnes** du tableau :
   - Évaluation entreprise (maître), évaluation centre (formateur), retour apprenti.
2. **Bascule rôle → Apprenti·e (Léa MARTIN)** via le role switcher.
   - 🎯 Les colonnes maître et formateur deviennent **grisées en lecture seule**.
3. **Ajouter un retour apprenti** sur une compétence : taper un commentaire dans la colonne « Retour apprenti·e ».
   - L'**indicateur « Enregistré »** apparaît brièvement en bas à droite (debounce 500 ms).
4. Faire défiler vers la **zone Observations de fin de période** :
   - 🗣️ *« Chaque rôle a sa propre zone, et — important — une fois que le rôle a signé, sa zone est figée pour respecter l'engagement. »*
5. **Bascule rôle → Maître d'apprentissage (Karim BENALI)**.
   - Évaluer une nouvelle compétence en colonne entreprise.
6. **Bascule rôle → Formateur référent (Sophie DUBOIS)**.
   - Faire défiler vers le **bloc Signatures** en bas de fiche.
   - Cliquer **« Signer en tant que Sophie »** → un encart ambre apparaît avec le récapitulatif d'engagement.
   - 🎯 *« Une signature est tracée et ne peut être retirée que par un déverrouillage explicite — c'est l'objet du point suivant. »*
   - Cliquer **« Confirmer »** : la signature est apposée et horodatée à la seconde.

### 05:30 — 06:30 · Verrouillage et déverrouillage R10

1. Revenir aux fiches de suivi → ouvrir **Période 1** (verrouillée 🔒).
2. Pointer le bandeau ambre en haut : *« La fiche est verrouillée. Le déverrouillage invalide les trois signatures et requiert un motif tracé (R10). »*
3. Cliquer **« Déverrouiller… »** → la **modale R10** s'ouvre :
   - Avertissement explicite : invalidation des 3 signatures.
   - Champ **« Motif »** obligatoire (≥ 10 caractères).
4. Saisir un motif réel : *« Erreur de niveau de maîtrise sur la compétence C2-1 — à corriger en accord avec le maître. »*
5. Cliquer **« Confirmer le déverrouillage »**.
6. La fiche repasse en **« en cours »**, les 3 signatures sont effacées, et un **encart historique** apparaît en bas avec date / auteur / motif.
   - 🎯 *Traçabilité totale : toute correction post-signature est auditée.*

### 06:30 — 08:00 · Évaluation finale et clôture R22

1. Sidebar → **Évaluation finale**.
2. Onglet **Compétences** :
   - **Synthèse par bloc** en haut (statistiques entreprise / centre).
   - Tableau détaillé : certaines cellules portent un badge ✨ **« Hérité des fiches »** — les valeurs non saisies sont déduites des fiches de période (last-write-wins).
3. Onglet **Attitudes professionnelles** : grille 4×4 (++/+/-/--) maître + formateur.
4. Faire défiler vers le haut : un **bandeau gris** indique *« Clôture du livret indisponible — 2 fiches doivent encore être verrouillées »*.
   - 🗣️ *« Tant que les 3 fiches ne sont pas verrouillées, le livret reste éditable. »*
5. *(Si la démo a le temps, et seulement si on a réinitialisé en début pour avoir l'état initial sans déverrouillage)* basculer côté formateur, signer + verrouiller P2 et P3, puis revenir sur Évaluation finale → le bandeau passe au vert avec bouton **« Clôturer le livret »**.
6. *(Sinon, sauter cette étape — le bandeau gris suffit à montrer la règle.)*

### 08:00 — 09:00 · Export PDF

1. Sur la page **Évaluation finale**, en haut à droite : bouton **« Exporter le livret »**.
2. Cliquer.
   - Première fois : indicateur *« Préparation du PDF… »* (~500 ms).
   - Le bouton se transforme en **« Télécharger le PDF »**.
3. Cliquer sur le lien → fichier `livret-apprentissage-MARTIN-Lea-AAAA-MM-JJ.pdf` téléchargé.
4. Ouvrir le PDF dans un nouvel onglet.
5. Feuilleter rapidement :
   - **Page de garde** : identité, contrat, lieu, maître, formateur.
   - **Organisation** + **Entretien tripartite** complet.
   - **3 fiches de période** (1 page chacune avec tableaux et signatures).
   - **Évaluations finales** : synthèse + tableaux compétences + attitudes.
   - **Annexes** : statut de clôture R22 + historique R10 (déverrouillages).
6. 🎯 Pieds de page sur chaque page : pagination + date d'export + mention démo.

### 09:00 — 10:00 · Perspectives et clôture

1. **Bascule rôle → Coordo (Martine LEFÈVRE)** : section *Administration* apparaît dans la sidebar avec **CRUD réel** — gestion utilisateurs, formations, affectations, référentiels (import CSV/XLSX), banque de questions d'entretien.
2. **Bascule rôle → Admin (Guillaume FERRERI)** : droits étendus + gestion **établissements** + URLs Pronote.
3. Rappeler les **limites du périmètre étape 1** :
   - Pas d'authentification réelle (role switcher de démo).
   - Pas de conformité RGPD/RGAA stricte.
   - Données en `localStorage` du navigateur (1 utilisateur = 1 vue).
4. Pointer `TODO-etape-2.md` : authentification réelle, notifications email, signature manuscrite tactile, mécanisme de re-validation conjointe après invalidation R10.
5. Ouvrir la discussion.

---

## 4. Mode répétition (5 minutes)

Pour les présentations courtes, sauter les sections suivantes du script :

- **05:30 — 06:30** (R10) : remplacer par une simple mention orale.
- **08:00 — 09:00** (export PDF) : peut être sauté si le PDF a été préparé à l'avance et est ouvert dans un onglet.
- **09:00 — 10:00** (perspectives) : raccourcir à 30 secondes — juste une mention de la sidebar Admin.

Cible 5 min : Intro + Navigation + Co-édition + Évaluation finale rapide.

---

## 5. Plan B en cas d'incident

| Incident | Action |
|---|---|
| URL publique inaccessible | Bascule sur `npm run dev` du poste présentateur (cf. README §1). |
| Données corrompues juste avant la démo | Footer → **« Réinitialiser la démo »** → confirmer. |
| Bug bloquant sur un clic spécifique | Passer au point suivant du script, ne pas insister, noter l'incident pour post-mortem. |
| Le PDF met > 5 secondes à se générer | Garder le PDF de secours préparé la veille ouvert dans un onglet caché, basculer dessus. |
| Question hors scope | *« Je réponds précisément après la démo. »* — ne pas improviser. |
| TLS expiré (rare) | Le script `verifier-vps.sh` alerte si < 30 j ; sinon, restart manuel : `ssh root@69.62.107.157 "cd /docker && docker compose restart traefik"`. |
| `localStorage` plein (5 Mo) | Modale d'erreur native de l'app + DevTools → `localStorage.clear()` en dernier recours. |

---

## 6. Réinitialiser la démo entre deux présentations

**Méthode simple** (recommandée) : footer de l'app → **« Réinitialiser la démo »** → 2 clics de confirmation. Reset livret + bascule en formateur.

**Méthode brute** (si le bouton ne répond plus) :

```js
// DevTools > Console
['livret-donnees','livret-role-actif','livret-apprenti-actif',
 'livret-utilisateurs','livret-formations','livret-referentiels',
 'livret-banque-questions','livret-etablissements']
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## 7. Checklist post-démo

- [ ] Captures d'écran prises (au moins : co-édition, modale R10, bandeau R22, PDF page de garde).
- [ ] Notes des questions/objections du public (idéalement classées dans `TODO-etape-2.md`).
- [ ] Réinitialiser les données pour la prochaine session.
- [ ] Si modifs ad-hoc faites pendant la démo : `bash scripts/deploy.sh` pour restaurer l'état canonique.

---

*Référence : CDC v1.3 §25 + addendum v1.5 · Étape 1 livrée + 3 vagues post-livraison.*
