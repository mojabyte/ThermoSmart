import React, { useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, View, ViewStyle } from "react-native"
import { ConfirmModal, Header, ListItem, Screen, Switch, TextField } from "../../components"
import { useNavigation } from "@react-navigation/native"
import moment from "moment-jalaali"
import DatePicker from "react-native-date-picker"
import { useStores } from "../../models"
import { color, spacing } from "../../theme"
import { translate } from "../../i18n"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1,
}

export const SettingsScreen = observer(function SettingsScreen() {
  const navigation = useNavigation()

  const {
    devices,
    state: { selectedDeviceID, selectedSimSlot, setSelectedSimSlot, alarmSettings, setAlarmStatus },
  } = useStores()
  const selectedDevice = devices.get(selectedDeviceID)

  const [isClockModalVisible, setClockModalVisible] = useState(false)
  const [clockTime, setClockTime] = useState(new Date())

  useEffect(() => setSelectedSimSlot(selectedSimSlot), [selectedSimSlot, setSelectedSimSlot])

  const [isSimModalVisible, setSimModalVisible] = useState(false)
  const [simCardChargeCode, setSimCardChargeCode] = useState<string>()
  const [simCardChargeError, setSimCardChargeError] = useState<string>()

  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordEdit, setPasswordEdit] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()

  return (
    <Screen preset="scroll" style={ROOT}>
      <Header
        headerTx="settingsScreen.title"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing[4] }}>
        <ListItem
          titleTx="settingsScreen.sim.title"
          detailsTx="settingsScreen.sim.details"
          valueText={translate(
            selectedSimSlot === 0
              ? "settingsScreen.sim.value1"
              : selectedSimSlot === 1
              ? "settingsScreen.sim.value2"
              : "settingsScreen.sim.value0",
          )}
          rightIcon={
            selectedSimSlot === 0
              ? "numeric-1-box-outline"
              : selectedSimSlot === 1
              ? "numeric-2-box-outline"
              : "alpha-d-box-outline"
          }
          leftIcon="sim"
          onPress={() => {
            if (selectedSimSlot === 0) {
              setSelectedSimSlot(1)
            } else if (selectedSimSlot === 1) {
              setSelectedSimSlot(null)
            } else {
              setSelectedSimSlot(0)
            }
          }}
        />

        <ListItem
          titleTx="settingsScreen.alarm.title"
          detailsTx="settingsScreen.alarm.details"
          leftIcon="alarm"
          onPress={() => {
            setAlarmStatus(!alarmSettings.isEnabled)
          }}
        >
          <Switch value={alarmSettings.isEnabled} onToggle={(value) => setAlarmStatus(value)} />
        </ListItem>
      </ScrollView>

      <ConfirmModal
        titleTx="deviceOptionsScreen.password.change"
        titleIcon="key-change"
        isVisible={isPasswordModalVisible}
        onInit={() => setPasswordEdit(selectedDevice.password)}
        onClose={() => {
          setPasswordModalVisible(false)
          setPasswordError("")
        }}
        onConfirm={() => {
          if (passwordEdit.length < 6) {
            setPasswordError("deviceOptionsScreen.password.lengthError")
          } else {
            setPasswordError("")
            if (passwordEdit !== selectedDevice.password) {
              selectedDevice.updatePassword(passwordEdit)
            }
            setPasswordModalVisible(false)
          }
        }}
      >
        <View>
          <TextField
            labelTx="deviceOptionsScreen.password.password"
            placeholderTx="deviceOptionsScreen.password.placeholder"
            errorTx={passwordError}
            value={passwordEdit}
            keyboardType="numeric"
            maxLength={6}
            onChange={(e) => setPasswordEdit(e.nativeEvent.text)}
          />
        </View>
      </ConfirmModal>

      <ConfirmModal
        titleTx="deviceOptionsScreen.clock.details"
        titleIcon="clock"
        leftTitleTx="common.update"
        leftIcon="refresh"
        onLeftPress={() => selectedDevice.getClock()}
        loading={selectedDevice.state.clockLoading}
        isVisible={isClockModalVisible}
        onInit={() => setClockTime(new Date(selectedDevice.getClockNow()))}
        onClose={() => setClockModalVisible(false)}
        onConfirm={() => {
          const time = moment(clockTime).utc()
          selectedDevice.updateClock({
            hours: time.hours(),
            minutes: time.minutes(),
          })
          setClockModalVisible(false)
        }}
      >
        <DatePicker
          date={clockTime}
          onDateChange={setClockTime}
          mode="time"
          androidVariant="nativeAndroid"
          timeZoneOffsetInMinutes={0}
          style={{ alignSelf: "center" }}
        />
      </ConfirmModal>

      <ConfirmModal
        titleTx="deviceOptionsScreen.simCard.chargeModalTitle"
        titleIcon="credit-card-plus"
        isVisible={isSimModalVisible}
        onClose={() => {
          setSimModalVisible(false)
          setSimCardChargeError("")
          setSimCardChargeCode(null)
        }}
        onConfirm={() => {
          if (!simCardChargeCode?.length) {
            setSimCardChargeError("deviceOptionsScreen.simCard.chargeRequired")
          } else {
            setSimCardChargeError("")
            selectedDevice.sendSimChargeCode(simCardChargeCode)
            setSimModalVisible(false)
            setSimCardChargeCode(null)
          }
        }}
      >
        <View>
          <TextField
            labelTx="deviceOptionsScreen.simCard.chargeCode"
            placeholderTx="deviceOptionsScreen.simCard.chargePlaceholder"
            errorTx={simCardChargeError}
            value={simCardChargeCode}
            keyboardType="numeric"
            onChange={(e) => setSimCardChargeCode(e.nativeEvent.text)}
          />
        </View>
      </ConfirmModal>
    </Screen>
  )
})
