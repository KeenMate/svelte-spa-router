/**
 * Type definitions for vendored loglevel-plugin-prefix
 */

interface PrefixOptions {
    format?(level: string, name: string | undefined, timestamp: string): string;
    timestampFormatter?(date: Date): string;
}

interface PrefixPlugin {
    reg(logger: any): void;
    apply(logger: any, options?: PrefixOptions): void;
}

declare const prefix: PrefixPlugin;
export default prefix;
