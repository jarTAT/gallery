'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Album } from '@/types';

export default function UploadPhotoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [contact, setContact] = useState('');
  const [link, setLink] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
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
    if (!file || !name) {
      setError('请选择文件并填写名称');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('price', price || '0');
    formData.append('tags', tags);
    formData.append('city', city);
    formData.append('district', district);
    formData.append('contact', contact);
    formData.append('link', link);
    formData.append('album_id', albumId);

    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        router.push('/admin/photos');
      } else {
        setError(result.error || '上传失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">上传照片</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="mb-6">
            <label className="label">照片文件 *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="input"
            />
          </div>

          {preview && (
            <div className="mb-6">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-lg"
              />
            </div>
          )}

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
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '上传中...' : '上传照片'}
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
