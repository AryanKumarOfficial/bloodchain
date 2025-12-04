// src/lib/utils/logger.ts

import {LogLevel, ILogEntry} from '@/types/logger'
import fs from 'node:fs'
import path from 'node:path'
import {env, isProd} from '@/lib/env'

/**
 * COMPREHENSIVE LOGGING SERVICE
 * Structured logging for an entire platform
 */

export class Logger {
    private service: string
    private logDir: string
    private logToFile: boolean

    constructor(service: string) {
        this.service = service
        this.logDir = env.LOG_DIR || './logs'
        // PATCH: Default to FALSE in production for OCI compliance unless overridden
        this.logToFile = env.LOG_TO_FILE === 'true'

        if (this.logToFile) {
            this.ensureLogDirectory()
        }
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            try {
                fs.mkdirSync(this.logDir, {recursive: true})
            } catch (error) {
                console.error('Failed to create log directory, falling back to console only:', error)
                this.logToFile = false
            }
        }
    }

    private getLogFile(level: LogLevel): string {
        const filename = `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`
        return path.join(this.logDir, filename)
    }

    private formatLogEntry(entry: ILogEntry): string {
        return JSON.stringify(entry)
    }

    private writeLog(entry: ILogEntry): void {
        const content = this.formatLogEntry(entry)

        // 1. Write to File (Optional)
        if (this.logToFile) {
            const logFile = this.getLogFile(entry.level)
            try {
                fs.appendFileSync(logFile, content + '\n', 'utf-8')
            } catch (e) {
                console.error('Logger file write failed:', e)
            }
        }

        // 2. Write to Console (Standard for OCI/Docker)
        // In production, we want structured JSON logs in stdout
        if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
            console.error(content)
        } else {
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