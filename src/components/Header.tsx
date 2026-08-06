'use client';

import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useState, useEffect } from 'react';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [adminContact, setAdminContact] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuTimer, setMenuTimer] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/site-info')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAdminContact(result.data.adminContact || '');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Gallery</span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              首页
            </Link>
            <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
              帮助
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link href="/admin" className="text-primary-600 hover:text-primary-700 font-medium">
                    管理后台
                  </Link>
                )}
                <div
                  className="relative"
                  onMouseEnter={() => { setUserMenuOpen(true); if (menuTimer) clearTimeout(menuTimer); setMenuTimer(null); }}
                  onMouseLeave={() => {
                    const t = window.setTimeout(() => {
                      setUserMenuOpen(false);
                      setMenuTimer(null);
                    }, 250);
                    setMenuTimer(t);
                  }}
                >
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:inline">{user.username}</span>
                    {user.is_member && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        会员
                      </span>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                      <Link href="/user/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        用户中心
                      </Link>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                  登录
                </Link>
                <Link href="/register" className="btn-primary">
                  注册
                </Link>
              </div>
            )}
            
            {adminContact && (
              <div className="relative">
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="管理员联系方式"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                {showContact && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">管理员联系方式：</p>
                    <p className="text-sm font-medium text-gray-900">{adminContact}</p>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
