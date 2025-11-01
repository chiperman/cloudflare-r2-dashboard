# TODO List

## 文件上传前重命名功能实现方案 (方法二)

此方案旨在实现文件上传前的重命名功能，核心是在前端通过创建新的 `File` 对象来更新文件名，后端 API 无需做大的改动。

### 1. 前端修改 (`src/components/r2/upload-form.tsx`)

#### a. 状态管理

-   修改 `UploadableFile` 接口，增加一个 `newName` 字段来存储用户输入的新文件名。
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
-   在 `onDrop` 回调函数中，当文件被选择并创建 `UploadableFile` 对象时，用原始文件名 `file.name` 初始化 `newName` 字段。

#### b. UI/UX 设计实现

-   **引入新组件**: 导入 `Dialog`, `Drawer`, `Input`, `ScrollArea` 等 `shadcn/ui` 组件。
-   **构建暂存区 UI**:
    -   当 `files` 状态数组不为空时，不再直接渲染列表，而是弹出一个响应式的 UI 容器：
        -   **桌面端**: 使用 `<Dialog>` 组件。
        -   **移动端**: 使用 `<Drawer>` 组件。
    -   在 `Dialog`/`Drawer` 内部，使用 `<ScrollArea>` 包裹文件列表，以应对多文件场景。
    -   将原有的文件列表项逻辑移入此容器中。
-   **实现重命名输入框**:
    -   在每个文件列表项中，将原来显示文件名的静态文本 `<p>` 标签替换为 `<Input>` 组件。
    -   将 `Input` 的 `value` 绑定到对应文件在 state 中的 `newName` 属性。
    -   实现 `onChange` 事件处理器，当用户输入时，更新 state 中对应文件的 `newName` 值。
-   **实现 UX 优化**:
    -   **智能选中**: 当用户聚焦输入框时，默认只选中文件名主体，不包含扩展名。
    -   **即时验证**: 对输入框内容进行实时验证，确保文件名不为空或包含非法字符。

#### c. 上传逻辑修改

-   修改 `handleUploadAll` 函数。
-   在 `Promise.allSettled` 的 `map` 循环内部，调用 `uploadFile` 函数之前：
    1.  根据 `uploadableFile.newName` 和 `uploadableFile.file`（原始文件）创建一个新的 `File` 对象。
        ```javascript
        const fileWithNewName = new File(
          [uploadableFile.file],
          uploadableFile.newName,
          { type: uploadableFile.file.type }
        );
        ```
    2.  创建一个临时的 `UploadableFile` 对象，用 `fileWithNewName` 替换其中的 `file` 属性。
        ```javascript
        const finalUploadable = {
            ...uploadableFile,
            file: fileWithNewName
        };
        ```
    3.  将这个 `finalUploadable` 对象传递给 `uploadFile` 函数。

### 2. 后端修改 (`src/app/api/upload/route.ts`)

-   **无需修改**。后端 API 的逻辑保持不变。它会从 `FormData` 中接收到前端创建的、已经带有新名字的 `File` 对象，并像现在一样继续执行它的唯一化处理（附加随机 ID）、缩略图生成和上传流程。
