var l=Object.defineProperty,i=Object.defineProperties;var u=Object.getOwnPropertyDescriptors;var o=Object.getOwnPropertySymbols;var d=Object.prototype.hasOwnProperty,v=Object.prototype.propertyIsEnumerable;var t=(s,a,e)=>a in s?l(s,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[a]=e,r=(s,a)=>{for(var e in a||(a={}))d.call(a,e)&&t(s,e,a[e]);if(o)for(var e of o(a))v.call(a,e)&&t(s,e,a[e]);return s},c=(s,a)=>i(s,u(a));import{a as m,aj as p,ak as A,d as C,h as _,a3 as g}from"./index.9b424d6f.js";var f=m({name:"QCardActions",props:c(r({},p),{vertical:Boolean}),setup(s,{slots:a}){const e=A(s),n=C(()=>`q-card__actions ${e.value} q-card__actions--${s.vertical===!0?"vert column":"horiz row"}`);return()=>_("div",{class:n.value},g(a.default))}});export{f as Q};
