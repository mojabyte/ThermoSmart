import React, { useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, ViewStyle } from "react-native"
import { Button, Form, Header, Screen, TextField } from "../../components"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { DeviceModel, useStores } from "../../models"
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

  const phoneInput = useRef(null)

  const [name, setName] = useState(selectedDevice?.name)
  const [simNumber, setSimNumber] = useState(selectedDevice?.simNumber)
  const [place, setPlace] = useState(selectedDevice?.place)

  const [nameError, setNameError] = useState<string>()
  const [simNumberError, setSimNumberError] = useState<string>()

  const parseSimNumber = (value: string) => value.split(' ').join('').slice(1)

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
                if (!name) {
                  setNameError('addDeviceScreen.nameErrors.required')
                } else if (!phoneInput.current.isValid()) {
                  setSimNumberError('addDeviceScreen.simNumberErrors.invalid')
                } else if (devices.get(simNumber)) {
                  setSimNumberError('addDeviceScreen.simNumberErrors.exists')
                } else {
                  setSimNumberError('')
                  const parsedSimNumber = phoneInput.current.getRawValue()
                  if (isEdit) {
                    selectedDevice.setName(name)
                    selectedDevice.setSimNumber(parsedSimNumber)
                    selectedDevice.setPlace(place)
                  } else {
                    devices.add(DeviceModel.create({ name, simNumber: parsedSimNumber, place }))
                  }
                  navigation.goBack()
                }
              }}
            />
          )}
        >
          <TextField
            labelTx="addDeviceScreen.name"
            errorTx={nameError}
            placeholderTx="addDeviceScreen.namePlaceholder"
            value={name}
            onChange={e => setName(e.nativeEvent.text)}
          />

          <TextField
            forwardedRef={phoneInput}
            type="custom"
            options={{
              mask: '0999 9999999',
              getRawValue: parseSimNumber,
              validator: value => {
                const parsedValue = parseSimNumber(value)
                if (parsedValue.length > 9) return true
                return false
              }
            }}
            labelTx="addDeviceScreen.simNumber"
            errorTx={simNumberError}
            placeholderTx="addDeviceScreen.simNumberPlaceholder"
            value={simNumber}
            onChange={e => setSimNumber(e.nativeEvent.text)}
            keyboardType="numeric"
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
