import * as React from "react"
import { ScrollView, View, ViewStyle } from "react-native"
import { FormProps } from "./form.props"
import { mergeAll, flatten } from "ramda"
import { spacing } from "../../theme"

const ROOT: ViewStyle = {
  flex: 1,
  justifyContent: 'space-between',
  elevation: 3,
  margin: spacing[2],
  padding: spacing[3],
}

const INPUTS_CONTAINER: ViewStyle = {
  marginBottom: spacing[4]
}

/**
 * A container component of rows of forms and submit button
 */
export function Form(props: FormProps) {
  return (
    <View style={mergeAll(flatten([ROOT, props.style]))}>
      <ScrollView style={INPUTS_CONTAINER}>
        {props.children}
      </ScrollView>
      {props.submitButton}
    </View>
  )
}
