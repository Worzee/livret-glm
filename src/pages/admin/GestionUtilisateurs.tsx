import { Construction, GraduationCap, HardHat, Lock, Plus, ShieldCheck, UserCog } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole, peutEditer, type Ressource } from '@/lib/droits';
import { utilisateursDemo } from '@/fixtures/utilisateurs';
import type { Role } from '@/types';

/**
 * Page d'administration — gestion des utilisateurs.
 * Accessible aux rôles coordo et admin. Les autres voient un écran d'accès refusé.
 *
 * Coordo : peut créer apprenti·e, maître, formateur (PAS coordo).
 * Admin  : peut créer les 4 rôles, dont les coordos (droit exclusif).
 *
 * Sprint 1 : placeholder + liste des fixtures + boutons "Créer" désactivés.
 * Les vrais formulaires CRUD viendront dans un sprint dédié.
 */

const ROLES_GERABLES: Array<{
  role: Role;
  Icon: typeof GraduationCap;
  couleur: string;
  ressource: Ressource;
}> = [
  {
    role: 'apprenti',
    Icon: GraduationCap,
    couleur: 'text-role-apprenti',
    ressource: 'admin.utilisateurs.creer-apprenti',
  },
  {
    role: 'maitre',
    Icon: HardHat,
    couleur: 'text-role-maitre',
    ressource: 'admin.utilisateurs.creer-maitre',
  },
  {
    role: 'formateur',
    Icon: UserCog,
    couleur: 'text-role-formateur',
    ressource: 'admin.utilisateurs.creer-formateur',
  },
  {
    role: 'coordo',
    Icon: ShieldCheck,
    couleur: 'text-role-coordo',
    ressource: 'admin.utilisateurs.creer-coordo',
  },
];

export function GestionUtilisateurs() {
  const roleActif = useUserStore((s) => s.roleActif);
  // Accès à la page si on peut créer au moins un type d'utilisateur.
  const peutVoirPage =
    peutEditer(roleActif, 'admin.utilisateurs.creer-apprenti') ||
    peutEditer(roleActif, 'admin.utilisateurs.creer-coordo');

  if (!peutVoirPage) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">
          Création et administration des comptes utilisateurs des 4 rôles.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Construction className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">
            Sprint 1 — placeholder. Les formulaires de création/édition/suppression seront
            implémentés dans un sprint dédié à l'administration.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Créer un nouvel utilisateur</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES_GERABLES.map(({ role, Icon, couleur, ressource }) => {
            const autorise = peutEditer(roleActif, ressource);
            return (
              <button
                key={role}
                type="button"
                disabled
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                title={
                  autorise
                    ? 'Formulaire à venir dans un sprint dédié'
                    : `Réservé : seul l'administrateur·rice peut créer des ${libelleRole(role).toLowerCase()}s`
                }
              >
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${couleur}`} aria-hidden="true" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {autorise ? (
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="font-medium text-sm">{libelleRole(role)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {autorise ? 'À venir' : 'Réservé administrateur·rice'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Utilisateurs existants (fixtures de démonstration)</h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Rôle</th>
                <th className="px-4 py-2 text-left">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.values(utilisateursDemo).map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2 font-medium">
                    {u.prenom} {u.nom}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{libelleRole(u.role)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <h1 className="text-lg font-medium text-amber-900">Accès réservé au coordinateur·rice</h1>
      <p className="mt-2 text-sm text-amber-900/80">
        Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
        La gestion des utilisateurs est réservée au rôle <strong>Coordinateur·rice</strong>.
        Utilisez le sélecteur de rôle en haut à droite pour basculer.
      </p>
    </div>
  );
}
