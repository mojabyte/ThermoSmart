import SmsAndroid from 'react-native-get-sms-android'
import SmsListener from 'react-native-android-sms-listener'
import { getGeneralApiProblem } from "./sms-problem"
import { SmsConfig, DEFAULT_API_CONFIG } from "./sms-config"
import * as Types from "./sms.types"

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
   * Creates the api.
   *
   * @param config The configuration to use.
   */
  constructor(config: SmsConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.pendingList = new Map()

    SmsListener.addListener(({ body, originatingAddress }: any) => {
      console.log(body, originatingAddress)

      // Get type of received SMS from it's body
      const getSmsType = () => 'default' // TODO
      const type = getSmsType(body)

      // Check if there exists a pending SMS in the list
      if (
        this.pendingList.has(originatingAddress) &&
        this.pendingList.get(originatingAddress).has(type)
      ) {
        const { timeout, callback } = this.pendingList.get(originatingAddress).get(type)
        clearTimeout(timeout) // Clear pending SMS timeout
        if (callback) callback(body)
        this.pendingList.get(originatingAddress).delete(type)
      }
    }) // => {body: "123", timestamp: 1602276693000, originatingAddress: "09179637615"}
  }

  /**
   * Send a SMS message to the given phone number
   */
  send({ phoneNumber, type, message, callback, hasResponse }: Types.SendParams) {
    console.log(phoneNumber, type, message)
    SmsAndroid.autoSend(
      phoneNumber,
      message,
      (error: string) => {
        console.log(error)
      },
      () => {
        console.log(`message: ${message} sent successfully`)

        if (hasResponse) {
          // Clear item from pending list on timeout
          const timeout = setTimeout(() => {
            this.pendingList.get(phoneNumber).delete(type)
            console.log('timeout')
          }, 30000)

          type = 'default' // TODO

          // Add new item to pending list
          if (!this.pendingList.has(phoneNumber)) {
            this.pendingList.set(phoneNumber, new Map<string, Types.SmsPendingListItem>())
          }
          this.pendingList.get(phoneNumber).set(type, { callback, timeout })
        } else {
          callback()
        }
      }
    )
  }
}
