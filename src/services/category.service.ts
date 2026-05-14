import { apiClient } from '@/lib/api/apiClient';
import type {
    CategoryApiResponse,
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
            const queryString = this.buildQueryString({
                sortBy: 'categoryName',
                sortDir: 'asc',
                ...params,
            });
            const response = await apiClient.get<{
                content: CategoryApiResponse[];
                totalElements: number;
                totalPages: number;
                pageNumber: number;
                pageSize: number;
                last: boolean;
            }>(`${this.endpoint}/admin${queryString}`);

            if (!response || !response.data) {
                throw new Error('Invalid response format');
            }

            const { content, totalElements, totalPages, pageNumber, pageSize, last } = response.data;

            return {
                categories: content,
                totalElements,
                totalPages,
                currentPage: pageNumber,
                pageSize,
                isLast: last,
            };
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to fetch categories:', error);
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
        data?: CategoryApiResponse;
        error?: string;
    }> {
        try {
            const response = await apiClient.post<CategoryApiResponse>(this.endpoint, data);

            if (!response || !response.data) {
                return { success: false, error: 'Failed to create category' };
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
            const response = await apiClient.put<CategoryApiResponse>(`${this.endpoint}/${id}`, data);

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
