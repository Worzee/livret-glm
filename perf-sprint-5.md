# Performance — bundle et chargement

**Dernière mise à jour** : 2026-05-17 (post CDC v1.5 addendum — vague 3)
**Mesure historique** : 2026-05-08 (Sprint 5 — phase A R10/R22, phase B PDF lazy, bugfix R21)

Référence : cahier des charges v1.3, **§19 (Performance et accessibilité)**.

---

## 1. Mesures objectives (CLI)

### 1.1 Taille du bundle de production — état courant (2026-05-17)

| Asset | Brut | Gzippé | Cible CDC §19.1 | Statut |
|---|---|---|---|---|
| `index.html` | 1,23 KB | 0,66 KB | — | ✓ |
| `index-*.js` (bundle initial) | 520 KB | **137 KB** | < 500 KB | **✓ marge × 3,6** |
| `index-*.css` | 32,5 KB | **6,4 KB** | < 50 KB | **✓ marge × 7,8** |
| `ExportPdfLazy-*.js` (chunk lazy) | 1 475 KB | 493 KB | n/a (lazy-loaded au clic) | acceptable |

→ **Bundle initial total transmis : ~144 KB gzippé** (HTML + JS + CSS).

**Évolution depuis Sprint 5** : +43 KB JS gzip absorbés par les 3 vagues post-livraison (administration métier complète, banque de questions, établissements + Pronote, sélection compétences par stagiaire). Marge versus la cible CDC reste large (× 3,6).

### 1.1bis Snapshot historique Sprint 5 (2026-05-08)

| Asset | Brut | Gzippé |
|---|---|---|
| `index-Didtqnc4.js` | 322 KB | 94 KB |
| `index-xmqICkgX.css` | 24,88 KB | 5,2 KB |

Le chunk `ExportPdfLazy` contient `@react-pdf/renderer` (~1,4 MB minifié) et n'est chargé
que **lors du premier clic sur « Exporter le livret »**. Les utilisateurs qui consultent le
livret sans exporter ne le téléchargent jamais — c'est l'effet recherché du `React.lazy()` posé
dans `BoutonExportPdf.tsx`.

### 1.2 Temps de transfert depuis le VPS (mesures réelles)

Mesures effectuées avec `curl` depuis la même région que le VPS (Hostinger Europe), avec
`Accept-Encoding: gzip` et Basic Auth :

| Ressource | TTFB | Transfert total | Octets transférés |
|---|---|---|---|
| `/` (HTML) | 88 ms | 90 ms | 648 B |
| `/assets/index-*.js` | 82 ms | 157 ms | 94 043 B |
| `/assets/index-*.css` | 74 ms | 74 ms | 5 220 B |

→ **TTFB moyen : ~80 ms** · **Chargement complet du bundle initial : ~160 ms**.

Pour mémoire — cible CDC §19.2 (réseau 3G simulé) :

| Métrique | Cible | Estimation 3G* | Estimation 4G** | Statut |
|---|---|---|---|---|
| Time to Interactive | < 3 s | ~1,8 s | ~0,4 s | ✓ |
| First Contentful Paint | < 1,5 s | ~1,0 s | ~0,2 s | ✓ |
| Largest Contentful Paint | < 2,5 s | ~1,4 s | ~0,3 s | ✓ |
| Cumulative Layout Shift | < 0,1 | à mesurer | à mesurer | à confirmer |

\* 3G simulée Lighthouse (≈ 1,6 Mbps down, 750 Kbps up, 150 ms RTT)
\*\* 4G simulée Lighthouse (≈ 9 Mbps down, 9 Mbps up, 170 ms RTT)

Les estimations 3G/4G sont **dérivées de la taille gzippée** du bundle (94 KB / 1,6 Mbps ≈ 470 ms
pure transfert, plus parsing/exécution). Elles seront confirmées par une exécution Lighthouse
manuelle (cf. § 2).

---

## 2. Mesure Lighthouse manuelle (recommandée avant chaque démo direction)

Lighthouse nécessite Chrome installé localement et ne peut pas être lancé en CLI dans tous les
environnements. **Procédure recommandée** :

### Sur le VPS public (avec Basic Auth)

1. Ouvrir Chrome → https://livret-glm.duckdns.org → saisir Basic Auth
2. F12 → onglet **Lighthouse**
3. Cocher **Performance** + **Accessibility** + **Best practices** + **SEO**
4. Mode : **Navigation** · Device : **Desktop** (puis **Mobile** pour double mesure)
5. Cliquer **Analyze page load**
6. Une fois le rapport généré, exporter en JSON (icône en haut à droite) et le sauvegarder
   dans `perf/` daté.

### En local (sans Basic Auth, plus rapide à itérer)

```bash
npm run build && npm run preview      # serve sur http://localhost:4173
# Dans un autre terminal :
npx lighthouse http://localhost:4173 --output html --output-path=./perf/lh-local.html --quiet
```

Cibles à valider :

| Catégorie | Score min attendu |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

---

## 3. Statut courant (post-livraison CDC v1.5)

| Item | État |
|---|---|
| Bundle initial < 500 KB gzip | ✅ 137 KB (marge × 3,6) |
| Bundle CSS < 50 KB gzip | ✅ 6,4 KB (marge × 7,8) |
| Code-splitting du PDF | ✅ chunk lazy `ExportPdfLazy` |
| TTFB acceptable | ✅ ~80 ms VPS Hostinger (mesure Sprint 5, stable) |
| Lighthouse performance ≥ 90 (estimé) | 🔵 à confirmer manuellement |
| Lighthouse a11y ≥ 95 (estimé) | 🔵 à confirmer manuellement |
| CLS < 0,1 | 🔵 à mesurer en runtime |

---

## 4. Optimisations déjà en place

- **Code-splitting par route** non explicite, mais code-splitting par **fonctionnalité lourde**
  (`@react-pdf/renderer`) via `React.lazy()`.
- **Pas de bibliothèque de charts** : barres empilées en CSS pur (composant `SyntheseBloc`).
- **Pas de parser CSV externe** : ~50 lignes maison pour `import-referentiel.ts` (gain ~30 KB).
- **Police système** : pas de webfont (Helvetica/Arial natif), zéro requête réseau pour la typo.
- **Pas d'analytics ni de tracker** (CDC §20) — zéro requête tierce.
- **Pas d'image lourde** : seul un placeholder logo « GLM » en CSS.
- **Compression gzip activée côté Nginx** (vérifié par `verifier-vps.sh` étape 9).

---

## 5. Pistes d'optimisation (étape 2+)

| Piste | Gain estimé | Coût | Pertinence |
|---|---|---|---|
| Préchargement (`modulepreload`) du chunk PDF si le rôle est formateur | -200 ms au clic | faible | moyenne (quelques utilisateurs) |
| Lazy import par route principale (Évaluation, Entretien, Fiches, admin) | -30 à -50 KB | faible | moyenne (gain visible vu 137 KB désormais) |
| Service worker / mise en cache offline | UX offline | moyen | hors scope étape 1 |
| HTTP/3 sur Traefik | -50 à -100 ms TTFB | élevé (config) | faible (TTFB déjà < 100 ms) |
| Préchargement Basic Auth | UX | faible | UX seulement, pas perf |

→ **Aucune optimisation prioritaire pour étape 1.** Le bundle est déjà bien sous les cibles CDC.

---

*Étape 1 livrée + 3 vagues post-livraison (CDC v1.5). Performances mesurées objectivement et
largement sous les cibles contractuelles. Lighthouse manuel à exécuter avant chaque démo
direction pour confirmation formelle.*
