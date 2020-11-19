import React, { useEffect, useState } from "react"
import { PermissionsAndroid, TextStyle, View, ViewStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import moment from "moment-jalaali"
import MultiSlider from '@ptomasroos/react-native-multi-slider'
import { Button, ConfirmModal, Header, Icon, Screen, Switch, Text } from "../../components"
import { color, spacing, typography } from "../../theme"
import { Device, useStores } from '../../models'

const FULL: ViewStyle = {
  flex: 1,
  backgroundColor: color.background
}
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent
}
const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
}
const BOLD: TextStyle = { fontWeight: "bold" }
const HEADER: TextStyle = {
  elevation: 2,
  backgroundColor: color.primaryDarker
}
const HEADER_TITLE: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 12,
  lineHeight: 15,
  textAlign: "center",
  letterSpacing: 1.5,
}

const DEVICE_SELECT_CONTAINER: ViewStyle = {
  height: 65,
  justifyContent: 'space-between',
  alignItems: 'center',
  flexDirection: 'row',
  paddingHorizontal: '7%',
  paddingTop: 0,
  paddingBottom: 10,
  marginHorizontal: 0,
  marginTop: 0,
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0
}

const DEVICE_SELECT_TITLE: ViewStyle = {
  flex: 1,
  alignSelf: 'center',
  justifyContent: 'space-around'
}

const DEVICE_SELECT_TITLE_TEXT: TextStyle = {
  fontSize: 20,
  color: color.text,
  textAlign: 'left'
}

const DEVICE_SELECT_DETAILS_TEXT: TextStyle = {
  fontSize: 18,
  color: color.text,
  opacity: 0.75,
  textAlign: 'left'
}

const LAST_TEMPERATURE_VALUE: TextStyle = {
  fontSize: 30,
  paddingVertical: 10,
  alignSelf: 'center'
}

const CARD_TITLE: TextStyle = {
  fontSize: 14
}

