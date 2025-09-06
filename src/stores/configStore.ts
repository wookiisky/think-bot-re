/**
 * Configuration Store
 * Manages global configuration state with persistence
 */

import React from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { ThinkBotConfig, LLMModel, QuickInput, BasicConfig, BlacklistConfig, SyncConfig } from '@/types/config'
import { StorageService } from '@/background/services/storage'

interface ConfigState {
  // Configuration data
  config: ThinkBotConfig | null
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Error state
  error: string | null
}

interface ConfigActions {
  // Initialize config from storage
  initializeConfig: () => Promise<void>
  
  // Update entire config
  updateConfig: (config: ThinkBotConfig) => Promise<void>
  
  // Update specific sections
  updateBasicConfig: (basic: Partial<BasicConfig>) => Promise<void>
  updateLLMModels: (models: LLMModel[]) => Promise<void>
  updateQuickInputs: (quickInputs: QuickInput[]) => Promise<void>
  updateBlacklistConfig: (blacklist: BlacklistConfig) => Promise<void>
  updateSyncConfig: (sync: SyncConfig) => Promise<void>
  
  // Add/remove operations
  addLLMModel: (model: LLMModel) => Promise<void>
  removeLLMModel: (modelId: string) => Promise<void>
  addQuickInput: (quickInput: QuickInput) => Promise<void>
  removeQuickInput: (quickInputId: string) => Promise<void>
  
  // Utilities
  resetConfig: () => Promise<void>
  clearError: () => void
}

type ConfigStore = ConfigState & ConfigActions

// Custom storage that uses unified StorageService with compression
const persistStorage = {
  getItem: async (_name: string): Promise<string | null> => {
    try {
      const storageService = StorageService.getInstance()
      const result = await storageService.getConfig()
      
      if (result.success && result.data) {
        return JSON.stringify(result.data)
      }
      return null
    } catch (error) {
      console.error('Config persist getItem failed:', error)
      return null
    }
  },
  
  setItem: async (_name: string, value: string): Promise<void> => {
    try {
      const storageService = StorageService.getInstance()
      const config = JSON.parse(value) as ThinkBotConfig
      const result = await storageService.setConfig(config)
      if (!result.success) {
        console.error('Config persist setItem failed:', result.error)
      }
    } catch (error) {
      console.error('Config persist setItem failed:', error)
    }
  },
  
  removeItem: async (_name: string): Promise<void> => {
    try {
      const storageService = StorageService.getInstance()
      await storageService.clear()
    } catch (error) {
      console.error('Config persist removeItem failed:', error)
    }
  }
}

// Default configuration
const createDefaultConfig = (): ThinkBotConfig => ({
  exportedAt: new Date().toISOString(),
  version: '2.0.0',
  exportedBy: 'think-bot-re',
  config: {
    llm_models: {
      models: []
    },
    quickInputs: [],
    basic: {
      defaultExtractionMethod: 'readability',
      jinaApiKey: '',
      jinaResponseTemplate: '',
      systemPrompt: 'You are a helpful AI assistant. Please provide accurate and helpful responses.',
      contentDisplayHeight: 300,
      theme: 'system',
      defaultModelId: '',
      language: 'zh_CN',
      lastModified: Date.now()
    },
    blacklist: {
      patterns: []
    },
    sync: {
      syncWhenSave: false,
      lastSyncTime: 0,
      deviceId: crypto.randomUUID()
    }
  }
})

