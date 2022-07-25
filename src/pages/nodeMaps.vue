<script setup>
import { onMounted, inject, reactive, watch, ref, toRef } from 'vue'
const smartFarm = inject("smartFarm");
const msg = toRef(smartFarm, 'msg');
//================노드레드 smartFarm에서 온 메세지를 smartFarm변수에 담아 변경감시한다.
//================smartFarm 객체를 privide하면 페이지 변경할때마다 소켓이 생기고 쌓이는문제가 있어 App.vue에서 한 선언하고 smartFarm변수에 담아 보낸다.
watch(msg, (msg) => {
  if (msg.topic.startsWith('nodeMaps')) {
    var topic = msg.topic.split("/")[1];
  } else {
    return;
  }
  switch (
  String(topic) // ui로 요청되는 topic에 따라 동작을 한다
  ) {
    case 'deviceCodes':
      console.log("msg", msg);
      if (msg.payload.length === 0) {
        readTextFile("./deviceCodes.json", function (text) {
          const deviceCodes = JSON.parse(text);
          deviceCodes.forEach((deviceCode, index) => {
            var data = {
              collection: "deviceCodes",
              operation: "insertOne",
              payload: deviceCode
            }
            data.topic = "nodeMaps/insertDeviceCode"
            smartFarm.send(data);
            if (index === deviceCodes.length - 1) {
              smartFarm.send({
                topic: "nodeMaps/defaultMaps",
                collection: "defaultMaps",
                operation: "find.toArray",
              });
            }
          })
        });
      } else {
        nodeMaps.deviceCodes = JSON.parse(JSON.stringify(msg.payload));
        smartFarm.send({
          topic: "nodeMaps/defaultMaps",
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
            data.topic = "nodeMaps/insertMap"
            smartFarm.send(data);
            if (index === maps.length - 1) {
              smartFarm.send({
                topic: "nodeMaps/registerMaps",
                collection: "registerMaps",
                operation: "find.toArray",
              });
            }
          })
          console.log(data);
        });
      } else {
        smartFarm.send({
          topic: "nodeMaps/registerMaps",
          collection: "registerMaps",
          operation: "find.toArray",
        });
      }
    case 'registerMaps':
      msg.payload.forEach((registerMap) => { // 쿼리한 맵들을 registerMaps 오브젝트에 담는다.
        nodeMaps.registerMaps[registerMap._id] = {};
        nodeMaps.registerMaps[registerMap._id] = JSON.parse(JSON.stringify(registerMap));
        if (msg.topic === 'registerMaps') {
          nodeMaps.registerMaps[registerMap._id].collection = 'registerMaps';
        } else {
          nodeMaps.registerMaps[registerMap._id].collection = 'defaultMaps';
        }
      });
      if (topic === 'registerMaps') {
        smartFarm.send({
          topic: "nodeMaps/deviceNodes",
          collection: "deviceNodes",
          operation: "find.toArray"
        });
      }
      break;
    case "insertMap":
      nodeMaps.copied = "맵이 추가 되었습니다.";
      setTimeout(() => {
        nodeMaps.copied = "";
      }, 3000);
      break;
    case "updateMap":
      nodeMaps.copied = "맵이 갱신 되었습니다.";
      setTimeout(() => {
        nodeMaps.copied = "";
      }, 3000);
      break;
    case "deleteMap":
      nodeMaps.copied = "맵이 삭제 되었습니다.";
      setTimeout(() => {
        nodeMaps.copied = "";
      }, 3000);
      break;
    case "insertDeviceCodes":
      nodeMaps.copied = "장치코드가 추가되었습니다.";
      setTimeout(() => {
        nodeMaps.copied = "";
      }, 3000);
      break;
  }
});
let modal = ref({
  alert: false,
  icon: "delete",
  label: "",
  text: "",
  yesNo: true,
  onClick: {},
  data: null
})
const nodeMaps = reactive({
  copied: "",
  mapInfo: {
    _id: null,
    show: false,
    sensorShow: false,
    actuatorShow: false,
    isTYNode: false,
    isDefault: true,
    noOfDualChannels: 8,
    sensors: [],
    actuators: [],
    actautorRetractable: {
      "Class": "actuator",
      "Type": "retractable/level2",
      "Model": "MOTOR-LV2",
      "Name": "",
      "CommSpec": {
        "KS X 3265": {
          "read": {
            "starting-register": 0,
            "items": [
              "status",
              "opid",
              "state-hold-time",
              "remain-time",
              "opentime",
              "closetime"
            ]
          },
          "write": {
            "starting-register": 0,
            "items": [
              "status",
              "opid",
              "state-hold-time",
              "remain-time",
              "ratio"
            ]
          }
        }
      }
    },
    actautorSwitch: {
      "Class": "actuator",
      "Type": "switch/level2",
      "Model": "SWITCH-LV2",
      "Name": "스위치1",
      "CommSpec": {
        "KS X 3265": {
          "read": {
            "starting-register": 0,
            "items": [
              "operation",
              "opid",
              "position",
              "opentime",
              "closetime"
            ]
          },
          "write": {
            "starting-register": 0,
            "items": [
              "operation",
              "opid",
              "hold-time",
              "ratio"
            ]
          }
        }
      }
    },
    CommSpec: {
      "read": {
        "starting-register": 0
      },
      "write": {
        "starting-register": 0
      }
    }
  },
  selectedMap: {
    Devices: []
  },
  deviceShow: false,
  registerMaps: {},
  copyMap: function (valueString) {
    // Create new element
    var el = document.createElement("textarea");
    // Set value (string to be copied)
    el.value = valueString;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute("readonly", "");
    el.style = {
      position: "absolute",
      left: "-9999px"
    };
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    try {
      var successful = document.execCommand("copy");
      if (successful) this.copied = "메모리에 복사되었습니다";
      setTimeout(() => {
        this.copied = "";
      }, 3000);
    } catch (err) {
      this.copied = "에구, 복사 실패";
      setTimeout(() => {
        this.copied = "";
      });
      // Remove temporary element
      document.body.removeChild(el);
    }
  },
  chooseFile: function (event) {
    console.log("chooseFile")
    console.log(event.target.files[0].name);
    if (event.target.files[0] !== undefined && event.target.files[0].name.includes(".json")) {
      const reader = new FileReader();
      reader.onload = (res) => {
        var fileMap = JSON.parse(res.target.result)[0];
        console.log("fileMap", fileMap);
        if (fileMap._id !== undefined || fileMap.Class !== undefined || fileMap.Type !== undefined || fileMap.Model !== undefined || fileMap.Name !== undefined || fileMap.CommSpec !== undefined) {
          this.editMap(fileMap);
        } else {
          modal.value = {
            icon: "report_problem",
            alert: true,
            label: "선택오류",
            text: "맵 파일이 아닙니다",
            yesNo: false
          }
        }
      }
      reader.onerror = (err) => console.log(err);
      reader.readAsText(event.target.files[0]);
    } else {
      modal.value = {
        icon: "report_problem",
        alert: true,
        label: "선택오류",
        text: "파일을 읽을수가 없습니다.",
        yesNo: false
      }
    }
  },
  addMap: function () {
    if (this.mapInfo._id !== null && this.mapInfo._id.length > 0) {
      console.log(this.mapInfo._id);
      var newMap = {};
      if (Object.keys(this.registerMaps).includes(this.mapInfo._id)) {
        modal.value = {
          icon: "report_problem",
          alert: true,
          label: "선택오류",
          text: "같은 이름의 맵아이디가 이미 존재합니다",
          yesNo: false
        }
      } else {
        newMap._id = this.mapInfo._id;
        newMap.class = this.mapInfo.class;
        newMap.type = this.mapInfo.type;
        newMap.model = this.mapInfo.model;
        newMap.name = this.mapInfo.name;
        newMap.commSpec = this.mapInfo.commSpec;
        newMap.devices = [];
        if (this.mapInfo.actuators.length > 0) {
          this.mapInfo.actuators.forEach((actuator) => {
            newMap.devices.push(actuator);
          })
        }
        if (this.mapInfo.sensors.length > 0) {
          this.mapInfo.sensors.forEach((sensor) => {
            newMap.devices.push(sensor);
          })
        }
        this.registerMaps[newMap._id] = newMap;
        var data = {
          collection: "registerMaps",
          operation: "insertOne",
          payload: newMap
        }
        data.topic = "nodeMaps/insertMap"
        smartFarm.send(data);
      }
    } else {
      console.log("empty map id");
    };
  },
  editMap: function (selectMap) {
    console.log("registerMap", selectMap);
    console.log("this.selectMap.name", this.mapInfo.name);
    if (this.mapInfo._id !== undefined && this.mapInfo._id !== selectMap._id) {
      this.mapInfo.show = true;
    } else {
      this.mapInfo.show = !this.mapInfo.show;
    }
    if (!this.mapInfo.show) {
      return;
    }
    // var selectMap = this.registerMaps[registerMap];
    console.log(selectMap);
    this.mapInfo._id = selectMap._id;
    this.mapInfo.class = selectMap.Class;
    this.mapInfo.type = selectMap.Type;
    this.mapInfo.model = selectMap.Model;
    this.mapInfo.name = selectMap.Name;
    this.mapInfo.commSpec = selectMap.CommSpec[Object.keys(selectMap.CommSpec)[0]];
    this.mapInfo.actuators = [];
    this.mapInfo.sensors = [];
    console.log(this.mapInfo);
    if (String(selectMap._id).includes('ty') && selectMap.Model.includes('TY-')) {
      this.mapInfo.isTYNode = true;
    } else {
      this.mapInfo.isTYNode = false;
    }
    if (String(selectMap._id).includes('default')) {
      this.mapInfo.isDefault = true;
    } else {
      this.mapInfo.isDefault = false;
    }
    if (selectMap.Devices.filter(item => item.Class === 'sensor').length > 0) {
      this.mapInfo.sensors = selectMap.Devices.slice().filter(item => item.Class === 'sensor');
      this.mapInfo.sensorShow = true;
      console.log(this.mapInfo.sensors);
    }
    if (selectMap.Devices.filter(item => item.Class === 'actuator').length > 0) {
      this.mapInfo.actuators = selectMap.Devices.slice().filter(item => item.Class === 'actuator');
      this.mapInfo.actuatorShow = true;
      this.mapInfo.noOfDualChannels = this.mapInfo.actuators.filter(item => item.Model.indexOf('MOTOR') > -1).length;
      console.log(this.mapInfo.actuators);
      console.log("noOfDualChannels", this.mapInfo.noOfDualChannels);
    }
    console.log(this.mapInfo);
  },
  deleteMap: function (mapId) {
    modal.value = {
      icon: "priority_high",
      alert: true,
      label: "재시작",
      text: this.registerMaps[mapId]._id + "를 삭제하시겠습니까?",
      data: {
        collection: "registerMaps",
        operation: "deleteOne",
        payload: {
          _id: mapId,
        },
      },
      onClick: function () {
        delete nodeMaps.registerMaps[this.data.payload._id];
        this.data.topic = "nodeMaps/deleteMap";
        smartFarm.send(this.data);
      },
      yesNo: true
    }
  },
  updateDevice: function (index, deviceCode) {
    console.log(deviceCode);
    if (deviceCode.Class == 'sensor') {
      var commSpec = Object.keys(deviceCode.CommSpec)[0];
      deviceCode.CommSpec[commSpec].read["starting-register"] = 210 + index * 10;
      console.log(deviceCode);
      this.mapInfo.sensors[index] = JSON.parse(JSON.stringify(deviceCode));
    } else if (deviceCode.Class == 'actuator') { }
  },
  saveDevice: function (index, id, deviceCode) {
    console.log(index);
    console.log(id);
    console.log(JSON.parse(JSON.stringify(deviceCode)));
    var index = "Devices." + index;
    var data = {
      collection: "registerMaps",
      operation: "updateOne",
      payload: [{
        _id: id,
      }, {
        $set: {
          [index]: deviceCode,
        }
      }, {
        upsert: true
      }]
    }
    data.topc = "nodeMaps/updateMap";
    smartFarm.send(data);
  }
})
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
    topic: "nodeMaps/deviceCodes",
    collection: "deviceCodes",
    operation: "find.toArray",
  });
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
          v-on:click="modal.onClick(modal.param)" />
        <q-btn class="glossy" round color="primary" label="아니오" style="width:60px" v-close-popup />
      </q-card-actions>
      <q-card-actions align="right" v-else>
        <q-btn class="glossy" round color="primary" label="확인" style="width:60px" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <div class="q-pa-md">
    <q-markup-table>
      <thead>
        <tr>
          <th style="width:10%">맵ID</th>
          <th style="width:80%">
            <div class="text-center">맵</div>
          </th>
          <th style="width:5%"></th>
          <th style="width:5%"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="registerMap in nodeMaps.registerMaps" v-bind:key="registerMap._id">
          <td width="100px">{{ registerMap._id }}</td>
          <td>
            <q-input dense outlined readonly type="text" :label="JSON.stringify(registerMap)"
              v-on:click="nodeMaps.copyMap(JSON.stringify(registerMap))" />
          </td>
          <td width="100px">
            <q-btn class="glossy" rounded color="primary" label="기본" style="width:100px" v-close-popup
              v-show="String(registerMap._id).includes('default')" />
            <q-btn class="glossy" rounded color="info" label="설정" style="width:100px"
              v-on:click="nodeMaps.editMap(nodeMaps.registerMaps[registerMap._id])"
              v-show="!(String(registerMap._id).includes('default'))" />
          </td>
          <td width="100px">
            <q-btn class="glossy" rounded color="green" label="삭제" style="width:100px"
              v-on:click="deleteMap(registerMap._id)"
              v-show="!(String(registerMap._id).includes('default') || String(registerMap._id).includes('Base') || String(registerMap._id).includes('CP'))" />
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
  <div class="q-pa-md">
    <q-markup-table>
      <tbody>
        <tr>
          <td>{{ nodeMaps.copied }}</td>
          <td width="100px"></td>
          <td width="100px"></td>
          <td align="right" width="100px">맵아이디</td>
          <td width="200px">
            <q-input dense outlined type="text" />
          </td>
          <td width="300px">
            <input type="file" v-on:change="nodeMaps.chooseFile($event)" accept=".json" />
          </td>
          <td width="100px">
            <q-btn class="glossy" rounded color="red" label="추가" style="width:100px" v-on:click="nodeMaps.addMap()" />
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
  <div class="q-pa-md" v-if="nodeMaps.mapInfo.show">
    <div class="text-h4 text-center">포트설정</div>
    <q-markup-table>
      <table class="table">
        <thead>
          <tr>
            <th style="width:9%"></th>
            <th style="width:1%"></th>
            <th style="width:10%"></th>
            <th style="width:40%"></th>
            <th style="width:10%"></th>
            <th style="width:10%"></th>
            <th style="width:10%"></th>
            <th style="width:10%"></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Class</td>
            <td>:</td>
            <td>
              <q-input dense outlined type="text" v-model="nodeMaps.mapInfo.class" />
            </td>
            <td colspan="3">
              <p v-if="nodeMaps.mapInfo.actuatorShow" align="left">
                구동기 제어포트 총 16개, 개폐기 하나에 두 개포트 사용, 나머지는
                스위치포트가 된다.
              </p>
            </td>
            <td v-if="nodeMaps.mapInfo.actuatorShow">
              <div class="text-right">개폐기 포트수</div>
            </td>
            <td v-if="nodeMaps.mapInfo.actuatorShow">
              <q-input dense outlined type="number" v-model="nodeMaps.mapInfo.noOfDualChannels" />
            </td>
          </tr>
          <tr>
            <td>Type</td>
            <td>:</td>
            <td>
              <q-input dense outlined type="text" v-model="nodeMaps.mapInfo.type" />
            </td>
            <td colspan="5"></td>
          </tr>
          <tr>
            <td>Model</td>
            <td>:</td>
            <td>
              <q-input dense outlined type="text" v-model="nodeMaps.mapInfo.model" />
            </td>
            <td colspan="5"></td>
          </tr>
          <tr>
            <td>Name</td>
            <td>:</td>
            <td width="200px">
              <q-input dense outlined type="text" v-model="nodeMaps.mapInfo.name" />
            </td>
            <td colspan="5"></td>
          </tr>
          <tr>
            <td>CommSpec</td>
            <td>:</td>
            <td colspan="2" v-on:click="nodeMaps.copyMap(JSON.stringify(nodeMaps.mapInfo.commSpec))">{{
                nodeMaps.mapInfo.commSpec
            }}</td>
            <td>
              <div class="col text-right">읽기시작주소</div>
            </td>
            <td>
              <div class="col text-left">
                <q-input dense outlined type="text" v-model="nodeMaps.mapInfo.commSpec.read['starting-register']" />
              </div>
            </td>
            <td>
              <div class="col text-right">쓰기시작주소</div>
            </td>
            <td>
              <div class="col text-left">
                <q-input dense outlined type="text" v-model="nodeMaps.mapInfo.commSpec.write['starting-register']" />
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-show="nodeMaps.mapInfo.sensorShow">
          <tr v-for="(sensor, index) in nodeMaps.mapInfo.sensors" v-bind:key="index">
            <td align="right">센서{{ index * 1 + 1 }}</td>
            <td colspan="6">
              <q-input dense outlined type="text" :label="JSON.stringify(sensor)"
                v-on:click="nodeMap.copyMap(JSON.stringify(sensor))" />
            </td>
            <td>
              <q-btn-dropdown color="warning" text-color="black" label="설정" v-show="nodeMaps.mapInfo.isTYNode">
                <q-list>
                  <q-item clickable v-close-popup
                    v-for="deviceCode in nodeMaps.deviceCodes.filter(item => item.device.Class === 'sensor')"
                    :key="deviceCode._id" v-on:click="nodeMaps.updateDevice(index, deviceCode.device)">
                    <q-item-section>
                      <q-item-label>{{ deviceCode.device.Name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </td>
          </tr>
        </tbody>
        <br />
        <tbody v-if="nodeMaps.mapInfo.actuatorShow">
          <tr v-for="(actuator, index) in nodeMaps.mapInfo.actuators" v-bind:key="index">
            <td align="right">구동기{{ index * 1 + 1 }}</td>
            <td colspan="7">
              <q-input dense outlined type="text" :label="JSON.stringify(actuator)"
                v-on:click="nodeMap.copyMap(JSON.stringify(actuator))" />
            </td>
          </tr>
        </tbody>
      </table>
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
