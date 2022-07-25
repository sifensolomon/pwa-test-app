<script setup>
import { onMounted, inject, reactive, watch, ref, toRef } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const smartFarm = inject("smartFarm");
const msg = toRef(smartFarm, 'msg');

// 설정용과 상태용의 객체를 따로 설정한다. 사용도가 달라 통합하는게 더 복잡하다.
class ActuatorRetractable {
  constructor(slaveAddress, actuatorRetractable, id) {
    this._slaveAddress = slaveAddress;
    this._id = id;
    this.deviceCode = actuatorRetractable.deviceCode;
    this.name = actuatorRetractable.name;
    this.productCode = actuatorRetractable.productCode;
    this.openTime = actuatorRetractable.openTime;
    this.closeTime = actuatorRetractable.closeTime;
    this.channel = actuatorRetractable.channel;
    this.disabled = false;
  }
  readChannelInfo(smartFarm) {
    this.disabled = true;
    smartFarm.send({
      topic: "nodeConfig/readChannelInfo",
      slaveAddress: this._slaveAddress,
      id: this._id,
      device: this,
      deviceType: "actuatorRetractable",
      payload: {
        fc: 3,
        unitid: parseInt(this._slaveAddress, 10),
        address: 1010 + 10 * this.channel,
        quantity: 3,
      }
    });
  }
  writeChannelInfo(smartFarm) {
    this.disabled = true;
    smartFarm.send({
      topic: "nodeConfig/writeChannelInfo",
      slaveAddress: this._slaveAddress,
      id: this._id,
      device: this,
      deviceType: "actuatorRetractable",
      payload: {
        fc: 16,
        unitid: parseInt(this._slaveAddress, 10),
        address: 1010 + 10 * this.channel,
        quantity: 3,
        value: [
          parseInt(this.productCode, 10),
          parseInt(this.openTime, 10),
          parseInt(this.closeTime, 10)
        ]
      }
    });
  }
}
class ActuatorSwitch {
  constructor(slaveAddress, actuatorSwitch, id) {
    this._slaveAddress = slaveAddress;
    this._id = id;
    this.deviceCode = actuatorSwitch.deviceCode;
    this.name = actuatorSwitch.name;
    this.productCode = actuatorSwitch.productCode;
    this.ratio = actuatorSwitch.ratio;
    this.channel = actuatorSwitch.channel;
    this.disabled = false;
  }
  readChannelInfo(smartFarm) {
    this.disabled = true;
    smartFarm.send({
      topic: "nodeConfig/readChannelInfo",
      slaveAddress: this._slaveAddress,
      id: this._id,
      device: this,
      deviceType: "actuatorSwitch",
      payload: {
        fc: 3,
        unitid: parseInt(this._slaveAddress, 10),
        address: 1110 + 10 * this.channel,
        quantity: 2,
      }
    });
  }
  writeChannelInfo(smartFarm) {
    this.disabled = true;
    smartFarm.send({
      topic: "nodeConfig/writeChannelInfo",
      slaveAddress: this._slaveAddress,
      id: this._id,
      device: this,
      deviceType: "actuatorSwitch",
      payload: {
        fc: 16,
        unitid: parseInt(this._slaveAddress, 10),
        address: 1110 + 10 * this.channel,
        quantity: 2,
        value: [
          parseInt(this.productCode, 10),
          parseInt(this.ratio, 10)
        ]
      }
    });
  }
}
class Sensor {
  constructor(slaveAddress, sensor, id) {
    this._slaveAddress = slaveAddress;
    this._id = id;
    this.deviceCode = sensor.deviceCode;
    this.name = sensor.name;
    this.productCode = sensor.productCode;
    this.constantK = sensor.constantK;
    this.constantP = sensor.constantP;
    this.channel = sensor.channel;
    this.disabled = false;
  }
  readChannelInfo(smartFarm) {
    this.disabled = true;
    smartFarm.send({
      topic: "nodeConfig/readChannelInfo",
      slaveAddress: this._slaveAddress,
      id: this._id,
      device: this,
      deviceType: "sensor",
      payload: {
        fc: 3,
        unitid: parseInt(this._slaveAddress, 10),
        address: 910 + 10 * this.channel,
        quantity: 5,
      }
    });
  }
  _floatToWord(floatValue) {
    var buffer = new ArrayBuffer(32);
    var view = new DataView(buffer);
    view.setFloat32(0, parseFloat(floatValue));
    var word = {};
    word.low = view.getUint16(0);
    word.high = view.getUint16(2);
    return word;
  }
  writeChannelInfo(smartFarm) {
    smartFarm.send({
      topic: "nodeConfig/writeChannelInfo",
      slaveAddress: this._slaveAddress,
      id: this._id,
      device: this,
      deviceType: "sensor",
      payload: {
        fc: 16,
        unitid: parseInt(this._slaveAddress, 10),
        address: 910 + 10 * this.channel,
        quantity: 5,
        value: [
          parseInt(this.productCode, 10),
          this._floatToWord(this.constantK).high,
          this._floatToWord(this.constantK).low,
          this._floatToWord(this.constantP).high,
          this._floatToWord(this.constantP).low
        ]
      }
    });
  }
}
class ConfigNode { // 포트설정을 위한 객체
  constructor(deviceNode) {
    console.log(deviceNode);
    this.name = deviceNode.name;
    this._id = deviceNode._id;
    this.mapInfo = deviceNode.mapInfo;
    this.nodeInfo = deviceNode.nodeInfo;
    this.deviceCodes = deviceNode.deviceCodes;
    this.sensors = deviceNode.sensors;
    this.actuatorRetractables = deviceNode.actuatorRetractables;
    this.actuatorSwitches = deviceNode.actuatorSwitches;
    this.noOfDualChannels = Object.keys(deviceNode.actuatorRetractables).length;
    this.disableSensorEdit = false;
    this.disableActuatorEdit = false;
    this.deviceMapper = deviceNode.deviceMapper;
  }
  noOfDualChannelsChange() {
    console.log("noOfDualChannels", this.noOfDualChannels, "length", Object.keys(this.actuatorRetractables).length);
    const newValue = this.noOfDualChannels;
    const oldValue = Object.keys(this.actuatorRetractables).length;
    // 개폐기 수가 변하면 자동으로 바꾼다.
    if (newValue === oldValue) {
      return;
    }
    if (newValue > 8) { // min,max 때문에 적용 안되는 코드 <q-input outlined type="number" style="width: 100%" v-model="noOfDualChannels" min="0" max="8"></q-input>
      // 총 포트수가 16개 이므로 개폐기 개수는 8개를 초과 할수 없다.      ==> input min max로 막았다
      modal.value = {
        icon: "report_problem",
        alert: true,
        label: "입력오류",
        text: "개폐기 개수는 8개를 넘을 수 없습니다.",
        yesNo: false
      }
      return;
    } else if (newValue < 0) { // min,max 때문에 적용 안되는 코드
      // 총 포트수가 16개 이므로 개폐기 개수는 8개를 초과 할수 없다.   ==> input min max로 막았다
      modal.value = {
        icon: "report_problem",
        alert: true,
        label: "입력오류",
        text: "개폐기 개수는 0보다 작을수 없습니다.",
        yesNo: false
      }
    } else {
      this.disableActuatorEdit = true;
      // 구동기 포트 0-15에서 개폐기는 0번 부터 순차적으로 할당하고 스위치는 16번 부터 거꾸로 할당한다. => 변경시 기존 설정을 유지하기 하면 포트관리의 일관성을 위함이다.
      console.log("oldValue", oldValue);
      console.log("newValue", newValue);
      let actuatorRetractables = JSON.parse(JSON.stringify(this.actuatorRetractables));
      console.log("actuatorRetractables", actuatorRetractables);
      let actuatorSwitches = JSON.parse(JSON.stringify(this.actuatorSwitches));
      console.log("actuatorSwitches", actuatorSwitches);
      this.actuatorRetractables = {};
      this.actuatorSwitches = {};
      if (newValue > oldValue) {
        // 새로운 값이 이전값보다 크면 스위치수를 줄이고 개폐기 수를 늘인다.
        for (let channel = 0; channel < newValue; channel++) {
          if (channel < oldValue) {
            this.actuatorRetractables[this._id + "/1/" + channel] = actuatorRetractables[this._id + "/1/" + channel];
          } else {
            let data = {
              channel: channel,
              name: "개폐기" + channel,
              deviceCode: this.mapInfo.isTYMap ? 113 : 112,
              productCode: 0,
              status: 0,
              opid: 0,
              stateHoldTime: 0,
              position: 0,
              remainTime: 0,
              time: 0,
              openTime: 0,
              closeTime: 0,
              activated: false
            }
            this.actuatorRetractables[this._id + "/1/" + channel] = {
              ...data,
              edit: new ActuatorRetractable(this._id, data, this._id + "/1/" + channel)
            }
          }
        }
        for (let channel = 0; channel < 16 - 2 * newValue; channel++) {
          this.actuatorSwitches[this._id + "/2/" + channel] = actuatorSwitches[this._id + "/2/" + channel];
        }
      } else {
        // 새로운 값이 이전값보다 작으면 개폐기 개수를 줄이는 것. 개폐기로 사용되던 포트를 스위치로 전환한다.
        for (let channel = 0; channel < newValue; channel++) {
          this.actuatorRetractables[this._id + "/1/" + channel] = actuatorRetractables[this._id + "/1/" + channel];
        }
        for (let channel = 0; channel < 16 - newValue * 2; channel++) {
          if (channel < 16 - oldValue * 2) {
            this.actuatorSwitches[this._id + "/2/" + channel] = actuatorSwitches[this._id + "/2/" + channel];
          } else {
            let data = {
              channel: channel,
              name: "스위치" + channel,
              deviceCode: this.mapInfo.isTYMap ? 103 : 102,
              productCode: 0,
              status: 0,
              opid: 0,
              operation: 0,
              stateHoldTime: 0,
              ratio: 0,
              remainTime: 0,
              activated: false,
            }
            this.actuatorSwitches[this._id + "/2/" + channel] = {
              ...data,
              edit: new ActuatorSwitch(this._id, data, this._id + "/1/" + channel)
            };
          }
        }
      }
    }
  }
  updateSensorCode(deviceCode, name, channel) {
    this.disableSensorEdit = true;
    console.log("this.deviceCodes", nodeConfig.deviceCodes);
    console.log("deviceCode", deviceCode);
    this.sensors[this._id + "/0/" + channel].deviceMap = nodeConfig.deviceCodes.filter(object => object._id === deviceCode);
    console.log("deviceMap", this.sensors[this._id + "/0/" + channel].deviceMap);
    let data = {
      disabled: true,
      channel: channel,
      name: name,
      productCode: 0,
      deviceCode: deviceCode,
      status: 0,
      value: 0.0,
      valueUnit: this.sensors[this._id + "/0/" + channel].deviceMap.ValueUnit,
      constantK: 0,
      constantP: 0
    }
    this.sensors[this._id + "/0/" + channel] = {
      ...data,
      edit: new Sensor(this._id, data, this._id + "/1/" + channel)
    }

  }
  cancelNodeConfig() {
    if (this.disableSensorEdit) {
      console.log("this.disableSensorEdit", this.disableSensorEdit);
      this.sensors = JSON.parse(JSON.stringify(nodeConfig.deviceNodes[this._id].sensors));
      this.disableSensorEdit = false;
    }
    if (this.disableActuatorEdit) {
      console.log("this.disableActuatorEdit", this.disableActuatorEdit);
      this.actuatorRetractables = JSON.parse(JSON.stringify(nodeConfig.deviceNodes[this._id].actuatorRetractables));
      this.actuatorSwitches = JSON.parse(JSON.stringify(nodeConfig.deviceNodes[this._id].actuatorSwitches));
      this.disableActuatorEdit = false;
      this.noOfDualChannels = Object.keys(nodeConfig.deviceNodes[this._id].actuatorRetractables).length;
    }
    this.deviceMapper = nodeConfig.deviceNodes[this._id].deviceMapper;
  }
  changeNodeName() {
    nodeConfig.deviceNodes[this._id].name = this.name;
    smartFarm.send({
      topic: "nodeConfig/changeNodeName",
      collection: "deviceNodes",
      operation: "updateOne",
      payload: [{
        _id: this._id,
      }, {
        $set: {
          name: this.name,
        }
      }, {
        upsert: true
      }]
    });
  }
  writeDeviceMapper() {
    // 맵퍼를 구성하여 1301~ 1301+채널수만큼 저장한다.
    // 맵퍼 재구성 조건, 1. 개폐기 채널수가 바뀌었을때, 2. 센서 장치코드가 바뀌었을때
    let configNode = this;
    modal.value = {
      icon: "priority_high",
      alert: true,
      label: "장치맵수정",
      text: "슬레이브주소 " + + configNode._id + "의 장치맵을 변경하시겠습니까?",
      onConfirm: function () {
        if (configNode.mapInfo.isTYMap) {
          // 티와이 맵의 경우 추가된 인자의 위치를 구해서 맵퍼 배열에 끼워 넣어야 한다.
          console.log("configNode.sensors", configNode.sensors);
          let sensorMapper = Object.keys(configNode.sensors).map((sensorId) => {
            if (configNode.sensors[sensorId].edit.deviceCode > 0) {
              console.log("configNode.sensors[", sensorId, "].edit.deviceCode", configNode.sensors[sensorId].edit.deviceCode);
              configNode.sensors[sensorId].name = configNode.sensors[sensorId].edit.name;
              configNode.sensors[sensorId].deviceCode = configNode.sensors[sensorId].edit.deviceCode;
              configNode.sensors[sensorId].channel = configNode.sensors[sensorId].edit.channel;
              return (configNode.sensors[sensorId].edit.deviceCode & 0xFF) | configNode.sensors[sensorId].edit.channel << 8;
            }
          }).filter(deviceCode => deviceCode > 0);
          let actuatorRetractableMaper = Object.keys(configNode.actuatorRetractables).map(actuatorRetractableId => {
            return (configNode.actuatorRetractables[actuatorRetractableId].deviceCode & 0xFF) | configNode.actuatorRetractables[actuatorRetractableId].channel << 8;
          });
          let actuatorSwitchMapper = Object.keys(configNode.actuatorSwitches).map(actuatorSwitchId => {
            return (configNode.actuatorSwitches[actuatorSwitchId].deviceCode & 0xFF) | configNode.actuatorSwitches[actuatorSwitchId].channel << 8;
          });
          configNode.deviceMapper = [...sensorMapper, ...actuatorRetractableMaper, ...actuatorSwitchMapper];
          configNode.deviceMapper.forEach((mapper) => {
            console.log("mapper", mapper & 0xFF);
          })
        } else {
          // TODO: defaultMap
        }
        let data = {
          topic: "nodeConfig/writeDeviceMapper",
          slaveAddress: parseInt(configNode._id, 10),
          configNode: configNode,    // 노드에 저장 성공시에 노드 설정을 업데이트 한다.
          collections: {
            deviceCodes: nodeConfig.deviceCodes,
            registerMaps: nodeConfig.registerMaps
          },
          payload: {
            fc: 16,
            unitid: parseInt(configNode._id, 10),
            address: 1301,
            quantity: configNode.deviceMapper.length,
            value: configNode.deviceMapper
          }
        }
        console.log("writeDeviceMapper deviceCodes", data.payload.value.map((object) => { return object & 0xFF }));
        console.log("writeDeviceMapper channels", data.payload.value.map((object) => { return object >> 8 }));
        smartFarm.send(data);
      },
      onCancel: function () {

      },
      yesNo: true
    }
  }
}
class DeviceNode {
  constructor(deviceNode) {
    this.name = deviceNode.name;
    this._id = deviceNode._id;
    this.mapInfo = deviceNode.mapInfo;
    this.nodeInfo = deviceNode.nodeInfo;
    this.sensors = this.buildSensors(this.mapInfo, deviceNode.sensors);
    this.actuatorRetractables = {};
    this.actuatorSwitches = {};
    // console.log(deviceNode.actuatorRetractables);
    // console.log(Object.keys(deviceNode.actuatorRetractables));
    Object.keys(deviceNode.actuatorRetractables).forEach((_id) => {
      this.actuatorRetractables[_id] = {
        ...deviceNode.actuatorRetractables[_id],
        edit: new ActuatorRetractable(deviceNode._id, deviceNode.actuatorRetractables[_id], _id)
      }
    });
    Object.keys(deviceNode.actuatorSwitches).forEach((_id) => {
      this.actuatorSwitches[_id] = {
        ...deviceNode.actuatorSwitches[_id],
        edit: new ActuatorSwitch(deviceNode._id, deviceNode.actuatorSwitches[_id], _id)
      }
    });
    // console.log("deviceNode.sensors", deviceNode.sensors);
    Object.keys(deviceNode.sensors).forEach((_id) => {
      this.sensors[_id] = {
        ...deviceNode.sensors[_id],
        edit: new Sensor(deviceNode._id, deviceNode.sensors[_id], _id)
      }
    })
  }
  buildSensors(mapInfo, sensors) {
    console.log("mapInfo", mapInfo)
    console.log("sensors", sensors)
    console.log("mapInfo.isTYMap && Object.keys(sensors).length > 0", mapInfo.isTYMap && Object.keys(sensors).length > 0)
    if (mapInfo.isTYNode && !mapInfo.isThirdParty && Object.keys(sensors).length > 0) {
      let tempSensors = {};
      for (let channel = 0; channel < 8; channel++) { // 물리채널설정, 8채널
        if (sensors[this._id + "/0/" + channel] === undefined) {
          tempSensors[this._id + "/0/" + channel] = {
            channel: channel,
            deviceCode: 0,
            name: "장치없음",
            productCode: 0,
            constantK: 0,
            constantP: 0,
            edit: new Sensor(this._id, {
              channel: channel,
              deviceCode: 0,
              name: "장치없음",
              productCode: 0,
              constantK: 0,
              constantP: 0,
            }, this._id + "/1/" + channel)
          }
          // console.log("tempSensors[", this._id, "/0/", channel, "]", tempSensors[this._id + "/0/" + channel]);
        } else {
          tempSensors[this._id + "/0/" + channel] = sensors[this._id + "/0/" + channel];
        }
        if (channel === 7) {
          return tempSensors;
        }
      }
    } else if (mapInfo.useDefaultMap && sensors.length > 0) {
      // todo default node
    } else {
      return sensors;
    }
  }
  configChannels(nodeConfig) {
    if (nodeConfig.configNode._id !== this._id) {
      nodeConfig.configNode = new ConfigNode(this);
      nodeConfig.configNode.show = true;
    } else {
      if (!nodeConfig.configNode.show) {
        nodeConfig.configNode.show = true;
      } else {
        nodeConfig.configNode.show = false;
        return;
      }
    }
  }
  readChannels(smartFarm) {
    Object.keys(this.actuatorRetractables).forEach((actuatorRetractableId) => {
      console.log(this.actuatorRetractables[actuatorRetractableId]);
      this.actuatorRetractables[actuatorRetractableId].edit.readChannelInfo(smartFarm);
    });
    Object.keys(this.actuatorSwitches).forEach((actuatorSwitchId) => {
      this.actuatorSwitches[actuatorSwitchId].edit.readChannelInfo(smartFarm);
    });
    Object.keys(this.sensors).forEach((sensorId) => {
      if (this.sensors[sensorId].edit.deviceCode > 0) {
        this.sensors[sensorId].edit.readChannelInfo(smartFarm);
      }
    });
  }
}
const readTextFile = (file, callback) => {
  var rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4 && rawFile.status == "200") {
      callback(rawFile.responseText);
    }
  }
  rawFile.send(null);
}
watch(msg, (msg) => {
  // console.log("configNode", msg);
  if (msg.topic.startsWith('nodeConfig')) {
    var topic = msg.topic.split("/")[1];
    // console.log("nodeConfig", msg);
  } else {
    return;
  }
  switch (
  String(topic) // ui로 요청되는 topic에 따라 동작을 한다
  ) {
    case 'deviceCodes':
      if (msg.payload.length === 0) {
        readTextFile("./deviceCodes.json", function (text) {
          const deviceCodes = JSON.parse(text);
          deviceCodes.forEach((deviceCode, index) => {
            var data = {
              collection: "deviceCodes",
              operation: "insertOne",
              payload: deviceCode
            }
            data.topic = "nodeConfig/insertDeviceCode"
            smartFarm.send(data);
            if (index === deviceCodes.length - 1) {
              smartFarm.send({
                topic: "nodeConfig/defaultMaps",
                collection: "defaultMaps",
                operation: "find.toArray",
              });
            }
          })
        });
      } else {
        nodeConfig.deviceCodes = JSON.parse(JSON.stringify(msg.payload));
        smartFarm.send({
          topic: "nodeConfig/defaultMaps",
          collection: "defaultMaps",
          operation: "find.toArray",
        });
      }
      break;
    case 'defaultMaps':
      if (msg.payload.length === 0) {
        readTextFile("./defaultMaps.json", function (text) {
          const maps = JSON.parse(text);
          maps.forEach((map, index) => {
            var data = {
              collection: "defaultMaps",
              operation: "insertOne",
              payload: map
            }
            data.topic = "nodeConfig/insertMap"
            smartFarm.send(data);
            if (index === maps.length - 1) {
              smartFarm.send({
                topic: "nodeConfig/registerMaps",
                collection: "registerMaps",
                operation: "find.toArray",
              });
            }
          })
          console.log(data);
        });
      } else {
        smartFarm.send({
          topic: "nodeConfig/registerMaps",
          collection: "registerMaps",
          operation: "find.toArray",
        });
      }
    case 'registerMaps':
      msg.payload.forEach((registerMap) => { // 쿼리한 맵들을 registerMaps 오브젝트에 담는다.
        nodeConfig.registerMaps[registerMap._id] = {};
        nodeConfig.registerMaps[registerMap._id] = JSON.parse(JSON.stringify(registerMap));
        if (msg.topic === 'registerMaps') {
          nodeConfig.registerMaps[registerMap._id].collection = 'registerMaps';
        } else {
          nodeConfig.registerMaps[registerMap._id].collection = 'defaultMaps';
        }
      });
      if (topic === 'registerMaps') {
        smartFarm.send({
          topic: "nodeConfig/deviceNodes",
          collection: "deviceNodes",
          operation: "find.toArray"
        });
      }
      break;
    case "deviceNodes":
      msg.payload.forEach(deviceNode => {
        nodeConfig.deviceNodes[deviceNode._id] = new DeviceNode(JSON.parse(JSON.stringify(deviceNode)));
      })
      break;
    case "configNode":
      console.log("configNode", msg);
      nodeConfig.deviceNodes[msg.deviceNode._id] = new DeviceNode(JSON.parse(JSON.stringify(msg.deviceNode)));
      if (msg.collections !== undefined) {
        nodeConfig.registerMaps = JSON.parse(JSON.stringify(msg.collections.registerMaps));
        nodeConfig.deviceCodes = JSON.parse(JSON.stringify(msg.collections.deviceCodes));
      }
      console.log("nodeConfig.deviceNodes[ ", msg.deviceNode._id, "] ", nodeConfig.deviceNodes[msg.deviceNode._id])
      break;
    case 'writeDeviceMapper':
      console.log("writeDeviceMapper", msg);
      nodeConfig.deviceNodes[msg.slaveAddress].actuatorRetractables = {};
      Object.keys(msg.configNode.actuatorRetractables).forEach((_id) => {
        nodeConfig.deviceNodes[msg.slaveAddress].actuatorRetractables[_id] = {
          ...msg.configNode.actuatorRetractables[_id],
          edit: new ActuatorRetractable(msg.slaveAddress, msg.configNode.actuatorRetractables[_id], _id)
        }
      });
      nodeConfig.deviceNodes[msg.slaveAddress].actuatorSwitches = {};
      Object.keys(msg.configNode.actuatorSwitches).forEach((_id) => {
        nodeConfig.deviceNodes[msg.slaveAddress].actuatorSwitches[_id] = {
          ...msg.configNode.actuatorSwitches[_id],
          edit: new ActuatorSwitch(msg.slaveAddress, msg.configNode.actuatorSwitches[_id], _id)
        }
      });
      nodeConfig.deviceNodes[msg.slaveAddress].sensors = {};
      Object.keys(msg.configNode.sensors).forEach((_id) => {
        nodeConfig.deviceNodes[msg.slaveAddress].sensors[_id] = {
          ...msg.configNode.sensors[_id],
          edit: new Sensor(msg.slaveAddress, msg.configNode.sensors[_id], _id)
        }
      });
      nodeConfig.deviceNodes[msg.slaveAddress].sensors = nodeConfig.deviceNodes[msg.slaveAddress].buildSensors(nodeConfig.deviceNodes[msg.slaveAddress].mapInfo, nodeConfig.deviceNodes[msg.slaveAddress].sensors);
      nodeConfig.configNode.disableActuatorEdit = false;
      nodeConfig.configNode.disableSensorEdit = false;
      // nodeConfig.deviceNodes[msg.slaveAddress].actuatorRetractables = JSON.parse(JSON.stringify(msg.configNode.actuatorRetractables));
      // nodeConfig.deviceNodes[msg.slaveAddress].actuatorSwitches = JSON.parse(JSON.stringify(msg.configNode.actuatorSwitches));
      // nodeConfig.deviceNodes[msg.slaveAddress].sensors = JSON.parse(JSON.stringify(msg.configNode.sensors));
      // nodeConfig.deviceNodes[msg.slaveAddress].deviceMapper = JSON.parse(JSON.stringify(msg.configNode.deviceMapper));
      console.log("nodeConfig.configNode[", msg.slaveAddress, "]", nodeConfig.deviceNodes[msg.slaveAddress]);
      nodeConfig.configNode = new ConfigNode(nodeConfig.deviceNodes[msg.slaveAddress]);
      console.log(nodeConfig.configNode);
      nodeConfig.configNode.show = true;
      console.log("nodeConfig.deviceNodes[", msg.slaveAddress, "].actuatorRetractables", nodeConfig.deviceNodes[msg.slaveAddress].actuatorRetractables);
      console.log("nodeConfig.deviceNodes[", msg.slaveAddress, "].actuatorSwitches", nodeConfig.deviceNodes[msg.slaveAddress].actuatorSwitches);
      console.log("nodeConfig.deviceNodes[", msg.slaveAddress, "].sensors", nodeConfig.deviceNodes[msg.slaveAddress].sensors);
      break;
    case "removeNodeConfig": // 노드정보 삭제시, tyNodes의 노드정보를 삭제하고, deviceInfo의 포트정보들을 삭제 한후
      var data = {
        topic: "nodeConfig/removeDeviceInfo",
        collection: "deviceInfo",
        operation: "deleteMany",
        slaveAddress: msg.slaveAddress,
        payload: {
          slaveAddress: msg.slaveAddress,
        },
      };
      console.log(data);
      smartFarm.send(data);
      break;
    case 'readChannelInfo':
      console.log("readChannelInfo", msg);
      console.log("nodeConfig.configNode", nodeConfig.configNode);
      const payload = JSON.parse(JSON.stringify(msg.payload));
      console.log("nodeConfig.configNode[", msg.deviceArray, "][", msg.id, "].edit.isRomValue");
      nodeConfig.configNode[msg.deviceArray][msg.id].edit.isRomValue = payload.isRomValue;
      nodeConfig.configNode[msg.deviceArray][msg.id].edit.disabled = false;
      console.log("nodeConfig.configNode[", msg.deviceArray, "][", msg.id, "].edit.isRomValue", nodeConfig.configNode[msg.deviceArray][msg.id].edit.isRomValue);
      nodeConfig.configNode[msg.deviceArray][msg.id].deviceCode = nodeConfig.configNode[msg.deviceArray][msg.id].edit.deviceCode = payload.deviceCode;
      nodeConfig.configNode[msg.deviceArray][msg.id].productCode = nodeConfig.configNode[msg.deviceArray][msg.id].edit.productCode = payload.productCode;
      if (msg.deviceType === "actuatorRetractable") {
        nodeConfig.configNode[msg.deviceArray][msg.id].openTime = nodeConfig.configNode[msg.deviceArray][msg.id].edit.openTime = payload.openTime;
        nodeConfig.configNode[msg.deviceArray][msg.id].closeTime = nodeConfig.configNode[msg.deviceArray][msg.id].edit.closeTime = payload.closeTime;
      } else if (msg.deviceType === "actuatorSwitch") {
        nodeConfig.configNode[msg.deviceArray][msg.id].ratio = nodeConfig.configNode[msg.deviceArray][msg.id].edit.ratio = payload.ratio;
      } else if (msg.deviceType === "sensor") {
        nodeConfig.configNode[msg.deviceArray][msg.id].constantK = nodeConfig.configNode[msg.deviceArray][msg.id].edit.constantK = payload.constantK;
        nodeConfig.configNode[msg.deviceArray][msg.id].constantP = nodeConfig.configNode[msg.deviceArray][msg.id].edit.constantP = payload.constantP;
      }
      console.log("nodeConfig.configNode", msg.deviceArray, "][", msg.id, "]", nodeConfig.configNode[msg.deviceArray][msg.id]);
      break;
    case "setControllerName":
      console.log("setControllerName");
      nodeConfig.editControllerName.edit = false;
      break;
  }
});

