import React, { useEffect, useState } from "react"
import { PermissionsAndroid, TextStyle, ToastAndroid, View, ViewStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import moment from "moment-jalaali"
import MultiSlider from '@ptomasroos/react-native-multi-slider'
import { Button, ConfirmModal, Header, Icon, Screen, Switch, Text } from "../../components"
import { color, spacing } from "../../theme"
import { Device, useStores } from '../../models'
import { translate } from "../../i18n"

const FULL: ViewStyle = {
  flex: 1,
  backgroundColor: color.palette.offWhite
}
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent
}

const DEVICE_SELECT_CONTAINER: ViewStyle = {
  height: 50,
  justifyContent: 'space-between',
  alignItems: 'center',
  flexDirection: 'row',
  paddingHorizontal: '7%',
  paddingTop: 0,
  paddingBottom: 5,
  marginHorizontal: 0,
  marginTop: 0,
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  backgroundColor: color.primary
}

const DEVICE_SELECT_TITLE: ViewStyle = {
  flex: 1,
  alignSelf: 'center',
  justifyContent: 'space-around',
  paddingEnd: spacing[4]
}

const DEVICE_SELECT_TITLE_ROW: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const DEVICE_SELECT_TITLE_TEXT: TextStyle = {
  fontSize: 24,
  color: color.palette.white,
  textAlign: 'left'
}

const DEVICE_SELECT_SIM_NUMBER: TextStyle = {
  fontSize: 14,
  color: color.palette.offWhite,
  textAlign: 'right'
}

const DEVICE_SELECT_DETAILS_TEXT: TextStyle = {
  fontSize: 16,
  color: color.palette.offWhite,
  opacity: 0.75,
  textAlign: 'left'
}

const LAST_TEMPERATURE_VALUE: TextStyle = {
  fontSize: 28,
  paddingVertical: spacing[2],
  alignSelf: 'center'
}

const getTimeFormat = (ts: string) => {
  const date = moment(ts).isAfter(moment().startOf('day'))
    ? 'امروز'
    : (moment(ts).isAfter(moment().subtract(1, 'day').startOf('day'))
      ? 'دیروز'
      : moment(ts).format('jDD jMMM'))
  return `${date}   ${moment(ts).format('HH:mm')}`
}

type CardProps = {
  title?: string,
  titleIcon?: string,
  loading?: boolean,
  onRefresh?: () => void,
  containerStyle?: ViewStyle,
  contentStyle?: ViewStyle,
  children?: React.ReactNode
}

const CARD_HEADER: ViewStyle = {
  flexDirection: 'row'
}

const CARD_TITLE_CONTAINER: ViewStyle = {
  flex: 1,
  alignSelf: 'flex-start',
  flexDirection: 'row',
  alignItems: 'center'
}

const CARD_TITLE: TextStyle = {
  fontSize: 14,
  lineHeight: 16,
  paddingHorizontal: spacing[1]
}

const CARD_CONTENT_CONTAINER: ViewStyle = {
  flex: 1,
  justifyContent: 'space-between',
  alignItems: 'center'
}

