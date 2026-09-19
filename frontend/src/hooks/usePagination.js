// src/hooks/usePagination.js
import { useState, useCallback } from "react";

export function usePagination(fetchFn, initialParams = {}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const load = useCallback(async (pageNum, params = initialParams) => {
    setLoading(true);
    try {
      const response = await fetchFn({ ...params, page: pageNum });
      const payload = response.data;
      setData(payload.results || payload);
      setCount(payload.count ?? (payload.results || payload).length);
      setHasNext(!!payload.next);
      setHasPrevious(!!payload.previous);
      setPage(pageNum);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]); // eslint-disable-line

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    load(p);
  };

  return { data, page, count, totalPages, hasNext, hasPrevious, loading, load, goToPage };
}