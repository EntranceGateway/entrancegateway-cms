'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/providers/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { toast } from '@/lib/utils/toast';

const CHATBOT_SOURCE_TYPES = [
  { value: 'course', label: 'Courses' },
  { value: 'college', label: 'Colleges' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'note', label: 'Notes' },
  { value: 'old_question', label: 'Old Questions' },
  { value: 'training', label: 'Trainings' },
  { value: 'question_set', label: 'Question Sets' },
  { value: 'question', label: 'Questions' },
];

export default function DashboardPage() {
  const [chatbotSourceType, setChatbotSourceType] = useState('course');
  const [isSyncingChatbot, setIsSyncingChatbot] = useState(false);

  const handleChatbotWebhookSync = async () => {
    setIsSyncingChatbot(true);

    try {
      const response = await fetch('/api/chatbot/webhook-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source_type: chatbotSourceType }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to trigger chatbot sync');
      }

      toast.success('Chatbot sync triggered', {
        description: `${CHATBOT_SOURCE_TYPES.find(source => source.value === chatbotSourceType)?.label || chatbotSourceType} refresh webhook accepted.`,
      });
    } catch (error) {
      toast.error('Chatbot sync failed', {
        description: error instanceof Error ? error.message : 'Unable to call chatbot webhook.',
      });
    } finally {
      setIsSyncingChatbot(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 
            className="text-2xl md:text-3xl font-bold font-roboto"
            style={{ color: 'var(--color-brand-navy)' }}
          >
            Dashboard Overview
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Welcome back. Here&apos;s what&apos;s happening today at EntranceGateway.
          </p>
        </div>

        <div className="mb-6 md:mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2
                className="text-base md:text-lg font-bold"
                style={{ color: 'var(--color-brand-navy)' }}
              >
                Chatbot Knowledge Sync
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Trigger the chatbot webhook to refresh a selected knowledge source.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <label className="sr-only" htmlFor="chatbot-source-type">
                Chatbot source type
              </label>
              <select
                id="chatbot-source-type"
                value={chatbotSourceType}
                onChange={(event) => setChatbotSourceType(event.target.value)}
                disabled={isSyncingChatbot}
                className="h-10 min-w-48 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {CHATBOT_SOURCE_TYPES.map((sourceType) => (
                  <option key={sourceType.value} value={sourceType.value}>
                    {sourceType.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleChatbotWebhookSync}
                disabled={isSyncingChatbot}
                className="h-10 inline-flex items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: 'var(--color-brand-navy)' }}
              >
                <svg className={`w-4 h-4 ${isSyncingChatbot ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.9-4M4 16a8 8 0 0014.9 4" />
                </svg>
                {isSyncingChatbot ? 'Syncing' : 'Trigger Sync'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            title="Total Students"
            value="24,512"
            icon="group"
            trend={{ value: '12%', direction: 'up' }}
          />
          <StatCard
            title="Active Enrollments"
            value="1,894"
            icon="assignment"
            trend={{ value: '8%', direction: 'up' }}
          />
          <StatCard
            title="Pending Approvals"
            value="42"
            icon="pending"
            badge={{ text: 'High', variant: 'error' }}
          />
          <StatCard
            title="Total Revenue"
            value="$128,450"
            icon="payments"
          />
        </div>

        {/* Charts and Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Enrollment Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 
                className="font-bold text-base md:text-lg"
                style={{ color: 'var(--color-brand-navy)' }}
              >
                Enrollment Trends
              </h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
                  7D
                </button>
                <button 
                  className="px-3 py-1 text-xs font-semibold text-white rounded"
                  style={{ backgroundColor: 'var(--color-brand-navy)' }}
                >
                  30D
                </button>
                <button className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
                  12M
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6 flex-grow flex flex-col justify-end">
              <div className="w-full h-48 md:h-64 relative">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                  <path 
                    d="M0,80 Q50,75 100,50 T200,40 T300,20 T400,10" 
                    fill="none" 
                    stroke="#0D47A1" 
                    strokeWidth="2"
                  />
                  <path 
                    d="M0,80 Q50,75 100,50 T200,40 T300,20 T400,10 L400,100 L0,100 Z" 
                    fill="rgba(13, 71, 161, 0.05)"
                  />
                  <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="400" y1="20" y2="20" />
                  <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="400" y1="40" y2="40" />
                  <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="400" y1="60" y2="60" />
                  <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="400" y1="80" y2="80" />
                </svg>
                <div className="flex justify-between mt-4 text-[10px] text-gray-400 font-medium font-mono">
                  <span>OCT 01</span>
                  <span>OCT 08</span>
                  <span>OCT 15</span>
                  <span>OCT 22</span>
                  <span>OCT 29</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 
                className="font-bold text-lg"
                style={{ color: 'var(--color-brand-navy)' }}
              >
                Recent Activity
              </h3>
              <button 
                className="text-xs font-bold hover:underline"
                style={{ color: 'var(--color-brand-blue)' }}
              >
                View All
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <ActivityItem
                icon="person_add"
                iconBg="rgba(46, 125, 50, 0.1)"
                iconColor="var(--color-success)"
                text={
                  <>
                    <span className="font-bold">Rahul Sharma</span> enrolled in{' '}
                    <span 
                      className="font-semibold underline cursor-pointer"
                      style={{ color: 'var(--color-brand-blue)' }}
                    >
                      MBBS Advanced Path
                    </span>
                  </>
                }
                time="2 mins ago"
              />
              <ActivityItem
                icon="payments"
                iconBg="rgba(255, 193, 7, 0.1)"
                iconColor="var(--color-brand-gold)"
                text={
                  <>
                    Fee payment of{' '}
                    <span 
                      className="font-bold"
                      style={{ color: 'var(--color-success)' }}
                    >
                      ₹45,000
                    </span>{' '}
                    received from <span className="font-semibold">Priya K.</span>
                  </>
                }
                time="15 mins ago"
              />
              <ActivityItem
                icon="edit"
                iconBg="rgba(13, 71, 161, 0.1)"
                iconColor="var(--color-brand-blue)"
                text={
                  <>
                    <span className="font-bold">IIT Delhi</span> profile was updated by{' '}
                    <span className="font-semibold">Admin Alex</span>
                  </>
                }
                time="1 hour ago"
              />
              <ActivityItem
                icon="warning"
                iconBg="rgba(211, 47, 47, 0.1)"
                iconColor="var(--color-error)"
                text={
                  <>
                    System alert:{' '}
                    <span 
                      className="font-bold"
                      style={{ color: 'var(--color-error)' }}
                    >
                      Bulk upload failed
                    </span>{' '}
                    for CSV &quot;October_Leads.csv&quot;
                  </>
                }
                time="3 hours ago"
              />
              <ActivityItem
                icon="article"
                iconBg="rgba(13, 71, 161, 0.1)"
                iconColor="var(--color-brand-blue)"
                text={
                  <>
                    New blog post <span className="italic">&quot;Top Engineering Trends&quot;</span> published
                  </>
                }
                time="5 hours ago"
              />
            </div>
          </div>
        </div>

        {/* Recent Student Enquiries Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 
              className="font-bold text-lg"
              style={{ color: 'var(--color-brand-navy)' }}
            >
              Recent Student Enquiries
            </h3>
            <button 
              className="text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{ backgroundColor: 'var(--color-brand-navy)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-brand-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-brand-navy)';
              }}
            >
              Export Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">College Preference</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <TableRow
                  name="Aditya Verma"
                  college="AIIMS Delhi"
                  status="Verified"
                  statusVariant="success"
                  date="Oct 28, 2024"
                />
                <TableRow
                  name="Sneha Kapur"
                  college="IIT Bombay"
                  status="Reviewing"
                  statusVariant="warning"
                  date="Oct 27, 2024"
                />
                <TableRow
                  name="Vikram Singh"
                  college="BITS Pilani"
                  status="Draft"
                  statusVariant="neutral"
                  date="Oct 27, 2024"
                />
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

interface ActivityItemProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  text: React.ReactNode;
  time: string;
}

function ActivityItem({ icon, iconBg, iconColor, text, time }: ActivityItemProps) {
  return (
    <div className="flex gap-4">
      <div 
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <svg 
          className="w-4 h-4"
          style={{ color: iconColor }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {getActivityIcon(icon)}
        </svg>
      </div>
      <div>
        <p className="text-xs text-gray-900 leading-normal">{text}</p>
        <p className="text-[10px] text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

function getActivityIcon(icon: string): React.ReactElement {
  const icons: Record<string, React.ReactElement> = {
    person_add: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
    payments: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    article: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  };
  return icons[icon] || icons.person_add;
}

interface TableRowProps {
  name: string;
  college: string;
  status: string;
  statusVariant: 'success' | 'warning' | 'neutral';
  date: string;
}

function TableRow({ name, college, status, statusVariant, date }: TableRowProps) {
  const statusColors = {
    success: { bg: 'rgba(46, 125, 50, 0.1)', text: 'var(--color-success)' },
    warning: { bg: 'rgba(249, 168, 37, 0.1)', text: 'var(--color-warning)' },
    neutral: { bg: 'var(--color-gray-100)', text: 'var(--color-gray-500)' },
  };

  return (
    <tr className="text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <td 
        className="px-6 py-4 font-medium"
        style={{ color: 'var(--color-brand-navy)' }}
      >
        {name}
      </td>
      <td className="px-6 py-4">{college}</td>
      <td className="px-6 py-4">
        <span 
          className="px-2 py-1 text-[10px] font-bold rounded"
          style={{
            backgroundColor: statusColors[statusVariant].bg,
            color: statusColors[statusVariant].text,
          }}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4 font-mono text-[11px]">{date}</td>
      <td className="px-6 py-4">
        <button className="text-gray-400 hover:text-brand-blue">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
