export const siteConfig = {
  name: '深圳老师百科',
  title: '照片库 - 高品质摄影图片素材展示与交易',
  description: '深圳老师百科：汇集本地摄影作品展示、价格、联系方式与高清图片素材，支持按城市、标签、价格筛选，会员可查看联系方式。',
  keywords: [
    '摄影',
    '照片',
    '深圳摄影',
    '摄影作品',
    '图片素材',
    '深圳老师百科',
  ],
  url: 'https://gallery-b78.pages.dev',
  image: '/og-image.png',
};

export function absoluteUrl(path: string): string {
  if (!path) return siteConfig.url;
  if (/^https?:\/\//.test(path)) return path;
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildKeywords(extra?: string[]): string {
  const base = siteConfig.keywords.join(', ');
  if (extra && extra.length > 0) {
    return `${extra.join(', ')}, ${base}`;
  }
  return base;
}