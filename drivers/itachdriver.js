const Homey = require('homey')
const Discover = require('../../lib/discover')

class ITachDriver extends Homey.Driver {
  onInit () {
    this._discover = new Discover()
      .on('device', this._onDiscoverDevice.bind(this))
      .on('rediscover', this._onDiscoverDevice.bind(this))

    this._discover.start()

    this.actionSendCmd = new Homey.FlowCardAction('send_command')
    this.actionSendCmd
      .register()
      .registerRunListener(this._executeCommand.bind(this))
      .getArgument('connectoraddress')
      .registerAutocompleteListener((query, args) => { return args.device.onAutoCompleteConnectorAddress(query, args) })
  }

  // overide by subclass
  isSupported (itachDeviceName) {
    return false
  }

  // overide by subclass
  supportedModuleType () {
    return ''
  }

  _onDiscoverDevice (deviceData) {
    this.log('Device found:', deviceData.name, '@', deviceData.url)
    if (this.isSupported) {
      let homeyDevice = this.getDevice({
        id: deviceData.uuid
      })
      if (homeyDevice instanceof Homey.Device) {
        homeyDevice.refresh(this.supportedModuleType(), deviceData)
      } else {
        this.log('Device found but not paired yet')
      }
    }
  }

  _executeCommand (args, state) {
    return args.device.executeCommand(args)
  }

  onPair (socket) {
    socket.on('list_devices', (data, callback) => {
      const devicesObj = this._discover.getDevices()

      if (devicesObj.length === 0) {
        return callback(new Error(Homey.__('pair_none_found')))
      }

      let devicesArr = []

      for (let id in devicesObj) {
        let device = devicesObj[id]

        devicesArr.push({
          data: {
            id: device.uuid
          },
          name: device.name + ` (${device.ip})`
        })
      }

      if (devicesArr.length === 0) {
        return callback(new Error(Homey.__('pair_none_found')))
      }

      callback(null, devicesArr)
    })
  }
}

module.exports = ITachDriver