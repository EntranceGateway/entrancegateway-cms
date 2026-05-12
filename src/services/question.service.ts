import { apiClient } from '@/lib/api/apiClient';
import type {
    QuestionApiResponse,
    QuestionFormData,
    PaginatedResponse,
    PaginatedQueryParams,
} from '@/types/quiz.types';
import type { ApiError } from '@/types/api.types';

type QuestionMutationResult = {
    success: boolean;
    data?: QuestionApiResponse;
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

function extractErrorDetails(error: unknown): string | undefined {
    if (error && typeof error === 'object') {
        const err = error as Partial<ApiError>;
        if (err.errors) {
            return Object.entries(err.errors)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        }
    }
    return undefined;
}

class QuestionService {
    private readonly endpoint = '/questions';

    // ── GET /questions (paginated) ────────────────────────────────

    async getQuestions(
        params: PaginatedQueryParams = {},
        options: { silent?: boolean } = { silent: true },
    ): Promise<PaginatedResponse<QuestionApiResponse>> {
        const emptyPage: PaginatedResponse<QuestionApiResponse> = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            pageNumber: 0,
            pageSize: 10,
            isLast: true,
        };

        try {
            const query = new URLSearchParams();
            if (params.page !== undefined) query.set('page', params.page.toString());
            if (params.size !== undefined) query.set('size', params.size.toString());
            if (params.sortBy) query.set('sortBy', params.sortBy);
            if (params.sortDir) query.set('sortDir', params.sortDir);

            const qs = query.toString();
            const url = qs ? `${this.endpoint}?${qs}` : this.endpoint;

            const response = await apiClient.get<PaginatedResponse<QuestionApiResponse>>(url);

            if (!response?.data) {
                throw { message: 'Invalid question response', status: 500 } as ApiError;
            }

            return response.data;
        } catch (error) {
            if (!options.silent) {
                throw error;
            }

            if (process.env.NODE_ENV !== 'production') {
                console.error('Silent question fetch failed:', error);
            }

            return emptyPage;
        }
    }

    // ── GET /questions/{id} ───────────────────────────────────────

    async getQuestionById(
        id: number,
        options: { silent?: boolean } = { silent: true },
    ): Promise<QuestionApiResponse | null> {
        try {
            const response = await apiClient.get<QuestionApiResponse>(`${this.endpoint}/${id}`);

            if (!response?.data) {
                throw { message: 'Question not found', status: 404 } as ApiError;
            }

            return response.data;
        } catch (error) {
            if (!options.silent) throw error;

            if (process.env.NODE_ENV !== 'production') {
                console.error(`Silent question ${id} fetch failed:`, error);
            }

            return null;
        }
    }

    // ── GET /questions/set/{questionSetId} ────────────────────────

    async getQuestionsBySet(
        questionSetId: number,
        options: { silent?: boolean } = { silent: true },
    ): Promise<QuestionApiResponse[]> {
        try {
            const response = await apiClient.get<Record<string, QuestionApiResponse[]>>(
                `${this.endpoint}/set/${questionSetId}`
            );

            if (!response || !response.data) {
                return [];
            }

            // Flatten the grouped response into a single array
            const allQuestions: QuestionApiResponse[] = [];
            Object.values(response.data).forEach(categoryQuestions => {
                allQuestions.push(...categoryQuestions);
            });

            return allQuestions;
        } catch (error) {
            if (!options.silent) throw error;

            if (process.env.NODE_ENV !== 'production') {
                console.error(`Silent question set ${questionSetId} fetch failed:`, error);
            }

            return [];
        }
    }

    // ── POST /questions (multipart/form-data) ─────────────────────

    async createQuestion(
        questionData: QuestionFormData,
        imageFile: File | null,
        optionImageFiles: (File | null)[]
    ): Promise<QuestionMutationResult> {
        try {
            const formData = new FormData();

            formData.append('question', questionData.question);
            formData.append('marks', questionData.marks.toString());
            
            if (!questionData.categoryId) {
                return { success: false, error: 'Category is required' };
            }
            formData.append('categoryId', questionData.categoryId.toString());
            formData.append('questionSetId', questionData.questionSetId.toString());

            // Topic fields (optional)
            if (questionData.topicId) {
                formData.append('topicId', questionData.topicId);
            }
            if (questionData.topicName) {
                formData.append('topicName', questionData.topicName);
            }

            // Find the correct answer index
            const correctAnswerIndex = questionData.options.findIndex(opt => opt.correct);
            if (correctAnswerIndex === -1) {
                return { success: false, error: 'At least one correct answer is required' };
            }
            formData.append('correctAnswerIndex', correctAnswerIndex.toString());

            // Question image file
            if (imageFile) {
                formData.append('imageFile', imageFile);
            }

            // Append each option as individual form fields
            questionData.options.forEach((option, index) => {
                formData.append(`options[${index}].optionText`, option.optionText);
                formData.append(`options[${index}].optionOrder`, option.optionOrder.toString());
                formData.append(`options[${index}].correct`, option.correct.toString());
            });

            // Append option image files as array
            optionImageFiles.forEach((file) => {
                if (file) {
                    formData.append('optionImageFiles', file);
                }
            });

            const response = await apiClient.postMultipart<QuestionApiResponse>(
                this.endpoint,
                formData
            );

            if (!response?.data) {
                return {
                    success: false,
                    error: response?.message || 'Failed to create question',
                };
            }

            return {
                success: true,
                data: response.data,
                message: response.message || 'Question created successfully',
            };
        } catch (error) {
            const message = extractErrorMessage(error, 'Failed to create question');
            const details = extractErrorDetails(error);

            return {
                success: false,
                error: details ? `${message} — ${details}` : message,
            };
        }
    }

    // ── POST /questions/by-names (multipart/form-data) ────────────

    async createQuestionByNames(
        questionData: QuestionFormData & { categoryName: string; questionSetName: string },
        imageFile: File | null,
        optionImageFiles: (File | null)[]
    ): Promise<QuestionMutationResult> {
        try {
            const formData = new FormData();

            formData.append('question', questionData.question);
            formData.append('marks', questionData.marks.toString());
            formData.append('categoryName', questionData.categoryName);
            formData.append('questionSetName', questionData.questionSetName);

            if (questionData.topicId) {
                formData.append('topicId', questionData.topicId);
            }
            if (questionData.topicName) {
                formData.append('topicName', questionData.topicName);
            }

            const correctAnswerIndex = questionData.options.findIndex(opt => opt.correct);
            if (correctAnswerIndex === -1) {
                return { success: false, error: 'At least one correct answer is required' };
            }
            formData.append('correctAnswerIndex', correctAnswerIndex.toString());

            if (imageFile) {
                formData.append('imageFile', imageFile);
            }

            questionData.options.forEach((option, index) => {
                formData.append(`options[${index}].optionText`, option.optionText);
                formData.append(`options[${index}].optionOrder`, option.optionOrder.toString());
                formData.append(`options[${index}].correct`, option.correct.toString());
            });

            optionImageFiles.forEach((file) => {
                if (file) {
                    formData.append('optionImageFiles', file);
                }
            });

            const response = await apiClient.postMultipart<QuestionApiResponse>(
                `${this.endpoint}/by-names`,
                formData
            );

            if (!response?.data) {
                return {
                    success: false,
                    error: response?.message || 'Failed to create question',
                };
            }

            return {
                success: true,
                data: response.data,
                message: response.message || 'Question created successfully',
            };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to create question'),
            };
        }
    }

    // ── PUT /questions/{id} ───────────────────────────────────────

    async updateQuestion(id: number, data: QuestionFormData): Promise<QuestionMutationResult> {
        try {
            const response = await apiClient.put<QuestionApiResponse>(`${this.endpoint}/${id}`, data);

            if (!response?.data) {
                return { success: false, error: response?.message || 'Failed to update question' };
            }

            return {
                success: true,
                data: response.data,
                message: response.message || 'Question updated successfully',
            };
        } catch (error) {
            return {
                success: false,
                error: extractErrorMessage(error, 'Failed to update question'),
            };
        }
    }

    // ── DELETE /questions/{id} ────────────────────────────────────

    async deleteQuestion(id: number): Promise<{
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
                error: extractErrorMessage(error, 'Failed to delete question'),
            };
        }
    }
}

export const questionService = new QuestionService();
