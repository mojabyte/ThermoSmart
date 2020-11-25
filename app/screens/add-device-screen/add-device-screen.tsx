import React, { useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle } from "react-native"
import { Button, Form, Header, Screen, TextField } from "../../components"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import SmsAndroid from "react-native-get-sms-android"
import { DeviceModel, useStores } from "../../models"
import { color } from "../../theme"
import { PrimaryParamList } from "../../navigation"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

const restoreData = (phoneNumber: string): void => {
  /* List SMS messages matching the filter */
  const filter = {
    box: 'sent', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all

    /**
     *  the next 3 filters can work together, they are AND-ed
     *
     *  minDate, maxDate filters work like this:
     *    - If and only if you set a maxDate, it's like executing this SQL query:
     *    "SELECT * from messages WHERE (other filters) AND date <= maxDate"
     *    - Same for minDate but with "date >= minDate"
     */
    // minDate: 1554636310165, // timestamp (in milliseconds since UNIX epoch)
    // maxDate: 1556277910456, // timestamp (in milliseconds since UNIX epoch)
    // bodyRegex: '(.*)How are you(.*)', // content regex to match

    /** the next 5 filters should NOT be used together, they are OR-ed so pick one **/
    // read: 0, // 0 for unread SMS, 1 for SMS already read
    // _id: 1234, // specify the msg id
    // thread_id: 12, // specify the conversation thread_id
    address: phoneNumber, // sender's phone number
    // body: 'How are you', // content to match
    /** the next 2 filters can be used for pagination **/
    // indexFrom: 0, // start from index 0
    // maxCount: 10, // count of SMS to return each time
  }

  SmsAndroid.list(
    JSON.stringify(filter),
    fail => {
      console.log('Failed with this error: ' + fail)
    },
    (count, smsList) => {
      console.log('Count: ', count)
      console.log('List: ')
      const arr = JSON.parse(smsList)
      console.log(arr)

      arr.forEach(function(object) {
        console.log('Object: ' + object)
        console.log('-->' + object.date)
        console.log('-->' + object.body)
      })
    },
  )
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
      />

      <Form
        submitButton={(
          <Button
            tx={isEdit ? "addDeviceScreen.apply" : "addDeviceScreen.add"}
            onPress={() => {
              if (!name) {
                setNameError('addDeviceScreen.nameErrors.required')
              } else if (!phoneInput.current.isValid()) {
                setSimNumberError('addDeviceScreen.simNumberErrors.invalid')
              } else if (!isEdit && devices.get(simNumber)) {
                setSimNumberError('addDeviceScreen.simNumberErrors.exists')
              } else {
                setSimNumberError('')
                const parsedSimNumber = phoneInput.current.getRawValue()
                console.log(parsedSimNumber)
                if (isEdit) {
                  selectedDevice.setName(name)
                  selectedDevice.setSimNumber(parsedSimNumber)
                  selectedDevice.setPlace(place)
                  restoreData(`+98${parsedSimNumber}`)
                } else {
                  devices.add(DeviceModel.create({ name, simNumber: parsedSimNumber, place }))
                  restoreData(`+98${parsedSimNumber}`)
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
      </Form>
    </Screen>
  )
})
