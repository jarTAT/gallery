'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';

interface UserData {
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_member: boolean;
  member_expire: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberExpire, setMemberExpire] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setIsMember(user.is_member);
    setMemberExpire(user.member_expire ? user.member_expire.split('T')[0] : '');
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editingUser.username,
          is_member: isMember,
          member_expire: memberExpire ? new Date(memberExpire).toISOString() : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">用户管理</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                邮箱
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                会员状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                注册时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.username} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.is_member ? (
                    <span className="text-green-600">
                      会员
                      {user.member_expire && (
                        <span className="text-gray-400 ml-1">
                          (至 {new Date(user.member_expire).toLocaleDateString()})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">普通用户</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无用户</p>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              编辑用户: {editingUser.username}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_member"
                  checked={isMember}
                  onChange={(e) => setIsMember(e.target.checked)}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="is_member" className="ml-2 text-sm text-gray-700">
                  设置为会员
                </label>
              </div>
              
              {isMember && (
                <div>
                  <label className="label">会员过期时间</label>
                  <input
                    type="date"
                    value={memberExpire}
                    onChange={(e) => setMemberExpire(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSave} className="btn-primary">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
