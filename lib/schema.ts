import { z } from "zod";

/**
 * Single, versioned data dictionary for the Lifestage Benefits Optimization
 * proof-of-concept (PWS 2.3.2, Data Governance). Every entry point —
 * direct claimant input, AI-assisted extraction, and third-party
 * submission — validates against these same schemas before persistence.
 */
export const SCHEMA_VERSION = "1.0.0";

export const VeteranInfoSchema = z.object({
  firstName: z.string().min(1, "Veteran's first name is required"),
  lastName: z.string().min(1, "Veteran's last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  dateOfDeath: z.string().optional(),
  branchOfService: z.string().min(1, "Branch of service is required"),
});
export type VeteranInfo = z.infer<typeof VeteranInfoSchema>;

export const ClaimantInfoSchema = z.object({
  firstName: z.string().min(1, "Claimant's first name is required"),
  lastName: z.string().min(1, "Claimant's last name is required"),
  relationshipToVeteran: z.enum([
    "spouse",
    "surviving_spouse",
    "child",
    "parent",
    "other",
  ]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  ssnLast4: z
    .string()
    .regex(/^\d{4}$/, "Enter the last 4 digits of the SSN")
    .optional()
    .or(z.literal("")),
});
export type ClaimantInfo = z.infer<typeof ClaimantInfoSchema>;

export const DependentSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  relationship: z.enum(["spouse", "child", "stepchild", "other"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  hasSsn: z.boolean(),
  ssn: z.string().optional(),
});
export type Dependent = z.infer<typeof DependentSchema>;

export const AidAttendanceSchema = z.object({
  needsAidAndAttendance: z.boolean(),
  details: z.string().optional(),
});
export type AidAttendance = z.infer<typeof AidAttendanceSchema>;

export const EvidenceDocumentSchema = z.object({
  id: z.string(),
  documentType: z.enum([
    "marriage_certificate",
    "death_certificate",
    "birth_certificate",
    "financial_statement",
    "other",
  ]),
  fileName: z.string(),
  uploadedAt: z.string(),
});
export type EvidenceDocument = z.infer<typeof EvidenceDocumentSchema>;

export const ExtractedFieldSchema = z.object({
  field: z.string(),
  label: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  status: z.enum(["accepted", "needs_review", "corrected"]),
});
export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;

export const EvidenceExtractionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentType: EvidenceDocumentSchema.shape.documentType,
  fields: z.array(ExtractedFieldSchema),
  createdAt: z.string(),
});
export type EvidenceExtraction = z.infer<typeof EvidenceExtractionSchema>;

export const ThirdPartyRequestStatusSchema = z.enum([
  "sent",
  "opened",
  "completed",
]);

export const ThirdPartyRequestSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  token: z.string(),
  formType: z.literal("21-2680"),
  status: ThirdPartyRequestStatusSchema,
  physicianName: z.string().optional(),
  clinicalFindings: z.string().optional(),
  signature: z.string().optional(),
  createdAt: z.string(),
  expiresAt: z.string(),
  completedAt: z.string().optional(),
});
export type ThirdPartyRequest = z.infer<typeof ThirdPartyRequestSchema>;

export const SubmissionStatusSchema = z.enum([
  "draft",
  "pending_third_party",
  "submitted",
]);

export const SubmissionSchema = z.object({
  id: z.string(),
  status: SubmissionStatusSchema,
  veteran: VeteranInfoSchema.partial(),
  claimant: ClaimantInfoSchema.partial(),
  dependents: z.array(DependentSchema),
  aidAttendance: AidAttendanceSchema.partial(),
  evidence: z.array(EvidenceDocumentSchema),
  extractions: z.array(EvidenceExtractionSchema),
  thirdPartyRequestId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

/** Payload validated when a claimant creates or updates a draft submission. */
export const SubmissionInputSchema = z.object({
  veteran: VeteranInfoSchema.partial().optional(),
  claimant: ClaimantInfoSchema.partial().optional(),
  dependents: z.array(DependentSchema).optional(),
  aidAttendance: AidAttendanceSchema.partial().optional(),
  evidence: z.array(EvidenceDocumentSchema).optional(),
  extractions: z.array(EvidenceExtractionSchema).optional(),
  status: SubmissionStatusSchema.optional(),
});
export type SubmissionInput = z.infer<typeof SubmissionInputSchema>;

export const TraceStepSchema = z.enum([
  "intake",
  "extraction",
  "routing",
  "validation",
  "submission",
]);
export type TraceStep = z.infer<typeof TraceStepSchema>;

export const TraceEventSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  step: TraceStepSchema,
  message: z.string(),
  createdAt: z.string(),
});
export type TraceEvent = z.infer<typeof TraceEventSchema>;

/** The full data dictionary, published for downstream and cross-team reuse. */
export const DataDictionary = {
  version: SCHEMA_VERSION,
  schemas: {
    VeteranInfo: VeteranInfoSchema,
    ClaimantInfo: ClaimantInfoSchema,
    Dependent: DependentSchema,
    AidAttendance: AidAttendanceSchema,
    EvidenceDocument: EvidenceDocumentSchema,
    EvidenceExtraction: EvidenceExtractionSchema,
    ThirdPartyRequest: ThirdPartyRequestSchema,
    Submission: SubmissionSchema,
    TraceEvent: TraceEventSchema,
  },
} as const;

export function buildDataDictionaryJsonSchema() {
  const out: Record<string, unknown> = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Lifestage Benefits Optimization Data Dictionary",
    version: SCHEMA_VERSION,
    definitions: {},
  };
  const definitions: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(DataDictionary.schemas)) {
    definitions[name] = z.toJSONSchema(schema, { target: "draft-2020-12" });
  }
  out.definitions = definitions;
  return out;
}
