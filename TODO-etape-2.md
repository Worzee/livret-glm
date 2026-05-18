# TODO étape 2 — pistes reportées

Ce fichier collecte ce qui sort du périmètre étape 1 (CDC v1.3 + addendum v1.5) et qui mérite un examen pour les étapes 2 et 3.

Format de chaque entrée :

```
## YYYY-MM-DD — Contexte
- Titre court de la proposition
  Motif : pourquoi reportée (hors scope / coût / à arbitrer)
```

---

## 2026-05-17 — Vague 3 (sélection par stagiaire des compétences en entreprise)

- **Mécanisme de re-validation conjointe après invalidation R10**
  Motif : la maquette autorise actuellement le formateur seul à figer une sélection revue après invalidation. Une vraie re-validation à 2 (formateur + maître) nécessitera un mécanisme dédié quand l'authentification réelle sera en place (étape 2).
- **Notifications email** sur invalidation R10 vers le maître concerné
  Motif : hors scope étape 1 (pas de stack mail), à coupler à l'auth réelle.

## 2026-05-16 — Sprint 5 + extensions métier

- **Signature manuscrite tactile** (canvas au doigt + souris, via `signature_pad`)
  Motif : coût estimé 1,5 à 2 jours. Polish UX uniquement en étape 1 (signature actuelle déjà claire avec horodatage ISO + confirmation 2 clics). En étape 2 — combinée à une session authentifiée et un horodatage serveur — elle acquiert un poids juridique (Loi 2000-230, art. 1366 Code civil). Piège anticipé : stockage des PNG base64 (10-20 KB chacun) sur la limite localStorage 5 Mo → compression / SVG vectoriel à prévoir.
- **R13 — choix de gouvernance** (création de la période N bloquante tant que N-1 n'est pas signée, ou simple avertissement ?)
  Motif : à arbitrer avec le pilote. Actuellement bloquant.

## Étape 2 — pistes structurelles

- **Authentification réelle** (remplace le role switcher de démo)
  Motif : étape 2 du programme — sécurité, RGPD, traçabilité juridique.
- **Notifications email** (entretien à programmer, fiche à signer, alerte R7…)
  Motif : nécessite stack mail (SMTP, templates, queue).
- **Multi-établissement** (plusieurs GRETA, isolation des données)
  Motif : impacte le modèle de données + tous les filtres existants.
- **Backup automatique** des données (au-delà du localStorage navigateur)
  Motif : nécessite back-end persistant.
- **Monitoring centralisé** (Uptime Kuma, logs, alerting)
  Motif : hors scope étape 1, à mettre en place avec la prod.
- **Historique granulaire** (audit log toutes mutations — CDC §12)
  Motif : aujourd'hui seul R10 + `modifieLe` minimal. Audit complet en étape 2.

---

*Maintenu à jour à chaque vague de livraison. Cf. PROJECT-STATUS.md §8 pour le statut courant.*
