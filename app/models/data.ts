import { observable } from "mobx"
import {
  getEnv,
  types,
  getParent,
  destroy,
  SnapshotIn,
  Instance,
} from "mobx-state-tree"
import moment from "moment-jalaali"
import { sortBy } from "ramda"
import { ToastAndroid } from "react-native"
import SmsAndroid from "react-native-get-sms-android"
import Contacts from "react-native-contacts"
import { getSmsType, SMS_TYPES_REGEX, StringKeys } from "../services/sms/sms-utils"
import { Environment } from "./environment"

const parseFloats = (string: string) => {
  const regex = /[+-]?\d+(\.\d+)?/g
  return string.match(regex)?.map(v => parseFloat(v)) || []
}

const toEnDigit = (string: string) => string
  .replace(/[\u0660-\u0669]/g, c => (c.charCodeAt(0) - 0x0660).toString())
  .replace(/[\u06f0-\u06f9]/g, c => (c.charCodeAt(0) - 0x06f0).toString())

export const DeviceModel = types
  .model({
    name: types.string,
    simNumber: types.string,
    place: '',
    password: '123456',
    phoneNumbers: types.optional(types.array(types.maybeNull(types.string)), []),

    powerStatus: true,
    heaterStatus: false,
    fanStatus: false,

    temperatures: types.map(types.number),

    thermostat: types.optional(types.model({
      isEnabled: types.boolean,
      max: types.maybeNull(types.number),
      nor: types.maybeNull(types.number),
      min: types.maybeNull(types.number)
    }), {
      isEnabled: false,
      max: undefined,
      nor: undefined,
      min: undefined
    }),

    alarm: types.optional(types.model({
      high: types.array(types.number),
      low: types.array(types.number),
      interval: types.number
    }), {
      high: [],
      low: [],
      interval: 0
    }),

    simCharge: 0,
    simCreditSmsInterval: 1,
    signalStrength: 100,
    powerOutageSmsInterval: 5,

    calibration: 0,

    laborCheck: types.optional(types.model({
      mode: types.maybeNull(types.enumeration(['1', '2', '3'])),
      interval: types.maybeNull(types.number),
      lastCheckTime: types.maybeNull(types.string)
    }), {
      mode: null,
      interval: null,
      lastCheckTime: null
    }),

    syncDate: 0
  })
  .volatile(() => ({
    state: {
      updatePasswordLoading: false,
      getPhoneNumbersLoading: false,
      updatePhoneNumberLoading: observable([false, false, false, false, false]),
      getStatusLoading: false,
      getTemperatureLoading: false,
      getThermostatValuesLoading: false,
      updateThermostatMaxValueLoading: false,
      updateThermostatNorValueLoading: false,
      updateThermostatMinValueLoading: false,
      updateThermostatStatusLoading: false,
      getAlarmValuesLoading: false,
      updateAlarmHighLoading: false,
      updateAlarmLowLoading: false,
      updateAlarmIntervalLoading: false,
      updateHeaterStatusLoading: false,
      updateFanStatusLoading: false,
      getSimCreditLoading: false,
      getSimCreditSmsIntervalLoading: false,
      getSignalStrengthLoading: false,
      getPowerOutageSmsIntervalLoading: false,
      getCalibrationLoading: false,
      resetCalibrationLoading: false
    }
  }))
  .actions(self => ({
    setName(newName: string) {
      self.name = newName
    },
    setSimNumber(newSimNumber: string) {
      self.simNumber = newSimNumber
    },
    setPlace(newPlace: string) {
      self.place = newPlace
    },
    setPassword(newPassword: string, ts: number = undefined) {
      self.password = newPassword
    },
    setPhoneNumbers(newPhoneNumbers: string[]) {
      self.phoneNumbers.replace(newPhoneNumbers)
    },
    setPhoneNumberAtIndex(index: number, newPhoneNumber: string) {
      self.phoneNumbers[index] = newPhoneNumber
    },
    removePhoneNumber(index: number) {
      self.phoneNumbers[index] = null
    },
    setStatus(power: boolean, heater: boolean, fan: boolean) {
      self.powerStatus = power
      self.heaterStatus = heater
      self.fanStatus = fan
    },
    setPowerStatus(status: boolean) {
      self.powerStatus = status
    },
    setHeaterStatus(status: boolean) {
      self.heaterStatus = status
    },
    setFanStatus(status: boolean) {
      self.fanStatus = status
    },
    setTemperature({ value, ts }: { value: number; ts: string }) {
      self.temperatures.set(ts, value)
    },
    setThermostatValues({ max, nor, min }: { max?: number; nor?: number; min?: number }) {
      self.thermostat.max = max ?? self.thermostat.max
      self.thermostat.nor = nor ?? self.thermostat.nor
      self.thermostat.min = min ?? self.thermostat.min
    },
    setThermostatStatus(status: boolean) {
      self.thermostat.isEnabled = status
    },
    setAlarmValues({ high, low, interval }: { high?: number[]; low?: number[]; interval?: number }) {
      self.alarm.high.replace(high ?? self.alarm.high)
      self.alarm.low.replace(low ?? self.alarm.low)
      self.alarm.interval = interval ?? self.alarm.interval
    },
    setSimCharge(charge: number) {
      self.simCharge = charge
    },
    setSimCreditSmsInterval(interval: number) {
      self.simCreditSmsInterval = interval
    },
    setSignalStrength(strength: number) {
      self.signalStrength = strength
    },
    setPowerOutageSmsInterval(interval: number) {
      self.powerOutageSmsInterval = interval
    },
    setCalibration(calibration: number) {
      self.calibration = calibration
    },
    setState(newState: any) {
      self.state = { ...self.state, ...newState }
    },
    setUpdatePhoneNumberLoading(index: number, value: boolean) {
      self.state.updatePhoneNumberLoading[index] = value
    },
    setSyncDate(date: number) {
      self.syncDate = date
    },
    reset() {
      // applySnapshot(self, {})
      self.temperatures.replace(new Map())
    },
    remove() {
      getParent<typeof DeviceListModel>(self, 2).remove(self)
    },

    sendSms(
      type: string,
      message: string,
      callback: (response: string, error: string) => void,
      hasResponse = true
    ) {
      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type,
        message,
        callback: (response, error) => {
          if (error) ToastAndroid.show('Timeout', ToastAndroid.SHORT)
          if (!error) this.setSyncDate(+moment())
          callback(response, error)
        },
        hasResponse
      })
    },

    updatePassword(newPassword: string) {
      this.setState({ updatePasswordLoading: true })

      this.sendSms('UPDATE_PASSWORD', `*${self.password}#999#${newPassword}#`,
        (response, error) => {
          if (!error) {
            this.setPassword(newPassword)
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updatePasswordLoading: false })
        }
      )
    },

    getPhoneNumbers() {
      this.setState({ getPhoneNumbersLoading: true })

      this.sendSms('GET_PHONE_NUMBERS', `*${self.password}#100#`, (response, error) => {
        if (!error) {
          const phoneNumbers = response.split('\n').slice(1)
            .map(line => (line[8] !== '0') ? line.slice(7, 18) : null)
          this.setPhoneNumbers(phoneNumbers)
        }
        this.setState({ getPhoneNumbersLoading: false })
      })
    },
    updatePhoneNumber({ phoneNumber, index }) {
      this.setUpdatePhoneNumberLoading(index, true)
      this.setPhoneNumberAtIndex(index, phoneNumber)

      this.sendSms(
        'UPDATE_PHONE_NUMBER',
        `*${self.password}#${index + 1}#${phoneNumber}*`,
        (_, error) => {
          if (error) {
            this.removePhoneNumber(index)
          }
          this.setUpdatePhoneNumberLoading(index, false)
        })
    },
    deletePhoneNumber(index: number) {
      this.setUpdatePhoneNumberLoading(index, true)

      this.sendSms('DELETE_PHONE_NUMBER', `*${self.password}#0${index + 1}#`, (_, error) => {
        if (!error) {
          this.removePhoneNumber(index)
        }
        this.setUpdatePhoneNumberLoading(index, false)
      })
    },

    parseStatusMessage(message: string, time: number) {
      const lines = message.split('\n')
      const temperature = parseFloats(lines[1])[0]
      const powerStatus = lines[2].includes('وصل')
      const heaterStats = lines[3].includes('روشن')
      const fanStatus = lines[4].includes('روشن')
      const thermostatStatus = lines[5].includes('اتوماتيك')

      this.setTemperature({ value: temperature, ts: `${time}` })
      this.setStatus(powerStatus, heaterStats, fanStatus)
      this.setThermostatStatus(thermostatStatus)
    },
    getStatus() {
      this.setState({ getStatusLoading: true })

      this.sendSms('GET_STATUS', '#0#', (response, error) => {
        if (!error) {
          this.parseStatusMessage(response, +moment())
        }
        this.setState({ getStatusLoading: false })
      })
    },

    // hour: an integer in [0, 23]
    getTemperature(hour?: number) {
      this.setState({ getTemperatureLoading: true })

      if (!hour) {
        const now = new Date()
        hour = now.getHours()
      }

      this.sendSms('GET_TEMPERATURE', `#85#${hour}*`, (response, error) => {
        if (!error) {
          const value = parseFloats(response)[0]
          if (value) {
            const ts = `${+moment().set('hour', hour).startOf('hour')}`
            this.setTemperature({ value, ts })
          }
        }
        this.setState({ getTemperatureLoading: false })
      })
    },
    async getLast24Temperatures() {
      this.setState({ getTemperatureLoading: true })

      const getTemp = (hour: number) => new Promise<number>((resolve, reject) => this.sendSms(
        'GET_TEMPERATURE',
        `#85#${hour}*`,
        (response, error) => {
          if (error) {
            reject(error)
            return
          }
          const value = parseFloats(response)[0]
          resolve(value)
        }
      ))

      const hours = [...Array(24)].map((_, i) => +moment().add(-i, 'hours').startOf('hour'))

      for (const ts of hours) {
        if (!self.temperatures.get(`${ts}`)) {
          const value = await getTemp((new Date(ts)).getHours())
          this.setTemperature({ value, ts: `${ts}` })
        }
      }

      this.setState({ getTemperatureLoading: false })
    },

    getThermostatValues() {
      this.setState({ getThermostatValuesLoading: true })

      this.sendSms('GET_THERMOSTAT_VALUES', '#15#', (response, error) => {
        if (!error) {
          const values = parseFloats(response)
          this.setThermostatValues({
            max: values[0],
            nor: values[1],
            min: values[2]
          })
        }
        this.setState({ getThermostatValuesLoading: false })
      })
    },
    updateThermostatMaxValue(value: number) {
      this.setState({ updateThermostatMaxValueLoading: true })

      this.sendSms(
        'UPDATE_THERMOSTAT_MAX',
        `*${self.password}#3000#${Math.round(value * 10)}*`,
        (response, error) => {
          if (!error) {
            this.setThermostatValues({ max: value })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateThermostatMaxValueLoading: false })
        }
      )
    },
    updateThermostatNorValue(value: number) {
      this.setState({ updateThermostatNorValueLoading: true })

      this.sendSms(
        'UPDATE_THERMOSTAT_NOR',
        `*${self.password}#2000#${Math.round(value * 10)}*`,
        (response, error) => {
          if (!error) {
            this.setThermostatValues({ nor: value })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateThermostatNorValueLoading: false })
        }
      )
    },
    updateThermostatMinValue(value: number) {
      this.setState({ updateThermostatMinValueLoading: true })

      this.sendSms(
        'UPDATE_THERMOSTAT_MIN',
        `*${self.password}#1000#${Math.round(value * 10)}*`,
        (response, error) => {
          if (!error) {
            this.setThermostatValues({ min: value })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateThermostatMinValueLoading: false })
        }
      )
    },
    updateThermostatValues({ max, nor, min }: { max?: number; nor?: number; min?: number }) {
      this.setState({ updateThermostatValuesLoading: { max: !!max, nor: !!nor, min: !!min } })

      const messages = []
      if (max) messages.push(['3000', Math.round(max * 10)])
      if (nor) messages.push(['2000', Math.round(nor * 10)])
      if (min) messages.push(['1000', Math.round(min * 10)])

      const sendMessage = (messages: [string, number][]) => {
        if (messages.length === 0) {
          this.setThermostatValues({ max, nor, min })
          this.setState({ updateThermostatValuesLoading: false })
          return
        }
        const message = messages.pop()

        this.sendSms(
          'UPDATE_THERMOSTAT_VALUES',
          `*${self.password}#${message[0]}#${message[1]}*`,
          () => { sendMessage(messages) }
        )
      }

      sendMessage(messages)
    },
    updateThermostatStatus(status: boolean) {
      this.setState({ updateThermostatStatusLoading: true })

      this.sendSms(
        'UPDATE_THERMOSTAT_STATUS',
        `*${self.password}#80${status ? '0' : '8'}#`,
        (response, error) => {
          if (!error) {
            this.setThermostatStatus(status)
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateThermostatStatusLoading: false })
        }
      )
    },

    getAlarmValues() {
      this.setState({ getAlarmValuesLoading: true })

      this.sendSms('GET_ALARM_VALUES_HIGH', '#8000#', (response, error) => {
        if (!error) {
          const high = parseFloats(response)
          high.reverse()
          this.setAlarmValues({ high })
        }
        this.sendSms('GET_ALARM_VALUES_LOW', '#7000#', (response, error) => {
          if (!error) {
            const low = parseFloats(response)
            this.setAlarmValues({ low })
          }
          this.sendSms('GET_ALARM_VALUES_INTERVAL', '#9000#', (response, error) => {
            if (!error) {
              const interval = parseFloats(response)[0]
              this.setAlarmValues({ interval })
            }
            this.setState({ getAlarmValuesLoading: false })
          })
        })
      })
    },
    updateAlarmValues({ high, low }: { high?: number[]; low?: number[] }) {
      this.setState({ updateAlarmValuesLoading: true })

      const messages = []
      if (high) messages.push(['8000', Math.round(high[1] * 10), Math.round(high[0] * 10)])
      if (low) messages.push(['7000', Math.round(low[0] * 10), Math.round(low[1] * 10)])

      const sendMessage = (messages: [string, number, number][]) => {
        if (messages.length === 0) {
          this.setAlarmValues({ high, low })
          this.setState({ updateAlarmValuesLoading: false })
          return
        }
        const message = messages.pop()
        this.sendSms(
          'UPDATE_ALARM_VALUES',
          `*${self.password}#${message[0]}#${message[1]}*${message[2]}*`,
          () => { sendMessage(messages) }
        )
      }

      sendMessage(messages)
    },
    updateAlarmHigh(values: number[]) {
      this.setState({ updateAlarmHighLoading: true })

      this.sendSms(
        'UPDATE_ALARM_HIGH',
        `*${self.password}#8000#${Math.round(values[1] * 10)}*${Math.round(values[0] * 10)}*`,
        (response, error) => {
          if (!error) {
            this.setAlarmValues({ high: values })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateAlarmHighLoading: false })
        }
      )
    },
    updateAlarmLow(values: number[]) {
      this.setState({ updateAlarmLowLoading: true })

      this.sendSms(
        'UPDATE_ALARM_LOW',
        `*${self.password}#7000#${Math.round(values[0] * 10)}*${Math.round(values[1] * 10)}*`,
        (response, error) => {
          if (!error) {
            this.setAlarmValues({ low: values })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateAlarmLowLoading: false })
        }
      )
    },
    updateAlarmInterval(interval: number) {
      this.setState({ updateAlarmIntervalLoading: true })

      this.sendSms(
        'UPDATE_ALARM_INTERVAL',
        `*${self.password}#9000#${interval}*`,
        (response, error) => {
          if (!error) {
            this.setAlarmValues({ interval })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateAlarmIntervalLoading: false })
        }
      )
    },

    updateHeaterStatus(status: boolean) {
      this.setState({ updateHeaterStatusLoading: true })

      this.sendSms('UPDATE_HEATER_STATUS', `#${status ? '' : '0'}50#`, (response, error) => {
        if (!error) {
          this.setHeaterStatus(status)
          ToastAndroid.show(response, ToastAndroid.SHORT)
        }
        this.setState({ updateHeaterStatusLoading: false })
      })
    },
    updateFanStatus(status: boolean) {
      this.setState({ updateFanStatusLoading: true })

      this.sendSms('UPDATE_FAN_STATUS', `#${status ? '' : '0'}60#`, (response, error) => {
        if (!error) {
          this.setFanStatus(status)
          ToastAndroid.show(response, ToastAndroid.SHORT)
        }
        this.setState({ updateFanStatusLoading: false })
      })
    },

    getSimCredit() {
      this.setState({ getSimCreditLoading: true })

      this.sendSms('GET_SIM_CHARGE', '#12#', (response, error) => {
        if (!error) {
          this.setSimCharge(parseFloats(toEnDigit(response))[0])
        }
        this.setState({ getSimCreditLoading: false })
      })
    },
    sendSimChargeCode(code: string) {
      this.setState({ getSimCreditLoading: true })

      this.sendSms('SEND_SIM_CHARGE_CODE', `*950#${code}*`, () => {
        this.setState({ getSimCreditLoading: false })
      })
    },
    getSimCreditSmsInterval() {
      this.setState({ getSimCreditSmsIntervalLoading: true })

      this.sendSms('GET_SIM_CREDIT_SMS_INTERVAL', '#14#', (response, error) => {
        if (!error) {
          this.setSimCreditSmsInterval(parseFloats(response)[0])
        }
        this.setState({ getSimCreditSmsIntervalLoading: false })
      })
    },
    updateSimCreditSmsInterval(interval: number) {
      this.setState({ getSimCreditSmsIntervalLoading: true })

      this.sendSms(
        'UPDATE_SIM_CREDIT_SMS_INTERVAL',
        `*${self.password}#14#${interval}*`,
        (response, error) => {
          if (!error) {
            this.setSimCreditSmsInterval(interval)
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ getSimCreditSmsIntervalLoading: false })
        }
      )
    },

    getSignalStrength() {
      this.setState({ getSignalStrengthLoading: true })

      this.sendSms('GET_SIGNAL_STRENGTH', '#13#', (response, error) => {
        if (!error) {
          this.setSignalStrength(parseFloats(response)[0])
        }
        this.setState({ getSignalStrengthLoading: false })
      })
    },

    getPowerOutageSmsInterval() {
      this.setState({ getPowerOutageSmsIntervalLoading: true })

      this.sendSms('GET_POWER_OUTAGE_SMS_INTERVAL', '#220#', (response, error) => {
        if (!error) {
          this.setPowerOutageSmsInterval(parseFloats(response)[0])
        }
        this.setState({ getPowerOutageSmsIntervalLoading: false })
      })
    },
    updatePowerOutageSmsInterval(interval: number) {
      this.setState({ getPowerOutageSmsIntervalLoading: true })

      this.sendSms(
        'UPDATE_POWER_OUTAGE_SMS_INTERVAL',
        `*${self.password}#220#${interval}*`,
        (response, error) => {
          if (!error) {
            this.setPowerOutageSmsInterval(interval)
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ getPowerOutageSmsIntervalLoading: false })
        }
      )
    },

    getCalibration() {
      this.setState({ getCalibrationLoading: true })

      this.sendSms('GET_CALIBRATION', '#695#', (response, error) => {
        if (!error) {
          const sign = response.includes('كاهش') ? -1 : 1
          this.setCalibration((parseFloats(response)[0] || 0) * sign)
        }
        this.setState({ getCalibrationLoading: false })
      })
    },
    updateCalibration(calibration: number) {
      this.setState({ getCalibrationLoading: true })

      const diff = Math.round((calibration - self.calibration) * 10)

      this.sendSms(
        'UPDATE_CALIBRATION',
        `*${self.password}#6${diff > 0 ? '90' : '80'}#${Math.abs(diff)}*`,
        (response, error) => {
          if (!error) {
            this.setCalibration(calibration)
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ getCalibrationLoading: false })
        }
      )
    },
    resetCalibration() {
      this.setState({ resetCalibrationLoading: true })

      this.sendSms('RESET_CALIBRATION', `*${self.password}#685#`, (response, error) => {
        if (!error) {
          this.setCalibration(0)
          ToastAndroid.show(response, ToastAndroid.SHORT)
        }
        this.setState({ resetCalibrationLoading: false })
      })
    },

    restoreFromMessages() {
      const callbacks = {
        GET_STATUS: this.parseStatusMessage,
        UPDATE_PASSWORD: body => {
          const password = body.match(SMS_TYPES_REGEX.UPDATE_PASSWORD)[1]
          this.setPassword(password)
        },
        GET_THERMOSTAT_VALUES: body => {
          const values = parseFloats(body)
          this.setThermostatValues({
            max: values[0],
            nor: values[1],
            min: values[2]
          })
        },
        UPDATE_THERMOSTAT_MAX: body => {
          const value = parseFloats(body)[0]
          this.setThermostatValues({ max: value })
        },
        UPDATE_THERMOSTAT_NOR: body => {
          const value = parseFloats(body)[0]
          this.setThermostatValues({ nor: value })
        },
        UPDATE_THERMOSTAT_MIN: body => {
          const value = parseFloats(body)[0]
          this.setThermostatValues({ min: value })
        },
        GET_ALARM_VALUES_HIGH: body => {
          const high = parseFloats(body)
          high.reverse()
          this.setAlarmValues({ high })
        },
        UPDATE_ALARM_HIGH: body => {
          const high = parseFloats(body)
          high.reverse()
          this.setAlarmValues({ high })
        },
        GET_ALARM_VALUES_LOW: body => {
          const low = parseFloats(body)
          this.setAlarmValues({ low })
        },
        UPDATE_ALARM_LOW: body => {
          const low = parseFloats(body)
          this.setAlarmValues({ low })
        },
        GET_ALARM_VALUES_INTERVAL: body => {
          const interval = parseFloats(body)[0]
          this.setAlarmValues({ interval })
        },
        UPDATE_ALARM_INTERVAL: body => {
          const interval = parseFloats(body)[0]
          this.setAlarmValues({ interval })
        },
        GET_SIM_CHARGE: body => {
          this.setSimCharge(parseFloats(toEnDigit(body))[0])
        },
        GET_SIGNAL_STRENGTH: body => {
          this.setSignalStrength(parseFloats(body)[0])
        },
        GET_PHONE_NUMBERS: body => {
          const phoneNumbers = body.split('\n').slice(1)
            .map(line => (line[8] !== '0') ? line.slice(7, 18) : null)
          this.setPhoneNumbers(phoneNumbers)
        },
        // UPDATE_PHONE_NUMBER: body => {

        // },
        // DELETE_PHONE_NUMBER: body => {

        // },
        GET_SIM_CREDIT_SMS_INTERVAL: body => {
          this.setSimCreditSmsInterval(parseFloats(body)[0])
        },
        UPDATE_SIM_CREDIT_SMS_INTERVAL: body => {
          this.setSimCreditSmsInterval(parseFloats(body)[0])
        },
        GET_POWER_OUTAGE_SMS_INTERVAL: body => {
          this.setPowerOutageSmsInterval(parseFloats(body)[0])
        },
        UPDATE_POWER_OUTAGE_SMS_INTERVAL: body => {
          this.setPowerOutageSmsInterval(parseFloats(body)[0])
        },
        // GET_CALIBRATION: body => {
        //   const sign = body.includes('كاهش') ? -1 : 1
        //   this.setCalibration((parseFloats(body)[0] || 0) * sign)
        // },
        // UPDATE_CALIBRATION: body => {
        //   const sign = body.includes('كاهش') ? -1 : 1
        //   this.setCalibration((parseFloats(body)[0] || 0) * sign)
        // },
        RESET_CALIBRATION: () => {
          this.setCalibration(0)
        },
        // UPDATE_THERMOSTAT_STATUS: body => {
        //   const status = body.match(/^حالت .* به (دستي|اتوماتيك) تغيير كرد$/)[1] === 'اتوماتيك'
        //   this.setThermostatStatus(status)
        // },
        // UPDATE_HEATER_STATUS: body => {
        //   const status = body.match(/^هيتر (روشن|خاموش) شد$/)[1] === 'روشن'
        //   this.setHeaterStatus(status)
        // },
        // UPDATE_FAN_STATUS: body => {
        //   const status = body.match(/^هواكش (روشن|خاموش) شد$/)[1] === 'روشن'
        //   this.setFanStatus(status)
        // },
        // UPDATE_POWER_STATUS: body => {
        //   const status = body.match(/^برق (قطع|وصل) شد\n(\S*)$/)[1] === 'وصل'
        //   this.setPowerStatus(status)
        // }
      } as Record<keyof typeof SMS_TYPES_REGEX, (body?: string, date?: number) => void>

      const minDate = self.syncDate + 1

      // const minDate = 0

      const filter = {
        box: 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all

        /**
         *  the next 3 filters can work together, they are AND-ed
         *
         *  minDate, maxDate filters work like this:
         *    - If and only if you set a maxDate, it's like executing this SQL query:
         *    "SELECT * from messages WHERE (other filters) AND date <= maxDate"
         *    - Same for minDate but with "date >= minDate"
         */
        minDate, // timestamp (in milliseconds since UNIX epoch)
        // maxDate: 1556277910456, // timestamp (in milliseconds since UNIX epoch)
        // bodyRegex: '^ دما (?s).*', // content regex to match

        /** the next 5 filters should NOT be used together, they are OR-ed so pick one **/
        // read: 0, // 0 for unread SMS, 1 for SMS already read
        // _id: 1234, // specify the msg id
        // thread_id: 12, // specify the conversation thread_id
        address: `+98${self.simNumber}`, // sender's phone number
        // body: 'How are you', // content to match
        /** the next 2 filters can be used for pagination **/
        // indexFrom: 0, // start from index 0
        // maxCount: 1, // count of SMS to return each time
      }

      SmsAndroid.list(
        JSON.stringify(filter),
        () => {},
        (count: number, smsList: string) => {
          // console.log(count)
          const arr = JSON.parse(smsList) as { body: string; date: number }[]
          if (arr.length > 0) {
            this.setSyncDate(arr[0].date)
            for (const { body, date } of arr) {
              const type = getSmsType(body, Object.keys(callbacks) as StringKeys<typeof callbacks>)
              if (callbacks[type]) {
                callbacks[type](body, date)
                delete callbacks[type]
              }
              if (Object.keys(callbacks).length === 0) return
            }
          }
        }
      )

      const env: Environment = getEnv(self)
      env.sms.subscribe({
        phoneNumber: self.simNumber,
        subscriptions: [
          {
            type: 'GET_STATUS',
            callback: payload => this.parseStatusMessage(payload, +moment())
          },
          {
            type: 'UPDATE_POWER_STATUS',
            callback: payload => {
              const status = payload.match(/^برق (قطع|وصل) شد\n(\S*)$/)[1] === 'وصل'
              this.setPowerStatus(status)
            }
          },
          {
            type: 'GET_SIM_CHARGE',
            callback: payload => this.setSimCharge(parseFloats(toEnDigit(payload))[0])
          },
        ]
      })
    }
  }))
  .views(self => ({
    get validPhoneNumbers() {
      return self.phoneNumbers.filter(v => !!v)
    },
    get newPhoneNumberIndex() {
      const index = self.phoneNumbers.indexOf(null)
      return index === -1 ? self.phoneNumbers.length : index
    },
    get temperaturesView() {
      let temperatures = []
      self.temperatures.forEach((value, key) => temperatures.push({ ts: parseInt(key), value }))
      temperatures = sortBy(({ ts }) => -ts, temperatures)
      return temperatures
    }
  }))

