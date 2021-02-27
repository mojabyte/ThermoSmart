import { getEnv, types } from "mobx-state-tree"
import { Environment } from "./environment"

export const StateModel = types
  .model({
    selectedDeviceID: types.maybeNull(types.string),
    selectedSimSlot: types.maybeNull(types.number),
    alarmSettings: types.optional(
      types.model({
        isEnabled: types.boolean,
      }),
      {
        isEnabled: true,
      },
    ),
  })
  .actions((self) => ({
    setSelectedDeviceID(deviceID: string) {
      self.selectedDeviceID = deviceID
    },
    setSelectedSimSlot(simSlot: number) {
      const env: Environment = getEnv(self)
      self.selectedSimSlot = simSlot
      env.sms.selectSimSlot(simSlot)
    },
    setAlarmStatus(status: boolean) {
      self.alarmSettings.isEnabled = status
    },
  }))
