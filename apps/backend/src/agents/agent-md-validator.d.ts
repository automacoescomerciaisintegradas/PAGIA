export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare function validateAgentMarkdownContent(content: string): ValidationResult;
export declare function validateAgentMarkdownFile(path: string): ValidationResult;
//# sourceMappingURL=agent-md-validator.d.ts.map