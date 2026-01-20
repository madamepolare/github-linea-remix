import { useState, useCallback, useMemo } from "react";

interface UsePaginationOptions {
  totalCount: number;
  defaultPage?: number;
  defaultPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  paginateData: <T>(data: T[]) => T[];
}

export function usePagination({
  totalCount,
  defaultPage = 1,
  defaultPageSize = 25,
  onPageChange,
  onPageSizeChange,
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPageState] = useState(defaultPage);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages));
      setPageState(clampedPage);
      onPageChange?.(clampedPage);
    },
    [totalPages, onPageChange]
  );

  const setPageSize = useCallback(
    (newSize: number) => {
      setPageSizeState(newSize);
      // Reset to page 1 when changing page size
      setPageState(1);
      onPageSizeChange?.(newSize);
      onPageChange?.(1);
    },
    [onPageSizeChange, onPageChange]
  );

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [setPage, totalPages]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  const canGoNext = page < totalPages;
  const canGoPrevious = page > 1;

  const paginateData = useCallback(
    <T,>(data: T[]): T[] => {
      return data.slice(startIndex, startIndex + pageSize);
    },
    [startIndex, pageSize]
  );

  return {
    page,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    canGoNext,
    canGoPrevious,
    paginateData,
  };
}
