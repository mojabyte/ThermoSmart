import { types } from 'mobx-state-tree'

export const StateModel = types
  .model({
    selectedDeviceID: types.string
  })
  .actions(self => ({
    setSelectedDeviceID(deviceID: string) {
      self.selectedDeviceID = deviceID
    }
  }))
