<script setup>
import {
  onMounted,
  inject,
  onUpdated,
  computed,
  reactive,
  watch,
  toRef,
} from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ActuatorRetractable from "../js/actuatorRetractable";
import ActuatorSwitch from "../js/actuatorSwitch";
import Sensor from "../js/sensor";
const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const route = useRoute();

const smartFarm = inject("smartFarm");
const msg = toRef(smartFarm, "msg");
//================노드레드 uibuilder에서 온 메세지를 smartFarm변수에 담아 변경감시한다.
//================uibuilder 객체를 privide하면 페이지 변경할때마다 소켓이 생기고 쌓이는문제가 있어 App.vue에서 한 선언하고 smartFarm변수에 담아 보낸다.
watch(msg, (msg) => {
  let topic = null;
  if (smartFarm.isRemote) {
    let topicArray = msg.topic.split("/");
    let controllerId = topicArray[0] + "/" + topicArray[1];
    if ((controllerId = smartFarm.homeServerInfo.selectedController)) {
      topic = topicArray[2] + "/" + topicArray[3] + "/" + topicArray[4];
    }
  } else {
    topic = msg.topic;
  }
  if (Object.keys(nodeStatus.actuatorRetractables).includes(topic)) {
    // 장치정보의 _id, 즉, 슬레이브 어드레스 중 topic의 천번 째 항목과 같을때
    nodeStatus.actuatorRetractables[topic].edit.handleResult(
      nodeStatus.actuatorRetractables[topic],
      smartFarm,
      msg.payload
    );
    return;
  } else if (Object.keys(nodeStatus.actuatorSwitches).includes(topic)) {
    console.log(topic);
    console.log(msg.payload);
    nodeStatus.actuatorSwitches[topic].edit.handleResult(
      nodeStatus.actuatorSwitches[topic],
      smartFarm,
      msg.payload
    );
    return;
  } else if (Object.keys(nodeStatus.sensors).includes(topic)) {
    nodeStatus.sensors[topic].edit.handleResult(
      nodeStatus.sensors[topic],
      smartFarm,
      msg.payload
    );
    return;
  } else if (msg.topic.startsWith("nodeStatus")) {
    topic = msg.topic.split("/")[1];
  } else {
    return;
  }
  console.log(topic);
  switch (
  String(topic) // ui로 요청되는 topic에 따라 동작을 한다
  ) {
    case "deviceNodes":
      nodeStatus.deviceNodes = [];
      nodeStatus.setDeviceNodes(msg.payload, nodeStatus);
      break;
    case "getDeviceNodes":
      console.log(msg);
      smartFarm.controller[msg.controllerId] = {
        deviceNodes: {},
        actuatorRetractables: {},
        actuatorSwitches: {},
        sensors: {},
      };
      nodeStatus.setDeviceNodes(
        msg.payload,
        smartFarm.controller[msg.controllerId]
      );
      console.log(
        "msg.controllerId",
        msg.controllerId,
        "smartFarm.homeServerInfo.selectedController",
        smartFarm.homeServerInfo.selectedController
      );
      if (msg.controllerId === smartFarm.homeServerInfo.selectedController) {
        nodeStatus.setController(msg.controllerId);
      }
      break;
    case "resetStatus":
      break;
    case "saveDeviceConfig":
      break;
    case "activateAll":
      break;
  }
});
onUpdated(() => {
  if (smartFarm.isRemote && Object.keys(route.params).length > 0) {
    console.log(route.params);
    console.log(
      "smartFarm.controller[",
      route.params.controllerId,
      "]",
      smartFarm.controller[route.params.controllerId]
    );
    smartFarm.homeServerInfo.selectedController = route.params.controllerId;
    nodeStatus.setController(route.params.controllerId);
    smartFarm.send({
      // 마지막 사용한 제어기를 기록해 둔다.
      topic: "/homeServerInfo",
      collection: "homeServerInfo",
      operation: "update",
      payload: [
        {
          _id: smartFarm.homeServerInfo._id,
        },
        {
          $set: {
            selectedController: route.params.controllerId,
          },
        },
      ],
    });
  }
});
const nodeStatus = reactive({
  cardWidth: $q.platform.is.mobile ? "width: 250px" : "width: 400px",
  deviceNodes: [],
  actuatorRetractables: {},
  actuatorSwitches: {},
  sensors: {},
  resetTimer: {},
  resetRatio: {},
  floatTitle: {},
  msg: 0,
  openRatio: {
    group: 0,
    options: [
      {
        label: "0%",
        value: 0,
      },
      {
        label: "10%",
        value: 10,
      },
      {
        label: "20%",
        value: 20,
      },
      {
        label: "30%",
        value: 30,
      },
      {
        label: "40%",
        value: 40,
      },
      {
        label: "50%",
        value: 50,
      },
      {
        label: "60%",
        value: 60,
      },
      {
        label: "70%",
        value: 70,
      },
      {
        label: "80%",
        value: 80,
      },
      {
        label: "90%",
        value: 90,
      },
      {
        label: "100%",
        value: 100,
      },
      {
        label: "재설정",
        value: -1,
      },
    ],
  },
  getIndex: function (id) {
    //람다함수를 쓰면 this가 안된다. 왜 그런지 모른다.
    var index = this.deviceInfo
      .map(function (device) {
        return device._id;
      })
      .indexOf(id);
    return index;
  },
  activateAll: function () {
    console.log(nodeStatus.deviceNodes);
    Object.keys(nodeStatus.actuatorRetractables).forEach(
      (actuatorRetractableId) => {
        nodeStatus.actuatorRetractables[actuatorRetractableId].activated = true;
        nodeStatus.actuatorRetractables[
          actuatorRetractableId
        ].edit.activated = true;
        let actuatorRetractableString =
          "actuatorRetractables." + actuatorRetractableId + ".activated";
        smartFarm.send({
          collection: "deviceNodes",
          operation: "update",
          payload: [
            {
              _id: nodeStatus.actuatorRetractables[actuatorRetractableId].edit
                .params.slaveAddress,
            },
            {
              $set: { [actuatorRetractableString]: true },
            },
          ],
        });
      }
    );
    console.log(nodeStatus.actuatorSwitches);
    Object.keys(nodeStatus.actuatorSwitches).forEach((actuatorSwitchId) => {
      console.log(actuatorSwitchId);
      nodeStatus.actuatorSwitches[actuatorSwitchId].activated = true;
      nodeStatus.actuatorSwitches[actuatorSwitchId].edit.activated = true;
      let actuatorSwitchesString =
        "actuatorSwitches." + actuatorSwitchId + ".activated";
      smartFarm.send({
        collection: "deviceNodes",
        operation: "update",
        payload: [
          {
            _id: nodeStatus.actuatorSwitches[actuatorSwitchId].edit.params
              .slaveAddress,
          },
          {
            $set: {
              [actuatorSwitchesString]: true,
            },
          },
        ],
      });
    });
  },
  readDevices: function (deviceType) {
    if (deviceType === "actuator") {
      Object.keys(nodeStatus.actuatorRetractables).forEach((deviceId) => {
        nodeStatus.actuatorRetractables[deviceId].edit.read(
          nodeStatus.actuatorRetractables[deviceId],
          smartFarm
        );
      });
      Object.keys(nodeStatus.actuatorSwitches).forEach((deviceId) => {
        nodeStatus.actuatorSwitches[deviceId].edit.read(
          nodeStatus.actuatorSwitches[deviceId],
          smartFarm
        );
      });
    } else {
      Object.keys(nodeStatus.sensors).forEach((deviceId) => {
        nodeStatus.sensors[deviceId].edit.read(
          nodeStatus.sensors[deviceId],
          smartFarm
        );
      });
    }
  },
  scanController: function () {
    smartFarm.send({
      topic: "smartFarm/system",
      payload: {
        command: "scanController",
      },
    });
  },
  setDeviceNodes: function (data, dataObject) {
    data.forEach((deviceNode, nodeIndex) => {
      // 노드 생성시 제어기명을 기록한다. 제어기명은 env.get("FRIEND")로 구할수 있다.
      console.log("dataObject", dataObject);
      console.log(deviceNode);
      dataObject.deviceNodes[nodeIndex] = {};
      dataObject.deviceNodes[nodeIndex].id = deviceNode._id;
      let params = {
        slaveAddress: deviceNode._id,
        isMobile: $q.platform.is.mobile || false,
        isController: smartFarm.isController,
        connectedTo: smartFarm.connectedTo,
      };
      console.log("isMobile", params.isMobile);
      dataObject.deviceNodes[nodeIndex].actuatorRetractables = {};
      Object.keys(deviceNode.actuatorRetractables).forEach(
        (_id, actuatorRetractableIndex) => {
          dataObject.deviceNodes[nodeIndex].actuatorRetractables[
            actuatorRetractableIndex
          ] = _id;
          params.id = _id;
          dataObject.actuatorRetractables[_id] = {
            ...deviceNode.actuatorRetractables[_id],
            edit: new ActuatorRetractable(
              deviceNode.actuatorRetractables[_id],
              JSON.parse(JSON.stringify(params))
            ), // params를 그냥 넘기면 맨 마지먹에 업데이트 된 정보, 즉 스위치 마지막 정보가 전달된다.
          };
        }
      );
      dataObject.deviceNodes[nodeIndex].actuatorSwitches = {};
      Object.keys(deviceNode.actuatorSwitches).forEach(
        (_id, actuatorSwitchIndex) => {
          dataObject.deviceNodes[nodeIndex].actuatorSwitches[
            actuatorSwitchIndex
          ] = _id;
          params.id = _id;
          dataObject.actuatorSwitches[_id] = {
            ...deviceNode.actuatorSwitches[_id],
            edit: new ActuatorSwitch(
              deviceNode.actuatorSwitches[_id],
              JSON.parse(JSON.stringify(params))
            ),
          };
        }
      );
      dataObject.deviceNodes[nodeIndex].sensors = {};
      Object.keys(deviceNode.sensors).forEach((_id, sensorIndex) => {
        dataObject.deviceNodes[nodeIndex].sensors[sensorIndex] = _id;
        params.id = _id;
        dataObject.sensors[_id] = {
          ...deviceNode.sensors[_id],
          edit: new Sensor(
            deviceNode.sensors[_id],
            JSON.parse(JSON.stringify(params))
          ),
        };
      });
    });
  },
  setController: function (controllerId) {
    console.log("controllerId", controllerId);
    console.log("smartFarm.controller", smartFarm.controller);
    nodeStatus.deviceNodes = smartFarm.controller[controllerId].deviceNodes;
    nodeStatus.actuatorRetractables =
      smartFarm.controller[controllerId].actuatorRetractables;
    nodeStatus.actuatorSwitches =
      smartFarm.controller[controllerId].actuatorSwitches;
    nodeStatus.sensors = smartFarm.controller[controllerId].sensors;
    let controllerIndex = smartFarm.controllers
      .map((controller) => controller._id)
      .indexOf(controllerId);
    smartFarm.selectMenu(controllerIndex);
  },
});
nodeStatus.floatTitle = computed(() => {
  if (
    smartFarm.orientation === "portrait-primary" ||
    smartFarm.orientation === "portrait-secondary"
  ) {
    return {
      actuator: "",
      sensor: "",
      activate: "",
    };
  } else {
    return {
      actuator: "구동기상태갱신",
      sensor: "센서모두읽기",
      activate: "구동기모두활성화",
    };
  }
});
onMounted(() => {
  console.log("nodeStatus is mounted", smartFarm.isController);
  msg.value = smartFarm.msg;
  if (smartFarm.isController) {
    // 제어기 직접 접속이면 제어기 아이디 및 제어권 상태를 갱신한다.
    smartFarm.send({
      topic: "nodeStatus/deviceNodes",
      collection: "deviceNodes",
      operation: "find.toArray",
    });
  } else {
    // 클라우드 서버이거나 홈서버 일경우 제어기들을 검색 후 응답하는 제어기들에 대해서
    smartFarm.controllers.forEach((controller) => {
      console.log({
        topic: controller._id + "/system",
        payload: {
          command: "getDeviceNodes",
          connectedTo: smartFarm.connectedTo,
        },
      });
      smartFarm.send({
        topic: controller._id + "/system",
        payload: {
          command: "getDeviceNodes",
          connectedTo: smartFarm.connectedTo,
        },
      });
    });
  }
  window.scrollTo(0, 0);
});
</script>
<template>
  <div class="q-pa-md row items-start q-gutter-md" style="display: flex; justify-content: space-evenly"
    v-if="Object.keys(nodeStatus.actuatorRetractables).length > 0">
    <q-card flat bordered class="bg-grey-1 col-md-4" v-for="device in nodeStatus.actuatorRetractables" :key="device._id"
      :style="nodeStatus.cardWidth">
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-h6">{{ device.edit.title }}</div>
        </div>
        <div class="col-auto">
          <q-btn :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " color="green" v-on:click="device.edit.read(device, smartFarm)" :label="t('nodeStatus.read')" />
          &nbsp;
          <q-btn :disabled="!smartFarm.controller.isDeviceControl" v-on:click="device.edit.show = !device.edit.show"
            color="blue" :label="t('nodeStatus.set')" />
        </div>
      </div>
      <q-card-section>
        <q-linear-progress size="15px" :value="device.edit.progressValue / 100" track-color="orange">
          <div class="absolute-full flex flex-center">
            <q-badge color="orange" text-color="white" :label="
              parseInt(device.edit.progressValue, 10) > 0
                ? parseInt(device.edit.progressValue, 10) + '%'
                : ''
            " />
          </div>
        </q-linear-progress>
        <div class="row items-center no-wrap">
          <div class="col-12">
            동작상태 : {{ device.edit.operation.description }}
          </div>
        </div>
        <div class="row items-center no-wrap">
          <div class="col text-left">Opid : {{ device.opid }}</div>
          <div class="col text-center">
            지속시간 : {{ device.edit.stateHoldTime(device.stateHoldTime) }}
          </div>
          <div class="col text-right">
            {{ device.activated ? "활성화됨" : "비활성화됨" }}
          </div>
        </div>
        <div class="row items-center no-wrap">
          <div class="col" v-show="device.activated">
            <div class="circle text-center" :style="'background-color:' + device.edit.operation.color + ';'">
              <i :icon-right="device.edit.operation.icon" style="color: white">{{ device.edit.operation.text }}</i>
            </div>
          </div>
        </div>
        <div class="row items-center no-wrap">
          <div class="col text-center" style="width: 100%" v-if="device.openTime > 0 || device.closeTime > 0">
            <q-select :modelValue="
              device.edit.position === -1
                ? '재설정'
                : device.edit.position + '%'
            " :options="nodeStatus.openRatio.options" @update:model-value="
  (position) => {
    device.edit.position = position.value;
  }
