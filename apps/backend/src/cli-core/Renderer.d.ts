/**
 * PAGIA CLI Renderer
 * Renderização consistente de blocos de texto
 */
export declare class Renderer {
    static block(title: string, content: string): void;
    static error(message: string): void;
    static success(message: string): void;
    static info(message: string): void;
    static spinner(text: string): {
        stop: () => void;
        update: (text: string) => void;
    };
}
//# sourceMappingURL=Renderer.d.ts.map