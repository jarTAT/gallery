'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Album } from '@/types';

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums');
      const result = await response.json();
      
      if (result.success) {
        setAlbums(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingAlbum ? `/api/albums/${editingAlbum.id}` : '/api/albums';
      const method = editingAlbum ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        setEditingAlbum(null);
        setName('');
        setDescription('');
        fetchAlbums();
      }
    } catch (error) {
      console.error('Failed to save album:', error);
    }
  };

  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setName(album.name);
    setDescription(album.description);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个相册吗？')) return;

    try {
      const response = await fetch(`/api/albums/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setAlbums(albums.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete album:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">相册管理</h1>
        <button
          onClick={() => {
            setEditingAlbum(null);
            setName('');
            setDescription('');
            setShowModal(true);
          }}
          className="btn-primary"
        >
          新建相册
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div key={album.id} className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{album.name}</h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {album.description || '暂无描述'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleEdit(album)}
                className="text-primary-600 hover:text-primary-900 text-sm"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(album.id)}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {albums.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">暂无相册</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingAlbum ? '编辑相册' : '新建相册'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">相册名称 *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">描述</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
