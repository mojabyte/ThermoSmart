import { getEnv, types, getParent, destroy, SnapshotIn, Instance } from 'mobx-state-tree'
import { Environment } from './environment'

export const DeviceModel = types
  .model({
    name: types.string,
    simNumber: types.string,
    place: '',
    password: '123456',
    phoneNumbers: types.optional(types.array(types.string), []),

    status: types.optional(types.model({
      getPhoneNumbersLoading: types.boolean,
      updatePhoneNumberLoading: types.array(types.boolean)
    }), {
      getPhoneNumbersLoading: false,
      updatePhoneNumberLoading: []
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
        type: 'ADD_PHONE_NUMBERS',
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
