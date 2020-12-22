import React, { useCallback, useMemo, useState } from "react"
import { I18nManager, View, ViewStyle } from "react-native"
import { NumberPickerProps } from "./numberPicker.props"
import { WheelPicker } from "react-native-wheel-picker-android"
import { Text } from "../text/text"

// TODO: Support negative numbers

export function NumberPicker(props: NumberPickerProps): JSX.Element {
  const {
    value = 0,
    min = 0,
    max = 10,
    postfix = '',
    onSelect = () => null
  } = props

  const ROOT: ViewStyle = {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center'
  }

  const main = useMemo(() => Math.floor(value - min), [value, min])
  const decimal = useMemo(() => Math.round((value - min) % 1 * 10), [value, min])

  const select = useCallback(onSelect, [onSelect])

  // Fixes WheelPicker bug that auto triggers onItemSelected on init
  const [mainInit, setMainInit] = useState(false)
  const [decimalInit, setDecimalInit] = useState(false)

  return (
    <View style={ROOT}>
      <WheelPicker
        selectedItem={main}
        data={[...Array(max - min + 1)].map((_, i) => `${min + i}`)}
        onItemSelected={item => {
          if (mainInit) {
            // Fixes WheelPicker bug that triggers onItemSelected on selectedItem change
            if (item !== main) {
              select(item + decimal / 10 + min)
            }
          } else {
            setMainInit(true)
          }
        }}
        style={{ width: 50, height: 120 }}
      />
      <Text text="." style={{ fontSize: 18 }} />
      <WheelPicker
        selectedItem={decimal}
        data={[...Array(10)].map((_, i) => `${i}`)}
        onItemSelected={item => {
          if (decimalInit) {
            // Fixes WheelPicker bug that triggers onItemSelected on selectedItem change
            if (item !== decimal) {
              select(main + item / 10 + min)
            }
          } else {
            setDecimalInit(true)
          }
        }}
        style={{ width: 30, height: 120 }}
      />
      <Text text={postfix} style={{ fontSize: 18 }} />
    </View>
  )
}
