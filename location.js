import { Permissions, Location } from 'expo'
import {debounce} from './debounce'

export const getLocation = debounce(async (args) => {
  const { status } = await Permissions.askAsync(Permissions.LOCATION)
  if (status === 'granted') {
    return await Location.getCurrentPositionAsync({
      enableHighAccuracy: true,
      maximumAge: 5000,
      ...args
    })
  } else {
    throw new Error('Location permission not granted')
  }
}, 5000)
