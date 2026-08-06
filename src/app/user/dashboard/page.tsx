'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function UserDashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">用户中心</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">个人信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">用户名</p>
            <p className="font-medium text-gray-900">{user.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">邮箱</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">角色</p>
            <p className="font-medium text-gray-900">
              {user.role === 'admin' ? '管理员' : '用户'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">会员状态</p>
            <p className="font-medium text-gray-900">
              {user.is_member ? (
                <span className="text-green-600">会员</span>
              ) : (
                <span className="text-gray-400">普通用户</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">查看限制说明</h2>
        <div className="text-gray-600 space-y-2">
          {user.is_member ? (
            <p>您是会员用户，可无限次查看联系方式和链接信息。</p>
          ) : (
            <>
              <p>普通用户每日可查看 5 次联系方式和链接信息。</p>
              <p>如需更多查看次数，请联系管理员开通会员。</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button onClick={logout} className="btn-secondary">
          退出登录
        </button>
      </div>
    </div>
  );
}
