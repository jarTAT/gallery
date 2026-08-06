'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Photo } from '@/types';

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos?limit=100');
      const result = await response.json();
      
      if (result.success) {
        setPhotos(result.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setPhotos(photos.filter(p => p.id !== id));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">照片管理</h1>
        <Link href="/admin/photos/upload" className="btn-primary">
          上传照片
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-lg object-cover"
                        src={`/api/photos/${photo.id}/thumb`}
                        alt={photo.name}
                      />
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
      </div>
    </div>
  );
}
