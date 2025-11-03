/**
 * SHARED LOGGER TYPES
 * This file is safe to import on both client and server.
 * It must NOT contain any 'node:fs' or other server-only imports.
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

export interface ILogEntry {
    timestamp: Date
    level: LogLevel
    service: string
    message: string
    data?: Record<string, any>
    error?: {
        name: string
        message: string
        stack?: string
    }
}
