'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useQuestionSets } from '@/hooks/useQuestionSets';
import { useCourses } from '@/hooks/useCourses';
import { useEntranceTypes } from '@/hooks/useEntranceTypes';
import { questionSetService } from '@/services/questionSet.service';
import { toast } from '@/lib/utils/toast';
import { formatDuration, parseDurationToMinutes } from '@/lib/utils/duration';
import type { QuestionSet, QuestionSetFormData } from '@/types/quiz.types';

function QuestionSetsContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [courseFilter, setCourseFilter] = useState<number | null>(
    searchParams.get('courseId') ? parseInt(searchParams.get('courseId')!) : null
  );
  const [entranceTypeFilter, setEntranceTypeFilter] = useState<number | null>(null);

  const { questionSets, loading, totalElements, totalPages, currentPage, refetch } = useQuestionSets({
    page,
    size: pageSize,
    courseId: courseFilter || undefined,
    entranceTypeId: entranceTypeFilter || undefined,
  });

  const { courses } = useCourses({ page: 0, size: 100 });
  const { entranceTypes } = useEntranceTypes();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<QuestionSet | null>(null);
  const [formData, setFormData] = useState<QuestionSetFormData>({
    setName: '',
    nosOfQuestions: 0,
    durationInMinutes: 60,
    description: '',
    price: 0,
    courseId: null,
    entranceTypeId: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setFormData({
      setName: '',
      nosOfQuestions: 0,
      durationInMinutes: 60,
      description: '',
      price: 0,
      courseId: courseFilter,
      entranceTypeId: null,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setFormData({
      setName: questionSet.setName,
      nosOfQuestions: questionSet.nosOfQuestions,
      durationInMinutes: parseDurationToMinutes(questionSet.duration),
      description: questionSet.description || '',
      price: questionSet.price,
      courseId: questionSet.course?.id || null,
      entranceTypeId: questionSet.entranceType?.id || null,
    });
    setShowEditModal(true);
  };

  const handleDelete = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await questionSetService.createQuestionSet(formData);

    if (success) {
      toast.success('Question set created successfully');
      setShowCreateModal(false);
      refetch();
    } else {
      toast.error('Failed to create question set');
    }

    setSubmitting(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionSet) return;

    setSubmitting(true);

    const success = await questionSetService.updateQuestionSet(selectedQuestionSet.id, formData);

    if (success) {
      toast.success('Question set updated successfully');
      setShowEditModal(false);
      refetch();
    } else {
      toast.error('Failed to update question set');
    }

    setSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuestionSet) return;

    setDeleting(true);

    const success = await questionSetService.deleteQuestionSet(selectedQuestionSet.id);

    if (success) {
      toast.success('Question set deleted successfully');
      setShowDeleteModal(false);
      refetch();
    } else {
      toast.error('Failed to delete question set');
    }

    setDeleting(false);
  };

  const handleCourseFilterChange = (value: string) => {
    const courseId = value ? parseInt(value) : null;
    setCourseFilter(courseId);
    setPage(0);
  };

  const handleEntranceTypeFilterChange = (value: string) => {
    const entranceTypeId = value ? parseInt(value) : null;
    setEntranceTypeFilter(entranceTypeId);
    setPage(0);
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      className: 'w-20',
    },
    {
      key: 'setName',
      label: 'Set Name',
    },
    {
      key: 'nosOfQuestions',
      label: 'Questions',
      className: 'w-28',
    },
    {
      key: 'duration',
      label: 'Duration',
      className: 'w-28',
      render: (set: QuestionSet) => formatDuration(set.duration),
    },
    {
      key: 'price',
      label: 'Price',
      className: 'w-28',
      render: (set: QuestionSet) => (
        <span className={set.price === 0 ? 'text-green-600 font-semibold' : ''}>
          {set.price === 0 ? 'Free' : `Rs. ${set.price}`}
        </span>
      ),
    },
    {
      key: 'course',
      label: 'Course',
      className: 'w-40',
      render: (set: QuestionSet) => set.course?.courseName || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-56',
      render: (set: QuestionSet) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/question-sets/${set.id}/questions`}
            className="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--color-success)',
              color: 'white',
            }}
          >
            Questions
          </Link>
          <button
            onClick={() => handleEdit(set)}
            className="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--color-brand-blue)',
              color: 'white',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(set)}
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
          <EmptyState type="loading" message="Loading question sets..." />
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
                Question Set Management
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Manage quiz question sets and their configurations
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors text-white"
              style={{ backgroundColor: 'var(--color-brand-blue)' }}
            >
              Create Question Set
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Filter by Course"
                options={[
                  { value: '', label: 'All Courses' },
                  ...courses.map((course) => ({
                    value: course.id.toString(),
                    label: course.courseName,
                  })),
                ]}
                value={courseFilter?.toString() || ''}
                onChange={(e) => handleCourseFilterChange(e.target.value)}
              />

              <Select
                label="Filter by Entrance Type"
                options={[
                  { value: '', label: 'All Entrance Types' },
                  ...entranceTypes.map((type) => ({
                    value: type.id.toString(),
                    label: type.entranceName,
                  })),
                ]}
                value={entranceTypeFilter?.toString() || ''}
                onChange={(e) => handleEntranceTypeFilterChange(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DataTable
              columns={columns}
              data={questionSets}
              keyExtractor={(set) => set.id.toString()}
              emptyMessage="No question sets found"
              mobileCardRender={(set) => (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{set.setName}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {set.id}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        set.price === 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {set.price === 0 ? 'Free' : `Rs. ${set.price}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Questions: </span>
                      <span className="font-semibold">{set.nosOfQuestions}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration: </span>
                      <span className="font-semibold">{formatDuration(set.duration)}</span>
                    </div>
                  </div>
                  {set.course && (
                    <div className="text-sm">
                      <span className="text-gray-500">Course: </span>
                      <span className="font-semibold">{set.course.courseName}</span>
                    </div>
                  )}
                  {set.entranceType && (
                    <div className="text-sm">
                      <span className="text-gray-500">Entrance: </span>
                      <span className="font-semibold">{set.entranceType.entranceName}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Link
                      href={`/dashboard/question-sets/${set.id}/questions`}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-center"
                      style={{
                        backgroundColor: 'var(--color-success)',
                        color: 'white',
                      }}
                    >
                      Questions
                    </Link>
                    <button
                      onClick={() => handleEdit(set)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--color-brand-blue)',
                        color: 'white',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(set)}
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
          title="Create Question Set"
          onClose={() => setShowCreateModal(false)}
          size="lg"
        >
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <Input
              label="Set Name"
              type="text"
              value={formData.setName}
              onChange={(e) => setFormData({ ...formData, setName: e.target.value })}
              required
              placeholder="e.g., BSc CSIT Model Set 1"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Number of Questions"
                type="number"
                min="1"
                value={formData.nosOfQuestions || ''}
                onChange={(e) =>
                  setFormData({ ...formData, nosOfQuestions: parseInt(e.target.value) || 0 })
                }
                required
                placeholder="e.g., 100"
              />

              <Input
                label="Duration (minutes)"
                type="number"
                min="1"
                value={formData.durationInMinutes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, durationInMinutes: parseInt(e.target.value) || 60 })
                }
                required
                placeholder="e.g., 60"
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of the question set"
              rows={3}
            />

            <Input
              label="Price (Rs.)"
              type="number"
              step="0.01"
              min="0"
              value={formData.price ?? ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              required
              placeholder="Set to 0 for free quiz"
            />

            <Select
              label="Course"
              options={[
                { value: '', label: 'Select Course' },
                ...courses.map((course) => ({
                  value: course.id.toString(),
                  label: course.courseName,
                })),
              ]}
              value={formData.courseId?.toString() || ''}
              onChange={(e) =>
                setFormData({ ...formData, courseId: e.target.value ? parseInt(e.target.value) : null })
              }
            />

            <Select
              label="Entrance Type (Optional)"
              options={[
                { value: '', label: 'Select Entrance Type' },
                ...entranceTypes.map((type) => ({
                  value: type.id.toString(),
                  label: type.entranceName,
                })),
              ]}
              value={formData.entranceTypeId?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entranceTypeId: e.target.value ? parseInt(e.target.value) : null,
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
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </FormModal>

        <FormModal
          isOpen={showEditModal}
          title="Edit Question Set"
          onClose={() => setShowEditModal(false)}
          size="lg"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <Input
              label="Set Name"
              type="text"
              value={formData.setName}
              onChange={(e) => setFormData({ ...formData, setName: e.target.value })}
              required
              placeholder="e.g., BSc CSIT Model Set 1"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Number of Questions"
                type="number"
                min="1"
                value={formData.nosOfQuestions || ''}
                onChange={(e) =>
                  setFormData({ ...formData, nosOfQuestions: parseInt(e.target.value) || 0 })
                }
                required
                placeholder="e.g., 100"
              />

              <Input
                label="Duration (minutes)"
                type="number"
                min="1"
                value={formData.durationInMinutes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, durationInMinutes: parseInt(e.target.value) || 60 })
                }
                required
                placeholder="e.g., 60"
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of the question set"
              rows={3}
            />

            <Input
              label="Price (Rs.)"
              type="number"
              step="0.01"
              min="0"
              value={formData.price ?? ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              required
              placeholder="Set to 0 for free quiz"
            />

            <Select
              label="Course"
              options={[
                { value: '', label: 'Select Course' },
                ...courses.map((course) => ({
                  value: course.id.toString(),
                  label: course.courseName,
                })),
              ]}
              value={formData.courseId?.toString() || ''}
              onChange={(e) =>
                setFormData({ ...formData, courseId: e.target.value ? parseInt(e.target.value) : null })
              }
            />

            <Select
              label="Entrance Type (Optional)"
              options={[
                { value: '', label: 'Select Entrance Type' },
                ...entranceTypes.map((type) => ({
                  value: type.id.toString(),
                  label: type.entranceName,
                })),
              ]}
              value={formData.entranceTypeId?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entranceTypeId: e.target.value ? parseInt(e.target.value) : null,
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
                {submitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </FormModal>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Question Set"
          message={`Are you sure you want to delete "${selectedQuestionSet?.setName}"? This will also delete all associated questions. This action cannot be undone.`}
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

export default function QuestionSetsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <EmptyState type="loading" message="Loading question sets..." />
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <QuestionSetsContent />
    </Suspense>
  );
}
