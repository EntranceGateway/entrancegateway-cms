import { NextRequest, NextResponse } from 'next/server';

const CHATBOT_API_BASE_URL = process.env.CHATBOT_API_BASE_URL || 'http://localhost:8002/api/v1';
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY;

// A full sync re-fetches and re-embeds every source type. Each chunk is one
// Ollama embedding call on a 4 vCPU VPS, so this legitimately runs for minutes.
const REFRESH_TIMEOUT_MS = 15 * 60 * 1000;

// Allow the route itself to run long enough for the upstream call to finish.
export const maxDuration = 900;

interface IngestionReport {
  fetched_count?: number;
  normalized_count?: number;
  chunk_count?: number;
  embedded_count?: number;
  upserted_count?: number;
  skipped_count?: number;
  errors?: Array<{ source_type: string; error: string }>;
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  if (!CHATBOT_API_KEY) {
    return NextResponse.json(
      { message: 'CHATBOT_API_KEY is not configured in the CMS environment' },
      { status: 500 }
    );
  }

  const baseUrl = CHATBOT_API_BASE_URL.replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/admin/refresh`, {
      method: 'POST',
      headers: { 'X-API-Key': CHATBOT_API_KEY },
      cache: 'no-store',
      signal: controller.signal,
    });

    const responseText = await response.text();
    let body: { success?: boolean; report?: IngestionReport } | null = null;
    try {
      body = responseText ? JSON.parse(responseText) : null;
    } catch {
      return NextResponse.json(
        { message: 'Chatbot returned a non-JSON response', raw: responseText.slice(0, 500) },
        { status: 502 }
      );
    }

    const report = body?.report ?? {};
    const errors = report.errors ?? [];

    // The chatbot returns HTTP 200 with success:false when individual source
    // types fail (for example an expired backend JWT). Treat that as a failure
    // here so it cannot pass silently, which is how the knowledge base drifted
    // out of date previously.
    const succeeded = response.ok && body?.success !== false && errors.length === 0;

    return NextResponse.json(
      {
        success: succeeded,
        summary: {
          fetched: report.fetched_count ?? 0,
          chunks: report.chunk_count ?? 0,
          upserted: report.upserted_count ?? 0,
          skipped: report.skipped_count ?? 0,
          failedSources: errors.length,
        },
        errors,
        report,
      },
      { status: succeeded ? 200 : 502 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // The upstream ingestion keeps running server-side after we stop waiting,
      // so this must not read as "nothing happened".
      return NextResponse.json(
        {
          message:
            'Still running on the chatbot after 15 minutes. Ingestion continues in the background - check chatbot stats shortly rather than retrying.',
          timedOut: true,
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        message: 'Failed to reach the chatbot admin refresh endpoint',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
