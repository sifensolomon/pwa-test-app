<script setup>
import { onMounted, inject, reactive, watch, ref, toRef } from 'vue';
const functionCode = ref(6);
const command = ref("read");
let modal = ref({
  alert: false,
  icon: "delete",
  label: "",
  text: "",
  yesNo: true,
  onClick: {},
  data: null
})
const smartFarm = inject("smartFarm");
const msg = toRef(smartFarm, 'msg');
//================노드레드 uibuilder에서 온 메세지를 smartFarm변수에 담아 변경감시한다.
//================uibuilder 객체를 privide하면 페이지 변경할때마다 소켓이 생기고 쌓이는문제가 있어 App.vue에서 한 선언하고 smartFarm변수에 담아 보낸다.
watch(msg, (msg) => {
  if (msg.topic.startsWith('nodeDefault')) {
    var topic = msg.topic.split("/")[1];
  } else {
    return;
  }
  switch (
  String(topic) // ui로 요청되는 topic에 따라 동작을 한다
  ) {
    case 'deviceCodes':
      console.log(msg);
      if (msg.payload.length === 0) {
        readTextFile("./deviceCodes.json", function (text) {
          const deviceCodes = JSON.parse(text);
          deviceCodes.forEach((deviceCode, index) => {
            var data = {
              collection: "deviceCodes",
              operation: "insertOne",
              payload: deviceCode
            }
            data.topic = "nodeDefault/insertDeviceCode"
            smartFarm.send(data);
            if (index === deviceCodes.length - 1) {
              smartFarm.send({
                topic: "nodeDefault/defaultMaps",
                collection: "defaultMaps",
                operation: "find.toArray",
              });
            }
          })
        });
      } else {
        nodeDefault.deviceCodes = JSON.parse(JSON.stringify(msg.payload));
        smartFarm.send({
          topic: "nodeDefault/defaultMaps",
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
            data.topic = "nodeDefault/insertMap"
            smartFarm.send(data);
            if (index === maps.length - 1) {
              smartFarm.send({
                topic: "nodeDefault/registerMaps",
                collection: "registerMaps",
                operation: "find.toArray",
              });
            }
          })
          console.log(data);
        });
      } else {
        smartFarm.send({
          topic: "nodeDefault/registerMaps",
          collection: "registerMaps",
          operation: "find.toArray",
        });
      }
    case 'registerMaps':
      msg.payload.forEach((registerMap) => { // 쿼리한 맵들을 registerMaps 오브젝트에 담는다.
        nodeDefault.registerMaps[registerMap._id] = {};
        nodeDefault.registerMaps[registerMap._id] = JSON.parse(JSON.stringify(registerMap));
        if (msg.topic === 'registerMaps') {
          nodeDefault.registerMaps[registerMap._id].collection = 'registerMaps';
        } else {
          nodeDefault.registerMaps[registerMap._id].collection = 'defaultMaps';
        }
      });
      if (topic === 'registerMaps') {
        smartFarm.send({
          topic: "nodeDefault/deviceNodes",
          collection: "deviceNodes",
          operation: "find.toArray"
        });
      }
      break;
    case 'requestModbus':
      var addressIndex;
      var arrayPush = (description, registerCount, to, value) => {
        if (registerCount === "1/2") {
          if (to == "HighChar") {
            var wordValue = String.fromCharCode(value >> 8 & 0xFF);
          } else if (to == "LowChar") {
            var wordValue = String.fromCharCode(value & 0xFF);
          } else if (to == "High") {
            var wordValue = value >> 8 & 0xFF;
            if (address === 906) {
              // var wordValue = nodeDefault.byteToVal(value >> 8 & 0xFF).toString(2);
              wordValue = "0b" + wordValue.toString(2);
            }
          } else if (to == "Low") {
            var wordValue = value & 0xFF;
          }
        } else if (to === undefined) {
          var wordValue = value;
        } else if (to === "Int") {
          var wordValue = nodeDefault.byteToVal(value).getInt32(0);
        } else {
          // console.log("value", value);
          var wordValue = nodeDefault.byteToVal(value).getFloat32(0).toFixed(2);
        }
        nodeDefault.mapComponent.resultValues.push(nodeDefault.pushData(address, description, value, wordValue, registerCount));
      }
      // console.log(nodeDefault.mapComponent);
      console.log("msg", msg);
      nodeDefault.mapComponent.resultValues = [];
      nodeDefault.readResultShow = true;
      // var arrayCommonMap = [{
      //         address: 7,
      //         description: "노드시리얼번호",
      //         registerCount: 2,
      //         to: "Int"
      //     }, {
      //         address: 7,
      //         description: "노드시리얼번호",
      //         registerCount: 2,
      //         to: "Int"
      //     }]
      // msg.modbusRequest에 모드버스 요청정보가 들어가 있다.
      // 이것을 바탕으로 주소별 디폴트 맵 정보를 매핑한다.
      if (msg.modbusRequest !== undefined) {
        console.log("modbusRequest", msg.modbusRequest)
        var address = msg.modbusRequest.address;
        var data = JSON.parse(JSON.stringify(msg.payload.data));
        console.log("data", data)
        while (address < msg.modbusRequest.address + msg.modbusRequest.quantity) {
          var addressIndex = address - msg.modbusRequest.address;
          if (nodeDefault.mapComponent.arrayCommonMap.map((register) => {
            return register.address
          }).includes(address)) {
            var index = nodeDefault.mapComponent.arrayCommonMap.findIndex((register) => {
              return register.address == address
            })
            if (nodeDefault.mapComponent.arrayCommonMap[index].registerCount > 1) {
              console.log("registerCount", nodeDefault.mapComponent.arrayCommonMap[index].registerCount);
              console.log("addressIndex", addressIndex);
              var values = [];
              values[0] = data[addressIndex];
              values[1] = data[addressIndex + 1];
              console.log(values);
              arrayPush(nodeDefault.mapComponent.arrayCommonMap[index].description, nodeDefault.mapComponent.arrayCommonMap[index].registerCount, nodeDefault.mapComponent.arrayCommonMap[index].to, JSON.parse(JSON.stringify(values)))
              address += nodeDefault.mapComponent.arrayCommonMap[index].registerCount;
            } else if (nodeDefault.mapComponent.arrayCommonMap[index].to === 'High' || nodeDefault.mapComponent.arrayCommonMap[index].to === 'HighChar') { // 1바이트짜리 데이터는 연속해서 High Low로 배열에 넣어 놓는다.
              arrayPush(nodeDefault.mapComponent.arrayCommonMap[index].description, nodeDefault.mapComponent.arrayCommonMap[index].registerCount, nodeDefault.mapComponent.arrayCommonMap[index].to, data[addressIndex]);
              arrayPush(nodeDefault.mapComponent.arrayCommonMap[index + 1].description, nodeDefault.mapComponent.arrayCommonMap[index + 1].registerCount, nodeDefault.mapComponent.arrayCommonMap[index + 1].to, data[addressIndex]);
              address++;
            } else {
              console.log(values);
              arrayPush(nodeDefault.mapComponent.arrayCommonMap[index].description, nodeDefault.mapComponent.arrayCommonMap[index].registerCount, nodeDefault.mapComponent.arrayCommonMap[index].to, data[addressIndex])
              address++;
            }
          } else if (address <= 200) { // 장치정보 한 주소에 한개의 장치 정보가 있으며 그 배열의 크기와 순서로 맵의 장치정보가 들어가 있다. 플러그앤 플레이 기능이 들어가 있으면 포함이 안된다. 플러그앤 플레이의 뜻은 모르겠다.
            console.log("address", address, "nodeDefault.deviceCodes", nodeDefault.deviceCodes);
            if (address > 100 && nodeDefault.mapComponent.devices[addressIndex] !== undefined) {
              console.log("data[", addressIndex, "]", data[addressIndex]);
              var index = nodeDefault.deviceCodes.map((device) => { return device._id; }).indexOf(data[addressIndex]);
              console.log("nodeDefault.deviceCodes[", index, "]", nodeDefault.deviceCodes[index]);
              if (data[addressIndex] > 0) {
                arrayPush(nodeDefault.deviceCodes[index].device.Name, 1, undefined, data[addressIndex]);
              } else {
                arrayPush("장치없음", 1, undefined, data[addressIndex]);
              }
              if (nodeDefault.registerMap._id === 'tyIntegratedNodeBase' || nodeDefault.registerMap._id === 'tyActuatorNodeBase' || nodeDefault.registerMap._id === 'tySensorNodeBase') {
                console.log("data[", addressIndex, "]", data[addressIndex]);
              } else {
              }
            } else {
              // console.log(address, arraySlice)
            }
            address++;
          } else if (address < 900) {
            if (address === nodeDefault.registerMap.CommSpec[Object.keys(nodeDefault.registerMap.CommSpec)[0]].read["starting-register"]) {
              console.log(nodeDefault.registerMap.CommSpec[Object.keys(nodeDefault.registerMap.CommSpec)[0]].read.items);
              nodeDefault.registerMap.CommSpec[Object.keys(nodeDefault.registerMap.CommSpec)[0]].read.items.forEach((item) => {
                arrayPush(nodeDefault.registerMap.name, nodeDefault.checkLength(item), "Int", data[addressIndex]);
                address++;
              });
            } else if (address === nodeDefault.registerMap.CommSpec[Object.keys(nodeDefault.registerMap.CommSpec)[0]].write["starting-register"]) {
              nodeDefault.registerMap.CommSpec[Object.keys(nodeDefault.registerMap.CommSpec)[0]].write.items.forEach((item) => {
                arrayPush(nodeDefault.registerMap.name, nodeDefault.checkLength(item), "Int", data[addressIndex]);
                address++;
              });
            } else if (nodeDefault.registerMap.Devices.map((device) => {
              return device.CommSpec[Object.keys(device.CommSpec)[0]].read["starting-register"];
            }).includes(address)) {
              var index = nodeDefault.registerMap.Devices.map((device) => {
                return device.CommSpec[Object.keys(device.CommSpec)[0]].read["starting-register"];
              }).indexOf(address);
              // console.log(nodeDefault.registerMap.Devices[index].CommSpec[Object.keys(nodeDefault.registerMap.Devices[index].ComSpec)[0]].read.items);
              var items = nodeDefault.registerMap.Devices[index].CommSpec[Object.keys(nodeDefault.registerMap.Devices[index].CommSpec)[0]].read.items; // Devices배열에 있는 모든 주소를 배열화
              items.forEach((item, idx) => { // 각 배열의 주소를 item크기만큼 추가
                addressIndex = address - msg.modbusRequest.address;
                if (item === 'value') {
                  // console.log(index, nodeDefault.registerMap.Devices[index]);
                  console.log(address, [data[addressIndex], data[addressIndex + 1]]);
                  arrayPush(nodeDefault.registerMap.Devices[index].Name, nodeDefault.checkLength(item), "Float", [data[addressIndex], data[addressIndex + 1]]);

                } else {
                  if (nodeDefault.checkLength(item) == 1) {
                    console.log(address, data[addressIndex]);
                    arrayPush(item, nodeDefault.checkLength(item), undefined, data[addressIndex]);
                  } else {
                    console.log(address, data[addressIndex]);
                    arrayPush(item, nodeDefault.checkLength(item), "Int", data[addressIndex]);
                  }
                }
                address += nodeDefault.checkLength(item);
                // console.log(address, item, nodeDefault.checkLength(item))
              })
            } else {
              address++;
            }
          } else if (address < 1000) {
            const quotient = parseInt((address - 910) / 10);
            const remainder = address - 910 - quotient * 10;
            if (remainder == 0) {
              arrayPush("센서 채널 " + quotient + " 제품코드", 1, undefined, data[addressIndex]);
            } else if (remainder == 1) {
              arrayPush("센서채널 " + quotient + " K상수", 2, "Float", [data[addressIndex], data[addressIndex + 1]]);
            } else if (remainder == 2) {
              //
            } else if (remainder == 3) {
              arrayPush("센서채널 " + quotient + " P상수", 2, "Float", [data[addressIndex], data[addressIndex + 1]]);
            } else if (remainder == 4) {
              //
            }
            address++
          } else if (address <= 1100) {
            const quotient = parseInt((address - 1000) / 10);
            const remainder = address - 1000 - quotient * 10;
            console.log("data[", addressIndex, "]", data[addressIndex])
            if (remainder == 0) {
              arrayPush("개폐기 채널 " + quotient + " 제품코드", 1, undefined, data[addressIndex]);
            } else if (remainder == 1) {
              arrayPush("개폐기 채널 " + quotient + " 여는시간", 1, undefined, data[addressIndex]);
            } else if (remainder == 2) {
              arrayPush("개폐기 채널 " + quotient + " 닫는시간", 1, undefined, data[addressIndex]);
            }
            address++
          } else if (address <= 1200) {
            const quotient = parseInt((address - 1100) / 10);
            const remainder = address - 1100 - quotient * 10;
            console.log("data[", addressIndex, "]", data[addressIndex])
            if (remainder == 0) {
              arrayPush("스위치 채널 " + quotient + " 제품코드", 1, undefined, data[addressIndex]);
            } else if (remainder == 1) {
              arrayPush("스위치 채널 " + quotient + " 개방강도", 1, undefined, data[addressIndex]);
            }
            address++
          } else if (address >= 1301 && address <= 1330) {
            const deviceCode = address - 1301;
            console.log("data[", addressIndex, "]", data[addressIndex]);
            arrayPush("장치" + deviceCode + " 채널번호", "1/2", "High", data[addressIndex]);
            arrayPush("장치" + deviceCode + " 코드", "1/2", "Low", data[addressIndex]);
            address++
          } else if (address === 2000) {
            address++
          } else if (address === 2001) {
            address++
          } else {
            address++
          }
        }
      }
      break;
    case 'readDeviceRegisterItemValues':
      var offset = 0;
      console.log(msg);
      var items = JSON.parse(JSON.stringify(nodeDefault.mapComponent.devices[msg.index].commSpec.read.items).reduce((item, index) => (item[index] = 0, item), {})); //이거하면=>{operation: 0, opid: 0, hold-time: 0}
      nodeDefault.mapComponent.devices[msg.index].commSpec.read.items.forEach((item, index) => {
        if (nodeDefault.checkLength(item) === 1) {
          items[item] = {}
          items[item].hex = nodeDefault.valueToHex(msg.payload.data[offset]);
          items[item].value = msg.payload.data[offset];
          offset += 1;
        } else {
          items[item] = {};
          items[item].hex = '0x' + nodeDefault.valueToHex(msg.payload.data[offset + 1]) + '' + nodeDefault.valueToHex(msg.payload.data[offset]);
          var view = nodeDefault.byteToVal(msg.payload.data.slice(offset, offset + 2));
          if (item === 'value') {
            items[item].value = view.getFloat32(0).toFixed(2) + "" + nodeDefault.mapComponent.devices[msg.index].valueUnit;
          } else {
            items[item].value = view.getInt32(0);
          }
          offset += 2;
        }
      })
      nodeDefault.mapComponent.readResult[msg.index] = JSON.stringify(items, null, 2);;
      nodeDefault.mapComponent.readResultShow[msg.index] = true;
      break;
  }
});
const nodeDefault = reactive({
  readResultShow: false,
  command: command.value,
  readWrite: [{
    text: '노드읽기',
    value: 'read'
  }, {
    text: '노드쓰기',
    value: 'write'
  }],
  deviceType: [{
    text: '원예센서',
    value: "defaultSensorNode"
  }, {
    text: '축사센서',
    value: "defaultLivestockSensorNode"
  }, {
    text: '구동기',
    value: "defaultActuatorNode"
  }],
  selectedDeviceMap: "defaultSensorNode",
  registerMap: {},
  mapComponent: {
    arrayCommonMap: [{
      address: 1,
      description: "기관코드",
      registerCount: 1,
    }, {
      address: 2,
      description: "회사코드",
      registerCount: 1,
    }, {
      address: 3,
      description: "제품타입",
      registerCount: 1,
    }, {
      address: 4,
      description: "제품코드",
      registerCount: 1,
    }, {
      address: 5,
      description: "프로토콜버전",
      registerCount: 1,
    }, {
      address: 6,
      description: "채널수",
      registerCount: 1,
    }, {
      address: 7,
      description: "시리얼번호",
      registerCount: 2,
      to: "Int"
    }, {
      address: 197,
      description: "내부습도",
      registerCount: 2,
      to: "Float"
    }, {
      address: 199,
      description: "내부온도",
      registerCount: 2,
      to: "Float"
    }, {
      address: 201,
      description: "OPID",
      registerCount: 1,
    }, {
      address: 202,
      description: "노드상태",
      registerCount: 1,
    }, {
      address: 401,
      description: "동작",
      registerCount: 1,
    }, {
      address: 402,
      description: "OPID",
      registerCount: 1,
    }, {
      address: 403,
      description: "제어권",
      registerCount: 1,
    }, {
      address: 900,
      description: "티와이 노드 확인",
      registerCount: "1/2",
      to: "HighChar"
    }, {
      address: 900,
      description: "티와이 노드 확인",
      registerCount: "1/2",
      to: "LowChar"
    }, {
      address: 901,
      description: "기관코드",
      registerCount: 1,
    }, {
      address: 902,
      description: "회사코드",
      registerCount: 1,
    }, {
      address: 903,
      description: "노드타입",
      registerCount: 1,
    }, {
      address: 904,
      description: "제품코드",
      registerCount: 1,
    }, {
      address: 905,
      description: "프로토콜버전",
      registerCount: 1,
    }, {
      address: 906,
      description: "예비",
      registerCount: "1/2",
      to: "High"
    }, {
      address: 906,
      description: "슬레이브주소",
      registerCount: "1/2",
      to: "Low"
    }, {

      address: 907,
      description: "노드시리얼번호",
      registerCount: 2,
      to: "Int"
    }],
    devices: [],
    resultValues: [],
    readResult: [],
    readResultShow: [],
    nodeType: 1
  },
  modbusVariables: {
    _id: 176,
    functionCode: functionCode.value,
    registerAddress: 1,
    registerValues: 8,
    label: '레지스터읽기(03)',
    placeHolder: 'ex) 8',
    actionMenu: '레지스터개수(Dec)',
    action: '읽기'
  },
  registerMaps: [],
  deviceCodes: [],

  countQuantity: (items) => {
    // keyword별 크기로 읽을 레지스터 개수를 구한다.
    var quantity = 0;
    items.forEach((item) => {
      switch (String(item)) {
        case "value":
        case "state-hold-time":
        case "remain-time":
        case "hold-time":
        case "time":
        case "EC":
        case "pH":
        case "epoch":
        case "vfloat":
          quantity += 2;
          break;
        default:
          quantity += 1;
      }
    });
    return quantity;
  },
  selectDeviceMap: function (map) {
    this.selectedDeviceMap = map;
    console.log("this.registerMaps", this.registerMaps);
    this.registerMap = JSON.parse(JSON.stringify(this.registerMaps[map]));;
    console.log("this.registerMap", this.registerMap);
    Object.values(this.registerMap.Devices).forEach((device, index) => {
      this.mapComponent.devices[index] = {
        name: device.Name,
        commSpec: {
          read: {
            startingRegiser: device.CommSpec[Object.keys(device.CommSpec)[0]].read["starting-register"],
            items: device.CommSpec[Object.keys(device.CommSpec)[0]].read.items
          }
        },
        valueUnit: device.ValueUnit
      }
      if (device.CommSpec[Object.keys(device.CommSpec)[0]].write !== undefined) {
        this.mapComponent.devices[index].write = {
          startingRegiser: device.CommSpec[Object.keys(device.CommSpec)[0]].write["starting-register"],
          items: device.CommSpec[Object.keys(device.CommSpec)[0]].write.items
        }
      }
    });
  },
  simulateAction: function () {
    this.readResultShow = false;
    var sendConfirm = true;
    var data = {};
    console.log(this.registerMap);
    if (this.registerMap.Class === undefined) { // deviceMap이 초기화 되지 않았으면 초기화 한다.
      console.log("this.selectedDeviceMap", this.selectedDeviceMap)
      this.selectDeviceMap(this.selectedDeviceMap);
    }
    data._id = this.modbusVariables._id;
    data.payload = {
      'unitid': this.modbusVariables._id,
      'address': parseInt(this.modbusVariables.registerAddress, 10),
    }
    if (this.command === 'read') {
      if (this.modbusVariables._id < 1 || this.modbusVariables._id > 247) {
        modal.value = {
          icon: "report_problem",
          alert: true,
          label: "입력오류",
          text: "주소는 1-247사이로 지정하세요",
          yesNo: false
        }
        sendConfirm = false;
        return;
      }
      if (parseInt(this.modbusVariables.registerValues, 10) < 1 || parseInt(this.modbusVariables.registerValues, 10) > 100) {
        modal.value = {
          icon: "report_problem",
          alert: true,
          label: "입력오류",
          text: "읽기 개수는 1-100사이로 넣으세요",
          yesNo: false
        }
        sendConfirm = false;
        return;
      }
      data.payload.fc = 3;
      data.command = "read";
      data.payload.quantity = parseInt(this.modbusVariables.registerValues, 10);
    } else {
      if (this.modbusVariables._id < 1 || this.modbusVariables._id > 247) {
        modal.value = {
          icon: "report_problem",
          alert: true,
          label: "입력오류",
          text: "주소는 1-247사이로 지정하세요",
          yesNo: false
        }
        sendConfirm = false;
        return;
      }
      console.log(this.modbusVariables.registerValues);
      // var values = [];
      // if (Array.isArray(this.modbusVariables.value)) {
      var values = this.modbusVariables.registerValues.split(',');
      console.log(values);
      // } else {
      //     values.push(parseInt(this.modbusVariables.value, 10));
      // }
      if (values.length > 12) {
        // dynamicData.alertMessage = "쓰기는 12개 이하로 하세요";
        // dynamicData.$refs['alertModalShow'].show();
        modal.value = {
          icon: "report_problem",
          alert: true,
          label: "입력오류",
          text: "쓰기는 12개 이하로 하세요",
          yesNo: false
        }
        sendConfirm = false;
        return;
      }
      if (this.modbusVariables.functionCode === 6) {
        data.command = "write";
        data.payload.fc = 6;
        data.payload.quantity = 1;
        data.payload.value = parseInt(values[0]);
      } else {
        console.log(values.length);
        data.command = "write";
        data.payload.fc = 16;
        data.payload.quantity = values.length;
        data.payload.value = [];
        values.forEach((value) => {
          data.payload.value.push(parseInt(value));
        });
      }
    }
    setTimeout(() => { // 모달 팝업 조건에서는 메시지를 내 보내지 않는다.
      if (sendConfirm) {
        data.topic = "nodeDefault/requestModbus";
        console.log("data", data);
        smartFarm.send(data);
      }
    }, 100);
  },
  readDeviceRegisterItemValues: function (index) {
    console.log(this.mapComponent.devices[index]);
    if (this.mapComponent.readResultShow[index]) {
      this.mapComponent.readResultShow[index] = false;
      return;
    }
    if (this.mapComponent.devices[index] !== undefined && this.mapComponent.devices[index].showe) {
      this.mapComponent.devices[index].show = false;
    } else {
      var data = {
        _id: this.modbusVariables._id,
        index: index,
        command: "read",
        payload: {
          fc: 3,
          unitid: this.modbusVariables._id,
          address: this.mapComponent.devices[index].commSpec.read.startingRegiser,
          quantity: this.countQuantity(
            this.mapComponent.devices[index].commSpec.read.items
          )
        }
      }
      console.log(modbus);
      data.topic = "nodeDefault/readDeviceRegisterItemValues";
      smartFarm.send(data);
    }
  },
  valueToHex: function (value) {
    return ("0" + Number(value >> 8 & 0xFF).toString(16)).slice(-2) + ("0" + Number(value & 0xFF).toString(16)).slice(-2);
  },
  calculateLength: function (items) {
    var length = 0;
    items.forEach((item) => {
      length += nodeDefault.checkLength(item);
    });
    return length;
  },
  byteToVal: function (value) {
    var buf = new ArrayBuffer(4);
    var view = new DataView(buf);
    view.setUint8(0, value[1] >> 8 & 0xFF);
    view.setUint8(1, value[1] & 0xFF);
    view.setUint8(2, value[0] >> 8 & 0xFF);
    view.setUint8(3, value[0] & 0xFF);
    return view;
  },
  pushData: function (address, description, value, wordValue, registerCount) {
    if (registerCount === 2) {
      var hexValue = '0x' + this.valueToHex(value[1]) + '' + this.valueToHex(value[0]);
    } else {
      var hexValue = '0x' + this.valueToHex(value);
    }
    return {
      "address": address,
      "description": description,
      "hexValue": hexValue,
      "wordValue": wordValue,
      "registerCount": registerCount
    };
  },
  checkLength: function (item) {
    switch (String(item)) {
      case "value":
      case "state-hold-time":
      case "remain-time":
      case "hold-time":
      case "time":
      case "EC":
      case "pH":
      case "epoch":
      case "vfloat":
        return 2;
        break;
      default:
        return 1;
    }
  },
});
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
onMounted(() => {
  console.log("ndoeConfig is mounted", smartFarm.isController);
  msg.value = smartFarm.msg;
  smartFarm.send({
    topic: "nodeDefault/deviceCodes",
    collection: "deviceCodes",
    operation: "find.toArray",
  });
  window.scrollTo(0, 0);
})
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
          v-on:click="modal.onClick(modal.param)" />
        <q-btn class="glossy" round color="primary" label="아니오" style="width:60px" v-close-popup />
      </q-card-actions>
      <q-card-actions align="right" v-else>
        <q-btn class="glossy" round color="primary" label="확인" style="width:60px" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <div class="col text-h4">레지스터시뮬레이터</div>
  <q-card>
    <q-card-section>
      <div class="q-pa-md q-gutter-sm row">
        <div class="col-3 text-right">
          <q-option-group dense inline :options="[{
            label: '노드읽기',
            value: 'read'
          }, {
            label: '노드쓰기',
            value: 'write'
          }]" type="radio" v-model="command" />
        </div>
        <div class="col-1"></div>
        <div class="col text-center">
          <q-option-group dense inline :options="[{
            label: '원예센서',
            value: 'defaultSensorNode'
          }, {
            label: '축사센서',
            value: 'defaultLivestockSensorNode'
          }, {
            label: '구동기',
            value: 'defaultActuatorNode'
          }]" type="radio" v-model="nodeDefault.selectedDeviceMap"
            v-on:input="nodeDefault.selectDeviceMap(selectedDeviceMap)" />
        </div>
      </div>
      <div class="q-pa-xs q-gutter-sm row">
        <div class="col-3 text-right">슬레이브 주소(Dec)</div>
        <div class="col-1"></div>
        <div class="col">
          <q-input outlined dense type="text" placeholder style="width: 100%" v-model="nodeDefault.modbusVariables._id">
          </q-input>
        </div>
      </div>
      <div class="q-pa-xs q-gutter-sm row">
        <div class="col-3 text-right">기능 코드(Dec)</div>
        <div class="col-1"></div>
        <div class="col">
          <q-btn-dropdown v-if="command === 'write' ? false : true" color="primary" label="레지스터 읽기">
            <q-list>
              <q-item clickable v-close-popup v-on:click="nodeDefault.modbusVariables.functionCode = 3">
                <q-item-section>
                  <q-item-label>레지스터읽기(03)</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn-dropdown v-else color="primary" label="레지스터 쓰기">
            <q-list>
              <q-item clickable v-close-popup v-on:click="nodeDefault.modbusVariables.functionCode = 6">
                <q-item-section>
                  <q-item-label>단일레지스터쓰기(06)</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup v-on:click="nodeDefault.modbusVariables.functionCode = 16">
                <q-item-section>
                  <q-item-label>다중레지스터쓰기(16)</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div class="col">{{ nodeDefault.modbusVariables.label }}</div>
        <div class="col">
          <q-btn-dropdown color="primary" label="맵선택">
            <q-list>
              <q-item clickable v-close-popup v-for="map in Object.keys(nodeDefault.registerMaps)" v-bind:key="map"
                v-on:click="nodeDefault.selectDeviceMap(map)">
                <q-item-section>
                  <q-item-label>{{ map }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
      <div class="q-pa-xs q-gutter-sm row">
        <div class="col-3 text-right">레지스터 주소(Dec)</div>
        <div class="col-1"></div>
        <div class="col">
          <q-input outlined dense type="text" placeholder style="width: 100%"
            v-model="nodeDefault.modbusVariables.registerAddress"></q-input>
        </div>
      </div>
      <div class="q-pa-xs q-gutter-sm row">
        <div class="col-3 text-right">{{ nodeDefault.modbusVariables.actionMenu }}</div>
        <div class="col-1"></div>
        <div class="col">
          <q-input outlined dense type="text" :placeholder="nodeDefault.modbusVariables.placeHolder" style="width: 100%"
            v-model="nodeDefault.modbusVariables.registerValues"></q-input>
        </div>
      </div>
      <p>Multi Word Write 사용시엔 Value값에 쉼표로 값을 나누어 입력할것. ex) 연속하는 메모리 주소에 1,2,3을 넣을경우 Value값에 1,2,3이런 형태로 입력함</p>
      <div class="col text-right justify-center">
        <q-btn rounded dense text-color="white" color="primary" style="width: 150px"
          v-on:click="nodeDefault.simulateAction()">{{ nodeDefault.modbusVariables.action }}</q-btn>
      </div>
    </q-card-section>
  </q-card>
  <div class="q-pa-md" v-show="nodeDefault.readResultShow">
    <q-markup-table>
      <thead>
        <tr>
          <th scope="col">레지스터주소</th>
          <th scope="col">HEX값</th>
          <th scope="col">word값</th>
          <th scope="col">레지스터개수</th>
          <th scope="col">설명</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="register, index in nodeDefault.mapComponent.resultValues" v-bind:key="index">
          <th scope="row" width="120px">{{ register.address }}</th>
          <td width="200px">{{ register.hexValue }}</td>
          <td width="200px">{{ register.wordValue }}</td>
          <td width="200px">{{ register.registerCount }}</td>
          <td width="500px">
            <p v-if="register.address <= 100 || register.address > 150">{{ register.description }}</p>
            <q-btn v-if="register.address > 100 && register.address <= 150" rounded dense text-color="white"
              color="primary" style="width: 150px" v-on:click="nodeDefault.simulateAction()">{{
                  register.description
              }}</q-btn>
          </td>
          <td>
            <div v-show="nodeDefault.mapComponent.readResultShow[index]">
              <pre>{{ nodeDefault.mapComponent.readResult[index] }}</pre>
            </div>
          </td>
        </tr>
      </tbody>
    </q-markup-table>
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
