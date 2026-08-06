'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import Pagination from '@/components/Pagination';
import { toCSV, downloadCSV } from '@/lib/csv';

interface UserData {
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_member: boolean;
  member_expire: string | null;
  created_at: string;
}

type ModalMode = 'create' | 'edit' | null;

interface FormState {
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_member: boolean;
  member_expire: string;
  password: string;
}

const DEFAULT_PAGE_SIZE = 15;

const EMPTY_FORM: FormState = {
  username: '',
  email: '',
  role: 'user',
  is_member: false,
  member_expire: '',
  password: '',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));

  const openCreate = () => {
    setError('');
    setForm(EMPTY_FORM);
    setModalMode('create');
  };

  const openEdit = (user: UserData) => {
    setError('');
    setForm({
      username: user.username,
      email: user.email,
      role: user.role,
      is_member: user.is_member,
      member_expire: user.member_expire ? user.member_expire.split('T')[0] : '',
      password: '',
    });
    setModalMode('edit');
  };

  const setField = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    if (!form.username || !form.email) {
      setError('用户名和邮箱为必填项');
      setSaving(false);
      return;
    }

    if (form.username.length < 3 || form.username.length > 20) {
      setError('用户名长度需在 3-20 个字符之间');
      setSaving(false);
      return;
    }

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('请输入有效的邮箱地址');
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      username: form.username,
      email: form.email,
      role: form.role,
      is_member: form.is_member,
      member_expire: form.is_member && form.member_expire
        ? new Date(form.member_expire).toISOString()
        : null,
    };

    if (modalMode === 'create') {
      if (!form.password) {
        setError('请设置初始密码');
        setSaving(false);
        return;
      }
      if (form.password.length < 6) {
        setError('密码长度至少为 6 位');
        setSaving(false);
        return;
      }
      payload.password = form.password;
    } else if (form.password) {
      if (form.password.length < 6) {
        setError('密码长度至少为 6 位');
        setSaving(false);
        return;
      }
      payload.password = form.password;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || (modalMode === 'create' ? '创建失败' : '保存失败'));
      } else if (result.success) {
        setModalMode(null);
        fetchUsers();
      } else {
        setError(result.error || '操作失败');
      }
    } catch (error) {
      console.error('Save user error:', error);
      setError('网络错误，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const headers = ['username', 'email', 'role', 'is_member', 'member_expire', 'created_at'];
    const rows = users.map(u => [
      u.username,
      u.email,
      u.role,
      u.is_member ? 'true' : 'false',
      u.member_expire || '',
      u.created_at,
    ]);
    downloadCSV(toCSV(headers, rows), `users_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            导出 CSV
          </button>
          <button onClick={openCreate} className="btn-primary">
            创建用户
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

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
            {paginatedUsers.map((user) => (
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
                    onClick={() => openEdit(user)}
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

        <Pagination
          page={page}
          totalPages={totalPages}
          total={users.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {modalMode === 'create' ? '创建用户' : `编辑用户: ${form.username}`}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">用户名</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setField('username', e.target.value)}
                  disabled={modalMode === 'edit'}
                  className={`input ${modalMode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="3-20 个字符"
                />
              </div>

              <div>
                <label className="label">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className="input"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="label">角色</label>
                <select
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value as 'user' | 'admin')}
                  className="input"
                >
                  <option value="user">用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_member"
                  checked={form.is_member}
                  onChange={(e) => setField('is_member', e.target.checked)}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="is_member" className="ml-2 text-sm text-gray-700">
                  设置为会员
                </label>
              </div>

              {form.is_member && (
                <div>
                  <label className="label">会员过期时间</label>
                  <input
                    type="date"
                    value={form.member_expire}
                    onChange={(e) => setField('member_expire', e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              <div>
                <label className="label">
                  {modalMode === 'create' ? '密码' : '重置密码'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  className="input"
                  placeholder={modalMode === 'edit' ? '留空表示不修改' : '至少 6 位'}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModalMode(null)}
                className="btn-secondary"
                disabled={saving}
              >
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}