/**
 * 简单的测试运行器
 * 用于验证主要功能是否正常工作
 */

import { useSidebarSessionStore } from '@/stores/sidebarSessionStore'
import { useSidebarActions } from '@/stores/sidebarActions'
import { useConfigStore } from '@/stores/configStore'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

class TestRunner {
  private results: TestResult[] = []

  // 执行所有测试
  async runAll(): Promise<TestResult[]> {
    console.log('🧪 Starting test runner...')
    
    await this.testStoreInitialization()
    await this.testMessageBridge()
    await this.testConfigStore()
    await this.testErrorHandling()

    console.log('✅ Test runner completed')
    return this.results
  }

  // 测试 Store 初始化
  private async testStoreInitialization() {
    try {
      const sessionStore = useSidebarSessionStore.getState()
      const actionsStore = useSidebarActions.getState()
      
      // 检查初始状态
      const hasValidState = 
        sessionStore.pageData === null &&
        sessionStore.isPageDataLoading === false &&
        typeof actionsStore.getPageData === 'function' &&
        typeof actionsStore.triggerExtraction === 'function'

      this.addResult('Store Initialization', hasValidState)
    } catch (error) {
      this.addResult('Store Initialization', false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 测试消息桥接
  private async testMessageBridge() {
    try {
      // 测试是否能创建消息信封
      const { createMessageEnvelope } = await import('@/utils/messageBridge')
      
      const envelope = createMessageEnvelope('getPageData', { url: 'test://example.com' })
      
      const isValidEnvelope = 
        envelope.id &&
        envelope.source === 'sidebar' &&
        envelope.target === 'background' &&
        envelope.action === 'getPageData' &&
        envelope.payload.url === 'test://example.com' &&
        envelope.version === 1

      this.addResult('Message Bridge', isValidEnvelope)
    } catch (error) {
      this.addResult('Message Bridge', false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 测试配置 Store
  private async testConfigStore() {
    try {
      const configStore = useConfigStore.getState()
      
      // 测试基本功能是否存在
      const hasFunctions = 
        typeof configStore.initializeConfig === 'function' &&
        typeof configStore.updateConfig === 'function' &&
        typeof configStore.clearError === 'function'

      this.addResult('Config Store', hasFunctions)
    } catch (error) {
      this.addResult('Config Store', false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 测试错误处理
  private async testErrorHandling() {
    try {
      // 测试 ErrorBoundary 组件是否能正确导入
      const { ErrorBoundary } = await import('@/components/common/ErrorBoundary')
      
      const isValidComponent = typeof ErrorBoundary === 'function'

      this.addResult('Error Handling', isValidComponent)
    } catch (error) {
      this.addResult('Error Handling', false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 添加测试结果
  private addResult(name: string, passed: boolean, error?: string) {
    const result: TestResult = { name, passed, error }
    this.results.push(result)
    
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${name}${error ? `: ${error}` : ''}`)
  }

  // 获取测试报告
  getReport(): string {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    let report = `\n📊 Test Report\n`
    report += `Total: ${totalTests}, Passed: ${passedTests}, Failed: ${failedTests}\n\n`

    if (failedTests > 0) {
      report += `❌ Failed Tests:\n`
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          report += `- ${r.name}: ${r.error || 'Unknown error'}\n`
        })
    }

    return report
  }
}

// 导出测试运行器
export const testRunner = new TestRunner()

// 在开发环境中自动运行测试
if (process.env.NODE_ENV === 'development') {
  // 延迟执行，确保模块都已加载
  setTimeout(async () => {
    try {
      await testRunner.runAll()
      console.log(testRunner.getReport())
    } catch (error) {
      console.error('🚨 Test runner failed:', error)
    }
  }, 1000)
}
