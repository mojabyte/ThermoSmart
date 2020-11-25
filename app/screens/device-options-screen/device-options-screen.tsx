import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { ScrollView, View, ViewStyle } from "react-native"
import { Button, ConfirmModal, Header, Icon, ListItem, Screen, Text, TextField } from "../../components"
import { useNavigation } from "@react-navigation/native"
import MultiSlider from '@ptomasroos/react-native-multi-slider'
import { useStores } from '../../models'
import { color, spacing } from "../../theme"
import { TextProps } from "../../components/text/text.props"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

const LIST_TITLE_CONTAINER: ViewStyle = {
  flex: 1,
  marginHorizontal: spacing[4],
  marginTop: spacing[3],
  borderBottomColor: color.palette.lightGrey,
  borderBottomWidth: 1
}

const ListTitle = function(props: TextProps) {
  return (
    <View style={LIST_TITLE_CONTAINER}>
      <Text {...props} />
    </View>
  )
}

export const DeviceOptionsScreen = observer(function DeviceOptionsScreen() {
  const navigation = useNavigation()

  const { devices, state: { selectedDeviceID } } = useStores()
  const selectedDevice = devices.get(selectedDeviceID)

  const [isIntervalModalVisible, setIntervalModalVisible] = useState(false)
  const [intervalEdit, setIntervalEdit] = useState<number>()
  const [intervalType, setIntervalType] = useState('simCredit')

  const [isSimModalVisible, setSimModalVisible] = useState(false)
  const [simCardChargeCode, setSimCardChargeCode] = useState<string>()
  const [simCardChargeError, setSimCardChargeError] = useState<string>()

  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordEdit, setPasswordEdit] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()

  useEffect(() => {
    if (isIntervalModalVisible) {
      if (intervalType === 'simCredit' &&
        !selectedDevice.status.getSimCreditSmsIntervalLoading) {
        setIntervalEdit(selectedDevice.simCreditSmsInterval)
      } else if (intervalType === 'powerOutage' &&
        !selectedDevice.status.getPowerOutageSmsIntervalLoading) {
        setIntervalEdit(selectedDevice.powerOutageSmsInterval)
      }
    }
  }, [
    isIntervalModalVisible,
    intervalType,
    selectedDevice.simCreditSmsInterval,
    selectedDevice.powerOutageSmsInterval,
    selectedDevice.status.getSimCreditSmsIntervalLoading,
    selectedDevice.status.getPowerOutageSmsIntervalLoading
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

      <ScrollView>
        <ListItem
          titleText="Phone Numbers"
          detailsText="View and edit saved phone numbers"
          rightIcon="chevron-right"
          leftIcon="card-account-phone"
          onPress={() => navigation.navigate('phones')}
        />

        <ListTitle text="SIM Card" />

        <ListItem
          titleText="Credit"
          detailsText="Remaining credit of the SIM card"
          rightIcon="refresh"
          leftIcon="sim"
          valueText={`${selectedDevice.simCharge} Rial`}
          onPress={() => {
            selectedDevice.getSimCharge()
          }}
        />

        <ListItem
          titleText="SMS Interval"
          detailsText="Interval of the remaining credit SMS"
          rightIcon="chevron-right"
          leftIcon="message-text-clock"
          valueText={`${selectedDevice.simCreditSmsInterval} day(s)`}
          onPress={() => {
            setIntervalType('simCredit')
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleText="Charge"
          detailsText="Charge the device SIM card"
          rightIcon="chevron-right"
          leftIcon="credit-card-plus"
          onPress={() => {
            setSimModalVisible(true)
          }}
        />

        <ListTitle text="Power Outage" />

        <ListItem
          titleText="SMS Interval"
          detailsText="Interval of warning SMS"
          rightIcon="chevron-right"
          leftIcon="message-text-clock"
          valueText={`${selectedDevice.powerOutageSmsInterval} minutes`}
          onPress={() => {
            setIntervalType('powerOutage')
            setIntervalEdit(selectedDevice.powerOutageSmsInterval)
            setIntervalModalVisible(true)
          }}
        />

        <ListTitle text="Sensor Calibration" />

        <ListItem
          titleText="Calibration Offset"
          detailsText="Calibration offset of thermometer"
          rightIcon="chevron-right"
          leftIcon="crosshairs"
          valueText={`${selectedDevice.calibration.toFixed(1)}°c`}
          onPress={() => {
            setIntervalType('powerOutage')
            setIntervalModalVisible(true)
          }}
        />

        <ListItem
          titleText="Change Password"
          rightIcon="chevron-right"
          leftIcon="key-change"
          onPress={() => {
            setPasswordEdit(selectedDevice.password)
            setPasswordModalVisible(true)
          }}
        />
      </ScrollView>

      <ConfirmModal
        title="Update Device Password"
        isVisible={isPasswordModalVisible}
        onClose={() => {
          setPasswordModalVisible(false)
          setPasswordError('')
        }}
        onConfirm={() => {
          if (passwordEdit.length < 6) {
            setPasswordError("deviceOptionsScreen.passwordLengthError")
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
            labelTx="deviceOptionsScreen.newPassword"
            placeholderTx="deviceOptionsScreen.passwordPlaceholder"
            errorTx={passwordError}
            value={passwordEdit}
            keyboardType="numeric"
            maxLength={6}
            onChange={e => setPasswordEdit(e.nativeEvent.text)}
          />
        </View>
      </ConfirmModal>

      <ConfirmModal
        title={'SIM Card Credit SMS Interval'}
        isVisible={isIntervalModalVisible}
        onClose={() => {
          setIntervalModalVisible(false)
        }}
        onConfirm={() => {
          if (intervalType === 'simCredit') {
            selectedDevice.updateSimCreditSmsInterval(intervalEdit)
          } else if (intervalType === 'powerOutage') {
            selectedDevice.updatePowerOutageSmsInterval(intervalEdit)
          }
          setIntervalModalVisible(false)
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Button
            preset="link"
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              if (intervalType === 'simCredit') {
                selectedDevice.getSimCreditSmsInterval()
              } else if (intervalType === 'powerOutage') {
                selectedDevice.getPowerOutageSmsInterval()
              }
            }}
          >
            <Icon name="refresh" containerStyle={{ marginEnd: spacing[2] }} />
            <Text text={`${intervalEdit} days`}/>
          </Button>
          <MultiSlider
            values={[intervalEdit]}
            min={1}
            max={99}
            step={1}
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
        title="Charge SIM Card"
        isVisible={isSimModalVisible}
        onClose={() => {
          setSimModalVisible(false)
          setSimCardChargeError('')
          setSimCardChargeCode(null)
        }}
        onConfirm={() => {
          if (!simCardChargeCode?.length) {
            setSimCardChargeError("deviceOptionsScreen.simCardChargeRequired")
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
            labelTx="deviceOptionsScreen.simCardChargeCode"
            placeholderTx="deviceOptionsScreen.simCardChargePlaceholder"
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
