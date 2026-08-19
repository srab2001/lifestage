import { randomUUID } from "crypto";
import { INIT_STATEMENTS } from "./db-schema.mjs";
import type {
  Submission,
  SubmissionInput,
  ThirdPartyRequest,
  TraceEvent,
  TraceStep,
} from "./schema";

export interface Metrics {
  totalSubmissions: number;
  completeSubmissions: number;
  pendingThirdParty: number;
  dependentsTracked: number;
  avgExtractionConfidence: number | null;
  thirdPartyCompletionRate: number | null;
  totalTraceEvents: number;
}

export interface Store {
  createSubmission(input: SubmissionInput): Promise<Submission>;
  getSubmission(id: string): Promise<Submission | undefined>;
  updateSubmission(
    id: string,
    patch: SubmissionInput,
  ): Promise<Submission | undefined>;
  listSubmissions(): Promise<Submission[]>;
  createThirdPartyRequest(
    submissionId: string,
    formType: "21-2680",
  ): Promise<ThirdPartyRequest>;
  getThirdPartyRequestByToken(
    token: string,
  ): Promise<ThirdPartyRequest | undefined>;
  markThirdPartyOpened(token: string): Promise<ThirdPartyRequest | undefined>;
  completeThirdPartyRequest(
    token: string,
    data: { physicianName: string; clinicalFindings: string; signature: string },
  ): Promise<ThirdPartyRequest | undefined>;
  addTraceEvent(
    submissionId: string,
    step: TraceStep,
    message: string,
  ): Promise<TraceEvent>;
  listTraceEvents(submissionId?: string): Promise<TraceEvent[]>;
  getMetrics(): Promise<Metrics>;
}

const THIRD_PARTY_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function nowIso() {
  return new Date().toISOString();
}

