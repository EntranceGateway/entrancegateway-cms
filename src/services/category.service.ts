import { apiClient } from '@/lib/api/apiClient';
import type {
    CategoryApiResponse,
    CategoryBatchResult,
    CategoryFormData,
    PaginatedQueryParams,
} from '@/types/quiz.types';
import type { ApiError } from '@/types/api.types';

/**
 * Safely extract an error message from an unknown caught value.
 */
function extractErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
        const err = error as Partial<ApiError>;
        return err.message || fallback;
    }
    return fallback;
}

type CategoryRequestPayload = {
    categoryName: string;
    remarks?: string;
    entranceTypeId: number;
};

class CategoryService {
    private readonly endpoint = '/categories';

    private buildQueryString(params: PaginatedQueryParams): string {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        const qs = queryParams.toString();
        return qs ? `?${qs}` : '';
    }

    private normalizeCategoryList(
        data: CategoryApiResponse[] | {
            content: CategoryApiResponse[];
            totalElements?: number;
            totalPages?: number;
            pageNumber?: number;
            pageSize?: number;
            last?: boolean;
            isLast?: boolean;
        },
        params: PaginatedQueryParams,
    ) {
        if (Array.isArray(data)) {
            return {
                categories: data,
                totalElements: data.length,
                totalPages: 1,
                currentPage: params.page ?? 0,
                pageSize: params.size ?? data.length,
                isLast: true,
            };
        }

        return {
            categories: data.content ?? [],
            totalElements: data.totalElements ?? data.content?.length ?? 0,
            totalPages: data.totalPages ?? 1,
            currentPage: data.pageNumber ?? params.page ?? 0,
            pageSize: data.pageSize ?? params.size ?? data.content?.length ?? 10,
            isLast: data.last ?? data.isLast ?? true,
        };
    }

    // ── GET /categories/admin (paginated, admin-only) ─────────────

    async getCategories(params: PaginatedQueryParams = {}): Promise<{
        categories: CategoryApiResponse[];
        totalElements: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        isLast: boolean;
    }> {
        try {
            const response = await apiClient.get<CategoryApiResponse[] | {
                content: CategoryApiResponse[];
                totalElements?: number;
                totalPages?: number;
                pageNumber?: number;
                pageSize?: number;
                last?: boolean;
                isLast?: boolean;
            }>(`${this.endpoint}/admin`);

            if (!response || !response.data) {
                throw new Error('Invalid response format');
            }

            return this.normalizeCategoryList(response.data, params);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Admin category fetch failed:', error);
            }

            return {
                categories: [],
                totalElements: 0,
                totalPages: 0,
                currentPage: 0,
                pageSize: params.size || 10,
                isLast: true,
            };
        }
    }

    // ── GET /categories/admin/{id} (admin-only) ───────────────────

    async getCategoryById(
        id: number,
        options: { silent?: boolean } = { silent: true },
    ): Promise<CategoryApiResponse | null> {
        try {
            const response = await apiClient.get<CategoryApiResponse>(
                `${this.endpoint}/admin/${id}`
            );

            if (!response?.data) {
                throw { message: 'Category not found', status: 404 } as ApiError;
            }

            return response.data;
        } catch (error) {
            if (!options.silent) throw error;

            if (process.env.NODE_ENV !== 'production') {
                console.error(`Silent category ${id} fetch failed:`, error);
            }

            return null;
        }
    }

    // ── GET /categories/admin/{entranceType}/categories (admin-only)

    async getCategoriesByEntranceType(
        entranceType: string,
        options: { silent?: boolean } = { silent: true },
    ): Promise<CategoryApiResponse[]> {
        try {
            const response = await apiClient.get<CategoryApiResponse[]>(
                `${this.endpoint}/admin/${entranceType}/categories`
            );

            if (!response?.data || !Array.isArray(response.data)) {
                throw { message: 'Invalid categories response', status: 500 } as ApiError;
            }

            return response.data;
        } catch (error) {
            if (!options.silent) throw error;

            if (process.env.NODE_ENV !== 'production') {
                console.error(`Silent category fetch for entrance type ${entranceType} failed:`, error);
            }

            return [];
        }
    }

    // ── POST /categories ─────────────────────────────────────────

    async createCategory(data: CategoryFormData): Promise<{
        success: boolean;
        data?: CategoryBatchResult;
        error?: string;
    }> {
        try {
            if (!data.entranceTypeId) {
                return { success: false, error: 'Entrance type is required' };
            }

            const payload: CategoryRequestPayload[] = [{
                categoryName: data.categoryName.trim(),
                remarks: data.remarks.trim(),
                entranceTypeId: data.entranceTypeId,
            }];

            const response = await apiClient.post<CategoryBatchResult>(this.endpoint, payload);

            if (!response?.data) {
                return { success: false, error: response?.message || 'Failed to create category' };
            }

            const failure = response.data.failures?.[0];
            if (failure) {
                return { success: false, data: response.data, error: failure.error };
            }

            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to create category'),
            };
        }
    }

    // ── PUT /categories/{id} ─────────────────────────────────────

    async updateCategory(id: number, data: CategoryFormData): Promise<{
        success: boolean;
        data?: CategoryApiResponse;
        error?: string;
    }> {
        try {
            if (!data.entranceTypeId) {
                return { success: false, error: 'Entrance type is required' };
            }

            const payload: CategoryRequestPayload = {
                categoryName: data.categoryName.trim(),
                remarks: data.remarks.trim(),
                entranceTypeId: data.entranceTypeId,
            };

            const response = await apiClient.put<CategoryApiResponse>(`${this.endpoint}/${id}`, payload);

            if (!response || !response.data) {
                return { success: false, error: 'Failed to update category' };
            }

            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to update category'),
            };
        }
    }

    // ── DELETE /categories/{id} ──────────────────────────────────

    async deleteCategory(id: number): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            await apiClient.delete(`${this.endpoint}/${id}`);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to delete category'),
            };
        }
    }
}

export const categoryService = new CategoryService();
