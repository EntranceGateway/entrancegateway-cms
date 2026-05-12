'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { MathPreview } from '@/components/ui/MathPreview';
import { MathToolbar } from '@/components/ui/MathToolbar';
import { useQuestions } from '@/hooks/useQuestions';
import { useCategories } from '@/hooks/useCategories';
import { questionService } from '@/services/question.service';
import { questionSetService } from '@/services/questionSet.service';
import { toast } from '@/lib/utils/toast';
import type { Question, QuestionFormData } from '@/types/quiz.types';

export default function QuestionsPage() {
  const params = useParams();
  const questionSetId = parseInt(params.id as string);

  const { questions, loading, refetch } = useQuestions(questionSetId);
  const { categories } = useCategories({ page: 0, size: 100 });

  const [questionSetName, setQuestionSetName] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editorMode, setEditorMode] = useState<'normal' | 'math'>('normal');
  const questionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const optionTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([null, null, null, null]);
  const [formData, setFormData] = useState<QuestionFormData>({
    question: '',
    marks: 1,
    categoryId: null,
    questionSetId: questionSetId,
    topicId: null,
    topicName: null,
    options: [
      { optionText: '', optionOrder: 0, correct: false },
      { optionText: '', optionOrder: 1, correct: false },
      { optionText: '', optionOrder: 2, correct: false },
      { optionText: '', optionOrder: 3, correct: false },
    ],
  });
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);
  const [optionImages, setOptionImages] = useState<(File | null)[]>([null, null, null, null]);
  const [optionImagePreviews, setOptionImagePreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const questionTextareaRefCallback = useCallback((el: HTMLTextAreaElement | null) => {
    questionTextareaRef.current = el;
  }, []);

  const optionTextareaRefCallback = useCallback(
    (index: number) => (el: HTMLTextAreaElement | null) => {
      optionTextareaRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    const loadQuestionSet = async () => {
      const set = await questionSetService.getQuestionSetById(questionSetId);
      if (set) {
        setQuestionSetName(set.setName);
      }
    };
    loadQuestionSet();
  }, [questionSetId]);

  const handleCreate = () => {
    setFormData({
      question: '',
      marks: 1,
      categoryId: null,
      questionSetId: questionSetId,
      topicId: null,
      topicName: null,
      options: [
        { optionText: '', optionOrder: 0, correct: false },
        { optionText: '', optionOrder: 1, correct: false },
        { optionText: '', optionOrder: 2, correct: false },
        { optionText: '', optionOrder: 3, correct: false },
      ],
    });
    setQuestionImage(null);
    setQuestionImagePreview(null);
    setOptionImages([null, null, null, null]);
    setOptionImagePreviews([null, null, null, null]);
    setEditorMode('normal');
    setShowCreateModal(true);
  };

  const handleDelete = (question: Question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  const handleQuestionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setQuestionImage(file);
    if (file) {
      setQuestionImagePreview(URL.createObjectURL(file));
    } else {
      setQuestionImagePreview(null);
    }
  };

  const handleOptionImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const newImages = [...optionImages];
    newImages[index] = file;
    setOptionImages(newImages);

    const newPreviews = [...optionImagePreviews];
    if (file) {
      newPreviews[index] = URL.createObjectURL(file);
    } else {
      newPreviews[index] = null;
    }
    setOptionImagePreviews(newPreviews);
  };

  const handleOptionChange = (index: number, field: 'optionText' | 'correct', value: string | boolean) => {
    const newOptions = [...formData.options];
    if (field === 'correct' && value === true) {
      newOptions.forEach((opt, i) => {
        opt.correct = i === index;
      });
    } else if (field === 'optionText') {
      newOptions[index].optionText = value as string;
    } else if (field === 'correct') {
      newOptions[index].correct = value as boolean;
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasCorrectAnswer = formData.options.some((opt) => opt.correct);
    if (!hasCorrectAnswer) {
      toast.error('Please mark at least one option as correct');
      return;
    }

    setSubmitting(true);

    const result = await questionService.createQuestion(formData, questionImage, optionImages);

    if (result.success) {
      toast.success('Question created successfully');
      setShowCreateModal(false);
      refetch();
    } else {
      toast.error(result.error || 'Failed to create question');
    }

    setSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuestion) return;

    setDeleting(true);

    const result = await questionService.deleteQuestion(selectedQuestion.id);

    if (result.success) {
      toast.success('Question deleted successfully');
      setShowDeleteModal(false);
      refetch();
    } else {
      toast.error(result.error || 'Failed to delete question');
    }

    setDeleting(false);
  };

  const getOptionLabel = (index: number): string => {
    return String.fromCharCode(65 + index);
  };

  const handleMathInsert = useCallback((latex: string, targetRef: HTMLTextAreaElement | null) => {
    if (!targetRef) return;

    const start = targetRef.selectionStart;
    const end = targetRef.selectionEnd;
    const currentValue = targetRef.value;

    const newValue = currentValue.slice(0, start) + latex + currentValue.slice(end);
    const newCursorPos = start + latex.length;

    targetRef.value = newValue;
    targetRef.focus();
    targetRef.setSelectionRange(newCursorPos, newCursorPos);

    const changeEvent = new Event('change', { bubbles: true });
    targetRef.dispatchEvent(changeEvent);

    if (targetRef === questionTextareaRef.current) {
      setFormData((prev) => ({ ...prev, question: newValue }));
    } else {
      const optionIndex = optionTextareaRefs.current.findIndex((ref) => ref === targetRef);
      if (optionIndex !== -1) {
        setFormData((prev) => {
          const newOptions = [...prev.options];
          newOptions[optionIndex].optionText = newValue;
          return { ...prev, options: newOptions };
        });
      }
    }
  }, []);

  const handleQuestionMathInsert = useCallback((latex: string) => {
    handleMathInsert(latex, questionTextareaRef.current);
  }, [handleMathInsert]);

  const handleOptionMathInsert = useCallback((index: number, latex: string) => {
    handleMathInsert(latex, optionTextareaRefs.current[index]);
  }, [handleMathInsert]);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <EmptyState type="loading" message="Loading questions..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="mb-6">
            <Link
              href="/dashboard/question-sets"
              className="flex items-center font-semibold hover:underline transition-all text-sm md:text-base mb-4"
              style={{ color: 'var(--color-brand-navy)' }}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Question Sets
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold font-roboto"
                style={{ color: 'var(--color-brand-navy)' }}
              >
                Questions: {questionSetName}
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Manage questions for this question set
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors text-white"
              style={{ backgroundColor: 'var(--color-brand-blue)' }}
            >
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              type="empty"
              message="No questions found"
              action={{
                label: 'Add First Question',
                onClick: handleCreate,
              }}
            />
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: 'var(--color-brand-navy)' }}
                      >
                        Q{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--color-brand-gold)',
                            color: 'var(--color-brand-navy)',
                          }}
                        >
                          {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                          {question.category.categoryName}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(question)}
                      className="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--color-error)',
                        color: 'white',
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="text-gray-900 whitespace-pre-wrap">
                      <MathRenderer text={question.question} />
                    </div>
                    {question.questionImageName && (
                      <div className="mt-3 relative w-full max-w-md">
                        <Image
                          src={question.questionImageName}
                          alt="Question"
                          width={400}
                          height={300}
                          className="rounded-lg border border-gray-200"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border-2 ${
                          option.correct
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold flex-shrink-0 ${
                              option.correct
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }`}
                          >
                            {getOptionLabel(option.optionOrder)}
                          </span>
                          <div className="flex-1">
                            <div className="text-gray-900">
                              <MathRenderer text={option.optionText} />
                            </div>
                            {option.optionImageName && (
                              <div className="mt-2 relative w-full max-w-xs">
                                <Image
                                  src={option.optionImageName}
                                  alt={`Option ${getOptionLabel(option.optionOrder)}`}
                                  width={200}
                                  height={150}
                                  className="rounded border border-gray-200"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                          {option.correct && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-500 text-white flex-shrink-0">
                              Correct
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormModal
          isOpen={showCreateModal}
          title="Create Question"
          onClose={() => setShowCreateModal(false)}
          size="xl"
        >
          <form onSubmit={handleSubmitCreate} className="space-y-6">
            <div className="flex gap-2 border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setEditorMode('normal')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                  editorMode === 'normal'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Normal Editor
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('math')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                  editorMode === 'math'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Math Editor
              </button>
            </div>

            {editorMode === 'math' && (
              <div className="mb-4">
                <MathToolbar onInsert={handleQuestionMathInsert} />
              </div>
            )}

            <div>
              <Textarea
                label="Question Text"
                value={formData.question}
                onChange={(e) => {
                  setFormData({ ...formData, question: e.target.value });
                }}
                ref={questionTextareaRefCallback}
                required
                placeholder={
                  editorMode === 'math'
                    ? 'Enter the question text. Click symbols above to insert math'
                    : 'Enter the question text. Use $...$ for inline math, $$...$$ for block math'
                }
                rows={4}
              />
              {editorMode === 'normal' && (
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Tip: Use $x^2$ for inline math or $$\int_0^1 x^2 dx$$ for block math
                </p>
              )}
              <MathPreview text={formData.question} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQuestionImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {questionImagePreview && (
                <div className="mt-3 relative w-full max-w-md">
                  <Image
                    src={questionImagePreview}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="rounded-lg border border-gray-200"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Marks"
                type="number"
                min="1"
                value={formData.marks || ''}
                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                required
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
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-brand-navy)' }}>
                Options
              </h3>
              <div className="space-y-4">
                {formData.options.map((option, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: 'var(--color-brand-blue)' }}
                      >
                        {getOptionLabel(index)}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.correct}
                          onChange={(e) => handleOptionChange(index, 'correct', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Correct Answer</span>
                      </label>
                    </div>

                    {editorMode === 'math' && (
                      <div className="mb-3">
                        <MathToolbar onInsert={(latex) => handleOptionMathInsert(index, latex)} />
                      </div>
                    )}

                    <div>
                      <Textarea
                        label={`Option ${getOptionLabel(index)} Text`}
                        value={option.optionText}
                        onChange={(e) => {
                          handleOptionChange(index, 'optionText', e.target.value);
                        }}
                        ref={optionTextareaRefCallback(index)}
                        required
                        placeholder={
                          editorMode === 'math'
                            ? `Enter option ${getOptionLabel(index)}. Click symbols above to insert math`
                            : `Enter option ${getOptionLabel(index)}. Use $...$ for math`
                        }
                        rows={2}
                      />
                      <MathPreview text={option.optionText} />
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageChange(index, e)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {optionImagePreviews[index] && (
                        <div className="mt-2 relative w-full max-w-xs">
                          <Image
                            src={optionImagePreviews[index]!}
                            alt={`Option ${getOptionLabel(index)} preview`}
                            width={200}
                            height={150}
                            className="rounded border border-gray-200"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
                {submitting ? 'Creating...' : 'Create Question'}
              </button>
            </div>
          </form>
        </FormModal>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Question"
          message="Are you sure you want to delete this question? This action cannot be undone."
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
