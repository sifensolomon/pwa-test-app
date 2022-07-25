import { boot } from 'quasar/wrappers'
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from '@apollo/client/core';
import { provideApolloClient, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from 'vue';
import { io } from "socket.io-client";

const httpLink = new HttpLink({ uri: "https://app.dev.tyeng.com/graphql" });
let urlParams = new URLSearchParams(window.location.search);
// let code = urlParams.get('code');
let apollo = reactive({
    // userInfo: {},
    // socket: {},
    // start: () => {
    //     this.socket = io("https://controller.dev.tyeng.com", {
    //         jwt: this.userInfo.jwt,
    //         homeServerNumber: this.userInfo.homeServerNumber
    //     });
    // },
    queryApollo: (pagesQuery, matchKeys) => {
        return new Promise(function (resolve, reject) {
            if (typeof (pagesQuery) === "string") {
                console.log(pagesQuery);
                const { result, onResult, onError } = useQuery(gql`${pagesQuery}`);
                onResult((result) => {
                    console.log(result);
                    let dataVal = [];
                    if (matchKeys !== undefined) {
                        matchKeys.forEach((matchKey, index) => {
                            dataVal.push(eval("result." + matchKey));
                        })
                        resolve(dataVal);
                    } else {
                        reject(result);
                    }
                })
                onError((error) => {
                    reject(error);
                })
            }
            else {
                reject(pagesQuery);
            }
        });
    }
});
// console.log("code", code);
let link = null;

// console.log("userInfo", apollo.userInfo);

// if (code !== null) {
//     console.log("1111 code 1111", code)
//     fetch("https://controller.dev.tyeng.com/strapi-google-auth/user-profile", {
//         method: 'post',
//         headers: {
//             Accept: "application/x-www-form-urlencoded",
//         },
//         data: JSON.stringify({
//             "code": code
//         })
//     }).then((response) => {

//         if (!response.ok) {
//             throw Error(response.statusText);
//         }
//         return response;
//     }).then((result) => {
//         console.log(result);
//         console.log(result.data.token);
//         let userInfo = {}
//         userInfo.jwt = result.data.token;
//         userInfo.username = result.data.user.username;
//         userInfo.email = result.data.user.email;
//         userInfo.homeServerNumber = result.data.user.homeServerNumber;
//         fetch("https://controller.dev.tyeng.com/strapi-google-auth/init", {
//             method: "GET",
//             headers: { Authentication: `Bearer ${userInfo.jwt}` }
//         })
//             .then(response => {
//                 if (!response.ok) {
//                     console.log(response);
//                     throw Error(response.statusText);
//                 }
//                 return response.json();
//             })
//             .then(response => {
//                 console.log("++++++++++++++++++", response.data);
//             }).catch((error) => {
//                 console.log("---------------", error)
//             })
//         const authMiddleware = () =>
//             new ApolloLink((operation, forward) => {
//                 operation.setContext({
//                     headers: {
//                         Authorization: `Bearer ${userInfo.jwt}`
//                     },
//                 });
//                 return forward(operation);
//             });
//         const link = authMiddleware().concat(httpLink);
//         const cache = new InMemoryCache();
//         const apolloClient = new ApolloClient({
//             link: link,
//             cache,
//         });
//         provideApolloClient(apolloClient);
//     }).catch((error) => {
//         console.log("=====================", error);
//         fetch("https://controller.dev.tyeng.com/strapi-google-auth/me")
//             .then((response) => response.json())
//             .then((data) => {
//                 // window.location.href = data.url;
//             });
//     })
// }
// else {
//     console.log("code is null");
//     fetch("https://strapi.liya.tyeng.com/strapi-google-auth/init")
//         .then((response) => response.json())
//         .then((data) => {
//             window.location.href = data.url;
//         }).catch((error) => {
//             console.log("fetching error", error);
//         });
// }

export default boot(async ({ app }) => {
    app.config.globalProperties.$apollo = apollo
})

export { apollo }