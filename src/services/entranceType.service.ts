import { apiClient } from '@/lib/api/apiClient';
import type {
    EntranceTypeApiResponse,
    EntranceTypeFormData,
} from '@/types/quiz.types';
import type { ApiError } from '@/types/api.types';

type EntranceTypeMutationResult = {
    success: boolean;
    data?: EntranceTypeApiResponse;
    message?: string;
    error?: string;
};

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

class EntranceTypeService {
    private readonly endpoint = '/entrance-types';

    /**
     * Fetch all entrance types.
     * Silent by design: dashboard widgets and selectors can continue rendering
     * without interrupting users when this optional dataset fails to load.
     */
    async getEntranceTypes(options: { silent?: boolean } = { silent: true }): Promise<EntranceTypeApiResponse[]> {
        try {
            const response = await apiClient.get<EntranceTypeApiResponse[]>(`${this.endpoint}/admin`);

            if (!response?.success || !Array.isArray(response.data)) {
                throw {
                    message: response?.message || 'Invalid entrance type response',
                    status: 500,
                } as ApiError;
            }

            return response.data;
        } catch (error) {
            if (!options.silent) {
                throw error;
            }

            if (process.env.NODE_ENV !== 'production') {
                console.error('Silent entrance type fetch failed:', error);
            }

            return [];
        }
    }

    async createEntranceType(data: EntranceTypeFormData): Promise<EntranceTypeMutationResult> {
        try {
            const response = await apiClient.post<EntranceTypeApiResponse>(this.endpoint, data);

            if (!response?.success || !response.data) {
                return {
                    success: false,
                    error: response?.message || 'Failed to create entrance type',
                };
            }

            return {
                success: true,
                data: response.data,
                message: response.message || 'Entrance Type created successfully',
            };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to create entrance type'),
            };
        }
    }

    async updateEntranceType(id: number, data: EntranceTypeFormData): Promise<EntranceTypeMutationResult> {
        try {
            const response = await apiClient.put<EntranceTypeApiResponse>(`${this.endpoint}/${id}`, data);

            if (!response?.success || !response.data) {
                return { success: false, error: response?.message || 'Failed to update entrance type' };
            }

            return {
                success: true,
                data: response.data,
                message: response.message || 'Entrance type updated successfully',
            };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to update entrance type'),
            };
        }
    }

    async deleteEntranceType(id: number): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const response = await apiClient.delete<unknown>(`${this.endpoint}/${id}`);

            // Explicitly check for failure instead of defaulting to true
            if (response?.success === false) {
                return { success: false, error: response.message || 'Delete failed' };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to delete entrance type'),
            };
        }
    }
}

export const entranceTypeService = new EntranceTypeService();
