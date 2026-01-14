import * as vscode from 'vscode';

export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}

export class Logger {
    private static outputChannel: vscode.OutputChannel;
    private static logLevel: LogLevel = LogLevel.Info;

    static initialize(context: vscode.ExtensionContext): void {
        this.outputChannel = vscode.window.createOutputChannel('MCP Container Tools');
        context.subscriptions.push(this.outputChannel);
        
        // Read log level from configuration
        const config = vscode.workspace.getConfiguration('mcpContainerTools');
        const levelStr = config.get<string>('logLevel', 'info');
        this.logLevel = this.parseLogLevel(levelStr);
    }

    private static parseLogLevel(level: string): LogLevel {
        switch (level.toLowerCase()) {
            case 'debug': return LogLevel.Debug;
            case 'info': return LogLevel.Info;
            case 'warn': return LogLevel.Warn;
            case 'error': return LogLevel.Error;
            default: return LogLevel.Info;
        }
    }

    private static formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    static debug(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.Debug) {
            const formatted = this.formatMessage('DEBUG', message);
            this.outputChannel?.appendLine(formatted);
            if (args.length > 0) {
                this.outputChannel?.appendLine(JSON.stringify(args, null, 2));
            }
        }
    }

    static info(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.Info) {
            const formatted = this.formatMessage('INFO', message);
            this.outputChannel?.appendLine(formatted);
            if (args.length > 0) {
                this.outputChannel?.appendLine(JSON.stringify(args, null, 2));
            }
        }
    }

    static warn(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.Warn) {
            const formatted = this.formatMessage('WARN', message);
            this.outputChannel?.appendLine(formatted);
            if (args.length > 0) {
                this.outputChannel?.appendLine(JSON.stringify(args, null, 2));
            }
        }
    }

    static error(message: string, error?: any): void {
        if (this.logLevel <= LogLevel.Error) {
            const formatted = this.formatMessage('ERROR', message);
            this.outputChannel?.appendLine(formatted);
            if (error) {
                if (error instanceof Error) {
                    this.outputChannel?.appendLine(`  ${error.message}`);
                    if (error.stack) {
                        this.outputChannel?.appendLine(`  ${error.stack}`);
                    }
                } else {
                    this.outputChannel?.appendLine(`  ${JSON.stringify(error, null, 2)}`);
                }
            }
        }
    }

    static show(): void {
        this.outputChannel?.show();
    }
}
