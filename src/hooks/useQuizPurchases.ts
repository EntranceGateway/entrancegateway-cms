import { useState, useEffect, useCallback, useRef } from 'react';
import { purchaseService } from '@/services/purchase.service';
import type { QuizPurchase, QuizPurchaseQueryParams } from '@/types/purchase.types';

interface UseQuizPurchasesResult {
  purchases: QuizPurchase[];
  loading: boolean;
  error: string | null;
  pagination: {
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    isLast: boolean;
  };
  goToPage: (page: number) => void;
  updateFilters: (filters: Partial<QuizPurchaseQueryParams>) => void;
  refetch: () => void;
}

export function useQuizPurchases(initialParams: QuizPurchaseQueryParams = {}): UseQuizPurchasesResult {
  const [purchases, setPurchases] = useState<QuizPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<QuizPurchaseQueryParams>({
    view: 'QUIZ',
    page: 0,
    size: 10,
    sortBy: 'purchaseDate',
    sortDir: 'desc',
    ...initialParams,
  });
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    isLast: true,
  });
  
  const requestIdRef = useRef(0);

  const fetchPurchases = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await purchaseService.getPurchases(params);

      if (currentRequestId !== requestIdRef.current) return;

      if (result.error) {
        setError(result.error);
        setPurchases([]);
        setPagination({
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: params.size || 10,
          isLast: true,
        });
      } else {
        setPurchases(result.purchases);
        setPagination({
          totalElements: result.totalElements,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          pageSize: result.pageSize,
          isLast: result.isLast,
        });
      }
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      
      if (process.env.NODE_ENV !== 'production') {
        console.error('Unexpected error fetching purchases:', error);
      }
      setError('An unexpected error occurred. Please try again.');
      setPurchases([]);
      setPagination({
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: params.size || 10,
        isLast: true,
      });
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const updateFilters = useCallback((filters: Partial<QuizPurchaseQueryParams>) => {
    setParams((prev) => ({ ...prev, ...filters, page: 0 }));
  }, []);

  const refetch = useCallback(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return {
    purchases,
    loading,
    error,
    pagination,
    goToPage,
    updateFilters,
    refetch,
  };
}
