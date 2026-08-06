import { CloudflareEnv, KVNamespace } from '@/types/cloudflare';
import { User, Photo, Album, DailyUsage } from '@/types';

export function getKV(env: CloudflareEnv): KVNamespace {
  if (!env?.KV) {
    throw new Error('KV binding not available');
  }
  return env.KV;
}

const KEYS = {
  user: (username: string) => `user:${username}`,
  photo: (id: string) => `photo:${id}`,
  album: (id: string) => `album:${id}`,
  usage: (username: string, date: string) => `usage:${username}:${date}`,
  settings: 'settings',
  index: {
    photos: 'index:photos',
    albums: 'index:albums',
    users: 'index:users',
  },
};

export async function getUser(kv: KVNamespace, username: string): Promise<User | null> {
  const data = await kv.get(KEYS.user(username), 'json') as User | null;
  return data;
}

export async function setUser(kv: KVNamespace, user: User): Promise<void> {
  await kv.put(KEYS.user(user.username), JSON.stringify(user));
  await addToIndex(kv, KEYS.index.users, user.username);
}

export async function updateUser(kv: KVNamespace, username: string, updates: Partial<User>): Promise<void> {
  const user = await getUser(kv, username);
  if (!user) throw new Error('User not found');
  const updatedUser = { ...user, ...updates };
  await kv.put(KEYS.user(username), JSON.stringify(updatedUser));
}

export async function getPhoto(kv: KVNamespace, id: string): Promise<Photo | null> {
  const data = await kv.get(KEYS.photo(id), 'json') as Photo | null;
  return data;
}

export async function setPhoto(kv: KVNamespace, photo: Photo): Promise<void> {
  await kv.put(KEYS.photo(photo.id), JSON.stringify(photo));
  await addToIndex(kv, KEYS.index.photos, photo.id);
}

export async function updatePhoto(kv: KVNamespace, id: string, updates: Partial<Photo>): Promise<void> {
  const photo = await getPhoto(kv, id);
  if (!photo) throw new Error('Photo not found');
  const updatedPhoto = { ...photo, ...updates };
  await kv.put(KEYS.photo(id), JSON.stringify(updatedPhoto));
}

export async function deletePhoto(kv: KVNamespace, id: string): Promise<void> {
  await kv.delete(KEYS.photo(id));
  await removeFromIndex(kv, KEYS.index.photos, id);
}

export async function getAllPhotos(kv: KVNamespace): Promise<Photo[]> {
  const index = await kv.get(KEYS.index.photos, 'json') as string[] | null;
  if (!index) return [];
  
  const photos: Photo[] = [];
  for (const id of index) {
    const photo = await getPhoto(kv, id);
    if (photo) {
      photo.is_pinned = photo.is_pinned ?? false;
      photos.push(photo);
    }
  }
  return photos;
}

export async function getAlbum(kv: KVNamespace, id: string): Promise<Album | null> {
  const data = await kv.get(KEYS.album(id), 'json') as Album | null;
  return data;
}

export async function setAlbum(kv: KVNamespace, album: Album): Promise<void> {
  await kv.put(KEYS.album(album.id), JSON.stringify(album));
  await addToIndex(kv, KEYS.index.albums, album.id);
}

export async function updateAlbum(kv: KVNamespace, id: string, updates: Partial<Album>): Promise<void> {
  const album = await getAlbum(kv, id);
  if (!album) throw new Error('Album not found');
  const updatedAlbum = { ...album, ...updates };
  await kv.put(KEYS.album(id), JSON.stringify(updatedAlbum));
}

export async function deleteAlbum(kv: KVNamespace, id: string): Promise<void> {
  await kv.delete(KEYS.album(id));
  await removeFromIndex(kv, KEYS.index.albums, id);
}

export async function getAllAlbums(kv: KVNamespace): Promise<Album[]> {
  const index = await kv.get(KEYS.index.albums, 'json') as string[] | null;
  if (!index) return [];
  
  const albums: Album[] = [];
  for (const id of index) {
    const album = await getAlbum(kv, id);
    if (album) albums.push(album);
  }
  return albums;
}

export async function getDailyUsage(kv: KVNamespace, username: string, date: string): Promise<DailyUsage> {
  const key = KEYS.usage(username, date);
  const data = await kv.get(key, 'json') as DailyUsage | null;
  return data || { photo_views: 0, contact_views: 0 };
}

export async function incrementDailyUsage(kv: KVNamespace, username: string, type: 'photo_views' | 'contact_views'): Promise<DailyUsage> {
  const today = new Date().toISOString().split('T')[0];
  const key = KEYS.usage(username, today);
  const usage = await getDailyUsage(kv, username, today);
  usage[type]++;
  
  await kv.put(key, JSON.stringify(usage), { expirationTtl: 86400 * 7 });
  return usage;
}

async function addToIndex(kv: KVNamespace, indexKey: string, id: string): Promise<void> {
  const index = (await kv.get(indexKey, 'json') as string[] | null) || [];
  if (!index.includes(id)) {
    index.push(id);
    await kv.put(indexKey, JSON.stringify(index));
  }
}

async function removeFromIndex(kv: KVNamespace, indexKey: string, id: string): Promise<void> {
  const index = (await kv.get(indexKey, 'json') as string[] | null) || [];
  const newIndex = index.filter(i => i !== id);
  await kv.put(indexKey, JSON.stringify(newIndex));
}
