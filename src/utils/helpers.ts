import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
/**
 * Kiểu ErrorFormObject dành cho trường hợp bao quát
 */

interface ErrorFormObject {
  [key: string | number]: string | ErrorFormObject | ErrorFormObject[]
}

interface EntityError {
  status: 422
  data: {
    error: ErrorFormObject
  }
}
/**
 * Phương pháp "type predicate" dùng để thu hẹp kiểu của 1 biến
 * - Đầu tiên khai báo 1 function check kiểm tra cấu trúc về mặc logic js
 * - Tiếp theo thêm 'parameterName is Type' làm kiểu return của function thay vì boolean
 * - Khi dùng function kiểm tra kiểu này ngoài việc kiểm tra vê mặt logic cấu trúc nó còn chuyển kiểu
 *
 * So sánh với phương pháp ép kiểu 'Type Assertions' thì ép kiểu chúng giúp đúng về mặt Type chưa chắc đúng về mặt logic
 *     if ((errorResult as FetchBaseQueryError).data && (errorResult as FetchBaseQueryError).status) {
      return (errorResult as FetchBaseQueryError).data.error
    }
 */

/**Thu hẹp một error có kiểu ko xác định về 'FetchBaseQueryError'  */
export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error
}

/**Thu hẹp một error có kiểu ko xác định về 1 object với thuộc tính message: string
 * (SerializedError)
 */

export function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && (error as any).message === 'string'
}

/**
 * Thu hẹp một error có kiểu không xác định về lỗi liên quan đến POST PUT không đúng field (EntityError)
 */

export function isEntityError(error: unknown): error is EntityError {
  return (
    isFetchBaseQueryError(error) &&
    error.status === 422 &&
    typeof error.data === 'object' &&
    error.data !== null &&
    !(error.data instanceof Array)
  )
}

export class CustomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomError'
  }
}
