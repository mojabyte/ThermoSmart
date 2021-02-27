import React from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, ViewStyle } from "react-native"
import { Header, ListItem, Screen, Switch } from "../../components"
import { useNavigation } from "@react-navigation/native"
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
    state: { selectedSimSlot, setSelectedSimSlot, alarmSettings, setAlarmStatus },
  } = useStores()

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
    </Screen>
  )
})
