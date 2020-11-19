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

export const DevicePhonesScreen = observer(function DevicePhonesScreen() {
  const navigation = useNavigation()

  const { devices, state: { selectedDeviceID } } = useStores()

  const selectedDevice = devices.get(selectedDeviceID)

  const [isEditModalVisible, setEditModalVisible] = useState(false)
  const [phoneNumberEdit, setPhoneNumberEdit] = useState<string>(null)
  const [editIndex, setEditIndex] = useState<number>(null)

  return (
    <Screen preset="scroll" style={ROOT}>
      <Header
        headerText={`${selectedDevice.name} Phone Numbers`}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={() => selectedDevice.getPhoneNumbers()}
      />

      <ScrollView>
        {selectedDevice.validPhoneNumbers.map(phoneNumber => {
          const index = selectedDevice.phoneNumbers.indexOf(phoneNumber)
          return (
            <ListItem
              key={phoneNumber}
              titleText={phoneNumber}
              rightIcon="pencil"
              leftIcon={`numeric-${index + 1}-circle-outline`}
              onPress={() => {
                setPhoneNumberEdit(phoneNumber)
                setEditIndex(index)
                setEditModalVisible(true)
              }}
              onLongPress={() => selectedDevice.deletePhoneNumber(index)}
            />
          )
        })}

        {selectedDevice.validPhoneNumbers.length < 5 ? (
          <ListItem
            titleText="New Phone Number"
            leftIcon="plus-circle-outline"
            onPress={() => {
              setPhoneNumberEdit('')
              setEditIndex(selectedDevice.newPhoneNumberIndex)
              setEditModalVisible(true)
            }}
          />
        ) : null}
      </ScrollView>

      <ConfirmModal
        title={`Update Phone Number #${editIndex + 1}`}
        isVisible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        onConfirm={() => {
          selectedDevice.updatePhoneNumber({ phoneNumber: phoneNumberEdit, index: editIndex })
          setEditModalVisible(false)
        }}
      >
        <View>
          <TextField
            labelTx="addDeviceScreen.simNumber"
            placeholderTx="addDeviceScreen.simNumberPlaceholder"
            value={phoneNumberEdit}
            keyboardType="numeric"
            onChange={e => setPhoneNumberEdit(e.nativeEvent.text)}
          />
        </View>
      </ConfirmModal>
    </Screen>
  )
})
