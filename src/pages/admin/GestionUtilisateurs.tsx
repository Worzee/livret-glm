import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
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
import type { Apprenti, Coordo, Formateur, Maitre, Role, Utilisateur } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { apprentisAccessibles, filtrerApprentis } from '@/lib/apprentis-accessibles';
import { evaluerVerrouAffectation } from '@/lib/affectation-verrou';
import { ModaleApprenti } from '@/components/admin/ModaleApprenti';
import { ModaleUtilisateurStaff, type RoleStaff } from '@/components/admin/ModaleUtilisateurStaff';
import { SelecteurCoordoActif } from '@/components/common/SelecteurCoordoActif';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — gestion des utilisateurs.
 * Référence : cahier des charges v1.3, section 6 (matrice droits) et §24.6.
 *
 * CRUD complet sur les 4 rôles métier :
 *   - apprenti·e  : coordo + admin
 *   - maître      : coordo + admin
 *   - formateur   : coordo + admin
 *   - coordo      : admin uniquement (droit exclusif)
 *
 * La suppression d'un maître/formateur est bloquée s'il/elle a encore des
 * apprenti·e·s rattaché·e·s — l'UI le signale et désactive le bouton.
 */

type FiltreRole = 'tous' | Role;

export function GestionUtilisateurs() {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const apprentis = useUtilisateursStore((s) => s.apprentis);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);
  const coordos = useUtilisateursStore((s) => s.coordos);
  const admins = useUtilisateursStore((s) => s.admins);
  const supprimerApprenti = useUtilisateursStore((s) => s.supprimerApprenti);
  const livrets = useLivretStore((s) => s.livrets);
  const supprimerMaitre = useUtilisateursStore((s) => s.supprimerMaitre);
  const supprimerFormateur = useUtilisateursStore((s) => s.supprimerFormateur);
  const supprimerCoordo = useUtilisateursStore((s) => s.supprimerCoordo);

  const [requete, setRequete] = useState('');
  const [filtreRole, setFiltreRole] = useState<FiltreRole>('tous');
  const [menuCreationOuvert, setMenuCreationOuvert] = useState(false);
  // Modale apprenti·e (création/édition).
  const [modaleApprentiOuverte, setModaleApprentiOuverte] = useState(false);
  const [apprentiEnEdition, setApprentiEnEdition] = useState<Apprenti | undefined>();
  // Modale staff (maître/formateur/coordo).
  const [modaleStaffOuverte, setModaleStaffOuverte] = useState(false);
  const [roleStaffEnCours, setRoleStaffEnCours] = useState<RoleStaff>('maitre');
  const [staffEnEdition, setStaffEnEdition] = useState<Maitre | Formateur | Coordo | undefined>();
  // Confirmation 2 clics pour suppression — id en cours, ou null.
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  // Liste plate de tous les utilisateurs pour la table. Périmètre coordo
  // (juin 2026) : un coordo ne liste que les apprenti·e·s que l'admin lui a
  // affecté·e·s — les autres types d'utilisateurs restent visibles en entier.
  const tousUtilisateurs: Utilisateur[] = useMemo(
    () => [
      ...apprentisAccessibles(utilisateurActif, Object.values(apprentis)),
      ...Object.values(maitres),
      ...Object.values(formateurs),
      ...Object.values(coordos),
      ...Object.values(admins),
    ],
    [utilisateurActif, apprentis, maitres, formateurs, coordos, admins],
  );

  const filtres = useMemo(() => {
    let r = tousUtilisateurs;
    if (filtreRole !== 'tous') r = r.filter((u) => u.role === filtreRole);
    if (requete.trim()) {
      r = filtrerApprentis(r as Apprenti[], requete);
    }
    return [...r].sort(
      (a, b) =>
        a.role.localeCompare(b.role) ||
        a.nom.localeCompare(b.nom, 'fr-FR') ||
        a.prenom.localeCompare(b.prenom, 'fr-FR'),
    );
  }, [tousUtilisateurs, requete, filtreRole]);

  // Pré-calcul du nombre d'apprenti·e·s rattaché·e·s à chaque formateur,
  // pour signaler la suppression bloquée.
  const formateursAvecApprentis = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of Object.values(apprentis)) {
      counts[a.formateurReferentId] = (counts[a.formateurReferentId] ?? 0) + 1;
    }
    return counts;
  }, [apprentis]);

  // Accès page
  const peutVoirPage =
    peutEditer(roleActif, 'admin.utilisateurs.creer-apprenti') ||
    peutEditer(roleActif, 'admin.utilisateurs.creer-coordo');

  if (!peutVoirPage) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  const peutCreerApprenti = peutEditer(roleActif, 'admin.utilisateurs.creer-apprenti');
  const peutCreerMaitre = peutEditer(roleActif, 'admin.utilisateurs.creer-maitre');
  const peutCreerFormateur = peutEditer(roleActif, 'admin.utilisateurs.creer-formateur');
  const peutCreerCoordo = peutEditer(roleActif, 'admin.utilisateurs.creer-coordo');
  const peutModifier = peutEditer(roleActif, 'admin.utilisateurs.modifier');
  const peutSupprimer = peutEditer(roleActif, 'admin.utilisateurs.supprimer');

  function ouvrirCreationApprenti() {
    setApprentiEnEdition(undefined);
    setModaleApprentiOuverte(true);
    setMenuCreationOuvert(false);
  }
  function ouvrirCreationStaff(role: RoleStaff) {
    setRoleStaffEnCours(role);
    setStaffEnEdition(undefined);
    setModaleStaffOuverte(true);
    setMenuCreationOuvert(false);
  }
  function ouvrirEdition(u: Utilisateur) {
    if (u.role === 'apprenti') {
      setApprentiEnEdition(u as Apprenti);
      setModaleApprentiOuverte(true);
    } else if (u.role === 'maitre' || u.role === 'formateur' || u.role === 'coordo') {
      setRoleStaffEnCours(u.role);
      setStaffEnEdition(u as Maitre | Formateur | Coordo);
      setModaleStaffOuverte(true);
    }
  }

  function declencherSuppression(u: Utilisateur) {
    if (confirmationSuppression !== u.id) {
      setConfirmationSuppression(u.id);
      return;
    }
    // 2ᵉ clic : suppression effective.
    let ok = true;
    switch (u.role) {
      case 'apprenti':
        supprimerApprenti(u.id);
        break;
      case 'maitre':
        ok = supprimerMaitre(u.id);
        break;
      case 'formateur':
        ok = supprimerFormateur(u.id);
        break;
      case 'coordo':
        supprimerCoordo(u.id);
        break;
    }
    setConfirmationSuppression(null);
    if (!ok) {
      // Le store a refusé la suppression (références non vides). Note : le
      // bouton est censé être désactivé en amont — ce cas ne doit pas arriver
      // en pratique, mais on garde un fallback silencieux.
    }
  }

  /** Le bouton supprimer doit-il être désactivé pour cet·te utilisateur·rice ? */
  function suppressionBloquee(u: Utilisateur): { bloque: boolean; raison?: string } {
    // Suffixe d'inclusivité au pluriel : « apprenti·e·s » (cohérent CDC).
    const sfx = (n: number) => (n > 1 ? '·s' : '');
    if (u.role === 'apprenti') {
      // Verrouillage si le contrat a démarré, fiches existent, ou entretien
      // initialisé — éviter d'effacer du travail pédagogique. Cohérent avec
      // le verrou de la page Affectations.
      const apprenti = u as Apprenti;
      const livret = Object.values(livrets).find((l) => l.apprentiId === apprenti.id);
      if (livret) {
        const v = evaluerVerrouAffectation(apprenti, livret);
        if (v.verrouille) {
          return { bloque: true, raison: v.raison };
        }
      }
    }
    if (u.role === 'maitre') {
      const nb = (u as Maitre).apprentiIds.length;
      if (nb > 0) {
        return {
          bloque: true,
          raison: `${nb} apprenti·e${sfx(nb)} rattaché·e${sfx(nb)} : réaffectez-les avant suppression.`,
        };
      }
    }
    if (u.role === 'formateur') {
      const nb = formateursAvecApprentis[u.id] ?? 0;
      if (nb > 0) {
        return {
          bloque: true,
          raison: `${nb} apprenti·e${sfx(nb)} référence${nb > 1 ? 'nt' : ''} ce formateur : réaffectez avant suppression.`,
        };
      }
    }
    return { bloque: false };
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
        {/* Menu de création — un dropdown qui propose tous les rôles autorisés. */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuCreationOuvert((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuCreationOuvert}
            className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouveau · nouvelle…
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          {menuCreationOuvert && (
            <>
              {/* Backdrop pour fermer en cliquant à côté */}
              <button
                type="button"
                aria-label="Fermer le menu"
                className="fixed inset-0 z-10"
                onClick={() => setMenuCreationOuvert(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 min-w-[16rem] rounded-md border border-border bg-card shadow-lg"
              >
                {peutCreerApprenti && (
                  <OptionCreation
                    Icon={GraduationCap}
                    couleur="text-role-apprenti"
                    label="Apprenti·e"
                    onClick={ouvrirCreationApprenti}
                  />
                )}
                {peutCreerMaitre && (
                  <OptionCreation
                    Icon={HardHat}
                    couleur="text-role-maitre"
                    label="Maître / Tuteur"
                    onClick={() => ouvrirCreationStaff('maitre')}
                  />
                )}
                {peutCreerFormateur && (
                  <OptionCreation
                    Icon={UserCog}
                    couleur="text-role-formateur"
                    label="Formateur référent"
                    onClick={() => ouvrirCreationStaff('formateur')}
                  />
                )}
                {peutCreerCoordo && (
                  <OptionCreation
                    Icon={ShieldCheck}
                    couleur="text-role-coordo"
                    label="Coordinateur·rice"
                    hint="Réservé administrateur·rice"
                    onClick={() => ouvrirCreationStaff('coordo')}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Bascule de périmètre (démo) : en rôle coordo, change le coordo dont
          on voit les apprenti·e·s. */}
      <SelecteurCoordoActif />

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
                <th className="px-2 md:px-4 py-2 text-left">Nom</th>
                <th className="px-2 md:px-4 py-2 text-left">Rôle</th>
                {/* Email caché sur mobile (replié sous le nom dans la cellule Nom). */}
                <th className="hidden md:table-cell px-4 py-2 text-left">Email</th>
                <th className="px-2 md:px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtres.map((u) => {
                const enConfirmation = confirmationSuppression === u.id;
                const blocage = suppressionBloquee(u);
                // Le rôle admin n'est pas modifiable depuis cette page (compte
                // pilote unique). Tout le reste l'est si le rôle actif a les droits.
                const editable = u.role !== 'admin' && peutModifier;
                const supprimable = u.role !== 'admin' && peutSupprimer && !blocage.bloque;
                const classeBordureRole = BORDURES_ROLE[u.role];
                const classeLibelleRole = cn(LIBELLES_ROLE[u.role], 'font-medium');
                return (
                  <tr key={u.id} className={cn(classeBordureRole, enConfirmation && 'bg-red-50')}>
                    <td className="px-2 md:px-4 py-2 font-medium align-top">
                      <span className="inline-flex items-center gap-2">
                        <IconeRole role={u.role} />
                        <span>
                          {u.prenom} {u.nom}
                        </span>
                      </span>
                      {/* Email replié sous le nom sur mobile. */}
                      <p className="md:hidden text-xs font-normal text-muted-foreground mt-0.5 break-all">
                        {u.email}
                      </p>
                    </td>
                    <td className={cn('px-2 md:px-4 py-2 align-top', classeLibelleRole)}>
                      {libelleRole(u.role)}
                    </td>
                    <td className="hidden md:table-cell px-4 py-2 text-muted-foreground align-top">
                      {u.email}
                    </td>
                    <td className="px-2 md:px-4 py-2 text-right align-top">
                      <div className="inline-flex items-center gap-1">
                        {editable && (
                          <button
                            type="button"
                            onClick={() => ouvrirEdition(u)}
                            aria-label={`Modifier ${u.prenom} ${u.nom}`}
                            className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                        {peutSupprimer && u.role !== 'admin' && (
                          <button
                            type="button"
                            disabled={!supprimable}
                            onClick={() => declencherSuppression(u)}
                            aria-label={
                              enConfirmation
                                ? `Confirmer la suppression de ${u.prenom} ${u.nom}`
                                : `Supprimer ${u.prenom} ${u.nom}`
                            }
                            title={blocage.raison}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                              enConfirmation
                                ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                                : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                              !supprimable && 'opacity-40 cursor-not-allowed hover:bg-background',
                            )}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {enConfirmation && (
                              <span className="text-xs font-medium">Confirmer</span>
                            )}
                          </button>
                        )}
                      </div>
                      {blocage.bloque && (
                        <p className="mt-0.5 text-[10px] text-amber-700 italic">{blocage.raison}</p>
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
        // `key` distincte → force un remount frais à chaque ouverture
        // (évite la race où setSaisie pouvait écraser un fill en cours).
        key={modaleApprentiOuverte ? (apprentiEnEdition?.id ?? 'creation') : 'fermee-apprenti'}
        ouvert={modaleApprentiOuverte}
        apprenti={apprentiEnEdition}
        onAnnuler={() => {
          setModaleApprentiOuverte(false);
          setApprentiEnEdition(undefined);
        }}
      />
      <ModaleUtilisateurStaff
        key={
          modaleStaffOuverte
            ? `${roleStaffEnCours}-${staffEnEdition?.id ?? 'creation'}`
            : 'fermee-staff'
        }
        ouvert={modaleStaffOuverte}
        role={roleStaffEnCours}
        utilisateur={staffEnEdition}
        onAnnuler={() => {
          setModaleStaffOuverte(false);
          setStaffEnEdition(undefined);
        }}
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

// Classes Tailwind explicites — évite le bricolage `border-l-role-${role}`
// qui n'est pas détecté par le scanner Tailwind (purge → classe absente du CSS).
const BORDURES_ROLE: Record<Role, string> = {
  apprenti: 'border-l-4 border-l-role-apprenti',
  maitre: 'border-l-4 border-l-role-maitre',
  formateur: 'border-l-4 border-l-role-formateur',
  coordo: 'border-l-4 border-l-role-coordo',
  admin: 'border-l-4 border-l-role-admin',
};

const LIBELLES_ROLE: Record<Role, string> = {
  apprenti: 'text-role-apprenti',
  maitre: 'text-role-maitre',
  formateur: 'text-role-formateur',
  coordo: 'text-role-coordo',
  admin: 'text-role-admin',
};

function IconeRole({ role }: { role: Role }) {
  const { Icon, classe } = ICONES_ROLE[role];
  return <Icon className={cn('h-4 w-4 shrink-0', classe)} aria-hidden="true" />;
}

interface OptionCreationProps {
  Icon: typeof GraduationCap;
  couleur: string;
  label: string;
  hint?: string;
  onClick: () => void;
}

function OptionCreation({ Icon, couleur, label, hint, onClick }: OptionCreationProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:outline-none focus-visible:bg-secondary"
    >
      <Icon className={cn('h-4 w-4 shrink-0', couleur)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Plus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
    </button>
  );
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
      <option value="maitre">Maîtres / Tuteurs</option>
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
          <h1 className="text-lg font-medium text-amber-900">Accès réservé à l'administration</h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
            La gestion des utilisateurs est réservée aux rôles <strong>Coordinateur·rice</strong> et{' '}
            <strong>Administrateur·rice</strong>. Utilisez le sélecteur de rôle en haut à droite
            pour basculer.
          </p>
        </div>
      </div>
    </div>
  );
}
