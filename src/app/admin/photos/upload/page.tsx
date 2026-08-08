'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Album } from '@/types';

export default function UploadPhotoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    const newPreviews: string[] = [];
    selectedFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === selectedFiles.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !name) {
      setError('请至少选择一张照片并填写名称');
      return;
    }
    if (!files.some((f) => !f.type.startsWith('video/'))) {
      setError('视频不能作为封面，请至少选择一张图片');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
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
            <label className="label">照片/视频文件 * (可多选，第一张图片为封面；视频不能作为封面)</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="input"
            />
            {files.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">已选择 {files.length} 个文件</p>
            )}
          </div>

          {previews.length > 0 && (
            <div className="mb-6">
              <label className="label">预览 (封面自动选择第一张图片)</label>
              <div className="flex flex-wrap gap-3">
                {files.map((file, index) => {
                  const isVideo = file.type.startsWith('video/');
                  const isCover = !isVideo && files.findIndex((f) => !f.type.startsWith('video/')) === index;
                  return (
                    <div key={index} className="relative">
                      {isVideo ? (
                        <video
                          src={previews[index]}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                      ) : (
                        <img
                          src={previews[index]}
                          alt={`Preview ${index + 1}`}
                          className={`h-24 w-24 object-cover rounded-lg ${
                            isCover ? 'ring-2 ring-primary-600' : ''
                          }`}
                        />
                      )}
                      {isVideo && (
                        <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-accent-500 text-white text-xs rounded">
                          ▶ 视频
                        </span>
                      )}
                      {isCover && (
                        <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded">
                          封面
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
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