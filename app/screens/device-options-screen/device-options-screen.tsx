import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, View, ViewStyle } from "react-native"
import { ConfirmModal, Header, ListItem, Screen, TextField } from "../../components"
import { useNavigation } from "@react-navigation/native"
import { useStores } from '../../models'
import { color } from "../../theme"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

export const DeviceOptionsScreen = observer(function DeviceOptionsScreen() {
  const navigation = useNavigation()

  const { devices, state: { selectedDeviceID } } = useStores()
  const selectedDevice = devices.get(selectedDeviceID)

  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordEdit, setPasswordEdit] = useState<string>(null)
  const [passwordError, setPasswordError] = useState('')

  return (
    <Screen preset="scroll" style={ROOT}>
      <Header
        headerText={selectedDevice.name}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="pencil"
        onRightPress={() => navigation.navigate('add', { selectedDeviceID })}
      />

      <ScrollView>
        <ListItem
          titleText="Phone Numbers"
          detailsText="View and edit saved phone numbers"
          rightIcon="chevron-right"
          leftIcon="card-account-phone"
          onPress={() => navigation.navigate('phones')}
        />

        <ListItem
          titleText="SIM Charge"
          leftIcon="sim"
          valueText={selectedDevice.simCharge}
          onPress={() => selectedDevice.getSimCharge()}
        />

        <ListItem
          titleText="Change Password"
          rightIcon="chevron-right"
          leftIcon="key-change"
          onPress={() => {
            setPasswordEdit(selectedDevice.password)
            setPasswordModalVisible(true)
          }}
        />
      </ScrollView>

      <ConfirmModal
        title="Update Device Password"
        isVisible={isPasswordModalVisible}
        onClose={() => {
          setPasswordModalVisible(false)
          setPasswordError('')
        }}
        onConfirm={() => {
          if (passwordEdit.length < 6) {
            setPasswordError("deviceOptionsScreen.passwordLengthError")
          } else {
            setPasswordError('')
            if (passwordEdit !== selectedDevice.password) {
              selectedDevice.updatePassword(passwordEdit)
            }
            setPasswordModalVisible(false)
          }
        }}
      >
        <View>
          <TextField
            labelTx="deviceOptionsScreen.newPassword"
            placeholderTx="deviceOptionsScreen.passwordPlaceholder"
            errorTx={passwordError}
            value={passwordEdit}
            keyboardType="numeric"
            maxLength={6}
            onChange={e => setPasswordEdit(e.nativeEvent.text)}
          />
        </View>
      </ConfirmModal>
    </Screen>
  )
})
