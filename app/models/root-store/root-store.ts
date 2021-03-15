import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { AnalyticsModel } from "../analytics"
import { DeviceListModel } from "../data"
import { StateModel } from "../state"

/**
 * A RootStore model.
 */
// prettier-ignore
export const RootStoreModel = types.model("RootStore").props({
  analytics: AnalyticsModel,
  devices: DeviceListModel,
  state: StateModel
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}

/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {
  analytics: { synced: false }
  devices: { items: [] }
  state: { selectedDeviceID: null }
}
