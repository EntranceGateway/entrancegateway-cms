// ─── Shared Pagination ───────────────────────────────────────────
export interface PaginatedQueryParams {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    isLast: boolean;
}

// ─── Category ────────────────────────────────────────────────────
export interface CategoryApiResponse {
    categoryId: number;
    slug: string;
    categoryName: string;
    remarks: string;
    entranceTypeId: number;
    entranceTypeName: string;
}

export interface Category {
    id: number;
    slug: string;
    categoryName: string;
    remarks: string;
    entranceTypeId: number;
    entranceTypeName: string;
}

export interface CategoryFormData {
    categoryName: string;
    remarks: string;
    entranceTypeId: number | null;
}

export interface CategoryBatchFailure {
    index: number;
    categoryName: string;
    error: string;
}

export interface CategoryBatchResult {
    created: CategoryApiResponse[];
    failures: CategoryBatchFailure[];
}

// ─── Course ──────────────────────────────────────────────────────
export type CourseLevel = 'PLUS_TWO' | 'DIPLOMA' | 'BACHELOR' | 'MASTER' | 'M_PHIL' | 'PHD';
export type CourseType = 'ANNUAL' | 'SEMESTER';

export interface CourseApiResponse {
    courseId: number;
    courseName: string;
    affiliation: string;
    description: string;
    criteria: string;
    courseLevel: CourseLevel;
    courseType: CourseType;
}

export interface Course {
    id: number;
    courseName: string;
    affiliation: string;
    description: string;
    criteria: string;
    courseLevel: CourseLevel;
    courseType: CourseType;
}

export interface CourseFormData {
    courseName: string;
    affiliation: string;
    description: string;
    criteria: string;
    courseLevel: CourseLevel;
    courseType: CourseType;
}

// ─── Entrance Type ───────────────────────────────────────────────
export interface EntranceTypeApiResponse {
    entranceTypeId: number;
    slug: string;
    entranceName: string;
    description: string | null;
    hasNegativeMarking: boolean;
    negativeMarkingValue: number;
}

export interface EntranceType {
    id: number;
    slug: string;
    entranceName: string;
    description: string;
    hasNegativeMarking: boolean;
    negativeMarkingValue: number;
}

export interface EntranceTypeFormData {
    entranceName: string;
    description: string;
    hasNegativeMarking: boolean;
    negativeMarkingValue: number;
}

// ─── Question Set ────────────────────────────────────────────────
export interface QuestionSetApiResponse {
    questionSetId: number;
    slug?: string;
    setName: string;
    nosOfQuestions: number;
    durationInMinutes: number;
    description?: string;
    price: number;
    courseId?: number | null;
    courseName?: string | null;
    entranceTypeId?: number | null;
    entranceTypeName?: string | null;
}

export interface QuestionSet {
    id: number;
    setName: string;
    nosOfQuestions: number;
    duration: string | null;
    description: string;
    price: number;
    course: {
        id: number;
        courseName: string;
    } | null;
    entranceType: {
        id: number;
        entranceName: string;
    } | null;
}

export interface QuestionSetFormData {
    setName: string;
    nosOfQuestions: number;
    durationInMinutes: number;
    description: string;
    price: number;
    courseId: number | null;
    entranceTypeId: number | null;
}

// ─── Quiz Templates ──────────────────────────────────────────────
export type QuizTemplateType = 'PRACTICE' | 'COMPETITIVE';
export type QuizTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuizDifficultyLevel = 'EASY' | 'MODERATE' | 'DIFFICULT';

export interface QuizTemplateTopicDistribution {
    topicId: string;
    count: number;
    weightage: number;
}

export interface QuizTemplateDifficultyDistribution {
    EASY?: number;
    MODERATE?: number;
    DIFFICULT?: number;
}

export interface QuizTemplateConstraints {
    noRepeatWithinDays?: number;
    avoidPreviouslyFailed?: boolean;
    maxUsageCount?: number;
}

