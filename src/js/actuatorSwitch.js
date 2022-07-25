"use strict";
class ActuatorSwitch {
  constructor(actuatorSwitch, params) {
    this.params = params;
    this.title = params.isMobile
      ? actuatorSwitch.name
      : actuatorSwitch.name + " " + "[" + params.id + "]";
    this.name = actuatorSwitch.name || actuatorSwitch.deviceMap.Name;
    this.activated = actuatorSwitch.activated || false;
    this.show = false;
    this.progressValue = parseInt(actuatorSwitch.position) || 0;
    this.ratio = parseInt(actuatorSwitch.ratio, 10) || 0;
    this.operationTime = parseInt(actuatorSwitch.operationTime, 10) || 0;
    this.inProgress = false;
    this._resetTimer = false;
    this.operation = {};
    this.setOperation = {
      0: {
        description: "초기설정",
        color: "gray",
        text: "멈춤",
        icon: "stop",
      },
      201: {
        description: "작동시작",
        color: "green",
        text: "켜짐",
        icon: "light_mode",
      },
      202: {
        description: "특정시간작동",
        color: "green",
        text: "켜짐",
        icon: "keyboard_double_arrow_right",
      },
      203: {
        description: "특정동작강도작동",
        color: "orange",
        text: "강도",
        icon: "open",
      },
    };
    this.operation = this.setOperation[actuatorSwitch.status];
  }
  disabled(device, isDeviceControl) {
    return !device.activated || !isDeviceControl;
  }
  saveDeviceConfig(device, smartFarm) {
    let set = {};
    let edit = {};
    if (this.name !== device.name) {
      // 바뀐 값들을 모아서
      this.title = this.isMobile
        ? h.name
        : this.name + " " + "[" + this.params.id + "]";
      set["actuatorSwitches." + this.params.id + ".name"] = this.name;
      edit.name = this.name;
    }
    if (this.activated !== device.activated) {
      set["actuatorSwitches." + this.params.id + ".activated"] = this.activated;
      edit.activated = this.activated;
    }
    if (this.ratio !== device.ratio) {
      set["actuatorSwitches." + this.params.id + ".ratio"] = this.ratio;
      edit.ratio = parseInt(this.ratio, 10);
    }
    smartFarm.send({
      topic: "nodeStatus/saveDeviceConfig",
      slaveAddress: this.params.slaveAddress,
      deviceId: this.params.id,
      edit: edit,
    });
    this.show = false;
    smartFarm.send({
      topic: "nodeStatus/saveDeviceConfig",
      slaveAddress: this.params.slaveAddress,
      set: set,
    });
  }
  read(device, smartFarm) {
    let data = {
      topic: this.params.id,
      payload: {
        command: "read",
        isController: this.params.isController,
        connectedTo: this.params.connectedTo,
        device: {
          ...device,
          edit: {
            deviceArray: "actuatorSwitches",
            deviceType: "actuatorSwitch",
            slaveAddress: this.params.slaveAddress,
            params: this.params,
          },
        },
      },
    };
    if (smartFarm.isRemote) {
      console.log(smartFarm);
      data.topic =
        smartFarm.homeServerInfo.selectedController + "/" + data.topic;
    }
    console.log(data);
    smartFarm.send(data);
  }
  _writeDevice(smartFarm, data) {
    if (smartFarm.isRemote) {
      console.log(smartFarm);
      data.topic =
        smartFarm.homeServerInfo.selectedController + "/" + data.topic;
    }
    console.log(data);
    data.payload.command = "write";
    data.payload.device.edit.deviceArray = "actuatorSwitches";
    data.payload.device.edit.deviceType = "actuatorSwitch";
    smartFarm.send(data);
  }
  on(device, smartFarm) {
    this._writeDevice(smartFarm, {
      topic: this.params.id,
      payload: {
        action: "on",
        device: {
          ...device,
          edit: {
            slaveAddress: this.params.slaveAddress,
            holdTime: parseInt(this.operationTime, 10), // 작동시간인 operationTime을 개폐기에서는 time에 담아서, 스위치는 holdTime에 담아서 보낸다. 표준에 같은 기능의 변수명을 서로 다르게 지정해 놓았다.
          },
        },
      },
    });
  }
  off(device, smartFarm) {
    this._writeDevice(smartFarm, {
      topic: this.params.id,
      payload: {
        action: "off",
        device: {
          ...device,
          edit: {
            deviceArray: "actuatorSwitches",
            deviceType: "actuatorSwitch",
            slaveAddress: this.params.slaveAddress,
          },
        },
      },
    });
  }
  stateHoldTime(stateHoldTime) {
    // console.log(this.params.id,stateHoldTime)
    if (stateHoldTime < 1000) {
      return stateHoldTime + "초";
    } else if (parseInt(stateHoldTime / 60, 10) < 1000) {
      return parseInt(stateHoldTime / 60, 10) + "분";
    } else if (parseInt(stateHoldTime / 3600, 10) < 100) {
      return parseInt(stateHoldTime / 3600, 10) + "시간";
    } else if (parseInt(stateHoldTime / 86500, 10) < 1000) {
      return parseInt(stateHoldTime / 86500, 10) + "일";
    } else {
      return "-";
    }
  }
  handleResult(device, smartFarm, resultData) {
    console.log(resultData);
    // edit에 가변 데이터들을 담겨온다.
    // MQTT에는 payload만 전달이 되기 때문에 UI에서 MQTT와 local에서 오는 데이터를 일관성있게 유지 할수 있다.
    // 결과 데이터 수신후 edit는 다른 변수에 담고 결과데이터에서 삭제 후 원시데이터에 덮어쓴다.
    let edit = JSON.parse(JSON.stringify(resultData.edit));
    delete resultData.edit;
    const resetStatus = () => {
      let set = {};
      set["actuatorSwitches." + this.params.id + ".status"] = this.status;
      set["actuatorSwitches." + this.params.id + ".position"] = this.position;
      let data = {
        topic: "nodeStatus/resetStatus",
        collection: "deviceNodes",
        operation: "findOneAndUpdate",
        payload: [
          {
            _id: this.params.slaveAddress,
          },
          {
            $set: set,
          },
        ],
      };
      smartFarm.send(data);
    };
    const runTimer = (progressEnd, progressMax) => {
      // (끝 위치(0~100), 최대 시간)
      const actuatorSwitch = this;
      return new Promise((resolve, reject) => {
        let interval = 100 / progressMax; // 1초에 움직여야 할 크기 100 : progressMax = interval : 0.1  => interval = 100*0.1/progressMax
        console.log("interval", interval);
        let diff = progressEnd - this.progressValue;
        let direction = Math.abs(diff) / diff;
        actuatorSwitch._resetTimer = false;
        device.stateHoldTime = 0;
        var progressInterval = setInterval(() => {
          actuatorSwitch.inProgress = true;
          console.log(
            "actuatorSwitch.progressValue",
            parseInt(actuatorSwitch.progressValue, 10)
          );
          if (
            actuatorSwitch.progressValue * direction >=
              progressEnd * direction ||
            actuatorSwitch._resetTimer
          ) {
            // setTimeout(() => {    // pregress가 끝까지 가기전에 끝나서 1초간 쉬었다가 끝낸다.
            actuatorSwitch.progressValue += interval * direction;
            clearInterval(progressInterval);
            this.inProgress = false;
            resultData.stateHoldTime = device.stateHoldTime;
            resolve();
            // }, 1000);
          } else {
            // progressValue += interval * direction;
            actuatorSwitch.progressValue += interval * direction;
          }
          device.stateHoldTime += 1;
        }, 1000);
      });
    };
    const setDevice = () => {
      console.log("resultData.status", resultData.status);
      this.status = device.status = resultData.status;
      this.operation = this.setOperation[resultData.status];
      this.openTime = device.openTime = resultData.openTime;
      this.closeTime = device.closeTime = resultData.closeTime;
      device.position = resultData.position;
      device.stateHoldTime = resultData.stateHoldTime;
      console.log("device.stateHoldTime", device.stateHoldTime);
      return;
    };
    (() => {
      console.log("resultData", resultData);
      device.opid = resultData.opid; // 타이머 시작시 OPID를 바꿔준다.
      if (edit.command === "write") {
        if (edit.action === "setConfig") {
          this.show = false;
        } else if (resultData.status === 0) {
          this._resetTimer = true;
          setDevice();
        } else if (resultData.status === 202) {
          this.operation = this.setOperation[resultData.status];
          this.progressValue = 0;
          console.log("resultData.holdTime", resultData.holdTime);
          runTimer(100, resultData.holdTime)
            .then(() => {
              // this._runTimer(시작지점, 남은시간, 100ms동안 옴직여야할 크기, 방향)
              this.status = resultData.status = 0;
              this.progressValue = 0;
              setDevice();
              resetStatus();
            })
            .catch(() => {});
        } else if (resultData.status === 203) {
          // Todo 비율제어
        } else {
          setDevice();
        }
      } else {
        setDevice();
      }
    })();
  }
}
export default ActuatorSwitch;
