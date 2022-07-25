<script setup>
import { inject, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const router = useRouter();
const { t, locale } = useI18n({ useScope: "global" });

const smartFarm = inject("smartFarm");

let credential = reactive({
  identifier: "",
  password: "",
  isPwd: true,
});
// switch (parseInt(window.location.href.split("=")[1])) {
//   case 0:
//     body = {
//       identifier: "hello@tyeng.com",
//       password: "hello1234"
//     }
//     break;
//   case 1:
//     body = {
//       identifier: "tyengltd@gmail.com",
//       password: "tyeng1234"
//     }
//     break;
//   default:
//     body = {
//       identifier: "hello@tyeng.com",
//       password: "hello123"
//     }
// };
credential.identifier = "hello@tyeng.com";
credential.password = "hello1234";
const login = () => {
  fetch("https://strapi.dev.tyeng.com/api/auth/local", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify({
      identifier: credential.identifier,
      password: credential.password,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        console.log("hey");
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then((result) => {
      smartFarm.loggedIn = true;
      console.log(smartFarm.namespace);
      smartFarm.namespace.userInfo = {
        jwt: result.jwt,
        username: result.user.username,
        email: result.user.email,
        homeServerNumber: result.user.homeServerNumber,
      };
      smartFarm.start(smartFarm.namespace);
      //console.log("ioConnected", uibuilder.get("ioConnected"));
      let ioConnected;
      (ioConnected = (i) => {
        setTimeout(function () {
          if (i > 0) {
            //console.log("smartFarm.connectedTo", smartFarm.connectedTo);
            if (smartFarm.get("ioConnected")) {
              //console.log("ioConnected", uibuilder.get("ioConnected"), "i", i);
              smartFarm.send({
                topic: "smartFarm/homeServerInfo",
                collection: "homeServerInfo",
                operation: "findOne",
              });
              i = 0;
            }
          } else {
            ioConnected(--i);
          }
        }, 200);
      })(10);
    });
};
</script>
<!-- <template>
  <div
    class="col-lg-5 col-sm-5 col-md-5 q-pa-sm row items-start q-gutter-sm justify-center bg-image"
  >
    <q-card class="my-card q-pa-md mar q-mt-lg">
      <q-card-section>
        <q-input
          color="green"
          v-model="credential.identifier"
          filled
          type="email"
          hint="Email"
        />
        <q-input
          color="green"
          v-model="credential.password"
          filled
          :type="credential.isPwd ? 'password' : 'text'"
          hint="Password with toggle"
        >
          <template v-slot:append>
            <q-icon
              :name="credential.isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="credential.isPwd = !credential.isPwd"
            />
          </template>
        </q-input>
      </q-card-section>
      <q-separator />
      <q-card-actions vertical>
        <q-btn flat v-on:click="login()">{{ t("title.login") }}</q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>

<style>
.bg-image {
  background-image: url(https://wallpaper-mania.com/wp-content/uploads/2018/09/High_resolution_wallpaper_background_ID_77700411502.jpg);
  background-repeat: no-repeat;
  background-size: cover;
  height: 100vh;
}
.q-mt-lg {
  margin-top: 200px;
}
</style> -->
<template>
  <article>
    <div class="q-pa-sm row items-center q-gutter-sm justify-center" style="height: 94vh">
      <div class="container" :class="{ signUp }">
        <div class="overlay-container">
          <div class="overlay">
            <div class="overlay-right">
              <h2>{{ t("title.Hello") }}</h2>
              <p>{{ t("title.Please") }}</p>
              <button class="invert" id="signUp">{{ t("title.Sign") }}</button>
            </div>
          </div>
        </div>

        <form class="sign-in" action="#">
          <h2>{{ t("title.signin") }}</h2>
          <div class="form-subtitle">{{ t("title.use") }}</div>

          <q-input class="form-input" color="green" v-model="credential.identifier" filled type="email"
            :hint="t('title.Email')" />
          <q-input class="form-input" color="green" v-model="credential.password" filled
            :type="credential.isPwd ? 'password' : 'text'" :hint="t('title.Password')">
            <template v-slot:append>
              <q-icon :name="credential.isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                @click="credential.isPwd = !credential.isPwd" />
            </template>
          </q-input>

          <q-separator />

          <a href="#">{{ t("title.Forgot") }}</a>
          <q-card-actions vertical>
            <q-btn flat v-on:click="login()">{{ t("title.login") }}</q-btn>
          </q-card-actions>
        </form>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  data: () => {
    return {
      signUp: false,
    };
  },
};
</script>

<style lang="scss" scoped>
.container {
  position: absolute;
  width: 768px;
  height: 480px;
  border-radius: 10px;
  overflow: hidden;

  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2), 0 10px 10px rgba(0, 0, 0, 0.2);
  background: linear-gradient(to bottom, #efefef, #ccc);

  .overlay-container {
    position: absolute;
    top: 0;
    left: 50%;
    width: 50%;
    height: 100%;
    overflow: hidden;
    z-index: 100;
  }

  .overlay {
    position: relative;
    left: -100%;
    height: 100%;
    width: 200%;
    background: linear-gradient(to bottom right, #7fd625, #009345);
    color: #fff;
    transform: translateX(0);
    transition: transform 0.5s ease-in-out;
  }

  @mixin overlays($property) {
    position: absolute;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 0px 25px;
    width: 50%;
    height: 100%;
    text-align: center;
    transform: translateX($property);
    transition: transform 0.5s ease-in-out;
  }

  .overlay-right {
    @include overlays(0);
    right: 0;
  }
}

h2 {
  margin: 12px;

  text-transform: uppercase;
}

a {
  color: #222;
  text-decoration: none;
  margin: 15px 0;
  font-size: 1rem;
}

button {
  border-radius: 20px;
  border: 1px solid #009345;
  background-color: #009345;
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  padding: 10px 40px;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.1s ease-in;

  &:active {
    transform: scale(0.9);
  }
}

button.invert {
  background-color: transparent;
  border-color: #fff;
}

form {
  position: inherit;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 50%;
  height: 100%;

  background: linear-gradient(to bottom, #efefef, #ccc);

  .form-input {
    width: 70%;
  }

  .form-subtitle {
    margin: 12px 0px;
  }
}
</style>
