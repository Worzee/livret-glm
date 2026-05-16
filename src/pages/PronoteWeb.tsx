import { useMemo } from 'react';
import { ExternalLink, Info, Link2, Lock, Shield } from 'lucide-react';
import type { Etablissement } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { peutEditer } from '@/lib/droits';
import { etablissementsAccessibles } from '@/lib/etablissements-accessibles';

/**
 * Page utilisateur — accès au portail Pronote des établissements rattachés.
 * Référence : refonte mai 2026.
 *
 * Visible pour TOUS les rôles. Filtrage par rôle (cf. `etablissementsAccessibles`) :
 *   - admin       : tous les établissements
 *   - coordo      : ceux où il/elle a au moins une formation rattachée
 *   - formateur   : ceux des promos qu'il/elle encadre
 *   - apprenti·e  : celui de sa formation
 *   - maître      : ceux des formations de ses apprenti·e·s
 *
 * Si un établissement n'a pas d'URL Pronote configurée, il est affiché en
 * lecture seule (sans bouton « Ouvrir ») avec une mention explicite.
 */
export function PronoteWeb() {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const etablissementsMap = useEtablissementsStore((s) => s.etablissements);
  const formationsMap = useFormationsStore((s) => s.formations);
  const apprentisMap = useUtilisateursStore((s) => s.apprentis);
  const maitresMap = useUtilisateursStore((s) => s.maitres);
  const formateursMap = useUtilisateursStore((s) => s.formateurs);
  const coordosMap = useUtilisateursStore((s) => s.coordos);

  const etablissements: Etablissement[] = useMemo(
    () =>
      etablissementsAccessibles({
        role: roleActif,
        utilisateurId: utilisateurActif.id,
        formations: Object.values(formationsMap),
        apprentis: Object.values(apprentisMap),
        maitres: Object.values(maitresMap),
        formateurs: Object.values(formateursMap),
        coordos: Object.values(coordosMap),
        etablissements: Object.values(etablissementsMap),
      }),
    [
      roleActif,
      utilisateurActif.id,
      formationsMap,
      apprentisMap,
      maitresMap,
      formateursMap,
      coordosMap,
      etablissementsMap,
    ],
  );

  const peutGerer = peutEditer(roleActif, 'admin.etablissements.gerer');

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Pronote WEB</h1>
        </div>
        <p className="text-muted-foreground">
          Accès direct aux portails Pronote des établissements GRETA auxquels vous êtes
          rattaché·e.
        </p>
      </header>

      {/* Bloc explicatif */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
          <div className="space-y-2 text-sm">
            <h2 className="font-medium text-foreground">À propos de Pronote</h2>
            <p>
              Pronote est l'outil de communication et de suivi pédagogique utilisé par
              le GRETA Lyon Métropole. Chaque établissement dispose de son propre
              portail Pronote ; vous y retrouvez emploi du temps, notes, messagerie,
              vie scolaire, etc.
            </p>
            <p>
              <strong>Identifiants propres à chacun·e :</strong> chaque utilisateur·rice
              dispose de ses propres identifiants Pronote, à utiliser directement sur
              le portail. Le livret d'apprentissage ne stocke aucun mot de passe et ne
              récupère aucune donnée Pronote — il vous redirige simplement.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-md bg-secondary/40 p-3 text-xs">
          <Shield
            className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">
            <strong>Sécurité.</strong> Les liens ci-dessous ouvrent Pronote dans un
            nouvel onglet. Vous restez maître·sse de vos identifiants à tout moment.
          </p>
        </div>
      </section>

      {/* Liste des établissements accessibles */}
      {etablissements.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm space-y-3">
          <p className="text-muted-foreground italic">
            Aucun établissement Pronote n'est rattaché à votre profil actuel.
          </p>
          {peutGerer ? (
            <p>
              Rendez-vous sur la page{' '}
              <a
                href="/admin/etablissements"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Administration → Établissements
              </a>{' '}
              pour configurer les lieux et leurs URLs Pronote.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Contactez un administrateur·rice pour qu'il/elle configure l'établissement
              correspondant à votre formation.
            </p>
          )}
        </section>
      ) : (
        <section className="space-y-3" data-testid="pronote-etablissements">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Établissements rattachés à votre profil
          </h2>
          <ul className="space-y-2">
            {etablissements.map((e) => (
              <li key={e.id}>
                {e.urlPronote ? (
                  <a
                    href={e.urlPronote}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`pronote-eta-${e.id}`}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ExternalLink
                      className="h-5 w-5 shrink-0 text-primary mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {e.nom}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          — Ouvre dans un nouvel onglet
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground break-all">
                        {e.urlPronote}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div
                    data-testid={`pronote-eta-${e.id}`}
                    className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-card/50 p-4"
                  >
                    <ExternalLink
                      className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-muted-foreground">{e.nom}</p>
                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                        URL Pronote non configurée — contactez un administrateur·rice.
                      </p>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {peutGerer && etablissements.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          <Lock className="inline h-3 w-3 mr-1" aria-hidden="true" />
          Configuration réservée au rôle Administrateur·rice —{' '}
          <a
            href="/admin/etablissements"
            className="text-primary underline-offset-2 hover:underline"
          >
            modifier les établissements
          </a>
        </p>
      )}
    </div>
  );
}
