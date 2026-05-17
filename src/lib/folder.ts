import { z } from 'zod';

export const folderNameSchema = z
  .string()
  .min(1)
  .regex(/^[a-zA-Z0-9_-]+$/, '无效的文件夹名称。名称只能包含字母、数字、连字符和下划线。');

export const folderPrefixSchema = z
  .string()
  .regex(/^([A-Za-z0-9._-]+\/)*$/, '无效的文件夹路径。')
  .or(z.literal(''));

export const createFolderPayloadSchema = z.object({
  folderName: folderNameSchema,
  currentPrefix: folderPrefixSchema,
});

export const deleteFolderPayloadSchema = z.object({
  prefix: folderPrefixSchema.refine((value) => value.length > 0, '无效的文件夹路径。'),
});
