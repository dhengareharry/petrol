import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A list that loads one page at a time. `fetchPage(page)` resolves to { items, hasMore }. The list starts over whenever
 * anything in `deps` changes (a search text, a filter, a refresh counter) and an older, slower response never overwrites
 * a newer one.
 */
export default function usePagedList(fetchPage, deps = []) {
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const [state, setState] = useState({ items: [], page: 0, hasMore: false, loading: true, loadingMore: false, error: '' });
  const generation = useRef(0);

  useEffect(() => {
    const mine = ++generation.current;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    fetchRef
      .current(1)
      .then(({ items, hasMore }) => {
        if (generation.current === mine) setState({ items, page: 1, hasMore, loading: false, loadingMore: false, error: '' });
      })
      .catch((err) => {
        if (generation.current === mine) setState((prev) => ({ ...prev, loading: false, error: err.message }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(() => {
    setState((prev) => {
      if (!prev.hasMore || prev.loadingMore || prev.loading) return prev;
      const mine = generation.current;
      const nextPage = prev.page + 1;
      fetchRef
        .current(nextPage)
        .then(({ items, hasMore }) => {
          if (generation.current !== mine) return;
          setState((cur) => {
            const seen = new Set(cur.items.map((item) => item.id));
            return { ...cur, items: [...cur.items, ...items.filter((item) => !seen.has(item.id))], page: nextPage, hasMore, loadingMore: false };
          });
        })
        .catch((err) => {
          if (generation.current === mine) setState((cur) => ({ ...cur, loadingMore: false, error: err.message }));
        });
      return { ...prev, loadingMore: true };
    });
  }, []);

  return { ...state, loadMore };
}
