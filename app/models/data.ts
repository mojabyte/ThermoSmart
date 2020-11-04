import { getEnv, types, getParent, destroy, SnapshotIn, Instance } from 'mobx-state-tree'
import { Environment } from './environment'

export const DeviceModel = types
  .model({
    name: types.string,
    simNumber: types.string,
    place: '',
    password: '123456',
    phoneNumbers: types.array(types.string)
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
    remove() {
      getParent<typeof DeviceListModel>(self, 2).remove(self)
    },

    getPhoneNumbers() {
      const env: Environment = getEnv(self)
      env.sms.send({
        phoneNumber: self.simNumber,
        type: 'GET_PHONE_NUMBERS',
        message: `*${self.password}#100#`,
        callback: response => {
          this.setPhoneNumbers(response.split('\n'))
        }
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
