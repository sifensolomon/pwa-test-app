'use strict';
class ActuatorRetractable {
  constructor(actuatorRetractable, params) {
    this.params = params;
    this.title = params.isMobile ? actuatorRetractable.name : actuatorRetractable.name + " " + "[" + params.id + "]";
    this.name = actuatorRetractable.name || actuatorRetractable.deviceMap.Name;
    this.activated = actuatorRetractable.activated || false;
    this.show = false;
    this.progressValue = actuatorRetractable.position || 0;
    this.position = actuatorRetractable.position || 0;
    this.operationTime = actuatorRetractable.operationTime || 0;
    this.openTime = parseInt(actuatorRetractable.openTime, 10) || 0;
    this.closeTime = parseInt(actuatorRetractable.closeTime, 10) || 0;
    this.inProgress = false;
    this._resetTimer = false;
    this._resetPostion = false;
    this.setOperation = {
      0: {
        description: '초기설정',
        color: "gray",
        text: "멈춤",
        icon: "stop"
      },
      301: {
        description: '열림명령',
        color: "red",
        text: "여는중",
        icon: "keyboard_double_arrow_right"
      },
      302: {
        description: '닫힘명령',
        color: "green",
        text: "닫는중",
        icon: "keyboard_double_arrow_left"
      },
      303: {
        description: '열림방향특정시간작동',
        color: "red",
        text: "여는중",
        icon: "keyboard_double_arrow_right"
      },
      304: {
        description: '닫힘방향특정시간작동',
        color: "green",
        text: "닫는중",
        icon: "keyboard_double_arrow_left"
      },
      305: {
        description: '개방도지정',
        color: "orange",
        text: "개방도",
        icon: "settings"
      },
      306: {
        description: '초기설정',
        color: "gray",
        text: "멈춤",
        icon: "stop"
      }
    }
    this.operation = this.setOperation[actuatorRetractable.status];
    // console.log("this.operation", this.operation)
  }
  disabled(device, isDeviceControl) {
    return !device.activated || !isDeviceControl;
  }
  saveDeviceConfig(device, smartFarm) {
    let set = {};
    let edit = {};
    if (this.name !== device.name) {  // 바뀐 값들을 모아서
      this.title = this.isMobile ? h.name : this.name + " " + "[" + this.params.id + "]";
      set["actuatorRetractables." + this.params.id + ".name"] = this.name;
      edit.name = this.name;
    }
    if (this.activated !== device.activated) {
      set["actuatorRetractables." + this.params.id + ".activated"] = this.activated;
      edit.activated = this.activated;
    }
    if (this.openTime !== device.openTime) {
      set["actuatorRetractables." + this.params.id + ".openTime"] = this.openTime;
      edit.openTime = parseInt(this.openTime, 10);
    }
    if (this.closeTime !== device.closeTime) {
      set["actuatorRetractables." + this.params.id + ".closeTime"] = this.closeTime;
      edit.closeTime = parseInt(this.closeTime, 10);
    }
    if (this.openTime != device.openTime || this.closeTime != device.closeTime) {
      // 열림,닫힘 시간지정이 바뀌었을 때는 db를 업데이트 하고 모드버스명령을 보낸다.
      this._writeDevice(smartFarm, {
        topic: this.params.id,
        payload: {
          action: "setConfig",
          device: {
            ...device,
            edit: {
              time: parseInt(this.operationTime, 10),
              openTime: parseInt(this.openTime, 10),
              closeTime: parseInt(this.closeTime, 10),
              isController: this.params.isController,
              connectedTo: this.params.connectedTo,
              slaveAddress: this.params.slaveAddress
            }
          }
        }
      });
    } else {
      smartFarm.send({
        // 소켓 메시지는 MQTT도 같이 사용 해야 한다.
        // MQTT는 payload이외의 키는 모두 버린다.
        topic: "nodeStatus/saveDeviceConfig",
        payload: {
          slaveAddress: this.params.slaveAddress,
          deviceId: this.params.id,
          edit: edit
        }
      });
      this.show = false;
    }
    smartFarm.send({
      topic: "nodeStatus/saveDeviceConfig",
      payload: {
        slaveAddress: this.params.slaveAddress,
        set: set
      }
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
            deviceArray: "actuatorRetractables",
            deviceType: "actuatorRetractable",
            slaveAddress: this.params.slaveAddress,
            params: this.params,
          }
        }
      }
    }
    if (smartFarm.isRemote) {
      console.log(smartFarm);
      data.topic = smartFarm.homeServerInfo.selectedController + "/" + data.topic
    }
    console.log(data);
    smartFarm.send(data);
  }
  _writeDevice(smartFarm, data) {
    if (smartFarm.isRemote) {
      console.log(smartFarm);
      data.topic = smartFarm.homeServerInfo.selectedController + "/" + data.topic
    }
    console.log(data);
    data.payload.command = "write";
    data.payload.device.edit.deviceArray = "actuatorRetractables";
    data.payload.device.edit.deviceType = "actuatorRetractable";
    smartFarm.send(data);
  }
  setPosition(device, smartFarm) {
    console.log("setPosition", this.position);
    if (this.position < 0) { // 0보다 작으면 값을 0으로 리셋한다.
      console.log("setPosition", device.position);
      if (device.position > 0) {
        this._writeDevice(smartFarm, {
          topic: this.params.id,
          payload: {
            action: "resetPosition"
          }
        });
      }
    } else {
      if (this.position !== device.position) {
        this._writeDevice(smartFarm, {
          topic: this.params.id,
          payload: {
            action: "setPosition",
            device: {
              ...device,
              edit: {
                position: this.position,
                isController: this.params.isController,
                connectedTo: this.params.connectedTo,
                slaveAddress: this.params.slaveAddress
              }
            }
          }
        });
      }
    }
  }
  open(device, smartFarm) {
    this._writeDevice(smartFarm, {
      topic: this.params.id,
      payload: {
        action: "open",
        device: {
          ...device,
          edit: {
            slaveAddress: this.params.slaveAddress,
            time: parseInt(this.operationTime, 10)    // 작동시간인 operationTime을 개폐기에서는 time에 담아서, 스위치는 holdTime에 담아서 보낸다. 표준에 같은 기능의 변수명을 서로 다르게 지정해 놓았다.
          }
        }
      }
    });
  }
  close(device, smartFarm) {
    this._writeDevice(smartFarm, {
      topic: this.params.id,
      payload: {
        action: "close",
        device: {
          ...device,
          edit: {
            slaveAddress: this.params.slaveAddress,
            time: parseInt(this.operationTime, 10)    // 작동시간인 operationTime을 개폐기에서는 time에 담아서, 스위치는 holdTime에 담아서 보낸다. 표준에 같은 기능의 변수명을 서로 다르게 지정해 놓았다.
          }
        }
      }
    });
  }
  stop(device, smartFarm) {
    this._writeDevice(smartFarm, {
      topic: this.params.id,
      payload: {
        action: "off",
        device: {
          ...device,
          edit: {
            slaveAddress: this.params.slaveAddress
          }
        }
      }
    });
  }
  stateHoldTime(stateHoldTime) {
    if (stateHoldTime < 1000) {
      return stateHoldTime + '초';
    } else if (parseInt(stateHoldTime / 60, 10) < 1000) {
      return parseInt(stateHoldTime / 60, 10) + '분';
    } else if (parseInt(stateHoldTime / 3600, 10) < 100) {
      return parseInt(stateHoldTime / 3600, 10) + '시간';
    } else if (parseInt(stateHoldTime / 86500, 10) < 1000) {
      return parseInt(stateHoldTime / 86500, 10) + '일'
    } else {
      return "-"
    }
  }
  handleResult(device, smartFarm, resultData) {
    console.log(resultData);
    let edit = JSON.parse(JSON.stringify(resultData.edit));
    delete resultData.edit;
    const resetStatus = () => {
      let set = {};
      set["actuatorRetractables." + this.params.id + ".status"] = this.status;
      set["actuatorRetractables." + this.params.id + ".position"] = this.position;
      let data = {
        topic: "nodeStatus/resetStatus",
        collection: "deviceNodes",
        operation: "findOneAndUpdate",
        payload: [{
          _id: this.params.slaveAddress,
        }, {
          $set: set
        }]
      }
      smartFarm.send(data);
    }
    const runTimer = (progressEnd, progressMax) => { // (끝 위치(0~100), 최대 시간)
      const actuatorRetractable = this;
      return new Promise((resolve, reject) => {
        let interval = 100 / progressMax; // 1초에 움직여야 할 크기 100 : progressMax = interval : 0.1  => interval = 100*0.1/progressMax
        console.log("interval", interval);
        let diff = (progressEnd - this.progressValue);
        let direction = Math.abs(diff) / diff;
        actuatorRetractable._resetTimer = false;
        device.stateHoldTime = 0;
        var progressInterval = setInterval(() => {
          actuatorRetractable.inProgress = true;
          console.log("actuatorRetractable.progressValue", parseInt(actuatorRetractable.progressValue, 10));
          if (actuatorRetractable.progressValue * direction >= progressEnd * direction || actuatorRetractable._resetTimer) {
            // setTimeout(() => {    // pregress가 끝까지 가기전에 끝나서 1초간 쉬었다가 끝낸다.
            actuatorRetractable.progressValue += interval * direction
            clearInterval(progressInterval);
            this.inProgress = false;
            resultData.stateHoldTime = device.stateHoldTime;
            resolve();
            // }, 1000);
          } else {
            // progressValue += interval * direction;
            actuatorRetractable.progressValue += interval * direction
          }
          device.stateHoldTime += 1;
        }, 1000);
      })
    };
    const setDevice = () => {
      console.log("resultData.status", resultData.status);
      this.status = device.status = resultData.status;
      this.operation = this.setOperation[resultData.status];
      this.openTime = device.openTime = resultData.openTime;
      this.closeTime = device.closeTime = resultData.closeTime;
      this.position = device.position = resultData.position;
      device.stateHoldTime = resultData.stateHoldTime;
      console.log("device.stateHoldTime", device.stateHoldTime);
      return;
    };
    (() => {
      device.opid = resultData.opid; // 타이머 시작시 OPID를 바꿔준다.
      console.log("edit", edit);
      if (edit.command === "write") {
        if (edit.action === "setConfig") {
          this.show = false;
          setDevice();
        } else if (resultData.status === 0) {
          this._resetTimer = true;
          setDevice();
        } else if (resultData.status === 303 || resultData.status === 304) {
          this.operation = this.setOperation[resultData.status];
          this.progressValue = 0;
          console.log("resultData.time", resultData.time);
          runTimer(100, resultData.time).then(() => {  // this._runTimer(시작지점, 남은시간, 100ms동안 옴직여야할 크기, 방향)
            this.status = resultData.status = 0;
            this.progressValue = 0;
            setDevice();
            resetStatus();
          }).catch(() => {

          });
        } else if (resultData.status === 305) {
          const positionDiff = (resultData.position - device.position) / 100 // 움직여야 할 비율
          let progressMax = 0;
          if (positionDiff > 0) {
            this.operation = this.setOperation[303]; //열리는 시간동안 빨간색으로 표시하기 위함
            progressMax = resultData.openTime;
          } else {
            this.operation = this.setOperation[304]; //닫히는 시간동안 녹색으로 표시하기 위함
            progressMax = resultData.closeTime;
          }
          this.progressValue = device.position;
          runTimer(resultData.position, progressMax).then(() => {
            if (this._resetPostion) {
              this.progressValue = 0;
              this.status = 0;
            } else {
              this.progressValue = device.progressValue = resultData.position;
              this.status = 305;
            }
            console.log("resetStatus");
            setDevice();
            resetStatus();
          }).catch(() => {

          });
        } else {
          setDevice();
        }
      } else {
        setDevice();
      }
    })();
  }
}
export default ActuatorRetractable;