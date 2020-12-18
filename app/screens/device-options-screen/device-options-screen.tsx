import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, TextStyle, View, ViewStyle } from "react-native"
import { ConfirmModal, Header, Icon, ListItem, Screen, Text, TextField } from "../../components"
import { useNavigation } from "@react-navigation/native"
import MultiSlider from '@ptomasroos/react-native-multi-slider'
import moment from "moment-jalaali"
import BackgroundTimer from "react-native-background-timer"
import DatePicker from "react-native-date-picker"
import { WheelPicker } from "react-native-wheel-picker-android"
import { useStores } from '../../models'
import { color, spacing } from "../../theme"
import { TextProps } from "../../components/text/text.props"
import { translate } from "../../i18n"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

const LIST_TITLE_CONTAINER: ViewStyle = {
  flex: 1,
  marginHorizontal: spacing[4],
  marginTop: spacing[4],
  marginBottom: spacing[1]
}

const LIST_TITLE: TextStyle = {
  fontSize: 16,
  color: color.primary
}

const ListTitle = function(props: TextProps) {
  return (
    <View style={LIST_TITLE_CONTAINER}>
      <Text style={LIST_TITLE} {...props} />
    </View>
  )
}

export const Clock = (props: { initialTime?: number }): JSX.Element => {
  const {
    initialTime = +moment(),
    ...rest
  } = props

  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    setTime(initialTime)
    let timer = null
    const diff = (60 - moment(initialTime).seconds()) * 1000
    const timeout = BackgroundTimer.setTimeout(() => {
      setTime(time => time + diff)
      timer = BackgroundTimer.setInterval(() => {
        setTime(time => time + 60000)
      }, 60000)
    }, diff)

    return () => {
      BackgroundTimer.clearTimeout(timeout)
      BackgroundTimer.clearInterval(timer)
    }
  }, [initialTime])

  return <Text text={moment(time).utc().format('HH:mm')} {...rest}/>
}

