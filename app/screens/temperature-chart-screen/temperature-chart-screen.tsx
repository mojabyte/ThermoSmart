import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { Dimensions, View, ViewStyle } from "react-native"
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer
} from "victory-native"
import moment from "moment-jalaali"
import { Button, Header, Screen } from "../../components"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { useStores } from "../../models"
import { color } from "../../theme"
import { PrimaryParamList } from "../../navigation"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1
}

export const TemperatureChartScreen = observer(function TemperatureChartScreen() {
  const navigation = useNavigation()
  const { params } = useRoute<RouteProp<PrimaryParamList, 'add'>>()

  const { devices } = useStores()
  const selectedDevice = devices.get(params?.selectedDeviceID)

  const [chartData, setChartData] = useState<{ x: string, y: number }[]>([])

  useEffect(() => {
    const now = +moment().startOf('hour')
    const hours = [...Array(24)].map((_, i) => ({
      x: moment(now).add(-i, 'hours').format('HH:mm'),
      y: selectedDevice?.temperatures.get(`${+moment(now).add(-i, 'hours')}`)
    })).filter(({ y }) => !!y)
    setChartData(hours.reverse())
  }, [selectedDevice.temperatures, selectedDevice.temperatures.size])

  useEffect(() => {
    selectedDevice.getLast24Temperatures()
  }, [selectedDevice])

  return (
    <Screen style={ROOT}>
      <Header
        headerTx="temperatureChartScreen.title"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
      />

      <View>
        <VictoryChart
          width={Dimensions.get('window').width}
          theme={VictoryTheme.material}
          domainPadding={{ y: 50 }}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) => `${datum.x} ${datum.y}°c`}
              labelComponent={<VictoryTooltip centerOffset={{ y: -30 }} />}
              voronoiBlacklist={['line']}
            />
          }
        >
          <VictoryAxis fixLabelOverlap tickLabelComponent={<VictoryLabel angle={-45} />} />
          <VictoryAxis
            dependentAxis
            fixLabelOverlap
            tickFormat={(t) => `${t}°c`}
          />
          <VictoryLine
            name="line"
            animate={{
              duration: 2000,
              onLoad: { duration: 0 }
            }}
            data={chartData}
            style={{ data: { stroke: color.primary } }}
            interpolation="natural"
          />
          <VictoryScatter
            animate={{
              duration: 2000,
              onLoad: { duration: 0 }
            }}
            data={chartData}
            style={{ data: { fill: color.primaryDarker } }}
          />
        </VictoryChart>
      </View>

      <Button text="reset" onPress={() => selectedDevice.reset()} />
    </Screen>
  )
})
