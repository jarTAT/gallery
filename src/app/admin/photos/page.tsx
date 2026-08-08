'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Photo } from '@/types';
import Pagination from '@/components/Pagination';
import { toCSV, downloadCSV } from '@/lib/csv';

const DEFAULT_PAGE_SIZE = 15;

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const fetchPhotos = async (pageNum: number, size: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', size.toString());
      const response = await fetch(`/api/photos?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        const data = result.data;
        setPhotos(data.data);
        setTotal(data.total);
        setTotalPages(Math.max(1, Math.ceil(data.total / size)));
        setSelected(new Set());
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos(page, pageSize);
  }, [page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchPhotos(page, pageSize);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleTogglePin = async (photo: Photo) => {
    const nextValue = !photo.is_pinned;

    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_pinned: nextValue }),
      });

      if (response.ok) {
        setPhotos(photos.map(p => p.id === photo.id ? { ...p, is_pinned: nextValue } : p));
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allSelected = photos.every(p => selected.has(p.id));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map(p => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selected.size} 张照片吗？此操作不可恢复。`)) return;

    setDeleting(true);
    setMessage('');
    try {
      const response = await fetch('/api/photos/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`已删除 ${result.data.deleted} 张照片`);
        setSelected(new Set());
        fetchPhotos(page, pageSize);
      } else {
        setMessage(result.error || '批量删除失败');
      }
    } catch (error) {
      console.error('Failed to batch delete photos:', error);
      setMessage('批量删除出错');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/photos?limit=10000');
      const result = await response.json();
      if (!result.success) return;

      const allPhotos: Photo[] = result.data.data;
      const headers = ['name', 'price', 'tags', 'city', 'district', 'contact', 'link', 'album_id', 'is_pinned', 'created_at'];
      const rows = allPhotos.map(p => [
        p.name,
        p.price,
        p.tags.join('|'),
        p.city,
        p.district,
        p.contact,
        p.link,
        p.album_id,
        p.is_pinned ? 'true' : 'false',
        p.created_at,
      ]);
      downloadCSV(toCSV(headers, rows), `photos_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Failed to export photos:', error);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setMessage('请选择 CSV 文件');
      return;
    }

    const text = await file.text();
    if (!text.trim()) {
      setMessage('文件内容为空');
      return;
    }

    setImporting(true);
    setMessage('');
    try {
      const response = await fetch('/api/photos/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ csv: text }),
      });
      const result = await response.json();

      if (result.success) {
        const errCount = result.data.errors.length;
        setMessage(`导入成功 ${result.data.imported} 条${errCount > 0 ? `，跳过 ${errCount} 条` : ''}`);
        fetchPhotos(1, pageSize);
        setPage(1);
      } else {
        setMessage(result.error || '导入失败');
      }
    } catch (error) {
      console.error('Failed to import photos:', error);
      setMessage('导入出错');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading && photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">照片管理</h1>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBatchDelete}
              disabled={deleting}
              className="btn-danger"
            >
              {deleting ? '删除中...' : `删除选中 (${selected.size})`}
            </button>
          )}
          <button onClick={handleExport} className="btn-secondary" disabled={loading}>
            导出 CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={importing}
          >
            {importing ? '导入中...' : '导入 CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Link href="/admin/photos/upload" className="btn-primary">
            上传照片
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 rounded cursor-pointer"
                  checked={photos.length > 0 && photos.every(p => selected.has(p.id))}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                照片
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                价格
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                城市
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标签
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {photos.map((photo) => (
              <tr key={photo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 rounded cursor-pointer"
                    checked={selected.has(photo.id)}
                    onChange={() => handleToggleSelect(photo.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {Array.isArray(photo.images) && photo.images.length > 0 ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={`/api/photos/${photo.id}/thumb?index=${photo.cover_index || 0}`}
                          alt={photo.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          无图
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {photo.is_pinned && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">置顶</span>
                        )}
                        {photo.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ¥{photo.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {photo.city} {photo.district}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {photo.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {photo.tags.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{photo.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleTogglePin(photo)}
                    className={photo.is_pinned ? 'text-amber-600 hover:text-amber-800 mr-4' : 'text-gray-500 hover:text-gray-700 mr-4'}
                  >
                    {photo.is_pinned ? '取消置顶' : '置顶'}
                  </button>
                  <Link
                    href={`/admin/photos/${photo.id}/edit`}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {photos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无照片</p>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}