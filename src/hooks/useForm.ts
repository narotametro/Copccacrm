import { useState } from 'react';

/**
 * Generic hook for managing form state and modal visibility
 * Reduces boilerplate for add/edit patterns across the app
 */
export function useModal<T>(initialState: T) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<T>(initialState);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const openModal = () => setIsOpen(true);
  
  const closeModal = () => {
    setIsOpen(false);
    setEditingItem(null);
    setFormData(initialState);
  };

  const openEditModal = (item: T) => {
    setEditingItem(item);
    setFormData(item);
    setIsOpen(true);
  };

  const updateFormData = (field: keyof T, value: T[keyof T]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialState);
    setEditingItem(null);
  };

  return {
    isOpen,
    formData,
    editingItem,
    openModal,
    closeModal,
    openEditModal,
    updateFormData,
    setFormData,
    resetForm,
    isEditing: !!editingItem,
  };
}

/**
 * Hook for managing list data with CRUD operations
 * Provides common state and handlers for list-based pages
 */
export function useListData<T extends { id: string | number }>(initialData: T[] = []) {
  const [items, setItems] = useState<T[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  const addItem = (item: T) => {
    setItems(prev => [item, ...prev]);
  };

  const updateItem = (id: string | number, updates: Partial<T>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string | number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    selectedItems.delete(id);
    setSelectedItems(new Set(selectedItems));
  };

  const toggleSelection = (id: string | number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const filterItems = (predicate: (item: T) => boolean) => {
    return items.filter(predicate);
  };

  return {
    items,
    setItems,
    searchQuery,
    setSearchQuery,
    selectedItems,
    addItem,
    updateItem,
    deleteItem,
    toggleSelection,
    clearSelection,
    filterItems,
  };
}
