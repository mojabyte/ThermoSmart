import { ViewStyle } from "react-native"
import Icon from 'react-native-vector-icons/Icon'

export interface IconProps extends Icon.IconProps {
  /**
   * Style overrides for the icon container
   */

  containerStyle?: ViewStyle
}
