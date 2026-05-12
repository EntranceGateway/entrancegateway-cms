import { apiClient } from '@/lib/api/apiClient';
import type {
    TopicApiResponse,
    TopicCreatePayload,
    TopicFormData,
} from '@/types/topic.types';
import type { ApiError } from '@/types/api.types';

type TopicMutationResult = {
    success: boolean;
    data?: TopicApiResponse | TopicApiResponse[];
    message?: string;
    error?: string;
};

/**
 * Safely extract an error message from an unknown caught value.
 * Avoids blind `as ApiError` type assertions.
 */
function extractErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
        const err = error as Partial<ApiError>;
        return err.message || fallback;
    }
    return fallback;
}

class TopicService {
    private readonly endpoint = '/topics';

    // ── GET /topics/by-entrance/slug/{entranceSlug} ───────────────

    async getTopicsByEntranceSlug(
        entranceSlug: string,
        options: { silent?: boolean } = { silent: true },
    ): Promise<TopicApiResponse[]> {
        try {
            const response = await apiClient.get<TopicApiResponse[]>(
                `${this.endpoint}/by-entrance/slug/${entranceSlug}`
            );

            if (!response?.data || !Array.isArray(response.data)) {
                throw { message: 'Invalid topics response', status: 500 } as ApiError;
            }

            return response.data;
        } catch (error) {
            if (!options.silent) throw error;

            if (process.env.NODE_ENV !== 'production') {
                console.error(`Silent topic fetch for entrance ${entranceSlug} failed:`, error);
            }

            return [];
        }
    }

    // ── GET /topics/by-entrance/{entranceSlug}/category/{categoryId}

    async getTopicsByEntranceAndCategory(
        entranceSlug: string,
        categoryId: number,
        options: { silent?: boolean } = { silent: true },
    ): Promise<TopicApiResponse[]> {
        try {
            const response = await apiClient.get<TopicApiResponse[]>(
                `${this.endpoint}/by-entrance/${entranceSlug}/category/${categoryId}`
            );

            if (!response?.data || !Array.isArray(response.data)) {
                throw { message: 'Invalid topics response', status: 500 } as ApiError;
            }

            return response.data;
        } catch (error) {
            if (!options.silent) throw error;

            if (process.env.NODE_ENV !== 'production') {
                console.error(`Silent topic fetch for ${entranceSlug}/category/${categoryId} failed:`, error);
            }

            return [];
        }
    }

    // ── POST /topics (batch create) ──────────────────────────────

    async createTopics(topics: TopicCreatePayload[]): Promise<TopicMutationResult> {
        try {
            if (topics.length === 0) {
                return { success: false, error: 'At least one topic is required' };
            }

            const response = await apiClient.post<TopicApiResponse[]>(this.endpoint, topics);

            if (!response?.data) {
                return {
                    success: false,
                    error: response?.message || 'Failed to create topics',
                };
            }

            return {
                success: true,
                data: response.data,
                message: response.message || 'Topics created successfully',
            };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to create topics'),
            };
        }
    }

    // ── PUT /topics/{topicId} ────────────────────────────────────

    async updateTopic(topicId: string, data: TopicFormData): Promise<TopicMutationResult> {
        try {
            if (!data.categoryId) {
                return { success: false, error: 'Category is required' };
            }

            const payload: TopicCreatePayload = {
                topicName: data.topicName,
                description: data.description,
                categoryId: data.categoryId,
                parentTopicId: data.parentTopicId,
            };

            const response = await apiClient.put<TopicApiResponse>(
                `${this.endpoint}/${topicId}`,
                payload,
            );

            if (!response?.data) {
                return { success: false, error: response?.message || 'Failed to update topic' };
            }

            return {
                success: true,
                data: response.data,
                message: response.message || 'Topic updated successfully',
            };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to update topic'),
            };
        }
    }

    // ── DELETE /topics/{topicId} ─────────────────────────────────

    async deleteTopic(topicId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const response = await apiClient.delete<unknown>(`${this.endpoint}/${topicId}`);

            // Explicitly check for failure instead of defaulting to true
            if (response?.success === false) {
                return { success: false, error: response.message || 'Delete failed' };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to delete topic'),
            };
        }
    }
}

export const topicService = new TopicService();
