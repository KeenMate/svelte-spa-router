/**
 * Type definitions for vendored loglevel library
 */

type LogLevelNames = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';

interface MethodFactory {
    (methodName: string, logLevel: number, loggerName: string): (...args: any[]) => void;
}

interface Logger {
    trace(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    setLevel(level: LogLevelNames | number): void;
    getLevel(): number;
    methodFactory: MethodFactory;
    getLogger(name: string): Logger;
}

declare const log: Logger;
export default log;
