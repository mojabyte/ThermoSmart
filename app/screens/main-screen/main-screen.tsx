import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Linking,
  PermissionsAndroid,
  TextStyle,
  ToastAndroid,
  View,
  ViewStyle
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import moment from "moment-jalaali"
import Modal from 'react-native-modal'
import SharedPreferences from 'react-native-shared-preferences';
import {
  Button,
  Clock,
  ConfirmModal,
  Header,
  Icon,
  NumberPicker,
  Screen,
  Switch,
  Text
} from "../../components"
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

const SYNCING_TEXT: TextStyle = {
  fontSize: 24,
  color: color.palette.white,
  margin: spacing[2]
}

const getTimeFormat = (ts: number) => {
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

  const {
    devices,
    state: {
      selectedDeviceID,
      setSelectedDeviceID,
      selectedSimSlot,
      setSelectedSimSlot
    }
  } = useStores()

  const [smsPermissionGranted, setSmsPermission] = useState(false)

  useEffect(() => {
    const requestPermission = () => {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      ])
        .then(resultsObject => {
          const results = Object.values(resultsObject)
          if (results.every(result => result === 'granted')) {
            setSmsPermission(true)
          } else {
            setSmsPermission(false)
            Alert.alert(
              'اجازه‌ی دسترسی به پیام‌ها و لیست مخاطبین',
              'این برنامه بدون اجازه‌ی دسترسی به پیام‌ها و لیست مخاطبین کار نمی‌کند.',
              [{
                text: "OK",
                onPress: () => {
                  if (results.some(result => result === 'denied')) {
                    requestPermission()
                  } else if (results.some(result => result === 'never_ask_again')) {
                    Alert.alert(
                      'اجازه‌ی دسترسی به پیام‌ها و لیست مخاطبین',
                      'لطفاً برای ادامه به قسمت Permissions در تنظیمات برنامه بروید و اجازه‌ی دسترسی SMS و Contacts را به برنامه بدهید.',
                      [{
                        text: "OK",
                        onPress: () => {
                          Linking.openSettings()
                          setTimeout(() => requestPermission(), 10)
                        }
                      }]
                    )
                  }
                }
              }],
              { cancelable: false }
            )
          }
        })
    }

    requestPermission()
  }, [])

  // TODO: better implementation for selecting sim slot in sms service
  useEffect(() => setSelectedSimSlot(selectedSimSlot), [selectedSimSlot, setSelectedSimSlot])

  const [selectedDevice, setSelectedDevice] = useState<Device>(devices.get(selectedDeviceID))
  const [isEditModalVisible, setEditModalVisible] = useState(false)
  const [editModalValues, setEditModalValues] = useState({ value1: 0, value2: 0 })
  const [selectedSliderModal, setSelectedSliderModal] = useState<'max' | 'nor' | 'min' | 'high' | 'low'>('max')

  useEffect(() => {
    setSelectedDevice(devices.get(selectedDeviceID))
    const alarms = [{ name: selectedDeviceID || 'empty' }]
    SharedPreferences.setName('preferences')
    SharedPreferences.setItem('alarms', JSON.stringify(alarms))
  }, [devices, selectedDeviceID])

  useEffect(() => {
    if (devices.items.length > 0) {
      if (!devices.get(selectedDeviceID)) {
        setSelectedDeviceID(devices.items[0].simNumber)
      }
    } else {
      setSelectedDeviceID(null)
      if (!devices.imported && smsPermissionGranted) {
        devices.importFromMessages()
      }
    }
  }, [devices, devices.items.length, selectedDeviceID, setSelectedDeviceID, smsPermissionGranted])

  useEffect(() => {
    if (selectedDevice) {
      if (smsPermissionGranted) {
        selectedDevice.restoreFromMessages()
        selectedDevice.subscribeForMessages()
      }
    }
  }, [selectedDevice, smsPermissionGranted])

  const rangeModalTempProps = {
    min: 0,
    max: 50
  }

  const rangeModalThermoProps = {
    title: translate(
      'mainScreen.thermostatModal.title',
      ({ type: translate(`mainScreen.thermostatModal.${selectedSliderModal}`) })
    ),
    titleIcon: 'thermostat'
  }

  const rangeModalAlarmProps = {
    title: translate(
      'mainScreen.alarmModal.title',
      ({ type: translate(`mainScreen.alarmModal.${selectedSliderModal}`) })
    ),
    titleIcon: 'alarm'
  }

  const rangeModalProps = {
    max: {
      ...rangeModalTempProps,
      ...rangeModalThermoProps,
      onInit: () => setEditModalValues({
        ...editModalValues,
        value1: selectedDevice.thermostat.max ?? 0
      }),
      onConfirm: () => selectedDevice.updateThermostatMaxValue(editModalValues.value1)
    },
    nor: {
      ...rangeModalTempProps,
      ...rangeModalThermoProps,
      onInit: () => setEditModalValues({
        ...editModalValues,
        value1: selectedDevice.thermostat.nor ?? 0
      }),
      onConfirm: () => selectedDevice.updateThermostatNorValue(editModalValues.value1)
    },
    min: {
      ...rangeModalTempProps,
      ...rangeModalThermoProps,
      onInit: () => setEditModalValues({
        ...editModalValues,
        value1: selectedDevice.thermostat.min ?? 0
      }),
      onConfirm: () => selectedDevice.updateThermostatMinValue(editModalValues.value1)
    },
    high: {
      ...rangeModalTempProps,
      ...rangeModalAlarmProps,
      onInit: () => {
        setEditModalValues({
          ...editModalValues,
          value1: selectedDevice.alarm.high[0] ?? 30,
          value2: selectedDevice.alarm.high[1] ?? 40
        })
      },
      onConfirm: () => selectedDevice.updateAlarmHigh([
        editModalValues.value1,
        editModalValues.value2
      ]),
      valueTitle1: 'common.normal',
      valueTitle2: 'common.critical'
    },
    low: {
      ...rangeModalTempProps,
      ...rangeModalAlarmProps,
      onInit: () => setEditModalValues({
        ...editModalValues,
        value1: selectedDevice.alarm.low[0] ?? 10,
        value2: selectedDevice.alarm.low[1] ?? 20
      }),
      onConfirm: () => selectedDevice.updateAlarmLow([
        editModalValues.value1,
        editModalValues.value2
      ]),
      valueTitle1: 'common.critical',
      valueTitle2: 'common.normal'
    }
  }

  const renderSignalIcon = (): React.ReactNode => {
    if (selectedDevice) {
      if (selectedDevice.signalStrength < 25) {
        return <Icon name="signal-off" size={30} />
      } else if (selectedDevice.signalStrength < 50) {
        return <Icon name="signal-cellular-outline" size={30} />
      } else if (selectedDevice.signalStrength < 75) {
        return <Icon name="signal-cellular-1" size={30} />
      } else if (selectedDevice.signalStrength < 100) {
        return <Icon name="signal-cellular-2" size={30} />
      }
      return <Icon name="signal-cellular-3" size={30} />
    }
    return <Icon name="signal-off" size={30} />
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
                containerStyle={{ flex: 0.5 }}
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
                containerStyle={{ flex: 0.5 }}
                contentStyle={{ justifyContent: 'space-evenly', alignItems: 'flex-start' }}
              >
                <View style={{ flex: 0.5, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Button
                    preset="card"
                    onPress={() => selectedDevice.getSimCredit()}
                    loading={selectedDevice.state.getSimCreditLoading}
                    style={{ flex: 0.5, flexDirection: 'row', margin: spacing[1] }}
                  >
                    <Text text={`${selectedDevice.simCharge ?? '---'}`}/>
                    <Icon name="currency-rial" containerStyle={{ marginHorizontal: spacing[1] }} />
                  </Button>

                  <Button
                    preset="card"
                    onPress={() => selectedDevice.getSignalStrength()}
                    loading={selectedDevice.state.getSignalStrengthLoading}
                    style={{ flex: 0.5, margin: spacing[1] }}
                  >
                    {renderSignalIcon()}
                  </Button>
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flexDirection: 'row', width: 50 }}>
                    <Icon name="clock" containerStyle={{ marginStart: spacing[2], marginEnd: spacing[1] }} />
                    {selectedDevice.clock.setTime
                      ? <Clock initialTime={selectedDevice.getClockNow()}/>
                      : <Text text='--:--' />
                    }
                  </View>

                  {!selectedDevice.powerStatus &&
                    <>
                      <Icon
                        name="power-plug-off"
                        color={color.palette.angry}
                        containerStyle={{ marginStart: spacing[2], marginEnd: spacing[1] }}
                      />
                      <Text tx="mainScreen.statusCard.powerDisconnected" style={{ fontSize: 12 }} />
                    </>
                  }
                </View>
              </Card>
            </View>

            <View style={{ flex: 0.4, flexDirection: 'column' }}>
              <Card
                title="mainScreen.thermostatCard.title"
                titleIcon="thermostat"
                loading={selectedDevice.state.getThermostatValuesLoading}
                onRefresh={() => selectedDevice.getThermostatValues()}
                containerStyle={{ flex: 0.5 }}
              >
                <Button
                  preset="card"
                  onPress={() => {
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
                containerStyle={{ flex: 0.5 }}
              >
                <Button
                  preset="card"
                  onPress={() => {
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
          leftIcon={selectedSimSlot === 0
            ? 'numeric-1-box-outline'
            : selectedSimSlot === 1
              ? 'numeric-2-box-outline'
              : 'alpha-d-box-outline'
          }
          onLeftPress={() => {
            if (selectedSimSlot === 0) {
              setSelectedSimSlot(1)
            } else if (selectedSimSlot === 1) {
              setSelectedSimSlot(null)
            } else {
              setSelectedSimSlot(0)
            }
          }}
          rightIcon="plus"
          onRightPress={() => navigation.navigate('add')}
        />
        {(devices.items.length > 0 && selectedDevice?.simNumber) && (
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
        )}

        {renderScreenContent()}

        <Modal
          isVisible={selectedDevice?.state.syncing || !devices.imported}
          animationInTiming={1000}
          animationOutTiming={1000}
          animationIn="fadeIn"
          animationOut="fadeOut"
          style={{ alignItems: 'center' }}
        >
          <ActivityIndicator color={color.palette.white} size="large" />
          <Text tx="common.syncing" style={SYNCING_TEXT} />
        </Modal>

        <ConfirmModal
          titleText={rangeModalProps[selectedSliderModal].title}
          isVisible={isEditModalVisible}
          onInit={rangeModalProps[selectedSliderModal].onInit}
          onClose={() => {
            setEditModalVisible(false)
            setEditModalValues({ ...editModalValues, value1: 0, value2: 0 })
          }}
          onConfirm={() => {
            rangeModalProps[selectedSliderModal].onConfirm()
            setEditModalVisible(false)
          }}
        >
          <View>
            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
              <View style={{ alignItems: 'center', marginHorizontal: spacing[4] }}>
                <NumberPicker
                  value={editModalValues.value1}
                  min={rangeModalProps[selectedSliderModal].min}
                  max={rangeModalProps[selectedSliderModal].max}
                  postfix="°c"
                  onSelect={value => setEditModalValues({ ...editModalValues, value1: value })}
                />
                {['high', 'low'].includes(selectedSliderModal) && (
                  <Text tx={rangeModalProps[selectedSliderModal].valueTitle1} />
                )}
              </View>

              {['high', 'low'].includes(selectedSliderModal) && (
                <View style={{ alignItems: 'center', marginHorizontal: spacing[4] }}>
                  <NumberPicker
                    value={editModalValues.value2}
                    min={rangeModalProps[selectedSliderModal].min}
                    max={rangeModalProps[selectedSliderModal].max}
                    postfix="°c"
                    onSelect={value => setEditModalValues({ ...editModalValues, value2: value })}
                  />
                  <Text tx={rangeModalProps[selectedSliderModal].valueTitle2} />
                </View>
              )}
            </View>
          </View>
        </ConfirmModal>
      </Screen>
    </View>
  )
})
