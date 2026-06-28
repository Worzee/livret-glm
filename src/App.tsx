import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { TableauDeBord } from '@/pages/TableauDeBord';
import { NotFound } from '@/pages/NotFound';
import { OrganisationSuivi } from '@/pages/OrganisationSuivi';
import { EntretienTripartite } from '@/pages/EntretienTripartite';
import { FicheSuiviPeriodes } from '@/pages/FicheSuiviPeriodes';
import { FicheSuiviPeriodeDetail } from '@/pages/FicheSuiviPeriodeDetail';
import { EvaluationFinale } from '@/pages/EvaluationFinale';
import { GestionUtilisateurs } from '@/pages/admin/GestionUtilisateurs';
import { ImportUtilisateurs } from '@/pages/admin/ImportUtilisateurs';
import { GestionFormations } from '@/pages/admin/GestionFormations';
import { GestionAffectations } from '@/pages/admin/GestionAffectations';
import { GestionReferentiels } from '@/pages/admin/GestionReferentiels';
import { GestionBanqueQuestions } from '@/pages/admin/GestionBanqueQuestions';
import { GestionEtablissements } from '@/pages/admin/GestionEtablissements';
import { GestionEntreprises } from '@/pages/admin/GestionEntreprises';
import { GestionAttitudes } from '@/pages/admin/GestionAttitudes';
import { PronoteWeb } from '@/pages/PronoteWeb';

/**
 * Composition des routes de l'application.
 * Référence : cahier des charges v1.3, sections 5 et 10.
 */
export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TableauDeBord />} />

        {/* Le routage par livret précis sera affiné quand on aura plusieurs apprenti·e·s */}
        <Route
          path="livret/:apprentiId"
          element={<Navigate to="/livret/organisation-suivi" replace />}
        />

        <Route path="livret/organisation-suivi" element={<OrganisationSuivi />} />
        <Route path="livret/entretien/:numero" element={<EntretienTripartite />} />
        <Route path="livret/fiches-suivi" element={<FicheSuiviPeriodes />} />
        <Route path="livret/fiches-suivi/:ficheId" element={<FicheSuiviPeriodeDetail />} />
        <Route path="livret/fiches-suivi-centre" element={<FicheSuiviPeriodes lieu="centre" />} />
        <Route
          path="livret/fiches-suivi-centre/:ficheId"
          element={<FicheSuiviPeriodeDetail lieu="centre" />}
        />
        <Route path="livret/evaluation-finale" element={<EvaluationFinale />} />
        <Route path="livret/pronote" element={<PronoteWeb />} />

        {/* ── Administration (rôle coordo) ──────────────────────────────── */}
        <Route path="admin/utilisateurs" element={<GestionUtilisateurs />} />
        <Route path="admin/import-utilisateurs" element={<ImportUtilisateurs />} />
        <Route path="admin/formations" element={<GestionFormations />} />
        <Route path="admin/affectations" element={<GestionAffectations />} />
        <Route path="admin/entreprises" element={<GestionEntreprises />} />
        <Route path="admin/referentiels" element={<GestionReferentiels />} />
        <Route path="admin/banque-questions" element={<GestionBanqueQuestions />} />
        <Route path="admin/etablissements" element={<GestionEtablissements />} />
        <Route path="admin/attitudes" element={<GestionAttitudes />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
