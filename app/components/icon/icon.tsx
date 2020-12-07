import * as React from "react"
import { I18nManager, View } from "react-native"
import VectorIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { IconProps } from './icon.props'
import { color as colors } from "../../theme"

export function Icon(props: IconProps) {
  const { size = 16, color = colors.palette.greyDarker, name, containerStyle } = props

  const getIconName = (name: string) => {
    switch (name) {
      case 'back':
        return I18nManager.isRTL ? 'arrow-right' : 'arrow-left'
      case 'chevron-right-ltr':
        return I18nManager.isRTL ? 'chevron-left' : 'chevron-right'
      case 'arrow-right-ltr':
        return I18nManager.isRTL ? 'arrow-left' : 'arrow-right'
      default:
        return name
    }
  }

  return (
    <View style={containerStyle}>
      <VectorIcon name={getIconName(name)} size={size} color={color} />
    </View>
  )
}
