import { ViewStyle, TextStyle, TouchableOpacityProps } from "react-native"
import { ListItemPresetNames } from "./listItem.presets"

export interface ListItemProps extends TouchableOpacityProps {
  /**
   * Title text which is looked up via i18n.
   */
  titleTx?: string

  /**
   * The title text to display if not using `tx` or nested components.
   */
  titleText?: string

  /**
   * Details text which is looked up via i18n.
   */
  detailsTx?: string

  /**
   * The details text to display if not using `tx` or nested components.
   */
  detailsText?: string

  /**
   * The value text displayed on the right side of the component.
   */
  valueText?: string

  /**
   * An optional style override useful for padding & margin.
   */
  style?: ViewStyle | ViewStyle[]

  /**
   * An optional style override useful for the button text.
   */
  textStyle?: TextStyle | TextStyle[]

  /**
   * One of the different types of text presets.
   */
  preset?: ListItemPresetNames

  /**
   * One of the different types of text presets.
   */
  children?: React.ReactNode
}
