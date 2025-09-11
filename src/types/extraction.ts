/**
 * 内容提取相关类型定义
 * 基于 sidebar_v2.md 文档
 * 扩展现有的 chat.ts 类型定义
 */

import type { PageData as BasePageData, ExtractedContent, UIState as BaseUIState } from './chat'

// 提取服务提供商
export type ExtractionProvider = 'readability' | 'jina';

// 增强的提取结果 (扩展现有的 ExtractedContent)
export interface EnhancedExtractionResult extends ExtractedContent {
  contentText: string;          // 纯文本内容 (若体积较大，持久化时压缩)
  contentMarkdown?: string;     // (可选) Markdown 格式
  meta: { 
    title?: string; 
    byline?: string; 
    lang?: string 
  };
  createdAt: string;            // ISO 8601 日期字符串
  contentHash?: string;         // contentText 的哈希值，用于幂等写入
}

// 增强的页面数据 (扩展现有的 PageData，添加提取相关字段)
export interface EnhancedPageData extends BasePageData {
  extractedContent: EnhancedExtractionResult;
}

// UI 瞬时状态 (非持久化) - Sidebar 专用
export interface SidebarUiState {
  inputDraft: string;            // 输入框草稿
  inputHeight: number;           // 输入框可变高度
  contentPanelHeight: number;    // 内容展示区可变高度
  imageDrafts: string[];         // 粘贴图片的预览 Data URL
  scrollAnchors: Record<string, number>; // 记录各消息的滚动锚点
}

// 增强的可持久化UI状态 (扩展现有的 UIState)
export interface EnhancedUIState extends BaseUIState {
  scrollPosition?: number;       // 滚动位置
}

// 提取状态类型
export type ExtractionStage = 'idle' | 'requesting_html' | 'parsing' | 'persisting' | 'completed' | 'error';

// 提取状态信息 (扩展现有的 ExtractionStatus 概念)
export interface DetailedExtractionStatus {
  status: 'loading' | 'completed' | 'error';
  stage?: ExtractionStage;
  error?: string;
  provider?: ExtractionProvider;
}
