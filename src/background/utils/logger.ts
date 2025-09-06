/**
 * 统一日志服务
 * 基于 Winston，支持不同日志级别和结构化日志
 */

import { LogLevel, LogEntry } from '@/types'

class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private maxLogs = 1000 // 最大日志数量

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatMessage(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now(),
      context: context || undefined,
      source: 'background'
    }
  }

  private addLog(logEntry: LogEntry) {
    this.logs.push(logEntry)
    
    // 控制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // 输出到控制台 (开发环境)
    if (process.env.NODE_ENV === 'development') {
      const { level, message, context } = logEntry
      const logMethod = console[level] || console.log
      
      if (context) {
        logMethod(`[ThinkBot] ${message}`, context)
      } else {
        logMethod(`[ThinkBot] ${message}`)
      }
    }
  }

  debug(message: string, context?: any) {
    this.addLog(this.formatMessage('debug', message, context))
  }

  info(message: string, context?: any) {
    this.addLog(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: any) {
    this.addLog(this.formatMessage('warn', message, context))
  }

  error(message: string, context?: any) {
    this.addLog(this.formatMessage('error', message, context))
  }

  // 获取日志历史
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level)
    }

    return filteredLogs.slice(-limit)
  }

  // 清除日志
  clearLogs() {
    this.logs = []
    this.info('Logs cleared')
  }
}

// 导出单例实例
export const logger = Logger.getInstance()

// 导出便捷方法
export const log = {
  debug: (message: string, context?: any) => logger.debug(message, context),
  info: (message: string, context?: any) => logger.info(message, context),
  warn: (message: string, context?: any) => logger.warn(message, context),
  error: (message: string, context?: any) => logger.error(message, context),
}