export const MainScreen = observer(function MainScreen() {
  const navigation = useNavigation()

  const { devices, state: { selectedDeviceID, setSelectedDeviceID } } = useStores()

  React.useEffect(() => {
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
      title: "YourProject App Sms Permission",
      message:
        "YourProject App needs access to your inbox " + "so it can read messages in background.",
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK",
    })
      .then(granted => {
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
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
            address: '+989179637615', // sender's phone number
            // body: 'How are you', // content to match
            /** the next 2 filters can be used for pagination **/
            // indexFrom: 0, // start from index 0
            // maxCount: 10, // count of SMS to return each time
          }

          // SmsAndroid.list(
          //   JSON.stringify(filter),
          //   fail => {
          //     console.log('Failed with this error: ' + fail)
          //   },
          //   (count, smsList) => {
          //     console.log('Count: ', count)
          //     console.log('List: ')
          //     const arr = JSON.parse(smsList)
          //     console.log(arr)

          //     arr.forEach(function(object) {
          //       console.log('Object: ' + object)
          //       console.log('-->' + object.date)
          //       console.log('-->' + object.body)
          //     })
          //   },
          // )
        } else {
          console.log("SMS permission denied")
        }
      })
      .catch(err => console.warn(err))

    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS, {
      title: "YourProject App Sms Permission",
      message:
        "YourProject App needs access to your inbox " + "so it can read messages in background.",
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK",
    })
      .then(granted => {
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // SmsListener.addListener(message => {
          //   console.info(message)
          // })
        } else {
          console.log("SMS permission denied")
        }
      })
      .catch(err => console.warn(err))
  }, [])

  const [selectedDevice, setSelectedDevice] = useState<Device>(devices.get(selectedDeviceID))
  const [isEditModalVisible, setEditModalVisible] = useState(false)
  const [sliderValues, setSliderValues] = useState([0])
  const [selectedSliderModal, setSelectedSliderModal] = useState<'max' | 'nor' | 'min' | 'high' | 'low' | 'interval'>(null)

  useEffect(() => {
    setSelectedDevice(devices.get(selectedDeviceID))
  }, [devices, selectedDeviceID])

  useEffect(() => {
    if (devices.items.length > 0) {
      if (!devices.get(selectedDeviceID)) {
        setSelectedDeviceID(devices.items[0].simNumber)
      }
    } else {
      setSelectedDeviceID(null)
    }
  }, [devices, devices.items.length, selectedDeviceID, setSelectedDeviceID])

  const renderScreenContent = function () {
    if (selectedDevice?.simNumber) {
      return (
        <View style={{ flex: 1, marginHorizontal: spacing[1] }}>
          <View style={{ flex: 0.7, flexDirection: 'row' }}>
            <View style={{ flex: 0.6, flexDirection: 'column' }}>
              <Button
                preset="card"
                onPress={() => {
                  selectedDevice.getTemperature()
                }}
                style={{ flex: 0.7 }}
              >
                <Text text="Temperature" style={CARD_TITLE} />
                <Text
                  text={`${selectedDevice.temperaturesView[0]?.value.toFixed(1)}°C` || 'no data'}
                  style={LAST_TEMPERATURE_VALUE}
                />
                <Text
                  text={`${moment(selectedDevice.temperaturesView[0]?.ts).format('YYYY-MM-DD HH:mm')}`}
                  // style={LAST_TEMPERATURE_VALUE}
                />
              </Button>

              <Button preset="card" style={{ flex: 0.3 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text text="Status" style={[CARD_TITLE, { flex: 1 }]} />
                </View>

                <View style={{ flex:1, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Button
                    text={`${selectedDevice.simCharge} Rial`}
                    onPress={() => selectedDevice.getSimCharge()}
                    style={{ flex: 0.5, margin: 3 }}
                  />

                  <Button
                    text={`${selectedDevice.signalStrength}`}
                    onPress={() => selectedDevice.getSignalStrength()}
                    style={{ flex: 0.5, margin: 3 }}
                  />
                </View>
              </Button>
            </View>

            <View style={{ flex: 0.4, flexDirection: 'column' }}>
              <Button preset="card" style={{ flex: 0.45 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text text="Thermostat" style={[CARD_TITLE, { flex: 1 }]} />
                  {selectedDevice.status.getThermostatValuesLoading ? (
                    <Text text="loading..." />
                  ) : (
                    <Button preset="link" onPress={() => selectedDevice.getThermostatValues()}>
                      <Icon name="refresh" size={20} />
                    </Button>
                  )}
                </View>

                <View style={{ justifyContent: 'space-between' }}>
                  <Button
                    text={`Max: ${selectedDevice.thermostat.max}`}
                    onPress={() => {
                      setSliderValues(selectedDevice.thermostat.max ? [selectedDevice.thermostat.max] : [0])
                      setSelectedSliderModal('max')
                      setEditModalVisible(true)
                    }}
                    style={{ flex: 0.3, margin: 3 }}
                  />
                  <Button
                    text={`Normal: ${selectedDevice.thermostat.nor}`}
                    onPress={() => {
                      setSliderValues(selectedDevice.thermostat.nor ? [selectedDevice.thermostat.nor] : [0])
                      setSelectedSliderModal('nor')
                      setEditModalVisible(true)
                    }}
                    style={{ flex: 0.36, margin: 3 }}
                  />
                  <Button
                    text={`Min: ${selectedDevice.thermostat.min}`}
                    onPress={() => {
                      setSliderValues(selectedDevice.thermostat.min ? [selectedDevice.thermostat.min] : [0])
                      setSelectedSliderModal('min')
                      setEditModalVisible(true)
                    }}
                    style={{ flex: 0.33, margin: 3 }}
                  />
                </View>
              </Button>

              <Button preset="card" style={{ flex: 0.55 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text text="Alarm" style={[CARD_TITLE, { flex: 1 }]} />
                  {selectedDevice.status.getAlarmValuesLoading ? (
                    <Text text="loading..." />
                  ) : (
                    <Button preset="link" onPress={() => selectedDevice.getAlarmValues()}>
                      <Icon name="refresh" size={20} />
                    </Button>
                  )}
                </View>

                <View style={{ justifyContent: 'space-between' }}>
                  <Button
                    text={`High: ${selectedDevice.alarm.high[0]} - ${selectedDevice.alarm.high[1]}`}
                    onPress={() => {
                      setSliderValues(selectedDevice.alarm.high ?? [10, 20])
                      setSelectedSliderModal('high')
                      setEditModalVisible(true)
                    }}
                    style={{ flex: 0.33, margin: 3, paddingHorizontal: 5 }}
                  />
                  <Button
                    text={`Low: ${selectedDevice.alarm.low[0]} - ${selectedDevice.alarm.low[1]}`}
                    onPress={() => {
                      setSliderValues(selectedDevice.alarm.low ?? [10, 20])
                      setSelectedSliderModal('low')
                      setEditModalVisible(true)
                    }}
                    style={{ flex: 0.33, margin: 3, paddingHorizontal: 5 }}
                  />

                  <Button
                    text={`Interval: ${selectedDevice.alarm.interval} min`}
                    onPress={() => {
                      setSliderValues([selectedDevice.alarm.interval] ?? [5])
                      setSelectedSliderModal('interval')
                      setEditModalVisible(true)
                    }}
                    style={{ flex: 0.33, margin: 3, paddingHorizontal: 5 }}
                  />
                </View>
              </Button>
            </View>
          </View>

          <View style={{ flex: 0.3, flexDirection: 'row' }}>
            <Button preset="card" style={{ flex: 0.75 }}>
              <View style={{ flexDirection: 'row' }}>
                <Text text="Control" style={CARD_TITLE} />
              </View>

              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 0.3, justifyContent: 'center', alignItems: 'center' }}>
                  <Text text="Automation" style={[CARD_TITLE, { marginVertical: 3 }]} />

                  <Switch
                    value={selectedDevice.thermostat.isEnabled}
                    onToggle={value => selectedDevice.updateThermostatStatus(value)}
                  />
                </View>

                <View style={{ flex: 0.35, justifyContent: 'center', alignItems: 'center' }}>
                  <Text text="Heater" style={[CARD_TITLE, { marginVertical: 3 }]} />

                  <Button
                    text="ON"
                    onPress={() => selectedDevice.sendRpc({ method: '50', value: true })}
                    style={{ width: '80%', paddingVertical: 6, marginVertical: 3 }}
                  />

                  <Button
                    text="OFF"
                    onPress={() => selectedDevice.sendRpc({ method: '50', value: false })}
                    style={{ width: '80%', paddingVertical: 6, marginVertical: 3 }}
                  />
                </View>

                <View style={{ flex: 0.35, justifyContent: 'center', alignItems: 'center' }}>
                  <Text text="Fan" style={[CARD_TITLE, { marginVertical: 3 }]} />

                  <Button
                    text="ON"
                    onPress={() => selectedDevice.sendRpc({ method: '60', value: true })}
                    style={{ width: '80%', paddingVertical: 6, marginVertical: 3 }}
                  />

                  <Button
                    text="OFF"
                    onPress={() => selectedDevice.sendRpc({ method: '60', value: false })}
                    style={{ width: '80%', paddingVertical: 6, marginVertical: 3 }}
                  />
                </View>
              </View>
            </Button>

            <Button preset="card" style={{ flex: 0.25 }} onPress={() => navigation.navigate('options')}>
              <View style={{ flexDirection: 'row' }}>
                <Text text="Device Settings" style={CARD_TITLE} />
              </View>

              <Icon name="arrow-right" size={40} />
            </Button>
          </View>
        </View>
      )
    }

    return null
  }

  return (
    <View style={FULL}>
      <Screen style={CONTAINER} backgroundColor={color.transparent}>
        <Header
          headerTx="mainScreen.title"
          leftIcon="cog"
          onLeftPress={() => {}}
          rightIcon="plus"
          onRightPress={() => navigation.navigate('add')}
          style={HEADER}
          titleStyle={HEADER_TITLE}
        />
        {(devices.items.length > 0 && selectedDevice?.simNumber) ? (
          <Button
            preset="card"
            onPress={() => navigation.navigate('list')}
            style={DEVICE_SELECT_CONTAINER}
          >
            <View style={DEVICE_SELECT_TITLE}>
              <Text
                style={DEVICE_SELECT_TITLE_TEXT}
                numberOfLines={1}
              >
                {selectedDevice.name}
              </Text>

              { selectedDevice.place
                ? <Text
                  style={DEVICE_SELECT_DETAILS_TEXT}
                  numberOfLines={1}
                >
                  {selectedDevice.place}
                </Text>
                : null
              }
            </View>

            <Icon name="chevron-right" size={25} />
          </Button>
        ) : null}

        {renderScreenContent()}

        <ConfirmModal
          title={`Set ${selectedSliderModal} value`}
          isVisible={isEditModalVisible}
          onClose={() => setEditModalVisible(false)}
          onConfirm={() => {
            if (['max', 'nor', 'min'].includes(selectedSliderModal)) {
              selectedDevice.updateThermostatValues({ [selectedSliderModal]: sliderValues[0] })
            } else if (selectedSliderModal === 'interval') {
              selectedDevice.updateAlarmInterval(sliderValues[0])
            } else {
              selectedDevice.updateAlarmValues({ [selectedSliderModal]: sliderValues })
            }
            setEditModalVisible(false)
          }}
        >
          <View>
            <View style={{ alignSelf: 'center' }}>
              <Text text={`${sliderValues[0].toFixed(1)}°C ${
                `${sliderValues[1] ? `- ${sliderValues[1].toFixed(1)}°C` : ''}`}`}/>
              <MultiSlider
                values={sliderValues}
                min={-20}
                max={50}
                step={0.1}
                snapped
                onValuesChange={values => setSliderValues(
                  values.map(value => Math.round(value * 10) / 10)
                )}
                trackStyle={{
                  height: 10,
                  backgroundColor: color.palette.grey,
                  borderRadius: 5
                }}
                markerStyle={{
                  height: 20,
                  width: 20,
                  elevation: 4,
                  backgroundColor: color.primary
                }}
                selectedStyle={{
                  backgroundColor: color.primary
                }}
                markerOffsetY={5}
              />
            </View>
          </View>
        </ConfirmModal>
      </Screen>
    </View>
  )
})
