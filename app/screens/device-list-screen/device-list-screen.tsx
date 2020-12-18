import React, { useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { FlatList, View, ViewStyle } from "react-native"
import { OptionsModal, Header, Icon, ListItem, Screen, Text } from "../../components"
import { useNavigation } from "@react-navigation/native"
import { Device, useStores } from "../../models"
import { color, spacing } from "../../theme"
import { toJS } from "mobx"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

const SEPARATOR: ViewStyle = {
  backgroundColor: color.palette.grey,
  marginHorizontal: spacing[4],
  height: 0.5
}

const STATUS_ICON_STYLE: ViewStyle = {
  marginHorizontal: spacing[1]
}

export const DeviceListScreen = observer(function DeviceListScreen() {
  const navigation = useNavigation()
  const { devices, state: { selectedDeviceID, setSelectedDeviceID } } = useStores()

  const [isOptionsModalVisible, setOptionsModalVisible] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device>(null)

  useEffect(() => {
    devices.items.forEach(device => {
      device.restoreFromMessages()
      device.subscribeForMessages()
    })
  }, [devices.items])

  return (
    <Screen style={ROOT}>
      <Header
        headerTx="deviceListScreen.title"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="plus"
        rightTx="deviceListScreen.rightHeader"
        onRightPress={() => navigation.navigate('add')}
      />

      <FlatList
        data={devices.listView}
        extraData={toJS(devices.items)}
        keyExtractor={item => item.value}
        renderItem={({ item }) => {
          const device = devices.get(item.value)
          return (
            <ListItem
              titleText={item.label}
              detailsText={item.details || ' '}
              onPress={() => {
                setSelectedDeviceID(item.value)
                setTimeout(() => navigation.navigate('main'))
              }}
              onLongPress={() => {
                setSelectedDevice(device)
                setOptionsModalVisible(true)
              }}
              style={{
                backgroundColor: selectedDeviceID === item.value
                  ? color.palette.greenLighter
                  : color.transparent
              }}
            >
              <View style={{ flexDirection: 'column' }}>
                <Text text={`0${item.value}`} />
                <View style={{ flexDirection: 'row-reverse', marginTop: spacing[1] }}>
                  <Text
                    text={`${device.temperaturesView[0]?.value.toFixed(1) ?? '---'}°c`}
                    style={{ width: 40 }}
                  />

                  {device.fanStatus
                    ? <Icon name="fan" containerStyle={STATUS_ICON_STYLE} />
                    : <Icon name="fan-off" containerStyle={STATUS_ICON_STYLE} />
                  }

                  {device.heaterStatus
                    ? <Icon name="radiator" containerStyle={STATUS_ICON_STYLE} />
                    : <Icon name="radiator-off" containerStyle={STATUS_ICON_STYLE} />
                  }

                  {!device.powerStatus &&
                    <Icon
                      name="power-plug-off"
                      color={color.palette.angry}
                      containerStyle={STATUS_ICON_STYLE}
                    />
                  }
                </View>
              </View>
            </ListItem>
          )
        }}
        ItemSeparatorComponent={() => <View style={SEPARATOR} />}
      />

      <OptionsModal
        isVisible={isOptionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        titleText={selectedDevice?.name}
        content={[
          {
            title: 'common.edit',
            icon: 'pencil',
            onPress: () => {
              setOptionsModalVisible(false)
              navigation.navigate('add', { selectedDeviceID: selectedDevice.simNumber })
            }
          },
          {
            title: 'common.remove',
            icon: 'trash-can',
            onPress: () => {
              setOptionsModalVisible(false)
              setTimeout(() => selectedDevice.remove(), 500)
            }
          }
        ]}
      />
    </Screen>
  )
})
