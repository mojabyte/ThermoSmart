import SmsAndroid from 'react-native-get-sms-android'
import SmsListener from 'react-native-android-sms-listener'
import { getGeneralApiProblem } from "./sms-problem"
import { SmsConfig, DEFAULT_API_CONFIG } from "./sms-config"
import * as Types from "./sms.types"
import { toHumanSize } from 'i18n-js'

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
    this.pendingList = {}

    SmsListener.addListener(({ body, originatingAddress }: any) => {
      console.info(body, originatingAddress)
      const getSmsType = () => 'default' // TODO
      const type = getSmsType(body)
      if (this.pendingList[originatingAddress]?.[type]) {
        clearTimeout(this.pendingList[originatingAddress][type].timeout)
        const callback = this.pendingList[originatingAddress][type].callback
        if (callback) callback(body)
        delete this.pendingList[originatingAddress][type]
      }
    }) // => {body: "123", timestamp: 1602276693000, originatingAddress: "09179637615"}
  }

  /**
   * Send a SMS message to the given phone number
   */
  send({ phoneNumber, type, message, callback }: Types.SendParams) {
    console.log(phoneNumber, type, message)
    SmsAndroid.autoSend(
      phoneNumber,
      message,
      (error: string) => {
        console.log(error)
      },
      () => {
        console.log(`message: ${message} sent successfully`)
        const timeout = setTimeout(() => {
          delete this.pendingList[phoneNumber][type]
          console.log('timeout')
        }, 60000)
        type = 'default' // TODO
        this.pendingList = {
          ...this.pendingList,
          [phoneNumber]: {
            ...(this.pendingList[phoneNumber] || {}),
            [type]: {
              ...(this.pendingList[phoneNumber]?.[type] || {}),
              callback,
              timeout
            }
          }
        }
        console.log(this.pendingList)
      }
    )
  }
}
