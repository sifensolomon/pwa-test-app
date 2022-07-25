<script setup>
import {
  onMounted,
  onUpdated,
  reactive,
  ref,
  computed,
  provide,
  toRef,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { uibuilder } from "boot/uibuilder";
import { apollo } from "boot/apollo";
const route = useRoute();
const { t, locale } = useI18n({ useScope: "global" });
onUpdated(() => {
  //console.log(route.params);
});

let smartFarm = reactive({
  loggedIn: false,
  isLocal: false,
  title: {
    header: "",
    footer: "",
  },
  isController: false,
  connectedTo: "",
  homeServerInfo: {},
  controllers: [],
  controller: {},
  orientation: 0,
  basePath: "",
  send: {},
  msg: {},
  isDeviceControl: false,
  menuIndex: 0,
  isRemote: false,
  color: [
    {
      text: "green",
      bg: "bg-green-6",
    },
    {
      text: "lime-10",
      bg: "bg-lime-9",
    },
    {
      text: "purple-8",
      bg: "bg-deep-purple-5",
    },
    {
      text: "indigo-6",
      bg: "bg-light-indigo-14",
    },
    {
      text: "red-10",
      bg: "bg-red-6",
    },
    {
      text: "orange-8",
      bg: "bg-amber-7",
    },
    {
      text: "green",
      bg: "bg-green-6",
    },
    {
      text: "lime-10",
      bg: "bg-lime-9",
    },
    {
      text: "purple-8",
      bg: "bg-deep-purple-5",
    },
    {
      text: "indigo-6",
      bg: "bg-light-indigo-14",
    },
    {
      text: "red-10",
      bg: "bg-red-6",
    },
    {
      text: "orange-8",
      bg: "bg-amber-7",
    },
  ],
  menus: [],
  deviceControlChange: function () {
    //console.log("this.isController", this.isController);
    //console.log("this.controller", this.controller);
    if (this.isController) {
      var topic = "smartFarm/system";
    } else {
      var topic = this.controller._id + "/smartFarm/system";
    }
    console.log({
      topic: topic,
      payload: {
        command: "setControl",
        device: {
          ...this.controller,
          edit: {
            masterNodeAddress: parseInt(this.controller.masterNodeAddress, 10),
            value: smartFarm.controller.controlOptions.value,
          },
        },
      },
    });
    uibuilder.send({
      topic: topic,
      payload: {
        command: "setControl",
        device: {
          ...this.controller,
          edit: {
            masterNodeAddress: parseInt(this.controller.masterNodeAddress, 10),
            value: smartFarm.controller.controlOptions.value,
          },
        },
      },
    });
  },
  selectMenu: function (index) {
    this.menuIndex = index;
    //console.log("this.isRemote", this.isRemote);
    if (this.isRemote) {
      smartFarm.controller.controlOptions.value =
        smartFarm.controllers[index].deviceControl;
      smartFarm.controller._id = smartFarm.controllers[index]._id;
      smartFarm.controller.masterNodeAddress =
        smartFarm.controllers[index].masterNodeAddress;
      //console.log(smartFarm.controller);
    }
  },
});

const setLanguage = (lang) => {
  console.log("local", $q.lang.getLocale(), "lang", lang);
  locale.value = lang;
};

smartFarm.isRemote = computed(() => {
  return !(smartFarm.isLocal || smartFarm.isController);
});

// const menus = computed(() => {
//   if (smartFarm.isController) {
//     return
//   } else {
//     // let menus =
//     // menus.unshift({
//     //   icon: 'home',
//     //   title: "모두 보기",
//     //   to: {
//     //     name: 'nodeStatus',
//     //     params: { controllerId: "controller/0" }
//     //   }
//     // });
//     return ;
//   }
// });

const router = useRouter();
const pathname = window.location.pathname.split("/");
const view = pathname.pop();
// if (['nodeStatus', 'nodeconfig', 'nodeDefault', 'nodeMaps'].includes(view)) {
//   router.replace({ path: pathname.join('/') })
// };
router.addRoute({
  // 접속 단말에 따라 접속 경로가 바뀌므로 거기에 맞춰 기본경로를 설정한다.
  name: "Home",
  path: smartFarm.basePath + "/",
  component: () => import("./App.vue"),
});

const isIP = (address) => {
  const r = RegExp(
    "^http[s]?:\/\/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])"
  );
  return r.test(address);
};
console.log(window.location);
console.log(isIP(window.location.origin));
console.log(window.location.hostname.startsWith("127"));

// 경로
// 1. 클라우드 서버
// 1.1 직접접속 : https://smartfarm.tyeng.com
// 1.2 개발서버에서 접속 : https://controller.dev.tyeng.com/cloudServer/smartFarm
// 2. 홈서버
// 2.1 직접접속
//    a. nginx  : http://192.168.100.54/homeServer  ==> ngix에서 homeServer를 잘라줌
//    b. port  : http://192.168.100.54:1880/smartFarm
// 2.2 개발서버에서 접속 : https://controller.dev.tyeng.com/homeServer/smartFarm
// 3. 제어기
// 3.1 직접접속
//    a. nginx  : http://192.168.100.54/house[1-9]  ==> nginx에서 house[1-9]을 잘라줌
//    b. port  : http://192.168.100.54:188[1-9]/smartFarm ==> port 포워딩
// 3.2 개발서버에서 접속 : https://controller.dev.tyeng.com/house[1-9]/smartFarm

if (
  window.location.hostname === "controller.smartfarm.tyeng.com" ||
  window.location.hostname === "sifen.tyeng.com"
) {
  // 클라우드 서버에 접속할때
  smartFarm.connectedTo = "cloudServer";
  smartFarm.namespace = {
    namespace: "/smartFarm",
    ioPath: "/cloudServer/uibuilder/vendor/socket.io",
  };
  smartFarm.basePath = "";
  console.log("controller.smartfarm.tyeng.com", smartFarm.namespace);
} else if (
  isIP(window.location.origin) &&
  window.location.pathname.startsWith("/homeServer")
) {
  //  홈서버 접속 할때
  smartFarm.connectedTo = "homeServer";
  smartFarm.namespace = {
    namespace: "/smartFarm",
    ioPath: "/homeServer/uibuilder/vendor/socket.io",
  };
  smartFarm.basePath = "/homeServer/smartFarm";
  console.log("/homeServer", smartFarm.namespace);
} else if (isIP(window.location.origin) && window.location.port === "1880") {
  //  홈서버 접속 할때
  smartFarm.connectedTo = "homeServer";
  smartFarm.namespace = {
    namespace: "/smartFarm",
    ioPath: "/uibuilder/vendor/socket.io",
  };
  smartFarm.basePath = "/smartFarm";
  console.log("1880", smartFarm.namespace);
} else if (
  isIP(window.location.origin) &&
  window.location.pathname.startsWith("/house")
) {
  // 제어기에 접속할때
  smartFarm.connectedTo = "controller";
  const house = window.location.pathname.split("/");
  smartFarm.namespace = {
    namespace: "/smartFarm",
    ioPath: "/" + house[1] + "/uibuilder/vendor/socket.io",
  };
  smartFarm.basePath = "/" + house[1] + "/smartFarm";
  console.log("/house", smartFarm.namespace);
} else if (
  isIP(window.location.origin) &&
  window.location.port.startsWith("188")
) {
  // 제어기에 접속할때
  smartFarm.connectedTo = "controller";
  smartFarm.namespace = {
    namespace: "/smartFarm",
    ioPath: "/uibuilder/vendor/socket.io",
  };
  smartFarm.basePath = "/smartFarm";
  console.log("188", smartFarm.namespace);
} else if (window.location.host === "localhost:1880") {
  // 제어기 터치 스크린 일때
  smartFarm.connectedTo = "controller";
  smartFarm.isLocal = true;
  smartFarm.namespace = {
    namespace: "/smartFarm",
    ioPath: "/uibuilder/vendor/socket.io",
  };
  smartFarm.basePath = "/smartFarm";
  console.log("localhost:1880", smartFarm.namespace);
} else {
  // 개발 서버일대
  if (window.location.pathname.startsWith("/cloudServer/smartFarm")) {
    smartFarm.connectedTo = "cloudServer";
    smartFarm.namespace = {
      namespace: "/smartFarm",
      ioPath: "/cloudServer/uibuilder/vendor/socket.io",
    };
    smartFarm.basePath = "/cloudServer/smartFarm";
    console.log("cloudServer dev", smartFarm.namespace);
  } else if (window.location.pathname.includes("/homeServer/smartFarm")) {
    smartFarm.connectedTo = "homeServer";
    //console.log("window.location.pathname", window.location.pathname)
    //console.log("window.location.host", window.location.host)
    smartFarm.namespace = {
      namespace: "/smartFarm",
      ioPath: "/homeServer/uibuilder/vendor/socket.io",
      // vueApp: app
    };
    smartFarm.basePath = "/homeServer/smartFarm";
    console.log("homeServer dev", smartFarm.namespace);
  } else if (window.location.pathname.startsWith("/house")) {
    smartFarm.connectedTo = "controller";
    const house = window.location.pathname.split("/");
    smartFarm.namespace = {
      namespace: "/smartFarm",
      ioPath: "/" + house[1] + "/uibuilder/vendor/socket.io",
      // vueApp: app
    };
    smartFarm.basePath = "/" + house[1] + "/smartFarm";
    console.log("house " + house[1] + " dev", smartFarm.namespace);
  } else if (window.location.pathname.startsWith("/localhost")) {
    smartFarm.connectedTo = "controller";
    const localhost = window.location.pathname
      .split("/")[1]
      .split("localhost")[1];
    smartFarm.isLocal = true;
    smartFarm.namespace = {
      namespace: "/smartFarm",
      ioPath: "/house" + localhost + "/uibuilder/vendor/socket.io",
      // vueApp: app
    };
    smartFarm.basePath = "/localhost" + localhost;
    console.log("localhost dev", smartFarm.namespace);
  } else {
    smartFarm.connectedTo = "cloudServer";
    smartFarm.namespace = {
      namespace: "/smartFarm",
      ioPath: "/cloudServer/uibuilder/vendor/socket.io",
      // vueApp: app
    };
    smartFarm.basePath = "/cloudServer/smartFarm";
    console.log("else dev", smartFarm.namespace);
  }
}
router.addRoute({
  // 접속 단말에 따라 접속 경로가 바뀌므로 거기에 맞춰 기본경로를 설정한다.
  name: "nodeStatus",
  path: smartFarm.basePath + "/nodeStatus",
  component: () => import("./pages/nodeStatus.vue"),
});
router.addRoute({
  name: "nodeConfig",
  path: smartFarm.basePath + "/nodeConfig",
  component: () => import("./pages/nodeConfig.vue"),
});
router.addRoute({
  name: "nodeDefault",
  path: smartFarm.basePath + "/nodeDefault",
  component: () => import("./pages/nodeDefault.vue"),
});
router.addRoute({
  name: "nodeMaps",
  path: smartFarm.basePath + "/nodeMaps",
  component: () => import("./pages/nodeMaps.vue"),
});

// app.uibuilder.debug(true);
//app.uibuilder.debug('debug','uibuilder debugger');
// provide('uibuilder', uibuilder);
const $q = useQuasar();
if ($q.platform.is.mobile) {
  //모바일이면 제어 옵션의 글자를 줄인다.
  smartFarm.controller.controlOptions = [
    { label: "로컬", value: 0 },
    { label: "원격", value: 1 },
    { label: "수동", value: 2 },
  ];
} else {
  smartFarm.controller.controlOptions = [
    { label: "로컬제어", value: 0 },
    { label: "원격제어", value: 1 },
    { label: "수동제어", value: 2 },
  ];
}
smartFarm.orientation =
  (screen.orientation || {}).type ||
  screen.mozOrientation ||
  screen.msOrientation;

if (smartFarm.orientation === "landscape-primary") {
  // 화면의 가로세로 방향을 검출한다.
  //console.log("landscape-primary");
} else if (smartFarm.orientation === "landscape-secondary") {
  //console.log("landscape-secondary");
} else if (smartFarm.orientation === "portrait-primary") {
  //console.log("portrait-primary");
} else if (smartFarm.orientation === "portrait-secondary") {
  //console.log("portrait-secondary");
} else if (smartFarm.orientation === undefined) {
  //console.log("undefined");
}

//console.log("location", window.location);
smartFarm.send = uibuilder.send;
smartFarm.start = uibuilder.start;
smartFarm.get = uibuilder.get;
smartFarm.t = t;
provide("smartFarm", smartFarm);
const drawer = ref(false);

smartFarm.title = computed(() => {
  // 가로세로 모드에 따라 제목을 설정한다.
  if (
    smartFarm.orientation === "portrait-primary" ||
    smartFarm.orientation === "portrait-secondary"
  ) {
    console.log("세로");
    return {
      header: "",
      footer: "TYEng",
    };
  } else if (
    smartFarm.orientation === "landscape-primary" ||
    smartFarm.orientation === "landscape-secondary"
  ) {
    if (smartFarm.isController) {
      if (
        smartFarm.controller.nickName !== undefined &&
        smartFarm.controller.nickName.length > 0
      ) {
        var header =
          smartFarm.controller.name + "(" + smartFarm.controller.nickName + ")";
      } else {
        var header = smartFarm.isLocal ? "" : smartFarm.controller.name;
      }
    } else {
      console.log("가로 온실운영시스템");
      var header = t("title.header");
    }
    return {
      header: header,
      footer: t("title.header"),
    };
  } else {
    return {
      header: smartFarm.controller.name,
      footer: t("title.footer"),
    };
  }
});

// const login = () => {
//   credential.identifier = "hello@tyeng.com";
//   credential.password = "hello1234";
//   fetch("https://strapi.dev.tyeng.com/api/auth/local", {
//     method: 'post',
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json;charset=UTF-8",
//     },
//     body: JSON.stringify({
//       identifier: credential.identifier,
//       password: credential.password
//     })
//   }).then((response) => {
//     if (!response.ok) {
//       throw Error(response.statusText);
//     }
//     return response.json()
//   }).then((result) => {
//     console.log(result);
//     smartFarm.loggedIn = true;
//     console.log(smartFarm.namespace);
//     smartFarm.namespace.userInfo = {
//       jwt: result.jwt,
//       username: result.user.username,
//       email: result.user.email,
//       homeServerNumber: result.user.homeServerNumber
//     }
//     //console.log(smartFarm.namespace);
//     uibuilder.start(smartFarm.namespace);
//     //console.log("ioConnected", uibuilder.get("ioConnected"));
//     let ioConnected;
//     (ioConnected = (i) => {
//       setTimeout(function () {
//         if (i > 0) {
//           console.log("smartFarm.connectedTo", smartFarm.connectedTo);
//           if (uibuilder.get("ioConnected")) {
//             //console.log("ioConnected", uibuilder.get("ioConnected"), "i", i);
//             uibuilder.send({
//               topic: "smartFarm/homeServerInfo",
//               collection: "homeServerInfo",
//               operation: "findOne",
//             });
//             i = 0;
//           }
//         } else {
//           ioConnected(--i);
//         }
//       }, 200)
//     })(10);
//   });
//   // smar
// };

onMounted(() => {
  console.log("App is mounted!");
  let body = null;
  if (
    !smartFarm.loggedIn &&
    (window.location.pathname.startsWith("/cloudServer/smartFarm") ||
      window.location.hostname === "controller.smartfarm.tyeng.com" ||
      window.location.hostname === "sifen.tyeng.com"
    )
  ) {
    router.addRoute({
      // 접속 단말에 따라 접속 경로가 바뀌므로 거기에 맞춰 기본경로를 설정한다.
      name: "Login",
      path: smartFarm.basePath + "/Login",
      component: () => import("./pages/userLogin.vue"),
    });
    smartFarm.loggedIn = false;
    router.push({ name: "Login" });
  } else {
    uibuilder.start(smartFarm.namespace);
    console.log("ioConnected", uibuilder.get("ioConnected"));
    let ioConnected;
    (ioConnected = (i) => {
      setTimeout(function () {
        if (i > 0) {
          //console.log("smartFarm.connectedTo", smartFarm.connectedTo);
          if (uibuilder.get("ioConnected")) {
            console.log("smartFarm/homeServerInfo", {
              topic: "smartFarm/homeServerInfo",
              collection: "homeServerInfo",
              operation: "findOne",
            });
            uibuilder.send({
              topic: "smartFarm/homeServerInfo",
              collection: "homeServerInfo",
              operation: "findOne",
            });
            i = 0;
          }
        } else {
          console.log("i", i);
          ioConnected(--i);
        }
      }, 200);
    })(30);
  }
  // fetch("https://strapi.dev.tyeng.com/api/auth/local", {
  //   method: 'post',
  //   headers: {
  //     Accept: "application/json",
  //     "Content-Type": "application/json;charset=UTF-8",
  //   },
  //   body: JSON.stringify(body)
  // }).then((response) => {
  //   if (!response.ok) {
  //     throw Error(response.statusText);
  //   }
  //   return response.json()
  // }).then((result) => {
  //   //console.log(result);
  //   console.log(smartFarm.namespace);
  //   smartFarm.namespace.userInfo = {
  //     jwt: result.jwt,
  //     username: result.user.username,
  //     email: result.user.email,
  //     homeServerNumber: result.user.homeServerNumber
  //   }
  //   //console.log(smartFarm.namespace);
  //   uibuilder.start(smartFarm.namespace);
  //   //console.log("ioConnected", uibuilder.get("ioConnected"));
  //   let ioConnected;
  //   (ioConnected = (i) => {
  //     setTimeout(function () {
  //       if (i > 0) {
  //         //console.log("smartFarm.connectedTo", smartFarm.connectedTo);
  //         if (uibuilder.get("ioConnected")) {
  //           //console.log("ioConnected", uibuilder.get("ioConnected"), "i", i);
  //           uibuilder.send({
  //             topic: "smartFarm/homeServerInfo",
  //             collection: "homeServerInfo",
  //             operation: "findOne",
  //           });
  //           i = 0;
  //         }
  //       } else {
  //         ioConnected(--i);
  //       }
  //     }, 200)
  //   })(10);
  // }).catch((error) => {
  //   console.log("error", error);
  //   router.addRoute({ // 접속 단말에 따라 접속 경로가 바뀌므로 거기에 맞춰 기본경로를 설정한다.
  //     name: 'Login',
  //     path: smartFarm.basePath + '/Login',
  //     component: () => import('./pages/userLogin.vue')
  //   });
  //   smartFarm.loggedIn = false;
  //   router.push({ name: 'Login' });
  // });
  // smartFarm.namespace.homeServerNumber = apollo.userInfo.user.homeServerNumber;
  // //console.log(smartFarm.namespace.homeServerNumber);
  document.title = "TYEng LTD";
  uibuilder.onChange("msg", function (msg) {
    smartFarm.msg = JSON.parse(JSON.stringify(msg));
    // console.log("app.vue", smartFarm.msg);
    const topicArray = msg.topic.split("/");
    //console.log("topicArray[topicArray.length - 1]", topicArray[topicArray.length - 1]);
    if (topicArray[topicArray.length - 1] === "system") {
      topic = msg.payload.edit.command;
      //console.log("topic", topic);
    } else if (msg.topic.startsWith("smartFarm")) {
      var topic = msg.topic.split("/")[1];
    } else if (msg.topic === "nodeConfig/setControllerName") {
      // 노드 정보에서 올라온 메시지 이지만 상위 컴포넌트로 메시지를 올리는 것보다 소켓 메시지를 이렇게 이용하는 것이 효율적인다.
      smartFarm.controller.name = msg.name;
      smartFarm.controller.nickName = msg.nickName;
      smartFarm.controller.masterNodeAddress = msg.masterNodeAddress;
    } else {
      return;
    }
    //console.log(topic);
    switch (
    String(topic) // ui로 요청되는 topic에 따라 동작을 한다
    ) {
      case "homeServerInfo":
        if (msg.payload === null) {
          smartFarm.isController = true;
        } else {
          //console.log(msg.payload);
          smartFarm.homeServerInfo = JSON.parse(JSON.stringify(msg.payload));
          smartFarm.isController = false;
        }
        uibuilder.send({
          topic: "smartFarm/controllerInfo",
          collection: "controllerInfo",
          operation: "find.toArray",
        });
        break;
      case "controllerInfo":
        smartFarm.controllers = JSON.parse(JSON.stringify(msg.payload)); // controller정보에 버튼 비활성화를 위한 disable정보를 넣는다.
        //console.log(smartFarm.isController);
        if (smartFarm.isController) {
          // 제어기 직접 접속이면 제어기 아이디 및 제어권 상태를 갱신한다.
          // let controllerIndex = smartFarm.controllers.map(controller => controller._id).indexOf(smartFarm.homeServerInfo.selectedController);
          smartFarm.controller.controlOptions.value =
            smartFarm.controllers[0].deviceControl;
          smartFarm.controller._id = smartFarm.controllers[0]._id;
          smartFarm.controller.masterNodeAddress =
            smartFarm.controllers[0].masterNodeAddress;
          smartFarm.menus = computed(() => {
            return [
              {
                icon: "generating_tokens",
                title: t("menu.nodeStatus"), //t함수 internationalization i18n
                to: {
                  name: "nodeStatus",
                },
              },
              {
                icon: "settings",
                title: t("menu.nodeConfig"),
                to: {
                  name: "nodeConfig",
                },
              },
              {
                icon: "screen_search_desktop",
                title: t("menu.nodeDefault"),
                to: {
                  name: "nodeDefault",
                },
              },
              {
                icon: "map",
                title: t("menu.nodeMaps"),
                to: {
                  name: "nodeMaps",
                },
              },
            ];
          });
        } else if (
          smartFarm.basePath === "/homeServer/smartFarm" ||
          smartFarm.connectedTo === "cloudServer"
        ) {
          //console.log(smartFarm.basePath)
          //console.log(msg);
          if (msg.payload === null || msg.payload.length === 0) {
            uibuilder.send({
              topic: "smartFarm/system",
              payload: {
                command: "scanController",
              },
            });
          } else {
            //console.log("smartFarm.controllers", smartFarm.controllers)
            smartFarm.menus = smartFarm.controllers.map((device) => {
              return {
                icon: "home",
                title: device.name + "(" + device.nickName + ")",
                to: {
                  name: "nodeStatus",
                  params: { controllerId: device._id },
                },
              };
            });
          }
        }
        //console.log("smartFarm.menus", smartFarm.menus);
        router.push({ name: "nodeStatus" });
        //console.log("smartFarm.basePath", smartFarm.basePath);
        smartFarm.controller.isDeviceControl =
          smartFarm.isLocal && smartFarm.controller.deviceControl === 0
            ? true
            : !smartFarm.isLocal && smartFarm.controller.deviceControl === 1
              ? true
              : smartFarm.controller.deviceControl === 2
                ? false
                : true;
        //console.log("smartFarm.controller.isDeviceControl", smartFarm.controller.isDeviceControl);
        break;
      case "scanController":
        //console.log("msg", msg);
        let index = smartFarm.controllers
          .map((controller) => controller._id)
          .indexOf(msg.payload._id);
        let length = 0;
        if (index > -1) {
          smartFarm.controllers[index] = JSON.parse(
            JSON.stringify(msg.payload)
          );
        } else {
          length = smartFarm.controllers.push(msg.payload);
        }
        // 제어기 배열이 존재 했다면 첫번째 인자가 왔을때
        // 없었다면 첫번째 인자가 생성되었을때 3초간 타이머를 돌려 화면을 갱신한다.
        if (index === 0 || length === 1) {
          // 화면을 갱신하려면 메뉴를 만들고 nodeStatus로 라우팅한다.
          setTimeout(() => {
            smartFarm.menus = smartFarm.controllers.map((device) => {
              return {
                icon: "home",
                title: device.name + "(" + device.nickName + ")",
                to: {
                  name: "nodeStatus",
                  params: { controllerId: device._id },
                },
              };
            });
          }, 3000);
          router.push({ name: "nodeStatus" });
        }
        break;
      case "setControl":
        let controllerIndex = 0;
        if (smartFarm.isRemote) {
          let controllerId = topicArray[0] + "/" + topicArray[1];
          //console.log("controllerId", controllerId);
          //console.log("smartFarm.homeServerInfo.selectedController", smartFarm.homeServerInfo.selectedController);
          if (controllerId == smartFarm.homeServerInfo.selectedController) {
            controllerIndex = smartFarm.controllers
              .map((controller) => controller._id)
              .indexOf(controllerId);
          } else {
            // 현재 화면과 같은 제어기에 대한 응답이 오면 갱신하고 아니면 return한다.
            return;
          }
        } else {
        }
        //console.log("setControl", msg);
        //console.log("smartFarm.controllers[", controllerIndex, "]", smartFarm.controllers[controllerIndex])
        smartFarm.controller.controlOptions.value = msg.payload.deviceControl;
        smartFarm.controller.opid = msg.payload.opid;
        smartFarm.controller.status = msg.payload.status;
        //console.log("smartFarm.isLocal", smartFarm.isLocal)
        //console.log("smartFarm.controller.controlOptions.value", smartFarm.controller.controlOptions.value);
        smartFarm.controller.isDeviceControl =
          smartFarm.isLocal && smartFarm.controller.controlOptions.value === 0
            ? true
            : !smartFarm.isLocal &&
              smartFarm.controller.controlOptions.value === 1
              ? true
              : smartFarm.controller.controlOptions.value === 2
                ? false
                : false;
        //console.log("smartFarm.controller.isDeviceControl", smartFarm.controller.isDeviceControl);
        smartFarm.controllers[controllerIndex] = smartFarm.controller;
        //console.log("smartFarm.controller", smartFarm.controller)
        //console.log("smartFarm.controllers[", controllerIndex, "]", smartFarm.controllers[controllerIndex])
        break;
    }
  });
});
</script>
<template>
  <q-layout view="hHh lpR fFf" style="height: 100vh" class="shadow-2 rounded-borders">
    <q-header elevated :class="smartFarm.color[smartFarm.menuIndex].bg" style="height: 60px">
      <q-toolbar>
        <q-btn v-if="smartFarm.isLocal" color="green" v-on:click="reloadPage()" label="새로고침" />
        <q-btn v-else flat @click="drawer = !drawer" round dense icon="menu" />
        <q-toolbar-title>{{ smartFarm.title.header }}</q-toolbar-title>
        <div class="row items-center no-wrap">
          <q-select outlined v-model="smartFarm.controller.controlOptions.value"
            :options="smartFarm.controller.controlOptions" map-options emit-value dense options-dense inline
            @update:model-value="smartFarm.deviceControlChange()" v-if="
              router.currentRoute.value.name === 'home' ||
              router.currentRoute.value.name === 'nodeStatus' ||
              router.currentRoute.value.name === 'uibuilder'
            ">
            <template v-slot:prepend>
              <q-icon name="event" />
            </template>
          </q-select>
          <div class="col text-right">
            <q-fab color="teal" icon="keyboard_arrow_left" direction="left" style>
              <q-fab-action color="purple-8" label="한국어" @click="setLanguage('ko-KR')" icon="bolt"
                label-position="left" />
              <q-fab-action color="red" label="english" @click="setLanguage('en-US')" icon="thermostat"
                label-position="left" />
              <q-fab-action color="blue" label="አማሪኛ" @click="setLanguage('am-ET')" icon="wind_power"
                label-position="left" />
            </q-fab>
          </div>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawer" show-if-above :width="200" :breakpoint="500" bordered class="bg-grey-3"
      v-if="!smartFarm.isLocal">
      <q-scroll-area class="fit">
        <q-list>
          <template v-for="(menu, index) in smartFarm.menus" :key="index">
            <q-item clickable :active="index === 1" :to="menu.to" v-on:click="smartFarm.selectMenu(index)">
              <!--제어기화면이 아닌경우 제어기 리스트가 메뉴이다-->
              <q-item-section avatar>
                <q-icon :name="menu.icon" :color="smartFarm.color[index].text" />
              </q-item-section>
              <q-item-section>{{ menu.title }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
