import { describe, expect, it } from 'vitest';
import {
  CRITERES_APPRECIATION,
  TRAME_ENTRETIEN,
  pointsAlerteTrame,
  questionsOuiNonSansReponse,
  questionsTrame,
  reponseTrameRenseignee,
} from './trame-entretien';

describe('TRAME_ENTRETIEN — structure', () => {
  it('expose les 5 rubriques dans l’ordre du document', () => {
    expect(TRAME_ENTRETIEN.map((r) => r.id)).toEqual([
      'integration',
      'accompagnement',
      'adequation',
      'organisation-alternance',
      'difficultes',
    ]);
  });

  it('comporte 25 questions au total (18 oui/non + 7 texte)', () => {
    const toutes = questionsTrame();
    expect(toutes).toHaveLength(25);
    expect(toutes.filter((q) => q.type === 'oui-non')).toHaveLength(18);
    expect(toutes.filter((q) => q.type === 'texte')).toHaveLength(7);
  });

  it('toutes les questions oui/non sont des points d’alerte potentiels (alerteSiNon)', () => {
    for (const q of questionsTrame().filter((q) => q.type === 'oui-non')) {
      expect(q.alerteSiNon).toBe(true);
    }
  });

  it('chaque question a un id unique et un libellé non vide', () => {
    const ids = questionsTrame().map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of questionsTrame()) {
      expect(q.libelle.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('reponseTrameRenseignee', () => {
  it('oui/non : renseignée seulement pour un booléen', () => {
    expect(reponseTrameRenseignee('oui-non', true)).toBe(true);
    expect(reponseTrameRenseignee('oui-non', false)).toBe(true);
    expect(reponseTrameRenseignee('oui-non', undefined)).toBe(false);
    expect(reponseTrameRenseignee('oui-non', null)).toBe(false);
  });

  it('texte : renseignée seulement pour une chaîne non vide', () => {
    expect(reponseTrameRenseignee('texte', 'ok')).toBe(true);
    expect(reponseTrameRenseignee('texte', '   ')).toBe(false);
    expect(reponseTrameRenseignee('texte', '')).toBe(false);
    expect(reponseTrameRenseignee('texte', undefined)).toBe(false);
  });
});

describe('pointsAlerteTrame', () => {
  it('retourne les questions oui/non répondues « Non »', () => {
    const reponses = {
      'e1-integ-regles': true,
      'e1-integ-poste': false, // alerte
      'e1-org-absences': false, // alerte
      'e1-adeq-activites': 'des activités', // texte → jamais une alerte
    };
    const alertes = pointsAlerteTrame(reponses).map((q) => q.id);
    expect(alertes).toContain('e1-integ-poste');
    expect(alertes).toContain('e1-org-absences');
    expect(alertes).not.toContain('e1-integ-regles'); // répondu « Oui »
    expect(alertes).not.toContain('e1-adeq-activites'); // texte
  });

  it('aucune alerte si tout est « Oui » ou non renseigné', () => {
    expect(pointsAlerteTrame({ 'e1-integ-poste': true })).toEqual([]);
    expect(pointsAlerteTrame({})).toEqual([]);
    expect(pointsAlerteTrame(undefined)).toEqual([]);
  });
});

describe('questionsOuiNonSansReponse', () => {
  it('liste les oui/non encore non répondues', () => {
    const sansReponse = questionsOuiNonSansReponse({ 'e1-integ-regles': true });
    // 18 oui/non au total, 1 renseignée → 17 restantes
    expect(sansReponse).toHaveLength(17);
    expect(sansReponse.map((q) => q.id)).not.toContain('e1-integ-regles');
  });

  it('toutes les oui/non sont sans réponse pour un entretien vierge', () => {
    expect(questionsOuiNonSansReponse({})).toHaveLength(18);
    expect(questionsOuiNonSansReponse(undefined)).toHaveLength(18);
  });
});

describe('CRITERES_APPRECIATION', () => {
  it('expose les 4 critères avec une description par niveau (++/+/−/−−)', () => {
    expect(CRITERES_APPRECIATION.map((c) => c.cle)).toEqual([
      'ponctualite',
      'comprehensionConsignes',
      'qualiteTravail',
      'integration',
    ]);
    for (const c of CRITERES_APPRECIATION) {
      for (const niveau of ['plusplus', 'plus', 'moins', 'moinsmoins'] as const) {
        expect(c.descriptions[niveau].trim().length).toBeGreaterThan(0);
      }
    }
  });
});
