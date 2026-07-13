import type { Role } from '@/types';

/**
 * Classes Tailwind par rôle — exposées explicitement pour que le scanner
 * Tailwind les détecte (les classes dynamiques `bg-role-${role}` ne sont
 * pas garanties d'être conservées par le purge).
 *
 * Référence : refonte équilibrage graphique mai 2026.
 * Utilisé pour les états « actif / sélectionné » dans la sidebar et les
 * cartes du tableau de bord, ainsi que partout où la couleur du rôle
 * actif doit être appliquée dynamiquement.
 */

/** Couleur de texte par rôle (`text-role-X`). */
export const TEXTE_ROLE: Record<Role, string> = {
  apprenti: 'text-role-apprenti',
  maitre: 'text-role-maitre',
  formateur: 'text-role-formateur',
  coordo: 'text-role-coordo',
  admin: 'text-role-admin',
  responsable: 'text-role-responsable',
};

/** Fond plein par rôle (`bg-role-X`). */
export const FOND_PLEIN_ROLE: Record<Role, string> = {
  apprenti: 'bg-role-apprenti',
  maitre: 'bg-role-maitre',
  formateur: 'bg-role-formateur',
  coordo: 'bg-role-coordo',
  admin: 'bg-role-admin',
  responsable: 'bg-role-responsable',
};

/** Fond léger 10% par rôle (`bg-role-X/10`) — pour les états « actif / sélectionné ». */
export const FOND_LEGER_ROLE: Record<Role, string> = {
  apprenti: 'bg-role-apprenti/10',
  maitre: 'bg-role-maitre/10',
  formateur: 'bg-role-formateur/10',
  coordo: 'bg-role-coordo/10',
  admin: 'bg-role-admin/10',
  responsable: 'bg-role-responsable/10',
};

/** Bordure gauche 4px par rôle (`border-l-4 border-l-role-X`). */
export const BORDURE_GAUCHE_ROLE: Record<Role, string> = {
  apprenti: 'border-l-4 border-l-role-apprenti',
  maitre: 'border-l-4 border-l-role-maitre',
  formateur: 'border-l-4 border-l-role-formateur',
  coordo: 'border-l-4 border-l-role-coordo',
  admin: 'border-l-4 border-l-role-admin',
  responsable: 'border-l-4 border-l-role-responsable',
};

/** Bordure complète 2px par rôle (`border-2 border-role-X`). */
export const BORDURE_COMPLETE_ROLE: Record<Role, string> = {
  apprenti: 'border-2 border-role-apprenti',
  maitre: 'border-2 border-role-maitre',
  formateur: 'border-2 border-role-formateur',
  coordo: 'border-2 border-role-coordo',
  admin: 'border-2 border-role-admin',
  responsable: 'border-2 border-role-responsable',
};

/**
 * Combo « état sélectionné » : fond léger + bordure complète + texte.
 * Cohérent avec le ressort visuel des liens de sidebar et des cartes
 * apprenti·e du tableau de bord.
 */
export const SELECTION_ROLE: Record<Role, string> = {
  apprenti: 'bg-role-apprenti/10 border-role-apprenti text-role-apprenti',
  maitre: 'bg-role-maitre/10 border-role-maitre text-role-maitre',
  formateur: 'bg-role-formateur/10 border-role-formateur text-role-formateur',
  coordo: 'bg-role-coordo/10 border-role-coordo text-role-coordo',
  admin: 'bg-role-admin/10 border-role-admin text-role-admin',
  responsable: 'bg-role-responsable/10 border-role-responsable text-role-responsable',
};
