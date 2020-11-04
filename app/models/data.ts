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

    status: types.optional(types.model({
      getPhoneNumbersLoading: types.boolean,
      updatePhoneNumberLoading: types.array(types.boolean),
      getTemperatureLoading: types.boolean
    }), {
      getPhoneNumbersLoading: false,
      updatePhoneNumberLoading: [],
      getTemperatureLoading: false
    })
  })
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

export type Device = typeof DeviceModel

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
