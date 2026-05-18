import { apiClient } from '@/lib/api/apiClient';
import type {
  AdminPaymentRequest,
  ModuleType,
  PaymentResponse,
  PurchaseMutationResult,
  QuizPurchase,
  QuizPurchaseListResponse,
  QuizPurchaseQueryParams,
} from '@/types/purchase.types';
import type { ApiError } from '@/types/api.types';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const apiError = error as Partial<ApiError>;

    if (apiError.status === 403) return 'You do not have permission to perform this action';
    if (apiError.status === 404) return 'Requested purchase or payment was not found';
    if (apiError.status === 409) return 'This item cannot be changed in its current state';

    return apiError.message || fallback;
  }

  return fallback;
}

class PurchaseService {
  private readonly purchaseEndpoint = '/purchases/admin/quizzes';
  private readonly paymentEndpoint = '/payments/admin';

  private buildQueryString(params: QuizPurchaseQueryParams): string {
    const queryParams = new URLSearchParams();

    if (params.userId !== undefined) queryParams.append('userId', params.userId.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  async getQuizPurchases(params: QuizPurchaseQueryParams = {}): Promise<{
    purchases: QuizPurchase[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    isLast: boolean;
    error?: string;
  }> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await apiClient.get<QuizPurchaseListResponse>(
        `${this.purchaseEndpoint}${queryString}`,
      );

      if (!response?.data) {
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

      const { content, totalElements, totalPages, currentPage, size } = response.data;
      const page = currentPage ?? params.page ?? 0;
      const pageSize = size ?? params.size ?? 10;

      return {
        purchases: content || [],
        totalElements: totalElements || 0,
        totalPages: totalPages || 0,
        currentPage: page,
        pageSize,
        isLast: totalPages ? page >= totalPages - 1 : true,
      };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch quiz purchases:', error);
      }

      return {
        purchases: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: params.size || 10,
        isLast: true,
        error: extractErrorMessage(error, 'Failed to load quiz purchases'),
      };
    }
  }

  async approvePurchase(purchaseId: number): Promise<PurchaseMutationResult> {
    try {
      const response = await apiClient.patch<QuizPurchase>(
        `${this.purchaseEndpoint}/${purchaseId}/approve`,
      );

      return { success: true, data: response.data ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: extractErrorMessage(error, 'Failed to approve purchase'),
      };
    }
  }

  async rejectPurchase(purchaseId: number): Promise<PurchaseMutationResult> {
    try {
      const response = await apiClient.patch<QuizPurchase>(
        `${this.purchaseEndpoint}/${purchaseId}/reject`,
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
    type: ModuleType,
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
    try {
      const response = await apiClient.post<QuizPurchase>(
        `${this.paymentEndpoint}/approve/${purchaseId}`,
      );

      return { success: true, data: response.data ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: extractErrorMessage(error, 'Failed to approve manual payment'),
      };
    }
  }

  async rejectManualPayment(
    purchaseId: number,
    reason?: string,
  ): Promise<PurchaseMutationResult> {
    try {
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const response = await apiClient.post<QuizPurchase>(
        `${this.paymentEndpoint}/reject/${purchaseId}${query}`,
      );

      return { success: true, data: response.data ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: extractErrorMessage(error, 'Failed to reject manual payment'),
      };
    }
  }
}

export const purchaseService = new PurchaseService();
