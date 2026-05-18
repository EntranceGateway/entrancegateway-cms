import { apiClient } from '@/lib/api/apiClient';
import type {
  AdminPaymentRequest,
  AdminPurchaseModuleType,
  PaymentResponse,
  PurchaseMutationResult,
  PurchaseStatisticsResponse,
  PurchaseView,
  QuizPurchase,
  QuizPurchaseListResponse,
  QuizPurchaseQueryParams,
} from '@/types/purchase.types';
import type { ApiError } from '@/types/api.types';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const apiError = error as Partial<ApiError>;

    if (apiError.status === 403) return 'You do not have permission to perform this action';
    if (apiError.status === 404) return 'Requested purchase was not found';
    if (apiError.status === 409) return 'This purchase cannot be changed in its current state';

    return apiError.message || fallback;
  }

  return fallback;
}

type PurchaseListResult = {
  purchases: QuizPurchase[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLast: boolean;
  error?: string;
};

class PurchaseService {
  private readonly adminEndpoint = '/admin/purchases';
  private readonly paymentEndpoint = '/payments/admin';

  private buildQueryString(params: Record<string, string | number | undefined>): string {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private normalizePageResponse(
    data: QuizPurchaseListResponse | null | undefined,
    params: QuizPurchaseQueryParams,
  ): PurchaseListResult {
    if (!data) {
      return {
        purchases: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: params.size || 10,
        isLast: true,
        error: 'Invalid response format from server',
      };
    }

    return {
      purchases: data.content || [],
      totalElements: data.totalElements || 0,
      totalPages: data.totalPages || 0,
      currentPage: data.pageNumber ?? params.page ?? 0,
      pageSize: data.pageSize ?? params.size ?? 10,
      isLast: data.isLast ?? true,
    };
  }

  private getListEndpoint(params: QuizPurchaseQueryParams): string {
    if (params.view === 'PENDING') return `${this.adminEndpoint}/pending`;
    if (params.view === 'QUIZ') return `${this.adminEndpoint}/quizzes`;
    if (params.view === 'TRAINING') return `${this.adminEndpoint}/training`;
    if (params.view === 'SUBSCRIPTION') return `${this.adminEndpoint}/subscriptions`;
    return this.adminEndpoint;
  }

  private getListQuery(params: QuizPurchaseQueryParams): Record<string, string | number | undefined> {
    const base = {
      page: params.page,
      size: params.size,
      sortDir: params.sortDir,
    };

    if (params.view === 'PENDING') {
      return { ...base, moduleType: params.moduleType };
    }

    if (params.view === 'QUIZ') {
      return { ...base, status: params.status, quizId: params.quizId };
    }

    if (params.view === 'TRAINING') {
      return { ...base, status: params.status, trainingId: params.trainingId };
    }

    if (params.view === 'SUBSCRIPTION') {
      return {
        ...base,
        status: params.status,
        plan: params.plan,
        entranceTypeSlug: params.entranceTypeSlug,
      };
    }

    return {
      ...base,
      userId: params.userId,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      sortBy: params.sortBy,
    };
  }

  async getPurchases(params: QuizPurchaseQueryParams = {}): Promise<PurchaseListResult> {
    try {
      const endpoint = this.getListEndpoint(params);
      const queryString = this.buildQueryString(this.getListQuery(params));
      const response = await apiClient.get<QuizPurchaseListResponse>(`${endpoint}${queryString}`);

      return this.normalizePageResponse(response?.data, params);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch admin purchases:', error);
      }

      return {
        purchases: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: params.size || 10,
        isLast: true,
        error: extractErrorMessage(error, 'Failed to load purchases'),
      };
    }
  }

  async getQuizPurchases(params: QuizPurchaseQueryParams = {}): Promise<PurchaseListResult> {
    return this.getPurchases({ ...params, view: params.view || 'QUIZ' });
  }

  async getPurchasesByModuleType(
    moduleType: AdminPurchaseModuleType,
    params: Pick<QuizPurchaseQueryParams, 'status' | 'page' | 'size'> = {},
  ): Promise<PurchaseListResult> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await apiClient.get<QuizPurchaseListResponse>(
        `${this.adminEndpoint}/type/${moduleType}${queryString}`,
      );

      return this.normalizePageResponse(response?.data, params);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Failed to fetch ${moduleType} purchases:`, error);
      }

      return {
        purchases: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: params.size || 10,
        isLast: true,
        error: extractErrorMessage(error, `Failed to load ${moduleType.toLowerCase()} purchases`),
      };
    }
  }

  async getPurchaseStatistics(params: Pick<QuizPurchaseQueryParams, 'startDate' | 'endDate'> = {}): Promise<{
    data?: PurchaseStatisticsResponse;
    error?: string;
  }> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await apiClient.get<PurchaseStatisticsResponse>(
        `${this.adminEndpoint}/statistics${queryString}`,
      );

      return { data: response.data ?? undefined };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch purchase statistics:', error);
      }

      return { error: extractErrorMessage(error, 'Failed to load purchase statistics') };
    }
  }

  async approvePurchase(purchaseId: number): Promise<PurchaseMutationResult> {
    try {
      const response = await apiClient.post<QuizPurchase>(
        `${this.adminEndpoint}/${purchaseId}/approve`,
      );

      return { success: true, data: response.data ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: extractErrorMessage(error, 'Failed to approve purchase'),
      };
    }
  }

  async rejectPurchase(purchaseId: number, reason?: string): Promise<PurchaseMutationResult> {
    try {
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const response = await apiClient.post<QuizPurchase>(
        `${this.adminEndpoint}/${purchaseId}/reject${query}`,
      );

      return { success: true, data: response.data ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: extractErrorMessage(error, 'Failed to reject purchase'),
      };
    }
  }

  async processAdminPayment(
    id: string,
    type: string,
    payload: AdminPaymentRequest,
  ): Promise<PurchaseMutationResult> {
    try {
      const response = await apiClient.post<PaymentResponse>(
        `${this.paymentEndpoint}/pay/${encodeURIComponent(id)}/${type}`,
        payload,
      );

      return { success: true, data: response.data ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: extractErrorMessage(error, 'Failed to process admin payment'),
      };
    }
  }

  async approveManualPayment(purchaseId: number): Promise<PurchaseMutationResult> {
    return this.approvePurchase(purchaseId);
  }

  async rejectManualPayment(purchaseId: number, reason?: string): Promise<PurchaseMutationResult> {
    return this.rejectPurchase(purchaseId, reason);
  }
}

export const purchaseService = new PurchaseService();
