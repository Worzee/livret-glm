# Design System MASTER — Livret d'apprentissage

Référence : cahier des charges v1.3, sections 14 (design system) et 22.2.1 (skill UI UX Pro Max).

## Positionnement

- **Product type** : Education platform / Government / Public service
- **Style** : Accessible & Ethical · Minimalism & Swiss Style
- **Tone** : Sobre, institutionnel, sans fantaisie
- **Audience** : Personnel GRETA, apprenti·e·s, maîtres d'apprentissage en entreprise

## Anti-patterns proscrits

- Pas de gradients violet/rose "AI"
- Pas de dark mode par défaut (CDC §14.1)
- Pas d'animations tape-à-l'œil — transitions douces 150-300 ms uniquement
- Pas d'emojis en guise d'icônes (Lucide exclusivement)
- Pas de stock photos génériques
- Pas de typographie décorative

## Palette

| Usage | Token | Hex | Tailwind |
|---|---|---|---|
| Primaire (bleu institutionnel) | `--primary` | `#1e40af` | `blue-800` |
| Bleu accent | — | `#3b82f6` | `blue-500` |
| Gris neutres | `slate-*` | — | `slate-*` |
| Vert validation | `niveau-maitrise` | `#059669` | `emerald-600` |
| Ambre attention | `niveau-partiel` | `#d97706` | `amber-600` |
| Rouge alerte | `niveau-non-maitrise` | `#dc2626` | `red-600` |
| Gris "non fait" | `niveau-non-fait` | `#64748b` | `slate-500` |

### Couleurs par rôle (bandeau et badges)

| Rôle | Couleur | Token |
|---|---|---|
| Apprenti·e | Bleu institutionnel `#1e40af` | `role-apprenti` |
| Maître d'apprentissage | Vert `#059669` | `role-maitre` |
| Formateur référent | Violet `#7c3aed` | `role-formateur` |
| Coordinateur·rice | Cyan `#0e7490` | `role-coordo` |
| Administrateur·rice | Indigo `#4338ca` | `role-admin` |

## Typographie

- Famille : stack système (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`)
- Échelle : Tailwind par défaut, pas de tailles custom
- Titres de page : `text-2xl font-semibold`
- Titres de section : `text-lg font-medium`
- Corps : `text-sm` ou `text-base`

## Composants récurrents

- **Bandeau démo** (§21.6) — non-dismissable, ambre, en haut de toutes les pages
- **RoleSwitcher** — 3 boutons egaux, code couleur par rôle
- **ChampEditable** — bordure gauche bleue si éditable, badge "verrou" sinon
- **Cartes de fiche** — `bg-card`, `rounded-lg`, ombre légère, padding 6
- **Boutons primaires** — `bg-primary text-primary-foreground`
- **Boutons secondaires** — outline (`border border-border`)
- **Badges d'état** — codes couleur cohérents (brouillon = gris, en cours = ambre, signée = vert, verrouillée = bleu foncé)

## Accessibilité (bonnes pratiques, pas RGAA complet — cf. CDC §14.5)

- Tous les `<input>` ont un `<label>` associé
- Navigation clavier sur les parcours principaux
- `:focus-visible` non désactivé (`outline` conservé via Tailwind ring)
- `alt=""` sur images décoratives
- Hiérarchie `<h1>`-`<h6>` respectée
- `role="alert"` sur les bandeaux d'avertissement
- Contraste texte AA minimum (4.5:1)

## Responsive

Cibles prioritaires (CDC §11.1) :
- **Apprenti·e** : mobile (375-425px)
- **Maître d'apprentissage** : tablette (768-1024px)
- **Formateur référent** : desktop (≥ 1280px)

Breakpoints Tailwind utilisés : `sm` 640, `md` 768, `lg` 1024, `xl` 1280.

Cas spécial **tableau tri-colonnes** sur mobile : empilement vertical par compétence (CDC §11.3).
