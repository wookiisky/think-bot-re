/**
 * 消息通信协议类型定义
 * 基于 sidebar_v2.md 文档的 CQRS 模式
 */

import type { ExtractionProvider, ExtractionStage } from './extraction'
import type { LLMMessage } from './providers'

// 消息信封 (Envelope)
export interface MessageEnvelope<TPayload> {
  id: string;                 // 消息的唯一ID (UUID)
  correlationId?: string;     // 用于关联请求与响应/流的ID
  source: 'sidebar' | 'options' | 'conversations' | 'background';
  target: 'background' | 'broadcast';
  action: string;             // 动作名称, e.g., 'getPageData'
  payload: TPayload;
  meta?: { 
    locale?: string; 
    traceId?: string; 
    pageUrl?: string; 
    tabId?: number 
  };
  version: 1;                 // 协议版本
}

// ============= 命令 (Commands: UI → Background) =============

// 获取页面数据
export interface GetPageDataCmd { 
  url: string 
}

// 触发内容提取
export interface TriggerExtractionCmd { 
  url: string; 
  provider: ExtractionProvider; 
  force?: boolean; 
}

// 删除页面数据
export interface DeletePageDataCmd { 
  url: string 
}

// 获取配置
export interface GetSettingsCmd {}

// 保存配置
export interface SaveSettingsCmd { 
  settings: unknown 
}

// 打开选项页 / 会话页（从 Sidebar 顶部入口）
export interface OpenOptionsPageCmd {}

export interface OpenConversationsPageCmd { 
  selectPageUrl?: string 
}

// 发送LLM消息（统一命令）
export interface SendLLMMessageCmd {
  modelId?: string
  messages: LLMMessage[]
  options?: {
    temperature?: number
    maxTokens?: number
  }
}

// ============= 事件 (Events: Background → UI) =============

// 通用数据/配置变更事件
export interface OnDataChangedEvt { 
  pageUrl: string 
}

export interface OnSettingsChangedEvt { 
  /* 配置变更详情可在此扩展 */ 
}

export interface OnSyncStatusChangedEvt { 
  status: 'syncing' | 'success' | 'error'; 
  message?: string 
}

// 内容提取状态变更事件
export interface OnExtractionStatusChangedEvt {
  pageUrl: string;
  status: 'loading' | 'completed' | 'error';
  stage?: ExtractionStage; // 当前所处阶段
  error?: string;
}

// LLM 流式事件（统一对外事件名）
export interface OnStreamStartEvt {
  pageUrl?: string
  tabId?: string
  messageBranchId: string
}

export interface OnStreamUpdateEvt {
  pageUrl?: string
  tabId?: string
  messageBranchId: string
  chunk: string
}

export interface OnStreamEndEvt {
  pageUrl?: string
  tabId?: string
  messageBranchId: string
}

// ============= 类型约束映射 =============

// 所有可用的命令类型
export type CommandPayload = 
  | GetPageDataCmd
  | TriggerExtractionCmd
  | DeletePageDataCmd
  | GetSettingsCmd
  | SaveSettingsCmd
  | OpenOptionsPageCmd
  | OpenConversationsPageCmd
  | SendLLMMessageCmd;

// 所有可用的事件类型
export type EventPayload = 
  | OnDataChangedEvt
  | OnSettingsChangedEvt
  | OnSyncStatusChangedEvt
  | OnExtractionStatusChangedEvt
  | OnStreamStartEvt
  | OnStreamUpdateEvt
  | OnStreamEndEvt;

// 命令名称到载荷类型的映射
export interface CommandMap {
  'getPageData': GetPageDataCmd;
  'triggerExtraction': TriggerExtractionCmd;
  'deletePageData': DeletePageDataCmd;
  'getSettings': GetSettingsCmd;
  'saveSettings': SaveSettingsCmd;
  'openOptionsPage': OpenOptionsPageCmd;
  'openConversationsPage': OpenConversationsPageCmd;
  'sendLLMMessage': SendLLMMessageCmd;
}

// 事件名称到载荷类型的映射
export interface EventMap {
  'onDataChanged': OnDataChangedEvt;
  'onSettingsChanged': OnSettingsChangedEvt;
  'onSyncStatusChanged': OnSyncStatusChangedEvt;
  'onExtractionStatusChanged': OnExtractionStatusChangedEvt;
  'onStreamStart': OnStreamStartEvt;
  'onStreamUpdate': OnStreamUpdateEvt;
  'onStreamEnd': OnStreamEndEvt;
}

// 泛型消息类型
export type Command<T extends keyof CommandMap = keyof CommandMap> = MessageEnvelope<CommandMap[T]>;
export type Event<T extends keyof EventMap = keyof EventMap> = MessageEnvelope<EventMap[T]>;
