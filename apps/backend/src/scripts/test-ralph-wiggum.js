/**
 * Script de teste para o plugin Ralph-Wiggum
 * Demonstração das funcionalidades para tarefas de longa duração
 */
const { PluginManager } = require('../core/plugin-system');
async function testRalphWiggumPlugin() {
    console.log('🧪 Testando Plugin Ralph-Wiggum para Tarefas de Longa Duração\n');
    try {
        // Carregar plugin
        const pluginManager = PluginManager.getInstance();
        await pluginManager.loadAll();
        const ralphPlugin = pluginManager.get('ralph-wiggum');
        if (!ralphPlugin) {
            console.log('❌ Plugin Ralph-Wiggum não encontrado');
            return;
        }
        console.log('✅ Plugin Ralph-Wiggum carregado com sucesso!');
        console.log('📋 Manifesto:', ralphPlugin.manifest);
        // Testar comando de tarefa longa
        console.log('\n🚀 Testando comando de tarefa de longa duração...');
        const longTaskCommand = require('./plugins/ralph-wiggum/commands/long-task.js');
        const testArgs = {
            task: 'Implemente uma função de validação de formulário completo com testes unitários',
            dangerouslySkipPermissions: true // Como mencionado na sua estratégia
        };
        const result = await longTaskCommand(testArgs, {});
        console.log('📊 Resultado do teste:');
        console.log(JSON.stringify(result, null, 2));
        // Testar hook PostAgentRun
        console.log('\n🔍 Testando hook PostAgentRun...');
        const postAgentRunHook = require('./plugins/ralph-wiggum/hooks/post-agent-run.js');
        const mockContext = {
            agent: { name: 'Dev' },
            result: { content: 'Função implementada com sucesso', tokensUsed: 1500 },
            task: {
                id: 'test-task-123',
                prompt: 'Implemente validação de formulário',
                description: 'Tarefa de implementação'
            }
        };
        const hookResult = await postAgentRunHook(mockContext);
        console.log('훅 resultado:', hookResult);
        console.log('\n✅ Todos os testes concluídos com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro nos testes:', error);
    }
}
// Executar testes se chamado diretamente
if (require.main === module) {
    testRalphWiggumPlugin();
}
module.exports = { testRalphWiggumPlugin };
export {};
//# sourceMappingURL=test-ralph-wiggum.js.map