import React from "react"
import {
  Image,
  ImageStyle,
  Platform,
  TextStyle,
  View,
  ViewStyle,
  ToastAndroid,
  PermissionsAndroid,
  DeviceEventEmitter
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import { BulletItem, Button, Header, Text, Screen, Wallpaper } from "../../components"
import { color, spacing } from "../../theme"
import { Api } from "../../services/api"
import { save } from "../../utils/storage"
import SmsAndroid from 'react-native-get-sms-android'
import SmsListener from 'react-native-android-sms-listener'
export const logoIgnite = require("./logo-ignite.png")
export const heart = require("./heart.png")

DeviceEventEmitter.addListener('sms_onDelivery', msg => {
  ToastAndroid.show(`Message '${msg}' delivered successfully`, ToastAndroid.SHORT)
})

const FULL: ViewStyle = { flex: 1 }
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
}
const DEMO: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
  backgroundColor: "#5D2555",
}
const BOLD: TextStyle = { fontWeight: "bold" }
const DEMO_TEXT: TextStyle = {
  ...BOLD,
  fontSize: 13,
  letterSpacing: 2,
}
const HEADER: TextStyle = {
  paddingTop: spacing[3],
  paddingBottom: spacing[5] - 1,
  paddingHorizontal: 0,
}
const HEADER_TITLE: TextStyle = {
  ...BOLD,
  fontSize: 12,
  lineHeight: 15,
  textAlign: "center",
  letterSpacing: 1.5,
}
const TITLE: TextStyle = {
  ...BOLD,
  fontSize: 28,
  lineHeight: 38,
  textAlign: "center",
  marginBottom: spacing[5],
}
const TAGLINE: TextStyle = {
  color: "#BAB6C8",
  fontSize: 15,
  lineHeight: 22,
  marginBottom: spacing[4] + spacing[1],
}
const IGNITE: ImageStyle = {
  marginVertical: spacing[6],
  alignSelf: "center",
}
const LOVE_WRAPPER: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}
const LOVE: TextStyle = {
  color: "#BAB6C8",
  fontSize: 15,
  lineHeight: 22,
}
const HEART: ImageStyle = {
  marginHorizontal: spacing[2],
  width: 10,
  height: 10,
  resizeMode: "contain",
}
const HINT: TextStyle = {
  color: "#BAB6C8",
  fontSize: 12,
  lineHeight: 15,
  marginVertical: spacing[2],
}

export const DemoScreen = observer(function DemoScreen() {
  const navigation = useNavigation()
  const goBack = () => navigation.goBack()

  const sendSMS = async () => {
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS, {
        title: "YourProject App Sms Permission",
        message:
          "YourProject App needs access to your inbox " + "so you can send messages in background.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      })
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        SmsAndroid.autoSend(
          '+989179637615',
          'hi',
          fail => {
            ToastAndroid.show('Failed with this error: ' + fail, ToastAndroid.SHORT)
          },
          () => {
            ToastAndroid.show('SMS sent successfully', ToastAndroid.SHORT)
          },
        )
      } else {
        console.log("SMS permission denied")
      }
    } catch (err) {
      console.warn(err)
    }
  }

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

          SmsAndroid.list(
            JSON.stringify(filter),
            fail => {
              console.log('Failed with this error: ' + fail)
            },
            (count, smsList) => {
              console.log('Count: ', count)
              console.log('List: ')
              const arr = JSON.parse(smsList)
              console.log(arr)

              arr.forEach(function(object) {
                console.log('Object: ' + object)
                console.log('-->' + object.date)
                console.log('-->' + object.body)
              })
            },
          )
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
          SmsListener.addListener(message => {
            console.info(message)
          })
        } else {
          console.log("SMS permission denied")
        }
      })
      .catch(err => console.warn(err))
  }, [])

  const demoReactotron = React.useMemo(
    () => async () => {
      console.tron.log("Your Friendly tron log message")
      console.tron.logImportant("I am important")
      console.tron.display({
        name: "DISPLAY",
        value: {
          numbers: 1,
          strings: "strings",
          booleans: true,
          arrays: [1, 2, 3],
          objects: {
            deeper: {
              deeper: {
                yay: "👾",
              },
            },
          },
          functionNames: function hello() {
            /* dummy function */
          },
        },
        preview: "More control with display()",
        important: true,
        image: {
          uri:
            "https://avatars2.githubusercontent.com/u/3902527?s=200&u=a0d16b13ed719f35d95ca0f4440f5d07c32c349a&v=4",
        },
      })
      // make an API call for the demo
      // Don't do API like this, use store's API
      const demo = new Api()
      demo.setup()
      demo.getUser("1")
      // Let's do some async storage stuff
      await save("Cool Name", "Boaty McBoatface")
    },
    [],
  )

  return (
    <View style={FULL}>
      <Wallpaper />
      <Screen style={CONTAINER} preset="scroll" backgroundColor={color.transparent}>
        <Header
          headerTx="demoScreen.howTo"
          leftIcon="back"
          onLeftPress={goBack}
          style={HEADER}
          titleStyle={HEADER_TITLE}
        />
        <Text style={TITLE} preset="header" tx="demoScreen.title" />
        <Text style={TAGLINE} tx="demoScreen.tagLine" />
        <BulletItem text="Load up Reactotron!  You can inspect your app, view the events, interact, and so much more!" />
        <BulletItem text="Integrated here, Navigation with State, TypeScript, Storybook, Solidarity, and i18n." />
        <View>
          <Button
            style={DEMO}
            textStyle={DEMO_TEXT}
            tx="demoScreen.reactotron"
            onPress={demoReactotron}
          />
          <Text style={HINT} tx={`demoScreen.${Platform.OS}ReactotronHint`} />
        </View>
        <View>
          <Button style={DEMO} textStyle={DEMO_TEXT} tx="demoScreen.sms" onPress={sendSMS} />
        </View>
        <Image source={logoIgnite} style={IGNITE} />
        <View style={LOVE_WRAPPER}>
          <Text style={LOVE} text="Made with" />
          <Image source={heart} style={HEART} />
          <Text style={LOVE} text="by Infinite Red" />
        </View>
      </Screen>
    </View>
  )
})
