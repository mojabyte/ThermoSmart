import React, { useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle } from "react-native"
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

  const { devices, state: { setSelectedDeviceID } } = useStores()
  const selectedDevice = devices.get(params?.selectedDeviceID)
  const isEdit = !!selectedDevice?.simNumber

  const phoneInput = useRef(null)

  const [name, setName] = useState(selectedDevice?.name)
  const [simNumber, setSimNumber] = useState(selectedDevice?.simNumber)
  const [place, setPlace] = useState(selectedDevice?.place)
  const [password, setPassword] = useState(selectedDevice?.password || '123456')

  const [nameError, setNameError] = useState<string>()
  const [simNumberError, setSimNumberError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()

  const parseSimNumber = (value: string) => {
    const parsed = value.split(' ').join('')
    if (parsed[0] === '0') {
      return parsed.slice(1, 11)
    }
    return parsed.slice(0, 10)
  }

  return (
    <Screen style={ROOT}>
      <Header
        headerTx={isEdit ? "addDeviceScreen.header.edit" : "addDeviceScreen.header.new"}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="check"
        rightTx={isEdit ? "addDeviceScreen.apply" : "addDeviceScreen.add"}
        onRightPress={() => {
          if (!name) {
            setNameError('addDeviceScreen.nameErrors.required')
          } else if (!phoneInput.current.isValid()) {
            setSimNumberError('addDeviceScreen.simNumberErrors.invalid')
          } else if (!isEdit && devices.get(simNumber)) {
            setSimNumberError('addDeviceScreen.simNumberErrors.exists')
          } else if (password.length < 6) {
            setPasswordError('deviceOptionsScreen.password.lengthError')
          } else {
            setSimNumberError('')
            const parsedSimNumber = phoneInput.current.getRawValue()
            console.log(parsedSimNumber)
            if (isEdit) {
              selectedDevice.setName(name)
              selectedDevice.setSimNumber(parsedSimNumber)
              selectedDevice.setPlace(place)
              selectedDevice.setPassword(password)
              navigation.goBack()
            } else {
              devices.add(DeviceModel.create({
                name,
                simNumber: parsedSimNumber,
                place,
                password
              }))
              setSelectedDeviceID(parsedSimNumber)
              navigation.navigate('main')
            }
          }
        }}
      />

      <Form>
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
            mask: '0999 999 9999',
            getRawValue: parseSimNumber,
            validator: value => {
              const parsedValue = parseSimNumber(value)
              if (parsedValue.length === 10) return true
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

        <TextField
          labelTx="deviceOptionsScreen.password.password"
          errorTx={passwordError}
          placeholderTx="deviceOptionsScreen.password.placeholder"
          value={password}
          onChange={e => setPassword(e.nativeEvent.text)}
          maxLength={6}
          keyboardType="numeric"
        />
      </Form>
    </Screen>
  )
})
