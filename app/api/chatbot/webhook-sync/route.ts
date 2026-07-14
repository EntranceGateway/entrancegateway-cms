import { NextRequest, NextResponse } from 'next/server';

const CHATBOT_API_BASE_URL = process.env.CHATBOT_API_BASE_URL || 'http://localhost:8002/api/v1';
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY;

const SUPPORTED_SOURCE_TYPES = new Set([
  'course',
  'college',
  'syllabus',
  'note',
  'old_question',
  'training',
  'question_set',
  'question',
]);

interface WebhookSyncBody {
  source_type?: string;
  source_ids?: string[];
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

  let body: WebhookSyncBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
  }

  const sourceType = body.source_type;
  if (!sourceType || !SUPPORTED_SOURCE_TYPES.has(sourceType)) {
    return NextResponse.json(
      { message: 'source_type must be a supported chatbot source type' },
      { status: 400 }
    );
  }

  const sourceIds = Array.isArray(body.source_ids) && body.source_ids.length > 0
    ? body.source_ids
    : [`dashboard-refresh:${sourceType}`];

  const payload = {
    event_id: `cms-dashboard-${sourceType}-${crypto.randomUUID()}`,
    event_type: 'refresh',
    source_type: sourceType,
    source_ids: sourceIds,
    occurred_at: new Date().toISOString(),
  };

  try {
    const baseUrl = CHATBOT_API_BASE_URL.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/webhooks/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CHATBOT_API_KEY,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const responseText = await response.text();
    let responseBody: unknown = null;
    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { message: responseText };
      }
    }

    return NextResponse.json(
      {
        success: response.ok,
        request: payload,
        response: responseBody,
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Failed to call chatbot webhook sync endpoint',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
