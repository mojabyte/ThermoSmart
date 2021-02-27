// import { DeviceEventEmitter } from "react-native"
import SmsAndroid from "react-native-get-sms-android"
import SmsListener from "react-native-android-sms-listener"
import BackgroundTimer from "react-native-background-timer"
// import { getGeneralApiProblem } from "./sms-problem"
import { SmsConfig, DEFAULT_API_CONFIG } from "./sms-config"
import * as Types from "./sms.types"
import { getSmsType } from "./sms-utils"

/**
 * Manages all requests to the API.
 */
export class Sms {
  /**
   * Configurable options.
   */
  config: SmsConfig

  /**
   * List of sent
   */
  pendingList: Types.SmsPendingList

  /**
   * Selected SIM slot to send from
   */
  simSlot: number

  /**
   * List of subscriptions
   */
  subscriptionsList: Types.SmsSubscriptionList

  /**
   * Creates the api.
   *
   * @param config The configuration to use.
   */
  constructor(config: SmsConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.pendingList = new Map()
    this.subscriptionsList = new Map()

    // DeviceEventEmitter.addListener('sms_onDelivery', (msg) => {
    //   console.log(msg)
    // })

    SmsListener.addListener(({ body, originatingAddress }: any) => {
      const type = getSmsType(body)

      // Check if there exists a pending SMS in the list
      if (
        this.pendingList.has(originatingAddress) &&
        this.pendingList.get(originatingAddress).has(type)
      ) {
        const { timeout, callback } = this.pendingList.get(originatingAddress).get(type)
        BackgroundTimer.clearTimeout(timeout) // Clear pending SMS timeout
        if (callback) callback(body)
        this.pendingList.get(originatingAddress).delete(type)
      } else if (
        this.subscriptionsList.has(originatingAddress) &&
        this.subscriptionsList.get(originatingAddress).has(type)
      ) {
        const thisSubscriptionList = this.subscriptionsList.get(originatingAddress)
        const { callback } = thisSubscriptionList.get(type)
        const { callback: setSyncDate } = thisSubscriptionList.get("setSyncDate")
        callback(body)
        setSyncDate()
      }
    })
  }

  /**
   * Send a SMS message to the given phone number
   */
  send({ phoneNumber, type, message, callback, hasResponse }: Types.SendParams): void {
    const phoneNumberWithCode = `+98${phoneNumber}`
    if (
      !(
        this.pendingList.has(phoneNumberWithCode) &&
        this.pendingList.get(phoneNumberWithCode).has(type)
      )
    ) {
      SmsAndroid.autoSendMultiSim(
        this.simSlot ?? 2,
        phoneNumberWithCode,
        message,
        (error: string) => {
          callback(undefined, error)
        },
        () => {
          if (hasResponse) {
            // Clear item from pending list on timeout
            const timeout = BackgroundTimer.setTimeout(() => {
              this.pendingList.get(phoneNumberWithCode)?.delete(type)
              callback(undefined, "timeout")
            }, 60000)

            // Add new item to pending list
            if (!this.pendingList.has(phoneNumberWithCode)) {
              this.pendingList.set(phoneNumberWithCode, new Map<string, Types.SmsPendingListItem>())
            }
            this.pendingList.get(phoneNumberWithCode).set(type, { callback, timeout })
          } else {
            callback()
          }
        },
      )
    }
  }

  /**
   * Subscribe for incoming messages
   */
  subscribe({ phoneNumber, subscriptions, setSyncDate }: Types.SubscribeParams): void {
    const phoneNumberWithCode = `+98${phoneNumber}`
    if (!this.subscriptionsList.has(phoneNumberWithCode)) {
      this.subscriptionsList.set(
        phoneNumberWithCode,
        new Map<string, Types.SmsSubscriptionListItem>(),
      )
    }
    const thisSubscriptionList = this.subscriptionsList.get(phoneNumberWithCode)
    subscriptions.forEach(({ type, callback }) => {
      thisSubscriptionList.set(type, { callback })
    })
    thisSubscriptionList.set("setSyncDate", { callback: setSyncDate })
  }

  /**
   * Unsubscribe the device for incoming messages
   */
  unsubscribe(phoneNumber: string): void {
    const phoneNumberWithCode = `+98${phoneNumber}`
    this.subscriptionsList.delete(phoneNumberWithCode)
    if (this.pendingList.get(phoneNumberWithCode)) {
      this.pendingList
        .get(phoneNumberWithCode)
        .forEach(({ timeout }) => BackgroundTimer.clearTimeout(timeout))
    }
    this.pendingList.delete(phoneNumberWithCode)
  }

  /**
   * Select SIM slot
   */
  selectSimSlot(simSlot: number): void {
    this.simSlot = simSlot
  }
}
