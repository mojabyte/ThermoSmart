import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { ActivityIndicator, Dimensions, View, ViewStyle } from "react-native"
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
import { Header, ListItem, Screen } from "../../components"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { useStores } from "../../models"
import { color } from "../../theme"
import { PrimaryParamList } from "../../navigation"
import { FlatList } from "react-native-gesture-handler"

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
        onLeftPress={navigation.goBack}
        rightIcon="refresh"
        // onRightPress={selectedDevice.reset}
        onRightPress={selectedDevice.getLast24Temperatures}
      />

      <View>
        <ActivityIndicator
          animating={selectedDevice.state.getTemperatureLoading}
          color={color.palette.black}
          style={{ position: 'absolute', right: 0, left: 0 }}
        />
        <VictoryChart
          width={Dimensions.get('window').width}
          height={Dimensions.get('window').height / 2}
          theme={VictoryTheme.material}
          domainPadding={{ y: 50 }}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) => `${datum.x} ${datum.y}°c`}
              labelComponent={<VictoryTooltip centerOffset={{ y: -30 }} />}
              voronoiBlacklist={['line']}
            />
          }
          padding={{
            top: 25,
            left: 45,
            right: 20,
            bottom: 40
          }}
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
            interpolation="catmullRom"
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

      <FlatList
        data={selectedDevice.temperaturesView}
        keyExtractor={({ ts }) => `${ts}`}
        renderItem={({ item }) => (
          <ListItem
            titleText={moment(item.ts).format('jYYYY/jMM/jDD  HH:mm')}
            valueText={`${item.value}°c`}
          />
        )}
      />
    </Screen>
  )
})
