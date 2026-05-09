import { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  HardHat,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';
import type { Apprenti, Role, Utilisateur } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { filtrerApprentis } from '@/lib/apprentis-accessibles';
import { ModaleApprenti } from '@/components/admin/ModaleApprenti';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — gestion des utilisateurs.
 * Référence : cahier des charges v1.3, section 6 (matrice droits) et §24.6.
 *
 * Étape 1 (livrée) : CRUD complet sur les apprenti·e·s.
 * Étape 2 (à venir) : maître / formateur / coordo.
 *
 * Accessible aux rôles coordo et admin uniquement (matrice §6). Les autres
 * voient un écran d'accès refusé.
 */

type FiltreRole = 'tous' | Role;

export function GestionUtilisateurs() {
  const roleActif = useUserStore((s) => s.roleActif);
  const apprentis = useUtilisateursStore((s) => s.apprentis);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);
  const coordos = useUtilisateursStore((s) => s.coordos);
  const admins = useUtilisateursStore((s) => s.admins);
  const supprimerApprenti = useUtilisateursStore((s) => s.supprimerApprenti);

  const [requete, setRequete] = useState('');
  const [filtreRole, setFiltreRole] = useState<FiltreRole>('tous');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [apprentiEnEdition, setApprentiEnEdition] = useState<Apprenti | undefined>();
  // Confirmation 2 clics pour suppression — id du compte en cours, ou null.
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  // Auto-annulation de la confirmation après 10 s (pattern cohérent avec les
  // autres confirmations de l'app).
  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  // Liste plate de tous les utilisateurs (toutes catégories) pour la table.
  const tousUtilisateurs: Utilisateur[] = useMemo(
    () => [
      ...Object.values(apprentis),
      ...Object.values(maitres),
      ...Object.values(formateurs),
      ...Object.values(coordos),
      ...Object.values(admins),
    ],
    [apprentis, maitres, formateurs, coordos, admins],
  );

  const filtres = useMemo(() => {
    let r = tousUtilisateurs;
    if (filtreRole !== 'tous') r = r.filter((u) => u.role === filtreRole);
    if (requete.trim()) {
      // Réutilise le helper apprentis-accessibles (filtre nom/prénom normalisé).
      r = filtrerApprentis(
        r as Apprenti[], // typage permissif — la fonction n'utilise que prenom/nom.
        requete,
      );
    }
    return [...r].sort(
      (a, b) =>
        a.role.localeCompare(b.role) ||
        a.nom.localeCompare(b.nom, 'fr-FR') ||
        a.prenom.localeCompare(b.prenom, 'fr-FR'),
    );
  }, [tousUtilisateurs, requete, filtreRole]);

  // Accès — coordo ou admin (vérification après les hooks pour respecter
  // les rules-of-hooks)
  const peutVoirPage =
    peutEditer(roleActif, 'admin.utilisateurs.creer-apprenti') ||
    peutEditer(roleActif, 'admin.utilisateurs.creer-coordo');

  if (!peutVoirPage) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  const peutCreerApprenti = peutEditer(roleActif, 'admin.utilisateurs.creer-apprenti');
  const peutModifier = peutEditer(roleActif, 'admin.utilisateurs.modifier');
  const peutSupprimer = peutEditer(roleActif, 'admin.utilisateurs.supprimer');

  function ouvrirCreation() {
    setApprentiEnEdition(undefined);
    setModaleOuverte(true);
  }

  function ouvrirEdition(apprenti: Apprenti) {
    setApprentiEnEdition(apprenti);
    setModaleOuverte(true);
  }

  function fermerModale() {
    setModaleOuverte(false);
    setApprentiEnEdition(undefined);
  }

  function declencherSuppression(id: string) {
    if (confirmationSuppression === id) {
      supprimerApprenti(id);
      setConfirmationSuppression(null);
    } else {
      setConfirmationSuppression(id);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Création et administration des comptes des 4 rôles métier.
          </p>
        </div>
        {peutCreerApprenti && (
          <button
            type="button"
            onClick={ouvrirCreation}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvel·le apprenti·e
          </button>
        )}
      </header>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[16rem] max-w-md">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Filtrer par nom ou prénom"
            aria-label="Filtrer la liste des utilisateurs"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <FiltreRoleSelect valeur={filtreRole} onChange={setFiltreRole} />
      </div>

      {/* Liste */}
      {filtres.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun utilisateur ne correspond à vos critères.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Rôle</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtres.map((u) => {
                const estApprenti = u.role === 'apprenti';
                const enConfirmation = confirmationSuppression === u.id;
                return (
                  <tr key={u.id} className={cn(enConfirmation && 'bg-red-50')}>
                    <td className="px-4 py-2 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <IconeRole role={u.role} />
                        {u.prenom} {u.nom}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {libelleRole(u.role)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-2 text-right">
                      {estApprenti ? (
                        <div className="inline-flex items-center gap-1">
                          {peutModifier && (
                            <button
                              type="button"
                              onClick={() => ouvrirEdition(u as Apprenti)}
                              aria-label={`Modifier ${u.prenom} ${u.nom}`}
                              className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                          {peutSupprimer && (
                            <button
                              type="button"
                              onClick={() => declencherSuppression(u.id)}
                              aria-label={
                                enConfirmation
                                  ? `Confirmer la suppression de ${u.prenom} ${u.nom}`
                                  : `Supprimer ${u.prenom} ${u.nom}`
                              }
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                                enConfirmation
                                  ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                                  : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                              )}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {enConfirmation && (
                                <span className="text-xs font-medium">Confirmer</span>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Étape 2
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ModaleApprenti
        ouvert={modaleOuverte}
        apprenti={apprentiEnEdition}
        onAnnuler={fermerModale}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

const ICONES_ROLE = {
  apprenti: { Icon: GraduationCap, classe: 'text-role-apprenti' },
  maitre: { Icon: HardHat, classe: 'text-role-maitre' },
  formateur: { Icon: UserCog, classe: 'text-role-formateur' },
  coordo: { Icon: ShieldCheck, classe: 'text-role-coordo' },
  admin: { Icon: ShieldCheck, classe: 'text-role-admin' },
} as const;

function IconeRole({ role }: { role: Role }) {
  const { Icon, classe } = ICONES_ROLE[role];
  return <Icon className={cn('h-4 w-4 shrink-0', classe)} aria-hidden="true" />;
}

interface FiltreRoleSelectProps {
  valeur: FiltreRole;
  onChange: (v: FiltreRole) => void;
}

function FiltreRoleSelect({ valeur, onChange }: FiltreRoleSelectProps) {
  return (
    <select
      value={valeur}
      onChange={(e) => onChange(e.target.value as FiltreRole)}
      aria-label="Filtrer par rôle"
      className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="tous">Tous les rôles</option>
      <option value="apprenti">Apprenti·e·s</option>
      <option value="maitre">Maîtres d'apprentissage</option>
      <option value="formateur">Formateurs référents</option>
      <option value="coordo">Coordinateur·rice·s</option>
      <option value="admin">Administrateur·rice·s</option>
    </select>
  );
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">
            Accès réservé à l'administration
          </h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que{' '}
            <strong>{libelleRole(roleActif)}</strong>. La gestion des utilisateurs
            est réservée aux rôles <strong>Coordinateur·rice</strong> et{' '}
            <strong>Administrateur·rice</strong>. Utilisez le sélecteur de rôle en
            haut à droite pour basculer.
          </p>
        </div>
      </div>
    </div>
  );
}
