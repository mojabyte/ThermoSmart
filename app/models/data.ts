import { types, getParent, destroy, SnapshotIn, Instance } from 'mobx-state-tree'

export const DeviceModel = types
  .model({
    name: types.string,
    simNumber: types.string,
    place: ''
  })
  .actions(self => ({
    setName(newName: string) {
      self.name = newName
    },
    setPlace(newPlace: string) {
      self.place = newPlace
    },
    remove() {
      getParent<typeof DeviceListModel>(self, 2).remove(self)
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
