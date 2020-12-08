// import { DeviceEventEmitter } from "react-native"
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

    // DeviceEventEmitter.addListener('sms_onDelivery', (msg) => {
    //   console.log(msg)
    // })

    SmsListener.addListener(({ body, originatingAddress }: any) => {
      console.log(originatingAddress)
      console.log(body)

      // TODO: getSmsType based on regex -> performance check

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
        } else if (body.includes('مقدار ماكزيمم به')) {
          return 'UPDATE_THERMOSTAT_MAX'
        } else if (body.includes('مقدار نرمال به')) {
          return 'UPDATE_THERMOSTAT_NOR'
        } else if (body.includes('مقدار مينيمم به')) {
          return 'UPDATE_THERMOSTAT_MIN'
        } else if (body.includes('مقادير هشدار ماكزيمم')) {
          return 'GET_ALARM_VALUES_HIGH'
        } else if (body.includes('ماكزيمم هشدار تغيير')) {
          return 'UPDATE_ALARM_HIGH'
        } else if (body.includes('مقادير هشدار مينيمم')) {
          return 'GET_ALARM_VALUES_LOW'
        } else if (body.includes('مينيمم هشدار تغيير')) {
          return 'UPDATE_ALARM_LOW'
        } else if (body.includes('هشدار بعدي :')) {
          return 'GET_ALARM_VALUES_INTERVAL'
        } else if (body.includes('هشدار بعدي به')) {
          return 'UPDATE_ALARM_INTERVAL'
        } else if (body.includes('اعتبار شما')) {
          return 'GET_SIM_CHARGE'
        } else if (body.includes('ميزان آنتن دهي')) {
          return 'GET_SIGNAL_STRENGTH'
        } else if (body.includes('شماره تلفن هاي موجود')) {
          return 'GET_PHONE_NUMBERS'
        } else if (body.includes(' در حافظه ثبت شد')) {
          return 'UPDATE_PHONE_NUMBER'
        } else if (body.includes(' از حافظه حذف شد')) {
          return 'DELETE_PHONE_NUMBER'
        } else if (body.includes('رمز دستگاه  به')) {
          return 'UPDATE_PASSWORD'
        } else if (body.includes('تعداد روز ارسال دوره اي شارژ سيمكارت:')) {
          return 'GET_SIM_CREDIT_SMS_INTERVAL'
        } else if (body.includes('دوره اي شارژ سيمكارت به')) {
          return 'UPDATE_SIM_CREDIT_SMS_INTERVAL'
        } else if (body.includes(' پيامك هشدار قطع برق :')) {
          return 'GET_POWER_OUTAGE_SMS_INTERVAL'
        } else if (body.includes('پيامك هشدار برق  به')) {
          return 'UPDATE_POWER_OUTAGE_SMS_INTERVAL'
        } else if (body.includes('در حالت كارخانه') || body.includes('يافته')) {
          return 'GET_CALIBRATION'
        } else if (body.includes('به حالت كارخانه')) {
          return 'RESET_CALIBRATION'
        } else if (body.includes('كاليبره سنسور')) {
          return 'UPDATE_CALIBRATION'
        } else if (body.includes('حالت اتوماتيك') || body.includes('حالت دستي')) {
          return 'UPDATE_THERMOSTAT_STATUS'
        } else if (body.includes('هيتر روشن شد') || body.includes('هيتر خاموش شد')) {
          return 'UPDATE_HEATER_STATUS'
        } else if (body.includes('هواكش روشن شد') || body.includes('هواكش خاموش شد')) {
          return 'UPDATE_FAN_STATUS'
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
    })
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
