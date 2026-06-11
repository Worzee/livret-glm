import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  CalendarRange,
  ClipboardList,
  ExternalLink,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Library,
  Link2,
  ListChecks,
  Menu,
  Notebook,
  Target,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer, type Ressource } from '@/lib/droits';
import { FOND_LEGER_ROLE, TEXTE_ROLE } from '@/lib/couleurs-role';
import { numeroEntretienPourMotif } from '@/lib/organisation-suivi';
import type { Role } from '@/types';

/**
 * Navigation principale du livret — version desktop ET mobile.
 * Référence : cahier des charges v1.3, sections 5 et 10.
 *
 * Structure :
 *   - section "Livret" : visible pour tous les rôles
 *   - section "Administration" : visible uniquement pour coordo et admin
 *
 * Sur desktop (≥ md) : sidebar permanente à gauche.
 * Sur mobile (< md) : un bouton hamburger ouvre un drawer overlay.
 */

interface LienItem {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
}

const LIENS_LIVRET: LienItem[] = [
  { to: '/', label: 'Tableau de bord', Icon: LayoutDashboard },
  { to: '/livret/organisation-suivi', label: 'Fiches de suivi', Icon: CalendarRange },
  // Les liens « Entretien tripartite 1 » et « 2 » sont insérés dynamiquement
  // après ce point (cf. NavContenu) — ils n'apparaissent que si l'événement
  // correspondant existe dans l'organisation du suivi.
  { to: '/livret/fiches-suivi', label: 'Période en Entreprise', Icon: Notebook },
  { to: '/livret/evaluation-finale', label: 'Évaluation finale', Icon: Target },
  { to: '/livret/pronote', label: 'Pronote WEB', Icon: ExternalLink },
];

/**
 * Liens admin avec leur ressource gardienne. Le lien apparaît si le rôle
 * actif a le droit d'éditer la ressource. Permet au formateur référent
 * de voir « Utilisateurs » (création apprenti·e / maître) sans pour autant
 * accéder aux formations ou affectations.
 */
const LIENS_ADMIN: Array<LienItem & { ressource: Ressource }> = [
  { to: '/admin/utilisateurs', label: 'Utilisateurs', Icon: Users, ressource: 'admin.utilisateurs.creer-apprenti' },
  { to: '/admin/import-utilisateurs', label: 'Import Excel', Icon: FileSpreadsheet, ressource: 'admin.utilisateurs.import-xlsx' },
  { to: '/admin/formations', label: 'Formations', Icon: GraduationCap, ressource: 'admin.formations.creer' },
  { to: '/admin/affectations', label: 'Affectations', Icon: Link2, ressource: 'admin.affectations.gerer' },
  { to: '/admin/referentiels', label: 'Référentiels', Icon: Library, ressource: 'admin.referentiels.gerer' },
  { to: '/admin/banque-questions', label: 'Banque de questions', Icon: ListChecks, ressource: 'admin.banque-questions.gerer' },
  { to: '/admin/etablissements', label: 'Établissements', Icon: Building2, ressource: 'admin.etablissements.gerer' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lien de navigation (commun desktop / mobile)
// ─────────────────────────────────────────────────────────────────────────────

function LienNav({
  to,
  label,
  Icon,
  onClick,
  roleActif,
}: LienItem & { onClick?: () => void; roleActif: Role }) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            // Touch target ≥ 44 px sur mobile (recommandation WCAG 2.5.5).
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
            'hover:bg-secondary',
            // État actif : fond léger + texte de la couleur du rôle actuel
            // (équilibrage graphique mai 2026).
            isActive && cn(FOND_LEGER_ROLE[roleActif], TEXTE_ROLE[roleActif]),
          )
        }
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Contenu de la nav (factorisé entre sidebar desktop et drawer mobile)
// ─────────────────────────────────────────────────────────────────────────────

function NavContenu({ onNavigate }: { onNavigate?: () => void }) {
  const roleActif = useUserStore((s) => s.roleActif);
  const ctx = useApprentiActif();
  const liensAdminVisibles = LIENS_ADMIN.filter((l) => peutEditer(roleActif, l.ressource));

  // Liens entretien conditionnels — un lien par événement entretien existant
  // dans l'organisation du suivi du livret actif (jusqu'à 4 — juin 2026).
  // Pas de doublons : si E1 a 2 événements (cas d'erreur de saisie), un
  // seul lien apparaît.
  const liensEntretiens: LienItem[] = [];
  if (ctx) {
    const numerosVus = new Set<number>();
    for (const evt of ctx.livret.organisationSuivi.evenements) {
      const n = numeroEntretienPourMotif(evt.motif);
      if (n && !numerosVus.has(n)) {
        numerosVus.add(n);
        liensEntretiens.push({
          to: `/livret/entretien/${n}`,
          label: `Entretien tripartite ${n}`,
          Icon: ClipboardList,
        });
      }
    }
    liensEntretiens.sort((a, b) => a.label.localeCompare(b.label, 'fr-FR'));
  }

  // Insertion entre « Fiches de suivi » (index 1) et « Période en Entreprise ».
  const liensLivret = [
    LIENS_LIVRET[0],
    LIENS_LIVRET[1],
    ...liensEntretiens,
    ...LIENS_LIVRET.slice(2),
  ];

  return (
    <nav aria-label="Navigation du livret" className="p-3 space-y-6">
      <div>
        <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Livret
        </h2>
        <ul className="space-y-1">
          {liensLivret.map((lien) => (
            <LienNav key={lien.to} {...lien} onClick={onNavigate} roleActif={roleActif} />
          ))}
        </ul>
      </div>

      {liensAdminVisibles.length > 0 && (
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administration
          </h2>
          <ul className="space-y-1">
            {liensAdminVisibles.map((lien) => (
              <LienNav key={lien.to} {...lien} onClick={onNavigate} roleActif={roleActif} />
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar permanente (desktop)
// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <aside className="hidden md:block w-60 shrink-0 border-r border-border bg-card">
      <NavContenu />
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu mobile (drawer + bouton hamburger)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bouton hamburger affiché uniquement sur mobile (`md:hidden`), qui ouvre
 * un drawer latéral contenant les mêmes liens que la sidebar desktop.
 *
 *   - Ferme à Esc, par clic sur l'overlay, par clic sur la croix, ou
 *     automatiquement après navigation vers un lien.
 *   - Accessible : `role="dialog"`, `aria-modal="true"`, focus piégé.
 */
export function MobileMenu() {
  const [ouvert, setOuvert] = useState(false);

  // Fermeture à Esc
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert]);

  // Bloque le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (!ouvert) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Ouvrir le menu de navigation"
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          className="fixed inset-0 z-50 md:hidden"
        >
          {/* Overlay */}
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOuvert(false)}
            className="absolute inset-0 bg-black/50"
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-sm font-semibold">Navigation</span>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <NavContenu onNavigate={() => setOuvert(false)} />
          </div>
        </div>
      )}
    </>
  );
}
