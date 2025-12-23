/**
 * PAGIA - Core Index
 * Exportações do módulo core
 * 
 * @module core
 * @author Automações Comerciais Integradas
 */

export { AIService, createAIService, AIMessage, AIResponse } from './ai-service.js';
export { ConfigManager, getConfigManager } from './config-manager.js';
export { EventBus, eventBus, PAGIAEvents, EventHandler } from './event-bus.js';
export { ModuleLoader, moduleLoader } from './module-loader.js';
