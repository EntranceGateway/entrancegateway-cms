'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useEntranceTypes } from '@/hooks/useEntranceTypes';
import { useCategories } from '@/hooks/useCategories';
import { topicService } from '@/services/topic.service';
import { toast } from '@/lib/utils/toast';
import type { Topic, TopicFormData, TopicApiResponse } from '@/types/topic.types';

const INITIAL_FORM_DATA: TopicFormData = {
  topicName: '',
  description: '',
  categoryId: null,
  parentTopicId: null,
};

export default function TopicsPage() {
  // ── Data Sources ─────────────────────────────────────────────
  const { entranceTypes, loading: entranceLoading } = useEntranceTypes();
  const { categories, loading: categoriesLoading } = useCategories({ page: 0, size: 100 });

  // ── State ────────────────────────────────────────────────────
  const [selectedEntranceSlug, setSelectedEntranceSlug] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState<TopicFormData>(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch Topics ─────────────────────────────────────────────

  const fetchTopics = useCallback(async () => {
    if (!selectedEntranceSlug) {
      setTopics([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const categoryId = selectedCategoryFilter ? parseInt(selectedCategoryFilter) : null;
      
      const result = categoryId
        ? await topicService.getTopicsByEntranceAndCategory(selectedEntranceSlug, categoryId, { silent: false })
        : await topicService.getTopicsByEntranceSlug(selectedEntranceSlug, { silent: false });

      const transformed: Topic[] = result.map((t: TopicApiResponse) => ({
        id: t.topicId,
        topicName: t.topicName,
        description: t.description || '',
        category: {
          id: t.categoryId,
          name: t.categoryName,
        },
        parentTopic: t.parentTopicId ? {
          id: t.parentTopicId,
          name: t.parentTopicName || '',
        } : null,
      }));

      setTopics(transformed);
    } catch {
      setError('Unable to load topics. Please try again later.');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEntranceSlug, selectedCategoryFilter]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Auto-select first entrance type
  useEffect(() => {
    if (entranceTypes.length > 0 && !selectedEntranceSlug) {
      setSelectedEntranceSlug(entranceTypes[0].slug);
    }
  }, [entranceTypes, selectedEntranceSlug]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleCreate = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowCreateModal(true);
  };

  const handleEdit = (topic: Topic) => {
    setSelectedTopic(topic);
    setFormData({
      topicName: topic.topicName,
      description: topic.description,
      categoryId: topic.category.id,
      parentTopicId: topic.parentTopic?.id || null,
    });
    setShowEditModal(true);
  };

  const handleDelete = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topicName.trim()) {
      toast.warning('Topic name is required');
      return;
    }
    if (!formData.categoryId) {
      toast.warning('Category is required');
      return;
    }

    setSubmitting(true);

    try {
      const result = await topicService.createTopics([{
        topicName: formData.topicName.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        parentTopicId: formData.parentTopicId || undefined,
      }]);

      if (result.success) {
        toast.success(result.message || 'Topic created successfully');
        setShowCreateModal(false);
        fetchTopics();
      } else {
        toast.error(result.error || 'Failed to create topic');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;

    if (!formData.topicName.trim()) {
      toast.warning('Topic name is required');
      return;
    }
    if (!formData.categoryId) {
      toast.warning('Category is required');
      return;
    }

    setSubmitting(true);

    try {
      const result = await topicService.updateTopic(selectedTopic.id, {
        topicName: formData.topicName.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        parentTopicId: formData.parentTopicId,
      });

      if (result.success) {
        toast.success(result.message || 'Topic updated successfully');
        setShowEditModal(false);
        fetchTopics();
      } else {
        toast.error(result.error || 'Failed to update topic');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTopic) return;

    setDeleting(true);

    try {
      const result = await topicService.deleteTopic(selectedTopic.id);

      if (result.success) {
        toast.success('Topic deleted successfully');
        setShowDeleteModal(false);
        fetchTopics();
      } else {
        toast.error(result.error || 'Failed to delete topic');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────────

  const totalTopics = topics.length;
  const uniqueCategories = new Set(topics.map(t => t.category.id)).size;
  const withParent = topics.filter(t => t.parentTopic !== null).length;

  // ── Render ───────────────────────────────────────────────────

  if (entranceLoading || categoriesLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <EmptyState type="loading" message="Loading data..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold font-roboto"
                style={{ color: 'var(--color-brand-navy)' }}
              >
                Topic Management
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Organize topics by entrance type and category
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={!selectedEntranceSlug}
              className="px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-brand-blue)' }}
            >
              Add Topic
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrance Type
                </label>
                <select
                  value={selectedEntranceSlug}
                  onChange={(e) => {
                    setSelectedEntranceSlug(e.target.value);
                    setSelectedCategoryFilter('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm"
                >
                  <option value="">Select Entrance Type</option>
                  {entranceTypes.map((et) => (
                    <option key={et.id} value={et.slug}>
                      {et.entranceName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category (Optional)
                </label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  disabled={!selectedEntranceSlug}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm disabled:opacity-50"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {selectedEntranceSlug && !loading && !error && topics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(13, 71, 161, 0.1)' }}
                  >
                    <span className="material-icons text-xl" style={{ color: 'var(--color-brand-navy)' }}>
                      topic
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-brand-navy)' }}>
                      {totalTopics}
                    </p>
                    <p className="text-xs text-gray-500">Total Topics</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)' }}
                  >
                    <span className="material-icons text-xl" style={{ color: 'var(--color-success)' }}>
                      category
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                      {uniqueCategories}
                    </p>
                    <p className="text-xs text-gray-500">Categories</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(249, 168, 37, 0.1)' }}
                  >
                    <span className="material-icons text-xl" style={{ color: 'var(--color-warning)' }}>
                      account_tree
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
                      {withParent}
                    </p>
                    <p className="text-xs text-gray-500">Sub-Topics</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!selectedEntranceSlug ? (
            <EmptyState
              type="empty"
              message="Select an entrance type to view topics"
            />
          ) : loading ? (
            <EmptyState type="loading" message="Loading topics..." />
          ) : error ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchTopics}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors"
                style={{ backgroundColor: 'var(--color-brand-blue)' }}
              >
                Try Again
              </button>
            </div>
          ) : topics.length === 0 ? (
            <EmptyState
              type="empty"
              message="No topics found for this selection"
              action={{
                label: 'Add First Topic',
                onClick: handleCreate,
              }}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Topic Name
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Category
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Parent Topic
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Description
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topics.map((topic, index) => (
                      <tr
                        key={topic.id}
                        className={`transition-colors hover:bg-gray-50/80 ${index % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{topic.topicName}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[180px]">
                              {topic.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2.5 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: 'rgba(13, 71, 161, 0.08)',
                              color: 'var(--color-brand-navy)',
                            }}
                          >
                            {topic.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {topic.parentTopic ? (
                            <span className="text-sm text-gray-700">{topic.parentTopic.name}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 line-clamp-2 max-w-[250px]">
                            {topic.description || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(topic)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                              style={{
                                backgroundColor: 'rgba(13, 71, 161, 0.08)',
                                color: 'var(--color-brand-navy)',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(topic)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-white"
                              style={{ backgroundColor: 'var(--color-error)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-base truncate"
                          style={{ color: 'var(--color-brand-navy)' }}
                        >
                          {topic.topicName}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                          {topic.id}
                        </p>
                      </div>
                      <span
                        className="px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: 'rgba(13, 71, 161, 0.08)',
                          color: 'var(--color-brand-navy)',
                        }}
                      >
                        {topic.category.name}
                      </span>
                    </div>

                    {topic.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{topic.description}</p>
                    )}

                    <div className="space-y-1.5 mb-3">
                      {topic.parentTopic && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Parent:</span>
                          <span className="text-gray-700 font-medium">{topic.parentTopic.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(topic)}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg text-center transition-colors"
                        style={{
                          backgroundColor: 'rgba(13, 71, 161, 0.08)',
                          color: 'var(--color-brand-navy)',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(topic)}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg text-center text-white transition-colors"
                        style={{ backgroundColor: 'var(--color-error)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Create Modal */}
        <FormModal
          isOpen={showCreateModal}
          title="Create Topic"
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <Input
              label="Topic Name"
              value={formData.topicName}
              onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
              required
              placeholder="e.g. Quantum Physics"
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the topic"
              rows={3}
            />

            <Select
              label="Category"
              options={[
                { value: '', label: 'Select Category' },
                ...categories.map((cat) => ({
                  value: cat.id.toString(),
                  label: cat.categoryName,
                })),
              ]}
              value={formData.categoryId?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categoryId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />

            <Select
              label="Parent Topic (Optional)"
              options={[
                { value: '', label: 'None (Root Topic)' },
                ...topics
                  .filter((t) => t.id !== selectedTopic?.id)
                  .map((t) => ({
                    value: t.id,
                    label: t.topicName,
                  })),
              ]}
              value={formData.parentTopicId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentTopicId: e.target.value || null,
                })
              }
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
                {submitting ? 'Creating...' : 'Create Topic'}
              </button>
            </div>
          </form>
        </FormModal>

        {/* Edit Modal */}
        <FormModal
          isOpen={showEditModal}
          title="Edit Topic"
          onClose={() => setShowEditModal(false)}
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <Input
              label="Topic Name"
              value={formData.topicName}
              onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
              required
              placeholder="e.g. Quantum Physics"
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the topic"
              rows={3}
            />

            <Select
              label="Category"
              options={[
                { value: '', label: 'Select Category' },
                ...categories.map((cat) => ({
                  value: cat.id.toString(),
                  label: cat.categoryName,
                })),
              ]}
              value={formData.categoryId?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categoryId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />

            <Select
              label="Parent Topic (Optional)"
              options={[
                { value: '', label: 'None (Root Topic)' },
                ...topics
                  .filter((t) => t.id !== selectedTopic?.id)
                  .map((t) => ({
                    value: t.id,
                    label: t.topicName,
                  })),
              ]}
              value={formData.parentTopicId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentTopicId: e.target.value || null,
                })
              }
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
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </FormModal>

        {/* Delete Confirm */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Topic"
          message={`Are you sure you want to delete "${selectedTopic?.topicName}"? This action cannot be undone.`}
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
