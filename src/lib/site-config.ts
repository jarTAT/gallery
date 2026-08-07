export const siteConfig = {
  name: '深圳老师百科',
  title: '照片库 - 高品质摄影图片素材展示与交易',
  description: '高品质摄影作品在线展示平台，汇集城市风光、建筑、景观等摄影素材，提供图片展示、分类筛选与会员浏览服务。',
  keywords: [
    '照片',
    '摄影',
    '图片素材',
    '摄影作品',
    '风光摄影',
    '城市摄影',
    '建筑摄影',
    '照片库',
    '图片展示',
    '摄影图库',
    '素材图片',
    '视频素材',
    '高清图片',
    '图集',
    '相册',
  ],
  url: 'https://gallery.com',
};

export function buildKeywords(extra?: string[]): string {
  const base = siteConfig.keywords.join(', ');
  if (extra && extra.length > 0) {
    return `${extra.join(', ')}, ${base}`;
  }
  return base;
}