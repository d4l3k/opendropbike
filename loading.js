import React from 'react'
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'

export const Loading = (props) => {
  return <View style={styles.container}>
    <ActivityIndicator color={'#fff'} size="large" />
    <Text style={{color: '#fff'}}>Loading...</Text>
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7EC0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
