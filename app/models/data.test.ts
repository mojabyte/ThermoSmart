import { DeviceModel } from './data'

it('can create an instance of device', () => {
  const device = DeviceModel.create({
    name: 'new device',
    simNumber: '09100000000'
  })

  expect(device.name).toBe('new device')
  expect(device.simNumber).toBe('09100000000')
  device.setName('first device')
  expect(device.name).toBe('first device')
})
