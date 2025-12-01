// src/hooks/usePager.ts
import { useEffect, useMemo, useState } from "react";

export function usePager<T>(
  fetcher: (p: any) => Promise<{ count: number; results: T[] }>,
  initialParams: any = {}
) {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialParams.page_size || 12);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [rows, setRows] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [extraParams, setExtraParams] = useState<any>(initialParams);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  async function load(currPage = page, currPageSize = pageSize, params = extraParams) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher({ ...params, page: currPage, page_size: currPageSize });
      setRows(data.results || []);
      setCount(data.count || 0);
    } catch (e: any) {
      setError(e?.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, JSON.stringify(extraParams)]);

  return {
    page, setPage,
    pageSize, setPageSize,
    totalPages, count, rows, loading, error,
    params: extraParams, setParams: setExtraParams,
    reload: () => load(1, pageSize, extraParams),
  };
}