let modal = ref({
  alert: false,
  icon: "delete",
  label: "",
  text: "",
  yesNo: true,
  onConfirm: {},
  onCancel: {},
  data: null
})

const nodeConfig = reactive({
  deviceNodes: {},
  editControllerName: { //제어기 명을 설정한다, 변경함수는 변수안에 있고 DB를 저장후 응답메세지에서 화면을 갱신한다.
    edit: false,
    name: smartFarm.controller.name,  // 편집 기본갑설정
    nickName: smartFarm.controller.nickName,  // 편집 기본갑설정
    masterAddress: smartFarm.controller.masterAddress,  // 편집 기본갑설정
    setControllerName: function () {
      if (smartFarm.controller.name !== this.name || smartFarm.controller.nickName !== this.nickName || smartFarm.controller.masterAddress !== this.masterAddress) {
        smartFarm.send({
          topic: 'nodeConfig/setControllerName',
          collection: "controllerInfo",
          operation: "update",
          name: this.name,  // 화면갱신용
          nickName: this.nickName,  // 화면갱신용
          masterAddress: parseInt(this.masterAddress, 10),  // 화면갱신용
          payload: [{
            _id: smartFarm.controller._id
          }, {
            $set: {
              name: this.name,  // DB저장용
              nickName: this.nickName,  // DB저장용
              masterAddress: parseInt(this.masterAddress, 10) // DB저장용
            }
          }]
        });
      } else {
        this.edit = false;
      }
    }
  },
  configNode: {},
  // addressData: "168,153,160,144,184",
  // addressData: "184,144",
  addressData: "176",
  // includeDeviceSearch: true,
  registerMaps: {},
  registerMap: {},
  deviceCodes: [],
  getIndex: function (id) {
    var index = this.deviceNodes
      .map(function (node) {
        return node._id;
      })
      .indexOf(id);
    return index;
  },
  verifyAddresses: function (addressData) {
    return new Promise((resolve, reject) => {
      var addresses = [];
      if (addressData !== null && addressData.length !== 0) {
        addressData.split(",").forEach((address) => {
          if (address.includes("-")) {
            // console.log(address);
            let addressSplit = address.split("-");
            let start = parseInt(addressSplit[0]);
            let end = parseInt(addressSplit[1]);
            // console.log(start);
            // console.log(end);
            for (var i = start; i < end; i++) {
              if (i < 1 || i > 247 || i < 1 || i > 247) {
                reject("주소는 1-247사이로 지정하세요");
              } else {
                // console.log(address);
                addresses.push(parseInt(i, 10));
              }
            }
          } else {
            // console.log(address);
            if (address < 1 || address > 247 || address < 1 || address > 247) {
              reject("주소는 1-247사이로 지정하세요");
            } else {
              addresses.push(parseInt(address, 10));
            }
          }
        });
        console.log(addresses);
        resolve(addresses);
      } else {
        console.log("주소값을 넣으세요")
        reject("주소값을 넣으세요");
      }
    });
  },
  searchDevices: function (slaveAddresses) {
    console.log("deviceCodes", nodeConfig.deviceCodes);
    slaveAddresses.forEach((slaveAddress) => {
      smartFarm.send({
        slaveAddress: parseInt(slaveAddress, 10),
        payload: {
          fc: 3,
          unitid: parseInt(slaveAddress, 10),
          address: 1,
          quantity: 8,
        },
        topic: "nodeConfig/searchDevices",
        collections: {
          deviceCodes: nodeConfig.deviceCodes,
          registerMaps: nodeConfig.registerMaps
        }
      });
    });
  },
  designatedSearch: function (addressData) {
    if (addressData !== null) {
      this.verifyAddresses(this.addressData)
        .then((result) => {
          this.searchDevices(result);
        })
        .catch((error) => {
          modal.value = {
            icon: "report_problem",
            alert: true,
            label: "에러",
            text: JSON.stringify(error)
          }
        });
    } else {
      this.searchDevices([this.controller.masterAddress]);
    }
  },
  removeNodeConfig: function (id) {
    modal.value = {
      icon: "priority_high",
      alert: true,
      label: "삭제",
      text: "슬레이브 주소" + id + "를 삭제하시겠습니까?",
      onConfirm: function () {
        nodeConfig.configNode.show = false;
        smartFarm.send({
          topic: "nodeConfig/removeNodeConfig",
          collection: "deviceNodes",
          operation: "deleteOne",
          slaveAddress: id,
          payload: {
            _id: id,
          }
        });
        smartFarm.send({
          topic: "nodeConfig/removeNodeConfig",
          collection: "registerMaps",
          operation: "deleteOne",
          slaveAddress: id,
          payload: {
            _id: id,
          }
        });
        delete nodeConfig.deviceNodes[id];
      },
      onCancel: function () {
      },
      yesNo: true
    }
  },
  initFlashes: function (addressData) {
    nodeConfig.verifyAddresses(addressData)
      .then((addresses) => {
        console.log(addresses);
        modal.value = {
          icon: "priority_high",
          alert: true,
          label: "기본값복원",
          text: JSON.stringify(addresses) + "를 기본값으로 복원 하시겠습니까?",
          data: addresses,
          onConfirm: function () {
            this.data.forEach((address) => {
              // addresses배열을 flow에서 처리하려 하니 function flow는 정상이었지만 file function에서 마지막 배열만 가는 버그가 있다. 그래서 ui에서 modbusque로 바로 보낸다.
              smartFarm.send({
                topic: "nodeConfig/initFlashes",
                slaveAddress: parseInt(address, 10),
                payload: {
                  fc: 6,
                  unitid: parseInt(address, 10),
                  address: 1399,
                  quantity: 1,
                  value: 0xfffe
                }
              });
            });
          },
          onCancel: function () {
          },
          yesNo: true
        }
      })
      .catch((error) => {
        modal.value = {
          icon: "report_problem",
          alert: true,
          label: "에러",
          text: error,
          yesNo: false
        }
      });
  },
  resetDevices: function (addressData) {
    this.verifyAddresses(addressData)
      .then((addresses) => {
        console.log(addresses);
        modal.value = {
          icon: "priority_high",
          alert: true,
          label: "재시작",
          text: JSON.stringify(addresses) + "를 재시작 하시겠습니까?",
          data: addresses,
          onConfirm: function () {
            console.log("test")
            this.data.forEach((address) => {
              // addresses배열을 flow에서 처리하려 하니 function flow는 정상이었지만 file function에서 마지막 배열만 가는 버그가 있다. 그래서 ui에서 modbusque로 바로 보낸다.
              smartFarm.send({
                topic: "nodeConfig/resetDevices",
                slaveAddress: parseInt(address, 10),
                payload: {
                  fc: 6,
                  unitid: parseInt(address, 10),
                  address: 1399,
                  quantity: 1,
                  value: 0xfffd
                }
              });
            });
          },
          onCancel: function () {
          },
          yesNo: true
        }
      }).catch((error) => {
        modal.value = {
          icon: "report_problem",
          alert: true,
          label: "에러",
          text: error,
          yesNo: false
        }
      });
  }
});

