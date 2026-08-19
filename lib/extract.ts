import type { EvidenceDocument, ExtractedField } from "./schema";

/**
 * Deterministic mock standing in for CAVE-style AI/OCR extraction
 * (see Section 7 of the design doc — this is intentionally not real
 * OCR/ML). Confidence varies by field so the review-and-correct UI has
 * something realistic to react to.
 */
export function mockExtractFields(
  documentType: EvidenceDocument["documentType"],
): ExtractedField[] {
  const byType: Record<EvidenceDocument["documentType"], ExtractedField[]> = {
    marriage_certificate: [
      field("spouseFirstName", "Spouse first name", "Maria", 0.97),
      field("spouseLastName", "Spouse last name", "Alvarez", 0.95),
      field("marriageDate", "Date of marriage", "06/14/2003", 0.91),
      field("marriageLocation", "Place of marriage", "Austin, TX", 0.68),
    ],
    death_certificate: [
      field("decedentName", "Decedent name", "Robert J. Alvarez", 0.94),
      field("dateOfDeath", "Date of death", "03/02/2026", 0.98),
      field("causeOfDeath", "Cause of death", "Cardiac arrest", 0.57),
      field("placeOfDeath", "Place of death", "Travis County, TX", 0.82),
    ],
    birth_certificate: [
      field("childFirstName", "Child first name", "Elena", 0.96),
      field("childLastName", "Child last name", "Alvarez", 0.96),
      field("dateOfBirth", "Date of birth", "09/21/2015", 0.93),
      field("parentNames", "Parent(s) listed", "Robert & Maria Alvarez", 0.74),
    ],
    financial_statement: [
      field("accountHolder", "Account holder", "Maria Alvarez", 0.9),
      field("monthlyIncome", "Monthly income", "$2,140.00", 0.62),
      field("statementDate", "Statement date", "07/01/2026", 0.89),
    ],
    other: [
      field("documentTitle", "Document title", "Supporting evidence", 0.55),
    ],
  };
  return byType[documentType];
}

function field(
  fieldName: string,
  label: string,
  value: string,
  confidence: number,
): ExtractedField {
  return {
    field: fieldName,
    label,
    value,
    confidence,
    status: confidence >= 0.85 ? "accepted" : "needs_review",
  };
}
