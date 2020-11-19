import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, ViewStyle } from "react-native"
import { Button, Form, Header, Screen, TextField } from "../../components"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { Device, DeviceModel, useStores } from "../../models"
import { color } from "../../theme"
import { PrimaryParamList } from "../../navigation"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

export const AddDeviceScreen = observer(function AddDeviceScreen() {
  const navigation = useNavigation()
  const { params } = useRoute<RouteProp<PrimaryParamList, 'add'>>()

  const { devices } = useStores()
  const selectedDevice = devices.get(params?.selectedDeviceID)
  const isEdit = !!selectedDevice?.simNumber

  const [name, setName] = useState(selectedDevice?.name)
  const [simNumber, setSimNumber] = useState(selectedDevice?.simNumber)
  const [place, setPlace] = useState(selectedDevice?.place)

  const [simNumberError, setSimNumberError] = useState('')

  return (
    <Screen style={ROOT} preset="scroll">
      <Header
        headerTx={isEdit ? "addDeviceScreen.header.edit" : "addDeviceScreen.header.new"}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView>
        <Form
          submitButton={(
            <Button
              tx={isEdit ? "addDeviceScreen.apply" : "addDeviceScreen.add"}
              onPress={() => {
                if (!simNumber) {
                  setSimNumberError('addDeviceScreen.simNumberErrors.invalid')
                } else if (devices.get(simNumber)) {
                  setSimNumberError('addDeviceScreen.simNumberErrors.exists')
                } else {
                  setSimNumberError('')
                  if (isEdit) {
                    selectedDevice.setName(name)
                    selectedDevice.setSimNumber(simNumber)
                    selectedDevice.setPlace(place)
                  } else {
                    devices.add(DeviceModel.create({ name, simNumber, place }))
                  }
                  navigation.goBack()
                }
              }}
            />
          )}
        >
          <TextField
            labelTx="addDeviceScreen.name"
            placeholderTx="addDeviceScreen.namePlaceholder"
            value={name}
            onChange={e => setName(e.nativeEvent.text)}
          />

          <TextField
            labelTx="addDeviceScreen.simNumber"
            errorTx={simNumberError}
            placeholderTx="addDeviceScreen.simNumberPlaceholder"
            value={simNumber}
            onChange={e => setSimNumber(e.nativeEvent.text)}
          />

          <TextField
            labelTx="addDeviceScreen.place"
            placeholderTx="addDeviceScreen.placePlaceholder"
            value={place}
            onChange={e => setPlace(e.nativeEvent.text)}
          />
        </Form>
      </ScrollView>
    </Screen>
  )
})
