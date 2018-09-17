import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'

export const Error = (props) => {
  console.log('error', props.error)
  return <View style={styles.container}>
    <Text style={{color: '#fff', fontSize: 24}}>Error</Text>
    <Text style={{color: '#fff'}}>{props.error.toString()}</Text>

    <Button title='Ok' onPress={props.onClose} />
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
