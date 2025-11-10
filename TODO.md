# TODO List

## 任务一：优化手机移动端图片预览体验

**目标**: 将手机移动端的文件预览形式从 `Dialog` 修改为 `Drawer`，并确保操作一致性和用户友好性。

**具体要求**:
1.  **预览组件**: 重构现有的 `MobilePreviewDrawer` 组件 (`src/components/r2/mobile-preview-drawer.tsx`) 来实现此功能。
2.  **内容**: `Drawer` 内部应包含：
    *   图片预览区域。
    *   文件名称显示。
    *   **导航按钮**: 在底部操作区放置“上一张”和“下一张”按钮，用于图片切换。
    *   **操作按钮**: 包含“下载”、“复制链接”、“复制图片”、“删除”等功能按钮。
3.  **布局一致性**: `Drawer` 内所有操作按钮的布局、顺序和样式（包括图标）需**严格参照** `src/components/r2/file-list.tsx` 中每个文件项的 `DropdownMenu` 菜单。
4.  **交互**:
    *   在 `src/components/r2/file-list.tsx` 中，根据屏幕尺寸（移动端）动态判断，点击文件项时打开 `MobilePreviewDrawer`。
    *   **禁止滑动切换**: 不实现左右滑动切换图片的功能，以避免与 `Drawer` 组件本身的关闭手势（如边缘滑动）产生冲突，影响用户体验。
5.  **涉及文件**:
    *   `src/components/r2/mobile-preview-drawer.tsx` (新创建)
    *   `src/components/r2/file-list.tsx` (修改，用于集成新抽屉和移动端判断逻辑)

## 任务二：

在移动端，部分 Drawer（如菜单、预览）打开时不会唤起浏览器的底部任务栏，导致 Drawer 底部出现一块透明/空白区域。这是因为这些 Drawer 不包含 '\<input>' 元素，无法触发浏览器的视口调整。

JavaScript 焦点欺骗 （推荐）

- 原理：模拟输入行为，欺骗浏览器调整视口。
- 实施：
  - 在目标 Drawer 组件（如 mobile-menu.tsx 和 file-list.tsx 的预览 Drawer）中，添加一个样式为 position: absolute; left: -9999px; 的隐藏 '''\<input>''' 元素。
  - 使用 useEffect 监听 Drawer 的打开状态。
  - 当 Drawer 打开时，通过 ref 短暂地 focus() 这个隐藏的输入框，然后立即 blur() 它。
  - 这个快速的操作会触发浏览器显示任务栏，但用户不会感知到键盘的弹出。

## 任务三：文件上传前重命名功能实现方案

此方案旨在实现文件上传前的重命名功能，核心是在前端通过创建新的 `File` 对象来更新文件名，后端 API 无需做大的改动。

### 1. 前端修改 (`src/components/r2/upload-form.tsx`)

#### a. 状态管理

- 修改 `UploadableFile` 接口，增加一个 `newName` 字段来存储用户输入的新文件名。
  ```typescript
  interface UploadableFile {
    id: string;
    file: File;
    newName: string; // 新增字段
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error' | 'converting';
    // ...
  }
  ```
- 在 `onDrop` 回调函数中，当文件被选择并创建 `UploadableFile` 对象时，用原始文件名 `file.name` 初始化 `newName` 字段。

#### b. UI/UX 设计实现

- **引入新组件**: 导入 `Dialog`, `Drawer`, `Input`, `ScrollArea` 等 `shadcn/ui` 组件。
- **构建暂存区 UI**:
  - 当 `files` 状态数组不为空时，不再直接渲染列表，而是弹出一个响应式的 UI 容器：
    - **桌面端**: 使用 `<Dialog>` 组件。
    - **移动端**: 使用 `<Drawer>` 组件。
  - 在 `Dialog`/`Drawer` 内部，使用 `<ScrollArea>` 包裹文件列表，以应对多文件场景。
  - 将原有的文件列表项逻辑移入此容器中。
- **实现重命名输入框**:
  - 在每个文件列表项中，将原来显示文件名的静态文本 `<p>` 标签替换为 `<Input>` 组件。
  - 将 `Input` 的 `value` 绑定到对应文件在 state 中的 `newName` 属性。
  - 实现 `onChange` 事件处理器，当用户输入时，更新 state 中对应文件的 `newName` 值。
- **实现 UX 优化**:
  - **智能选中**: 当用户聚焦输入框时，默认只选中文件名主体，不包含扩展名。
  - **即时验证**: 对输入框内容进行实时验证，确保文件名不为空或包含非法字符。

#### c. 上传逻辑修改

- 修改 `handleUploadAll` 函数。
- 在 `Promise.allSettled` 的 `map` 循环内部，调用 `uploadFile` 函数之前：
  1.  根据 `uploadableFile.newName` 和 `uploadableFile.file`（原始文件）创建一个新的 `File` 对象。
      ```javascript
      const fileWithNewName = new File([uploadableFile.file], uploadableFile.newName, {
        type: uploadableFile.file.type,
      });
      ```
  2.  创建一个临时的 `UploadableFile` 对象，用 `fileWithNewName` 替换其中的 `file` 属性。
      ```javascript
      const finalUploadable = {
        ...uploadableFile,
        file: fileWithNewName,
      };
      ```
  3.  将这个 `finalUploadable` 对象传递给 `uploadFile` 函数。

### 2. 后端修改 (`src/app/api/upload/route.ts`)

- **无需修改**。后端 API 的逻辑保持不变。它会从 `FormData` 中接收到前端创建的、已经带有新名字的 `File` 对象，并像现在一样继续执行它的唯一化处理（附加随机 ID）、缩略图生成和上传流程。
