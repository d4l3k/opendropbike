import React from 'react'
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'

export const Loading = (props) => {
  return <View style={styles.container}>
    <ActivityIndicator size="large" />
    <Text>Loading...</Text>
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