export interface Device extends Instance<typeof DeviceModel> {}

export const DeviceListModel = types
  .model({
    items: types.optional(types.array(DeviceModel), []),
    imported: false
  })
  .actions(self => ({
    add(item: SnapshotIn<Device> | Instance<Device>) {
      self.items.push(item)
    },
    remove(item: SnapshotIn<Device>) {
      destroy(item)
    },
    get(id: string) {
      return self.items.find(({ simNumber }) => id === simNumber)
    },

    importFromMessages() {
      const filter = {
        box: 'inbox',
        bodyRegex: '^ دما (?s).*برق(?s).*هيتر(?s).*$'
      }

      SmsAndroid.list(
        JSON.stringify(filter),
        () => {},
        (count: number, smsList: string) => {
          // console.log(count)
          const arr = JSON.parse(smsList) as { address: string }[]
          const simNumbers = new Set<string>([])
          if (arr.length > 0) {
            for (const { address } of arr) {
              simNumbers.add(address)
            }
            let index = 1
            simNumbers.forEach(async simNumber => {
              const contacts = await Contacts.getContactsByPhoneNumber(simNumber)
              const name = contacts[0]?.givenName ?? `دستگاه ${index}`
              this.add(DeviceModel.create({
                name,
                simNumber: simNumber.slice(-10),
                place: ''
              }))
              index += 1
            })
          }
        }
      )

      self.imported = true
    }
  }))
  .views(self => ({
    get listView() {
      return self.items.map(item => ({
        label: item.name,
        value: item.simNumber,
        details: item.place
      }))
    }
  }))
