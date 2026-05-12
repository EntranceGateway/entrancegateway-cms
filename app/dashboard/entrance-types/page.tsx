'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { useEntranceTypes } from '@/hooks/useEntranceTypes';
import { entranceTypeService } from '@/services/entranceType.service';
import { toast } from '@/lib/utils/toast';
import type { EntranceType, EntranceTypeFormData } from '@/types/quiz.types';

const INITIAL_FORM_DATA: EntranceTypeFormData = {
  entranceName: '',
  description: '',
  hasNegativeMarking: false,
  negativeMarkingValue: 0,
};

export default function EntranceTypesPage() {
  const { entranceTypes, loading, error, refetch } = useEntranceTypes();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntranceType, setSelectedEntranceType] = useState<EntranceType | null>(null);
  const [formData, setFormData] = useState<EntranceTypeFormData>(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────

  const handleCreate = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowCreateModal(true);
  };

  const handleEdit = (entranceType: EntranceType) => {
    setSelectedEntranceType(entranceType);
    setFormData({
      entranceName: entranceType.entranceName,
      description: entranceType.description || '',
      hasNegativeMarking: entranceType.hasNegativeMarking,
      negativeMarkingValue: entranceType.negativeMarkingValue,
    });
    setShowEditModal(true);
  };

  const handleDelete = (entranceType: EntranceType) => {
    setSelectedEntranceType(entranceType);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entranceName.trim()) {
      toast.warning('Entrance name is required');
      return;
    }

    setSubmitting(true);

    const result = await entranceTypeService.createEntranceType(formData);

    if (result.success) {
      toast.success(result.message || 'Entrance type created successfully');
      setShowCreateModal(false);
      refetch();
    } else {
      toast.error(result.error || 'Failed to create entrance type');
    }

    setSubmitting(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntranceType) return;

    if (!formData.entranceName.trim()) {
      toast.warning('Entrance name is required');
      return;
    }

    setSubmitting(true);

    const result = await entranceTypeService.updateEntranceType(selectedEntranceType.id, formData);

    if (result.success) {
      toast.success(result.message || 'Entrance type updated successfully');
      setShowEditModal(false);
      refetch();
    } else {
      toast.error(result.error || 'Failed to update entrance type');
    }

    setSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEntranceType) return;

    setDeleting(true);

    const result = await entranceTypeService.deleteEntranceType(selectedEntranceType.id);

    if (result.success) {
      toast.success('Entrance type deleted successfully');
      setShowDeleteModal(false);
      setSelectedEntranceType(null);
      refetch();
    } else {
      toast.error(result.error || 'Failed to delete entrance type');
    }

    setDeleting(false);
  };

  // ── Form field update helpers ───────────────────────────────────

  const updateField = <K extends keyof EntranceTypeFormData>(
    key: K,
    value: EntranceTypeFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ── Table columns ───────────────────────────────────────────────

  const columns = [
    {
      key: 'id',
      label: 'ID',
      className: 'w-16',
    },
    {
      key: 'entranceName',
      label: 'Entrance Name',
      render: (item: EntranceType) => (
        <div>
          <p className="font-semibold text-gray-900">{item.entranceName}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{item.slug}</p>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item: EntranceType) => (
        <span className="line-clamp-2 text-gray-600">{item.description || '—'}</span>
      ),
    },
    {
      key: 'hasNegativeMarking',
      label: 'Negative Marking',
      className: 'w-44',
      render: (item: EntranceType) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            item.hasNegativeMarking
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.hasNegativeMarking ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
          {item.hasNegativeMarking ? `Yes (−${item.negativeMarkingValue})` : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-40',
      render: (item: EntranceType) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleEdit(item)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-brand-blue)',
              color: 'white',
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(item)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
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

  // ── Shared form fields renderer ─────────────────────────────────

  const renderFormFields = () => (
    <>
      <Input
        label="Entrance Name"
        type="text"
        value={formData.entranceName}
        onChange={(e) => updateField('entranceName', e.target.value)}
        required
        placeholder="e.g., IOE Entrance 2024"
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Brief description of the entrance examination"
        rows={3}
      />

      <div className="space-y-3">
        <Checkbox
          label="Has Negative Marking"
          checked={formData.hasNegativeMarking}
          onChange={(e) => {
            const checked = e.target.checked;
            setFormData(prev => ({
              ...prev,
              hasNegativeMarking: checked,
              negativeMarkingValue: checked ? prev.negativeMarkingValue : 0,
            }));
          }}
        />

        {formData.hasNegativeMarking && (
          <div className="pl-8 border-l-2 ml-2" style={{ borderColor: 'var(--color-brand-blue)' }}>
            <Input
              label="Negative Marking Value"
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.negativeMarkingValue}
              onChange={(e) =>
                updateField('negativeMarkingValue', parseFloat(e.target.value) || 0)
              }
              required
              placeholder="e.g., 0.25"
              helperText="Points deducted per wrong answer (e.g., 0.25 means −0.25 marks)"
            />
          </div>
        )}
      </div>
    </>
  );

  const renderFormActions = (
    onCancel: () => void,
    submitLabel: string,
    loadingLabel: string,
  ) => (
    <div className="flex gap-3 pt-4 border-t border-gray-100">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 px-4 py-2.5 font-semibold rounded-lg transition-all disabled:opacity-50 text-white hover:opacity-90"
        style={{ backgroundColor: 'var(--color-brand-blue)' }}
      >
        {submitting ? loadingLabel : submitLabel}
      </button>
    </div>
  );

  // ── Loading state ───────────────────────────────────────────────

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <EmptyState type="loading" message="Loading entrance types..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ── Error state ─────────────────────────────────────────────────

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)' }}
            >
              <svg className="w-8 h-8" style={{ color: 'var(--color-error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load</h2>
            <p className="text-gray-500 text-center mb-6 max-w-md">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="px-6 py-2.5 font-semibold rounded-lg transition-all text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--color-brand-blue)' }}
            >
              Try Again
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ── Main render ─────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold font-roboto"
                style={{ color: 'var(--color-brand-navy)' }}
              >
                Entrance Type Management
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Manage entrance exam types and their marking schemes
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold rounded-lg shadow-sm transition-all text-white hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: 'var(--color-brand-blue)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Entrance Type
            </button>
          </div>

          {/* Stats bar */}
          {entranceTypes.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Types</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-brand-navy)' }}>
                  {entranceTypes.length}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">With Negative Marking</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-error)' }}>
                  {entranceTypes.filter(t => t.hasNegativeMarking).length}
                </p>
              </div>
              <div className="hidden sm:block bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">No Negative Marking</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>
                  {entranceTypes.filter(t => !t.hasNegativeMarking).length}
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DataTable
              columns={columns}
              data={entranceTypes}
              keyExtractor={(item) => item.id.toString()}
              emptyMessage="No entrance types found. Click 'Add Entrance Type' to create one."
              mobileCardRender={(item) => (
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{item.entranceName}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{item.slug}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                        item.hasNegativeMarking
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.hasNegativeMarking ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      {item.hasNegativeMarking ? `−${item.negativeMarkingValue}` : 'None'}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--color-brand-blue)',
                        color: 'white',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-90"
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
          </div>
        </div>

        {/* ── Create Modal ─────────────────────────────────────────── */}
        <FormModal
          isOpen={showCreateModal}
          title="Create Entrance Type"
          onClose={() => setShowCreateModal(false)}
          size="md"
        >
          <form onSubmit={handleSubmitCreate} className="space-y-5">
            {renderFormFields()}
            {renderFormActions(() => setShowCreateModal(false), 'Create', 'Creating...')}
          </form>
        </FormModal>

        {/* ── Edit Modal ───────────────────────────────────────────── */}
        <FormModal
          isOpen={showEditModal}
          title="Edit Entrance Type"
          onClose={() => setShowEditModal(false)}
          size="md"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-5">
            {renderFormFields()}
            {renderFormActions(() => setShowEditModal(false), 'Update', 'Updating...')}
          </form>
        </FormModal>

        {/* ── Delete Confirm Modal ─────────────────────────────────── */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Entrance Type"
          message={`Are you sure you want to delete "${selectedEntranceType?.entranceName}"? This action cannot be undone. All associated question sets and templates linked to this entrance type may be affected.`}
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