export const DeviceOptionsScreen = observer(function DeviceOptionsScreen() {
  const navigation = useNavigation()

  const { devices, state: { selectedDeviceID } } = useStores()
  const selectedDevice = devices.get(selectedDeviceID)

  const [isClockModalVisible, setClockModalVisible] = useState(false)
  const [clockTime, setClockTime] = useState(new Date())

  const [isIntervalModalVisible, setIntervalModalVisible] = useState(false)
  const [intervalEdit, setIntervalEdit] = useState<number>(0)
  const [intervalType, setIntervalType] = useState('simCredit')

  const rangeModalProps = {
    report: {
      title: 'deviceOptionsScreen.sms.report.modalTitle',
      titleIcon: 'clipboard-text',
      data: [...Array(120)].map((_, i) => `${i + 1}`),
      value: selectedDevice.reportSmsInterval / 60 - 1,
      loading: selectedDevice.state.reportSmsIntervalLoading,
      onConfirm: () => {
        selectedDevice.updateReportSmsInterval((intervalEdit + 1) * 60)
      },
      onRefresh: () => {
        selectedDevice.getReportSmsInterval()
      },
      parseValue: () => translate('common.hour_s')
    },
    simCredit: {
      title: 'deviceOptionsScreen.sms.sim.modalTitle',
      titleIcon: 'sim',
      data: [...Array(30)].map((_, i) => `${i + 1}`),
      value: selectedDevice.simCreditSmsInterval - 1,
      loading: selectedDevice.state.getSimCreditSmsIntervalLoading,
      onConfirm: () => {
        selectedDevice.updateSimCreditSmsInterval(intervalEdit + 1)
      },
      onRefresh: () => {
        selectedDevice.getSimCreditSmsInterval()
      },
      parseValue: () => translate('common.day_s')
    },
    powerOutage: {
      title: 'deviceOptionsScreen.sms.powerOutage.modalTitle',
      titleIcon: 'power-plug-off',
      data: [...Array(116)].map((_, i) => `${i + 5}`),
      value: selectedDevice.powerOutageSmsInterval - 5,
      loading: selectedDevice.state.getPowerOutageSmsIntervalLoading,
      onConfirm: () => {
        selectedDevice.updatePowerOutageSmsInterval(intervalEdit + 5)
      },
      onRefresh: () => {
        selectedDevice.getPowerOutageSmsInterval()
      },
      parseValue: () => translate('common.minute_s')
    },
    alarm: {
      title: 'deviceOptionsScreen.sms.alarm.modalTitle',
      titleIcon: 'alarm',
      data: [...Array(116)].map((_, i) => `${i + 5}`),
      value: selectedDevice.alarm.interval - 5,
      loading: selectedDevice.state.updateAlarmIntervalLoading,
      onConfirm: () => {
        selectedDevice.updateAlarmInterval(intervalEdit + 5)
      },
      onRefresh: () => {
        selectedDevice.getAlarmInterval()
      },
      parseValue: () => translate('common.minute_s')
    },
    calibration: {
      title: 'deviceOptionsScreen.calibration.title',
      titleIcon: 'crosshairs',
      min: -10,
      max: 10,
      step: 0.1,
      value: selectedDevice.calibration,
      loading: selectedDevice.state.getCalibrationLoading,
      onConfirm: () => {
        selectedDevice.updateCalibration(intervalEdit)
      },
      onRefresh: () => {
        selectedDevice.getCalibration()
      },
      parseValue: (value: number) => `${value.toFixed(1)}°c`
    }
  }

  const [isSimModalVisible, setSimModalVisible] = useState(false)
  const [simCardChargeCode, setSimCardChargeCode] = useState<string>()
  const [simCardChargeError, setSimCardChargeError] = useState<string>()

  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordEdit, setPasswordEdit] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()

  return (
    <Screen preset="scroll" style={ROOT}>
      <Header
        headerText={selectedDevice.name}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="pencil"
        rightTx="deviceOptionsScreen.rightHeader"
        onRightPress={() => navigation.navigate('add', { selectedDeviceID })}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing[4] }}>
        <ListItem
          titleTx="deviceOptionsScreen.phoneNumbers"
          detailsTx="deviceOptionsScreen.phoneNumbersDetails"
          rightIcon="chevron-right-ltr"
          leftIcon="card-account-phone"
          onPress={() => navigation.navigate('phones')}
        />

        <ListItem
          titleTx="deviceOptionsScreen.password.change"
          loading={selectedDevice.state.updatePasswordLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="key-change"
          onPress={() => setPasswordModalVisible(true)}
        />

        <ListItem
          titleTx="deviceOptionsScreen.clock.title"
          detailsTx="deviceOptionsScreen.clock.details"
          loading={selectedDevice.state.clockLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="clock"
          onPress={() => {
            setClockModalVisible(true)
          }}
        >
          {selectedDevice.clock.setTime
            ? <Clock initialTime={selectedDevice.getClockNow()}/>
            : <Text text="---" />
          }
        </ListItem>

        <ListItem
          titleTx="common.sync"
          loading={selectedDevice.state.syncing}
          valueText={moment(selectedDevice.syncDate).format('jYYYY/jMM/jDD HH:mm')}
          leftIcon="sync-circle"
          rightIcon="sync"
          onPress={() => selectedDevice.restoreFromMessages(0)}
        />

        <ListTitle tx="deviceOptionsScreen.sms.title" />

        <ListItem
          titleTx="deviceOptionsScreen.sms.report.title"
          detailsTx="deviceOptionsScreen.sms.report.details"
          loading={selectedDevice.state.reportSmsIntervalLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="clipboard-text"
          valueText={translate(
            'deviceOptionsScreen.sms.report.value',
            { interval: selectedDevice.reportSmsInterval / 60 }
          )}
          onPress={() => {
            setIntervalType('report')
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleTx="deviceOptionsScreen.sms.powerOutage.title"
          detailsTx="deviceOptionsScreen.sms.powerOutage.details"
          loading={selectedDevice.state.getPowerOutageSmsIntervalLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="power-plug-off"
          valueText={translate(
            'deviceOptionsScreen.sms.powerOutage.value',
            { interval: selectedDevice.powerOutageSmsInterval }
          )}
          onPress={() => {
            setIntervalType('powerOutage')
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleTx="deviceOptionsScreen.sms.sim.title"
          detailsTx="deviceOptionsScreen.sms.sim.details"
          loading={selectedDevice.state.getSimCreditSmsIntervalLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="sim"
          valueText={translate(
            'deviceOptionsScreen.sms.sim.value',
            { interval: selectedDevice.simCreditSmsInterval }
          )}
          onPress={() => {
            setIntervalType('simCredit')
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleTx="deviceOptionsScreen.sms.alarm.title"
          detailsTx="deviceOptionsScreen.sms.alarm.details"
          loading={selectedDevice.state.updateAlarmIntervalLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="alarm"
          valueText={translate(
            'deviceOptionsScreen.sms.alarm.value',
            { interval: selectedDevice.alarm.interval }
          )}
          onPress={() => {
            setIntervalType('alarm')
            setIntervalModalVisible(true)
          }}
        />

        <ListTitle tx="deviceOptionsScreen.simCard.title" />

        <ListItem
          titleTx="deviceOptionsScreen.simCard.credit"
          detailsTx="deviceOptionsScreen.simCard.creditDetails"
          loading={selectedDevice.state.getSimCreditLoading}
          rightIcon="refresh"
          leftIcon="sim"
          onPress={selectedDevice.getSimCredit}
        >
          <View style={{ flexDirection: 'row' }}>
            <Text text={`${selectedDevice.simCharge}`} />
            <Icon name="currency-rial" containerStyle={{ marginHorizontal: spacing[1] }} />
          </View>
        </ListItem>

        <ListItem
          titleTx="deviceOptionsScreen.simCard.charge"
          detailsTx="deviceOptionsScreen.simCard.chargeDetails"
          rightIcon="chevron-right-ltr"
          leftIcon="credit-card-plus"
          onPress={() => setSimModalVisible(true)}
        />

        <ListTitle tx="deviceOptionsScreen.calibration.title" />

        <ListItem
          titleTx="deviceOptionsScreen.calibration.offset"
          detailsTx="deviceOptionsScreen.calibration.offsetDetails"
          loading={selectedDevice.state.getCalibrationLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="crosshairs"
          valueText={`${selectedDevice.calibration.toFixed(1)}°c`}
          onPress={() => {
            setIntervalType('calibration')
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleTx="deviceOptionsScreen.calibration.reset"
          detailsTx="deviceOptionsScreen.calibration.resetDetails"
          loading={selectedDevice.state.resetCalibrationLoading}
          leftIcon="reload"
          onPress={selectedDevice.resetCalibration}
        />
      </ScrollView>

      <ConfirmModal
        titleTx="deviceOptionsScreen.password.change"
        titleIcon="key-change"
        isVisible={isPasswordModalVisible}
        onInit={() => setPasswordEdit(selectedDevice.password)}
        onClose={() => {
          setPasswordModalVisible(false)
          setPasswordError('')
        }}
        onConfirm={() => {
          if (passwordEdit.length < 6) {
            setPasswordError("deviceOptionsScreen.password.lengthError")
          } else {
            setPasswordError('')
            if (passwordEdit !== selectedDevice.password) {
              selectedDevice.updatePassword(passwordEdit)
            }
            setPasswordModalVisible(false)
          }
        }}
      >
        <View>
          <TextField
            labelTx="deviceOptionsScreen.password.password"
            placeholderTx="deviceOptionsScreen.password.placeholder"
            errorTx={passwordError}
            value={passwordEdit}
            keyboardType="numeric"
            maxLength={6}
            onChange={e => setPasswordEdit(e.nativeEvent.text)}
          />
        </View>
      </ConfirmModal>

      <ConfirmModal
        titleTx="deviceOptionsScreen.clock.details"
        titleIcon="clock"
        leftTitleTx="common.update"
        leftIcon="refresh"
        onLeftPress={() => selectedDevice.getClock()}
        loading={selectedDevice.state.clockLoading}
        isVisible={isClockModalVisible}
        onInit={() => setClockTime(new Date(selectedDevice.getClockNow()))}
        onClose={() => setClockModalVisible(false)}
        onConfirm={() => {
          const time = moment(clockTime).utc()
          selectedDevice.updateClock({
            hours: time.hours(),
            minutes: time.minutes()
          })
          setClockModalVisible(false)
        }}
      >
        <DatePicker
          date={clockTime}
          onDateChange={setClockTime}
          mode="time"
          androidVariant="nativeAndroid"
          timeZoneOffsetInMinutes={0}
          style={{ alignSelf: 'center' }}
        />
      </ConfirmModal>

      <ConfirmModal
        titleTx={rangeModalProps[intervalType].title}
        titleIcon={rangeModalProps[intervalType].titleIcon}
        leftTitleTx="common.update"
        leftIcon="refresh"
        onLeftPress={rangeModalProps[intervalType].onRefresh}
        loading={rangeModalProps[intervalType].loading}
        isVisible={isIntervalModalVisible}
        onInit={() => setIntervalEdit(rangeModalProps[intervalType].value)}
        onClose={() => {
          setIntervalModalVisible(false)
        }}
        onConfirm={() => {
          rangeModalProps[intervalType].onConfirm()
          setIntervalModalVisible(false)
        }}
      >
        {intervalType === 'calibration'
          ? <View style={{ alignItems: 'center' }}>
              <Text text={rangeModalProps[intervalType].parseValue(intervalEdit)} />
              <MultiSlider
                values={[intervalEdit]}
                min={rangeModalProps[intervalType].min}
                max={rangeModalProps[intervalType].max}
                step={rangeModalProps[intervalType].step}
                snapped
                onValuesChange={values => setIntervalEdit(values[0])}
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
          : <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
              <Text tx="common.every" />
              <WheelPicker
                selectedItem={intervalEdit}
                data={rangeModalProps[intervalType].data}
                onItemSelected={item => setIntervalEdit(item)}
                style={{ width: 50, height: 120 }}
              />
              <Text text={rangeModalProps[intervalType].parseValue(intervalEdit)} />
            </View>
          }
      </ConfirmModal>

      <ConfirmModal
        titleTx="deviceOptionsScreen.simCard.chargeModalTitle"
        titleIcon="credit-card-plus"
        isVisible={isSimModalVisible}
        onClose={() => {
          setSimModalVisible(false)
          setSimCardChargeError('')
          setSimCardChargeCode(null)
        }}
        onConfirm={() => {
          if (!simCardChargeCode?.length) {
            setSimCardChargeError("deviceOptionsScreen.simCard.chargeRequired")
          } else {
            setSimCardChargeError('')
            selectedDevice.sendSimChargeCode(simCardChargeCode)
            setSimModalVisible(false)
            setSimCardChargeCode(null)
          }
        }}
      >
        <View>
          <TextField
            labelTx="deviceOptionsScreen.simCard.chargeCode"
            placeholderTx="deviceOptionsScreen.simCard.chargePlaceholder"
            errorTx={simCardChargeError}
            value={simCardChargeCode}
            keyboardType="numeric"
            onChange={e => setSimCardChargeCode(e.nativeEvent.text)}
          />
        </View>
      </ConfirmModal>
    </Screen>
  )
})