onMounted(() => {
  console.log("nodeConfig mounted");
  msg.value = smartFarm.msg;
  smartFarm.send({
    topic: "nodeConfig/deviceCodes",
    collection: "deviceCodes",
    operation: "find.toArray",
  });
  window.scrollTo(0, 0);
});
</script>

<template>
  <q-dialog v-model="modal.alert" persistent>
    <q-card style="width: 300px;">
      <q-card-section class="row items-center">
        <q-avatar :icon="modal.icon" color="primary" text-color="white" />
        <span class="q-ml-sm">{{ modal.label }}</span>
      </q-card-section>
      <q-card-section class="q-pt-none">{{ modal.text }}</q-card-section>
      <q-card-actions align="right" v-if="modal.yesNo">
        <q-btn class="glossy" round color="deep-orange" label="예" style="width:60px" v-close-popup
          v-on:click="modal.onConfirm(modal.param)" />
        <q-btn class="glossy" round color="primary" label="아니오" style="width:60px" v-close-popup
          v-on:click="modal.onCancel(modal.param)" />
      </q-card-actions>
      <q-card-actions align="right" v-else>
        <q-btn class="glossy" round color="primary" label="확인" style="width:60px" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <div class="q-pa-md q-gutter-sm row">
    <q-card class="col">
      <q-card-section align="right">
        <q-btn color="red"
          v-on:click="nodeConfig.editControllerName.edit ? nodeConfig.editControllerName.edit = false : nodeConfig.editControllerName.edit = true">
          제어기명변경</q-btn>
      </q-card-section>
      <div v-show="nodeConfig.editControllerName.edit">
        <q-card-actions>
          <q-input outlined type="text" label="이름변경" placeholder="ex) 56,16" style="width: 100%"
            v-model="nodeConfig.editControllerName.name" class="q-gutter-sm">
          </q-input>
        </q-card-actions>
        <q-card-actions>
          <q-input outlined type="text" label="별명" placeholder="ex) 56,16" style="width: 100%"
            v-model="nodeConfig.editControllerName.nickName" class="q-gutter-sm">
          </q-input>
        </q-card-actions>
        <q-card-actions>
          <q-input outlined type="text" label="마스터어드레스" placeholder="ex) 56,16" style="width: 100%"
            v-model="nodeConfig.editControllerName.masterAddress" class="q-gutter-sm">
          </q-input>
        </q-card-actions>
        <q-card-actions align="right">
          <q-btn color="primary" style="width: 100px" v-on:click="nodeConfig.editControllerName.setControllerName()">저장
          </q-btn>
        </q-card-actions>
      </div>
    </q-card>
    <q-card class="col">
      <q-card-actions align="center">
        <q-btn class="glossy col-5" rounded color="secondary" text-color="black" label="자동검색" />
        <q-btn class="glossy col-5" rounded color="warning" text-color="black" label="검색중지" />
      </q-card-actions>
    </q-card>
    <q-card class="col">
      <div class="q-pa-md q-gutter-sm row">
        <!-- <q-checkbox class="col-3" left-label v-model="nodeConfig.includeDeviceSearch" label="장치검색 포함" /> -->
        <q-input class="col-4" outlined type="text" label="검색할 주소를 넣으세요" placeholder="ex) 56,16"
          v-model="nodeConfig.addressData" />
        <q-btn class="col-3" rounded color="primary" v-on:click="nodeConfig.designatedSearch(nodeConfig.addressData)">
          지정검색
          <template v-slot:loading>
            <q-spinner-hourglass class="on-left" />검색중...
          </template>
        </q-btn>
      </div>
      <q-card-actions align="center">
        <q-btn rounded text-color="white" color="red" style="width: 40%"
          v-on:click="nodeConfig.resetDevices(nodeConfig.addressData)">장치리셋</q-btn>
        <q-btn rounded text-color="black" color="warning" style="width: 40%"
          v-on:click="nodeConfig.initFlashes(nodeConfig.addressData)">장치초기화</q-btn>
      </q-card-actions>
    </q-card>
  </div>
  <div class="q-pa-md row items-start q-gutter-md">
    <q-card v-for="deviceNode in nodeConfig.deviceNodes" v-bind:key="deviceNode._id">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">{{ deviceNode.name + ' : ' + deviceNode._id }}</div>
        <div class="text-subtitle2">{{ deviceNode.mapInfo.base }}</div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="info" style="width: 100px" v-on:click="deviceNode.configChannels(nodeConfig)">
          채널설정</q-btn>
        <q-btn color="red" style="width: 100px" v-on:click="nodeConfig.removeNodeConfig(deviceNode._id)">삭제</q-btn>
        <q-btn color="warning" style="width: 100px" v-on:click="deviceNode.readChannels(smartFarm)"
          :disabled="!nodeConfig.configNode.show || nodeConfig.configNode._id !== deviceNode._id">
          검색</q-btn>
      </q-card-actions>
    </q-card>
  </div>
  <div v-if="nodeConfig.configNode.show">
    <div class="q-pa-md q-gutter-sm row">
      <div class="col text-h4">{{ nodeConfig.configNode.name + ': ' + nodeConfig.configNode._id }}</div>
      <div class="col text-left">
        <q-btn color="blue" style="width: 120px"
          v-on:click="nodeConfig.configNode.editName ? nodeConfig.configNode.editName = false : nodeConfig.configNode.editName = true">
          노드이름변경</q-btn>
      </div>
      <div class="col text-right">
        <q-btn color="secondary" style="width: 100px"
          v-if="nodeConfig.configNode.disableActuatorEdit || nodeConfig.configNode.disableSensorEdit"
          v-on:click="nodeConfig.configNode.writeDeviceMapper()">설정저장</q-btn>
        &nbsp;
        <q-btn color="orange" style="width: 100px"
          v-if="nodeConfig.configNode.disableActuatorEdit || nodeConfig.configNode.disableSensorEdit"
          v-on:click="nodeConfig.configNode.cancelNodeConfig()">취소</q-btn>
      </div>
    </div>
    <div class="container" style="flex-wrap: wrap;" v-show="nodeConfig.configNode.editName">
      <div class="q-pa-md q-gutter-sm row">
        <div class="col text-right"></div>
        <div class="col text-right"></div>
        <div class="col text-right">이름 변경</div>
        <div class="col text-let">
          <q-input outlined dense type="text" style="width: 100%" :value="nodeConfig.configNode.name"
            v-model="nodeConfig.configNode.name"></q-input>
        </div>
        <q-btn color="red" style="width: 100px" v-on:click="nodeConfig.configNode.changeNodeName()">저장</q-btn>
      </div>
    </div>
    <div v-if="nodeConfig.configNode.nodeInfo.noOfDevices > 0">
      <div
        v-if="Object.keys(nodeConfig.configNode.actuatorRetractables).length > 0 && Object.keys(nodeConfig.configNode.actuatorSwitches).length > 0">
        <div class="text-h4 text-center"
          v-if="nodeConfig.configNode.nodeInfo.nodeType !== 1 && nodeConfig.configNode._id !== 175">구동기 포트 설정</div>
        <div class="q-pa-md q-gutter-sm row"
          v-if="!nodeConfig.configNode.mapInfo.isThirdParty && nodeConfig.configNode.nodeInfo.nodeType !== 1 && nodeConfig.configNode._id !== 175">
          <div class="col text-right">개폐기 포트수</div>
          <div class="col text-left justify-center">
            <div class="col">
              <q-input outlined type="number" style="width: 100%" v-model="nodeConfig.configNode.noOfDualChannels"
                @update:model-value="nodeConfig.configNode.noOfDualChannelsChange()" min="0" max="8"></q-input>
            </div>
          </div>
        </div>
      </div>
      <div class="q-pa-md q-gutter-sm row">
        <div class="col text-center">제품시리얼:{{ nodeConfig.configNode.nodeInfo.refNumber }}</div>
        <div class="col text-center">디바이스맵:{{ nodeConfig.configNode.mapInfo.name }}</div>
        <div class="col text-center justify-center">
          <q-btn-dropdown color="primary" label="맵선택" v-if="false">
            <!--타사 노드 등록시에 추가할예정-->
            <q-list>
              <q-item clickable v-close-popup v-for="map in Object.keys(nodeConfig.registerMaps)" v-bind:key="map"
                v-on:click="nodeConfig.selectDeviceMap(map)">
                <q-item-section>
                  <q-item-label>{{ map }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
      <div class="q-pa-md q-gutter-sm row">
        <div v-show="!nodeConfig.configNode.mapInfo.isThirdParty">티와이맵은 디바이스맵을 설정하여 불러올수 있다.</div>
        <div v-show="nodeConfig.configNode.mapInfo.isThirdParty">디폴트맵의 센서포트는 종류를 바꿀수 있고, 구동기포트는 개폐기의 수를 조절할수 있다.</div>
      </div>
      <div class="q-pa-md"
        v-if="Object.keys(nodeConfig.configNode.actuatorRetractables).length > 0 && Object.keys(nodeConfig.configNode.actuatorSwitches).length > 0">
        <div class="text-h5 text-center" v-if="Object.keys(nodeConfig.configNode.actuatorRetractables).length > 0">
          개폐기포트설정</div>
        <div class="q-pa-md" v-if="nodeConfig.configNode.noOfDualChannels > 0">
          <q-markup-table>
            <thead>
              <tr>
                <th>채널번호</th>
                <th>장치코드</th>
                <th>장치이름</th>
                <th>제품코드</th>
                <th>열기시간</th>
                <th>닫기시간</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(actuatorRetractable, index) in nodeConfig.configNode.actuatorRetractables" v-bind:key="index">
                <td class="text-center">{{ actuatorRetractable.edit.channel }}</td>
                <td class="text-center">{{ actuatorRetractable.edit.deviceCode }}</td>
                <td :class="actuatorRetractable.edit.isRomValue ? 'text-center text-black' : 'text-center text-grey'">{{
                    actuatorRetractable.edit.name
                }}
                </td>
                <td class="text-center">
                  <q-input outlined dense type="number" style="width: 100%"
                    v-model="actuatorRetractable.edit.productCode">
                  </q-input>
                </td>
                <td class="text-center">
                  <q-input outlined dense type="number" style="width: 100%" v-model="actuatorRetractable.edit.openTime">
                  </q-input>
                </td>
                <td class="text-center">
                  <q-input outlined dense type="number" style="width: 100%"
                    v-model="actuatorRetractable.edit.closeTime">
                  </q-input>
                </td>
                <td width="100px">
                  <q-btn color="warning" style="width: 100px"
                    v-on:click="actuatorRetractable.edit.writeChannelInfo(smartFarm)"
                    :disabled="nodeConfig.configNode.mapInfo.isThirdParty || nodeConfig.configNode.disableActuatorEdit || actuatorRetractable.edit.disabled">
                    저장</q-btn>
                </td>
                <td width="100px">
                  <q-btn color="green" style="width: 100px"
                    v-on:click="actuatorRetractable.edit.readChannelInfo(smartFarm)"
                    :disabled="nodeConfig.configNode.mapInfo.isThirdParty || nodeConfig.configNode.disableActuatorEdit">
                    읽기
                  </q-btn>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
        <div class="text-h5 text-center" v-if="Object.keys(nodeConfig.configNode.actuatorSwitches).length > 0">스위치포트설정
        </div>
        <div class="q-pa-md">
          <q-markup-table>
            <thead>
              <tr>
                <th>채널번호</th>
                <th>장치코드</th>
                <th>장치이름</th>
                <th>제품코드</th>
                <th>개방강도</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(actuatorSwitch, index) in nodeConfig.configNode.actuatorSwitches" v-bind:key="index">
                <td class="text-center">{{ actuatorSwitch.edit.channel }}</td>
                <td class="text-center">{{ actuatorSwitch.edit.deviceCode }}</td>
                <td :class="actuatorSwitch.edit.isRomValue ? 'text-center text-black' : 'text-center text-grey'">{{
                    actuatorSwitch.edit.name
                }}
                </td>
                <td class="text-center">
                  <q-input outlined dense type="number" style="width: 100%" v-model="actuatorSwitch.edit.productCode">
                  </q-input>
                </td>
                <td class="text-center">
                  <q-input outlined dense type="number" style="width: 100%" v-model="actuatorSwitch.edit.ratio">
                  </q-input>
                </td>
                <td width="100px">
                  <q-btn color="warning" style="width: 100px"
                    v-on:click="actuatorSwitch.edit.writeChannelInfo(smartFarm)"
                    :disabled="nodeConfig.configNode.mapInfo.isThirdParty || nodeConfig.configNode.disableActuatorEdit || actuatorSwitch.edit.disabled">
                    저장</q-btn>
                </td>
                <td width="100px">
                  <q-btn color="green" style="width: 100px" v-on:click="actuatorSwitch.edit.readChannelInfo(smartFarm)"
                    :disabled="nodeConfig.configNode.mapInfo.isThirdParty || nodeConfig.configNode.disableActuatorEdit">
                    읽기
                  </q-btn>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
      <div class="q-pa-md q-gutter-sm row">
        <div class="col text-right">
          <q-btn color="secondary" style="width: 100px"
            v-if="nodeConfig.configNode.disableActuatorEdit || nodeConfig.configNode.disableSensorEdit"
            v-on:click="nodeConfig.configNode.writeDeviceMapper()">설정저장</q-btn>
          &nbsp;
          <q-btn color="orange" style="width: 100px"
            v-if="nodeConfig.configNode.disableActuatorEdit || nodeConfig.configNode.disableSensorEdit"
            v-on:click="nodeConfig.configNode.cancelNodeConfig()">취소</q-btn>
        </div>
      </div>
      <div class="q-pa-md"
        v-if="nodeConfig.configNode.nodeInfo.nodeType !== 2 && Object.keys(nodeConfig.configNode.sensors).length > 0">
        <div class="text-h5 text-center">센서포트설정</div>
        <q-markup-table>
          <table class="table">
            <thead>
              <tr>
                <th>채널번호</th>
                <th v-if="!nodeConfig.configNode.mapInfo.isThirdparty"></th>
                <th>장치코드</th>
                <th>장치이름</th>
                <th>제품코드</th>
                <th>채널상수K</th>
                <th>채널상수P</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sensor in nodeConfig.configNode.sensors" v-bind:key="sensor.channel">
                <td class="text-center">{{ sensor.edit.channel }}</td>
                <td v-if="!nodeConfig.configNode.mapInfo.isThirdParty">
                  <q-btn-dropdown color="primary" label="장치코드">
                    <q-list>
                      <q-item clickable v-close-popup
                        v-for="sensorCode in nodeConfig.deviceCodes.filter(item => item._id < 100).sort((x, y) => x._id - y._id)"
                        :key="sensorCode._id"
                        v-on:click="nodeConfig.configNode.updateSensorCode(sensorCode._id, sensorCode.device.Name, sensor.channel)">
                        <q-item-section>
                          <q-item-label>{{ sensorCode._id + ":" + sensorCode.device.Name }}</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup
                        v-on:click="nodeConfig.configNode.updateSensorCode(0, '장치없음', sensor.channel)">
                        <q-item-section>
                          <q-item-label> 0:장치없음</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                </td>
                <td>{{ sensor.edit.deviceCode }}</td>
                <td :class="sensor.edit.isRomValue ? 'text-center text-black' : 'text-center text-grey'">{{
                    sensor.edit.name
                }}
                </td>
                <td>
                  <q-input outlined dense type="number" style="width: 100%" v-model="sensor.edit.productCode"
                    :disable="nodeConfig.configNode.mapInfo.isThirdParty || sensor.deviceCode === 0 || nodeConfig.configNode.disableSensorEdit || sensor.edit.disabled">
                  </q-input>
                </td>
                <td>
                  <q-input outlined dense type="number" step="0.01" style="width: 100%" v-model="sensor.edit.constantK"
                    :disable="nodeConfig.configNode.mapInfo.isThirdParty || sensor.deviceCode === 0 || nodeConfig.configNode.disableSensorEdit || sensor.edit.disabled">
                  </q-input>
                </td>
                <td>
                  <q-input outlined dense type="number" step="0.01" style="width: 100%" v-model="sensor.edit.constantP"
                    :disable="nodeConfig.configNode.mapInfo.isThirdParty || sensor.deviceCode === 0 || nodeConfig.configNode.disableSensorEdit || sensor.edit.disabled">
                  </q-input>
                </td>
                <td width="100px">
                  <q-btn color="warning" style="width: 100px" v-on:click="sensor.edit.writeChannelInfo(smartFarm)"
                    :disabled="nodeConfig.configNode.mapInfo.isThirdParty || sensor.deviceCode === 0 || nodeConfig.configNode.disableSensorEdit || sensor.edit.disabled">
                    저장</q-btn>
                </td>
                <td width="100px">
                  <q-btn color="green" style="width: 100px" v-on:click="sensor.edit.readChannelInfo(smartFarm)"
                    :disabled="nodeConfig.configNode.mapInfo.isThirdParty || sensor.deviceCode === 0 || nodeConfig.configNode.disableSensorEdit">
                    읽기</q-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </q-markup-table>
      </div>
    </div>
  </div>
  <q-footer bordered :class="smartFarm.color[smartFarm.menuIndex].bg">
    <q-toolbar>
      <q-toolbar-title>
        <q-avatar>
          <img src="../assets/tyeng.png" />
        </q-avatar>티와이이엔지 스마트 제어
      </q-toolbar-title>
    </q-toolbar>
  </q-footer>
</template>