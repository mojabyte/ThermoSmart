import { getEnv, types, getParent, destroy, SnapshotIn, Instance } from 'mobx-state-tree'
import moment from "moment-jalaali"
import { sortBy } from 'ramda'
import { Environment } from './environment'

export const DeviceModel = types
  .model({
    name: types.string,
    simNumber: types.string,
    place: '',
    password: '123456',
    phoneNumbers: types.optional(types.array(types.maybeNull(types.string)), []),

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

    simCharge: '',
    signalStrength: '',

    laborCheck: types.optional(types.model({
      mode: types.maybeNull(types.enumeration(['1', '2', '3'])),
      interval: types.maybeNull(types.number),
      lastCheckTime: types.maybeNull(types.string)
    }), {
      mode: null,
      interval: null,
      lastCheckTime: null
    })
  })
  .volatile(() => ({
    status: {
      updatePasswordLoading: false,
      getPhoneNumbersLoading: false,
      updatePhoneNumberLoading: [],
      getTemperatureLoading: false,
      getThermostatValuesLoading: false,
      updateThermostatValuesLoading: false,
      updateThermostatStatusLoading: false,
      getAlarmValuesLoading: false,
      updateAlarmValuesLoading: false,
      updateAlarmIntervalLoading: false,
      sendRpcLoading: false,
      getSimChargeLoading: false,
      getSignalStrengthLoading: false
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
    setSimCharge(charge: string) {
      self.simCharge = charge
    },
    setSignalStrength(strength: string) {
      self.signalStrength = strength
    },
    setStatus(newStatus: any) {
      self.status = { ...self.status, ...newStatus }
    },
    setUpdatePhoneNumberLoading(index: number, value: boolean) {
      self.status.updatePhoneNumberLoading[index] = value
    },
    remove() {
      getParent<typeof DeviceListModel>(self, 2).remove(self)
    },

    updatePassword(newPassword: string) {
      this.setStatus({ updatePasswordLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'UPDATE_PASSWORD',
        message: `*${self.password}#999#${newPassword}#`,
        callback: () => {
          this.setPassword(newPassword)
          this.setStatus({ updatePasswordLoading: false })
        }
      })
    },
    getPhoneNumbers() {
      this.setStatus({ getPhoneNumbersLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'GET_PHONE_NUMBERS',
        message: `*${self.password}#100#`,
        callback: response => {
          this.setPhoneNumbers(response.split('\n'))
          this.setStatus({ getPhoneNumbersLoading: false })
        },
        hasResponse: true
      })
    },
    updatePhoneNumber({ phoneNumber, index }) {
      this.setUpdatePhoneNumberLoading(index, true)

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'UPDATE_PHONE_NUMBER',
        message: `*${self.password}#${index + 1}#${phoneNumber}*`,
        callback: () => {
          this.setPhoneNumberAtIndex(index, phoneNumber)
          this.setUpdatePhoneNumberLoading(index, false)
        }
      })
    },
    deletePhoneNumber(index: number) {
      this.setUpdatePhoneNumberLoading(index, true)

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'DELETE_PHONE_NUMBER',
        message: `*${self.password}#0${index + 1}#`,
        callback: () => {
          this.removePhoneNumber(index)
          this.setUpdatePhoneNumberLoading(index, false)
        }
      })
    },

    // hour: an integer in [0, 23]
    getTemperature(hour?: number) {
      this.setStatus({ getTemperatureLoading: true })

      if (!hour) {
        const now = new Date()
        hour = now.getHours()
      }

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'GET_TEMPERATURE',
        message: `#85#${hour}*`,
        callback: response => {
          const ts = `${+moment().set('hour', hour).startOf('hour')}`
          this.setTemperature({ value: parseFloat(response), ts })
          this.setStatus({ getTemperatureLoading: false })
        },
        hasResponse: true
      })
    },

    getThermostatValues() {
      this.setStatus({ getThermostatValuesLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'GET_THERMOSTAT_VALUES',
        message: '#15#',
        callback: response => {
          // TODO: update this parse method
          const values = response.split(',')
          this.setThermostatValues({
            max: parseFloat(values[0]),
            nor: parseFloat(values[1]),
            min: parseFloat(values[2])
          })
          this.setStatus({ getThermostatValuesLoading: false })
        },
        hasResponse: true
      })
    },
    updateThermostatValues({ max, nor, min }: { max?: number; nor?: number; min?: number }) {
      this.setStatus({ updateThermostatValuesLoading: true })

      const messages = []
      if (max) messages.push(['3000', Math.round(max * 10)])
      if (nor) messages.push(['2000', Math.round(nor * 10)])
      if (min) messages.push(['1000', Math.round(min * 10)])

      const env: Environment = getEnv(self)
      const sendMessage = (messages: [string, number][]) => {
        if (messages.length === 0) {
          this.setThermostatValues({ max, nor, min })
          this.setStatus({ updateThermostatValuesLoading: false })
          return
        }
        const message = messages.pop()
        env.sms.send({
          phoneNumber: self.simNumber,
          type: 'UPDATE_THERMOSTAT_VALUES',
          message: `*${self.password}#${message[0]}#${message[1]}*`,
          callback: () => {
            sendMessage(messages)
          }
        })
      }

      sendMessage(messages)
    },
    updateThermostatStatus(status: boolean) {
      this.setStatus({ updateThermostatStatusLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'UPDATE_THERMOSTAT_STATUS',
        message: `*${self.password}#${status ? '800' : '808'}#`,
        callback: () => {
          this.setThermostatStatus(status)
          this.setStatus({ updateThermostatStatusLoading: false })
        },
        hasResponse: false
      })
    },

    getAlarmValues() {
      this.setStatus({ getAlarmValuesLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'GET_ALARM_VALUES',
        message: '#8000#',
        callback: response => {
          // TODO: update this parse method
          const high = response.split(',').map(str => parseFloat(str))
          this.setAlarmValues({ high })
          env.sms.send({
            phoneNumber: self.simNumber,
            type: 'GET_ALARM_VALUES',
            message: '#7000#',
            callback: response => {
              // TODO: update this parse method
              const low = response.split(',').map(str => parseFloat(str))
              this.setAlarmValues({ low })
              env.sms.send({
                phoneNumber: self.simNumber,
                type: 'GET_ALARM_VALUES',
                message: '#9000#',
                callback: response => {
                  // TODO: update this parse method
                  const interval = parseFloat(response)
                  this.setAlarmValues({ interval })
                  this.setStatus({ getAlarmValuesLoading: false })
                },
                hasResponse: true
              })
            },
            hasResponse: true
          })
        },
        hasResponse: true
      })
    },
    updateAlarmValues({ high, low }: { high?: number[]; low?: number[] }) {
      this.setStatus({ updateAlarmValuesLoading: true })

      const messages = []
      if (high) messages.push(['8000', Math.round(high[0] * 10), Math.round(high[1] * 10)])
      if (low) messages.push(['7000', Math.round(low[0] * 10), Math.round(low[1] * 10)])

      const env: Environment = getEnv(self)
      const sendMessage = (messages: [string, number][]) => {
        if (messages.length === 0) {
          this.setAlarmValues({ high, low })
          this.setStatus({ updateAlarmValuesLoading: false })
          return
        }
        const message = messages.pop()
        env.sms.send({
          phoneNumber: self.simNumber,
          type: 'UPDATE_ALARM_VALUES',
          message: `*${self.password}#${message[0]}#${message[1]}*${message[2]}*`,
          callback: () => {
            sendMessage(messages)
          }
        })
      }

      sendMessage(messages)
    },
    updateAlarmInterval(interval: number) {
      this.setStatus({ updateAlarmIntervalLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'UPDATE_ALARM_VALUES',
        message: `*${self.password}#9000#${interval}*`,
        callback: () => {
          this.setAlarmValues({ interval })
          this.setStatus({ updateAlarmIntervalLoading: false })
        }
      })
    },

    sendRpc({ method, value }: { method: string; value: boolean }) {
      this.setStatus({ sendRpcLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'SEND_RPC',
        message: `#${!value ? '0' : ''}${method}#`,
        callback: () => {
          this.setStatus({ sendRpcLoading: false })
        }
      })
    },

    getSimCharge() {
      this.setStatus({ getSimChargeLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'GET_SIM_CHARGE',
        message: '#12#',
        callback: response => {
          this.setSimCharge(response)
          this.setStatus({ getSimChargeLoading: false })
        },
        hasResponse: true
      })
    },
    getSignalStrength() {
      this.setStatus({ getSignalStrengthLoading: true })

      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'GET_SIGNAL_STRENGTH',
        message: '#13#',
        callback: response => {
          this.setSignalStrength(response)
          this.setStatus({ getSignalStrengthLoading: false })
        },
        hasResponse: true
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
    items: types.optional(types.array(DeviceModel), [])
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
