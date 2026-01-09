/**
 * Test script for plugin installation
 */

import { pluginManager } from './apps/backend/src/core/plugin-system.js';

async function testPluginInstallation() {
    console.log('Testing plugin installation...');
    
    try {
        // Install the ralph-wiggum plugin from local directory
        await pluginManager.install('./ralph-wiggum');
        console.log('Plugin installed successfully!');
        
        // List installed plugins
        await pluginManager.loadAll();
        const plugins = pluginManager.list();
        console.log('Installed plugins:', plugins.map(p => p.manifest.name));
        
        // Check if ralph-wiggum is installed
        const ralphPlugin = pluginManager.get('ralph-wiggum');
        if (ralphPlugin) {
            console.log('✅ Ralph Wiggum plugin installed successfully!');
            console.log('Plugin details:', ralphPlugin.manifest);
        } else {
            console.log('❌ Ralph Wiggum plugin not found after installation');
        }
    } catch (error) {
        console.error('Error installing plugin:', error);
    }
}

testPluginInstallation();