/**
 * Structured logging utility
 * Provides consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: Record<string, any>
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

class Logger {
  private context: string

  constructor(context: string = 'App') {
    this.context = context
  }

  private formatEntry(level: LogLevel, message: string, data?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        },
      }),
    }
  }

  private log(entry: LogEntry) {
    const prefix = `[${entry.context}] [${entry.level}]`
    const output = {
      ...entry,
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(prefix, entry.message, output.data || '')
        }
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, output.data || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, output.data || '')
        break
      case LogLevel.ERROR:
        console.error(prefix, entry.message, output.data || '')
        if (entry.error?.stack) {
          console.error(entry.error.stack)
        }
        break
    }
  }

  debug(message: string, data?: Record<string, any>) {
    this.log(this.formatEntry(LogLevel.DEBUG, message, data))
  }

  info(message: string, data?: Record<string, any>) {
    this.log(this.formatEntry(LogLevel.INFO, message, data))
  }

  warn(message: string, data?: Record<string, any>) {
    this.log(this.formatEntry(LogLevel.WARN, message, data))
  }

  error(message: string, error?: Error | string, data?: Record<string, any>) {
    const err = typeof error === 'string' ? new Error(error) : error
    this.log(this.formatEntry(LogLevel.ERROR, message, data, err))
  }

  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`)
  }
}

// Export singleton
export const logger = new Logger()

// Performance monitoring
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map()

  start(key: string) {
    this.timers.set(key, performance.now())
  }

  end(key: string, log: (duration: number) => void) {
    const startTime = this.timers.get(key)
    if (startTime) {
      const duration = performance.now() - startTime
      this.timers.delete(key)
      log(duration)
      return duration
    }
    return 0
  }

  measure<T>(key: string, fn: () => T): T {
    this.start(key)
    const result = fn()
    const duration = this.end(key, (d) => {
      if (d > 1000) {
        logger.warn(`Slow operation: ${key}`, { duration: `${d.toFixed(2)}ms` })
      }
    })
    return result
  }

  async measureAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.start(key)
    try {
      const result = await fn()
      this.end(key, (d) => {
        if (d > 1000) {
          logger.warn(`Slow async operation: ${key}`, { duration: `${d.toFixed(2)}ms` })
        }
      })
      return result
    } catch (error) {
      this.end(key, (d) => {
        logger.error(`Async operation failed: ${key}`, error as Error, { duration: `${d.toFixed(2)}ms` })
      })
      throw error
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
