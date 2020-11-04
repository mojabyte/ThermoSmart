import React, { useEffect } from "react"
import { PermissionsAndroid, TextStyle, View, ViewStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import { Button, Header, Picker, Screen, Text } from "../../components"
import { color, spacing, typography } from "../../theme"
import { useStores, withEnvironment } from '../../models'

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

  useEffect(() => {
    if (devices.items.length > 0 && !devices.get(selectedDeviceID)) {
      setSelectedDeviceID(devices.items[0].simNumber)
    } else {
      setSelectedDeviceID(selectedDeviceID)
    }
  }, [devices, devices.items.length, selectedDeviceID, setSelectedDeviceID])

  const selectedDevice = devices.get(selectedDeviceID)

  const renderScreenContent = function () {
    return (
      <>
        <Text text={selectedDevice.name} />
        <Text text={selectedDevice.place} />
        <Text text={selectedDevice.simNumber} />
        <Button
          text="get"
          onPress={() => {
            selectedDevice.getPhoneNumbers()
          }}
        />
        {selectedDevice.phoneNumbers.map(phoneNumber => (
          <Text key={phoneNumber} text={phoneNumber} />
        ))}
        {selectedDevice.status.getPhoneNumbersLoading
          ? <Text text="Loading..." />
          : null
        }

        <Button
          text="update"
          onPress={() => {
            selectedDevice.updatePhoneNumber({ phoneNumber: '123', index: 0 })
          }}
        />
        {selectedDevice.status.updatePhoneNumberLoading[0]
          ? <Text text="Loading..." />
          : null
        }
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
                  <View style={styles.pickerLabelContainer}>
                    <Text
                      style={styles.pickerTextStyle}
                      numberOfLines={1}
                    >
                      {selectedDevice.name}
                    </Text>

                    { selectedDevice.place
                      ? <Text
                        style={styles.pickerDetailsStyle}
                        numberOfLines={1}
                      >
                        {selectedDevice.place}
                      </Text>
                      : null
                    }
                  </View>

                  <View style={styles.pickerBorder}/>
                </View>
              )}
              renderOptionComponent={(item, index) => (
                <View style={styles.pickerContainer}>
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
