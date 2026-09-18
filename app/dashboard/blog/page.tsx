'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useBlogs } from '@/hooks/useBlogs';
import { useBlogFilters } from '@/hooks/useBlogFilters';
import { blogService } from '@/services/blog.service';
import { toast } from '@/lib/utils/toast';

export default function BlogListPage() {
  const { filters, updateFilter } = useBlogFilters();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [selectedBlogTitle, setSelectedBlogTitle] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const { blogs, loading, totalElements, totalPages, currentPage, refetch } = useBlogs({
    page,
    size: pageSize,
    sortBy: 'createdDate',
    sortDir: 'desc',
    status: filters.status || undefined,
    search: filters.search || undefined,
  });

  const handleDeleteClick = (id: number, title: string) => {
    setSelectedBlogId(id);
    setSelectedBlogTitle(title);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBlogId) return;

    setDeleting(true);
    try {
      await blogService.deleteBlog(selectedBlogId);
      toast.success('Blog post deleted successfully');
      setDeleteModalOpen(false);
      setSelectedBlogId(null);
      setSelectedBlogTitle('');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete blog post');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      published: {
        bg: 'bg-green-100',
        text: 'text-semantic-success',
        label: 'PUBLISHED',
      },
      draft: {
        bg: 'bg-amber-100',
        text: 'text-semantic-warning',
        label: 'DRAFT',
      },
      archived: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        label: 'ARCHIVED',
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const stats = {
    total: totalElements,
    published: blogs.filter(b => b.status === 'published').length,
    drafts: blogs.filter(b => b.status === 'draft').length,
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-roboto" style={{ color: 'var(--color-brand-navy)' }}>
              Blog Content Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage and curate articles for the EntranceGateway platform.
            </p>
          </div>
          <Link
            href="/dashboard/blog/create"
            className="mt-4 md:mt-0 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
            style={{
              backgroundColor: 'var(--color-brand-gold)',
              color: 'var(--color-brand-navy)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFD54F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-brand-gold)';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Post
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(26, 35, 126, 0.05)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--color-brand-navy)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                Total Posts
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--color-success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                Published
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.published}</p>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(249, 168, 37, 0.1)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--color-warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                Drafts
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.drafts}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none transition-all text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              placeholder="Search titles or keywords..."
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-600 shrink-0">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full md:w-48 border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            >
              <option value="">All Posts</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderColor: 'var(--color-brand-blue)' }}></div>
                <p className="text-gray-500">Loading blog posts...</p>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-2">No blog posts found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or create a new post</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-20">
                        ID
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                        Image
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Excerpt
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {blogs.map((blog, index) => {
                      const statusConfig = getStatusConfig(blog.status);
                      return (
                        <tr
                          key={blog.id}
                          className={`hover:bg-gray-50/80 transition-colors group ${
                            index % 2 === 1 ? 'bg-gray-50/30' : ''
                          }`}
                        >
                          <td className="px-4 md:px-6 py-4 text-sm text-gray-500 font-mono text-right">
                            #{blog.id}
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="h-10 w-16 rounded bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                              {blog.imageUrl ? (
                                <img
                                  src={blog.imageUrl}
                                  alt="post thumbnail"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="text-sm font-semibold truncate max-w-xs" style={{ color: 'var(--color-brand-navy)' }}>
                              {blog.title}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                            <div className="text-sm text-gray-500 line-clamp-1 max-w-sm">
                              {blog.excerpt}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-sm text-gray-600">
                            {new Date(blog.createdDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right space-x-2">
                            <button className="p-1.5 text-gray-400 transition-colors rounded hover:bg-brand-blue/5" style={{ color: 'var(--color-gray-400)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-brand-blue)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-gray-400)';
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <Link
                              href={`/dashboard/blog/edit/${blog.id}`}
                              className="inline-block p-1.5 text-gray-400 transition-colors rounded hover:bg-brand-navy/5"
                              style={{ color: 'var(--color-gray-400)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-brand-navy)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-gray-400)';
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(blog.id, blog.title)}
                              className="p-1.5 text-gray-400 transition-colors rounded hover:bg-semantic-error/5"
                              style={{ color: 'var(--color-gray-400)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-error)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-gray-400)';
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{blogs.length}</span> of{' '}
                  <span className="font-semibold">{totalElements}</span> elements
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 font-medium">
                    Page {currentPage + 1} of {totalPages || 1}
                  </span>
                  <div className="inline-flex rounded-md shadow-sm">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-3 py-1.5 rounded-l-lg border border-gray-300 bg-white text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                      const pageNum = i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-1.5 border-t border-b text-sm font-medium transition-colors ${
                            pageNum === 0 ? '' : 'border-l'
                          } ${
                            page === pageNum
                              ? 'bg-brand-navy text-white border-brand-navy'
                              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                          style={
                            page === pageNum
                              ? { backgroundColor: 'var(--color-brand-navy)', borderColor: 'var(--color-brand-navy)' }
                              : {}
                          }
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1.5 rounded-r-lg border border-gray-300 bg-white text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Delete Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-error)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--color-brand-navy)' }}>
                    Delete Blog Post
                  </h3>
                  <p className="text-sm text-gray-500">{selectedBlogTitle}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this blog post? This action cannot be undone and all associated data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedBlogId(null);
                    setSelectedBlogTitle('');
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-error)' }}
                >
                  {deleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
