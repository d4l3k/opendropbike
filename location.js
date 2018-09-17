import { Permissions, Location } from 'expo'

export const getLocation = async (args) => {
  const { status } = await Permissions.askAsync(Permissions.LOCATION)
  if (status === 'granted') {
    return await Location.getCurrentPositionAsync(args)
  } else {
    throw new Error('Location permission not granted')
  }
}