export interface QuizTemplateConfig {
    totalQuestions: number;
    totalMarks: number;
    durationMinutes: number;
    topicDistribution: QuizTemplateTopicDistribution[];
    difficultyDistribution?: QuizTemplateDifficultyDistribution;
    enableNegativeMarking?: boolean;
    negativeMarkValue?: number;
    constraints?: QuizTemplateConstraints;
}

export interface CreateQuizTemplateRequest {
    name: string;
    description?: string;
    type: QuizTemplateType;
    entryFee: number;
    config: QuizTemplateConfig;
    status?: QuizTemplateStatus;
}

export interface QuizTemplateMutationResponse {
    templateId: string;
    name: string;
    description: string | null;
    type: QuizTemplateType;
    entryFee: number;
    config: QuizTemplateConfig;
    status: QuizTemplateStatus;
    createdAt: string;
    updatedAt: string | null;
    createdById: number;
    createdByName: string;
}

export interface QuizTemplateFormData {
    name: string;
    description: string;
    type: QuizTemplateType;
    entryFee: string;
    totalQuestions: string;
    totalMarks: string;
    durationMinutes: string;
    enableNegativeMarking: boolean;
    negativeMarkValue: string;
    status: QuizTemplateStatus;
    difficultyDistribution: {
        EASY: string;
        MODERATE: string;
        DIFFICULT: string;
    };
    constraints: {
        noRepeatWithinDays: string;
        avoidPreviouslyFailed: boolean;
        maxUsageCount: string;
    };
    topicDistribution: Array<{
        id: string;
        topicId: string;
        count: string;
        weightage: string;
    }>;
}

export interface QuizTemplateFormErrors {
    name?: string;
    description?: string;
    type?: string;
    entryFee?: string;
    totalQuestions?: string;
    totalMarks?: string;
    durationMinutes?: string;
    negativeMarkValue?: string;
    status?: string;
    difficultyDistribution?: string;
    topicDistribution?: string;
    constraints?: string;
    general?: string;
}

// ─── Question & Options ─────────────────────────────────────────
export interface OptionApiResponse {
    optionId: number;
    optionText: string;
    optionImage: string | null;
    optionOrder: number;
    isCorrect: boolean;
}

export interface Option {
    id: number;
    optionText: string;
    optionImageName: string | null;
    optionOrder: number;
    correct: boolean;
}

export interface OptionFormData {
    optionText: string;
    optionOrder: number;
    correct: boolean;
}

export interface QuestionApiResponse {
    questionId: number;
    question: string;
    marks: number;
    categoryId: number;
    categoryName: string;
    questionSetId: number;
    questionSetTitle: string;
    topicId: string | null;
    topicName: string | null;
    mcqImage: string | null;
    options: OptionApiResponse[];
}

export interface Question {
    id: number;
    question: string;
    marks: number;
    questionImageName: string | null;
    category: {
        id: number;
        categoryName: string;
    };
    topic: {
        id: string;
        name: string;
    } | null;
    options: Option[];
}

export interface QuestionFormData {
    question: string;
    marks: number;
    categoryId: number | null;
    questionSetId: number;
    topicId: string | null;
    topicName: string | null;
    options: OptionFormData[];
}

// ─── Quiz Attempt ────────────────────────────────────────────────
export interface QuizAttemptApiResponse {
    attemptId: number;
    user: {
        userId: number;
        email: string;
    };
    quizTemplate: {
        templateId: string;
        name: string;
    };
    questionsSnapshotJson: string;
    score: number;
    isSubmitted: boolean;
    attemptedAt: string;
}

// ─── Dashboard / Analytics ───────────────────────────────────────
export interface CourseStatsResponse {
    totalQuizzes: number;
    totalAttempts: number;
    averageScore: number;
    activeUsers: number;
}

export interface QuizStatsResponse {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    highestScore: number;
    questionAnalysis?: {
        questionId: number;
        questionNumber: number;
        correctPercentage: number;
        difficulty: string;
    }[];
}

export interface CourseRankingResponse {
    userId: number;
    fullname: string;
    averageScore: number;
    totalAttempts: number;
    percentile: number;
}
