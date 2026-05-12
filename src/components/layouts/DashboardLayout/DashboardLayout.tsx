'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import { toast } from '@/lib/utils/toast';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { DashboardLayoutProps, NavItem, UserProfile } from './DashboardLayout.types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Users', href: '/dashboard/users', icon: 'people' },
  { label: 'Colleges', href: '/dashboard/colleges', icon: 'account_balance' },
  { label: 'Courses', href: '/dashboard/courses', icon: 'book' },
  { label: 'Syllabus', href: '/dashboard/syllabus', icon: 'menu_book' },
  { label: 'Notes', href: '/dashboard/notes', icon: 'sticky_note' },
  { label: 'Old Questions', href: '/dashboard/old-questions', icon: 'history_edu' },
  { label: 'Categories', href: '/dashboard/categories', icon: 'category' },
  { label: 'Entrance Types', href: '/dashboard/entrance-types', icon: 'school' },
  { label: 'Topics', href: '/dashboard/topics', icon: 'topic' },
  { 
    label: 'Quiz', 
    icon: 'quiz',
    children: [
      { label: 'Question Sets', href: '/dashboard/question-sets', icon: 'list_alt' },
      { label: 'Quiz Templates', href: '/dashboard/quiz-templates', icon: 'settings' },
      { label: 'Quiz Attempts', href: '/dashboard/quiz-attempts', icon: 'assignment_turned_in' },
      { label: 'Quiz Purchases', href: '/dashboard/quiz-purchases', icon: 'receipt' },
      { label: 'Quiz Analytics', href: '/dashboard/analytics', icon: 'bar_chart' },
    ],
  },
  { 
    label: 'Training', 
    icon: 'fitness_center',
    children: [
      { label: 'Trainings', href: '/dashboard/training', icon: 'model_training' },
      { label: 'Enrollments', href: '/dashboard/enrollments', icon: 'how_to_reg' },
    ],
  },
  { label: 'Blog', href: '/dashboard/blog', icon: 'article' },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: 'policy' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userProfile: UserProfile = {
    name: 'System Admin',
    email: 'admin@entrancegateway.com',
    role: 'Super Admin',
    initials: 'SA',
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        navItems={navItems} 
        userProfile={userProfile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      
      <div className="flex-grow flex flex-col lg:ml-64 overflow-hidden">
        {/* Header - Hidden on mobile and tablet */}
        <div className="hidden lg:block">
          <Header userProfile={userProfile} onLogout={handleLogout} />
        </div>
        
        <main className="flex-grow overflow-y-auto">
          {/* Mobile Menu Button - Scrolls with content */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-brand-navy)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span 
              className="font-bold text-lg font-roboto"
              style={{ color: 'var(--color-brand-navy)' }}
            >
              EntranceGateway
            </span>
            <div className="w-10"></div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-gray-400 text-center md:text-left">
            © 2024 EntranceGateway Education Pvt Ltd. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-[11px] text-gray-500 hover:text-brand-navy transition-colors">
              Help Center
            </a>
            <a href="#" className="text-[11px] text-gray-500 hover:text-brand-navy transition-colors">
              Privacy Policy
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
