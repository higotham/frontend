import { useCallback, useState } from 'react';

export default function useSelection() {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const enterDeleteMode = useCallback(() => { clearSelection(); setSelectMode(true); }, [clearSelection]);
  const cancelDeleteMode = useCallback(() => { clearSelection(); setSelectMode(false); }, [clearSelection]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return {
    selectMode, selected,
    enterDeleteMode, cancelDeleteMode, clearSelection, toggleSelect
  };
}
