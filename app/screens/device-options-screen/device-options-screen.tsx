import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, TextStyle, View, ViewStyle } from "react-native"
import { Button, ConfirmModal, Header, Icon, ListItem, Screen, Text, TextField } from "../../components"
import { useNavigation } from "@react-navigation/native"
import MultiSlider from '@ptomasroos/react-native-multi-slider'
import moment from "moment-jalaali"
import BackgroundTimer from "react-native-background-timer"
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

  const [isIntervalModalVisible, setIntervalModalVisible] = useState(false)
  const [intervalEdit, setIntervalEdit] = useState<number>()
  const [intervalType, setIntervalType] = useState('simCredit')

  const rangeModalProps = {
    report: {
      title: 'deviceOptionsScreen.report.smsIntervalModalTitle',
      titleIcon: 'message-text-clock',
      min: 60,
      max: 7200,
      step: 60,
      onConfirm: () => {
        selectedDevice.updateReportSmsInterval(intervalEdit)
      },
      onRefresh: () => {
        selectedDevice.getReportSmsInterval()
      },
      parseValue: (value: number) => translate(
        'deviceOptionsScreen.report.smsIntervalValue',
        { interval: value / 60 }
      )
    },
    simCredit: {
      title: 'deviceOptionsScreen.simCard.smsIntervalModalTitle',
      titleIcon: 'message-text-clock',
      min: 1,
      max: 31,
      step: 1,
      onConfirm: () => {
        selectedDevice.updateSimCreditSmsInterval(intervalEdit)
      },
      onRefresh: () => {
        selectedDevice.getSimCreditSmsInterval()
      },
      parseValue: (value: number) => translate(
        'deviceOptionsScreen.simCard.smsIntervalValue',
        { interval: value }
      )
    },
    powerOutage: {
      title: 'deviceOptionsScreen.powerOutage.smsIntervalModalTitle',
      titleIcon: 'message-text-clock',
      min: 5,
      max: 121,
      step: 1,
      onConfirm: () => {
        selectedDevice.updatePowerOutageSmsInterval(intervalEdit)
      },
      onRefresh: () => {
        selectedDevice.getPowerOutageSmsInterval()
      },
      parseValue: (value: number) => translate(
        'deviceOptionsScreen.powerOutage.smsIntervalValue',
        { interval: value }
      )
    },
    calibration: {
      title: 'deviceOptionsScreen.calibration.title',
      titleIcon: 'crosshairs',
      min: -10,
      max: 10,
      step: 0.1,
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

  useEffect(() => {
    if (isIntervalModalVisible) {
      if (intervalType === 'simCredit' &&
        !selectedDevice.state.getSimCreditSmsIntervalLoading) {
        setIntervalEdit(selectedDevice.simCreditSmsInterval)
      } else if (intervalType === 'powerOutage' &&
        !selectedDevice.state.getPowerOutageSmsIntervalLoading) {
        setIntervalEdit(selectedDevice.powerOutageSmsInterval)
      }
    }
  }, [
    isIntervalModalVisible,
    intervalType,
    selectedDevice.simCreditSmsInterval,
    selectedDevice.powerOutageSmsInterval,
    selectedDevice.state.getSimCreditSmsIntervalLoading,
    selectedDevice.state.getPowerOutageSmsIntervalLoading
  ])

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
          onPress={() => {
            setPasswordEdit(selectedDevice.password)
            setPasswordModalVisible(true)
          }}
        />

        <ListItem
          titleTx="deviceOptionsScreen.clock.title"
          detailsTx="deviceOptionsScreen.clock.details"
          loading={selectedDevice.state.clockLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="clock"
          onPress={() => {
            // selectedDevice.getClock()
            selectedDevice.updateClock(selectedDevice.clock)
            // setIntervalType('report')
            // setIntervalEdit(selectedDevice.reportSmsInterval)
            // setIntervalModalVisible(true)
          }}
        >
          {selectedDevice.clock.setTime
            ? <Clock
                initialTime={+moment().subtract(selectedDevice.clock.setTime)
                  .add(selectedDevice.clock.hours, 'hours')
                  .add(selectedDevice.clock.minutes, 'minutes')
                  .utc()}
              />
            : <Text text="---" />
          }
        </ListItem>

        <ListItem
          titleText="Sync"
          // loading={selectedDevice.state.updatePasswordLoading}
          valueText={moment(selectedDevice.syncDate).format('jYYYY/jMM/jDD HH:mm')}
          leftIcon="sync-circle"
          rightIcon="refresh"
          onPress={() => {
            selectedDevice.restoreFromMessages(0)
          }}
        />

        <ListTitle tx="deviceOptionsScreen.report.title" />

        <ListItem
          titleTx="deviceOptionsScreen.report.smsInterval"
          detailsTx="deviceOptionsScreen.report.smsIntervalDetails"
          loading={selectedDevice.state.reportSmsIntervalLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="message-text-clock"
          valueText={translate(
            'deviceOptionsScreen.report.smsIntervalValue',
            { interval: selectedDevice.reportSmsInterval / 60 }
          )}
          onPress={() => {
            setIntervalType('report')
            setIntervalEdit(selectedDevice.reportSmsInterval)
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
          onPress={() => {
            selectedDevice.getSimCredit()
          }}
        >
          <View style={{ flexDirection: 'row' }}>
            <Text text={`${selectedDevice.simCharge}`} />
            <Icon name="currency-rial" containerStyle={{ marginHorizontal: spacing[1] }} />
          </View>
        </ListItem>

        <ListItem
          titleTx="deviceOptionsScreen.simCard.smsInterval"
          detailsTx="deviceOptionsScreen.simCard.smsIntervalDetails"
          loading={selectedDevice.state.getSimCreditSmsIntervalLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="message-text-clock"
          valueText={translate(
            'deviceOptionsScreen.simCard.smsIntervalValue',
            { interval: selectedDevice.simCreditSmsInterval }
          )}
          onPress={() => {
            setIntervalType('simCredit')
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleTx="deviceOptionsScreen.simCard.charge"
          detailsTx="deviceOptionsScreen.simCard.chargeDetails"
          rightIcon="chevron-right-ltr"
          leftIcon="credit-card-plus"
          onPress={() => {
            setSimModalVisible(true)
          }}
        />

        <ListTitle tx="deviceOptionsScreen.powerOutage.title" />

        <ListItem
          titleTx="deviceOptionsScreen.powerOutage.smsInterval"
          detailsTx="deviceOptionsScreen.powerOutage.smsIntervalDetails"
          loading={selectedDevice.state.getPowerOutageSmsIntervalLoading}
          rightIcon="chevron-right-ltr"
          leftIcon="message-text-clock"
          valueText={translate(
            'deviceOptionsScreen.powerOutage.smsIntervalValue',
            { interval: selectedDevice.powerOutageSmsInterval }
          )}
          onPress={() => {
            setIntervalType('powerOutage')
            setIntervalEdit(selectedDevice.powerOutageSmsInterval)
            setIntervalModalVisible(true)
          }}
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
            setIntervalEdit(selectedDevice.calibration)
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleTx="deviceOptionsScreen.calibration.reset"
          detailsTx="deviceOptionsScreen.calibration.resetDetails"
          loading={selectedDevice.state.resetCalibrationLoading}
          leftIcon="reload"
          onPress={() => {
            selectedDevice.resetCalibration()
          }}
        />
      </ScrollView>

      <ConfirmModal
        titleTx="deviceOptionsScreen.password.change"
        titleIcon="key-change"
        isVisible={isPasswordModalVisible}
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
        titleTx={rangeModalProps[intervalType].title}
        titleIcon={rangeModalProps[intervalType].titleIcon}
        isVisible={isIntervalModalVisible}
        onClose={() => {
          setIntervalModalVisible(false)
        }}
        onConfirm={() => {
          rangeModalProps[intervalType].onConfirm()
          setIntervalModalVisible(false)
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Button
            preset="link"
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={rangeModalProps[intervalType].onRefresh}
          >
            <Icon name="refresh" containerStyle={{ marginEnd: spacing[2] }} />
            <Text
              text={rangeModalProps[intervalType].parseValue(intervalEdit)}
            />
          </Button>
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
