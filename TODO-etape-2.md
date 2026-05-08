# TODO étape 2 — captures de scope creep

Ce fichier collecte tout ce qui sort du périmètre étape 1 (cf. CDC §3) et qui mérite un examen pour les étapes suivantes.

Format de chaque entrée :

```
## YYYY-MM-DD — Sprint N
- Titre court de la proposition
  Motif : pourquoi reportée (hors scope étape 1 / à discuter / non prioritaire)
```

---

## 2026-05-12 — Sprint 2 (extension : rôle Admin avec périmètre administratif)
- Mise à jour formelle du CDC v1.5 :
  - §4.1 ajout du rôle Admin (Guillaume FERRERI)
  - §6 admin = "coordo+" : partage les droits administratifs avec coordo
    + droit exclusif de créer des coordos. AUCUN droit pédagogique
    (signatures, observations, évaluations, niveaux de maîtrise).
  - §7.1 type Admin (interface vide, hérite de Utilisateur)
  - §17.2 entrée glossaire "Administrateur·rice"
  Motif : à arbitrer avec le pilote.

## 2026-05-04 — Sprint 1 (extension métier : rôle Coordo)
- Formulaires CRUD utilisateurs (création apprenti / maître / formateur / coordo)
  Motif : sprint dédié à l'administration. Sprint 1 ne fournit que les types,
  la matrice des droits, les fixtures et les pages placeholder.
- Formulaires CRUD formations (création + édition + suppression)
  Motif : idem.
- Écran d'affectation apprenti·e ↔ formation/maître/formateur
  Motif : nécessite les écrans CRUD ci-dessus + un store dédié.
- Persistance Zustand des utilisateurs et formations (aujourd'hui en fixtures statiques)
  Motif : couplé à l'implémentation des écrans d'admin.
- Mise à jour formelle du cahier des charges v1.4 :
  - §4.1 ajout du rôle Coordo
  - §6 lignes admin de la matrice des droits
  - §7.1 type Coordo + extension Formation (dateDebut, dateFin, lieu)
  - §17.2 entrée glossaire "Coordinateur·rice"
  - §22.5 mention de la 4ᵉ couleur de rôle dans le design system
  Motif : à arbitrer avec le pilote — la maquette précède le CDC v1.4.
