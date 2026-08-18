import{r as g,h as en,j as a,L as tn}from"./vendor-react-B5_-Np9f.js";import"./stems-branches-DSkMz5m0.js";import{T as nn}from"./bazi-BNfFr-Co.js";import"./index-BGoleodY.js";import{P as me,u as fe,c as xt,a as rn,b as on,d as sn,e as ie,f as gt,g as an,D as cn}from"./index-xgkwpqQ8.js";import{u as Re,c as ln}from"./index-C0GzRw5M.js";import{c as bt}from"./index-ge29WYjH.js";import{B as dn}from"./books-DU9sqaWZ.js";const fn=["top","right","bottom","left"],Z=Math.min,Y=Math.max,ye=Math.round,be=Math.floor,U=e=>({x:e,y:e}),un={left:"right",right:"left",bottom:"top",top:"bottom"};function vt(e,t,n){return Y(e,Z(t,n))}function Q(e,t){return typeof e=="function"?e(t):e}function ee(e){return e.split("-")[0]}function le(e){return e.split("-")[1]}function Ie(e){return e==="x"?"y":"x"}function Fe(e){return e==="y"?"height":"width"}function q(e){const t=e[0];return t==="t"||t==="b"?"y":"x"}function Ge(e){return Ie(q(e))}function pn(e,t,n){n===void 0&&(n=!1);const r=le(e),o=Ge(e),s=Fe(o);let i=o==="x"?r===(n?"end":"start")?"right":"left":r==="start"?"bottom":"top";return t.reference[s]>t.floating[s]&&(i=we(i)),[i,we(i)]}function hn(e){const t=we(e);return[Me(e),t,Me(t)]}function Me(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}const et=["left","right"],tt=["right","left"],mn=["top","bottom"],xn=["bottom","top"];function gn(e,t,n){switch(e){case"top":case"bottom":return n?t?tt:et:t?et:tt;case"left":case"right":return t?mn:xn;default:return[]}}function bn(e,t,n,r){const o=le(e);let s=gn(ee(e),n==="start",r);return o&&(s=s.map(i=>i+"-"+o),t&&(s=s.concat(s.map(Me)))),s}function we(e){const t=ee(e);return un[t]+e.slice(t.length)}function vn(e){var t,n,r,o;return{top:(t=e.top)!=null?t:0,right:(n=e.right)!=null?n:0,bottom:(r=e.bottom)!=null?r:0,left:(o=e.left)!=null?o:0}}function yt(e){return typeof e!="number"?vn(e):{top:e,right:e,bottom:e,left:e}}function Ce(e){const{x:t,y:n,width:r,height:o}=e;return{width:r,height:o,top:n,left:t,right:t+r,bottom:n+o,x:t,y:n}}function nt(e,t,n){let{reference:r,floating:o}=e;const s=q(t),i=Ge(t),c=Fe(i),l=ee(t),d=s==="y",u=r.x+r.width/2-o.width/2,p=r.y+r.height/2-o.height/2,h=r[c]/2-o[c]/2;let f;switch(l){case"top":f={x:u,y:r.y-o.height};break;case"bottom":f={x:u,y:r.y+r.height};break;case"right":f={x:r.x+r.width,y:p};break;case"left":f={x:r.x-o.width,y:p};break;default:f={x:r.x,y:r.y}}const x=le(t);return x&&(f[i]+=h*(x==="end"?1:-1)*(n&&d?-1:1)),f}async function yn(e,t){var n;t===void 0&&(t={});const{x:r,y:o,platform:s,rects:i,elements:c,strategy:l}=e,{boundary:d="clippingAncestors",rootBoundary:u="viewport",elementContext:p="floating",altBoundary:h=!1,padding:f=0}=Q(t,e),x=yt(f),b=c[h?p==="floating"?"reference":"floating":p],v=Ce(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(b)))==null||n?b:b.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(c.floating)),boundary:d,rootBoundary:u,strategy:l})),y=p==="floating"?{x:r,y:o,width:i.floating.width,height:i.floating.height}:i.reference,A=await(s.getOffsetParent==null?void 0:s.getOffsetParent(c.floating)),w=await(s.isElement==null?void 0:s.isElement(A))&&await(s.getScale==null?void 0:s.getScale(A))||{x:1,y:1},R=Ce(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:c,rect:y,offsetParent:A,strategy:l}):y);return{top:(v.top-R.top+x.top)/w.y,bottom:(R.bottom-v.bottom+x.bottom)/w.y,left:(v.left-R.left+x.left)/w.x,right:(R.right-v.right+x.right)/w.x}}const wn=50,Cn=async(e,t,n)=>{const{placement:r="bottom",strategy:o="absolute",middleware:s=[],platform:i}=n,c=i.detectOverflow?i:{...i,detectOverflow:yn},l=await(i.isRTL==null?void 0:i.isRTL(t));let d=await i.getElementRects({reference:e,floating:t,strategy:o}),{x:u,y:p}=nt(d,r,l),h=r,f=0;const x={};for(let m=0;m<s.length;m++){const b=s[m];if(!b)continue;const{name:v,fn:y}=b,{x:A,y:w,data:R,reset:C}=await y({x:u,y:p,initialPlacement:r,placement:h,strategy:o,middlewareData:x,rects:d,platform:c,elements:{reference:e,floating:t}});u=A??u,p=w??p,x[v]={...x[v],...R},C&&f<wn&&(f++,typeof C=="object"&&(C.placement&&(h=C.placement),C.rects&&(d=C.rects===!0?await i.getElementRects({reference:e,floating:t,strategy:o}):C.rects),{x:u,y:p}=nt(d,h,l)),m=-1)}return{x:u,y:p,placement:h,strategy:o,middlewareData:x}},An=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:r,placement:o,rects:s,platform:i,elements:c,middlewareData:l}=t,{element:d,padding:u=0}=Q(e,t)||{};if(d==null)return{};const p=yt(u),h={x:n,y:r},f=Ge(o),x=Fe(f),m=await i.getDimensions(d),b=f==="y",v=b?"top":"left",y=b?"bottom":"right",A=b?"clientHeight":"clientWidth",w=s.reference[x]+s.reference[f]-h[f]-s.floating[x],R=h[f]-s.reference[f],C=await(i.getOffsetParent==null?void 0:i.getOffsetParent(d));let T=C?C[A]:0;(!T||!await(i.isElement==null?void 0:i.isElement(C)))&&(T=c.floating[A]||s.floating[x]);const j=w/2-R/2,$=T/2-m[x]/2-1,P=Z(p[v],$),G=Z(p[y],$),B=T-m[x]-G,N=T/2-m[x]/2+j,O=vt(P,N,B),I=!l.arrow&&le(o)!=null&&N!==O&&s.reference[x]/2-(N<P?P:G)-m[x]/2<0,D=I?N<P?N-P:N-B:0;return{[f]:h[f]+D,data:{[f]:O,centerOffset:N-O-D,...I&&{alignmentOffset:D}},reset:I}}}),Rn=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,r;const{placement:o,middlewareData:s,rects:i,initialPlacement:c,platform:l,elements:d}=t,{mainAxis:u=!0,crossAxis:p=!0,fallbackPlacements:h,fallbackStrategy:f="bestFit",fallbackAxisSideDirection:x="none",flipAlignment:m=!0,...b}=Q(e,t);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const v=ee(o),y=q(c),A=ee(c)===c,w=await(l.isRTL==null?void 0:l.isRTL(d.floating)),R=h||(A||!m?[we(c)]:hn(c)),C=x!=="none";!h&&C&&R.push(...bn(c,m,x,w));const T=[c,...R],j=await l.detectOverflow(t,b),$=[];let P=((r=s.flip)==null?void 0:r.overflows)||[];if(u&&$.push(j[v]),p){const O=pn(o,i,w);$.push(j[O[0]],j[O[1]])}if(P=[...P,{placement:o,overflows:$}],!$.every(O=>O<=0)){var G,B;const O=(((G=s.flip)==null?void 0:G.index)||0)+1,I=T[O];if(I&&(!(p==="alignment"?y!==q(I):!1)||P.every(k=>q(k.placement)===y?k.overflows[0]>0:!0)))return{data:{index:O,overflows:P},reset:{placement:I}};let D=(B=P.filter(H=>H.overflows[0]<=0).sort((H,k)=>H.overflows[1]-k.overflows[1])[0])==null?void 0:B.placement;if(!D)switch(f){case"bestFit":{var N;const H=(N=P.filter(k=>{if(C){const E=q(k.placement);return E===y||E==="y"}return!0}).map(k=>[k.placement,k.overflows.filter(E=>E>0).reduce((E,F)=>E+F,0)]).sort((k,E)=>k[1]-E[1])[0])==null?void 0:N[0];H&&(D=H);break}case"initialPlacement":D=c;break}if(o!==D)return{reset:{placement:D}}}return{}}}};function rt(e,t){return{top:e.top-t.height,right:e.right-t.width,bottom:e.bottom-t.height,left:e.left-t.width}}function ot(e){return fn.some(t=>e[t]>=0)}const Tn=function(e){return e===void 0&&(e={}),{name:"hide",options:e,async fn(t){const{rects:n,platform:r}=t,{strategy:o="referenceHidden",...s}=Q(e,t);switch(o){case"referenceHidden":{const i=await r.detectOverflow(t,{...s,elementContext:"reference"}),c=rt(i,n.reference);return{data:{referenceHiddenOffsets:c,referenceHidden:ot(c)}}}case"escaped":{const i=await r.detectOverflow(t,{...s,altBoundary:!0}),c=rt(i,n.floating);return{data:{escapedOffsets:c,escaped:ot(c)}}}default:return{}}}}},wt=new Set(["left","top"]);async function kn(e,t){const{placement:n,platform:r,elements:o}=e,s=await(r.isRTL==null?void 0:r.isRTL(o.floating)),i=ee(n),c=le(n),l=q(n)==="y",d=wt.has(i)?-1:1,u=s&&l?-1:1,p=Q(t,e);let{mainAxis:h,crossAxis:f,alignmentAxis:x}=typeof p=="number"?{mainAxis:p,crossAxis:0,alignmentAxis:null}:{mainAxis:p.mainAxis||0,crossAxis:p.crossAxis||0,alignmentAxis:p.alignmentAxis};return c&&typeof x=="number"&&(f=c==="end"?x*-1:x),l?{x:f*u,y:h*d}:{x:h*d,y:f*u}}const zn=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,r;const{x:o,y:s,placement:i,middlewareData:c}=t,l=await kn(t,e);return i===((n=c.offset)==null?void 0:n.placement)&&(r=c.arrow)!=null&&r.alignmentOffset?{}:{x:o+l.x,y:s+l.y,data:{...l,placement:i}}}}},Sn=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:r,placement:o,platform:s}=t,{mainAxis:i=!0,crossAxis:c=!1,limiter:l={fn:y=>{let{x:A,y:w}=y;return{x:A,y:w}}},...d}=Q(e,t),u={x:n,y:r},p=await s.detectOverflow(t,d),h=q(o),f=Ie(h);let x=u[f],m=u[h];const b=(y,A)=>vt(A+p[y==="y"?"top":"left"],A,A-p[y==="y"?"bottom":"right"]);i&&(x=b(f,x)),c&&(m=b(h,m));const v=l.fn({...t,[f]:x,[h]:m});return{...v,data:{x:v.x-n,y:v.y-r,enabled:{[f]:i,[h]:c}}}}}},Pn=function(e){return e===void 0&&(e={}),{options:e,fn(t){var n,r;const{x:o,y:s,placement:i,rects:c,middlewareData:l}=t,{offset:d=0,mainAxis:u=!0,crossAxis:p=!0}=Q(e,t),h={x:o,y:s},f=q(i),x=Ie(f);let m=h[x],b=h[f];const v=Q(d,t),y=typeof v=="number"?{mainAxis:v,crossAxis:0}:{mainAxis:(n=v.mainAxis)!=null?n:0,crossAxis:(r=v.crossAxis)!=null?r:0};if(u){const R=x==="y"?"height":"width",C=c.reference[x]-c.floating[R]+y.mainAxis,T=c.reference[x]+c.reference[R]-y.mainAxis;m<C?m=C:m>T&&(m=T)}if(p){var A,w;const R=x==="y"?"width":"height",C=wt.has(ee(i)),T=c.reference[f]-c.floating[R]+(C&&((A=l.offset)==null?void 0:A[f])||0)+(C?0:y.crossAxis),j=c.reference[f]+c.reference[R]+(C?0:((w=l.offset)==null?void 0:w[f])||0)-(C?y.crossAxis:0);b<T?b=T:b>j&&(b=j)}return{[x]:m,[f]:b}}}},jn=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:r,platform:o,elements:s}=t,{apply:i=()=>{},...c}=Q(e,t),l=await o.detectOverflow(t,c),d=ee(n),u=le(n),p=q(n)==="y",{width:h,height:f}=r.floating;let x,m;d==="top"||d==="bottom"?(x=d,m=u===(await(o.isRTL==null?void 0:o.isRTL(s.floating))?"start":"end")?"left":"right"):(m=d,x=u==="end"?"top":"bottom");const b=f-l.top-l.bottom,v=h-l.left-l.right,y=Z(f-l[x],b),A=Z(h-l[m],v),w=t.middlewareData.shift,R=!w;let C=y,T=A;w!=null&&w.enabled.x&&(T=v),w!=null&&w.enabled.y&&(C=b),R&&!u&&(p?T=h-2*Y(l.left,l.right):C=f-2*Y(l.top,l.bottom)),await i({...t,availableWidth:T,availableHeight:C});const j=await o.getDimensions(s.floating);return h!==j.width||f!==j.height?{reset:{rects:!0}}:{}}}};function Te(){return typeof window<"u"}function de(e){return Ct(e)?(e.nodeName||"").toLowerCase():"#document"}function W(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function J(e){var t;return(t=(Ct(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Ct(e){return Te()?e instanceof Node||e instanceof W(e).Node:!1}function V(e){return Te()?e instanceof Element||e instanceof W(e).Element:!1}function te(e){return Te()?e instanceof HTMLElement||e instanceof W(e).HTMLElement:!1}function st(e){return!Te()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof W(e).ShadowRoot}function ke(e){const{overflow:t,overflowX:n,overflowY:r,display:o}=X(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&o!=="inline"&&o!=="contents"}function On(e){return/^(table|td|th)$/.test(de(e))}function ze(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}const Dn=/transform|translate|scale|rotate|perspective|filter/,En=/paint|layout|strict|content/,ne=e=>!!e&&e!=="none";let Ee;function Be(e){const t=V(e)?X(e):e;return ne(t.transform)||ne(t.translate)||ne(t.scale)||ne(t.rotate)||ne(t.perspective)||!qe()&&(ne(t.backdropFilter)||ne(t.filter))||Dn.test(t.willChange||"")||En.test(t.contain||"")}function Nn(e){let t=oe(e);for(;te(t)&&!ue(t);){if(Be(t))return t;if(ze(t))return null;t=oe(t)}return null}function qe(){return Ee==null&&(Ee=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),Ee}function ue(e){return/^(html|body|#document)$/.test(de(e))}function X(e){return W(e).getComputedStyle(e)}function Se(e){return V(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function oe(e){if(de(e)==="html")return e;const t=e.assignedSlot||e.parentNode||st(e)&&e.host||J(e);return st(t)?t.host:t}function At(e){const t=oe(e);return ue(t)?(e.ownerDocument||e).body:te(t)&&ke(t)?t:At(t)}function pe(e,t,n){var r;t===void 0&&(t=[]),n===void 0&&(n=!0);const o=At(e),s=o===((r=e.ownerDocument)==null?void 0:r.body),i=W(o);if(s){const c=Le(i);return t.concat(i,i.visualViewport||[],ke(o)?o:[],c&&n?pe(c):[])}else return t.concat(o,pe(o,[],n))}function Le(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Rt(e){const t=X(e);let n=parseFloat(t.width)||0,r=parseFloat(t.height)||0;const o=te(e),s=o?e.offsetWidth:n,i=o?e.offsetHeight:r,c=ye(n)!==s||ye(r)!==i;return c&&(n=s,r=i),{width:n,height:r,$:c}}function Ve(e){return V(e)?e:e.contextElement}function ce(e){const t=Ve(e);if(!te(t))return U(1);const n=t.getBoundingClientRect(),{width:r,height:o,$:s}=Rt(t);let i=(s?ye(n.width):n.width)/r,c=(s?ye(n.height):n.height)/o;return(!i||!Number.isFinite(i))&&(i=1),(!c||!Number.isFinite(c))&&(c=1),{x:i,y:c}}const _n=U(0);function Tt(e){const t=W(e);return!qe()||!t.visualViewport?_n:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function $n(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===W(e)}function se(e,t,n,r){t===void 0&&(t=!1),n===void 0&&(n=!1);const o=e.getBoundingClientRect(),s=Ve(e);let i=U(1);t&&(r?V(r)&&(i=ce(r)):i=ce(e));const c=$n(s,n,r)?Tt(s):U(0);let l=(o.left+c.x)/i.x,d=(o.top+c.y)/i.y,u=o.width/i.x,p=o.height/i.y;if(s&&r){const h=W(s),f=V(r)?W(r):r;let x=h,m=Le(x);for(;m&&f!==x;){const b=ce(m),v=m.getBoundingClientRect(),y=X(m),A=v.left+(m.clientLeft+parseFloat(y.paddingLeft))*b.x,w=v.top+(m.clientTop+parseFloat(y.paddingTop))*b.y;l*=b.x,d*=b.y,u*=b.x,p*=b.y,l+=A,d+=w,x=W(m),m=Le(x)}}return Ce({width:u,height:p,x:l,y:d})}function Pe(e,t){const n=Se(e).scrollLeft;return t?t.left+n:se(J(e)).left+n}function kt(e,t){const n=e.getBoundingClientRect(),r=n.left+t.scrollLeft-Pe(e,n),o=n.top+t.scrollTop;return{x:r,y:o}}function Mn(e){let{elements:t,rect:n,offsetParent:r,strategy:o}=e;const s=o==="fixed",i=J(r),c=t?ze(t.floating):!1;if(r===i||c&&s)return n;let l={scrollLeft:0,scrollTop:0},d=U(1);const u=U(0),p=te(r);if((p||!s)&&((de(r)!=="body"||ke(i))&&(l=Se(r)),p)){const f=se(r);d=ce(r),u.x=f.x+r.clientLeft,u.y=f.y+r.clientTop}const h=i&&!p&&!s?kt(i,l):U(0);return{width:n.width*d.x,height:n.height*d.y,x:n.x*d.x-l.scrollLeft*d.x+u.x+h.x,y:n.y*d.y-l.scrollTop*d.y+u.y+h.y}}function Ln(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function Hn(e){const t=Se(e),n=e.ownerDocument.body,r=Y(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),o=Y(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight);let s=-t.scrollLeft+Pe(e);const i=-t.scrollTop;return X(n).direction==="rtl"&&(s+=Y(e.clientWidth,n.clientWidth)-r),{width:r,height:o,x:s,y:i}}const Wn=25;function In(e,t,n){n===void 0&&(n="viewport");const r=n==="layoutViewport",o=W(e),s=J(e),i=o.visualViewport;let c=s.clientWidth,l=s.clientHeight,d=0,u=0;if(i){const h=!qe()||t==="fixed";r?h||(d=-i.offsetLeft,u=-i.offsetTop):(c=i.width,l=i.height,h&&(d=i.offsetLeft,u=i.offsetTop))}if(Pe(s)<=0){const h=s.ownerDocument,f=h.body,x=getComputedStyle(f),m=h.compatMode==="CSS1Compat"&&parseFloat(x.marginLeft)+parseFloat(x.marginRight)||0,b=Math.abs(s.clientWidth-f.clientWidth-m),v=getComputedStyle(s).scrollbarGutter==="stable both-edges"?b/2:b;v<=Wn&&(c-=v)}return{width:c,height:l,x:d,y:u}}function Fn(e,t){const n=se(e,!0,t==="fixed"),r=n.top+e.clientTop,o=n.left+e.clientLeft,s=ce(e),i=e.clientWidth*s.x,c=e.clientHeight*s.y,l=o*s.x,d=r*s.y;return{width:i,height:c,x:l,y:d}}function it(e,t,n){let r;if(t==="viewport"||t==="layoutViewport")r=In(e,n,t);else if(t==="document")r=Hn(J(e));else if(V(t))r=Fn(t,n);else{const o=Tt(e);r={x:t.x-o.x,y:t.y-o.y,width:t.width,height:t.height}}return Ce(r)}function Gn(e,t){const n=t.get(e);if(n)return n;let r=pe(e,[],!1).filter(c=>V(c)&&de(c)!=="body"),o=null;const s=X(e).position==="fixed";let i=s?oe(e):e;for(;V(i)&&!ue(i);){const c=X(i),l=Be(i),d=o?o.position:s?"fixed":"";!l&&(d==="fixed"||d==="absolute"&&c.position==="static")?r=r.filter(p=>p!==i):o=c,i=oe(i)}return t.set(e,r),r}function Bn(e){let{element:t,boundary:n,rootBoundary:r,strategy:o}=e;const i=[...n==="clippingAncestors"?ze(t)?[]:Gn(t,this._c):[].concat(n),r],c=it(t,i[0],o);let l=c.top,d=c.right,u=c.bottom,p=c.left;for(let h=1;h<i.length;h++){const f=it(t,i[h],o);l=Y(f.top,l),d=Z(f.right,d),u=Z(f.bottom,u),p=Y(f.left,p)}return{width:d-p,height:u-l,x:p,y:l}}function qn(e){const{width:t,height:n}=Rt(e);return{width:t,height:n}}function Vn(e,t,n){const r=te(t),o=J(t),s=n==="fixed",i=se(e,!0,s,t);let c={scrollLeft:0,scrollTop:0};const l=U(0);if((r||!s)&&((de(t)!=="body"||ke(o))&&(c=Se(t)),r)){const h=se(t,!0,s,t);l.x=h.x+t.clientLeft,l.y=h.y+t.clientTop}!r&&o&&(l.x=Pe(o));const d=o&&!r&&!s?kt(o,c):U(0),u=i.left+c.scrollLeft-l.x-d.x,p=i.top+c.scrollTop-l.y-d.y;return{x:u,y:p,width:i.width,height:i.height}}function Ne(e){return X(e).position==="static"}function at(e,t){if(!te(e)||X(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return J(e)===n&&(n=n.ownerDocument.body),n}function zt(e,t){const n=W(e);if(ze(e))return n;if(!te(e)){let o=oe(e);for(;o&&!ue(o);){if(V(o)&&!Ne(o))return o;o=oe(o)}return n}let r=at(e,t);for(;r&&On(r)&&Ne(r);)r=at(r,t);return r&&ue(r)&&Ne(r)&&!Be(r)?n:r||Nn(e)||n}const Xn=async function(e){const t=this.getOffsetParent||zt,n=this.getDimensions,r=await n(e.floating);return{reference:Vn(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}};function Yn(e){return X(e).direction==="rtl"}const Un={convertOffsetParentRelativeRectToViewportRelativeRect:Mn,getDocumentElement:J,getClippingRect:Bn,getOffsetParent:zt,getElementRects:Xn,getClientRects:Ln,getDimensions:qn,getScale:ce,isElement:V,isRTL:Yn};function St(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function Kn(e,t,n){let r=null,o;const s=J(e);function i(){var u;clearTimeout(o),(u=r)==null||u.disconnect(),r=null}function c(u,p){u===void 0&&(u=!1),p===void 0&&(p=1),i();const h=e.getBoundingClientRect(),{left:f,top:x,width:m,height:b}=h;if(u||t(),!m||!b)return;const v=be(x),y=be(s.clientWidth-(f+m)),A=be(s.clientHeight-(x+b)),w=be(f),C={rootMargin:-v+"px "+-y+"px "+-A+"px "+-w+"px",threshold:Y(0,Z(1,p))||1};let T=!0;function j($){const P=$[0].intersectionRatio;if(!St(h,e.getBoundingClientRect()))return c();if(P!==p){if(!T)return c();P?c(!1,P):o=setTimeout(()=>{c(!1,1e-7)},1e3)}T=!1}try{r=new IntersectionObserver(j,{...C,root:s.ownerDocument})}catch{r=new IntersectionObserver(j,C)}r.observe(e)}const l=W(e),d=()=>c(n);return l.addEventListener("resize",d),c(!0),()=>{l.removeEventListener("resize",d),i()}}function Qn(e,t,n,r){r===void 0&&(r={});const{ancestorScroll:o=!0,ancestorResize:s=!0,elementResize:i=typeof ResizeObserver=="function",layoutShift:c=typeof IntersectionObserver=="function",animationFrame:l=!1}=r,d=Ve(e),u=o||s?[...d?pe(d):[],...t?pe(t):[]]:[];u.forEach(v=>{o&&v.addEventListener("scroll",n),s&&v.addEventListener("resize",n)});const p=d&&c?Kn(d,n,s):null;let h=-1,f=null;i&&(f=new ResizeObserver(v=>{let[y]=v;y&&y.target===d&&f&&t&&(f.unobserve(t),cancelAnimationFrame(h),h=requestAnimationFrame(()=>{var A;(A=f)==null||A.observe(t)})),n()}),d&&!l&&f.observe(d),t&&f.observe(t));let x,m=l?se(e):null;l&&b();function b(){const v=se(e);m&&!St(m,v)&&n(),m=v,x=requestAnimationFrame(b)}return n(),()=>{var v;u.forEach(y=>{o&&y.removeEventListener("scroll",n),s&&y.removeEventListener("resize",n)}),p?.(),(v=f)==null||v.disconnect(),f=null,l&&cancelAnimationFrame(x)}}const Jn=zn,Zn=Sn,er=Rn,tr=jn,nr=Tn,ct=An,rr=Pn,or=(e,t,n)=>{const r=new Map,o=n??{},s={...Un,...o.platform,_c:r};return Cn(e,t,{...o,platform:s})};var sr=typeof document<"u",ir=function(){},ve=sr?g.useLayoutEffect:ir;function Ae(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(typeof e=="function"&&e.toString()===t.toString())return!0;let n,r,o;if(e&&t&&typeof e=="object"){if(Array.isArray(e)){if(n=e.length,n!==t.length)return!1;for(r=n;r--!==0;)if(!Ae(e[r],t[r]))return!1;return!0}if(o=Object.keys(e),n=o.length,n!==Object.keys(t).length)return!1;for(r=n;r--!==0;)if(!{}.hasOwnProperty.call(t,o[r]))return!1;for(r=n;r--!==0;){const s=o[r];if(!(s==="_owner"&&e.$$typeof)&&!Ae(e[s],t[s]))return!1}return!0}return e!==e&&t!==t}function Pt(e){return typeof window>"u"?1:(e.ownerDocument.defaultView||window).devicePixelRatio||1}function lt(e,t){const n=Pt(e);return Math.round(t*n)/n}function _e(e){const t=g.useRef(e);return ve(()=>{t.current=e}),t}function ar(e){e===void 0&&(e={});const{placement:t="bottom",strategy:n="absolute",middleware:r=[],platform:o,elements:{reference:s,floating:i}={},transform:c=!0,whileElementsMounted:l,open:d}=e,[u,p]=g.useState({x:0,y:0,strategy:n,placement:t,middlewareData:{},isPositioned:!1}),[h,f]=g.useState(r);Ae(h,r)||f(r);const[x,m]=g.useState(null),[b,v]=g.useState(null),y=g.useCallback(k=>{k!==C.current&&(C.current=k,m(k))},[]),A=g.useCallback(k=>{k!==T.current&&(T.current=k,v(k))},[]),w=s||x,R=i||b,C=g.useRef(null),T=g.useRef(null),j=g.useRef(u),$=l!=null,P=_e(l),G=_e(o),B=_e(d),N=g.useCallback(()=>{if(!C.current||!T.current)return;const k={placement:t,strategy:n,middleware:h};G.current&&(k.platform=G.current),or(C.current,T.current,k).then(E=>{const F={...E,isPositioned:B.current!==!1};O.current&&!Ae(j.current,F)&&(j.current=F,en.flushSync(()=>{p(F)}))})},[h,t,n,G,B]);ve(()=>{d===!1&&j.current.isPositioned&&(j.current.isPositioned=!1,p(k=>({...k,isPositioned:!1})))},[d]);const O=g.useRef(!1);ve(()=>(O.current=!0,()=>{O.current=!1}),[]),ve(()=>{if(w&&(C.current=w),R&&(T.current=R),w&&R){if(P.current)return P.current(w,R,N);N()}},[w,R,N,P,$]);const I=g.useMemo(()=>({reference:C,floating:T,setReference:y,setFloating:A}),[y,A]),D=g.useMemo(()=>({reference:w,floating:R}),[w,R]),H=g.useMemo(()=>{const k={position:n,left:0,top:0};if(!D.floating)return k;const E=lt(D.floating,u.x),F=lt(D.floating,u.y);return c?{...k,transform:"translate("+E+"px, "+F+"px)",...Pt(D.floating)>=1.5&&{willChange:"transform"}}:{position:n,left:E,top:F}},[n,c,D.floating,u.x,u.y]);return g.useMemo(()=>({...u,update:N,refs:I,elements:D,floatingStyles:H}),[u,N,I,D,H])}const cr=e=>{function t(n){return{}.hasOwnProperty.call(n,"current")}return{name:"arrow",options:e,fn(n){const{element:r,padding:o}=typeof e=="function"?e(n):e;return r&&t(r)?r.current!=null?ct({element:r.current,padding:o}).fn(n):{}:r?ct({element:r,padding:o}).fn(n):{}}}},lr=(e,t)=>{const n=Jn(e);return{name:n.name,fn:n.fn,options:[e,t]}},dr=(e,t)=>{const n=Zn(e);return{name:n.name,fn:n.fn,options:[e,t]}},fr=(e,t)=>({fn:rr(e).fn,options:[e,t]}),ur=(e,t)=>{const n=er(e);return{name:n.name,fn:n.fn,options:[e,t]}},pr=(e,t)=>{const n=tr(e);return{name:n.name,fn:n.fn,options:[e,t]}},hr=(e,t)=>{const n=nr(e);return{name:n.name,fn:n.fn,options:[e,t]}},mr=(e,t)=>{const n=cr(e);return{name:n.name,fn:n.fn,options:[e,t]}};var xr=Object.defineProperty,gr=(e,t)=>xr(e,"name",{value:t,configurable:!0}),br=g.forwardRef(gr(function(t,n){const{children:r,width:o=10,height:s=5,...i}=t;return a.jsx(me.svg,{...i,ref:n,width:o,height:s,viewBox:"0 0 30 10",preserveAspectRatio:"none",children:t.asChild?r:a.jsx("polygon",{points:"0,0 30,0 15,10"})})},"Arrow")),vr=br,yr=Object.defineProperty,wr=(e,t)=>yr(e,"name",{value:t,configurable:!0});function jt(e){const[t,n]=g.useState(void 0);return fe(()=>{if(e){n({width:e.offsetWidth,height:e.offsetHeight});const r=new ResizeObserver(o=>{if(!Array.isArray(o)||!o.length)return;const s=o[0];let i,c;if("borderBoxSize"in s){const l=s.borderBoxSize,d=Array.isArray(l)?l[0]:l;i=d.inlineSize,c=d.blockSize}else i=e.offsetWidth,c=e.offsetHeight;n({width:i,height:c})});return r.observe(e,{box:"border-box"}),()=>r.unobserve(e)}else n(void 0)},[e]),t}wr(jt,"useSize");var Cr=Object.defineProperty,K=(e,t)=>Cr(e,"name",{value:t,configurable:!0}),Ot="Popper",[Dt,Et]=xt(Ot),[Ar,Nt]=Dt(Ot),Rr=K(e=>{const{__scopePopper:t,children:n}=e,[r,o]=g.useState(null),[s,i]=g.useState(void 0);return a.jsx(Ar,{scope:t,anchor:r,onAnchorChange:o,placementState:s,setPlacementState:i,children:n})},"Popper"),Tr="PopperAnchor",kr=g.forwardRef(K(function(t,n){const{__scopePopper:r,virtualRef:o,...s}=t,i=Nt(Tr,r),c=g.useRef(null),l=i.onAnchorChange,d=g.useCallback(m=>{c.current=m,m&&l(m)},[l]),u=Re(n,d),p=g.useRef(null);g.useEffect(()=>{if(!o)return;const m=p.current;p.current=o.current,m!==p.current&&l(p.current)});const h=i.placementState&&je(i.placementState),f=h?.[0],x=h?.[1];return o?null:a.jsx(me.div,{"data-radix-popper-side":f,"data-radix-popper-align":x,...s,ref:u})},"PopperAnchor")),_t="PopperContent",[zr,Sr]=Dt(_t),Pr=g.forwardRef(K(function(t,n){const{__scopePopper:r,side:o="bottom",sideOffset:s=0,align:i="center",alignOffset:c=0,arrowPadding:l=0,avoidCollisions:d=!0,collisionBoundary:u=[],collisionPadding:p=0,sticky:h="partial",hideWhenDetached:f=!1,updatePositionStrategy:x="optimized",onPlaced:m,...b}=t,v=Nt(_t,r),[y,A]=g.useState(null),w=Re(n,A),[R,C]=g.useState(null),T=jt(R),j=T?.width??0,$=T?.height??0,P=o+(i!=="center"?"-"+i:""),G=typeof p=="number"?p:{top:0,right:0,bottom:0,left:0,...p},B=Array.isArray(u)?u:[u],N=B.length>0,O={padding:G,boundary:B.filter($t),altBoundary:N},{refs:I,floatingStyles:D,placement:H,isPositioned:k,middlewareData:E}=ar({strategy:"fixed",placement:P,whileElementsMounted:K((...De)=>Qn(...De,{animationFrame:x==="always"}),"whileElementsMounted"),elements:{reference:v.anchor},middleware:[lr({mainAxis:s+$,alignmentAxis:c}),d&&dr({mainAxis:!0,crossAxis:!1,limiter:h==="partial"?fr():void 0,...O}),d&&ur({...O}),pr({...O,apply:K(({elements:De,rects:Ze,availableWidth:Kt,availableHeight:Qt})=>{const{width:Jt,height:Zt}=Ze.reference,ge=De.floating.style;ge.setProperty("--radix-popper-available-width",`${Kt}px`),ge.setProperty("--radix-popper-available-height",`${Qt}px`),ge.setProperty("--radix-popper-anchor-width",`${Jt}px`),ge.setProperty("--radix-popper-anchor-height",`${Zt}px`)},"apply")}),R&&mr({element:R,padding:l}),Er({arrowWidth:j,arrowHeight:$}),f&&hr({strategy:"referenceHidden",...O,boundary:N?O.boundary:void 0})]}),F=v.setPlacementState;fe(()=>(F(H),()=>{F(void 0)}),[H,F]);const[Ke,Qe]=je(H),Je=rn(m);fe(()=>{k&&Je?.()},[k,Je]);const qt=E.arrow?.x,Vt=E.arrow?.y,Xt=E.arrow?.centerOffset!==0,[Yt,Ut]=g.useState();return fe(()=>{y&&Ut(window.getComputedStyle(y).zIndex)},[y]),a.jsx("div",{ref:I.setFloating,"data-radix-popper-content-wrapper":"",style:{...D,transform:k?D.transform:"translate(0, -200%)",minWidth:"max-content",zIndex:Yt,"--radix-popper-transform-origin":[E.transformOrigin?.x,E.transformOrigin?.y].join(" "),...E.hide?.referenceHidden&&{visibility:"hidden",pointerEvents:"none"}},dir:t.dir,children:a.jsx(zr,{scope:r,placedSide:Ke,placedAlign:Qe,onArrowChange:C,arrowX:qt,arrowY:Vt,shouldHideArrow:Xt,children:a.jsx(me.div,{"data-side":Ke,"data-align":Qe,...b,ref:w,style:{...b.style,animation:k?b.style?.animation:"none"}})})})},"PopperContent")),jr="PopperArrow",Or={top:"bottom",right:"left",bottom:"top",left:"right"},Dr=g.forwardRef(K(function(t,n){const{__scopePopper:r,...o}=t,s=Sr(jr,r),i=Or[s.placedSide];return a.jsx("span",{ref:s.onArrowChange,style:{position:"absolute",left:s.arrowX,top:s.arrowY,[i]:0,transformOrigin:{top:"",right:"0 0",bottom:"center 0",left:"100% 0"}[s.placedSide],transform:{top:"translateY(100%)",right:"translateY(50%) rotate(90deg) translateX(-50%)",bottom:"rotate(180deg)",left:"translateY(50%) rotate(-90deg) translateX(50%)"}[s.placedSide],visibility:s.shouldHideArrow?"hidden":void 0},children:a.jsx(vr,{...o,ref:n,style:{...o.style,display:"block"}})})},"PopperArrow"));function $t(e){return e!==null}K($t,"isNotNull");var Er=K(e=>({name:"transformOrigin",options:e,fn(t){const{placement:n,rects:r,middlewareData:o}=t,i=o.arrow?.centerOffset!==0,c=i?0:e.arrowWidth,l=i?0:e.arrowHeight,[d,u]=je(n),p={start:"0%",center:"50%",end:"100%"}[u],h=(o.arrow?.x??0)+c/2,f=(o.arrow?.y??0)+l/2;let x="",m="";return d==="bottom"?(x=i?p:`${h}px`,m=`${-l}px`):d==="top"?(x=i?p:`${h}px`,m=`${r.floating.height+l}px`):d==="right"?(x=`${-l}px`,m=i?p:`${f}px`):d==="left"&&(x=`${r.floating.width+l}px`,m=i?p:`${f}px`),{data:{x,y:m}}}}),"transformOrigin");function je(e){const[t,n="center"]=e.split("-");return[t,n]}K(je,"getSideAndAlignFromPlacement");var Nr=Rr,_r=kr,$r=Pr,Mr=Dr,Lr=Object.defineProperty,Hr=(e,t)=>Lr(e,"name",{value:t,configurable:!0}),Wr=Object.freeze({position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal"}),Ir=g.forwardRef(Hr(function(t,n){return a.jsx(me.span,{...t,ref:n,style:{...Wr,...t.style}})},"VisuallyHidden")),Fr=Ir,Gr=Object.defineProperty,_=(e,t)=>Gr(e,"name",{value:t,configurable:!0}),[Xe,Ho]=xt("Tooltip",[Et]),Oe=Et(),Br="TooltipProvider",qr=700,He="tooltip.open",[Vr,Ye]=Xe(Br),Xr=_(e=>{const{__scopeTooltip:t,delayDuration:n=qr,skipDelayDuration:r=300,disableHoverableContent:o=!1,children:s}=e,i=g.useRef(!0),c=g.useRef(!1),l=g.useRef(0);return g.useEffect(()=>{const d=l.current;return()=>window.clearTimeout(d)},[]),a.jsx(Vr,{scope:t,isOpenDelayedRef:i,delayDuration:n,onOpen:g.useCallback(()=>{r<=0||(window.clearTimeout(l.current),i.current=!1)},[r]),onClose:g.useCallback(()=>{r<=0||(window.clearTimeout(l.current),l.current=window.setTimeout(()=>i.current=!0,r))},[r]),isPointerInTransitRef:c,onPointerInTransitChange:g.useCallback(d=>{c.current=d},[]),disableHoverableContent:o,children:s})},"TooltipProvider"),We="Tooltip",[Yr,xe]=Xe(We),Ur=_(e=>{const{__scopeTooltip:t,children:n,open:r,defaultOpen:o,onOpenChange:s,disableHoverableContent:i,delayDuration:c}=e,l=Ye(We,e.__scopeTooltip),d=Oe(t),[u,p]=g.useState(null),[h,f]=g.useState(void 0),x=on(),m=g.useRef(0),b=i??l.disableHoverableContent,v=c??l.delayDuration,y=g.useRef(!1),[A,w]=sn({prop:r,defaultProp:o??!1,onChange:_(P=>{P?(l.onOpen(),document.dispatchEvent(new CustomEvent(He))):l.onClose(),s?.(P)},"onChange"),caller:We}),R=g.useMemo(()=>A?y.current?"delayed-open":"instant-open":"closed",[A]),C=g.useCallback(()=>{window.clearTimeout(m.current),m.current=0,y.current=!1,w(!0)},[w]),T=g.useCallback(()=>{window.clearTimeout(m.current),m.current=0,w(!1)},[w]),j=g.useCallback(()=>{window.clearTimeout(m.current),m.current=window.setTimeout(()=>{y.current=!0,w(!0),m.current=0},v)},[v,w]);g.useEffect(()=>()=>{m.current&&(window.clearTimeout(m.current),m.current=0)},[]);const $=h??x;return a.jsx(Nr,{...d,children:a.jsx(Yr,{scope:t,contentId:$,setContentId:f,open:A,stateAttribute:R,trigger:u,onTriggerChange:p,onTriggerEnter:g.useCallback(()=>{l.isOpenDelayedRef.current?j():C()},[l.isOpenDelayedRef,j,C]),onTriggerLeave:g.useCallback(()=>{b?T():(window.clearTimeout(m.current),m.current=0)},[T,b]),onOpen:C,onClose:T,disableHoverableContent:b,children:n})})},"Tooltip"),dt="TooltipTrigger",Kr=g.forwardRef(_(function(t,n){const{__scopeTooltip:r,...o}=t,s=xe(dt,r),i=Ye(dt,r),c=Oe(r),l=g.useRef(null),d=Re(n,l,s.onTriggerChange),u=g.useRef(!1),p=g.useRef(!1),h=g.useCallback(()=>u.current=!1,[]);return g.useEffect(()=>()=>document.removeEventListener("pointerup",h),[h]),a.jsx(_r,{asChild:!0,...c,children:a.jsx(me.button,{"aria-describedby":s.open?s.contentId:void 0,"data-state":s.stateAttribute,...o,ref:d,onPointerMove:ie(t.onPointerMove,f=>{f.pointerType!=="touch"&&!p.current&&!i.isPointerInTransitRef.current&&(s.onTriggerEnter(),p.current=!0)}),onPointerLeave:ie(t.onPointerLeave,()=>{s.onTriggerLeave(),p.current=!1}),onPointerDown:ie(t.onPointerDown,()=>{s.open&&s.onClose(),u.current=!0,document.addEventListener("pointerup",h,{once:!0})}),onFocus:ie(t.onFocus,()=>{u.current||s.onOpen()}),onBlur:ie(t.onBlur,s.onClose),onClick:ie(t.onClick,s.onClose)})})},"TooltipTrigger")),Mt="TooltipPortal",[Qr,Jr]=Xe(Mt,{forceMount:void 0}),Zr=_(e=>{const{__scopeTooltip:t,forceMount:n,children:r,container:o}=e,s=xe(Mt,t);return a.jsx(Qr,{scope:t,forceMount:n,children:a.jsx(gt,{present:n||s.open,children:a.jsx(an,{asChild:!0,container:o,children:r})})})},"TooltipPortal"),he="TooltipContent",eo=g.forwardRef(_(function(t,n){const r=Jr(he,t.__scopeTooltip),{forceMount:o=r.forceMount,side:s="top",...i}=t,c=xe(he,t.__scopeTooltip);return a.jsx(gt,{present:o||c.open,children:c.disableHoverableContent?a.jsx(Lt,{side:s,...i,ref:n}):a.jsx(to,{side:s,...i,ref:n})})},"TooltipContent")),to=g.forwardRef(_(function(t,n){const r=xe(he,t.__scopeTooltip),o=Ye(he,t.__scopeTooltip),s=g.useRef(null),i=Re(n,s),[c,l]=g.useState(null),{trigger:d,onClose:u}=r,p=s.current,{onPointerInTransitChange:h}=o,f=g.useCallback(()=>{l(null),h(!1)},[h]),x=g.useCallback((m,b)=>{const v=m.currentTarget,y={x:m.clientX,y:m.clientY},A=Ht(y,v.getBoundingClientRect()),w=Wt(y,A),R=It(b.getBoundingClientRect()),C=Gt([...w,...R]);l(C),h(!0)},[h]);return g.useEffect(()=>()=>f(),[f]),g.useEffect(()=>{if(d&&p){const m=_(v=>x(v,p),"handleTriggerLeave"),b=_(v=>x(v,d),"handleContentLeave");return d.addEventListener("pointerleave",m),p.addEventListener("pointerleave",b),()=>{d.removeEventListener("pointerleave",m),p.removeEventListener("pointerleave",b)}}},[d,p,x,f]),g.useEffect(()=>{if(c){const m=_(b=>{const v=b.target,y={x:b.clientX,y:b.clientY},A=d?.contains(v)||p?.contains(v),w=!Ft(y,c);A?f():w&&(f(),u())},"handleTrackPointerGrace");return document.addEventListener("pointermove",m),()=>document.removeEventListener("pointermove",m)}},[d,p,c,u,f]),a.jsx(Lt,{...t,ref:i})},"TooltipContentHoverable")),no=ln("TooltipContent"),Lt=g.forwardRef(_(function(t,n){const{__scopeTooltip:r,children:o,"aria-label":s,id:i,onEscapeKeyDown:c,onPointerDownOutside:l,...d}=t,u=xe(he,r),p=Oe(r),{onClose:h}=u;g.useEffect(()=>(document.addEventListener(He,h),()=>document.removeEventListener(He,h)),[h]),g.useEffect(()=>{if(u.trigger){const x=_(m=>{m.target instanceof Node&&m.target.contains(u.trigger)&&h()},"handleScroll");return window.addEventListener("scroll",x,{capture:!0}),()=>window.removeEventListener("scroll",x,{capture:!0})}},[u.trigger,h]);const{setContentId:f}=u;return fe(()=>(f(i),()=>{f(void 0)}),[i,f]),a.jsx(cn,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:c,onPointerDownOutside:l,onFocusOutside:x=>x.preventDefault(),onDismiss:h,children:a.jsxs($r,{"data-state":u.stateAttribute,role:s?void 0:"tooltip",id:s?void 0:u.contentId,...p,...d,ref:n,style:{...d.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[a.jsx(no,{children:o}),s?a.jsx(Fr,{id:u.contentId,role:"tooltip",children:s}):null]})})},"TooltipContentImpl")),ro=g.forwardRef(_(function(t,n){const{__scopeTooltip:r,...o}=t,s=Oe(r);return a.jsx(Mr,{...s,...o,ref:n})},"TooltipArrow"));function Ht(e,t){const n=Math.abs(t.top-e.y),r=Math.abs(t.bottom-e.y),o=Math.abs(t.right-e.x),s=Math.abs(t.left-e.x);switch(Math.min(n,r,o,s)){case s:return"left";case o:return"right";case n:return"top";case r:return"bottom";default:throw new Error("unreachable")}}_(Ht,"getExitSideFromRect");function Wt(e,t,n=5){const r=[];switch(t){case"top":r.push({x:e.x-n,y:e.y+n},{x:e.x+n,y:e.y+n});break;case"bottom":r.push({x:e.x-n,y:e.y-n},{x:e.x+n,y:e.y-n});break;case"left":r.push({x:e.x+n,y:e.y-n},{x:e.x+n,y:e.y+n});break;case"right":r.push({x:e.x-n,y:e.y-n},{x:e.x-n,y:e.y+n});break}return r}_(Wt,"getPaddedExitPoints");function It(e){const{top:t,right:n,bottom:r,left:o}=e;return[{x:o,y:t},{x:n,y:t},{x:n,y:r},{x:o,y:r}]}_(It,"getPointsFromRect");function Ft(e,t){const{x:n,y:r}=e;let o=!1;for(let s=0,i=t.length-1;s<t.length;i=s++){const c=t[s],l=t[i],d=c.x,u=c.y,p=l.x,h=l.y;u>r!=h>r&&n<(p-d)*(r-u)/(h-u)+d&&(o=!o)}return o}_(Ft,"isPointInPolygon");function Gt(e){const t=e.slice();return t.sort((n,r)=>n.x<r.x?-1:n.x>r.x?1:n.y<r.y?-1:n.y>r.y?1:0),Bt(t)}_(Gt,"getHull");function Bt(e){if(e.length<=1)return e.slice();const t=[];for(let r=0;r<e.length;r++){const o=e[r];for(;t.length>=2;){const s=t[t.length-1],i=t[t.length-2];if((s.x-i.x)*(o.y-i.y)>=(s.y-i.y)*(o.x-i.x))t.pop();else break}t.push(o)}t.pop();const n=[];for(let r=e.length-1;r>=0;r--){const o=e[r];for(;n.length>=2;){const s=n[n.length-1],i=n[n.length-2];if((s.x-i.x)*(o.y-i.y)>=(s.y-i.y)*(o.x-i.x))n.pop();else break}n.push(o)}return n.pop(),t.length===1&&n.length===1&&t[0].x===n[0].x&&t[0].y===n[0].y?t:t.concat(n)}_(Bt,"getHullPresorted");var oo=Xr,so=Ur,io=Kr,ao=Zr,co=eo,lo=ro;function fo({delayDuration:e=0,...t}){return a.jsx(oo,{"code-path":"src\\components\\ui\\tooltip.tsx:13:5","data-slot":"tooltip-provider",delayDuration:e,...t})}function uo({...e}){return a.jsx(fo,{"code-path":"src\\components\\ui\\tooltip.tsx:25:5",children:a.jsx(so,{"code-path":"src\\components\\ui\\tooltip.tsx:26:7","data-slot":"tooltip",...e})})}function po({...e}){return a.jsx(io,{"code-path":"src\\components\\ui\\tooltip.tsx:34:10","data-slot":"tooltip-trigger",...e})}function ho({className:e,sideOffset:t=0,children:n,...r}){return a.jsx(ao,{"code-path":"src\\components\\ui\\tooltip.tsx:44:5",children:a.jsxs(co,{"code-path":"src\\components\\ui\\tooltip.tsx:45:7","data-slot":"tooltip-content",sideOffset:t,className:bt("bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",e),...r,children:[n,a.jsx(lo,{"code-path":"src\\components\\ui\\tooltip.tsx:55:9",className:"bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"})]})})}const mo=`{\r
  "甲": {\r
    "def": "十天干之首，五行属阳木，取象栋梁之材、生发向上。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "乙": {\r
    "def": "十天干之二，五行属阴木，取象花草藤蔓、柔韧曲折。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "丙": {\r
    "def": "十天干之三，五行属阳火，取象太阳之光、猛烈外显。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "丁": {\r
    "def": "十天干之四，五行属阴火，取象灯烛星火、文明内敛。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "戊": {\r
    "def": "十天干之五，五行属阳土，取象高山厚土、稳重承载。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "己": {\r
    "def": "十天干之六，五行属阴土，取象田园湿土、孕育化生。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "庚": {\r
    "def": "十天干之七，五行属阳金，取象刀剑矿铁、刚健肃杀。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "辛": {\r
    "def": "十天干之八，五行属阴金，取象珠玉首饰、精微清润。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "壬": {\r
    "def": "十天干之九，五行属阳水，取象江河湖海、奔流浩荡。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "癸": {\r
    "def": "十天干之末，五行属阴水，取象雨露溪流、滋润潜藏。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "子": {\r
    "def": "十二地支之首，五行属阳水，对应生肖鼠、夜半子时（23 至 1 时）。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "丑": {\r
    "def": "十二地支之二，五行属阴土，对应生肖牛、丑时（1 至 3 时），为湿寒之土。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "寅": {\r
    "def": "十二地支之三，五行属阳木，对应生肖虎、平旦寅时（3 至 5 时），为火之长生。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "卯": {\r
    "def": "十二地支之四，五行属阴木，对应生肖兔、日出卯时（5 至 7 时），居正东之位。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "辰": {\r
    "def": "十二地支之五，五行属阳土，对应生肖龙、辰时（7 至 9 时），为水库湿土。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "巳": {\r
    "def": "十二地支之六，五行属阴火，对应生肖蛇、巳时（9 至 11 时），为金之长生。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "午": {\r
    "def": "十二地支之七，五行属阳火，对应生肖马、正午午时（11 至 13 时），居正南之位。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "未": {\r
    "def": "十二地支之八，五行属阴土，对应生肖羊、未时（13 至 15 时），为木库燥土。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "申": {\r
    "def": "十二地支之九，五行属阳金，对应生肖猴、申时（15 至 17 时），为水之长生。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "酉": {\r
    "def": "十二地支之十，五行属阴金，对应生肖鸡、日入酉时（17 至 19 时），居正西之位。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "戌": {\r
    "def": "十二地支之十一，五行属阳土，对应生肖狗、黄昏戌时（19 至 21 时），为火库燥土。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "亥": {\r
    "def": "十二地支之末，五行属阴水，对应生肖猪、人定亥时（21 至 23 时），为木之长生。",\r
    "books": [\r
      "sanming",\r
      "ziping",\r
      "yuanhai"\r
    ]\r
  },\r
  "身强身弱": {\r
    "def": "以日主得令、得地、得势衡量其旺衰程度：偏旺为身强，宜抑宜泄；偏弱为身弱，宜扶宜助。是扶抑取用的前提判断。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong"\r
    ]\r
  },\r
  "格局": {\r
    "def": "以月令为主、参看透干会支归纳出的命局结构类型（如正官格、食神格等），用以把握命局整体层次与取用方向。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming"\r
    ]\r
  },\r
  "日主": {\r
    "def": "四柱中日柱的天干，又称日元、日干，代表命主自身，是定十神、论旺衰的全盘参照中心。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong",\r
      "sanming"\r
    ]\r
  },\r
  "纳音": {\r
    "def": "六十甲子每两组干支配一种五行别称（如甲子、乙丑为海中金），共三十种，用于辅助取象与合婚参看。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong"\r
    ]\r
  },\r
  "大运": {\r
    "def": "以月柱为起点、按阳男阴女顺行阴男阳女逆行排布的运势周期，每运十年，与命局合参以论阶段性吉凶。",\r
    "books": [\r
      "ziping",\r
      "sanming"\r
    ]\r
  },\r
  "流年": {\r
    "def": "逐年更替的太岁干支，与命局、大运合参，用以推断具体年份的运势变化。",\r
    "books": [\r
      "ziping",\r
      "sanming"\r
    ]\r
  },\r
  "正官": {\r
    "def": "克日主且与日主阴阳异性的天干，十神之一，主约束、名位、责任与规范。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "七杀": {\r
    "def": "克日主且与日主阴阳同性的天干，十神之一，又称偏官，主威权、压力与竞争。",\r
    "books": [\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "正印": {\r
    "def": "生日主且与日主阴阳异性的天干，十神之一，主学业、庇护、文书与德行。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "食神": {\r
    "def": "日主所生且与日主阴阳同性的天干，十神之一，主才华、表达、福禄与温和。",\r
    "books": [\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "伤官": {\r
    "def": "日主所生且与日主阴阳异性的天干，十神之一，主机巧、表现欲与破格创新。",\r
    "books": [\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "正财": {\r
    "def": "日主所克且与日主阴阳异性的天干，十神之一，主正当收入、稳妥之财与勤俭。",\r
    "books": [\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "偏财": {\r
    "def": "日主所克且与日主阴阳同性的天干，十神之一，主流动之财、意外收获与慷慨。",\r
    "books": [\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "比肩": {\r
    "def": "与日主五行相同且阴阳同性的天干，十神之一，主同辈、自我主张与分担竞争。",\r
    "books": [\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "劫财": {\r
    "def": "与日主五行相同且阴阳异性的天干，十神之一，主争夺、破耗与合作中的竞争。",\r
    "books": [\r
      "ziping",\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "长生": {\r
    "def": "十二长生之首，象征事物初生阶段，生命力开始萌发。",\r
    "books": [\r
      "ziping",\r
      "sanming"\r
    ]\r
  },\r
  "帝旺": {\r
    "def": "十二长生之巅，象征事物最旺盛阶段，能量达到顶峰。",\r
    "books": [\r
      "ziping",\r
      "sanming"\r
    ]\r
  },\r
  "墓库": {\r
    "def": "十二长生之终，象征事物收藏归藏阶段，能量暂时潜伏。",\r
    "books": [\r
      "ziping",\r
      "sanming"\r
    ]\r
  },\r
  "空亡": {\r
    "def": "干支组合中无地支支持的状态，象征虚无、不实或力量缺失。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "桃花": {\r
    "def": "又名咸池，象征魅力、人缘、艺术天赋和感情机遇。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "驿马": {\r
    "def": "象征变动、旅行、迁移和事业发展中的动态因素。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "华盖": {\r
    "def": "象征智慧、艺术、宗教信仰和孤独倾向的特殊星象。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "将星": {\r
    "def": "象征领导才能、管理能力、军事天赋和权威地位。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "天乙贵人": {\r
    "def": "象征贵人相助、逢凶化吉、关键时刻获得重要帮助。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "文昌": {\r
    "def": "象征学业成就、文才出众、考试顺利和文化修养。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "羊刃": {\r
    "def": "象征极端力量、激烈性格、潜在危险和需要谨慎对待的能量。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "禄神": {\r
    "def": "象征稳定收入、物质保障、职位俸禄和生活资源。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "合化": {\r
    "def": "指天干地支相互作用产生新五行属性的转化过程。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "刑冲克害": {\r
    "def": "四种基本关系：惩罚、冲击、克制、伤害，表示矛盾冲突。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "旺相休囚死": {\r
    "def": "五行在四季中的五种状态：旺盛、次旺、休息、囚禁、死亡。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "用神": {\r
    "def": "命局中最需扶持或抑制的关键五行，用以平衡全局。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong"\r
    ]\r
  },\r
  "喜神": {\r
    "def": "对命局有益、能增强用神力量的五行元素。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong"\r
    ]\r
  },\r
  "忌神": {\r
    "def": "对命局有害、会削弱用神力量的五行元素。",\r
    "books": [\r
      "ditiansui",\r
      "ziping",\r
      "qiongtong"\r
    ]\r
  },\r
  "红鸾": {\r
    "def": "神煞名。以年支起例（卯上起子逆数），传统上主喜事姻缘之象，常与天喜并称鸾喜；现代仅作婚恋话题的文化象征，不作事件断言。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "天喜": {\r
    "def": "神煞名。红鸾之对冲位（年支起例），传统上主喜庆吉庆，多见于婚嫁择期参详；不作具体事件断言。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "劫煞": {\r
    "def": "神煞名。三合局之绝地（申子辰在巳等），传统上主竞争与变动压力之象，吉凶随全局制化而定，不可单论。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  },\r
  "灾煞": {\r
    "def": "神煞名。三合局冲将星之位（申子辰在午等），传统上主波折与突发变动之象，须与全局喜忌同参，不单独构成事件判断。",\r
    "books": [\r
      "sanming",\r
      "yuanhai"\r
    ]\r
  }\r
}`,xo=JSON.parse(mo);function go({term:e,children:t,className:n}){const r=xo[e];if(!r)return n?a.jsx("span",{"code-path":"src\\components\\GlossaryTooltip.tsx:47:7",className:n,children:t??e}):a.jsx(a.Fragment,{children:t??e});const o=r.books.map(s=>dn.find(i=>i.id===s)).filter(s=>s!==void 0);return a.jsxs(uo,{"code-path":"src\\components\\GlossaryTooltip.tsx:58:5",children:[a.jsx(po,{"code-path":"src\\components\\GlossaryTooltip.tsx:59:7",className:bt("cursor-help touch-manipulation bg-transparent p-0 text-left [color:inherit] [font:inherit] [letter-spacing:inherit] [line-height:inherit]","underline decoration-dotted decoration-golddim/60 underline-offset-4 transition-[text-decoration-color]","hover:decoration-golddim focus-visible:decoration-golddim focus-visible:outline-none",n),children:t??e}),a.jsxs(ho,{"code-path":"src\\components\\GlossaryTooltip.tsx:70:7",side:"top",sideOffset:6,className:"w-[280px] rounded-xl border border-gold/25 bg-deep2 px-5 py-4 shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\GlossaryTooltip.tsx:75:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-goldbright",children:e}),a.jsx("p",{"code-path":"src\\components\\GlossaryTooltip.tsx:78:9",className:"mt-2 text-[12.5px] leading-[1.9] text-silktext",children:r.def}),o.length>0&&a.jsxs("div",{"code-path":"src\\components\\GlossaryTooltip.tsx:80:11",className:"mt-3 border-t border-gold/15 pt-2.5",children:[a.jsx("p",{"code-path":"src\\components\\GlossaryTooltip.tsx:81:13",className:"text-[11px] tracking-[0.14em] text-silkmuted",children:"相关典籍 · 藏经阁"}),a.jsx("ul",{"code-path":"src\\components\\GlossaryTooltip.tsx:82:13",className:"mt-1.5 flex flex-wrap gap-x-3 gap-y-1",children:o.map(s=>a.jsx("li",{"code-path":"src\\components\\GlossaryTooltip.tsx:84:17",children:a.jsxs(tn,{"code-path":"src\\components\\GlossaryTooltip.tsx:85:19",to:"/wiki",className:"text-[12px] text-goldbright/90 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-goldbright",children:["《",s.title,"》"]})},s.id))})]})]})]})}const re={delingMin:20,supportMin:10,reverseSupportMin:24,strongTotal:42},ae="邵伟华审订体系",ft="https://www.sizhuyucexue.com/thread-65-1-1.html",ut="https://www.sizhuyucexue.com/thread-73-1-1.html",bo="https://www.sizhuyucexue.com/thread-74-1-1.html",vo="https://www.sizhuyucexue.com/thread-1336-1-1.html",yo=[{id:"SWH-01",master:ae,source:ft,evaluate(e){const t=e.wuxing.strength;return t.deling>=re.delingMin&&t.dedi+t.deshi>=re.supportMin?{title:"日主偏强倾向（月令优先审查）",text:`日主五行属${e.dayMasterWuxing}，月令得令（${t.deling}/40），兼有得地得势支持（${t.dedi+t.deshi}/60）。传统旺衰审查先看月令，此盘呈现偏强倾向；仍请继续核对克泄耗、合化与支持力量，此非最终强弱结论。`}:null}},{id:"SWH-02",master:ae,source:ft,evaluate(e){const t=e.wuxing.strength;return t.deling<re.delingMin&&t.dedi+t.deshi>=re.reverseSupportMin?{title:"失令但有反转可能",text:`日主失令（月令 ${t.deling}/40），但得地得势合计 ${t.dedi+t.deshi}/60 已构成多处有力生助。传统上「失令不即定弱」：若生助力量可抵月令之失，存在由弱转中和的可能，建议降低强弱结论置信度并做全局复核。`}:null}},{id:"SWH-03",master:ae,source:bo,evaluate(e){const t=e.dayMasterWuxing,n={木:"金",火:"水",土:"木",金:"火",水:"土"},r={木:"水",火:"木",土:"火",金:"土",水:"金"},o=n[t],s=r[t],i=e.wuxing.count;return!(e.wuxing.strength.total>=re.strongTotal)&&i[o]>=2.5&&i[o]>=i[t]*1.2?{title:"身弱官杀偏多：印星优先",text:`日主属${t}而${o}（官杀）偏多（计 ${i[o]}），传统取用优先考察${s}（印星）能否泄官杀生身；印不可用时再察比劫帮身，且两者都须检查受制与副作用。`}:null}},{id:"SWH-04",master:ae,source:ut,evaluate(e){const t=e.dayMasterWuxing,n={木:"水",火:"木",土:"火",金:"土",水:"金"},r={木:"土",火:"金",土:"水",金:"木",水:"火"},o=n[t],s=r[t],i=e.wuxing.count;return e.wuxing.strength.total>=re.strongTotal?null:i[s]>=2.5&&i[s]>=i[o]*1.5?{title:"身弱财多：比劫优先",text:`日主属${t}而${s}（财星）偏多（计 ${i[s]}），身弱财多传统上反为累。平衡方向：先考察比劫（${t}）分财帮身，再考察印星（${o}）。`}:null}},{id:"SWH-05",master:ae,source:ut,evaluate(e){const t=e.dayMasterWuxing,n={木:"水",火:"木",土:"火",金:"土",水:"金"},r={木:"土",火:"金",土:"水",金:"木",水:"火"},o=n[t],s=r[t],i=e.wuxing.count;return e.wuxing.strength.total>=re.strongTotal&&i[o]>=2.5&&i[o]>=i[s]*1.5?{title:"身强印多：财星制印",text:`日主属${t}而${o}（印星）偏多（计 ${i[o]}），身强印多宜抑耗。传统方向：优先考察${s}（财星）制印耗身，并复核官杀、食伤是否加重冲突。`}:null}},{id:"SWH-07",master:ae,source:vo,evaluate(e){return e.shensha.length===0?null:{title:"神煞降权参详",text:`本盘命中神煞：${e.shensha.slice(0,3).map(n=>n.name).join("、")}（共 ${e.shensha.length} 项）。传统运用以「原局优先、神煞佐证」为原则：神煞只作性格与行动主题的辅助参考，不与旺衰喜忌同向时权重降低，不据此作出具体事件判断。`}}}],wo=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"],Co=["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"],z=(e,t)=>({need:"火",reason:`${e}日主生于${t}月，春木渐旺，依蒸馏原则取火温养调候`}),S=(e,t)=>({need:"水",reason:`${e}日主生于${t}月，秋气偏燥，依“秋金得水方精”取水润燥`}),Ao={甲:{寅:z("甲","寅"),卯:z("甲","卯"),辰:z("甲","辰"),巳:{need:"水",reason:"甲木生于巳月，夏木易燥，首取壬水润局"},午:{need:"水",reason:"甲木生于午月，夏木易燥，首取壬水润局"},未:{need:"水",reason:"甲木生于未月，夏木易燥，首取壬水润局"},申:S("甲","申"),酉:S("甲","酉"),戌:S("甲","戌"),亥:{need:"火",reason:"甲木生于亥月，冬寒木冷，首取丙火暖局"},子:{need:"火",reason:"甲木生于子月，冬寒木冷，首取丙火暖局"},丑:{need:"火",reason:"甲木生于丑月，冬寒木冷，首取丙火暖局"}},乙:{寅:z("乙","寅"),卯:z("乙","卯"),辰:z("乙","辰"),巳:{need:"水",reason:"乙木生于巳月，夏木易枯，首取癸水滋润"},午:{need:"水",reason:"乙木生于午月，夏木易枯，首取癸水滋润"},未:{need:"水",reason:"乙木生于未月，夏木易枯，首取癸水滋润"},申:S("乙","申"),酉:S("乙","酉"),戌:S("乙","戌"),亥:{need:"火",reason:"乙木生于亥月，冬寒木冷，首取丙火温暖"},子:{need:"火",reason:"乙木生于子月，冬寒木冷，首取丙火温暖"},丑:{need:"火",reason:"乙木生于丑月，冬寒木冷，首取丙火温暖"}},丙:{寅:z("丙","寅"),卯:z("丙","卯"),辰:z("丙","辰"),巳:{need:"水",reason:"丙火生于巳月，夏火炎烈，首取壬水调候"},午:{need:"水",reason:"丙火生于午月，夏火炎烈，首取壬水调候"},未:{need:"水",reason:"丙火生于未月，夏火炎烈，首取壬水调候"},申:S("丙","申"),酉:S("丙","酉"),戌:S("丙","戌"),亥:{need:"木",reason:"丙火生于亥月，冬寒湿重，首取甲木生扶"},子:{need:"木",reason:"丙火生于子月，冬寒湿重，首取甲木生扶"},丑:{need:"木",reason:"丙火生于丑月，冬寒湿重，首取甲木生扶"}},丁:{寅:z("丁","寅"),卯:z("丁","卯"),辰:z("丁","辰"),巳:{need:"金",reason:"丁火生于巳月，夏火偏燥，首取庚金发水源"},午:{need:"金",reason:"丁火生于午月，夏火偏燥，首取庚金发水源"},未:{need:"金",reason:"丁火生于未月，夏火偏燥，首取庚金发水源"},申:S("丁","申"),酉:S("丁","酉"),戌:S("丁","戌"),亥:{need:"木",reason:"丁火生于亥月，冬火势弱，首取甲木生扶"},子:{need:"木",reason:"丁火生于子月，冬火势弱，首取甲木生扶"},丑:{need:"木",reason:"丁火生于丑月，冬火势弱，首取甲木生扶"}},戊:{寅:z("戊","寅"),卯:z("戊","卯"),辰:z("戊","辰"),巳:{need:"水",reason:"戊土生于巳月，火炎土燥，首取壬水润局"},午:{need:"水",reason:"戊土生于午月，火炎土燥，首取壬水润局"},未:{need:"水",reason:"戊土生于未月，火炎土燥，首取壬水润局"},申:S("戊","申"),酉:S("戊","酉"),戌:S("戊","戌"),亥:{need:"火",reason:"戊土生于亥月，冬土寒湿，首取丙火暖局"},子:{need:"火",reason:"戊土生于子月，冬土寒湿，首取丙火暖局"},丑:{need:"火",reason:"戊土生于丑月，冬土寒湿，首取丙火暖局"}},己:{寅:z("己","寅"),卯:z("己","卯"),辰:z("己","辰"),巳:{need:"水",reason:"己土生于巳月，火炎土燥，首取壬水润局"},午:{need:"水",reason:"己土生于午月，火炎土燥，首取壬水润局"},未:{need:"水",reason:"己土生于未月，火炎土燥，首取壬水润局"},申:S("己","申"),酉:S("己","酉"),戌:S("己","戌"),亥:{need:"火",reason:"己土生于亥月，冬土寒湿，首取丙火暖局"},子:{need:"火",reason:"己土生于子月，冬土寒湿，首取丙火暖局"},丑:{need:"火",reason:"己土生于丑月，冬土寒湿，首取丙火暖局"}},庚:{寅:z("庚","寅"),卯:z("庚","卯"),辰:z("庚","辰"),巳:{need:"水",reason:"庚金生于巳月，火炼真金，首取壬水润局"},午:{need:"水",reason:"庚金生于午月，火炼真金，首取壬水润局"},未:{need:"水",reason:"庚金生于未月，火炼真金，首取壬水润局"},申:S("庚","申"),酉:S("庚","酉"),戌:S("庚","戌"),亥:{need:"火",reason:"庚金生于亥月，冬金偏寒，首取丁火温炼"},子:{need:"火",reason:"庚金生于子月，冬金偏寒，首取丁火温炼"},丑:{need:"火",reason:"庚金生于丑月，冬金偏寒，首取丁火温炼"}},辛:{寅:z("辛","寅"),卯:z("辛","卯"),辰:z("辛","辰"),巳:{need:"水",reason:"辛金生于巳月，夏金受火，首取壬水润局"},午:{need:"水",reason:"辛金生于午月，夏金受火，首取壬水润局"},未:{need:"水",reason:"辛金生于未月，夏金受火，首取壬水润局"},申:S("辛","申"),酉:S("辛","酉"),戌:S("辛","戌"),亥:{need:"火",reason:"辛金生于亥月，冬金偏寒，首取丁火温炼"},子:{need:"火",reason:"辛金生于子月，冬金偏寒，首取丁火温炼"},丑:{need:"火",reason:"辛金生于丑月，冬金偏寒，首取丁火温炼"}},壬:{寅:z("壬","寅"),卯:z("壬","卯"),辰:z("壬","辰"),巳:{need:"金",reason:"壬水生于巳月，夏水易涸，首取庚金发水源"},午:{need:"金",reason:"壬水生于午月，夏水易涸，首取庚金发水源"},未:{need:"金",reason:"壬水生于未月，夏水易涸，首取庚金发水源"},申:S("壬","申"),酉:S("壬","酉"),戌:S("壬","戌"),亥:{need:"土",reason:"壬水生于亥月，冬水势盛，首取戊土制水"},子:{need:"土",reason:"壬水生于子月，冬水势盛，首取戊土制水"},丑:{need:"土",reason:"壬水生于丑月，冬水势盛，首取戊土制水"}},癸:{寅:z("癸","寅"),卯:z("癸","卯"),辰:z("癸","辰"),巳:{need:"金",reason:"癸水生于巳月，夏水易涸，首取庚金发水源"},午:{need:"金",reason:"癸水生于午月，夏水易涸，首取庚金发水源"},未:{need:"金",reason:"癸水生于未月，夏水易涸，首取庚金发水源"},申:S("癸","申"),酉:S("癸","酉"),戌:S("癸","戌"),亥:{need:"土",reason:"癸水生于亥月，冬水势盛，首取戊土制水"},子:{need:"土",reason:"癸水生于子月，冬水势盛，首取戊土制水"},丑:{need:"土",reason:"癸水生于丑月，冬水势盛，首取戊土制水"}}};function pt(e,t){return!wo.includes(e)||!Co.includes(t)?null:Ao[e][t]}const $e="梁湘润体系",ht="https://books.google.com/books?id=Dc4rQwAACAAJ",Ro="https://www.chinyuan.com.tw/all_book/more?id=9322",To={木:"水",火:"木",土:"火",金:"土",水:"金"},mt={木:"土",火:"金",土:"水",金:"木",水:"火"},ko=[{id:"LXR-01",master:$e,source:ht,evaluate(e){const t=e.pillars.month?.branch;if(!t)return null;const n=pt(e.dayMaster,t);if(!n)return null;const r=e.yongshen.yongshen;return r===n.need||To[n.need]===r?{title:"三轨同向：调候与扶抑一致",text:`${n.reason}，传统调候取${n.need}；扶抑法用神为${r}，两轨方向一致。传统上同向证据可提高该平衡方向的参详权重——仍属文化参详，不代表现实事件必然发生。`}:null}},{id:"LXR-02",master:$e,source:Ro,evaluate(e){const t=e.pillars.month?.branch;if(!t)return null;const n=pt(e.dayMaster,t);if(!n)return null;const r=e.yongshen.yongshen;return r===mt[n.need]||n.need===mt[r]?{title:"三轨冲突：调候与扶抑相悖",text:`${n.reason}，传统调候方向取${n.need}，而扶抑法用神为${r}，两轨方向相反。传统上遇此情形应保留多个候选并降低唯一用神的置信度，不宜合并为单一定论。`}:null}},{id:"LXR-04",master:$e,source:ht,evaluate(e){const t=e.wuxing.strength.grade;return t==="偏强"||t==="偏弱"?{title:"旺衰层限定说明",text:`本盘旺衰量化等级「${t}」（总分 ${e.wuxing.strength.total}/100）。此结论只用于扶抑层面的参考，不能覆盖调候或格局层面的判断——不同观察维度结论不同时，以并列呈现为准。`}:null}}];function zo(e,t=6){const n=[];for(const r of[...yo,...ko]){const o=r.evaluate(e);o&&n.push({ruleId:r.id,master:r.master,source:r.source,...o})}return n.slice(0,t)}function Wo({chart:e}){const t=g.useMemo(()=>zo(e),[e]);return t.length===0?null:a.jsxs("section",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:15:5",className:"mt-8 rounded-xl border border-golddim/25 bg-silk2 p-6",children:[a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:16:7",className:"flex items-center justify-between",children:[a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:17:9",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:18:11",className:"font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim",children:"Master Perspectives"}),a.jsx("h3",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:21:11",className:"mt-1 font-serif text-[20px] font-bold tracking-[0.08em] text-inktext",children:"名家视角 · 参详提示"})]}),a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:25:9",className:"rounded-full border border-golddim/40 px-4 py-1.5 text-[11px] tracking-[0.1em] text-inkmuted",children:"传统方法论蒸馏 · 文化参考 · 不构成决策建议"})]}),a.jsx("ul",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:29:7",className:"mt-5 space-y-3",children:t.map(n=>a.jsxs("li",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:31:11",className:"rounded-lg border border-golddim/15 bg-white/40 p-4",children:[a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:32:13",className:"flex flex-wrap items-center gap-2",children:[a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:33:15",className:"font-serif text-[15px] font-bold text-inktext",children:n.title}),a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:34:15",className:"rounded bg-deep px-2 py-0.5 font-mono text-[10.5px] tracking-[0.08em] text-goldbright",children:n.ruleId}),a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:37:15",className:"text-[11.5px] text-golddim",children:n.master})]}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:39:13",className:"mt-2 text-[13.5px] leading-[1.9] text-inkmuted",children:n.text})]},n.ruleId))})]})}const M="whitespace-nowrap border-b border-golddim/25 px-3 py-2.5 text-left font-sans text-[12px] font-medium tracking-[0.1em] text-golddim",L="border-b border-golddim/10 px-3 py-2.5 align-top text-[13px] leading-[1.8] text-inktext";function Ue({children:e,caption:t}){return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:18:5",className:"overflow-hidden rounded-xl border border-golddim/25 bg-silk2 shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:19:7",className:"border-b border-golddim/15 px-4 py-2 text-[11px] tracking-[0.08em] text-inkmuted sm:hidden",children:"左右滑动查看完整表格 →"}),a.jsx("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:22:7",className:"overflow-x-auto overscroll-x-contain",style:{WebkitOverflowScrolling:"touch"},children:a.jsxs("table",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:23:9",className:"w-full min-w-[720px] border-collapse",children:[a.jsx("caption",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:24:11",className:"px-4 pb-0 pt-4 text-left font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:t}),e]})})]})}const So={比肩:"同我（比和）",劫财:"同我（比和）",食神:"我生（泄秀）",伤官:"我生（泄秀）",偏财:"我克（财星）",正财:"我克（财星）",七杀:"克我（官杀）",正官:"克我（官杀）",偏印:"生我（印星）",正印:"生我（印星）"},Po=new Set(["比肩","食神","偏财","七杀","偏印"]);function Io({chart:e}){const t=new Map;for(const n of e.tenGods){if(n.tenGod==="日主")continue;const r=t.get(n.tenGod)??[];r.push({pillar:n.pillar,char:n.char,layer:n.layer==="stem"?"天干":"藏干"}),t.set(n.tenGod,r)}return a.jsxs(Ue,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:54:5",caption:"十神明细（天干透干 + 地支藏干全量）",children:[a.jsx("thead",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:55:7",children:a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:56:9",children:[a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:57:11",className:M,children:"十神"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:58:11",className:M,children:"来源（落柱 · 干支 · 层）"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:59:11",className:M,children:"与日主关系"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:60:11",className:M,children:"阴阳"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:61:11",className:M,children:"传统含义"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:62:11",className:M,children:"规则出处"})]})}),a.jsx("tbody",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:65:7",children:[...t.entries()].map(([n,r])=>{const o=nn[n];return a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:69:13",children:[a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:70:15",className:`${L} font-serif text-[15px] font-bold text-golddim`,children:a.jsx(go,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:71:17",term:n,children:n})}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:73:15",className:L,children:r.map((s,i)=>a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:75:19",className:"mr-2 inline-block whitespace-nowrap",children:[s.pillar,"·",s.char,a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:77:21",className:"ml-1 text-[11px] text-inkmuted",children:["（",s.layer,"）"]})]},i))}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:81:15",className:L,children:So[n]??"—"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:82:15",className:L,children:Po.has(n)?"与日主同阴阳":"与日主异阴阳"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:83:15",className:L,children:o?.meaning??"—"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:84:15",className:`${L} whitespace-nowrap text-[12px] text-inkmuted`,children:o?.source??"—"})]},n)})})]})}function Fo({chart:e}){return e.relations.length===0?a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:100:7",className:"rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:101:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"合冲刑害破"}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:102:9",className:"mt-3 text-[13px] text-inkmuted",children:"本命盘柱间未检出合、冲、刑、害、破关系。"})]}):a.jsxs(Ue,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:107:5",caption:"合冲刑害破（柱间关系）",children:[a.jsx("thead",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:108:7",children:a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:109:9",children:[a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:110:11",className:M,children:"类型"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:111:11",className:M,children:"柱位"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:112:11",className:M,children:"干支"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:113:11",className:M,children:"合化"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:114:11",className:M,children:"规则出处"})]})}),a.jsx("tbody",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:117:7",children:e.relations.map((t,n)=>a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:119:11",children:[a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:120:13",className:`${L} font-serif font-bold text-golddim`,children:t.type}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:121:13",className:L,children:t.pillars.join(" · ")}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:122:13",className:L,children:t.chars}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:123:13",className:L,children:t.resultWuxing?`化${t.resultWuxing}`:"—"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:124:13",className:`${L} text-[12px] text-inkmuted`,children:t.source})]},`${t.type}-${t.chars}-${n}`))})]})}const jo={年:"早年 · 祖上",月:"父母 · 事业",日:"自身 · 婚姻",时:"子女 · 晚年"};function Go({chart:e}){if(e.shensha.length===0)return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:145:7",className:"rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:146:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"神煞"}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:147:9",className:"mt-3 text-[13px] text-inkmuted",children:"本盘未命中注册表内神煞。"})]});const t=[],n=new Map;for(const r of e.shensha){const o=n.get(r.name);o===void 0?(n.set(r.name,t.length),t.push({name:r.name,hits:[r]})):t[o].hits.push(r)}return a.jsxs(Ue,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:167:5",caption:"神煞（逐柱命中，同一神煞多柱命中分行列出）",children:[a.jsx("thead",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:168:7",children:a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:169:9",children:[a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:170:11",className:M,children:"名称"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:171:11",className:M,children:"命中柱位"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:172:11",className:M,children:"柱位传统对应"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:173:11",className:M,children:"命中状态"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:174:11",className:M,children:"现代化说明"})]})}),a.jsx("tbody",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:177:7",children:t.flatMap(r=>r.hits.map((o,s)=>a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:180:13",children:[a.jsxs("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:181:15",className:`${L} font-serif font-bold text-golddim`,children:[o.name,r.hits.length>1&&a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:184:19",className:"ml-1.5 rounded-full border border-golddim/30 px-1.5 py-0.5 align-middle font-sans text-[10px] font-normal text-inkmuted",children:[r.hits.length," 柱命中"]})]}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:189:15",className:L,children:o.pillar}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:190:15",className:L,children:jo[o.pillar[0]]??"—"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:193:15",className:L,children:o.char}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:194:15",className:`${L} leading-[1.8]`,children:o.modernExplanation})]},`${r.name}-${o.pillar}-${o.char}-${s}`)))})]})}function Bo({chart:e}){const t=e.chenggu;if(!t)return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:209:7",className:"rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:210:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"称骨"}),a.jsxs("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:211:9",className:"mt-3 text-[13px] text-inkmuted",children:["暂不可用",e.input.hour===null?"（时辰不详，称骨需时柱）":""]})]});const n=o=>`${(o/10).toFixed(1)} 两`,r=[{label:`年（${t.yearGanzhi}）`,q:t.yearQian},{label:`月（农历${t.lunarMonth}月）`,q:t.monthQian},{label:`日（${t.lunarDay}日）`,q:t.dayQian},{label:`时（${t.hourBranch}时）`,q:t.hourQian}];return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:225:5",className:"rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:226:7",className:"text-center font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"称骨（袁天罡称骨歌）"}),a.jsx("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:229:7",className:"mt-5 grid grid-cols-2 gap-3 md:grid-cols-4",children:r.map(o=>a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:231:11",className:"rounded-lg border border-golddim/20 bg-silk px-3 py-3 text-center",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:232:13",className:"text-[11.5px] tracking-[0.08em] text-inkmuted",children:o.label}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:233:13",className:"mt-1 font-serif text-[16px] font-bold text-inktext",children:n(o.q)})]},o.label))}),a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:237:7",className:"mt-5 text-center",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:238:9",className:"text-[11.5px] tracking-[0.16em] text-inkmuted",children:"总骨重"}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:239:9",className:"mt-1 font-serif text-[34px] font-black leading-none text-golddim",children:t.totalText})]}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:243:7",className:"mt-4 whitespace-pre-line border-t border-golddim/15 pt-4 text-center font-serif text-[14.5px] leading-[2] text-inktext",children:t.verse}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:246:7",className:"mt-3 text-center text-[11.5px] text-inkmuted",children:t.source})]})}export{Bo as C,go as G,Wo as M,Fo as R,Go as S,Io as T,xo as a,zo as b};
