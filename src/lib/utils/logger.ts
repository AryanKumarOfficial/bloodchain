// lib/utils/logger.ts

import { LogLevel,ILogEntry } from '@/types/logger'
import fs from 'node:fs'
import path from 'node:path'

/**
 * COMPREHENSIVE LOGGING SERVICE
 * Structured logging for an entire platform
 */


export class Logger {
    private service: string
    private logDir: string

    constructor(service: string) {
        this.service = service
        this.logDir = process.env.LOG_DIR || './logs'
        this.ensureLogDirectory()
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, {recursive: true})
        }
    }

    private getLogFile(level: LogLevel): string {
        const filename = `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`
        return path.join(this.logDir, filename)
    }

    private formatLogEntry(entry: ILogEntry): string {
        return JSON.stringify(entry, null, 2)
    }

    private writeLog(entry: ILogEntry): void {
        const logFile = this.getLogFile(entry.level)
        const content = this.formatLogEntry(entry)

        fs.appendFileSync(logFile, content + '\n', 'utf-8')

        if (process.env.NODE_ENV !== 'production') {
            console.log(content)
        }
    }

    debug(message: string, data?: Record<string, any>): void {
        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.DEBUG,
            service: this.service,
            message,
            data,
        }
        this.writeLog(entry)
    }

    info(message: string, data?: Record<string, any>): void {
        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.INFO,
            service: this.service,
            message,
            data,
        }
        this.writeLog(entry)
    }

    warn(message: string, data?: Record<string, any>): void {
        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.WARN,
            service: this.service,
            message,
            data,
        }
        this.writeLog(entry)
    }

    error(message: string, error?: Error | string, data?: Record<string, any>): void {
        const errorObj = typeof error === 'string' ? new Error(error) : error

        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.ERROR,
            service: this.service,
            message,
            data,
            error: errorObj
                ? {
                    name: errorObj.name,
                    message: errorObj.message,
                    stack: errorObj.stack,
                }
                : undefined,
        }
        this.writeLog(entry)
    }

    critical(message: string, error: Error | string, data?: Record<string, any>): void {
        const errorObj = typeof error === 'string' ? new Error(error) : error

        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.CRITICAL,
            service: this.service,
            message,
            data,
            error: {
                name: errorObj.name,
                message: errorObj.message,
                stack: errorObj.stack,
            },
        }
        this.writeLog(entry)
    }
}
