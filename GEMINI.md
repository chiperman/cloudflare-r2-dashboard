# Cloudflare R2 管理控制台开发指南

## 📝 项目简介

本项目是一个基于 Next.js 和 Tailwind CSS 构建的前端应用，部署在 Vercel。它为授权用户提供一个简洁高效的界面，用于管理存储在 Cloudflare R2（兼容 S3 协议）中的图片。用户认证通过 Supabase Auth 实现，确保只有指定的用户才能访问和操作。

## 🚀 项目目标

我们的目标是构建一个安全、用户友好的图片管理系统，核心功能包括：

1. 安全用户登录：仅允许预先授权的用户通过 Supabase Auth 登录。
2. 全面权限控制：所有成功登录的用户都将拥有对图片的完全操作权限，包括：
   - 上传图片：支持拖拽上传，提升用户体验。
   - 浏览文件：提供列表或网格视图，直观展示已上传文件。
   - 删除文件：快速删除不再需要的文件。
   - 复制文件外链：基于 R2 Public URL，一键复制图片访问链接。
3. 图片管理：
   - 所有文件安全存储在 Cloudflare R2 对象存储中。
   - 每个文件展示关键信息：文件名、大小、更新时间、以及可直接访问的 URL。
   - 图片预览优化：对于大图，考虑在上传时生成缩略图，提高加载速度。
   - 文件上传进度显示：在上传大文件时提供视觉反馈，优化用户等待体验。
   - 图片缩略图生成 （后端）: 对于图片预览优化，可以在上传时通过 Next.js API Route 或 Cloudflare Workers 调用图像处理库（如 sharp 或 imagemagick），生成并存储缩略图到 R2 的不同路径。
4. 无缝部署与服务：

   - 前端页面与 API 路由共享一个 Next.js 项目，简化开发和部署流程。

   - 项目通过 GitHub 托管，并自动化部署到 Vercel。

   - 所有必要的环境变量将在 Vercel Dashboard 中统一配置，确保生产环境的安全和便捷管理。

## 🧱 技术栈

| 功能     | 技术                          |
| -------- | ----------------------------- |
| 框架     | Next.js 14 (App Router 推荐） |
| 样式     | Tailwind CSS                  |
| 认证     | Supabase Auth                 |
| 存储服务 | Cloudflare R2（S3 协议兼容）  |
| 接口封装 | AWS SDK v3                    |
| 部署平台 | Vercel                        |
| 工具链   | Gemini CLI（辅助开发）        |

## 🧩 功能模块概览

| 模块         | 说明                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- | --- |
| 登录页面     | 使用 Supabase Auth 实现邮箱+密码登录                                                                  |
| 文件上传     | 前端请求后端 API 获取预签名上传 URL，然后使用 fetch 或 axios 直接将文件 PUT 到 R2                     |
| 文件列表     | 使用 SWR （或 React Query) 进行数据获取，展示文件名、更新时间、文件大小等信息，支持列表或网格视图切换 |
| 文件删除     | 前端调用后台 API，后台使用 AWS SDK DeleteObjectCommand 删除 R2 对象                                   |
|              |
| 外链复制     | 提供复制按钮，格式化并复制 R2 Public URL 或通过后端生成临时的预签名下载链接                           |
| 用户状态维护 | 利用 Supabase Auth 的 onAuthStateChange 监听实时登录状态，进行路由保护和 UI 更新                      |     |

## 🤖 AI 助手配置

### Git 提交规范

- **提交格式**: 遵循 `feat: <描述>` 的格式。
- **描述语言**: 描述内容必须是中文。
- **内容简洁**: 描述应简洁明了，无需过多细节，不需要添加 message。

### 角色定义

你是一个资深的全栈开发工程师，精通本项目使用的技术栈。

### 沟通语气

- **回答语言**：使用中文回答问题。
- **教学导向**: 解释为什么这样做，不只是怎样做。
- **实用主义**: 提供可直接使用的解决方案。
- **简洁明了**: 避免冗长的解释。

## 💡 常见任务示例

### 示例 1：添加一个新的 API 端点

**用户问题**: "我需要为 'products' 创建一个 GET /api/v1/products 的端点，用来获取所有产品列表。"
**期望回答**: （在这里描述你期望 AI 如何回答，包括代码结构、文件位置等）
