import { useState, useEffect, useCallback } from 'react';
import { entranceTypeService } from '@/services/entranceType.service';
import type { EntranceType } from '@/types/quiz.types';

export function useEntranceTypes() {
    const [entranceTypes, setEntranceTypes] = useState<EntranceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEntranceTypes = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await entranceTypeService.getEntranceTypes({ silent: false });
            
            // Transform API response to UI type
            const transformedTypes: EntranceType[] = result.map(type => ({
                id: type.entranceTypeId,
                slug: type.slug,
                entranceName: type.entranceName,
                description: type.description || '',
                hasNegativeMarking: type.hasNegativeMarking,
                negativeMarkingValue: type.negativeMarkingValue,
            }));
            
            setEntranceTypes(transformedTypes);
        } catch {
            setError('Unable to load entrance types. Please try again later.');
            setEntranceTypes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        fetchEntranceTypes();
    }, [fetchEntranceTypes]);

    useEffect(() => {
        fetchEntranceTypes();
    }, [fetchEntranceTypes]);

    return { entranceTypes, loading, error, refetch };
}
