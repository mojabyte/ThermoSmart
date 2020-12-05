import SmsAndroid from "react-native-get-sms-android"
import SmsListener from "react-native-android-sms-listener"
import BackgroundTimer from "react-native-background-timer"
// import { getGeneralApiProblem } from "./sms-problem"
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
      const getSmsType = (body: string) => {
        if (['*', '#'].includes(body[0])) {
          return 'other'
        } else if (body.startsWith(' دما ')) {
          return 'GET_STATUS'
        } else if (body.includes('مقدار  دما')) {
          return 'GET_TEMPERATURE'
        } else if (body.includes('مقادير ترموستات')) {
          return 'GET_THERMOSTAT_VALUES'
        } else if (body.includes('مقادير هشدار ماكزيمم')) {
          return 'GET_ALARM_VALUES_HIGH'
        } else if (body.includes('مقادير هشدار مينيمم')) {
          return 'GET_ALARM_VALUES_LOW'
        } else if (body.includes('زمان ارسال پيامك هشدار بعدي')) {
          return 'GET_ALARM_VALUES_INTERVAL'
        } else if (body.includes('اعتبار شما')) {
          return 'GET_SIM_CHARGE'
        } else if (body.includes('ميزان آنتن دهي')) {
          return 'GET_SIGNAL_STRENGTH'
        } else if (body.includes('شماره تلفن هاي موجود')) {
          return 'GET_PHONE_NUMBERS'
        }
        return 'default' // TODO
      }
      const type = getSmsType(body)
      console.log(type)

      // Check if there exists a pending SMS in the list
      if (
        this.pendingList.has(originatingAddress) &&
        this.pendingList.get(originatingAddress).has(type)
      ) {
        console.log(this.pendingList.get(originatingAddress))
        const { timeout, callback } = this.pendingList.get(originatingAddress).get(type)
        BackgroundTimer.clearTimeout(timeout) // Clear pending SMS timeout
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
    const phoneNumberWithCode = `+98${phoneNumber}`
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
          }, 30000)

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