export const useConfigStore = create<ConfigStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        config: null,
        isLoading: false,
        isInitialized: false,
        error: null,

        // Initialize config from storage
        initializeConfig: async () => {
          const { isInitialized, isLoading } = get()
          if (isInitialized || isLoading) {
            console.log('Config already initialized or loading, skipping')
            return
          }

          console.log('Config initialization started')
          set({ isLoading: true, error: null })

          try {
            let config: ThinkBotConfig | null = null

            // Use unified storage service with compression
            console.log('Attempting to load config using StorageService')
            try {
              const storageService = StorageService.getInstance()
              const result = await Promise.race([
                storageService.getConfig(),
                new Promise<{ success: false; error: string }>((_, reject) =>
                  setTimeout(() => reject(new Error('Storage timeout')), 5000)
                )
              ])
              
              console.log('StorageService result:', result)
              if (result.success && result.data) {
                config = result.data
                console.log('Config loaded from StorageService successfully')
              } else {
                console.log('No existing config found, will create default')
              }
            } catch (storageError) {
              console.warn('Failed to load from StorageService:', storageError)
            }

            // If storage failed or not available, use default config
            if (!config) {
              console.log('Using default config')
              config = createDefaultConfig()
              
              // Try to save default config
              try {
                const storageService = StorageService.getInstance()
                const setResult = await Promise.race([
                  storageService.setConfig(config),
                  new Promise<{ success: false; error: string }>((_, reject) =>
                    setTimeout(() => reject(new Error('Save timeout')), 3000)
                  )
                ])
                if (setResult.success) {
                  console.log('Default config saved successfully')
                } else {
                  console.warn('Failed to save default config:', setResult.error)
                }
              } catch (saveError) {
                console.warn('Failed to save default config:', saveError)
              }
            }

            // Always set the config, even if save failed
            set({ 
              config, 
              isInitialized: true, 
              isLoading: false,
              error: null
            })
            console.log('Config initialization completed successfully')

          } catch (error) {
            console.error('Config initialization failed:', error)
            // Fallback to default config even on error
            const defaultConfig = createDefaultConfig()
            set({ 
              config: defaultConfig,
              error: error instanceof Error ? error.message : 'Failed to initialize config, using defaults',
              isInitialized: true,
              isLoading: false 
            })
            console.log('Config initialization completed with fallback')
          }
        },

        // Update entire config
        updateConfig: async (newConfig: ThinkBotConfig) => {
          try {
            const storageService = StorageService.getInstance()
            const updatedConfig = {
              ...newConfig,
              exportedAt: new Date().toISOString()
            }
            
            const result = await storageService.setConfig(updatedConfig)
            if (result.success) {
              set({ config: updatedConfig, error: null })
              console.log('Config updated successfully')
            } else {
              throw new Error(result.error || 'Failed to save config')
            }
          } catch (error) {
            console.error('Failed to update config:', error)
            set({ error: error instanceof Error ? error.message : 'Failed to update config' })
          }
        },

        // Update basic config
        updateBasicConfig: async (basicUpdate: Partial<BasicConfig>) => {
          const { config } = get()
          if (!config || !config.config || !config.config.basic) {
            console.warn('Cannot update basic config: config not initialized properly')
            return
          }

          const updatedConfig = {
            ...config,
            config: {
              ...config.config,
              basic: {
                ...config.config.basic,
                ...basicUpdate,
                lastModified: Date.now()
              }
            }
          }

          await get().updateConfig(updatedConfig)
        },

        // Update LLM models
        updateLLMModels: async (models: LLMModel[]) => {
          const { config } = get()
          if (!config || !config.config) {
            console.warn('Cannot update LLM models: config not initialized properly')
            return
          }

          const updatedConfig = {
            ...config,
            config: {
              ...config.config,
              llm_models: { models }
            }
          }

          await get().updateConfig(updatedConfig)
        },

        // Update quick inputs
        updateQuickInputs: async (quickInputs: QuickInput[]) => {
          const { config } = get()
          if (!config || !config.config) {
            console.warn('Cannot update quick inputs: config not initialized properly')
            return
          }

          const updatedConfig = {
            ...config,
            config: {
              ...config.config,
              quickInputs
            }
          }

          await get().updateConfig(updatedConfig)
        },

        // Update blacklist config
        updateBlacklistConfig: async (blacklist: BlacklistConfig) => {
          const { config } = get()
          if (!config || !config.config) {
            console.warn('Cannot update blacklist config: config not initialized properly')
            return
          }

          const updatedConfig = {
            ...config,
            config: {
              ...config.config,
              blacklist
            }
          }

          await get().updateConfig(updatedConfig)
        },

        // Update sync config
        updateSyncConfig: async (sync: SyncConfig) => {
          const { config } = get()
          if (!config || !config.config) {
            console.warn('Cannot update sync config: config not initialized properly')
            return
          }

          const updatedConfig = {
            ...config,
            config: {
              ...config.config,
              sync
            }
          }

          await get().updateConfig(updatedConfig)
        },

        // Add LLM model
        addLLMModel: async (model: LLMModel) => {
          const { config } = get()
          if (!config || !config.config?.llm_models?.models) {
            console.warn('Cannot add LLM model: config not initialized properly')
            return
          }

          const models = [...config.config.llm_models.models, model]
          await get().updateLLMModels(models)
        },

        // Remove LLM model
        removeLLMModel: async (modelId: string) => {
          const { config } = get()
          if (!config || !config.config?.llm_models?.models) {
            console.warn('Cannot remove LLM model: config not initialized properly')
            return
          }

          const models = config.config.llm_models.models.filter(m => m.id !== modelId)
          await get().updateLLMModels(models)
        },

        // Add quick input
        addQuickInput: async (quickInput: QuickInput) => {
          const { config } = get()
          if (!config || !config.config || config.config.quickInputs === undefined) {
            console.warn('Cannot add quick input: config not initialized properly')
            return
          }

          const quickInputs = [...config.config.quickInputs, quickInput]
          await get().updateQuickInputs(quickInputs)
        },

        // Remove quick input
        removeQuickInput: async (quickInputId: string) => {
          const { config } = get()
          if (!config || !config.config || config.config.quickInputs === undefined) {
            console.warn('Cannot remove quick input: config not initialized properly')
            return
          }

          const quickInputs = config.config.quickInputs.filter(q => q.id !== quickInputId)
          await get().updateQuickInputs(quickInputs)
        },

        // Reset config to defaults
        resetConfig: async () => {
          const defaultConfig = createDefaultConfig()
          await get().updateConfig(defaultConfig)
        },

        // Clear error
        clearError: () => {
          set({ error: null })
        }
      }),
      {
        name: 'think-bot-config',
        storage: createJSONStorage(() => persistStorage),
        partialize: (state) => ({ 
          config: state.config 
        }),
        onRehydrateStorage: () => (state) => {
          console.log('Zustand rehydration started')
          if (state) {
            // Check if we have a valid complete config
            const hasValidConfig = state.config && 
              state.config.config && 
              state.config.config.basic &&
              state.config.config.llm_models &&
              state.config.config.quickInputs !== undefined &&
              state.config.config.blacklist &&
              state.config.config.sync
            
            console.log('Rehydration config validation:', hasValidConfig)
            
            if (hasValidConfig) {
              // If we have valid config, mark as initialized and stop loading
              state.isInitialized = true
              state.isLoading = false
              state.error = null
              console.log('Config rehydrated successfully')
            } else {
              // If config is invalid or incomplete, reset state to trigger manual initialization
              state.config = null
              state.isInitialized = false
              state.isLoading = false
              state.error = null
              console.log('Invalid config rehydrated, will trigger manual initialization')
            }
          } else {
            // No state to rehydrate, ensure clean initial state
            console.log('No state to rehydrate, using clean initial state')
            // The initial state is already correct, don't change anything
          }
        }
      }
    ),
    {
      name: 'ConfigStore'
    }
  )
)