" label="개방도 (%)" :disabled="
  device.edit.disabled(
    device,
    smartFarm.controller.isDeviceControl
  )
" outlined style="width: 90%" />
          </div>
          <div class="col text-center" style="width: 90%" v-else>
            <q-input outlined type="number" v-model="device.edit.operationTime" label="작동 시간 설정 (초)"
              style="width: 90%" />
          </div>
          <div v-if="device.edit.inProgress">
            <q-btn color="grey" v-on:click="device.edit.stop(device, smartFarm)" :label="t('nodeStatus.down')"
              style="width: 100%" icon-right="stop" />
          </div>
          <div v-else>
            <div class="col text-center" style="width: 90%" v-if="
              device.edit.position !== 0 &&
              device.edit.position !== device.position
            ">
              <q-btn color="warning" v-on:click="device.edit.setPosition(device, smartFarm)" :disabled="
                device.edit.disabled(
                  device,
                  smartFarm.controller.isDeviceControl
                )
              " :label="
  device.edit.position === -1
    ? '재설정'
    : device.edit.position + '% 개방'
" icon-right="meeting_room" style="width: 90%" />
            </div>
          </div>
          <div v-if="
            !(device.openTime > 0 || device.closeTime > 0) &&
            device.deviceCode === 113
          ">
            <p>개방설정필요</p>
          </div>
        </div>
      </q-card-section>
      <div class="row items-center no-wrap" v-if="!(device.openTime > 0 || device.closeTime > 0)">
        <div class="col">
          <q-btn color="red" v-on:click="device.edit.open(device, smartFarm)" :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " :label="t('nodeStatus.Heat')" style="width: 100%" icon-right="keyboard_double_arrow_right" />
        </div>
        <div class="col">
          <q-btn color="grey" v-on:click="device.edit.stop(device, smartFarm)" :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " :label="t('nodeStatus.down')" style="width: 100%" icon-right="stop" />
        </div>
        <div class="col">
          <q-btn color="green" v-on:click="device.edit.close(device, smartFarm)" :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " :label="t('nodeStatus.Close')" style="width: 100%" icon-right="keyboard_double_arrow_left" />
        </div>
      </div>
      <q-card-section v-if="device.edit.show">
        <div class="row items-center no-wrap">
          <div class="col">
            <q-input outlined type="text" v-model="device.edit.name" label="이름변경" style="width: 100%" />
          </div>
          <div class="col">
            <div class="q-pa-md">
              <q-checkbox v-model="device.edit.activated" />활성/비활성
            </div>
          </div>
          <q-btn color="red" v-on:click="device.edit.saveDeviceConfig(device, smartFarm)" label="저장" />
        </div>
        <div class="row items-center no-wrap">
          <div class="col-4">디바이스코드 : {{ device.deviceCode }}</div>
          <div class="col-8">디바이스종류 : {{ device.deviceMap.Type }}</div>
        </div>
        <div class="row items-center no-wrap">
          <div class="col">
            <q-input outlined type="text" v-if="device.deviceCode === 113" v-model="device.edit.openTime" label="열기시간설정"
              style="width: 100%" />
          </div>
          <div class="col">
            <q-input outlined type="text" v-if="device.deviceCode === 113" v-model="device.edit.closeTime"
              label="닫기시간설정" style="width: 100%" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
  <q-separator />
  <div class="q-pa-md row items-start q-gutter-md" style="display: flex; justify-content: space-evenly"
    v-if="Object.keys(nodeStatus.actuatorSwitches).length > 0">
    <q-card flat bordered class="bg-grey-1 col-md-4" v-for="device in nodeStatus.actuatorSwitches" :key="device._id"
      :style="nodeStatus.cardWidth">
      <div class="row items-center no-wrap">
        በርቷል
        <div class="col">
          <div class="text-h6">{{ device.edit.title }}</div>
        </div>
        <div class="col-auto">
          <q-btn :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " color="green" v-on:click="device.edit.read(device, smartFarm)" :label="t('nodeStatus.read')" />
          &nbsp;
          <q-btn :disabled="!smartFarm.controller.isDeviceControl" v-on:click="device.edit.show = !device.edit.show"
            color="blue" :label="t('nodeStatus.set')" />
        </div>
      </div>
      <q-card-section>
        <q-linear-progress size="15px" :value="device.edit.progressValue / 100" track-color="orange">
          <div class="absolute-full flex flex-center">
            <q-badge color="orange" text-color="white" :label="
              device.edit.progressValue > 0
                ? parseInt(device.edit.progressValue, 10) + '%'
                : ''
            " />
          </div>
        </q-linear-progress>
        <div class="row items-center no-wrap">
          <div class="col-12">
            동작상태 : {{ device.edit.operation.description }}
          </div>
        </div>
        <div class="row items-center no-wrap">
          <div class="col text-left">Opid : {{ device.opid }}</div>
          <div class="col text-center">
            지속시간 : {{ device.edit.stateHoldTime(device.stateHoldTime) }}
          </div>
          <div class="col text-right">
            {{ device.activated ? "활성화됨" : "비활성화됨" }}
          </div>
        </div>
        <div class="row items-center no-wrap">
          <div class="col" v-show="device.activated">
            <div class="circle text-center" :style="'background-color:' + device.edit.operation.color + ';'">
              <i :icon-right="device.edit.operation.icon" style="color: white">
                {{ device.edit.operation.text }}</i>
            </div>
          </div>
        </div>
        <div class="col text-center" style="width: 90%">
          <q-input outlined type="number" v-model="device.edit.operationTime" label="작동 시간 설정 (초)" style="width: 90%" />
        </div>
      </q-card-section>
      <div class="row items-center no-wrap">
        <div class="col">
          <q-btn color="red" v-on:click="device.edit.on(device, smartFarm)" :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " :label="t('nodeStatus.On')" style="width: 100%" icon-right="light_mode" />
        </div>
        <div class="col">
          <q-btn color="grey" v-on:click="device.edit.off(device, smartFarm)" :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " :label="t('nodeStatus.Off')" style="width: 100%" icon-right="stop" />
        </div>
      </div>
      <q-card-section v-if="device.edit.show">
        <div class="row items-center no-wrap">
          <div class="col">
            <q-input outlined type="text" v-model="device.edit.name" label="이름변경" style="width: 100%" />
          </div>
          <div class="col">
            <div class="q-pa-md">
              <q-checkbox v-model="device.edit.activated" />활성/비활성
            </div>
          </div>
          <q-btn color="red" v-on:click="device.edit.saveDeviceConfig(device, smartFarm)" label="저장" />
        </div>
        <div class="row items-center no-wrap">
          <div class="col-4">디바이스코드 : {{ device.deviceCode }}</div>
          <div class="col-8">디바이스종류 : {{ device.deviceMap.Type }}</div>
        </div>
      </q-card-section>
    </q-card>
  </div>
  <q-separator />
  <div class="q-pa-md row items-start q-gutter-md" style="display: flex; justify-content: space-evenly"
    v-if="Object.keys(nodeStatus.sensors).length > 0">
    <q-card flat bordered class="bg-grey-1 col-md-4" v-for="device in nodeStatus.sensors" :key="device._id"
      :style="nodeStatus.cardWidth">
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-h6">{{ device.edit.title }}</div>
        </div>
        <div class="col-auto">
          <q-btn :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " color="green" v-on:click="device.edit.read(device, smartFarm)" :label="t('nodeStatus.read')" />&nbsp;
          <q-btn :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " color="blue" v-on:click="device.edit.show = !device.edit.show" :label="t('nodeStatus.set')" />
        </div>
      </div>
      <q-card-section>
        <div class="row items-center no-wrap">
          <div class="col">{{ device.value + " " + device.valueUnit }}</div>
          <div class="col" v-if="device.status !== 0">
            <i style="color: red">장치에러</i>
          </div>
        </div>
      </q-card-section>
      <q-card-section v-if="device.edit.show">
        <div class="row items-center no-wrap">
          <div class="col">
            <q-input outlined type="text" v-model="device.edit.name" label="이름변경" style="width: 100%" />
          </div>
          <q-btn :disabled="
            device.edit.disabled(device, smartFarm.controller.isDeviceControl)
          " color="red" v-on:click="device.edit.saveDeviceConfig(device, smartFarm)" label="저장" />
        </div>
        <div class="row items-center no-wrap">
          <div class="col-4">디바이스코드 : {{ device.deviceCode }}</div>
          <div class="col-8">디바이스종류 : {{ device.deviceMap.Type }}</div>
        </div>
      </q-card-section>
    </q-card>
  </div>
  <q-footer bordered :class="smartFarm.color[smartFarm.menuIndex].bg" v-if="!smartFarm.isLocal">
    <q-toolbar>
      <q-toolbar-title>
        <q-avatar>
          <img src="../assets/tyeng.png" />
        </q-avatar>
        {{ smartFarm.title.footer }}
      </q-toolbar-title>
      <q-fab color="orange" icon="keyboard_arrow_left" direction="left" style v-if="smartFarm.isController">
        <q-fab-action color="purple-8" @click="nodeStatus.readDevices('actuator')" icon="bolt"
          :label="nodeStatus.floatTitle.actuator" label-position="left" />
        <q-fab-action color="red" @click="nodeStatus.readDevices('sensor')" icon="thermostat"
          :label="nodeStatus.floatTitle.sensor" label-position="left" />
        <q-fab-action color="blue" @click="nodeStatus.activateAll()" icon="wind_power"
          :label="nodeStatus.floatTitle.activate" label-position="left" />
      </q-fab>
      <q-fab color="orange" icon="keyboard_arrow_left" direction="left" style v-else>
        <q-fab-action color="purple-8" @click="nodeStatus.scanController()" icon="bolt" label="제어기스캔"
          label-position="left" />
      </q-fab>
    </q-toolbar>
  </q-footer>
</template>
