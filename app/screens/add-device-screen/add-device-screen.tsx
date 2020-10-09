import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle } from "react-native"
import { Button, Form, Header, Screen, TextField } from "../../components"
import { useNavigation } from "@react-navigation/native"
import { DeviceModel, useStores } from "../../models"
import { color } from "../../theme"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

export const AddDeviceScreen = observer(function AddDeviceScreen() {
  const { devices } = useStores()

  const [name, setName] = useState('')
  const [simNumber, setSimNumber] = useState('')
  const [place, setPlace] = useState('')

  const [simNumberError, setSimNumberError] = useState('')

  const navigation = useNavigation()
  return (
    <Screen style={ROOT} preset="scroll">
      <Header
        headerTx="addDeviceScreen.header"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
      />

      <Form
        submitButton={(
          <Button
            tx="addDeviceScreen.add"
            onPress={() => {
              if (!simNumber) {
                setSimNumberError('addDeviceScreen.simNumberErrors.invalid')
              } else if (devices.get(simNumber)) {
                setSimNumberError('addDeviceScreen.simNumberErrors.exists')
              } else {
                setSimNumberError('')
                devices.add(DeviceModel.create({ name, simNumber, place }))
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
    </Screen>
  )
})
