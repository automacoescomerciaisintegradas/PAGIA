export interface VibeGeneratorOptions {
    projectName: string;
    projectRoot?: string;
    vibe?: string;
}
export declare function generateVibeProject(options: VibeGeneratorOptions): Promise<{
    path: string;
    success: boolean;
}>;
//# sourceMappingURL=vibe-generator.d.ts.map