import { Context } from 'hono';

/**
 * 错误处理中间件
 * 捕获并处理所有未处理的错误，提供友好的错误信息
 */

// 错误类型接口
interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// 错误日志记录器
function logError(error: AppError, c: Context) {
  const timestamp = new Date().toISOString();
  const method = c.req.method;
  const url = c.req.url;
  const userId = c.get('user')?.userId || 'anonymous';
  
  console.error(`[${timestamp}] [ERROR] ${method} ${url}`);
  console.error(`User: ${userId}`);
  console.error(`Error: ${error.message}`);
  if (error.stack) {
    console.error(`Stack: ${error.stack}`);
  }
  if (error.details) {
    console.error(`Details:`, JSON.stringify(error.details, null, 2));
  }
}

// 生成友好的错误信息
function getErrorMessage(error: AppError): { message: string; userMessage: string; statusCode: number } {
  // 数据库错误
  if (error.message?.includes('D1_ERROR') || error.message?.includes('SQLITE')) {
    return {
      message: error.message,
      userMessage: '数据库操作失败，请稍后重试',
      statusCode: 500
    };
  }

  // 网络超时错误
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return {
      message: error.message,
      userMessage: '请求超时，请检查网络连接后重试',
      statusCode: 504
    };
  }

  // API 调用错误
  if (error.message?.includes('API') || error.message?.includes('fetch failed')) {
    return {
      message: error.message,
      userMessage: '外部服务暂时不可用，请稍后重试',
      statusCode: 502
    };
  }

  // 验证错误
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return {
      message: error.message,
      userMessage: '输入数据验证失败，请检查输入内容',
      statusCode: 400
    };
  }

  // 权限错误
  if (error.message?.includes('Unauthorized') || error.message?.includes('permission')) {
    return {
      message: error.message,
      userMessage: '您没有权限执行此操作',
      statusCode: 403
    };
  }

  // 未找到错误
  if (error.message?.includes('not found') || error.message?.includes('NOT_FOUND')) {
    return {
      message: error.message,
      userMessage: '请求的资源不存在',
      statusCode: 404
    };
  }

  // 默认服务器错误
  return {
    message: error.message || 'Unknown error',
    userMessage: '服务器内部错误，请稍后重试',
    statusCode: error.statusCode || 500
  };
}

/**
 * 全局错误处理中间件
 */
export async function errorHandler(c: Context, next: any) {
  try {
    await next();
  } catch (error: any) {
    // 记录错误日志
    logError(error, c);

    // 生成友好的错误响应
    const { message, userMessage, statusCode } = getErrorMessage(error);

    // 返回错误响应
    return c.json({
      error: userMessage,
      message: userMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: message,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString(),
      path: c.req.url,
      method: c.req.method
    }, statusCode);
  }
}

/**
 * 404 Not Found 处理器
 */
export function notFoundHandler(c: Context) {
  return c.json({
    error: '请求的资源不存在',
    message: '请求的资源不存在',
    timestamp: new Date().toISOString(),
    path: c.req.url,
    method: c.req.method
  }, 404);
}

/**
 * 创建自定义错误
 */
export function createError(message: string, statusCode: number = 500, details?: any): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

// 导出类型
export type { AppError };
