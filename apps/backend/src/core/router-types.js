/**
 * PAGIA - Router Configuration Types
 * Sistema de roteamento de modelos estilo claude-code-router
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
/**
 * Default router configuration
 */
export function getDefaultRouterConfig() {
    return {
        version: '1.0.0',
        providers: [],
        router: {
            default: {
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
            },
        },
        settings: {
            apiTimeout: 120000,
            disableTelemetry: true,
            disableCostWarnings: false,
            logLevel: 'info',
        },
    };
}
//# sourceMappingURL=router-types.js.map