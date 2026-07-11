/**
 * Générateur de PDF de démonstration pour les fixtures des documents
 * administratifs (10 juillet 2026). Produit un PDF 1 page A4 minimal mais
 * VALIDE (offsets xref calculés), encodé en data-URL — consultable dans le
 * navigateur comme le serait un vrai document déposé par la coordination.
 *
 * Texte en WinAnsiEncoding (latin-1) : accents français acceptés, éviter les
 * caractères hors latin-1 (tirets cadratins, guillemets courbes…).
 */

function echapperTextePdf(texte: string): string {
  return texte.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Ramène le texte en latin-1 strict : `btoa` refuse tout code > 255 (une
 * apostrophe typographique suffirait à faire échouer le chargement du module).
 */
function versLatin1(texte: string): string {
  return (
    texte
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[—–]/g, '-')
      .replace(/œ/g, 'oe')
      .replace(/Œ/g, 'OE')
      .replace(/…/g, '...')
      // Filet de sécurité : tout caractère restant hors latin-1 (code > 255,
      // le seul cas qui fasse échouer btoa) devient « ? ».
      .replace(/[Ā-￿]/g, '?')
  );
}

/** Construit le PDF (chaîne d'octets latin-1) — 1 page, Helvetica. */
function construirePdf(titre: string, lignes: ReadonlyArray<string>): string {
  const corps: string[] = [`BT /F1 16 Tf 72 780 Td (${echapperTextePdf(versLatin1(titre))}) Tj ET`];
  lignes.forEach((ligne, i) => {
    corps.push(`BT /F1 11 Tf 72 ${748 - i * 18} Td (${echapperTextePdf(versLatin1(ligne))}) Tj ET`);
  });
  const stream = corps.join('\n');

  const objets = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objets.forEach((objet, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objet}\nendobj\n`;
  });
  const positionXref = pdf.length;
  pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${positionXref}\n%%EOF`;
  return pdf;
}

export interface PdfDemo {
  dataUrl: string;
  /** Taille du fichier en octets (celle du PDF généré). */
  taille: number;
}

/** PDF de démo en data-URL — utilisé par les fixtures `documents-demo`. */
export function creerPdfDemo(titre: string, lignes: ReadonlyArray<string>): PdfDemo {
  const pdf = construirePdf(titre, lignes);
  // Le PDF est construit en latin-1 (tous les codes < 256) : btoa s'applique
  // directement à la chaîne d'octets.
  return {
    dataUrl: `data:application/pdf;base64,${btoa(pdf)}`,
    taille: pdf.length,
  };
}
