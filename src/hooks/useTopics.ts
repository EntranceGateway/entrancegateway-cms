import { useState, useEffect, useCallback } from 'react';
import { topicService } from '@/services/topic.service';
import type { Topic } from '@/types/topic.types';

interface UseTopicsOptions {
    entranceSlug: string;
    categoryId?: number | null;
}

export function useTopics({ entranceSlug, categoryId }: UseTopicsOptions) {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTopics = useCallback(async () => {
        if (!entranceSlug) {
            setTopics([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = categoryId
                ? await topicService.getTopicsByEntranceAndCategory(entranceSlug, categoryId, { silent: false })
                : await topicService.getTopicsByEntranceSlug(entranceSlug, { silent: false });

            const transformed: Topic[] = result.map(t => ({
                id: t.topicId,
                topicName: t.topicName,
                description: t.description || '',
                category: {
                    id: t.categoryId,
                    name: t.categoryName,
                },
                parentTopic: t.parentTopic ? {
                    id: t.parentTopic.topicId,
                    name: t.parentTopic.topicName,
                } : null,
            }));

            setTopics(transformed);
        } catch {
            setError('Unable to load topics. Please try again later.');
            setTopics([]);
        } finally {
            setLoading(false);
        }
    }, [entranceSlug, categoryId]);

    const refetch = useCallback(() => {
        fetchTopics();
    }, [fetchTopics]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    return { topics, loading, error, refetch };
}
