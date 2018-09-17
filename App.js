import React from 'react'
import { StyleSheet, Text, View, Button, Alert } from 'react-native'
import { Permissions, MapView, BarCodeScanner, Camera } from 'expo'
import Color from 'color'

import {getNearbyBikes, AuthScreen, getNearbyRegion, startTrip, getCurrentTrips} from './api'
import {getLocation} from './location'
import {SmallLoading, Loading} from './loading'
import {Error} from './error'

export default class App extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      bikes: [],
      loading: true,
      authed: false,
      scan: false,
      torch: false
    }
  }

  async loadData () {
    const [loc, bikes, region, trips] = await Promise.all([
      getLocation(),
      getNearbyBikes(),
      getNearbyRegion(),
      getCurrentTrips(),
    ])
    this.setState({ loc, bikes, region, trips, loading: false, smallLoading: false })
  }

  render () {
    if (this.state.error) {
      return <Error
        onClose={() => this.setState({error: undefined})}
        error={this.state.error}
      />
    }

    if (!this.state.authed) {
      return <AuthScreen onAuth={({session, user}) => {
        this.setState({authed: true})
        this.loadData()
      }} />
    }
    if (this.state.loading) {
      return <Loading />
    }

    if (this.state.scan) {
      return this.renderScan()
    }

    return (
      <View style={styles.container}>
        {this.renderMap()}
        <View style={styles.row}>
          <Button title='Unlock Bike' onPress={this.openScanner.bind(this)} />
          <View style={styles.row}>
            {this.state.smallLoading ? <SmallLoading /> : null}
            <Button title='Refresh' onPress={this.refresh.bind(this)} />
          </View>
        </View>
      </View>
    )
  }

  refresh () {
    this.setState({smallLoading: true})
    this.loadData()
  }

  renderScan () {
    const {FlashMode} = Camera.Constants

    return <View style={styles.container}>
      <Camera
        onBarCodeScanned={this.handleBarCodeScanned.bind(this)}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr]
        }}
        style={StyleSheet.absoluteFill}
        flashMode={this.state.torch ? FlashMode.torch : FlashMode.off}
      />
      <Button title='Flashlight' onPress={() => {
        this.setState({torch: !this.state.torch})
      }} />
      <Button title='Cancel' onPress={() => {
        this.setState({scan: false})
      }} />
    </View>
  }

  async handleBarCodeScanned ({data}) {
    console.log('qr code', data)
    const plate = data.split('=')[1]
    this.setState({scan: false})
    return this.startTrip(plate)
  }

  async startTrip (plate) {
    this.setState({loading: true})
    await startTrip(plate).catch((error) => {
      this.setState({error})
    })
    await this.loadData()
    this.setState({loading: false})
  }

  async openScanner () {
    const { status } = await Permissions.askAsync(Permissions.CAMERA)
    if (status === 'granted') {
      this.setState({scan: true})
    } else {
      throw new Error('Camera permission not granted')
    }
  }

  renderMap () {
    const {loc} = this.state
    if (!loc) {
      return
    }

    return <MapView
      style={StyleSheet.absoluteFill}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsCompass={true}
      initialRegion={{
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.005
      }}
    >
      {this.state.bikes.map((bike) => {
        return <MapView.Marker
          key={bike.plate}
          title={bike.plate}
          pinColor={bike.state === 'idle' ? 'orange' : 'red'}
          description={bike.state}
          coordinate={{latitude: bike.lat, longitude: bike.lng}}
          onCalloutPress={() => {
            Alert.alert(
              'Unlock Bike',
              'This will immediately unlock the bike. You should probably be close. Plate: ' + bike.plate,
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Unlock', onPress: () => this.startTrip(bike.plate)}
              ]
            )
          }}
        />
      })}

      {this.state.region.shapes.concat(this.state.region.exclusion_zones).map((zone) => {
        const color = Color('#' + (zone.colour || '7EC0EE'))

        return <MapView.Polygon
          key={zone.id}
          strokeColor={color.string()}
          fillColor={color.fade(0.9).string()}
          coordinates={this.parseShape(zone.shape)}
        />
      })}
    </MapView>
  }

  // parseShape parses shape strings in the format '((lat, lng),(lat, lng))`
  parseShape (shape) {
    const coords = []
    const parts = shape.split(/[^0-9.-]+/g)
    while (parts.length > 0) {
      if (!parts[0]) {
        parts.shift()
        continue
      }
      coords.push({longitude: parseFloat(parts.shift()), latitude: parseFloat(parts.shift())})
    }
    return coords
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    padding: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  }
})