const Card = observer(function Card({
  title,
  titleIcon,
  loading,
  onRefresh,
  containerStyle,
  contentStyle,
  children
}: CardProps) {
  return (
    <Button
      preset="card"
      loading={loading}
      style={containerStyle}
    >
      <View style={CARD_HEADER}>
        <View style={CARD_TITLE_CONTAINER}>
          {titleIcon && <Icon name={titleIcon} />}
          {title && <Text tx={title} style={CARD_TITLE} />}
        </View>

        {onRefresh && (
          <Button preset="link" onPress={onRefresh}>
            <Icon name="refresh" size={20} />
          </Button>
        )}
      </View>

      <View style={[CARD_CONTENT_CONTAINER, contentStyle]}>
        {children}
      </View>
    </Button>
  )
})

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
          // TODO store permissions to display user every time it's denied
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
  const [selectedSliderModal, setSelectedSliderModal] = useState<'max' | 'nor' | 'min' | 'high' | 'low' | 'interval'>('max')
  const [signalIcon, setSignalIcon] = useState('signal-cellular-3')

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

  useEffect(() => {
    if (selectedDevice) {
      if (selectedDevice.signalStrength < 25) {
        setSignalIcon('signal-off')
      } else if (selectedDevice.signalStrength < 50) {
        setSignalIcon('signal-cellular-outline')
      } else if (selectedDevice.signalStrength < 75) {
        setSignalIcon('signal-cellular-1')
      } else if (selectedDevice.signalStrength < 100) {
        setSignalIcon('signal-cellular-2')
      } else {
        setSignalIcon('signal-cellular-3')
      }

      selectedDevice.restoreFromMessages()
    }
  }, [selectedDevice])

  const rangeModalTempProps = {
    min: 0,
    max: 40,
    step: 0.1
  }

  const rangeModalThermoProps = {
    title: translate(
      'mainScreen.thermostatModal.title',
      ({ type: translate(`mainScreen.thermostatModal.${selectedSliderModal}`) })
    ),
    titleIcon: 'thermostat',
    parseValues: (values: number[]) => `${values[0].toFixed(1)}°c`
  }

  const rangeModalAlarmProps = {
    title: translate(
      'mainScreen.alarmModal.title',
      ({ type: translate(`mainScreen.alarmModal.${selectedSliderModal}`) })
    ),
    titleIcon: 'alarm',
    parseValues: (values: number[]) => `${values[0].toFixed(1)}°c - ${values[1].toFixed(1)}°c`
  }

  const rangeModalProps = {
    max: {
      ...rangeModalTempProps,
      ...rangeModalThermoProps,
      onConfirm: () => {
        selectedDevice.updateThermostatMaxValue(sliderValues[0])
      }
    },
    nor: {
      ...rangeModalTempProps,
      ...rangeModalThermoProps,
      onConfirm: () => {
        selectedDevice.updateThermostatNorValue(sliderValues[0])
      }
    },
    min: {
      ...rangeModalTempProps,
      ...rangeModalThermoProps,
      onConfirm: () => {
        selectedDevice.updateThermostatMinValue(sliderValues[0])
      }
    },
    high: {
      ...rangeModalTempProps,
      ...rangeModalAlarmProps,
      min: 30,
      max: 45,
      onConfirm: () => {
        selectedDevice.updateAlarmHigh(sliderValues)
      }
    },
    low: {
      ...rangeModalTempProps,
      ...rangeModalAlarmProps,
      min: 0,
      max: 20,
      onConfirm: () => {
        selectedDevice.updateAlarmLow(sliderValues)
      }
    },
    interval: {
      title: translate('mainScreen.alarmModal.intervalTitle'),
      titleIcon: 'message-text-clock',
      min: 5,
      max: 120,
      step: 1,
      onConfirm: () => {
        selectedDevice.updateAlarmInterval(sliderValues[0])
      },
      parseValues: (values: number[]) => translate(
        'deviceOptionsScreen.powerOutage.smsIntervalValue',
        { interval: values[0] }
      )
    }
  }

  const renderScreenContent = function () {
    if (selectedDevice?.simNumber) {
      return (
        <View style={{ flex: 1, marginHorizontal: spacing[1] }}>
          <View style={{ flex: 0.7, flexDirection: 'row' }}>
            <View style={{ flex: 0.6, flexDirection: 'column' }}>
              <Card
                title="mainScreen.temperatureCard.title"
                titleIcon="thermometer-lines"
                loading={selectedDevice.state.getStatusLoading}
                onRefresh={() => selectedDevice.getStatus()}
                containerStyle={{ flex: 0.45 }}
              >
                <Text
                  text={`${selectedDevice.temperaturesView[0]?.value.toFixed(1) ?? '---'}°c`}
                  style={LAST_TEMPERATURE_VALUE}
                />
                {selectedDevice.temperaturesView[0]?.ts && (
                  <Text
                    text={getTimeFormat(selectedDevice.temperaturesView[0].ts)}
                    style={{ fontSize: 12 }}
                  />
                )}

                <Button
                  preset="link"
                  onPress={() => {
                    navigation.navigate('chart', { selectedDeviceID })
                  }}
                  style={{ flexDirection: 'row', paddingVertical: spacing[2] }}
                >
                  <Icon name="chart-line" />
                  <Text tx="mainScreen.temperatureCard.chart" style={{ paddingHorizontal: spacing[3] }} />
                  <Icon name="chevron-right-ltr" />
                </Button>
              </Card>

              <Card
                title="mainScreen.statusCard.title"
                titleIcon="information"
                containerStyle={{ flex: 0.55 }}
                contentStyle={{ justifyContent: 'space-evenly', alignItems: 'flex-start' }}
              >
                <View style={{ flex: 0.5, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Button
                    preset="card"
                    onPress={() => selectedDevice.getSimCredit()}
                    loading={selectedDevice.state.getSimCreditLoading}
                    style={{ flex: 0.5, flexDirection: 'row', margin: spacing[1] }}
                  >
                    <Text text={`${selectedDevice.simCharge}`}/>
                    <Icon name="currency-rial" containerStyle={{ marginHorizontal: spacing[1] }} />
                  </Button>

                  <Button
                    preset="card"
                    onPress={() => selectedDevice.getSignalStrength()}
                    loading={selectedDevice.state.getSignalStrengthLoading}
                    style={{ flex: 0.5, margin: spacing[1] }}
                  >
                    <Icon name={signalIcon} size={30} />
                  </Button>
                </View>

                <View style={{ flexDirection: 'row' }}>
                  {selectedDevice.powerStatus ? (
                    <>
                      <Icon name="power-plug" />
                      <Text tx="mainScreen.statusCard.powerConnected" />
                    </>
                  ) : (
                    <>
                      <Icon name="power-plug-off" />
                      <Text tx="mainScreen.statusCard.powerDisconnected" />
                    </>
                  )}
                </View>
              </Card>
            </View>

            <View style={{ flex: 0.4, flexDirection: 'column' }}>
              <Card
                title="mainScreen.thermostatCard.title"
                titleIcon="thermostat"
                loading={selectedDevice.state.getThermostatValuesLoading}
                onRefresh={() => selectedDevice.getThermostatValues()}
                containerStyle={{ flex: 0.45 }}
              >
                <Button
                  preset="card"
                  onPress={() => {
                    setSliderValues(selectedDevice.thermostat.max ? [selectedDevice.thermostat.max] : [0])
                    setSelectedSliderModal('max')
                    setEditModalVisible(true)
                  }}
                  loading={selectedDevice.state.updateThermostatMaxValueLoading}
                  style={{ flex: 1, margin: spacing[1], flexDirection: 'row' }}
                >
                  <Icon name="arrow-collapse-up" containerStyle={{ paddingEnd: spacing[4] }} />
                  <Text text={`${selectedDevice.thermostat.max ?? '---'}°c`} style={{ paddingStart: spacing[4] }} />
                </Button>

                <Button
                  preset="card"
                  onPress={() => {
                    setSliderValues(selectedDevice.thermostat.nor ? [selectedDevice.thermostat.nor] : [0])
                    setSelectedSliderModal('nor')
                    setEditModalVisible(true)
                  }}
                  loading={selectedDevice.state.updateThermostatNorValueLoading}
                  style={{ flex: 1, margin: spacing[1], flexDirection: 'row' }}
                >
                  <Icon name="drag-horizontal-variant" containerStyle={{ paddingEnd: spacing[4] }} />
                  <Text text={`${selectedDevice.thermostat.nor ?? '---'}°c`} style={{ paddingStart: spacing[4] }} />
                </Button>

                <Button
                  preset="card"
                  onPress={() => {
                    setSliderValues(selectedDevice.thermostat.min ? [selectedDevice.thermostat.min] : [0])
                    setSelectedSliderModal('min')
                    setEditModalVisible(true)
                  }}
                  loading={selectedDevice.state.updateThermostatMinValueLoading}
                  style={{ flex: 1, margin: spacing[1], flexDirection: 'row' }}
                >
                  <Icon name="arrow-collapse-down" containerStyle={{ paddingEnd: spacing[4] }} />
                  <Text text={`${selectedDevice.thermostat.min ?? '---'}°c`} style={{ paddingStart: spacing[4] }} />
                </Button>
              </Card>

              <Card
                title="mainScreen.alarmCard.title"
                titleIcon="alarm"
                loading={selectedDevice.state.getAlarmValuesLoading}
                onRefresh={() => selectedDevice.getAlarmValues()}
                containerStyle={{ flex: 0.55 }}
              >
                <Button
                  preset="card"
                  onPress={() => {
                    setSliderValues(selectedDevice.alarm.high ?? [10, 20])
                    setSelectedSliderModal('high')
                    setEditModalVisible(true)
                  }}
                  loading={selectedDevice.state.updateAlarmHighLoading}
                  style={{ flex: 1, margin: spacing[1], flexDirection: 'row' }}
                >
                  <Icon name="arrow-expand-up" containerStyle={{ paddingEnd: spacing[3] }} />
                  <Text text={`${selectedDevice.alarm.high[0] ?? '---'}°c - ${
                    selectedDevice.alarm.high[1] ?? '---'}°c`} />
                </Button>
                <Button
                  preset="card"
                  onPress={() => {
                    setSliderValues(selectedDevice.alarm.low ?? [10, 20])
                    setSelectedSliderModal('low')
                    setEditModalVisible(true)
                  }}
                  loading={selectedDevice.state.updateAlarmLowLoading}
                  style={{ flex: 1, margin: spacing[1], flexDirection: 'row' }}
                >
                  <Icon name="arrow-expand-down" containerStyle={{ paddingEnd: spacing[3] }} />
                  <Text text={`${selectedDevice.alarm.low[0] ?? '---'}°c - ${
                    selectedDevice.alarm.low[1] ?? '---'}°c`} />
                </Button>

                <Button
                  preset="card"
                  text={`Interval: ${selectedDevice.alarm.interval} min`}
                  onPress={() => {
                    setSliderValues([selectedDevice.alarm.interval] ?? [5])
                    setSelectedSliderModal('interval')
                    setEditModalVisible(true)
                  }}
                  loading={selectedDevice.state.updateAlarmIntervalLoading}
                  style={{ flex: 1, margin: spacing[1], flexDirection: 'row' }}
                >
                  <Icon name="message-text-clock" containerStyle={{ paddingEnd: spacing[4] }} />
                  <Text text={`${selectedDevice.alarm.interval || '---'} دقیقه`} />
                </Button>
              </Card>
            </View>
          </View>

          <View style={{ flex: 0.3, flexDirection: 'row' }}>
            <Card
              title="mainScreen.controlCard.title"
              titleIcon="camera-control"
              loading={selectedDevice.state.getStatusLoading}
              containerStyle={{ flex: 0.75 }}
              contentStyle={{ flexDirection: 'row' }}
            >
              <View style={{ flex: 0.3, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ marginVertical: spacing[2] }}>
                  <Text tx="mainScreen.controlCard.automation" style={CARD_TITLE} />
                </Text>

                <Switch
                  value={selectedDevice.thermostat.isEnabled}
                  loading={selectedDevice.state.updateThermostatStatusLoading}
                  onToggle={value => selectedDevice.updateThermostatStatus(value)}
                />
              </View>

              <View style={{ flex: 0.35, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ marginVertical: spacing[2] }}>
                  <Icon name="radiator" containerStyle={{ paddingHorizontal: spacing[1] }} />
                  <Text tx="mainScreen.controlCard.heater" style={CARD_TITLE} />
                </Text>

                <Switch
                  value={selectedDevice.heaterStatus}
                  loading={selectedDevice.state.updateHeaterStatusLoading}
                  onToggle={value => {
                    if (selectedDevice.thermostat.isEnabled) {
                      ToastAndroid.show(
                        translate('mainScreen.controlCard.disableAutomationToast'),
                        ToastAndroid.SHORT
                      )
                    } else {
                      selectedDevice.updateHeaterStatus(value)
                    }
                  }}
                />
              </View>

              <View style={{ flex: 0.35, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ marginVertical: spacing[2] }}>
                  <Icon name="fan" containerStyle={{ paddingHorizontal: spacing[1] }} />
                  <Text tx="mainScreen.controlCard.fan" style={CARD_TITLE} />
                </Text>

                <Switch
                  value={selectedDevice.fanStatus}
                  loading={selectedDevice.state.updateFanStatusLoading}
                  onToggle={value => {
                    if (selectedDevice.thermostat.isEnabled) {
                      ToastAndroid.show(
                        translate('mainScreen.controlCard.disableAutomationToast'),
                        ToastAndroid.SHORT
                      )
                    } else {
                      selectedDevice.updateFanStatus(value)
                    }
                  }}
                />
              </View>
            </Card>

            <Button preset="card" style={{ flex: 0.25 }} onPress={() => navigation.navigate('options')}>
              <View style={{ flexDirection: 'row' }}>
                <Text tx="mainScreen.settingsCard.title" style={CARD_TITLE} />
              </View>

              <Icon name="arrow-right-ltr" size={40} />
            </Button>
          </View>
        </View>
      )
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Button
          onPress={() => navigation.navigate('add')}
          style={{ flexDirection: 'row' }}
        >
          <Icon name="plus" color={color.palette.white} containerStyle={{ margin: spacing[2] }} />
          <Text tx="mainScreen.newDeviceButton" style={{ color: color.palette.white }} />
        </Button>
      </View>
    )
  }

  return (
    <View style={FULL}>
      <Screen style={CONTAINER} backgroundColor={color.transparent}>
        <Header
          preset="primary"
          headerTx="mainScreen.title"
          leftIcon="cog"
          // onLeftPress={() => {}}
          rightIcon="plus"
          onRightPress={() => navigation.navigate('add')}
        />
        {(devices.items.length > 0 && selectedDevice?.simNumber) ? (
          <Button
            preset="card"
            onPress={() => navigation.navigate('list')}
            style={DEVICE_SELECT_CONTAINER}
          >
            <View style={DEVICE_SELECT_TITLE}>
              <View style={DEVICE_SELECT_TITLE_ROW}>
                <Text text={selectedDevice.name} numberOfLines={1} style={DEVICE_SELECT_TITLE_TEXT} />
                <Text text={`0${selectedDevice.simNumber}`} style={DEVICE_SELECT_SIM_NUMBER} />
              </View>

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

            <Icon name="chevron-right-ltr" size={25} color={color.palette.white} />
          </Button>
        ) : null}

        {renderScreenContent()}

        <ConfirmModal
          titleText={rangeModalProps[selectedSliderModal].title}
          isVisible={isEditModalVisible}
          onClose={() => setEditModalVisible(false)}
          onConfirm={() => {
            rangeModalProps[selectedSliderModal].onConfirm()
            setEditModalVisible(false)
          }}
        >
          <View>
            <View style={{ alignSelf: 'center' }}>
              <Text text={rangeModalProps[selectedSliderModal].parseValues(sliderValues)}/>
              <MultiSlider
                values={sliderValues}
                min={rangeModalProps[selectedSliderModal].min}
                max={rangeModalProps[selectedSliderModal].max}
                step={rangeModalProps[selectedSliderModal].step}
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
