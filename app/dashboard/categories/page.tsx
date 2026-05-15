'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useCategories } from '@/hooks/useCategories';
import { useEntranceTypes } from '@/hooks/useEntranceTypes';
import { categoryService } from '@/services/category.service';
import { toast } from '@/lib/utils/toast';
import type { Category } from '@/types/quiz.types';

export default function CategoriesPage() {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { categories, loading, totalElements, totalPages, currentPage, refetch } = useCategories({
    page,
    size: pageSize,
    sortBy: 'categoryName',
    sortDir: 'asc',
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    categoryName: '',
    remarks: '',
    entranceTypeId: null as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { entranceTypes, loading: entranceTypesLoading } = useEntranceTypes();

  const entranceTypeOptions = [
    { value: '', label: entranceTypesLoading ? 'Loading entrance types...' : 'Select entrance type' },
    ...entranceTypes.map((entranceType) => ({
      value: entranceType.id.toString(),
      label: entranceType.entranceName,
    })),
  ];

  const handleCreate = () => {
    setFormData({ categoryName: '', remarks: '', entranceTypeId: null });
    setShowCreateModal(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      categoryName: category.categoryName,
      remarks: category.remarks || '',
      entranceTypeId: category.entranceTypeId || null,
    });
    setShowEditModal(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entranceTypeId) {
      toast.warning('Entrance type is required');
      return;
    }

    setSubmitting(true);

    try {
      const result = await categoryService.createCategory(formData);

      if (result.success) {
        toast.success('Category created successfully');
        setShowCreateModal(false);
        refetch();
      } else {
        toast.error(result.error || 'Failed to create category');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    if (!formData.entranceTypeId) {
      toast.warning('Entrance type is required');
      return;
    }

    setSubmitting(true);

    try {
      const result = await categoryService.updateCategory(selectedCategory.id, formData);

      if (result.success) {
        toast.success('Category updated successfully');
        setShowEditModal(false);
        refetch();
      } else {
        toast.error(result.error || 'Failed to update category');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    setDeleting(true);

    try {
      const result = await categoryService.deleteCategory(selectedCategory.id);

      if (result.success) {
        toast.success('Category deleted successfully');
        setShowDeleteModal(false);
        refetch();
      } else {
        toast.error(result.error || 'Failed to delete category');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      className: 'w-20',
    },
    {
      key: 'categoryName',
      label: 'Category Name',
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (category: Category) => category.slug || '-',
    },
    {
      key: 'entranceTypeName',
      label: 'Entrance Type',
      render: (category: Category) => category.entranceTypeName || '-',
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (category: Category) => category.remarks || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-40',
      render: (category: Category) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(category)}
            className="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--color-brand-blue)',
              color: 'white',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(category)}
            className="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--color-error)',
              color: 'white',
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <EmptyState type="loading" message="Loading categories..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold font-roboto"
                style={{ color: 'var(--color-brand-navy)' }}
              >
                Category Management
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Manage question categories for quiz organization
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors text-white"
              style={{ backgroundColor: 'var(--color-brand-blue)' }}
            >
              Add Category
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DataTable
              columns={columns}
              data={categories}
              keyExtractor={(category) => category.id.toString()}
              emptyMessage="No categories found"
              mobileCardRender={(category) => (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{category.categoryName}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {category.id}</p>
                        {category.slug && (
                          <p className="text-xs text-gray-500 mt-1 truncate">Slug: {category.slug}</p>
                        )}
                      </div>
                    </div>
                    {category.entranceTypeName && (
                      <span
                        className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: 'rgba(13, 71, 161, 0.08)',
                          color: 'var(--color-brand-navy)',
                        }}
                      >
                        {category.entranceTypeName}
                      </span>
                    )}
                  </div>
                  {category.remarks && (
                    <p className="text-sm text-gray-600">{category.remarks}</p>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--color-brand-blue)',
                        color: 'white',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--color-error)',
                        color: 'white',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            />

            {totalPages > 1 && (
              <div className="px-6 pb-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>

        <FormModal
          isOpen={showCreateModal}
          title="Create Category"
          onClose={() => setShowCreateModal(false)}
          size="md"
        >
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <Input
              label="Category Name"
              type="text"
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              required
              placeholder="e.g., Mathematics"
            />

            <Select
              label="Entrance Type"
              value={formData.entranceTypeId?.toString() || ''}
              onChange={(e) => setFormData({
                ...formData,
                entranceTypeId: e.target.value ? Number(e.target.value) : null,
              })}
              options={entranceTypeOptions}
              disabled={entranceTypesLoading || submitting}
              required
            />

            <Textarea
              label="Remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional description or notes"
              rows={3}
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 text-white"
                style={{ backgroundColor: 'var(--color-brand-blue)' }}
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </FormModal>

        <FormModal
          isOpen={showEditModal}
          title="Edit Category"
          onClose={() => setShowEditModal(false)}
          size="md"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <Input
              label="Category Name"
              type="text"
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              required
              placeholder="e.g., Mathematics"
            />

            <Select
              label="Entrance Type"
              value={formData.entranceTypeId?.toString() || ''}
              onChange={(e) => setFormData({
                ...formData,
                entranceTypeId: e.target.value ? Number(e.target.value) : null,
              })}
              options={entranceTypeOptions}
              disabled={entranceTypesLoading || submitting}
              required
            />

            <Textarea
              label="Remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional description or notes"
              rows={3}
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 text-white"
                style={{ backgroundColor: 'var(--color-brand-blue)' }}
              >
                {submitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </FormModal>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Category"
          message={`Are you sure you want to delete "${selectedCategory?.categoryName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          variant="danger"
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
