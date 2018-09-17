import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import { MapView } from 'expo'

import {getNearbyBikes, AuthScreen} from './api'
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
    this.setState({loc, bikes, loading: false})
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
    </MapView>
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
