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
      console.log(originatingAddress)
      console.log(body)

      const type = getSmsType(body)
      console.log(type)

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
        const { callback } = this.subscriptionsList.get(originatingAddress).get(type)
        callback(body)
      }
    })
  }

  /**
   * Send a SMS message to the given phone number
   */
  send({ phoneNumber, type, message, callback, hasResponse }: Types.SendParams) {
    console.log(phoneNumber, type, message)
    const phoneNumberWithCode = `+98${phoneNumber}`
    if (!(this.pendingList.has(phoneNumberWithCode) &&
      this.pendingList.get(phoneNumberWithCode).has(type))) {
      SmsAndroid.autoSend(
        phoneNumberWithCode,
        message,
        (error: string) => {
          console.log(error)
        },
        () => {
          console.log(`message: ${message} sent successfully`)

          if (hasResponse) {
            // Clear item from pending list on timeout
            const timeout = BackgroundTimer.setTimeout(() => {
              this.pendingList.get(phoneNumberWithCode).delete(type)
              console.log('timeout')
              callback(undefined, 'timeout')
            }, 60000)

            // type = 'default' // TODO

            // Add new item to pending list
            if (!this.pendingList.has(phoneNumberWithCode)) {
              this.pendingList.set(phoneNumberWithCode, new Map<string, Types.SmsPendingListItem>())
            }
            this.pendingList.get(phoneNumberWithCode).set(type, { callback, timeout })
            console.log(this.pendingList)
          } else {
            callback()
          }
        }
      )
    }
  }

  /**
   * Subscribe for incoming messages
   */
  subscribe({ phoneNumber, subscriptions }: Types.SubscribeParams) {
    console.log(phoneNumber, subscriptions)
    const phoneNumberWithCode = `+98${phoneNumber}`
    if (!this.subscriptionsList.has(phoneNumberWithCode)) {
      this.subscriptionsList.set(
        phoneNumberWithCode,
        new Map<string, Types.SmsSubscriptionListItem>()
      )
    }
    subscriptions.forEach(({ type, callback }) => {
      this.subscriptionsList.get(phoneNumberWithCode).set(type, { callback })
    })
  }
}
