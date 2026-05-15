// ─── Topic Types ─────────────────────────────────────────────────

export interface TopicParentResponse {
    topicId: string;
    topicName: string;
}

export interface TopicApiResponse {
    topicId: string;
    topicName: string;
    description: string | null;
    categoryId: number;
    categoryName: string;
    parentTopic: TopicParentResponse | null;
}

export interface Topic {
    id: string;
    topicName: string;
    description: string;
    category: {
        id: number;
        name: string;
    };
    parentTopic: {
        id: string;
        name: string;
    } | null;
}

export interface TopicFormData {
    topicName: string;
    description: string;
    categoryId: number | null;
    parentTopicId: string | null;
}

export type TopicCreatePayload = {
    topicName: string;
    description: string;
    categoryId: number;
    parentTopicId?: string | null;
};

export interface TopicBatchFailure {
    index: number;
    topicName: string;
    error: string;
}

export interface TopicBatchResult {
    created: TopicApiResponse[];
    failures: TopicBatchFailure[];
}
