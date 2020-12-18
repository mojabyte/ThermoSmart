import React, { useEffect, useState } from "react"
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

  const [main, setMain] = useState(0)
  const [decimal, setDecimal] = useState(0)

  useEffect(() => {
    setMain(Math.floor(value - min))
    setDecimal(Math.round((value - min) % 1 * 10))
  }, [value, min])

  return (
    <View style={ROOT}>
      <WheelPicker
        selectedItem={main}
        data={[...Array(max - min + 1)].map((_, i) => `${min + i}`)}
        onItemSelected={item => {
          setMain(item)
          onSelect(item + decimal / 10 + min)
        }}
        style={{ width: 50, height: 120 }}
      />
      <Text text="." style={{ fontSize: 18 }} />
      <WheelPicker
        selectedItem={decimal}
        data={[...Array(10)].map((_, i) => `${i}`)}
        onItemSelected={item => {
          setDecimal(item)
          onSelect(main + item / 10 + min)
        }}
        style={{ width: 30, height: 120 }}
      />
      <Text text={postfix} style={{ fontSize: 18 }} />
    </View>
  )
}
