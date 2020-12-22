import { getEnv, types } from 'mobx-state-tree'
import { Environment } from "./environment"

export const StateModel = types
  .model({
    selectedDeviceID: types.maybeNull(types.string),
    selectedSimSlot: types.maybeNull(types.number)
  })
  .actions(self => ({
    setSelectedDeviceID(deviceID: string) {
      self.selectedDeviceID = deviceID
    },
    setSelectedSimSlot(simSlot: number) {
      const env: Environment = getEnv(self)
      self.selectedSimSlot = simSlot
      env.sms.selectSimSlot(simSlot)
    }
  }))
