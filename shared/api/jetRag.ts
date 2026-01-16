import axios from "axios";

export interface JetRagRequest {
  query: string;
}

export interface JetContext {
  id: string;
  score: number;
  text_preview: string;
  metadata: Record<string, unknown>;
}

export interface JetRagResponse {
  answer: string;
  contexts: JetContext[];
}

const JET_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL;

export async function jetQuery(body: JetRagRequest): Promise<JetRagResponse> {
  const url = `${JET_BACKEND_URL}/jet/query`;
  const res = await axios.post<JetRagResponse>(url, {
    query: body.query,
  });
  return res.data;
}


