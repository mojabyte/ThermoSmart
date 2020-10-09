import { ViewStyle } from "react-native"

type Item = {
  value: string
  label?: string,
  details?: string
}

export interface PickerProps {
  /**
   * Children elements
   */
  children?: Element

  /**
   * Component shown on the trigger button
   */
  triggerComponent: Element

  /**
   * Component for each option
   */
  renderOptionComponent(item: Item, index: number): Element

  /**
   * List of items objects
   */
  items: Item[]

  /**
   * What happens when you select an option
   */
  onItemSelect?(value: string): void

  /**
   * Icon to be displayed on trigger button
   */
  icon?: string

  /**
   * Custom container style
   */
  style?: ViewStyle
}
