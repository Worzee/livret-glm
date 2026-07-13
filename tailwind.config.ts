import type { Config } from 'tailwindcss';

/**
 * Configuration Tailwind — Livret d'apprentissage GRETA Lyon Métropole
 * Référence : cahier des charges v1.3, section 14 (Design system)
 *
 * Le thème reste sobre, institutionnel, sans fantaisie. Les couleurs
 * sémantiques (rôles, niveaux de maîtrise) sont exposées en variables CSS
 * pour rester cohérentes entre Tailwind et shadcn/ui.
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // shadcn/ui tokens (référencent les CSS variables de index.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Couleurs sémantiques métier (cf. CDC §14.2 + équilibrage mai 2026)
        // Palette pensée pour identifier chaque rôle d'un coup d'œil :
        //   - 3 rôles métier en froids (bleu / vert / violet)
        //   - 2 rôles administratifs en chauds (orange foncé / or foncé)
        role: {
          apprenti: '#1e40af', // bleu institutionnel (blue-800)
          maitre: '#059669', // vert (emerald-600)
          formateur: '#7c3aed', // violet (violet-600)
          coordo: '#c2410c', // orange foncé (orange-700) — coordination
          admin: '#a16207', // or foncé (yellow-700) — super-utilisateur
          responsable: '#0e7490', // cyan foncé (cyan-700) — famille de l'apprenti·e (13 juillet 2026)
        },
        niveau: {
          maitrise: '#059669',
          partiel: '#d97706',
          'non-maitrise': '#dc2626',
          'non-fait': '#64748b',
        },
        appreciation: {
          plusplus: '#059669',
          plus: '#65a30d',
          moins: '#d97706',
          moinsmoins: '#dc2626',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
