import { useState, useMemo } from 'react';

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  setPerPage: (n: number) => void;
  perPage: number;
}

export function usePagination<T>(data: T[], initialPerPage = 10): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);

  const totalPages = Math.max(1, Math.ceil(data.length / perPage));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, currentPage, perPage]);

  // ページ数やデータが変わったときにcurrentPageを自動調整
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  return {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPerPage,
    perPage,
  };
} 