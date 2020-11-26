import React from "react"
import { observer } from "mobx-react-lite"
import { FlatList, View, ViewStyle } from "react-native"
import { Header, ListItem, Screen } from "../../components"
import { useNavigation } from "@react-navigation/native"
import { useStores } from "../../models"
import { color, spacing } from "../../theme"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

const SEPARATOR: ViewStyle = {
  backgroundColor: color.palette.grey,
  marginHorizontal: spacing[4],
  height: 0.5
}

export const DeviceListScreen = observer(function DeviceListScreen() {
  const { devices, state: { selectedDeviceID, setSelectedDeviceID } } = useStores()

  const navigation = useNavigation()
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
        keyExtractor={item => item.value}
        renderItem={({ item }) => (
          <ListItem
            titleText={item.label}
            detailsText={item.details}
            valueText={item.value}
            onPress={() => {
              setSelectedDeviceID(item.value)
              navigation.goBack()
            }}
            onLongPress={() => devices.get(item.value)?.remove()}
            style={{
              backgroundColor: selectedDeviceID === item.value
                ? color.palette.offWhite
                : color.transparent
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={SEPARATOR} />}
      />
    </Screen>
  )
})
