import * as React from "react"
import { ViewStyle } from "react-native"

/**
 * The properties you can pass to FormRow.
 */
export interface FormProps {
  /**
   * Children components.
   */
  children?: React.ReactNode

  /**
   * Override the container style... useful for margins and padding.
   */
  style?: ViewStyle | ViewStyle[]

  /**
   * Button Component for Submit
   */
  submitButton: Element
}
