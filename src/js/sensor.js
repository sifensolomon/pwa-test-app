'use strict';
class Sensor {
    constructor(sensor, params) {
        this.params = params;
        this.title = params.isMobile ? sensor.name : sensor.name + " " + "[" + params.id + "]";;
        this.name = sensor.name || sensor.deviceMap.Name;
        this.show = false;
    }
    disabled(device, isDeviceControl) {
        // return !device.activated || !isDeviceControl;
        return !isDeviceControl;
    }
    saveDeviceConfig(device, smartFarm) {
        let set = {};
        let edit = {};
        if (this.name !== device.name) {  // 바뀐 값들을 모아서
            this.title = this.isMobile ? h.name : this.name + " " + "[" + this.params.id + "]";
            set["sensors." + this.params.id + ".name"] = this.name;
            edit.name = this.name;
        }
        if (this.activated !== device.activated) {
            set["sensors." + this.params.id + ".activated"] = this.activated;
            edit.activated = this.activated;
        }
        smartFarm.send({
            topic: "nodeStatus/saveDeviceConfig",
            slaveAddress: this.params.slaveAddress,
            deviceId: this.params.id,
            edit: edit
        });
        this.show = false;
        smartFarm.send({
            topic: "nodeStatus/saveDeviceConfig",
            slaveAddress: this.params.slaveAddress,
            set: set
        });
    }
    read(device, smartFarm) {
        let data = {
            topic: this.params.id,
            payload: {
                command: 'read',
                isController: this.params.isController,
                connectedTo: this.params.connectedTo,
                device: {
                    ...device,
                    edit: {
                        deviceArray: "sensors",
                        deviceType: "sensor",
                        slaveAddress: this.params.slaveAddress,
                        params: this.params,
                    }
                }
            }
        }
        console.log({
            deviceArray: "sensors",
            deviceType: "sensor",
            slaveAddress: this.params.slaveAddress,
            params: this.params,
        })
        if (smartFarm.isRemote) {
            console.log(smartFarm);
            data.topic = smartFarm.homeServerInfo.selectedController + "/" + data.topic
        }
        console.log(data);
        smartFarm.send(data);
    }
    handleResult(device, smartFarm, resultData) {
        device.value = resultData.value;
    }
}
export default Sensor;