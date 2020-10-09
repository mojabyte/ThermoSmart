import React, { useEffect } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import { Header, Icon, Picker, Screen, Text } from "../../components"
import { color, spacing, typography } from "../../theme"
import { useStores } from '../../models'

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
  paddingTop: spacing[3],
  paddingBottom: spacing[4] + spacing[1]
}
const HEADER_TITLE: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 12,
  lineHeight: 15,
  textAlign: "center",
  letterSpacing: 1.5,
}

const styles = {
  pickerContainer: {
    height: 65,
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: '7%',
    paddingRight: '15%',
    paddingVertical: 5
  },
  pickerBorder: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: '7%',
    right: '7%',
    height: 0.5,
    backgroundColor: '#888'
  },
  pickerIcon: {
    width: 60,
    textAlign: 'left'
  },
  pickerLabelContainer: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'space-around'
  },
  pickerTextStyle: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'left'
  },
  pickerDetailsStyle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.75,
    textAlign: 'left'
  }
}

export const MainScreen = observer(function MainScreen() {
  const navigation = useNavigation()

  const { devices, state: { selectedDeviceID, setSelectedDeviceID } } = useStores()

  useEffect(() => {
    if (devices.items.length > 0 && !devices.get(selectedDeviceID)) {
      setSelectedDeviceID(devices.items[0].simNumber)
    }
  }, [devices, devices.items.length, selectedDeviceID, setSelectedDeviceID])

  const selectedDevice = devices.get(selectedDeviceID)

  const renderScreenContent = function () {
    return (
      <>
        <Text text={selectedDevice.name} />
        <Text text={selectedDevice.place} />
        <Text text={selectedDevice.simNumber} />
      </>
    )
  }

  return (
    <View style={FULL}>
      <Screen style={CONTAINER} preset="scroll" backgroundColor={color.transparent}>
        <Header
          headerTx="mainScreen.title"
          leftIcon="cog"
          onLeftPress={() => devices.items[0]?.remove()}
          rightIcon="plus"
          onRightPress={() => navigation.navigate('add')}
          style={HEADER}
          titleStyle={HEADER_TITLE}
        />
        {devices.listView.length > 0 && selectedDevice
          ? (
            <Picker
              items={devices.listView.filter(({ value }) => value !== selectedDeviceID)}
              onItemSelect={item => setSelectedDeviceID(item)}
              triggerComponent={(
                <View style={styles.pickerContainer}>
                  <Icon name='chip' size={30} color='white' containerStyle={styles.pickerIcon} />

                  <View style={styles.pickerLabelContainer}>
                    <Text
                      style={styles.pickerTextStyle}
                      numberOfLines={1}
                    >
                      {selectedDevice.name}
                    </Text>

                    {/* { devicesById?.[selectedDevice]?.additionalInfo?.place
                        ? <Text
                            style={styles.pickerDetailsStyle}
                            numberOfLines={1}
                        >
                            {devicesById?.[selectedDevice]?.additionalInfo?.place}
                        </Text>
                        : null
                    } */}
                  </View>

                  <View style={styles.pickerBorder}/>
                </View>
              )}
              renderOptionComponent={(item, index) => (
                <View style={styles.pickerContainer}>
                  <Icon name='chip' size={30}/>

                  <View style={styles.pickerLabelContainer}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                      <Text style={styles.pickerTextStyle}>{item.label}</Text>
                      <Text style={styles.pickerDetailsStyle}>{item.value}</Text>
                    </View>

                    { item.details
                      ? <Text style={styles.pickerDetailsStyle}>{item.details}</Text>
                      : null
                    }
                  </View>

                  { index ? <View style={styles.pickerBorder}/> : null }
                </View>
              )}
            >
              {renderScreenContent()}
            </Picker>
          )
          : <Text preset="bold" style={{ alignSelf: 'center', textAlign: 'center' }} tx="mainScreen.noDevice" />
        }
      </Screen>
    </View>
  )
})
