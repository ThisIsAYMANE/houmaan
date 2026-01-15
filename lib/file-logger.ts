import fs from 'fs'
import path from 'path'

const LOGS_DIR = path.join(process.cwd(), 'logs')

// Ensure logs directory exists
function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }
}

/**
 * Write log to file
 * @param filename - Name of the log file (will be prefixed with date)
 * @param data - Data to log (will be JSON stringified)
 * @param append - Whether to append to file or overwrite (default: true)
 */
export function writeLogToFile(
  filename: string,
  data: any,
  append: boolean = true
): void {
  try {
    ensureLogsDir()
    
    // Create filename with date prefix
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const logFilename = `${date}_${filename}`
    const logPath = path.join(LOGS_DIR, logFilename)
    
    // Format the log entry
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      ...(typeof data === 'object' ? data : { message: data })
    }
    
    const logLine = JSON.stringify(logEntry, null, 2) + '\n' + '='.repeat(80) + '\n\n'
    
    // Write to file
    if (append) {
      fs.appendFileSync(logPath, logLine, 'utf8')
    } else {
      fs.writeFileSync(logPath, logLine, 'utf8')
    }
    
    // Also log to console for development
    console.log(`[File Log] Written to ${logFilename}`)
  } catch (error) {
    console.error('Error writing log to file:', error)
    // Don't throw - logging should never break the application
  }
}

/**
 * Write API request/response log to file
 */
export function writeApiLog(
  type: 'request' | 'response' | 'error',
  endpoint: string,
  data: any
): void {
  const filename = `api_${type}.log`
  writeLogToFile(filename, {
    type,
    endpoint,
    ...data
  })
}

/**
 * Write game launch log to file
 */
export function writeGameLaunchLog(
  gameId: string,
  logData: any
): void {
  const filename = `game_launch.log`
  writeLogToFile(filename, {
    gameId,
    ...logData
  })
}

