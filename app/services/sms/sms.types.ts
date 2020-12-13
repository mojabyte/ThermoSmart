import { GeneralApiProblem } from "./sms-problem"

export interface SmsPendingListItem {
  callback: (response?: string) => void
  timeout: NodeJS.Timeout
}

export interface SmsSubscriptionListItem {
  callback: (payload?: string) => void
}

/**
 * The
 */
export type SmsPendingList = Map<string, Map<string, SmsPendingListItem>>

/**
 * The
 */
export type SmsSubscriptionList = Map<string, Map<string, SmsSubscriptionListItem>>

export interface SendParams {
  phoneNumber: string
  type: string
  message: string
  callback: (response?: string, error?: string) => void
  hasResponse?: boolean
}

export interface SubscribeParams {
  phoneNumber: string
  subscriptions: {
    type: string
    callback: (response?: string, error?: string) => void
  }[]
}
