export interface PagiaNode {
    id: string;
    name: string;
    agentId: string;
    description?: string;
}
export interface PagiaEdge {
    from: string;
    to: string;
}
export interface PagiaWorkflow {
    nodes: PagiaNode[];
    edges: PagiaEdge[];
}
export declare function detectFormat(json: any): 'n8n' | 'node-red' | 'unknown';
export declare function convertN8nToPagia(name: string, n8nData: any): string;
export declare function convertNodeRedToPagia(name: string, nodeRedNodes: any[]): string;
//# sourceMappingURL=workflow-converter.d.ts.map