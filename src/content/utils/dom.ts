/**
 * DOM操作工具函数
 */

/**
 * 等待DOM就绪
 */
export function waitForDOM(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve())
    } else {
      resolve()
    }
  })
}

/**
 * 等待页面完全加载
 */
export function waitForLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve()
    } else {
      window.addEventListener('load', () => resolve())
    }
  })
}

/**
 * 智能等待页面内容
 * 对于SPA应用，可能需要等待动态内容加载
 */
export async function waitForContent(maxWait = 3000): Promise<void> {
  await waitForDOM()
  
  return new Promise((resolve) => {
    const startTime = Date.now()
    let lastBodySize = document.body.innerHTML.length
    let unchangedCount = 0
    
    const checkContent = () => {
      const currentSize = document.body.innerHTML.length
      
      if (currentSize === lastBodySize) {
        unchangedCount++
      } else {
        unchangedCount = 0
        lastBodySize = currentSize
      }
      
      // 内容稳定或达到最大等待时间
      if (unchangedCount >= 3 || Date.now() - startTime >= maxWait) {
        resolve()
      } else {
        setTimeout(checkContent, 500)
      }
    }
    
    setTimeout(checkContent, 500)
  })
}

/**
 * 获取页面主要内容区域
 */
export function getMainContent(): HTMLElement | null {
  // 常见的主内容选择器
  const selectors = [
    'main',
    '[role="main"]',
    '#main',
    '.main',
    '#content',
    '.content',
    'article',
    '.article',
    '#post',
    '.post'
  ]
  
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement
    if (element && element.textContent && element.textContent.trim().length > 100) {
      return element
    }
  }
  
  return document.body
}

/**
 * 移除脚本和样式标签
 */
export function cleanHTML(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  
  // 移除脚本标签
  const scripts = div.querySelectorAll('script')
  scripts.forEach(script => script.remove())
  
  // 移除样式标签
  const styles = div.querySelectorAll('style')
  styles.forEach(style => style.remove())
  
  // 移除注释
  const walker = document.createTreeWalker(
    div,
    NodeFilter.SHOW_COMMENT,
    null
  )
  
  const comments: Node[] = []
  let node
  while ((node = walker.nextNode())) {
    comments.push(node)
  }
  
  comments.forEach(comment => comment.parentNode?.removeChild(comment))
  
  return div.innerHTML
}

/**
 * 简单的日志函数
 */
export const log = {
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ThinkBot Content] ${message}`, ...args)
    }
  },
  info: (message: string, ...args: any[]) => {
    console.log(`[ThinkBot Content] ${message}`, ...args)
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[ThinkBot Content] ${message}`, ...args)
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ThinkBot Content] ${message}`, ...args)
  }
}
