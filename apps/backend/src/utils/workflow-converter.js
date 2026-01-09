export function detectFormat(json) {
    if (Array.isArray(json)) {
        // Node-RED is typically an array of nodes, and nodes have 'wires' property
        const hasWires = json.some(item => Array.isArray(item.wires));
        if (hasWires)
            return 'node-red';
    }
    else if (typeof json === 'object' && json !== null) {
        // n8n object has 'nodes' array and 'connections' object
        if (Array.isArray(json.nodes) && typeof json.connections === 'object') {
            return 'n8n';
        }
    }
    return 'unknown';
}
function normalizeId(id) {
    return id.toLowerCase().replace(/[^a-z0-9]/g, '-');
}
export function convertN8nToPagia(name, n8nData) {
    const nodes = n8nData.nodes.map((node) => {
        let agentId = 'analyst';
        const type = node.type.toLowerCase();
        if (type.includes('code') || type.includes('function'))
            agentId = 'developer';
        if (type.includes('webhook') || type.includes('trigger'))
            agentId = 'planner';
        if (type.includes('if') || type.includes('switch') || type.includes('filter'))
            agentId = 'analyst';
        return {
            id: normalizeId(node.name),
            name: node.name,
            agentId: agentId,
            description: `Importado do n8n (Tipo: ${node.type})`
        };
    });
    const edges = [];
    // n8n connections: { "NodeName": { "main": [ [ { "node": "TargetName", ... } ] ] } }
    Object.keys(n8nData.connections).forEach(sourceName => {
        const sourceOutputs = n8nData.connections[sourceName];
        Object.keys(sourceOutputs).forEach(outputType => {
            const routes = sourceOutputs[outputType];
            routes.forEach((route) => {
                route.forEach((connection) => {
                    if (connection.node) {
                        edges.push({
                            from: normalizeId(sourceName),
                            to: normalizeId(connection.node)
                        });
                    }
                });
            });
        });
    });
    return generateYaml(name, nodes, edges, 'Importado do n8n');
}
export function convertNodeRedToPagia(name, nodeRedNodes) {
    // Node-RED stores nodes in a flat array
    // Filter out config nodes (z property usually indicates tab/flow ID, but config nodes might not have wires)
    // We want nodes that are part of the flow (have wires or are explicitly structural)
    // Filter tabs (type 'tab') and config nodes (usually don't have wires, or are specific types needed for others)
    // For simplicity, we process nodes that have 'x', 'y', 'type', 'wires'.
    const flowNodes = nodeRedNodes.filter(n => n.type !== 'tab' && n.type !== 'comment' && n.wires);
    const nodes = flowNodes.map(node => {
        let agentId = 'analyst';
        const type = node.type.toLowerCase();
        if (type === 'function' || type === 'exec')
            agentId = 'developer';
        if (type === 'inject')
            agentId = 'planner';
        if (type === 'debug')
            agentId = 'analyst';
        if (type.includes('switch') || type.includes('change'))
            agentId = 'analyst';
        if (type.includes('request'))
            agentId = 'developer'; // HTTP requests usually
        // Node-RED IDs are short UUIDs. We can keep them or use Name if available and unique.
        // Using ID is safer for uniqueness, but Name is better for readability.
        // Let's use ID as key but maybe Name in description/label.
        // PAGIA needs human readable IDs if possible, but Node-RED names are optional.
        const nodeName = node.name || node.label || `${node.type}-${node.id.substring(0, 6)}`;
        const nodeId = node.id; // Keep original ID for wiring, normalization happens later if needed, but safe to keep alphanumeric
        // Description from info or type
        const description = node.info ? `Info: ${node.info}` : `Importado do Node-RED (Tipo: ${node.type})`;
        return {
            id: nodeId, // We use original ID to map wires easily
            name: nodeName,
            agentId: agentId,
            description: description
        };
    });
    const edges = [];
    flowNodes.forEach(node => {
        if (node.wires && Array.isArray(node.wires)) {
            // wires is array of arrays (for multiple outputs)
            node.wires.forEach((outputConnections, outputIndex) => {
                outputConnections.forEach(targetId => {
                    // Check if target exists in our filtered list
                    if (nodes.find(n => n.id === targetId)) {
                        edges.push({
                            from: node.id,
                            to: targetId
                        });
                    }
                });
            });
        }
    });
    return generateYaml(name, nodes, edges, 'Importado do Node-RED');
}
function generateYaml(name, nodes, edges, sourceDescription) {
    // Conectar "nodos soltos" que parecem ser start ao __start__
    const targets = new Set(edges.map(e => e.to));
    const potentialStarts = nodes.filter(n => !targets.has(n.id));
    const finalEdges = [...edges];
    potentialStarts.forEach(n => {
        finalEdges.unshift({ from: '__start__', to: n.id });
    });
    // Conectar "nodos soltos" que não têm saída ao __end__
    const sources = new Set(edges.map(e => e.from));
    const potentialEnds = nodes.filter(n => !sources.has(n.id));
    potentialEnds.forEach(n => {
        finalEdges.push({ from: n.id, to: '__end__' });
    });
    const nodesYaml = nodes.map(n => `  - id: "${n.id}"\n    name: "${n.name}"\n    agentId: ${n.agentId}\n    description: "${n.description || ''}"`).join('\n\n');
    const edgesYaml = finalEdges.map(e => `  - from: "${e.from}"\n    to: "${e.to}"`).join('\n');
    return `# Workflow: ${name}
id: ${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}
name: ${name}
description: ${sourceDescription} via PAGIA CLI

config:
  maxConcurrency: 1
  timeout: 300000
  failFast: true

nodes:
${nodesYaml}

edges:
${edgesYaml}
`;
}
//# sourceMappingURL=workflow-converter.js.map