/**
 * PAGIA - Plan Command
 * Gerenciamento de Planos de Ação
 */
import { Command } from 'commander';
interface InstallOptions {
    type: string;
    name: string;
    force?: boolean;
    dryRun?: boolean;
}
export declare const planCommand: Command;
export declare function listTemplates(pagiaFolder: string, type?: string): Array<{
    type: string;
    file: string;
}>;
export declare function listTemplatesDetailed(pagiaFolder: string, type?: string): Array<{
    type: string;
    file: string;
    content: any;
}>;
export declare function installTemplate(pagiaFolder: string, templateName: string, targetDir: string, opts?: {
    type?: string;
    name?: string;
    force?: boolean;
    dryRun?: boolean;
}): Promise<string>;
export declare function installTemplateInteractive(pagiaFolder: string, templateName: string, targetDir: string, opts?: {
    type?: string;
    name?: string;
    force?: boolean;
    dryRun?: boolean;
}): Promise<{
    canceled: boolean;
    path?: string;
}>;
export declare function generatePlanFile(pagiaFolder: string, type: string, name: string, template?: string): Promise<string>;
export declare function humanizeTemplateName(template: string): string;
/**
 * Install a template file from .pagia/plans/<type>/<name>.yaml into targetDir.
 * Returns { canceled: boolean, path?: string }
 */
export declare function installTemplateCLI(pagiaDir: string, name: string, targetDir: string, opts: InstallOptions): Promise<{
    canceled: boolean;
    path: string;
} | {
    canceled: boolean;
    path?: undefined;
}>;
export {};
//# sourceMappingURL=plan.d.ts.map