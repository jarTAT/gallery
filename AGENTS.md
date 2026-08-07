# Gallery 项目关键信息

## 项目概述
照片画廊站点，基于 Next.js 14 + Cloudflare Pages，展示摄影作品图片，支持搜索筛选、会员浏览、联系方式查看、后台管理。

- 仓库：`https://github.com/jarTAT/gallery`，分支 `main`
- 部署：Cloudflare Pages（GitHub 推送自动触发构建），构建命令 `npx @cloudflare/next-on-pages`，输出目录 `.vercel/output/static`
- 本地开发：无本地 node/npm 环境，改动直接 `git push` 由云端构建验证

## 技术栈（版本已固定，勿随意升级）
- `next@14.2.35`（不能用 Next 15，需配合 next-on-pages 1.12.1）
- `@cloudflare/next-on-pages@1.12.1`（1.13+ 需要 next>=14.3）
- `vercel@39.1.1`（package.json overrides 已固定，解决 async_hooks bug）
- `bcryptjs` + `jose`（JWT）；Tailwind CSS
- 全部 API 路由 `export const runtime = 'edge'`

## Cloudflare 配置（wrangler.toml）
- 绑定 `KV` → 命名空间 `4ebf2d12b55c4cc3bdc38898f82ac80c`
- 绑定 `R2` → 桶 `stuffimg`
- 环境变量：`JWT_SECRET`、`ADMIN_PASSWORD`、`ADMIN_CONTACT`
- Compatibility flag：`nodejs_compat`

## 核心架构
- **环境绑定**：统一用 `src/lib/cloudflare.ts` 的 `getEnv()`（内部 `getRequestContext()`），禁止直接使用 `context.env` 或 `getCloudflareContext`（1.12.1 无此导出）
- **KV 封装**：`src/lib/kv.ts` — `getKV`、getUser/setUser/updateUser、getPhoto/setPhoto/updatePhoto/deletePhoto、getAllPhotos、albums、每日用量 `getDailyUsage`/`incrementDailyUsage`；索引键 `index:photos` / `index:users` / `index:albums`；用户键 `user:<name>`、照片键 `photo:<id>`
- **R2 封装**：`src/lib/r2.ts` — 多图存储，每张图两个 key：原图 `photos/<photoId>/<imageId>`、缩略图 `thumbnails/<photoId>/<imageId>`；`uploadPhoto(r2, photoId, imageId, buffer, type)` 同时上传原图+缩略图返回 `{key, thumb_key}`；`deletePhotoFiles(r2, images[])` 删除多张；`deletePhotoImageFiles` 删单张
- **鉴权**：`src/lib/auth.ts` — bcrypt 密码哈希、jose JWT（7 天）、`getCurrentUser(request, env.JWT_SECRET)`；管理员用户名固定 `admin`，密码比对 `ADMIN_PASSWORD` 明文
- **CSV 工具**：`src/lib/csv.ts`（带 BOM，Excel 兼容）
- **SEO 配置**：`src/lib/site-config.ts` — 站点标题/描述/关键字集中维护；`src/components/Seo.tsx` 动态注入页面 meta

## 数据结构（src/types/index.ts）
- User: username, password_hash, email, role('user'|'admin'), is_member, member_expire, created_at
- Photo: id, name, price, tags[], city, district, contact, link, album_id, images[{key, thumb_key}], cover_index, is_pinned, created_at（多图，图片访问用 `/api/photos/[id]/thumb|original?index=N`）
- Album: id, name, description, cover_photo_id, created_at

## API 路由清单
| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/auth/login` | POST | 登录（admin 用 ADMIN_PASSWORD） |
| `/api/auth/register` | POST | 注册（自动 role=user） |
| `/api/auth/logout` | POST | 登出 |
| `/api/photos` | GET/POST | 列表(分页+筛选+cities) / 上传(FormData) |
| `/api/photos/[id]` | GET/PUT/DELETE | PUT 支持 FormData 替换图片或 JSON 改元数据 |
| `/api/photos/import` | POST | CSV 导入元数据（不含图片） |
| `/api/photos/batch-delete` | POST | 批量删除 `{ids:[]}` |
| `/api/photos/[id]/thumb`、`original` | GET | 图片访问（鉴权） |
| `/api/photos/[id]/contact` | POST | 会员/每日限额查看联系方式 |
| `/api/albums`、`/api/albums/[id]` | GET/POST/PUT/DELETE | 相册管理 |
| `/api/admin/users` | GET/POST/PUT | 用户管理（创建/编辑全部字段） |
| `/api/admin/stats` | GET | 后台统计 |
| `/api/site-info` | GET | 站点信息 |

## 关键业务规则
- 非会员每日最多查看 5 次联系方式（KV 按 `usage:<username>:<date>` 计，TTL 7 天）
- 后台 `/admin` 需登录且 role=admin
- 前台搜索：空格/逗号分隔多关键字 AND 匹配（名称/标签/城市/区域）
- 首页每页 12 张；后台照片/用户管理分页 15/50/100 可选

## UI 约定
- Flickr 风格：primary 蓝 `#0063DC`、accent 粉 `#FF0084`（tailwind.config）
- 自定义类：`btn-primary`、`btn-secondary`、`btn-danger`、`card`、`input`、`label`（globals.css）
- 中文界面；header 蓝底白字 + 蓝粉双圆点 Logo

## 验证与流程
- 无法本地编译，改动后 `git add -A && git commit -m "..." && git push` 由云端构建验证（网络偶发 github.com:443 超时，重试即可）
- 每次构建后需确认 Cloudflare Pages 部署日志无报错

## 已知可优化方向
- `siteConfig.url` 目前为占位，接自定义域名后需更新
- 缩略图目前与原图相同文件（无真实压缩），可接入图片处理
- 图片未接 CDN/缓存优化
