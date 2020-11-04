import { GeneralApiProblem } from "./sms-problem"

export interface SmsPendingListItem {
  callback: (response?: string) => void
  timeout: NodeJS.Timeout
}

/**
 * The
 */
export type SmsPendingList = Map<string, Map<string, SmsPendingListItem>>

export interface SendParams {
  phoneNumber: string
  type: string
  message: string
  callback: (response?: string) => void
  hasResponse?: boolean
}
