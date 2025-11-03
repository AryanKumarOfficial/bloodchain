"use server";

import {LogLevel} from "@/types/logger";
import { Logger } from "@/lib/utils/logger";

// We create a *single instance* of the logger for "Client Actions"
// This is safe because this file itself is marked "use server".
const actionLogger = new Logger('client-action');

/**
 * A Server Action that clients can call to write a log on the server.
 * This function *runs only on the server*.
 * @param level The log level
 * @param message The log message
 * @param data Optional data
 */
export async function logToServer(
    level: LogLevel,
    message: string,
    data?: Record<string, any>
) {
    // This calls your full logger.ts class, which writes to the file system.
    switch (level) {
        case LogLevel.INFO:
            actionLogger.info(message, data);
            break;
        case LogLevel.WARN:
            actionLogger.warn(message, data);
            break;
        case LogLevel.ERROR:
            actionLogger.error(message, undefined, data);
            break;
        case LogLevel.DEBUG:
            actionLogger.debug(message, data);
            break;
        case LogLevel.CRITICAL:
            actionLogger.critical(message, new Error(message), data);
            break;
    }
}
