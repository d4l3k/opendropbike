import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import { MapView } from 'expo'
import Color from 'color'

import {getNearbyBikes, AuthScreen, getNearbyRegion} from './api'
import {getLocation} from './location'
import {Loading} from './loading'

export default class App extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      bikes: [],
      loading: true,
      authed: false,
    }
  }

  async getLocation () {
    const loc = await getLocation()
    const bikes = await getNearbyBikes()
    const region = await getNearbyRegion()
    this.setState({loc, bikes, region, loading: false})
  }

  render () {
    if (!this.state.authed) {
      return <AuthScreen onAuth={({session, user}) => {
        console.log(session, user)
        this.setState({authed: true})
        this.getLocation()
      }} />
    }
    if (this.state.loading) {
      return <Loading />
    }

    return (
      <View style={styles.container}>
        {this.renderMap()}
        <Button title='Unlock Bike' onPress={this.unlockBike.bind(this)}/>
      </View>
    )
  }

  unlockBike () {
  }

  renderMap () {
    const {loc} = this.state
    if (!loc) {
      return
    }

    return <MapView
      style={{ flex: 1, alignSelf: 'stretch' }}
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
          description={bike.state}
          coordinate={{latitude: bike.lat, longitude: bike.lng}}
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
    console.log(parts)
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
