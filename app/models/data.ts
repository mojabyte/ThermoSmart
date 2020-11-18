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
    phoneNumbers: types.optional(types.array(types.string), []),

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
    })
  })
  .volatile(() => ({
    status: {
      getPhoneNumbersLoading: false,
      updatePhoneNumberLoading: [],
      getTemperatureLoading: false,
      getThermostatValuesLoading: false,
      updateThermostatValuesLoading: false,
      updateThermostatStatusLoading: false,
      getAlarmValuesLoading: false,
      updateAlarmValuesLoading: false,
      updateAlarmIntervalLoading: false
    }
  }))
  .actions(self => ({
    setName(newName: string) {
      self.name = newName
    },
    setPlace(newPlace: string) {
      self.place = newPlace
    },
    setPhoneNumbers(newPhoneNumbers: string[]) {
      self.phoneNumbers.replace(newPhoneNumbers)
    },
    setPhoneNumberAtIndex(index: number, newPhoneNumber: string) {
      self.phoneNumbers[index] = newPhoneNumber
    },
    setTemperature({ value, ts }: { value: number; ts: string }) {
      self.temperatures.set(ts, value)
    },
    setThermostatValues({ max, nor, min }: { max?: number; nor?: number; min?: number }) {
      self.thermostat.max = max ?? self.thermostat.max
      self.thermostat.nor = nor ?? self.thermostat.nor
      self.thermostat.min = min ?? self.thermostat.min
    },
    setAlarmValues({ high, low, interval }: { high?: number[]; low?: number[]; interval?: number }) {
      self.alarm.high.replace(high ?? self.alarm.high)
      self.alarm.low.replace(low ?? self.alarm.low)
      self.alarm.interval = interval ?? self.alarm.interval
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

    updatePhoneNumber({ phoneNumber, index }) {
      if (index > 4) {
        // TODO: maximum number of phoneNumbers is reached display appropriate message
        return
      }
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
    }
  }))
  .views(self => ({
    get temperaturesView() {
      let temperatures = []
      self.temperatures.forEach((value, key) => temperatures.push({ ts: parseInt(key), value }))
      temperatures = sortBy(({ ts }) => ts, temperatures)
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
