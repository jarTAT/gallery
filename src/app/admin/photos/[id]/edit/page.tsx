'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Photo, PhotoImage } from '@/types';

export const runtime = 'edge';

export default function EditPhotoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [photo, setPhoto] = useState<Photo | null>(null);
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
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removeIndices, setRemoveIndices] = useState<number[]>([]);

  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    fetchPhoto();
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

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setNewFiles((prev) => [...prev, ...selected]);
    const newPrevs: string[] = [];
    selected.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPrevs.push(reader.result as string);
        if (newPrevs.length === selected.length) {
          setNewPreviews((prev) => [...prev, ...newPrevs]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
  };

  const toggleRemoveIndex = (index: number) => {
    setRemoveIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSetCover = async (index: number) => {
    if (!photo) return;
    const images = photo.images || [];

    if (removeIndices.includes(index)) {
      setError('请先取消该图片的移除标记，再设为封面');
      return;
    }

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cover_index: index }),
      });

      if (response.ok) {
        fetchPhoto();
      }
    } catch (error) {
      console.error('Failed to set cover:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('请填写名称');
      return;
    }

    const images = photo?.images || [];
    const remainingCount = images.length - removeIndices.length;
    if (remainingCount === 0 && newFiles.length === 0) {
      setError('至少保留一张照片');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const baseUrl = `/api/photos/${id}`;
      const authHeaders: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      const body: Record<string, unknown> = {
        name,
        price: parseInt(price) || 0,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        city,
        district,
        contact,
        link,
      };

      if (removeIndices.length > 0) {
        body.remove_indices = removeIndices;
      }

      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((f) => formData.append('files', f));
        Object.entries(body).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });

        const response = await fetch(baseUrl, {
          method: 'PUT',
          headers: authHeaders,
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          router.push('/admin/photos');
        } else {
          setError(result.error || '保存失败');
        }
      } else {
        authHeaders['Content-Type'] = 'application/json';
        const response = await fetch(baseUrl, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(body),
        });
        const result = await response.json();
        if (result.success) {
          router.push('/admin/photos');
        } else {
          setError(result.error || '保存失败');
        }
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

  const images = photo.images || [];

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
            <label className="label">已上传图片 (点击缩略图设置为封面)</label>
            {images.length === 0 ? (
              <p className="text-sm text-gray-500">暂无图片</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {images.map((img: PhotoImage, index: number) => (
                  <div
                    key={index}
                    className={`relative ${removeIndices.includes(index) ? 'opacity-40' : ''}`}
                  >
                    <button type="button" onClick={() => handleSetCover(index)}>
                      <img
                        src={`/api/photos/${photo.id}/thumb?index=${index}`}
                        alt={`Image ${index + 1}`}
                        className={`h-24 w-24 object-cover rounded-lg border-2 ${
                          photo.cover_index === index
                            ? 'border-primary-600'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      />
                    </button>
                    {photo.cover_index === index && (
                      <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded">
                        封面
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleRemoveIndex(index)}
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs text-white flex items-center justify-center ${
                        removeIndices.includes(index) ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {removeIndices.includes(index) ? '✓' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {removeIndices.length > 0 && (
              <p className="text-sm text-red-600 mt-2">
                已选择 {removeIndices.length} 张移除，保存后生效
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="label">添加更多图片 (可多选)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewFiles}
              className="input mb-3"
            />
            {newPreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {newPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
            {saving ? '保存中...' : '保存修改'}
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