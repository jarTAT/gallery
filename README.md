# Gallery - Photo Gallery

A photo gallery website built with Next.js and deployed on Cloudflare Pages, using R2 for photo storage and KV for metadata.

## Features

- 📸 Photo gallery with responsive grid layout
- 🔍 Filtering by price range, city, and tags
- 👤 User authentication (register/login)
- 💎 Member system with daily view limits
- 🔐 Admin panel for managing photos, albums, and users
- 📱 Mobile-friendly design

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Cloudflare Pages Functions
- **Storage**: Cloudflare R2 (photos), Cloudflare KV (metadata)
- **Auth**: JWT tokens with bcrypt password hashing

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create Cloudflare Resources

Create a KV namespace:
```bash
wrangler kv namespace create KV
# Output: { binding = "KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

Create an R2 bucket:
```bash
wrangler r2 bucket create gallery
```

### 4. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```bash
JWT_SECRET=your_random_secret_key_here
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_CONTACT=your_contact_info_here
```

### 5. Update wrangler.toml

Update `wrangler.toml` with your KV namespace ID and R2 bucket name:

```toml
[[kv_namespaces]]
binding = "KV"
id = "your_actual_kv_namespace_id"

[[r2_buckets]]
binding = "R2"
bucket_name = "your_actual_r2_bucket_name"
```

### 6. Local Development

```bash
npm run pages:dev
```

This will start a local development server with Cloudflare Pages bindings.

### 7. Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI

```bash
npm run pages:build
npm run pages:deploy
```

#### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Click "Create a project"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`
6. Add environment variables in the dashboard:
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
   - `ADMIN_CONTACT`

### 8. Configure Environment Variables in Cloudflare

Go to Cloudflare Pages dashboard → Settings → Environment variables and add:
- `JWT_SECRET` - Your JWT signing secret
- `ADMIN_PASSWORD` - Password for admin login
- `ADMIN_CONTACT` - Contact info displayed in header

## Default Admin Access

- **Username**: admin
- **Password**: Set via `ADMIN_PASSWORD` environment variable

## Project Structure

```
gallery/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication (login, register, logout)
│   │   │   ├── photos/       # Photo CRUD and file serving
│   │   │   ├── albums/       # Album management
│   │   │   └── admin/        # Admin API (stats, users)
│   │   ├── admin/            # Admin panel pages
│   │   ├── login/            # Login page
│   │   ├── register/         # Register page
│   │   ├── photo/            # Photo detail page
│   │   └── help/             # Help page
│   ├── components/           # React components
│   ├── lib/                  # Utility functions (KV, R2, Auth)
│   └── types/                # TypeScript types
├── public/                   # Static assets
├── wrangler.toml             # Cloudflare configuration
└── package.json
```

## API Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/photos` - List photos (with filtering)
- `POST /api/photos` - Upload photo (admin only)
- `GET /api/photos/:id` - Get photo details
- `PUT /api/photos/:id` - Update photo (admin only)
- `DELETE /api/photos/:id` - Delete photo (admin only)
- `POST /api/photos/:id/contact` - View contact info (requires login)
- `GET /api/photos/:id/original` - Get original photo file
- `GET /api/photos/:id/thumb` - Get thumbnail file
- `GET /api/albums` - List albums
- `POST /api/albums` - Create album (admin only)
- `PUT /api/albums/:id` - Update album (admin only)
- `DELETE /api/albums/:id` - Delete album (admin only)
- `GET /api/admin/stats` - Get statistics (admin only)
- `GET /api/admin/users` - List users (admin only)
- `PUT /api/admin/users` - Update user membership (admin only)

## License

MIT
