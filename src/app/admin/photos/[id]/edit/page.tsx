'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Photo, Album } from '@/types';

export const runtime = 'edge';

export default function EditPhotoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [contact, setContact] = useState('');
  const [link, setLink] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    fetchPhoto();
    fetchAlbums();
  }, [id]);

  const fetchPhoto = async () => {
    try {
      const response = await fetch(`/api/photos/${id}`);
      const result = await response.json();
      
      if (result.success) {
        const p = result.data;
        setPhoto(p);
        setName(p.name);
        setPrice(p.price.toString());
        setTags(p.tags.join(', '));
        setCity(p.city);
        setDistrict(p.district);
        setContact(p.contact);
        setLink(p.link);
        setAlbumId(p.album_id);
      } else {
        router.push('/admin/photos');
      }
    } catch (error) {
      console.error('Failed to fetch photo:', error);
      router.push('/admin/photos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums');
      const result = await response.json();
      if (result.success) {
        setAlbums(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('请填写名称');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        name,
        price: parseInt(price) || 0,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        city,
        district,
        contact,
        link,
        album_id: albumId,
      };

      let response: Response;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(payload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            formData.append(key, value.join(','));
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        response = await fetch(`/api/photos/${id}`, {
          method: 'PUT',
          headers,
          body: formData,
        });
      } else {
        headers['Content-Type'] = 'application/json';
        response = await fetch(`/api/photos/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (result.success) {
        router.push('/admin/photos');
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!photo) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">编辑照片</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="mb-6">
            <label className="label">更换照片</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="input mb-3"
            />
            {preview ? (
              <img
                src={preview}
                alt="新照片预览"
                className="h-32 rounded-lg"
              />
            ) : (
              <img
                src={`/api/photos/${photo.id}/thumb`}
                alt={photo.name}
                className="h-32 rounded-lg"
              />
            )}
            {file && (
              <p className="text-sm text-primary-600 mt-2">
                已选择新照片，保存后将替换原图
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">价格</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">城市</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">区域</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">标签 (逗号分隔)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input"
                placeholder="标签1, 标签2, 标签3"
              />
            </div>

            <div>
              <label className="label">相册</label>
              <select
                value={albumId}
                onChange={(e) => setAlbumId(e.target.value)}
                className="input"
              >
                <option value="">选择相册</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">联系方式</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">链接</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? '保存中...' : file ? '保存并替换照片' : '保存修改'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
