# Conventions de code — Livret d'apprentissage

Référence détaillée : cahier des charges v1.3, section 16. Ce fichier en est le résumé pratique.

## Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | PascalCase | `FicheSuiviPeriode.tsx` |
| Hooks personnalisés | camelCase, préfixe `use` | `useDroitsEdition.ts` |
| Fichiers utilitaires | kebab-case | `format-date.ts` |
| Types et interfaces | PascalCase | `interface FicheSuiviPeriode` |
| Constantes globales | SCREAMING_SNAKE_CASE | `const DUREE_VERROU_JOURS = 15` |
| Variables locales | camelCase | `const nouvelleEvaluation = ...` |
| Routes | kebab-case | `/tableau-de-bord` |
| Clés localStorage | kebab-case préfixé | `livret-etat`, `livret-historique-[id]` |

## Composants

- **Un composant par fichier**. Pas d'exception.
- **Taille max** : 250 lignes. Au-delà, extraire en sous-composants.
- **Props typées** : interface dédiée, même courte.
- **Pas de prop drilling > 2 niveaux** : Zustand ou Context.

## État

- **Zustand** pour l'état global (rôle actif, livret courant, historique).
- **useState** pour les états strictement UI.
- **Pas de Context API** sauf besoins transversaux.
- **Sélecteurs Zustand** : toujours utiliser des sélecteurs (`useUserStore((s) => s.roleActif)`) pour éviter les re-renders inutiles.

## Effets

- `useEffect` avec liste de dépendances exhaustive (règle ESLint `react-hooks/exhaustive-deps`).
- Pas de logique métier dans `useEffect` — extraire dans des fonctions nommées, testables.
- Nettoyage systématique : tout `useEffect` avec timer/subscription/listener retourne une fonction de cleanup.

## Validation

- **react-hook-form + zod** pour tous les formulaires non triviaux.
- Schéma de validation dans un fichier dédié : `schemas/[nom].schema.ts`.
- Messages d'erreur en français, centralisés dans `lib/i18n.ts`.

## Commentaires

**Obligatoires** pour :
- chaque règle métier implémentée (référence à `R1`, `R2`, etc. de §8 du CDC)
- chaque fonction exportée de `lib/`
- chaque contournement ou hack (expliquer *pourquoi*)

**Bannis** :
- commentaires qui paraphrasent le code
- commentaires datés ou auteurs (Git s'en charge)
- TODO sans référence à `TODO-etape-2.md`

## Outillage

- **ESLint** : `npm run lint`
- **Prettier** : `npm run format`
- **TypeScript strict** : `npm run typecheck`
- **Tests** : `npm test`

## Workflow Git

Format **Conventional Commits** :

```
<type>(<scope>): <description en français>

<corps facultatif>

Ref: R13, R14
```

Types : `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `perf`.
Scopes : `droits`, `livret`, `entretien`, `periode`, `pdf`, `i18n`, `deploy`, `skills`.

## Sécurité

- Aucune bibliothèque de tracking/analytics (cf. CDC §20.2)
- `scripts/.env.deploy` jamais commité
- Pas d'`eval`, pas de `dangerouslySetInnerHTML` sans sanitization
