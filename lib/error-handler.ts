export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, "INTERNAL_ERROR")
  }

  return new AppError("An unexpected error occurred", 500, "UNKNOWN_ERROR")
}

export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}] ` : ""

  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr}${error.name}: ${error.message}`)
    if (error.stack) {
      console.error(error.stack)
    }
  } else {
    console.error(`${timestamp} ${contextStr}Unknown error:`, error)
  }
}
