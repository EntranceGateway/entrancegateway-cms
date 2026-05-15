import { useState, useEffect, useCallback, useRef } from 'react';
import { categoryService } from '@/services/category.service';
import type { Category, PaginatedQueryParams } from '@/types/quiz.types';

export function useCategories(initialParams: PaginatedQueryParams = {}) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isLast, setIsLast] = useState(false);

    const paramsRef = useRef(initialParams);

    const fetchCategories = useCallback(async (params: PaginatedQueryParams = {}) => {
        setLoading(true);
        setError(null);

        try {
            const result = await categoryService.getCategories({
                ...paramsRef.current,
                ...params,
            });

            // Transform API response to UI type
            const transformedCategories: Category[] = result.categories.map(cat => ({
                id: cat.categoryId,
                slug: cat.slug,
                categoryName: cat.categoryName,
                remarks: cat.remarks,
                entranceTypeId: cat.entranceTypeId,
                entranceTypeName: cat.entranceTypeName,
            }));

            setCategories(transformedCategories);
            setTotalElements(result.totalElements);
            setTotalPages(result.totalPages);
            setCurrentPage(result.currentPage);
            setPageSize(result.pageSize);
            setIsLast(result.isLast);
        } catch {
            setError('Unable to load categories. Please try again later.');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        fetchCategories(paramsRef.current);
    }, [fetchCategories]);

    const goToPage = useCallback((page: number) => {
        fetchCategories({ ...paramsRef.current, page });
    }, [fetchCategories]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        loading,
        error,
        totalElements,
        totalPages,
        currentPage,
        pageSize,
        isLast,
        refetch,
        goToPage
    };
}
