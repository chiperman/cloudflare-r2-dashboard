# 🗂️ Cloudflare R2 管理面板

这是一个基于 Next.js, Tailwind CSS 和 Supabase 构建的现代化、安全且用户友好的 Web 界面，用于管理存储在 Cloudflare R2 存储桶中的文件。项目已配置为通过 Vercel 进行一键式部署。

## ✨ 核心功能

- **🔒 安全认证**: 通过 Supabase Auth 实现用户登录，只有授权用户才能访问。
- **📤 文件上传**: 支持拖拽或点击选择文件，上传时自动按时间戳重命名以避免冲突。
- **🖼️ 文件列表与预览**:
  - 以表格形式清晰展示所有文件，包含缩略图、文件名、上传时间和文件大小。
  - 自动生成缩略图 (`thumbnails/`) 和存储原始文件 (`originals/`)，优化加载性能。
  - 点击缩略图可查看高分辨率的图片预览。
- **🔗 一键复制链接**: 快速复制文件的公开访问链接到剪贴板。
- **🗑️ 同步删除**: 删除文件时，会自动将原始文件和其对应的缩略图一并从 R2 存储桶中清除，保证数据一致性。

## 🛠️ 技术栈

| 分类           | 技术/服务                                                               |
| -------------- | ----------------------------------------------------------------------- |
| **框架**       | [Next.js](https://nextjs.org/) 14 (App Router)                          |
| **语言**       | [TypeScript](https://www.typescriptlang.org/)                           |
| **样式**       | [Tailwind CSS](https://tailwindcss.com/)                                |
| **UI 组件**    | [shadcn/ui](https://ui.shadcn.com/)                                     |
| **认证服务**   | [Supabase Auth](https://supabase.com/auth)                              |
| **对象存储**   | [Cloudflare R2](https://www.cloudflare.com/products/r2/)                |
| **云服务接口** | [AWS SDK for JavaScript v3](https://aws.amazon.com/sdk-for-javascript/) |
| **部署平台**   | [Vercel](https://vercel.com/)                                           |

## 🚀 开始使用

请按照以下步骤在本地运行此项目。

### 1. 克隆仓库

```bash
git clone https://github.com/chiperman/cloudflare-r2-dashboard.git
cd cloudflare-r2-dashboard
```

### 2. 安装依赖

```bash
npm install
# 或者使用 pnpm / yarn
# pnpm install
# yarn install
```

### 3. 配置环境变量

首先，将环境变量模板文件复制一份，并重命名为 `.env.local`。

```bash
cp .env.example .env.local
```

然后，编辑 `.env.local` 文件，填入你自己的配置信息。这些信息可以从你的 Supabase 和 Cloudflare R2 控制台找到。

```env
# .env.local

# Supabase
# You can get these from your Supabase project settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2 (S3-compatible) credentials
# You can find these in your Cloudflare R2 dashboard
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
```

### 4. 运行开发服务器

```bash
npm run dev
```

现在，在浏览器中打开 [http://localhost:3000](http://localhost:3000) 就可以看到正在运行的应用了。

## 🌐 部署到 Vercel

本项目已为 Vercel 部署进行了优化。

1.  **推送代码**: 将你的代码推送到 GitHub 私有仓库。
2.  **导入项目**: 在 Vercel 控制台，选择 "Add New..." -> "Project"，然后选择你刚刚推送的 GitHub 仓库并点击 "Import"。
3.  **配置环境变量**: 在 "Configure Project" 页面，展开 "Environment Variables" 选项卡。将你在 `.env.local` 文件中配置的所有变量和值一一添加到这里。**这是部署成功的关键步骤。**
4.  **部署**: 点击 "Deploy" 按钮。Vercel 将自动构建并部署你的应用。

部署成功后，每次 `git push` 到 `main` 分支，Vercel 都会自动触发一次新的部署。
