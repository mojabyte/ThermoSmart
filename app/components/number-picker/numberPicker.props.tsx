/**
 * The properties you can pass to NumberPicker.
 */
export interface NumberPickerProps {
  /**
   * NumberPicker value
   */
  value?: number

  /**
   * NumberPicker max value
   */
  max?: number

  /**
   * NumberPicker min value
   */
  min?: number

  /**
   * NumberPicker value postfix
   */
  postfix?: string

  /**
   * NumberPicker value
   */
  onSelect?: (value: number) => void
}
