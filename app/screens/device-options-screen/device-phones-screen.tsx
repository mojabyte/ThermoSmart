import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { ActivityIndicator, ScrollView, View, ViewStyle } from "react-native"
import { ConfirmModal, Header, ListItem, Screen, TextField } from "../../components"
import { useNavigation } from "@react-navigation/native"
import { useStores } from '../../models'
import { color } from "../../theme"
import { translate } from "../../i18n"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

const ACTIVITY_INDICATOR: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#fffa',
  justifyContent: 'center',
  alignItems: 'center'
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
        headerText={translate('devicePhonesScreen.title', { name: selectedDevice.name })}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={() => selectedDevice.getPhoneNumbers()}
      />

      <ScrollView keyboardShouldPersistTaps="handled">
        {selectedDevice.phoneNumbers.map((phoneNumber, index) => {
          if (phoneNumber) {
            return (
              <ListItem
                key={`${index}-${phoneNumber}`}
                titleText={phoneNumber}
                loading={selectedDevice.state.updatePhoneNumberLoading[index]}
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
          }
          return null
        })}

        {selectedDevice.validPhoneNumbers.length < 5 ? (
          <ListItem
            titleTx="devicePhonesScreen.new"
            leftIcon="plus-circle-outline"
            onPress={() => {
              setPhoneNumberEdit('')
              setEditIndex(selectedDevice.newPhoneNumberIndex)
              setEditModalVisible(true)
            }}
          />
        ) : null}
      </ScrollView>

      {selectedDevice.state.getPhoneNumbersLoading &&
        <ActivityIndicator color="black" size="large" style={ACTIVITY_INDICATOR} />}

      <ConfirmModal
        titleText={translate('devicePhonesScreen.updateModalTitle', { index: editIndex + 1 })}
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
