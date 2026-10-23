# ThermoSmart

Smart thermostat management app that controls and monitors devices over SMS. ThermoSmart talks to SMS-enabled thermostats from an Android phone: it sends commands, reads the replies, and listens for unsolicited alerts such as temperature alarms and power outages.

## Features

- **Control over SMS**: read and change setpoints (max / normal / min), thermostat mode (manual / automatic), clock, and report intervals
- **Alarm configuration**: high and low temperature alarm thresholds and alarm repeat interval
- **Live alerts**: temperature alarms, heater / fan on-off events, and mains power cut / restore notifications are picked up automatically
- **Device diagnostics**: SIM credit, signal strength, sensor calibration
- **Device administration**: manage authorized phone numbers and the device password
- **Multi-device**: track multiple thermostats, each identified by its phone number
- **Dual-SIM support**: choose which SIM slot messages are sent from
- **i18n-ready** UI (see `app/i18n`)

## Tech Stack

- [React Native](https://reactnative.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Navigation](https://reactnavigation.org/)
- [MobX State Tree](https://mobx-state-tree.js.org/)
- [react-native-get-sms-android](https://github.com/briankabiro/react-native-get-sms-android): sending SMS
- [react-native-android-sms-listener](https://github.com/facebook/react-native): receiving SMS
- [react-native-background-timer](https://github.com/ocetnik/react-native-background-timer): response timeouts
- [Storybook](https://storybook.js.org/) and [Jest](https://jestjs.io/)
- Bootstrapped with [Ignite Bowser](https://github.com/infinitered/ignite-bowser)

## Platform Support

| Platform | Status |
|---|---|
| Android | Supported. Sending and receiving SMS relies on Android-only APIs |
| iOS | SMS features are not available (iOS doesn't allow apps to send or listen for SMS in the background) |

## Getting Started

### Prerequisites

- Node.js and Yarn
- React Native Android environment ([setup guide](https://reactnative.dev/docs/environment-setup))
- A **physical Android phone with a SIM card**. SMS can't be tested on an emulator
- A thermostat that accepts commands and sends replies over SMS

### Installation

```bash
git clone https://github.com/mojabyte/ThermoSmart.git
cd ThermoSmart
yarn install
```

### Run

```bash
yarn start      # start the Metro bundler
yarn android    # build and run on a connected Android device
```

> Check the `scripts` section of `package.json` for the exact commands.

### Permissions

The app needs SMS permissions to send commands and listen for replies (typically `SEND_SMS`, `RECEIVE_SMS` and `READ_SMS`, see `android/app/src/main/AndroidManifest.xml`). Grant them when prompted on first launch.

## How It Works

All SMS logic lives in `app/services/sms`.

```
        send(command)                     SMS
 App ───────────────────▶ Android SMS ────────────▶ Thermostat
  ▲                                                     │
  │  callback(reply)      SMS listener        SMS reply │
  └───────────────────────────────────────◀─────────────┘
```

**Sending a command.** `Sms.send({ phoneNumber, type, message, callback, hasResponse })` sends the message through the selected SIM slot to `+98<phoneNumber>`. If `hasResponse` is set, the request is added to a pending list keyed by device number and message type, and the callback is called with the reply, or with a `"timeout"` error after 60 seconds.

**Receiving a reply.** Every incoming SMS is classified by matching its body against the regular expressions in `sms-utils.ts` (`getSmsType`). The message is then routed by sender number and type:

1. If a pending request of that type exists for the sender, its callback receives the reply and its timeout is cleared.
2. Otherwise, if the app has subscribed to that type for the sender (e.g. alarms or status changes sent by the device on its own), the subscription callback is called and the device's last-sync date is updated.

**Subscriptions.** `subscribe({ phoneNumber, subscriptions, setSyncDate })` registers handlers for unsolicited messages, and `unsubscribe(phoneNumber)` removes them and cancels any pending requests for that device.

**SIM selection.** `selectSimSlot(slot)` sets the slot used for sending (dual-SIM phones). If none is selected, slot `2` is used.

## Project Structure

```
ThermoSmart
├── app
│   ├── components    # Reusable UI components (with Storybook stories)
│   ├── i18n          # Translations
│   ├── models        # MobX State Tree models and stores
│   ├── navigation    # React Navigation navigators
│   ├── screens       # Full-screen components
│   ├── services
│   │   └── sms       # SMS sending, listening and message parsing
│   ├── theme         # Colors, spacing, typography
│   ├── utils         # Shared helpers
│   └── app.tsx       # App entry point
├── android           # Native Android project
├── ios               # Native iOS project (no SMS support)
├── assets/fonts      # Custom fonts
├── storybook         # Storybook configuration
├── test              # Jest configuration and mocks
└── ignite            # Ignite CLI plugins and generators
```

## Storybook

```bash
yarn storybook
```

Then set `SHOW_STORYBOOK` to `true` in `index.js` and reload the app.

## Testing

```bash
yarn test
```

## Acknowledgements

Built on the [Ignite Bowser](https://github.com/infinitered/ignite-bowser) boilerplate by [Infinite Red](https://infinite.red).
