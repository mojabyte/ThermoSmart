import SmsAndroid from 'react-native-get-sms-android'
import SmsListener from 'react-native-android-sms-listener'
import { getGeneralApiProblem } from "./sms-problem"
import { SMSConfig, DEFAULT_API_CONFIG } from "./sms-config"
import * as Types from "./sms.types"

/**
 * Manages all requests to the API.
 */
export class SMS {
  /**
   * Configurable options.
   */
  config: SMSConfig

  /**
   * SIM-card number of the device
   */
  simNumber: string

  /**
   * Creates the api.
   *
   * @param config The configuration to use.
   */
  constructor(config: SMSConfig = DEFAULT_API_CONFIG) {
    this.config = config

    SmsListener.addListener((message: any) => {
      console.info(message)
    }) // => {body: "123", timestamp: 1602276693000, originatingAddress: "09179637615"}
  }

  /**
   * Sets up the SMS.  This will be called during the bootup
   * sequence and will happen before the first React component
   * is mounted.
   *
   * Be as quick as possible in here.
   */
  setup(simNumber: string) {
    this.simNumber = simNumber
  }

  sendPromise = (phoneNumber: string, message: string) => new Promise((resolve, reject) => {
    SmsAndroid.autoSend(
      phoneNumber,
      message,
      (error: string) => reject(error),
      () => resolve()
    )
  })

  /**
   * Send a SMS message to the given phone number
   */
  async send(message: string): Promise<any> {
    try {
      console.log(this.simNumber, message)
      await this.sendPromise(this.simNumber, message)
      console.log(`message: ${message} sent successfully`)
    } catch (error) {
      console.log(error)
    }
  }
}
