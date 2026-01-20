import { useState, useCallback, useMemo } from "react";

interface UseTableSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface UseTableSelectionReturn<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  selectedCount: number;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  isSelected: (id: string) => boolean;
  handleSelectAll: (checked: boolean) => void;
  handleSelectOne: (id: string, checked: boolean) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  selectItems: (ids: string[]) => void;
}

export function useTableSelection<T>({
  items,
  getItemId,
  onSelectionChange,
}: UseTableSelectionOptions<T>): UseTableSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const updateSelection = useCallback(
    (newIds: Set<string>) => {
      setSelectedIds(newIds);
      onSelectionChange?.(Array.from(newIds));
    },
    [onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = new Set(items.map(getItemId));
        updateSelection(allIds);
      } else {
        updateSelection(new Set());
      }
    },
    [items, getItemId, updateSelection]
  );

  const handleSelectOne = useCallback(
    (id: string, checked: boolean) => {
      const newIds = new Set(selectedIds);
      if (checked) {
        newIds.add(id);
      } else {
        newIds.delete(id);
      }
      updateSelection(newIds);
    },
    [selectedIds, updateSelection]
  );

  const toggleSelection = useCallback(
    (id: string) => {
      const newIds = new Set(selectedIds);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      updateSelection(newIds);
    },
    [selectedIds, updateSelection]
  );

  const clearSelection = useCallback(() => {
    updateSelection(new Set());
  }, [updateSelection]);

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemId));
    updateSelection(allIds);
  }, [items, getItemId, updateSelection]);

  const selectItems = useCallback(
    (ids: string[]) => {
      updateSelection(new Set(ids));
    },
    [updateSelection]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  const isPartiallySelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [selectedIds.size, items.length]
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    handleSelectAll,
    handleSelectOne,
    toggleSelection,
    clearSelection,
    selectAll,
    selectItems,
  };
}
