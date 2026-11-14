import { useEffect, useState } from 'react';
import { request, invalidateReads } from '../../api';
import { problem } from './host';

// Ignore older responses when the host switches candidates or changes the search.
export default function useReviewRequest(path, refreshMs = 0) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!path) return;
    let current = true;
    let requestNumber = 0;
    function load() {
      const number = ++requestNumber;
      request(path).then(response => {
        if (current && number === requestNumber) setState({ path, revision, response });
      }).catch(error => {
        if (current && number === requestNumber) setState({ path, revision, error: problem(error) });
      });
    }
    load();
    const timer = refreshMs ? setInterval(() => { invalidateReads(path); load(); }, refreshMs) : null;
    return () => { current = false; if (timer) clearInterval(timer); };
  }, [path, revision, refreshMs]);
  const latest = state?.path === path && state?.revision === revision ? state : {};
  return { ...latest, reload: () => { invalidateReads(path); setRevision(value => value + 1); } };
}