// Cached empty arrays to avoid reference changes
const EMPTY_MODELS_ARRAY: LLMModel[] = []
const EMPTY_QUICK_INPUTS_ARRAY: QuickInput[] = []

// Export convenience selectors with enhanced null safety
export const useConfig = () => useConfigStore(state => state.config)
export const useBasicConfig = () => useConfigStore(state => {
  // Ensure we have a complete config structure before returning basic config
  if (!state.config?.config?.basic) return null
  return state.config.config.basic
})
export const useLLMModels = () => useConfigStore(state => {
  if (!state.config?.config?.llm_models?.models) return EMPTY_MODELS_ARRAY
  return state.config.config.llm_models.models
})
export const useQuickInputs = () => useConfigStore(state => {
  if (!state.config?.config || state.config.config.quickInputs === undefined) return EMPTY_QUICK_INPUTS_ARRAY
  return state.config.config.quickInputs
})
export const useBlacklistConfig = () => useConfigStore(state => {
  if (!state.config?.config?.blacklist) return null
  return state.config.config.blacklist
})
export const useSyncConfig = () => useConfigStore(state => {
  if (!state.config?.config?.sync) return null
  return state.config.config.sync
})

// Export initialization hook - fixed to avoid infinite loop by caching returned object
export const useInitializeConfig = () => {
  const initializeConfig = useConfigStore(state => state.initializeConfig)
  const isInitialized = useConfigStore(state => state.isInitialized)
  const isLoading = useConfigStore(state => state.isLoading)
  
  // Use React.useMemo to cache the returned object and prevent new object creation on each render
  return React.useMemo(() => ({
    initializeConfig,
    isInitialized,
    isLoading
  }), [initializeConfig, isInitialized, isLoading])
}
