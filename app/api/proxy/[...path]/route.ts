import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.entrancegateway.com';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/');
    
    // Preserve query parameters from the original request
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    // Add /api/v1/ prefix only for quiz-related endpoints
    const quizEndpoints = [
      'auth',
      'categories',
      'courses', 
      'entrance-types',
      'purchases',
      'question-sets',
      'questions',
      'quiz-attempts',
      'quiz-templates',
      'topics',
      'dashboard'
    ];
    
    const needsV1Prefix = quizEndpoints.some(endpoint => 
      path === endpoint || 
      path.startsWith(`${endpoint}/`) || 
      path.includes(`/${endpoint}`) ||
      path.includes(`/${endpoint}/`)
    );
    const apiPath = needsV1Prefix ? `/api/v1/${path}` : `/${path}`;
    const url = `${API_BASE_URL}${apiPath}${queryString}`;
    
    const headers: Record<string, string> = {};
    
    // Forward relevant headers
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType;
    }

    // Get request body for POST, PUT, PATCH
    let body: string | FormData | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      // Check if it's multipart/form-data
      if (contentType?.includes('multipart/form-data')) {
        try {
          body = await request.formData();
        } catch {
          // No body or invalid form data
        }
      } else {
        try {
          const requestBody = await request.json();
          body = JSON.stringify(requestBody);
        } catch {
          // No body or invalid JSON
        }
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    // Check if response is JSON
    const responseContentType = response.headers.get('content-type');
    const isJson = responseContentType?.includes('application/json');

    let data;
    if (isJson) {
      data = await response.json();
    } else {
      // Handle non-JSON responses (like plain text error messages)
      const text = await response.text();
      data = {
        message: text,
        error: text,
      };
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    
    return NextResponse.json(
      {
        message: 'Proxy request failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
