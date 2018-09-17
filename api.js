import React from 'react'
import {StyleSheet, View, Text, TextInput, Button, ToolbarAndroid} from 'react-native'
import {SecureStore, Constants} from 'expo'

import {getLocation} from './location'
import {Loading} from './loading'

const baseURL = 'https://dropbike.herokuapp.com'

const apiCall = async (method, endpoint, body, headers) => {
  console.log('->', method, endpoint, body, headers)
  const resp = await fetch(baseURL + endpoint, {
    method: method,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-dropbike-client-version": "3.1.64",
      "x-dropbike-client-type": 'android',
      ...headers
    }
  })
  const json = await resp.json()
  console.log('<-', method, endpoint, json)
  if (json.status_code && json.message) {
    throw new Error(json.status_code + ': ' + json.message)
  }
  return json
}

const get = async (endpoint, body, headers) => {
  return apiCall('GET', endpoint, body, headers)
}

const post = async (endpoint, body, headers) => {
  return apiCall('POST', endpoint, body, headers)
}

function urlEncode (args) {
  const parts = Object.keys(args).map((key) => key + '=' + args[key])
  return parts.join('&')
}

export const getNearbyBikes = async () => {
  const loc = await getLocation()

  return get('/v3/bikes?' + urlEncode({lat: loc.coords.latitude, lng: loc.coords.longitude}))
}

export const getNearbyRegion = async () => {
  const loc = await getLocation()

  return get('/v3/region_near?' + urlEncode({lat: loc.coords.latitude, lng: loc.coords.longitude}))
}

export const authenticate = async (phone) => {
  return post('/v3/authenticate', {phone})
}

export const verify = async (sms_id, code) => {
  return post('/v3/verify', {sms_id, uuid: Constants.installationId, code})
}

const getSession = async () => {
  const raw = await SecureStore.getItemAsync('session')
  if (!raw) {
    return
  }
  return JSON.parse(raw)
}

const authGet = async (endpoint, body, headers) => {
  const session = await getSession()
  return apiCall('GET', endpoint, body, {
    "x-dropbike-session-id": session.id,
    ...headers
  })
}

const authPost = async (endpoint, body, headers) => {
  const session = await getSession()
  return apiCall('POST', endpoint, body, {
    "x-dropbike-session-id": session.id,
    ...headers
  })
}

export const getUser = async () => {
  return authGet('/v3/user')
}

export const startTrip = async (plate) => {
  const loc = await getLocation()
  return authPost('/v3/start_trip', {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    plate,
    scan_type: 'qr'
  })
}

export class AuthScreen extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      verify: false,
      loading: true
    }

    this.checkLoggedIn()
  }

  async checkLoggedIn () {
    const session = await getSession()
    if (session) {
      const user = await getUser()
      this.props.onAuth({
        session,
        user: user.user,
      })
    } else {
      this.setState({loading: false})
    }
  }

  render () {
    if (this.state.loading) {
      return <Loading />
    }

    if (this.state.verify) {
      return <View style={styles.container}>
        <Text>Finish verifying by entering the code that was just sent to you:</Text>
        <TextInput
          style={styles.input}
          placeholder="Verification Code"
          onChangeText={(code) => this.setState({code})}
        />
        <Button
          onPress={this.verify.bind(this)}
          title="Verify"
        />
        <Button
          onPress={this.auth.bind(this)}
          title="Resend Code"
        />
      </View>
    }

    return <View style={styles.container}>
      <Text>Please verify your phone number:</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        onChangeText={(phone) => this.setState({phone})}
      />
      <Button
        onPress={this.auth.bind(this)}
        title="Send Code"
      />
    </View>
  }

  async auth () {
    this.setState({loading: true})
    const {sms_id, type} = await authenticate(this.state.phone)
    if (type !== 'login') {
      throw new Error('type not login: ' + type)
    }
    this.setState({sms_id, type, verify: true, loading: false})
  }

  async verify () {
    this.setState({loading: true})
    const resp = await verify(this.state.sms_id, this.state.code)
    await SecureStore.setItemAsync('session', JSON.stringify(resp.session))
    this.props.onAuth(resp)
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 16,
  },
  input: {height: 60}
})
