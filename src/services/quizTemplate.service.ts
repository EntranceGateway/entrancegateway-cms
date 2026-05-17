import type { ApiError } from '@/types/api.types';
import { apiClient } from '@/lib/api/apiClient';
import type {
  CreateQuizTemplateRequest,
  QuizTemplateMutationResponse,
  PaginatedQueryParams,
} from '@/types/quiz.types';

interface ServiceResult {
  success: boolean;
  data?: QuizTemplateMutationResponse;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface PaginatedListResult {
  content: QuizTemplateMutationResponse[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

/**
 * Safely extract message and field errors from an unknown caught value.
 * Avoids unsafe `error as ApiError` assertion.
 */
function extractApiError(error: unknown, fallback: string): {
  message: string;
  errors?: Record<string, string>;
} {
  if (error !== null && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    return {
      message: typeof obj.message === 'string' ? obj.message : fallback,
      errors:
        obj.errors && typeof obj.errors === 'object'
          ? (obj.errors as Record<string, string>)
          : undefined,
    };
  }

  return { message: fallback };
}

class QuizTemplateService {
  private readonly endpoint = '/quiz-templates';

  private buildQueryString(params: PaginatedQueryParams): string {
    const qp = new URLSearchParams();
    if (params.page !== undefined) qp.append('page', params.page.toString());
    if (params.size !== undefined) qp.append('size', params.size.toString());
    if (params.sortBy) qp.append('sortBy', params.sortBy);
    if (params.sortDir) qp.append('sortDir', params.sortDir);
    const qs = qp.toString();
    return qs ? `?${qs}` : '';
  }

  async getQuizTemplates(
    params: PaginatedQueryParams = {}
  ): Promise<{
    success: boolean;
    data?: PaginatedListResult;
    error?: string;
  }> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await apiClient.get<PaginatedListResult>(
        `${this.endpoint}/admin${queryString}`
      );

      if (!response?.data) {
        return { success: false, error: 'Invalid response from server' };
      }

      return { success: true, data: response.data };
    } catch (error: unknown) {
      const extracted = extractApiError(error, 'Failed to fetch quiz templates');
      return { success: false, error: extracted.message };
    }
  }

  async getQuizTemplateById(templateId: string): Promise<ServiceResult> {
    try {
      const response = await apiClient.get<QuizTemplateMutationResponse>(
        `${this.endpoint}/${templateId}`
      );

      if (!response?.data) {
        return { success: false, error: 'Invalid response from server' };
      }

      return { success: true, data: response.data };
    } catch (error: unknown) {
      const extracted = extractApiError(error, 'Failed to fetch quiz template');
      return {
        success: false,
        error: extracted.message,
        fieldErrors: extracted.errors,
      };
    }
  }

  async createQuizTemplate(payload: CreateQuizTemplateRequest): Promise<ServiceResult> {
    try {
      const response = await apiClient.post<QuizTemplateMutationResponse>(this.endpoint, payload);

      if (!response?.data) {
        return { success: false, error: 'Invalid response from server' };
      }

      return { success: true, data: response.data };
    } catch (error: unknown) {
      const extracted = extractApiError(error, 'Failed to create quiz template');
      return {
        success: false,
        error: extracted.message,
        fieldErrors: extracted.errors,
      };
    }
  }

  async updateQuizTemplate(
    templateId: string,
    payload: CreateQuizTemplateRequest
  ): Promise<ServiceResult> {
    try {
      const response = await apiClient.put<QuizTemplateMutationResponse>(
        `${this.endpoint}/${templateId}`,
        payload
      );

      if (!response?.data) {
        return { success: false, error: 'Invalid response from server' };
      }

      return { success: true, data: response.data };
    } catch (error: unknown) {
      const extracted = extractApiError(error, 'Failed to update quiz template');
      return {
        success: false,
        error: extracted.message,
        fieldErrors: extracted.errors,
      };
    }
  }

  async deleteQuizTemplate(templateId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await apiClient.delete(`${this.endpoint}/${templateId}`);
      return { success: true };
    } catch (error: unknown) {
      const extracted = extractApiError(error, 'Failed to archive quiz template');
      return { success: false, error: extracted.message };
    }
  }
}

export const quizTemplateService = new QuizTemplateService();