function emptySubmission(id: string): Submission {
  const timestamp = nowIso();
  return {
    id,
    status: "draft",
    veteran: {},
    claimant: {},
    dependents: [],
    aidAttendance: {},
    evidence: [],
    extractions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function mergeSubmission(
  existing: Submission,
  patch: SubmissionInput,
): Submission {
  return {
    ...existing,
    veteran: { ...existing.veteran, ...(patch.veteran ?? {}) },
    claimant: { ...existing.claimant, ...(patch.claimant ?? {}) },
    dependents: patch.dependents ?? existing.dependents,
    aidAttendance: {
      ...existing.aidAttendance,
      ...(patch.aidAttendance ?? {}),
    },
    evidence: patch.evidence ?? existing.evidence,
    extractions: patch.extractions ?? existing.extractions,
    status: patch.status ?? existing.status,
    updatedAt: nowIso(),
  };
}

function computeMetrics(
  submissions: Submission[],
  thirdParty: ThirdPartyRequest[],
  traceEvents: TraceEvent[],
): Metrics {
  const confidences = submissions.flatMap((s) =>
    s.extractions.flatMap((e) => e.fields.map((f) => f.confidence)),
  );
  const avgExtractionConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : null;
  const completedThirdParty = thirdParty.filter(
    (t) => t.status === "completed",
  ).length;
  return {
    totalSubmissions: submissions.length,
    completeSubmissions: submissions.filter((s) => s.status === "submitted")
      .length,
    pendingThirdParty: thirdParty.filter((t) => t.status !== "completed")
      .length,
    dependentsTracked: submissions.reduce(
      (sum, s) => sum + s.dependents.length,
      0,
    ),
    avgExtractionConfidence,
    thirdPartyCompletionRate: thirdParty.length
      ? completedThirdParty / thirdParty.length
      : null,
    totalTraceEvents: traceEvents.length,
  };
}

class InMemoryStore implements Store {
  submissions = new Map<string, Submission>();
  thirdPartyByToken = new Map<string, ThirdPartyRequest>();
  traceEvents: TraceEvent[] = [];

  async createSubmission(input: SubmissionInput): Promise<Submission> {
    const id = randomUUID();
    const submission = mergeSubmission(emptySubmission(id), input);
    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmission(id: string) {
    return this.submissions.get(id);
  }

  async updateSubmission(id: string, patch: SubmissionInput) {
    const existing = this.submissions.get(id);
    if (!existing) return undefined;
    const updated = mergeSubmission(existing, patch);
    this.submissions.set(id, updated);
    return updated;
  }

  async listSubmissions() {
    return Array.from(this.submissions.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createThirdPartyRequest(submissionId: string, formType: "21-2680") {
    const request: ThirdPartyRequest = {
      id: randomUUID(),
      submissionId,
      token: randomUUID().replace(/-/g, ""),
      formType,
      status: "sent",
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + THIRD_PARTY_TOKEN_TTL_MS).toISOString(),
    };
    this.thirdPartyByToken.set(request.token, request);
    const submission = this.submissions.get(submissionId);
    if (submission) {
      submission.thirdPartyRequestId = request.id;
      submission.status = "pending_third_party";
      submission.updatedAt = nowIso();
    }
    return request;
  }

  async getThirdPartyRequestByToken(token: string) {
    return this.thirdPartyByToken.get(token);
  }

  async markThirdPartyOpened(token: string) {
    const request = this.thirdPartyByToken.get(token);
    if (!request || request.status !== "sent") return request;
    request.status = "opened";
    return request;
  }

  async completeThirdPartyRequest(
    token: string,
    data: { physicianName: string; clinicalFindings: string; signature: string },
  ) {
    const request = this.thirdPartyByToken.get(token);
    if (!request) return undefined;
    request.status = "completed";
    request.physicianName = data.physicianName;
    request.clinicalFindings = data.clinicalFindings;
    request.signature = data.signature;
    request.completedAt = nowIso();
    return request;
  }

  async addTraceEvent(submissionId: string, step: TraceStep, message: string) {
    const event: TraceEvent = {
      id: randomUUID(),
      submissionId,
      step,
      message,
      createdAt: nowIso(),
    };
    this.traceEvents.push(event);
    return event;
  }

  async listTraceEvents(submissionId?: string) {
    const events = submissionId
      ? this.traceEvents.filter((e) => e.submissionId === submissionId)
      : this.traceEvents;
    return [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getMetrics() {
    return computeMetrics(
      Array.from(this.submissions.values()),
      Array.from(this.thirdPartyByToken.values()),
      this.traceEvents,
    );
  }
}

class PostgresStore implements Store {
  private schemaReady: Promise<unknown>;

  constructor(private pool: import("pg").Pool) {
    // Lazily, idempotently ensure tables exist before the first query on a
    // fresh Neon branch — `npm run db:init` remains available for manual/CI
    // use, but production should never 500 just because that step was
    // skipped ("nothing fails silently" — see design doc Section 2.1).
    this.schemaReady = Promise.all(
      INIT_STATEMENTS.map((statement) => this.pool.query(statement)),
    );
  }

  private async query(text: string, params?: unknown[]) {
    await this.schemaReady;
    return this.pool.query(text, params);
  }

  async createSubmission(input: SubmissionInput): Promise<Submission> {
    const submission = mergeSubmission(emptySubmission(randomUUID()), input);
    await this.query(
      `insert into submissions (id, data, created_at, updated_at) values ($1, $2, $3, $4)`,
      [submission.id, submission, submission.createdAt, submission.updatedAt],
    );
    return submission;
  }

  async getSubmission(id: string) {
    const { rows } = await this.query(
      `select data from submissions where id = $1`,
      [id],
    );
    return rows[0]?.data as Submission | undefined;
  }

  async updateSubmission(id: string, patch: SubmissionInput) {
    const existing = await this.getSubmission(id);
    if (!existing) return undefined;
    const updated = mergeSubmission(existing, patch);
    await this.query(
      `update submissions set data = $2, updated_at = $3 where id = $1`,
      [id, updated, updated.updatedAt],
    );
    return updated;
  }

  async listSubmissions() {
    const { rows } = await this.query(
      `select data from submissions order by created_at desc`,
    );
    return rows.map((r) => r.data as Submission);
  }

  async createThirdPartyRequest(submissionId: string, formType: "21-2680") {
    const request: ThirdPartyRequest = {
      id: randomUUID(),
      submissionId,
      token: randomUUID().replace(/-/g, ""),
      formType,
      status: "sent",
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + THIRD_PARTY_TOKEN_TTL_MS).toISOString(),
    };
    await this.query(
      `insert into third_party_requests (id, token, submission_id, data) values ($1, $2, $3, $4)`,
      [request.id, request.token, submissionId, request],
    );
    await this.updateSubmission(submissionId, {
      status: "pending_third_party",
    });
    await this.query(
      `update submissions set data = jsonb_set(data, '{thirdPartyRequestId}', to_jsonb($2::text)) where id = $1`,
      [submissionId, request.id],
    );
    return request;
  }

  async getThirdPartyRequestByToken(token: string) {
    const { rows } = await this.query(
      `select data from third_party_requests where token = $1`,
      [token],
    );
    return rows[0]?.data as ThirdPartyRequest | undefined;
  }

  async markThirdPartyOpened(token: string) {
    const request = await this.getThirdPartyRequestByToken(token);
    if (!request || request.status !== "sent") return request;
    const updated: ThirdPartyRequest = { ...request, status: "opened" };
    await this.query(
      `update third_party_requests set data = $2 where token = $1`,
      [token, updated],
    );
    return updated;
  }

  async completeThirdPartyRequest(
    token: string,
    data: { physicianName: string; clinicalFindings: string; signature: string },
  ) {
    const request = await this.getThirdPartyRequestByToken(token);
    if (!request) return undefined;
    const updated: ThirdPartyRequest = {
      ...request,
      ...data,
      status: "completed",
      completedAt: nowIso(),
    };
    await this.query(
      `update third_party_requests set data = $2 where token = $1`,
      [token, updated],
    );
    return updated;
  }

  async addTraceEvent(submissionId: string, step: TraceStep, message: string) {
    const event: TraceEvent = {
      id: randomUUID(),
      submissionId,
      step,
      message,
      createdAt: nowIso(),
    };
    await this.query(
      `insert into trace_events (id, submission_id, step, message, created_at) values ($1, $2, $3, $4, $5)`,
      [event.id, event.submissionId, event.step, event.message, event.createdAt],
    );
    return event;
  }

  async listTraceEvents(submissionId?: string) {
    const { rows } = submissionId
      ? await this.query(
          `select id, submission_id as "submissionId", step, message, created_at as "createdAt" from trace_events where submission_id = $1 order by created_at desc`,
          [submissionId],
        )
      : await this.query(
          `select id, submission_id as "submissionId", step, message, created_at as "createdAt" from trace_events order by created_at desc`,
        );
    return rows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString(),
    })) as TraceEvent[];
  }

  async getMetrics() {
    const [submissions, thirdParty, traceEvents] = await Promise.all([
      this.listSubmissions(),
      this.query(`select data from third_party_requests`).then((r) =>
        r.rows.map((row) => row.data as ThirdPartyRequest),
      ),
      this.listTraceEvents(),
    ]);
    return computeMetrics(submissions, thirdParty, traceEvents);
  }
}

declare global {
  var __lifestageStore: Store | undefined;
}

function createStore(): Store {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new InMemoryStore();
  }
  // Lazy require so `pg` is only touched when a DATABASE_URL is configured.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg") as typeof import("pg");
  const pool = new Pool({ connectionString: databaseUrl });
  return new PostgresStore(pool);
}

export function getStore(): Store {
  if (!globalThis.__lifestageStore) {
    globalThis.__lifestageStore = createStore();
  }
  return globalThis.__lifestageStore;
}
