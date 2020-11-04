import { GeneralApiProblem } from "./sms-problem"

/**
 * The
 */
export interface SmsPendingList {
  [phoneNumber: string]: {
    [type: string]: {
      callback: (response?: string) => void
      timeout: NodeJS.Timeout
    }
  }
}

export interface SendParams {
  phoneNumber: string
  type: string
  message: string
  callback: (response?: string) => void
}
