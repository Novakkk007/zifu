import{r as g,b as Je,j as a,L as Ze}from"./vendor-react-FunsyZlc.js";import"./calendar-SSJ0OB1p.js";import{T as tn}from"./bazi-uycTaXUE.js";import"./index-BGoleodY.js";import{P as pt,J as lt,K as he,M as Ct,N as en,O as nn,Q as rn,U as ot,V as me,W as on,Y as sn,_ as an,c as xe}from"./index-ItFlx_Nr.js";import{B as cn}from"./books-B08njrvZ.js";const ln=["top","right","bottom","left"],Q=Math.min,V=Math.max,bt=Math.round,xt=Math.floor,X=t=>({x:t,y:t}),dn={left:"right",right:"left",bottom:"top",top:"bottom"};function ge(t,e,n){return V(t,Q(e,n))}function U(t,e){return typeof t=="function"?t(e):t}function J(t){return t.split("-")[0]}function at(t){return t.split("-")[1]}function Ht(t){return t==="x"?"y":"x"}function Wt(t){return t==="y"?"height":"width"}function G(t){const e=t[0];return e==="t"||e==="b"?"y":"x"}function Ft(t){return Ht(G(t))}function fn(t,e,n){n===void 0&&(n=!1);const r=at(t),o=Ft(t),s=Wt(o);let i=o==="x"?r===(n?"end":"start")?"right":"left":r==="start"?"bottom":"top";return e.reference[s]>e.floating[s]&&(i=vt(i)),[i,vt(i)]}function un(t){const e=vt(t);return[$t(t),e,$t(e)]}function $t(t){return t.includes("start")?t.replace("start","end"):t.replace("end","start")}const Jt=["left","right"],Zt=["right","left"],pn=["top","bottom"],hn=["bottom","top"];function mn(t,e,n){switch(t){case"top":case"bottom":return n?e?Zt:Jt:e?Jt:Zt;case"left":case"right":return e?pn:hn;default:return[]}}function xn(t,e,n,r){const o=at(t);let s=mn(J(t),n==="start",r);return o&&(s=s.map(i=>i+"-"+o),e&&(s=s.concat(s.map($t)))),s}function vt(t){const e=J(t);return dn[e]+t.slice(e.length)}function gn(t){var e,n,r,o;return{top:(e=t.top)!=null?e:0,right:(n=t.right)!=null?n:0,bottom:(r=t.bottom)!=null?r:0,left:(o=t.left)!=null?o:0}}function be(t){return typeof t!="number"?gn(t):{top:t,right:t,bottom:t,left:t}}function wt(t){const{x:e,y:n,width:r,height:o}=t;return{width:r,height:o,top:n,left:e,right:e+r,bottom:n+o,x:e,y:n}}function te(t,e,n){let{reference:r,floating:o}=t;const s=G(e),i=Ft(e),c=Wt(i),l=J(e),d=s==="y",u=r.x+r.width/2-o.width/2,p=r.y+r.height/2-o.height/2,h=r[c]/2-o[c]/2;let f;switch(l){case"top":f={x:u,y:r.y-o.height};break;case"bottom":f={x:u,y:r.y+r.height};break;case"right":f={x:r.x+r.width,y:p};break;case"left":f={x:r.x-o.width,y:p};break;default:f={x:r.x,y:r.y}}const x=at(e);return x&&(f[i]+=h*(x==="end"?1:-1)*(n&&d?-1:1)),f}async function bn(t,e){var n;e===void 0&&(e={});const{x:r,y:o,platform:s,rects:i,elements:c,strategy:l}=t,{boundary:d="clippingAncestors",rootBoundary:u="viewport",elementContext:p="floating",altBoundary:h=!1,padding:f=0}=U(e,t),x=be(f),b=c[h?p==="floating"?"reference":"floating":p],v=wt(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(b)))==null||n?b:b.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(c.floating)),boundary:d,rootBoundary:u,strategy:l})),w=p==="floating"?{x:r,y:o,width:i.floating.width,height:i.floating.height}:i.reference,R=await(s.getOffsetParent==null?void 0:s.getOffsetParent(c.floating)),y=await(s.isElement==null?void 0:s.isElement(R))&&await(s.getScale==null?void 0:s.getScale(R))||{x:1,y:1},z=wt(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:c,rect:w,offsetParent:R,strategy:l}):w);return{top:(v.top-z.top+x.top)/y.y,bottom:(z.bottom-v.bottom+x.bottom)/y.y,left:(v.left-z.left+x.left)/y.x,right:(z.right-v.right+x.right)/y.x}}const vn=50,wn=async(t,e,n)=>{const{placement:r="bottom",strategy:o="absolute",middleware:s=[],platform:i}=n,c=i.detectOverflow?i:{...i,detectOverflow:bn},l=await(i.isRTL==null?void 0:i.isRTL(e));let d=await i.getElementRects({reference:t,floating:e,strategy:o}),{x:u,y:p}=te(d,r,l),h=r,f=0;const x={};for(let m=0;m<s.length;m++){const b=s[m];if(!b)continue;const{name:v,fn:w}=b,{x:R,y,data:z,reset:C}=await w({x:u,y:p,initialPlacement:r,placement:h,strategy:o,middlewareData:x,rects:d,platform:c,elements:{reference:t,floating:e}});u=R??u,p=y??p,x[v]={...x[v],...z},C&&f<vn&&(f++,typeof C=="object"&&(C.placement&&(h=C.placement),C.rects&&(d=C.rects===!0?await i.getElementRects({reference:t,floating:e,strategy:o}):C.rects),{x:u,y:p}=te(d,h,l)),m=-1)}return{x:u,y:p,placement:h,strategy:o,middlewareData:x}},yn=t=>({name:"arrow",options:t,async fn(e){const{x:n,y:r,placement:o,rects:s,platform:i,elements:c,middlewareData:l}=e,{element:d,padding:u=0}=U(t,e)||{};if(d==null)return{};const p=be(u),h={x:n,y:r},f=Ft(o),x=Wt(f),m=await i.getDimensions(d),b=f==="y",v=b?"top":"left",w=b?"bottom":"right",R=b?"clientHeight":"clientWidth",y=s.reference[x]+s.reference[f]-h[f]-s.floating[x],z=h[f]-s.reference[f],C=await(i.getOffsetParent==null?void 0:i.getOffsetParent(d));let A=C?C[R]:0;(!A||!await(i.isElement==null?void 0:i.isElement(C)))&&(A=c.floating[R]||s.floating[x]);const S=y/2-z/2,N=A/2-m[x]/2-1,k=Q(p[v],N),F=Q(p[w],N),I=A-m[x]-F,O=A/2-m[x]/2+S,P=ge(k,O,I),H=!l.arrow&&at(o)!=null&&O!==P&&s.reference[x]/2-(O<k?k:F)-m[x]/2<0,j=H?O<k?O-k:O-I:0;return{[f]:h[f]+j,data:{[f]:P,centerOffset:O-P-j,...H&&{alignmentOffset:j}},reset:H}}}),Cn=function(t){return t===void 0&&(t={}),{name:"flip",options:t,async fn(e){var n,r;const{placement:o,middlewareData:s,rects:i,initialPlacement:c,platform:l,elements:d}=e,{mainAxis:u=!0,crossAxis:p=!0,fallbackPlacements:h,fallbackStrategy:f="bestFit",fallbackAxisSideDirection:x="none",flipAlignment:m=!0,...b}=U(t,e);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const v=J(o),w=G(c),R=J(c)===c,y=await(l.isRTL==null?void 0:l.isRTL(d.floating)),z=h||(R||!m?[vt(c)]:un(c)),C=x!=="none";!h&&C&&z.push(...xn(c,m,x,y));const A=[c,...z],S=await l.detectOverflow(e,b),N=[];let k=((r=s.flip)==null?void 0:r.overflows)||[];if(u&&N.push(S[v]),p){const P=fn(o,i,y);N.push(S[P[0]],S[P[1]])}if(k=[...k,{placement:o,overflows:N}],!N.every(P=>P<=0)){var F,I;const P=(((F=s.flip)==null?void 0:F.index)||0)+1,H=A[P];if(H&&(!(p==="alignment"?w!==G(H):!1)||k.every(T=>G(T.placement)===w?T.overflows[0]>0:!0)))return{data:{index:P,overflows:k},reset:{placement:H}};let j=(I=k.filter(M=>M.overflows[0]<=0).sort((M,T)=>M.overflows[1]-T.overflows[1])[0])==null?void 0:I.placement;if(!j)switch(f){case"bestFit":{var O;const M=(O=k.filter(T=>{if(C){const D=G(T.placement);return D===w||D==="y"}return!0}).map(T=>[T.placement,T.overflows.filter(D=>D>0).reduce((D,W)=>D+W,0)]).sort((T,D)=>T[1]-D[1])[0])==null?void 0:O[0];M&&(j=M);break}case"initialPlacement":j=c;break}if(o!==j)return{reset:{placement:j}}}return{}}}};function ee(t,e){return{top:t.top-e.height,right:t.right-e.width,bottom:t.bottom-e.height,left:t.left-e.width}}function ne(t){return ln.some(e=>t[e]>=0)}const Rn=function(t){return t===void 0&&(t={}),{name:"hide",options:t,async fn(e){const{rects:n,platform:r}=e,{strategy:o="referenceHidden",...s}=U(t,e);switch(o){case"referenceHidden":{const i=await r.detectOverflow(e,{...s,elementContext:"reference"}),c=ee(i,n.reference);return{data:{referenceHiddenOffsets:c,referenceHidden:ne(c)}}}case"escaped":{const i=await r.detectOverflow(e,{...s,altBoundary:!0}),c=ee(i,n.floating);return{data:{escapedOffsets:c,escaped:ne(c)}}}default:return{}}}}},ve=new Set(["left","top"]);async function zn(t,e){const{placement:n,platform:r,elements:o}=t,s=await(r.isRTL==null?void 0:r.isRTL(o.floating)),i=J(n),c=at(n),l=G(n)==="y",d=ve.has(i)?-1:1,u=s&&l?-1:1,p=U(e,t);let{mainAxis:h,crossAxis:f,alignmentAxis:x}=typeof p=="number"?{mainAxis:p,crossAxis:0,alignmentAxis:null}:{mainAxis:p.mainAxis||0,crossAxis:p.crossAxis||0,alignmentAxis:p.alignmentAxis};return c&&typeof x=="number"&&(f=c==="end"?x*-1:x),l?{x:f*u,y:h*d}:{x:h*d,y:f*u}}const An=function(t){return t===void 0&&(t=0),{name:"offset",options:t,async fn(e){var n,r;const{x:o,y:s,placement:i,middlewareData:c}=e,l=await zn(e,t);return i===((n=c.offset)==null?void 0:n.placement)&&(r=c.arrow)!=null&&r.alignmentOffset?{}:{x:o+l.x,y:s+l.y,data:{...l,placement:i}}}}},Tn=function(t){return t===void 0&&(t={}),{name:"shift",options:t,async fn(e){const{x:n,y:r,placement:o,platform:s}=e,{mainAxis:i=!0,crossAxis:c=!1,limiter:l={fn:w=>{let{x:R,y}=w;return{x:R,y}}},...d}=U(t,e),u={x:n,y:r},p=await s.detectOverflow(e,d),h=G(o),f=Ht(h);let x=u[f],m=u[h];const b=(w,R)=>ge(R+p[w==="y"?"top":"left"],R,R-p[w==="y"?"bottom":"right"]);i&&(x=b(f,x)),c&&(m=b(h,m));const v=l.fn({...e,[f]:x,[h]:m});return{...v,data:{x:v.x-n,y:v.y-r,enabled:{[f]:i,[h]:c}}}}}},kn=function(t){return t===void 0&&(t={}),{options:t,fn(e){var n,r;const{x:o,y:s,placement:i,rects:c,middlewareData:l}=e,{offset:d=0,mainAxis:u=!0,crossAxis:p=!0}=U(t,e),h={x:o,y:s},f=G(i),x=Ht(f);let m=h[x],b=h[f];const v=U(d,e),w=typeof v=="number"?{mainAxis:v,crossAxis:0}:{mainAxis:(n=v.mainAxis)!=null?n:0,crossAxis:(r=v.crossAxis)!=null?r:0};if(u){const z=x==="y"?"height":"width",C=c.reference[x]-c.floating[z]+w.mainAxis,A=c.reference[x]+c.reference[z]-w.mainAxis;m<C?m=C:m>A&&(m=A)}if(p){var R,y;const z=x==="y"?"width":"height",C=ve.has(J(i)),A=c.reference[f]-c.floating[z]+(C&&((R=l.offset)==null?void 0:R[f])||0)+(C?0:w.crossAxis),S=c.reference[f]+c.reference[z]+(C?0:((y=l.offset)==null?void 0:y[f])||0)-(C?w.crossAxis:0);b<A?b=A:b>S&&(b=S)}return{[x]:m,[f]:b}}}},Sn=function(t){return t===void 0&&(t={}),{name:"size",options:t,async fn(e){const{placement:n,rects:r,platform:o,elements:s}=e,{apply:i=()=>{},...c}=U(t,e),l=await o.detectOverflow(e,c),d=J(n),u=at(n),p=G(n)==="y",{width:h,height:f}=r.floating;let x,m;d==="top"||d==="bottom"?(x=d,m=u===(await(o.isRTL==null?void 0:o.isRTL(s.floating))?"start":"end")?"left":"right"):(m=d,x=u==="end"?"top":"bottom");const b=f-l.top-l.bottom,v=h-l.left-l.right,w=Q(f-l[x],b),R=Q(h-l[m],v),y=e.middlewareData.shift,z=!y;let C=w,A=R;y!=null&&y.enabled.x&&(A=v),y!=null&&y.enabled.y&&(C=b),z&&!u&&(p?A=h-2*V(l.left,l.right):C=f-2*V(l.top,l.bottom)),await i({...e,availableWidth:A,availableHeight:C});const S=await o.getDimensions(s.floating);return h!==S.width||f!==S.height?{reset:{rects:!0}}:{}}}};function Rt(){return typeof window<"u"}function ct(t){return we(t)?(t.nodeName||"").toLowerCase():"#document"}function L(t){var e;return(t==null||(e=t.ownerDocument)==null?void 0:e.defaultView)||window}function K(t){var e;return(e=(we(t)?t.ownerDocument:t.document)||window.document)==null?void 0:e.documentElement}function we(t){return Rt()?t instanceof Node||t instanceof L(t).Node:!1}function B(t){return Rt()?t instanceof Element||t instanceof L(t).Element:!1}function Z(t){return Rt()?t instanceof HTMLElement||t instanceof L(t).HTMLElement:!1}function re(t){return!Rt()||typeof ShadowRoot>"u"?!1:t instanceof ShadowRoot||t instanceof L(t).ShadowRoot}function zt(t){const{overflow:e,overflowX:n,overflowY:r,display:o}=q(t);return/auto|scroll|overlay|hidden|clip/.test(e+r+n)&&o!=="inline"&&o!=="contents"}function Pn(t){return/^(table|td|th)$/.test(ct(t))}function At(t){try{if(t.matches(":popover-open"))return!0}catch{}try{return t.matches(":modal")}catch{return!1}}const jn=/transform|translate|scale|rotate|perspective|filter/,Dn=/paint|layout|strict|content/,tt=t=>!!t&&t!=="none";let Dt;function It(t){const e=B(t)?q(t):t;return tt(e.transform)||tt(e.translate)||tt(e.scale)||tt(e.rotate)||tt(e.perspective)||!Gt()&&(tt(e.backdropFilter)||tt(e.filter))||jn.test(e.willChange||"")||Dn.test(e.contain||"")}function On(t){let e=nt(t);for(;Z(e)&&!dt(e);){if(It(e))return e;if(At(e))return null;e=nt(e)}return null}function Gt(){return Dt==null&&(Dt=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),Dt}function dt(t){return/^(html|body|#document)$/.test(ct(t))}function q(t){return L(t).getComputedStyle(t)}function Tt(t){return B(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.scrollX,scrollTop:t.scrollY}}function nt(t){if(ct(t)==="html")return t;const e=t.assignedSlot||t.parentNode||re(t)&&t.host||K(t);return re(e)?e.host:e}function ye(t){const e=nt(t);return dt(e)?(t.ownerDocument||t).body:Z(e)&&zt(e)?e:ye(e)}function ft(t,e,n){var r;e===void 0&&(e=[]),n===void 0&&(n=!0);const o=ye(t),s=o===((r=t.ownerDocument)==null?void 0:r.body),i=L(o);if(s){const c=_t(i);return e.concat(i,i.visualViewport||[],zt(o)?o:[],c&&n?ft(c):[])}else return e.concat(o,ft(o,[],n))}function _t(t){return t.parent&&Object.getPrototypeOf(t.parent)?t.frameElement:null}function Ce(t){const e=q(t);let n=parseFloat(e.width)||0,r=parseFloat(e.height)||0;const o=Z(t),s=o?t.offsetWidth:n,i=o?t.offsetHeight:r,c=bt(n)!==s||bt(r)!==i;return c&&(n=s,r=i),{width:n,height:r,$:c}}function Bt(t){return B(t)?t:t.contextElement}function it(t){const e=Bt(t);if(!Z(e))return X(1);const n=e.getBoundingClientRect(),{width:r,height:o,$:s}=Ce(e);let i=(s?bt(n.width):n.width)/r,c=(s?bt(n.height):n.height)/o;return(!i||!Number.isFinite(i))&&(i=1),(!c||!Number.isFinite(c))&&(c=1),{x:i,y:c}}const En=X(0);function Re(t){const e=L(t);return!Gt()||!e.visualViewport?En:{x:e.visualViewport.offsetLeft,y:e.visualViewport.offsetTop}}function Nn(t,e,n){return e===void 0&&(e=!1),!!n&&e&&n===L(t)}function rt(t,e,n,r){e===void 0&&(e=!1),n===void 0&&(n=!1);const o=t.getBoundingClientRect(),s=Bt(t);let i=X(1);e&&(r?B(r)&&(i=it(r)):i=it(t));const c=Nn(s,n,r)?Re(s):X(0);let l=(o.left+c.x)/i.x,d=(o.top+c.y)/i.y,u=o.width/i.x,p=o.height/i.y;if(s&&r){const h=L(s),f=B(r)?L(r):r;let x=h,m=_t(x);for(;m&&f!==x;){const b=it(m),v=m.getBoundingClientRect(),w=q(m),R=v.left+(m.clientLeft+parseFloat(w.paddingLeft))*b.x,y=v.top+(m.clientTop+parseFloat(w.paddingTop))*b.y;l*=b.x,d*=b.y,u*=b.x,p*=b.y,l+=R,d+=y,x=L(m),m=_t(x)}}return wt({width:u,height:p,x:l,y:d})}function kt(t,e){const n=Tt(t).scrollLeft;return e?e.left+n:rt(K(t)).left+n}function ze(t,e){const n=t.getBoundingClientRect(),r=n.left+e.scrollLeft-kt(t,n),o=n.top+e.scrollTop;return{x:r,y:o}}function $n(t){let{elements:e,rect:n,offsetParent:r,strategy:o}=t;const s=o==="fixed",i=K(r),c=e?At(e.floating):!1;if(r===i||c&&s)return n;let l={scrollLeft:0,scrollTop:0},d=X(1);const u=X(0),p=Z(r);if((p||!s)&&((ct(r)!=="body"||zt(i))&&(l=Tt(r)),p)){const f=rt(r);d=it(r),u.x=f.x+r.clientLeft,u.y=f.y+r.clientTop}const h=i&&!p&&!s?ze(i,l):X(0);return{width:n.width*d.x,height:n.height*d.y,x:n.x*d.x-l.scrollLeft*d.x+u.x+h.x,y:n.y*d.y-l.scrollTop*d.y+u.y+h.y}}function _n(t){return t.getClientRects?Array.from(t.getClientRects()):[]}function Mn(t){const e=Tt(t),n=t.ownerDocument.body,r=V(t.scrollWidth,t.clientWidth,n.scrollWidth,n.clientWidth),o=V(t.scrollHeight,t.clientHeight,n.scrollHeight,n.clientHeight);let s=-e.scrollLeft+kt(t);const i=-e.scrollTop;return q(n).direction==="rtl"&&(s+=V(t.clientWidth,n.clientWidth)-r),{width:r,height:o,x:s,y:i}}const Ln=25;function Hn(t,e,n){n===void 0&&(n="viewport");const r=n==="layoutViewport",o=L(t),s=K(t),i=o.visualViewport;let c=s.clientWidth,l=s.clientHeight,d=0,u=0;if(i){const h=!Gt()||e==="fixed";r?h||(d=-i.offsetLeft,u=-i.offsetTop):(c=i.width,l=i.height,h&&(d=i.offsetLeft,u=i.offsetTop))}if(kt(s)<=0){const h=s.ownerDocument,f=h.body,x=getComputedStyle(f),m=h.compatMode==="CSS1Compat"&&parseFloat(x.marginLeft)+parseFloat(x.marginRight)||0,b=Math.abs(s.clientWidth-f.clientWidth-m),v=getComputedStyle(s).scrollbarGutter==="stable both-edges"?b/2:b;v<=Ln&&(c-=v)}return{width:c,height:l,x:d,y:u}}function Wn(t,e){const n=rt(t,!0,e==="fixed"),r=n.top+t.clientTop,o=n.left+t.clientLeft,s=it(t),i=t.clientWidth*s.x,c=t.clientHeight*s.y,l=o*s.x,d=r*s.y;return{width:i,height:c,x:l,y:d}}function oe(t,e,n){let r;if(e==="viewport"||e==="layoutViewport")r=Hn(t,n,e);else if(e==="document")r=Mn(K(t));else if(B(e))r=Wn(e,n);else{const o=Re(t);r={x:e.x-o.x,y:e.y-o.y,width:e.width,height:e.height}}return wt(r)}function Fn(t,e){const n=e.get(t);if(n)return n;let r=ft(t,[],!1).filter(c=>B(c)&&ct(c)!=="body"),o=null;const s=q(t).position==="fixed";let i=s?nt(t):t;for(;B(i)&&!dt(i);){const c=q(i),l=It(i),d=o?o.position:s?"fixed":"";!l&&(d==="fixed"||d==="absolute"&&c.position==="static")?r=r.filter(p=>p!==i):o=c,i=nt(i)}return e.set(t,r),r}function In(t){let{element:e,boundary:n,rootBoundary:r,strategy:o}=t;const i=[...n==="clippingAncestors"?At(e)?[]:Fn(e,this._c):[].concat(n),r],c=oe(e,i[0],o);let l=c.top,d=c.right,u=c.bottom,p=c.left;for(let h=1;h<i.length;h++){const f=oe(e,i[h],o);l=V(f.top,l),d=Q(f.right,d),u=Q(f.bottom,u),p=V(f.left,p)}return{width:d-p,height:u-l,x:p,y:l}}function Gn(t){const{width:e,height:n}=Ce(t);return{width:e,height:n}}function Bn(t,e,n){const r=Z(e),o=K(e),s=n==="fixed",i=rt(t,!0,s,e);let c={scrollLeft:0,scrollTop:0};const l=X(0);if((r||!s)&&((ct(e)!=="body"||zt(o))&&(c=Tt(e)),r)){const h=rt(e,!0,s,e);l.x=h.x+e.clientLeft,l.y=h.y+e.clientTop}!r&&o&&(l.x=kt(o));const d=o&&!r&&!s?ze(o,c):X(0),u=i.left+c.scrollLeft-l.x-d.x,p=i.top+c.scrollTop-l.y-d.y;return{x:u,y:p,width:i.width,height:i.height}}function Ot(t){return q(t).position==="static"}function se(t,e){if(!Z(t)||q(t).position==="fixed")return null;if(e)return e(t);let n=t.offsetParent;return K(t)===n&&(n=n.ownerDocument.body),n}function Ae(t,e){const n=L(t);if(At(t))return n;if(!Z(t)){let o=nt(t);for(;o&&!dt(o);){if(B(o)&&!Ot(o))return o;o=nt(o)}return n}let r=se(t,e);for(;r&&Pn(r)&&Ot(r);)r=se(r,e);return r&&dt(r)&&Ot(r)&&!It(r)?n:r||On(t)||n}const qn=async function(t){const e=this.getOffsetParent||Ae,n=this.getDimensions,r=await n(t.floating);return{reference:Bn(t.reference,await e(t.floating),t.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}};function Vn(t){return q(t).direction==="rtl"}const Xn={convertOffsetParentRelativeRectToViewportRelativeRect:$n,getDocumentElement:K,getClippingRect:In,getOffsetParent:Ae,getElementRects:qn,getClientRects:_n,getDimensions:Gn,getScale:it,isElement:B,isRTL:Vn};function Te(t,e){return t.x===e.x&&t.y===e.y&&t.width===e.width&&t.height===e.height}function Yn(t,e,n){let r=null,o;const s=K(t);function i(){var u;clearTimeout(o),(u=r)==null||u.disconnect(),r=null}function c(u,p){u===void 0&&(u=!1),p===void 0&&(p=1),i();const h=t.getBoundingClientRect(),{left:f,top:x,width:m,height:b}=h;if(u||e(),!m||!b)return;const v=xt(x),w=xt(s.clientWidth-(f+m)),R=xt(s.clientHeight-(x+b)),y=xt(f),C={rootMargin:-v+"px "+-w+"px "+-R+"px "+-y+"px",threshold:V(0,Q(1,p))||1};let A=!0;function S(N){const k=N[0].intersectionRatio;if(!Te(h,t.getBoundingClientRect()))return c();if(k!==p){if(!A)return c();k?c(!1,k):o=setTimeout(()=>{c(!1,1e-7)},1e3)}A=!1}try{r=new IntersectionObserver(S,{...C,root:s.ownerDocument})}catch{r=new IntersectionObserver(S,C)}r.observe(t)}const l=L(t),d=()=>c(n);return l.addEventListener("resize",d),c(!0),()=>{l.removeEventListener("resize",d),i()}}function Un(t,e,n,r){r===void 0&&(r={});const{ancestorScroll:o=!0,ancestorResize:s=!0,elementResize:i=typeof ResizeObserver=="function",layoutShift:c=typeof IntersectionObserver=="function",animationFrame:l=!1}=r,d=Bt(t),u=o||s?[...d?ft(d):[],...e?ft(e):[]]:[];u.forEach(v=>{o&&v.addEventListener("scroll",n),s&&v.addEventListener("resize",n)});const p=d&&c?Yn(d,n,s):null;let h=-1,f=null;i&&(f=new ResizeObserver(v=>{let[w]=v;w&&w.target===d&&f&&e&&(f.unobserve(e),cancelAnimationFrame(h),h=requestAnimationFrame(()=>{var R;(R=f)==null||R.observe(e)})),n()}),d&&!l&&f.observe(d),e&&f.observe(e));let x,m=l?rt(t):null;l&&b();function b(){const v=rt(t);m&&!Te(m,v)&&n(),m=v,x=requestAnimationFrame(b)}return n(),()=>{var v;u.forEach(w=>{o&&w.removeEventListener("scroll",n),s&&w.removeEventListener("resize",n)}),p?.(),(v=f)==null||v.disconnect(),f=null,l&&cancelAnimationFrame(x)}}const Kn=An,Qn=Tn,Jn=Cn,Zn=Sn,tr=Rn,ie=yn,er=kn,nr=(t,e,n)=>{const r=new Map,o=n??{},s={...Xn,...o.platform,_c:r};return wn(t,e,{...o,platform:s})};var rr=typeof document<"u",or=function(){},gt=rr?g.useLayoutEffect:or;function yt(t,e){if(t===e)return!0;if(typeof t!=typeof e)return!1;if(typeof t=="function"&&t.toString()===e.toString())return!0;let n,r,o;if(t&&e&&typeof t=="object"){if(Array.isArray(t)){if(n=t.length,n!==e.length)return!1;for(r=n;r--!==0;)if(!yt(t[r],e[r]))return!1;return!0}if(o=Object.keys(t),n=o.length,n!==Object.keys(e).length)return!1;for(r=n;r--!==0;)if(!{}.hasOwnProperty.call(e,o[r]))return!1;for(r=n;r--!==0;){const s=o[r];if(!(s==="_owner"&&t.$$typeof)&&!yt(t[s],e[s]))return!1}return!0}return t!==t&&e!==e}function ke(t){return typeof window>"u"?1:(t.ownerDocument.defaultView||window).devicePixelRatio||1}function ae(t,e){const n=ke(t);return Math.round(e*n)/n}function Et(t){const e=g.useRef(t);return gt(()=>{e.current=t}),e}function sr(t){t===void 0&&(t={});const{placement:e="bottom",strategy:n="absolute",middleware:r=[],platform:o,elements:{reference:s,floating:i}={},transform:c=!0,whileElementsMounted:l,open:d}=t,[u,p]=g.useState({x:0,y:0,strategy:n,placement:e,middlewareData:{},isPositioned:!1}),[h,f]=g.useState(r);yt(h,r)||f(r);const[x,m]=g.useState(null),[b,v]=g.useState(null),w=g.useCallback(T=>{T!==C.current&&(C.current=T,m(T))},[]),R=g.useCallback(T=>{T!==A.current&&(A.current=T,v(T))},[]),y=s||x,z=i||b,C=g.useRef(null),A=g.useRef(null),S=g.useRef(u),N=l!=null,k=Et(l),F=Et(o),I=Et(d),O=g.useCallback(()=>{if(!C.current||!A.current)return;const T={placement:e,strategy:n,middleware:h};F.current&&(T.platform=F.current),nr(C.current,A.current,T).then(D=>{const W={...D,isPositioned:I.current!==!1};P.current&&!yt(S.current,W)&&(S.current=W,Je.flushSync(()=>{p(W)}))})},[h,e,n,F,I]);gt(()=>{d===!1&&S.current.isPositioned&&(S.current.isPositioned=!1,p(T=>({...T,isPositioned:!1})))},[d]);const P=g.useRef(!1);gt(()=>(P.current=!0,()=>{P.current=!1}),[]),gt(()=>{if(y&&(C.current=y),z&&(A.current=z),y&&z){if(k.current)return k.current(y,z,O);O()}},[y,z,O,k,N]);const H=g.useMemo(()=>({reference:C,floating:A,setReference:w,setFloating:R}),[w,R]),j=g.useMemo(()=>({reference:y,floating:z}),[y,z]),M=g.useMemo(()=>{const T={position:n,left:0,top:0};if(!j.floating)return T;const D=ae(j.floating,u.x),W=ae(j.floating,u.y);return c?{...T,transform:"translate("+D+"px, "+W+"px)",...ke(j.floating)>=1.5&&{willChange:"transform"}}:{position:n,left:D,top:W}},[n,c,j.floating,u.x,u.y]);return g.useMemo(()=>({...u,update:O,refs:H,elements:j,floatingStyles:M}),[u,O,H,j,M])}const ir=t=>{function e(n){return{}.hasOwnProperty.call(n,"current")}return{name:"arrow",options:t,fn(n){const{element:r,padding:o}=typeof t=="function"?t(n):t;return r&&e(r)?r.current!=null?ie({element:r.current,padding:o}).fn(n):{}:r?ie({element:r,padding:o}).fn(n):{}}}},ar=(t,e)=>{const n=Kn(t);return{name:n.name,fn:n.fn,options:[t,e]}},cr=(t,e)=>{const n=Qn(t);return{name:n.name,fn:n.fn,options:[t,e]}},lr=(t,e)=>({fn:er(t).fn,options:[t,e]}),dr=(t,e)=>{const n=Jn(t);return{name:n.name,fn:n.fn,options:[t,e]}},fr=(t,e)=>{const n=Zn(t);return{name:n.name,fn:n.fn,options:[t,e]}},ur=(t,e)=>{const n=tr(t);return{name:n.name,fn:n.fn,options:[t,e]}},pr=(t,e)=>{const n=ir(t);return{name:n.name,fn:n.fn,options:[t,e]}};var hr=Object.defineProperty,mr=(t,e)=>hr(t,"name",{value:e,configurable:!0}),xr=g.forwardRef(mr(function(e,n){const{children:r,width:o=10,height:s=5,...i}=e;return a.jsx(pt.svg,{...i,ref:n,width:o,height:s,viewBox:"0 0 30 10",preserveAspectRatio:"none",children:e.asChild?r:a.jsx("polygon",{points:"0,0 30,0 15,10"})})},"Arrow")),gr=xr,br=Object.defineProperty,vr=(t,e)=>br(t,"name",{value:e,configurable:!0});function Se(t){const[e,n]=g.useState(void 0);return lt(()=>{if(t){n({width:t.offsetWidth,height:t.offsetHeight});const r=new ResizeObserver(o=>{if(!Array.isArray(o)||!o.length)return;const s=o[0];let i,c;if("borderBoxSize"in s){const l=s.borderBoxSize,d=Array.isArray(l)?l[0]:l;i=d.inlineSize,c=d.blockSize}else i=t.offsetWidth,c=t.offsetHeight;n({width:i,height:c})});return r.observe(t,{box:"border-box"}),()=>r.unobserve(t)}else n(void 0)},[t]),e}vr(Se,"useSize");var wr=Object.defineProperty,Y=(t,e)=>wr(t,"name",{value:e,configurable:!0}),Pe="Popper",[je,De]=he(Pe),[yr,Oe]=je(Pe),Cr=Y(t=>{const{__scopePopper:e,children:n}=t,[r,o]=g.useState(null),[s,i]=g.useState(void 0);return a.jsx(yr,{scope:e,anchor:r,onAnchorChange:o,placementState:s,setPlacementState:i,children:n})},"Popper"),Rr="PopperAnchor",zr=g.forwardRef(Y(function(e,n){const{__scopePopper:r,virtualRef:o,...s}=e,i=Oe(Rr,r),c=g.useRef(null),l=i.onAnchorChange,d=g.useCallback(m=>{c.current=m,m&&l(m)},[l]),u=Ct(n,d),p=g.useRef(null);g.useEffect(()=>{if(!o)return;const m=p.current;p.current=o.current,m!==p.current&&l(p.current)});const h=i.placementState&&St(i.placementState),f=h?.[0],x=h?.[1];return o?null:a.jsx(pt.div,{"data-radix-popper-side":f,"data-radix-popper-align":x,...s,ref:u})},"PopperAnchor")),Ee="PopperContent",[Ar,Tr]=je(Ee),kr=g.forwardRef(Y(function(e,n){const{__scopePopper:r,side:o="bottom",sideOffset:s=0,align:i="center",alignOffset:c=0,arrowPadding:l=0,avoidCollisions:d=!0,collisionBoundary:u=[],collisionPadding:p=0,sticky:h="partial",hideWhenDetached:f=!1,updatePositionStrategy:x="optimized",onPlaced:m,...b}=e,v=Oe(Ee,r),[w,R]=g.useState(null),y=Ct(n,R),[z,C]=g.useState(null),A=Se(z),S=A?.width??0,N=A?.height??0,k=o+(i!=="center"?"-"+i:""),F=typeof p=="number"?p:{top:0,right:0,bottom:0,left:0,...p},I=Array.isArray(u)?u:[u],O=I.length>0,P={padding:F,boundary:I.filter(Ne),altBoundary:O},{refs:H,floatingStyles:j,placement:M,isPositioned:T,middlewareData:D}=sr({strategy:"fixed",placement:k,whileElementsMounted:Y((...jt)=>Un(...jt,{animationFrame:x==="always"}),"whileElementsMounted"),elements:{reference:v.anchor},middleware:[ar({mainAxis:s+N,alignmentAxis:c}),d&&cr({mainAxis:!0,crossAxis:!1,limiter:h==="partial"?lr():void 0,...P}),d&&dr({...P}),fr({...P,apply:Y(({elements:jt,rects:Qt,availableWidth:Ye,availableHeight:Ue})=>{const{width:Ke,height:Qe}=Qt.reference,mt=jt.floating.style;mt.setProperty("--radix-popper-available-width",`${Ye}px`),mt.setProperty("--radix-popper-available-height",`${Ue}px`),mt.setProperty("--radix-popper-anchor-width",`${Ke}px`),mt.setProperty("--radix-popper-anchor-height",`${Qe}px`)},"apply")}),z&&pr({element:z,padding:l}),Dr({arrowWidth:S,arrowHeight:N}),f&&ur({strategy:"referenceHidden",...P,boundary:O?P.boundary:void 0})]}),W=v.setPlacementState;lt(()=>(W(M),()=>{W(void 0)}),[M,W]);const[Yt,Ut]=St(M),Kt=en(m);lt(()=>{T&&Kt?.()},[T,Kt]);const Ge=D.arrow?.x,Be=D.arrow?.y,qe=D.arrow?.centerOffset!==0,[Ve,Xe]=g.useState();return lt(()=>{w&&Xe(window.getComputedStyle(w).zIndex)},[w]),a.jsx("div",{ref:H.setFloating,"data-radix-popper-content-wrapper":"",style:{...j,transform:T?j.transform:"translate(0, -200%)",minWidth:"max-content",zIndex:Ve,"--radix-popper-transform-origin":[D.transformOrigin?.x,D.transformOrigin?.y].join(" "),...D.hide?.referenceHidden&&{visibility:"hidden",pointerEvents:"none"}},dir:e.dir,children:a.jsx(Ar,{scope:r,placedSide:Yt,placedAlign:Ut,onArrowChange:C,arrowX:Ge,arrowY:Be,shouldHideArrow:qe,children:a.jsx(pt.div,{"data-side":Yt,"data-align":Ut,...b,ref:y,style:{...b.style,animation:T?b.style?.animation:"none"}})})})},"PopperContent")),Sr="PopperArrow",Pr={top:"bottom",right:"left",bottom:"top",left:"right"},jr=g.forwardRef(Y(function(e,n){const{__scopePopper:r,...o}=e,s=Tr(Sr,r),i=Pr[s.placedSide];return a.jsx("span",{ref:s.onArrowChange,style:{position:"absolute",left:s.arrowX,top:s.arrowY,[i]:0,transformOrigin:{top:"",right:"0 0",bottom:"center 0",left:"100% 0"}[s.placedSide],transform:{top:"translateY(100%)",right:"translateY(50%) rotate(90deg) translateX(-50%)",bottom:"rotate(180deg)",left:"translateY(50%) rotate(-90deg) translateX(50%)"}[s.placedSide],visibility:s.shouldHideArrow?"hidden":void 0},children:a.jsx(gr,{...o,ref:n,style:{...o.style,display:"block"}})})},"PopperArrow"));function Ne(t){return t!==null}Y(Ne,"isNotNull");var Dr=Y(t=>({name:"transformOrigin",options:t,fn(e){const{placement:n,rects:r,middlewareData:o}=e,i=o.arrow?.centerOffset!==0,c=i?0:t.arrowWidth,l=i?0:t.arrowHeight,[d,u]=St(n),p={start:"0%",center:"50%",end:"100%"}[u],h=(o.arrow?.x??0)+c/2,f=(o.arrow?.y??0)+l/2;let x="",m="";return d==="bottom"?(x=i?p:`${h}px`,m=`${-l}px`):d==="top"?(x=i?p:`${h}px`,m=`${r.floating.height+l}px`):d==="right"?(x=`${-l}px`,m=i?p:`${f}px`):d==="left"&&(x=`${r.floating.width+l}px`,m=i?p:`${f}px`),{data:{x,y:m}}}}),"transformOrigin");function St(t){const[e,n="center"]=t.split("-");return[e,n]}Y(St,"getSideAndAlignFromPlacement");var Or=Cr,Er=zr,Nr=kr,$r=jr,_r=Object.defineProperty,Mr=(t,e)=>_r(t,"name",{value:e,configurable:!0}),Lr=Object.freeze({position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal"}),Hr=g.forwardRef(Mr(function(e,n){return a.jsx(pt.span,{...e,ref:n,style:{...Lr,...e.style}})},"VisuallyHidden")),Wr=Hr,Fr=Object.defineProperty,E=(t,e)=>Fr(t,"name",{value:e,configurable:!0}),[qt,Do]=he("Tooltip",[De]),Pt=De(),Ir="TooltipProvider",Gr=700,Mt="tooltip.open",[Br,Vt]=qt(Ir),qr=E(t=>{const{__scopeTooltip:e,delayDuration:n=Gr,skipDelayDuration:r=300,disableHoverableContent:o=!1,children:s}=t,i=g.useRef(!0),c=g.useRef(!1),l=g.useRef(0);return g.useEffect(()=>{const d=l.current;return()=>window.clearTimeout(d)},[]),a.jsx(Br,{scope:e,isOpenDelayedRef:i,delayDuration:n,onOpen:g.useCallback(()=>{r<=0||(window.clearTimeout(l.current),i.current=!1)},[r]),onClose:g.useCallback(()=>{r<=0||(window.clearTimeout(l.current),l.current=window.setTimeout(()=>i.current=!0,r))},[r]),isPointerInTransitRef:c,onPointerInTransitChange:g.useCallback(d=>{c.current=d},[]),disableHoverableContent:o,children:s})},"TooltipProvider"),Lt="Tooltip",[Vr,ht]=qt(Lt),Xr=E(t=>{const{__scopeTooltip:e,children:n,open:r,defaultOpen:o,onOpenChange:s,disableHoverableContent:i,delayDuration:c}=t,l=Vt(Lt,t.__scopeTooltip),d=Pt(e),[u,p]=g.useState(null),[h,f]=g.useState(void 0),x=nn(),m=g.useRef(0),b=i??l.disableHoverableContent,v=c??l.delayDuration,w=g.useRef(!1),[R,y]=rn({prop:r,defaultProp:o??!1,onChange:E(k=>{k?(l.onOpen(),document.dispatchEvent(new CustomEvent(Mt))):l.onClose(),s?.(k)},"onChange"),caller:Lt}),z=g.useMemo(()=>R?w.current?"delayed-open":"instant-open":"closed",[R]),C=g.useCallback(()=>{window.clearTimeout(m.current),m.current=0,w.current=!1,y(!0)},[y]),A=g.useCallback(()=>{window.clearTimeout(m.current),m.current=0,y(!1)},[y]),S=g.useCallback(()=>{window.clearTimeout(m.current),m.current=window.setTimeout(()=>{w.current=!0,y(!0),m.current=0},v)},[v,y]);g.useEffect(()=>()=>{m.current&&(window.clearTimeout(m.current),m.current=0)},[]);const N=h??x;return a.jsx(Or,{...d,children:a.jsx(Vr,{scope:e,contentId:N,setContentId:f,open:R,stateAttribute:z,trigger:u,onTriggerChange:p,onTriggerEnter:g.useCallback(()=>{l.isOpenDelayedRef.current?S():C()},[l.isOpenDelayedRef,S,C]),onTriggerLeave:g.useCallback(()=>{b?A():(window.clearTimeout(m.current),m.current=0)},[A,b]),onOpen:C,onClose:A,disableHoverableContent:b,children:n})})},"Tooltip"),ce="TooltipTrigger",Yr=g.forwardRef(E(function(e,n){const{__scopeTooltip:r,...o}=e,s=ht(ce,r),i=Vt(ce,r),c=Pt(r),l=g.useRef(null),d=Ct(n,l,s.onTriggerChange),u=g.useRef(!1),p=g.useRef(!1),h=g.useCallback(()=>u.current=!1,[]);return g.useEffect(()=>()=>document.removeEventListener("pointerup",h),[h]),a.jsx(Er,{asChild:!0,...c,children:a.jsx(pt.button,{"aria-describedby":s.open?s.contentId:void 0,"data-state":s.stateAttribute,...o,ref:d,onPointerMove:ot(e.onPointerMove,f=>{f.pointerType!=="touch"&&!p.current&&!i.isPointerInTransitRef.current&&(s.onTriggerEnter(),p.current=!0)}),onPointerLeave:ot(e.onPointerLeave,()=>{s.onTriggerLeave(),p.current=!1}),onPointerDown:ot(e.onPointerDown,()=>{s.open&&s.onClose(),u.current=!0,document.addEventListener("pointerup",h,{once:!0})}),onFocus:ot(e.onFocus,()=>{u.current||s.onOpen()}),onBlur:ot(e.onBlur,s.onClose),onClick:ot(e.onClick,s.onClose)})})},"TooltipTrigger")),$e="TooltipPortal",[Ur,Kr]=qt($e,{forceMount:void 0}),Qr=E(t=>{const{__scopeTooltip:e,forceMount:n,children:r,container:o}=t,s=ht($e,e);return a.jsx(Ur,{scope:e,forceMount:n,children:a.jsx(me,{present:n||s.open,children:a.jsx(on,{asChild:!0,container:o,children:r})})})},"TooltipPortal"),ut="TooltipContent",Jr=g.forwardRef(E(function(e,n){const r=Kr(ut,e.__scopeTooltip),{forceMount:o=r.forceMount,side:s="top",...i}=e,c=ht(ut,e.__scopeTooltip);return a.jsx(me,{present:o||c.open,children:c.disableHoverableContent?a.jsx(_e,{side:s,...i,ref:n}):a.jsx(Zr,{side:s,...i,ref:n})})},"TooltipContent")),Zr=g.forwardRef(E(function(e,n){const r=ht(ut,e.__scopeTooltip),o=Vt(ut,e.__scopeTooltip),s=g.useRef(null),i=Ct(n,s),[c,l]=g.useState(null),{trigger:d,onClose:u}=r,p=s.current,{onPointerInTransitChange:h}=o,f=g.useCallback(()=>{l(null),h(!1)},[h]),x=g.useCallback((m,b)=>{const v=m.currentTarget,w={x:m.clientX,y:m.clientY},R=Me(w,v.getBoundingClientRect()),y=Le(w,R),z=He(b.getBoundingClientRect()),C=Fe([...y,...z]);l(C),h(!0)},[h]);return g.useEffect(()=>()=>f(),[f]),g.useEffect(()=>{if(d&&p){const m=E(v=>x(v,p),"handleTriggerLeave"),b=E(v=>x(v,d),"handleContentLeave");return d.addEventListener("pointerleave",m),p.addEventListener("pointerleave",b),()=>{d.removeEventListener("pointerleave",m),p.removeEventListener("pointerleave",b)}}},[d,p,x,f]),g.useEffect(()=>{if(c){const m=E(b=>{const v=b.target,w={x:b.clientX,y:b.clientY},R=d?.contains(v)||p?.contains(v),y=!We(w,c);R?f():y&&(f(),u())},"handleTrackPointerGrace");return document.addEventListener("pointermove",m),()=>document.removeEventListener("pointermove",m)}},[d,p,c,u,f]),a.jsx(_e,{...e,ref:i})},"TooltipContentHoverable")),to=an("TooltipContent"),_e=g.forwardRef(E(function(e,n){const{__scopeTooltip:r,children:o,"aria-label":s,id:i,onEscapeKeyDown:c,onPointerDownOutside:l,...d}=e,u=ht(ut,r),p=Pt(r),{onClose:h}=u;g.useEffect(()=>(document.addEventListener(Mt,h),()=>document.removeEventListener(Mt,h)),[h]),g.useEffect(()=>{if(u.trigger){const x=E(m=>{m.target instanceof Node&&m.target.contains(u.trigger)&&h()},"handleScroll");return window.addEventListener("scroll",x,{capture:!0}),()=>window.removeEventListener("scroll",x,{capture:!0})}},[u.trigger,h]);const{setContentId:f}=u;return lt(()=>(f(i),()=>{f(void 0)}),[i,f]),a.jsx(sn,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:c,onPointerDownOutside:l,onFocusOutside:x=>x.preventDefault(),onDismiss:h,children:a.jsxs(Nr,{"data-state":u.stateAttribute,role:s?void 0:"tooltip",id:s?void 0:u.contentId,...p,...d,ref:n,style:{...d.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[a.jsx(to,{children:o}),s?a.jsx(Wr,{id:u.contentId,role:"tooltip",children:s}):null]})})},"TooltipContentImpl")),eo=g.forwardRef(E(function(e,n){const{__scopeTooltip:r,...o}=e,s=Pt(r);return a.jsx($r,{...s,...o,ref:n})},"TooltipArrow"));function Me(t,e){const n=Math.abs(e.top-t.y),r=Math.abs(e.bottom-t.y),o=Math.abs(e.right-t.x),s=Math.abs(e.left-t.x);switch(Math.min(n,r,o,s)){case s:return"left";case o:return"right";case n:return"top";case r:return"bottom";default:throw new Error("unreachable")}}E(Me,"getExitSideFromRect");function Le(t,e,n=5){const r=[];switch(e){case"top":r.push({x:t.x-n,y:t.y+n},{x:t.x+n,y:t.y+n});break;case"bottom":r.push({x:t.x-n,y:t.y-n},{x:t.x+n,y:t.y-n});break;case"left":r.push({x:t.x+n,y:t.y-n},{x:t.x+n,y:t.y+n});break;case"right":r.push({x:t.x-n,y:t.y-n},{x:t.x-n,y:t.y+n});break}return r}E(Le,"getPaddedExitPoints");function He(t){const{top:e,right:n,bottom:r,left:o}=t;return[{x:o,y:e},{x:n,y:e},{x:n,y:r},{x:o,y:r}]}E(He,"getPointsFromRect");function We(t,e){const{x:n,y:r}=t;let o=!1;for(let s=0,i=e.length-1;s<e.length;i=s++){const c=e[s],l=e[i],d=c.x,u=c.y,p=l.x,h=l.y;u>r!=h>r&&n<(p-d)*(r-u)/(h-u)+d&&(o=!o)}return o}E(We,"isPointInPolygon");function Fe(t){const e=t.slice();return e.sort((n,r)=>n.x<r.x?-1:n.x>r.x?1:n.y<r.y?-1:n.y>r.y?1:0),Ie(e)}E(Fe,"getHull");function Ie(t){if(t.length<=1)return t.slice();const e=[];for(let r=0;r<t.length;r++){const o=t[r];for(;e.length>=2;){const s=e[e.length-1],i=e[e.length-2];if((s.x-i.x)*(o.y-i.y)>=(s.y-i.y)*(o.x-i.x))e.pop();else break}e.push(o)}e.pop();const n=[];for(let r=t.length-1;r>=0;r--){const o=t[r];for(;n.length>=2;){const s=n[n.length-1],i=n[n.length-2];if((s.x-i.x)*(o.y-i.y)>=(s.y-i.y)*(o.x-i.x))n.pop();else break}n.push(o)}return n.pop(),e.length===1&&n.length===1&&e[0].x===n[0].x&&e[0].y===n[0].y?e:e.concat(n)}E(Ie,"getHullPresorted");var no=qr,ro=Xr,oo=Yr,so=Qr,io=Jr,ao=eo;function co({delayDuration:t=0,...e}){return a.jsx(no,{"code-path":"src\\components\\ui\\tooltip.tsx:13:5","data-slot":"tooltip-provider",delayDuration:t,...e})}function lo({...t}){return a.jsx(co,{"code-path":"src\\components\\ui\\tooltip.tsx:25:5",children:a.jsx(ro,{"code-path":"src\\components\\ui\\tooltip.tsx:26:7","data-slot":"tooltip",...t})})}function fo({...t}){return a.jsx(oo,{"code-path":"src\\components\\ui\\tooltip.tsx:34:10","data-slot":"tooltip-trigger",...t})}function uo({className:t,sideOffset:e=0,children:n,...r}){return a.jsx(so,{"code-path":"src\\components\\ui\\tooltip.tsx:44:5",children:a.jsxs(io,{"code-path":"src\\components\\ui\\tooltip.tsx:45:7","data-slot":"tooltip-content",sideOffset:e,className:xe("bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",t),...r,children:[n,a.jsx(ao,{"code-path":"src\\components\\ui\\tooltip.tsx:55:9",className:"bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"})]})})}const po=`{\r
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
  }\r
}`,ho=JSON.parse(po);function mo({term:t,children:e,className:n}){const r=ho[t];if(!r)return n?a.jsx("span",{"code-path":"src\\components\\GlossaryTooltip.tsx:47:7",className:n,children:e??t}):a.jsx(a.Fragment,{children:e??t});const o=r.books.map(s=>cn.find(i=>i.id===s)).filter(s=>s!==void 0);return a.jsxs(lo,{"code-path":"src\\components\\GlossaryTooltip.tsx:58:5",children:[a.jsx(fo,{"code-path":"src\\components\\GlossaryTooltip.tsx:59:7",className:xe("cursor-help touch-manipulation bg-transparent p-0 text-left [color:inherit] [font:inherit] [letter-spacing:inherit] [line-height:inherit]","underline decoration-dotted decoration-golddim/60 underline-offset-4 transition-[text-decoration-color]","hover:decoration-golddim focus-visible:decoration-golddim focus-visible:outline-none",n),children:e??t}),a.jsxs(uo,{"code-path":"src\\components\\GlossaryTooltip.tsx:70:7",side:"top",sideOffset:6,className:"w-[280px] rounded-xl border border-gold/25 bg-deep2 px-5 py-4 shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\GlossaryTooltip.tsx:75:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-goldbright",children:t}),a.jsx("p",{"code-path":"src\\components\\GlossaryTooltip.tsx:78:9",className:"mt-2 text-[12.5px] leading-[1.9] text-silktext",children:r.def}),o.length>0&&a.jsxs("div",{"code-path":"src\\components\\GlossaryTooltip.tsx:80:11",className:"mt-3 border-t border-gold/15 pt-2.5",children:[a.jsx("p",{"code-path":"src\\components\\GlossaryTooltip.tsx:81:13",className:"text-[11px] tracking-[0.14em] text-silkmuted",children:"相关典籍 · 藏经阁"}),a.jsx("ul",{"code-path":"src\\components\\GlossaryTooltip.tsx:82:13",className:"mt-1.5 flex flex-wrap gap-x-3 gap-y-1",children:o.map(s=>a.jsx("li",{"code-path":"src\\components\\GlossaryTooltip.tsx:84:17",children:a.jsxs(Ze,{"code-path":"src\\components\\GlossaryTooltip.tsx:85:19",to:"/wiki",className:"text-[12px] text-goldbright/90 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-goldbright",children:["《",s.title,"》"]})},s.id))})]})]})]})}const et={delingMin:20,supportMin:10,reverseSupportMin:24,strongTotal:42},st="邵伟华审订体系",le="https://www.sizhuyucexue.com/thread-65-1-1.html",de="https://www.sizhuyucexue.com/thread-73-1-1.html",xo="https://www.sizhuyucexue.com/thread-74-1-1.html",go="https://www.sizhuyucexue.com/thread-1336-1-1.html",bo=[{id:"SWH-01",master:st,source:le,evaluate(t){const e=t.wuxing.strength;return e.deling>=et.delingMin&&e.dedi+e.deshi>=et.supportMin?{title:"日主偏强倾向（月令优先审查）",text:`日主五行属${t.dayMasterWuxing}，月令得令（${e.deling}/40），兼有得地得势支持（${e.dedi+e.deshi}/60）。传统旺衰审查先看月令，此盘呈现偏强倾向；仍请继续核对克泄耗、合化与支持力量，此非最终强弱结论。`}:null}},{id:"SWH-02",master:st,source:le,evaluate(t){const e=t.wuxing.strength;return e.deling<et.delingMin&&e.dedi+e.deshi>=et.reverseSupportMin?{title:"失令但有反转可能",text:`日主失令（月令 ${e.deling}/40），但得地得势合计 ${e.dedi+e.deshi}/60 已构成多处有力生助。传统上「失令不即定弱」：若生助力量可抵月令之失，存在由弱转中和的可能，建议降低强弱结论置信度并做全局复核。`}:null}},{id:"SWH-03",master:st,source:xo,evaluate(t){const e=t.dayMasterWuxing,n={木:"金",火:"水",土:"木",金:"火",水:"土"},r={木:"水",火:"木",土:"火",金:"土",水:"金"},o=n[e],s=r[e],i=t.wuxing.count;return!(t.wuxing.strength.total>=et.strongTotal)&&i[o]>=2.5&&i[o]>=i[e]*1.2?{title:"身弱官杀偏多：印星优先",text:`日主属${e}而${o}（官杀）偏多（计 ${i[o]}），传统取用优先考察${s}（印星）能否泄官杀生身；印不可用时再察比劫帮身，且两者都须检查受制与副作用。`}:null}},{id:"SWH-04",master:st,source:de,evaluate(t){const e=t.dayMasterWuxing,n={木:"水",火:"木",土:"火",金:"土",水:"金"},r={木:"土",火:"金",土:"水",金:"木",水:"火"},o=n[e],s=r[e],i=t.wuxing.count;return t.wuxing.strength.total>=et.strongTotal?null:i[s]>=2.5&&i[s]>=i[o]*1.5?{title:"身弱财多：比劫优先",text:`日主属${e}而${s}（财星）偏多（计 ${i[s]}），身弱财多传统上反为累。平衡方向：先考察比劫（${e}）分财帮身，再考察印星（${o}）。`}:null}},{id:"SWH-05",master:st,source:de,evaluate(t){const e=t.dayMasterWuxing,n={木:"水",火:"木",土:"火",金:"土",水:"金"},r={木:"土",火:"金",土:"水",金:"木",水:"火"},o=n[e],s=r[e],i=t.wuxing.count;return t.wuxing.strength.total>=et.strongTotal&&i[o]>=2.5&&i[o]>=i[s]*1.5?{title:"身强印多：财星制印",text:`日主属${e}而${o}（印星）偏多（计 ${i[o]}），身强印多宜抑耗。传统方向：优先考察${s}（财星）制印耗身，并复核官杀、食伤是否加重冲突。`}:null}},{id:"SWH-07",master:st,source:go,evaluate(t){return t.shensha.length===0?null:{title:"神煞降权参详",text:`本盘命中神煞：${t.shensha.slice(0,3).map(n=>n.name).join("、")}（共 ${t.shensha.length} 项）。传统运用以「原局优先、神煞佐证」为原则：神煞只作性格与行动主题的辅助参考，不与旺衰喜忌同向时权重降低，不据此作出具体事件判断。`}}}],Nt="梁湘润体系",fe="https://books.google.com/books?id=Dc4rQwAACAAJ",vo="https://www.chinyuan.com.tw/all_book/more?id=9322",ue={寅:{season:"春",wuxing:"木",name:"木旺"},卯:{season:"春",wuxing:"木",name:"木旺"},辰:{season:"春",wuxing:"木",name:"木旺"},巳:{season:"夏",wuxing:"水",name:"夏火旺需润"},午:{season:"夏",wuxing:"水",name:"夏火旺需润"},未:{season:"夏",wuxing:"水",name:"夏火旺需润"},申:{season:"秋",wuxing:"金",name:"金旺"},酉:{season:"秋",wuxing:"金",name:"金旺"},戌:{season:"秋",wuxing:"金",name:"金旺"},亥:{season:"冬",wuxing:"火",name:"冬水寒需暖"},子:{season:"冬",wuxing:"火",name:"冬水寒需暖"},丑:{season:"冬",wuxing:"火",name:"冬水寒需暖"}},wo={木:"水",火:"木",土:"火",金:"土",水:"金"},pe={木:"土",火:"金",土:"水",金:"木",水:"火"},yo=[{id:"LXR-01",master:Nt,source:fe,evaluate(t){const e=t.pillars.month?.branch;if(!e)return null;const n=ue[e];if(!n||n.season!=="夏"&&n.season!=="冬")return null;const r=t.yongshen.yongshen;return r===n.wuxing||wo[n.wuxing]===r?{title:"三轨同向：调候与扶抑一致",text:`月支${e}属${n.season}（${n.name}），传统调候取${n.wuxing}；扶抑法用神为${r}，两轨方向一致。传统上同向证据可提高该平衡方向的参详权重——仍属文化参详，不代表现实事件必然发生。`}:null}},{id:"LXR-02",master:Nt,source:vo,evaluate(t){const e=t.pillars.month?.branch;if(!e)return null;const n=ue[e];if(!n||n.season!=="夏"&&n.season!=="冬")return null;const r=t.yongshen.yongshen;return r===pe[n.wuxing]||n.wuxing===pe[r]?{title:"三轨冲突：调候与扶抑相悖",text:`月支${e}属${n.season}，传统调候方向取${n.wuxing}，而扶抑法用神为${r}，两轨方向相反。传统上遇此情形应保留多个候选并降低唯一用神的置信度，不宜合并为单一定论。`}:null}},{id:"LXR-04",master:Nt,source:fe,evaluate(t){const e=t.wuxing.strength.grade;return e==="偏强"||e==="偏弱"?{title:"旺衰层限定说明",text:`本盘旺衰量化等级「${e}」（总分 ${t.wuxing.strength.total}/100）。此结论只用于扶抑层面的参考，不能覆盖调候或格局层面的判断——不同观察维度结论不同时，以并列呈现为准。`}:null}}];function Co(t,e=6){const n=[];for(const r of[...bo,...yo]){const o=r.evaluate(t);o&&n.push({ruleId:r.id,master:r.master,source:r.source,...o})}return n.slice(0,e)}function Oo({chart:t}){const e=g.useMemo(()=>Co(t),[t]);return e.length===0?null:a.jsxs("section",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:15:5",className:"mt-8 rounded-xl border border-golddim/25 bg-silk2 p-6",children:[a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:16:7",className:"flex items-center justify-between",children:[a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:17:9",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:18:11",className:"font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim",children:"Master Perspectives"}),a.jsx("h3",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:21:11",className:"mt-1 font-serif text-[20px] font-bold tracking-[0.08em] text-inktext",children:"名家视角 · 参详提示"})]}),a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:25:9",className:"rounded-full border border-golddim/40 px-4 py-1.5 text-[11px] tracking-[0.1em] text-inkmuted",children:"传统方法论蒸馏 · 文化参考 · 不构成决策建议"})]}),a.jsx("ul",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:29:7",className:"mt-5 space-y-3",children:e.map(n=>a.jsxs("li",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:31:11",className:"rounded-lg border border-golddim/15 bg-white/40 p-4",children:[a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:32:13",className:"flex flex-wrap items-center gap-2",children:[a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:33:15",className:"font-serif text-[15px] font-bold text-inktext",children:n.title}),a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:34:15",className:"rounded bg-deep px-2 py-0.5 font-mono text-[10.5px] tracking-[0.08em] text-goldbright",children:n.ruleId}),a.jsx("span",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:37:15",className:"text-[11.5px] text-golddim",children:n.master})]}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\MasterHintsSection.tsx:39:13",className:"mt-2 text-[13.5px] leading-[1.9] text-inkmuted",children:n.text})]},n.ruleId))})]})}const $="whitespace-nowrap border-b border-golddim/25 px-3 py-2.5 text-left font-sans text-[12px] font-medium tracking-[0.1em] text-golddim",_="border-b border-golddim/10 px-3 py-2.5 align-top text-[13px] leading-[1.8] text-inktext";function Xt({children:t,caption:e}){return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:18:5",className:"overflow-hidden rounded-xl border border-golddim/25 bg-silk2 shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:19:7",className:"border-b border-golddim/15 px-4 py-2 text-[11px] tracking-[0.08em] text-inkmuted sm:hidden",children:"左右滑动查看完整表格 →"}),a.jsx("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:22:7",className:"overflow-x-auto overscroll-x-contain",style:{WebkitOverflowScrolling:"touch"},children:a.jsxs("table",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:23:9",className:"w-full min-w-[720px] border-collapse",children:[a.jsx("caption",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:24:11",className:"px-4 pb-0 pt-4 text-left font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:e}),t]})})]})}const Ro={比肩:"同我（比和）",劫财:"同我（比和）",食神:"我生（泄秀）",伤官:"我生（泄秀）",偏财:"我克（财星）",正财:"我克（财星）",七杀:"克我（官杀）",正官:"克我（官杀）",偏印:"生我（印星）",正印:"生我（印星）"},zo=new Set(["比肩","食神","偏财","七杀","偏印"]);function Eo({chart:t}){const e=new Map;for(const n of t.tenGods){if(n.tenGod==="日主")continue;const r=e.get(n.tenGod)??[];r.push({pillar:n.pillar,char:n.char,layer:n.layer==="stem"?"天干":"藏干"}),e.set(n.tenGod,r)}return a.jsxs(Xt,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:54:5",caption:"十神明细（天干透干 + 地支藏干全量）",children:[a.jsx("thead",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:55:7",children:a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:56:9",children:[a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:57:11",className:$,children:"十神"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:58:11",className:$,children:"来源（落柱 · 干支 · 层）"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:59:11",className:$,children:"与日主关系"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:60:11",className:$,children:"阴阳"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:61:11",className:$,children:"传统含义"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:62:11",className:$,children:"规则出处"})]})}),a.jsx("tbody",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:65:7",children:[...e.entries()].map(([n,r])=>{const o=tn[n];return a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:69:13",children:[a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:70:15",className:`${_} font-serif text-[15px] font-bold text-golddim`,children:a.jsx(mo,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:71:17",term:n,children:n})}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:73:15",className:_,children:r.map((s,i)=>a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:75:19",className:"mr-2 inline-block whitespace-nowrap",children:[s.pillar,"·",s.char,a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:77:21",className:"ml-1 text-[11px] text-inkmuted",children:["（",s.layer,"）"]})]},i))}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:81:15",className:_,children:Ro[n]??"—"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:82:15",className:_,children:zo.has(n)?"与日主同阴阳":"与日主异阴阳"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:83:15",className:_,children:o?.meaning??"—"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:84:15",className:`${_} whitespace-nowrap text-[12px] text-inkmuted`,children:o?.source??"—"})]},n)})})]})}function No({chart:t}){return t.relations.length===0?a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:100:7",className:"rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:101:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"合冲刑害破"}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:102:9",className:"mt-3 text-[13px] text-inkmuted",children:"本命盘柱间未检出合、冲、刑、害、破关系。"})]}):a.jsxs(Xt,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:107:5",caption:"合冲刑害破（柱间关系）",children:[a.jsx("thead",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:108:7",children:a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:109:9",children:[a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:110:11",className:$,children:"类型"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:111:11",className:$,children:"柱位"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:112:11",className:$,children:"干支"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:113:11",className:$,children:"合化"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:114:11",className:$,children:"规则出处"})]})}),a.jsx("tbody",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:117:7",children:t.relations.map((e,n)=>a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:119:11",children:[a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:120:13",className:`${_} font-serif font-bold text-golddim`,children:e.type}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:121:13",className:_,children:e.pillars.join(" · ")}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:122:13",className:_,children:e.chars}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:123:13",className:_,children:e.resultWuxing?`化${e.resultWuxing}`:"—"}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:124:13",className:`${_} text-[12px] text-inkmuted`,children:e.source})]},`${e.type}-${e.chars}-${n}`))})]})}function $o({chart:t}){if(t.shensha.length===0)return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:137:7",className:"rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:138:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"神煞"}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:139:9",className:"mt-3 text-[13px] text-inkmuted",children:"本盘未命中注册表内神煞。"})]});const e=[],n=new Map;for(const r of t.shensha){const o=n.get(r.name);o===void 0?(n.set(r.name,e.length),e.push({name:r.name,hits:[r]})):e[o].hits.push(r)}return a.jsxs(Xt,{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:159:5",caption:"神煞（逐柱命中，同一神煞多柱命中分行列出）",children:[a.jsx("thead",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:160:7",children:a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:161:9",children:[a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:162:11",className:$,children:"名称"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:163:11",className:$,children:"命中柱位"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:164:11",className:$,children:"命中状态"}),a.jsx("th",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:165:11",className:$,children:"现代化说明"})]})}),a.jsx("tbody",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:168:7",children:e.flatMap(r=>r.hits.map((o,s)=>a.jsxs("tr",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:171:13",children:[a.jsxs("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:172:15",className:`${_} font-serif font-bold text-golddim`,children:[o.name,r.hits.length>1&&a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:175:19",className:"ml-1.5 rounded-full border border-golddim/30 px-1.5 py-0.5 align-middle font-sans text-[10px] font-normal text-inkmuted",children:[r.hits.length," 柱命中"]})]}),a.jsxs("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:180:15",className:`${_} whitespace-nowrap`,children:[o.pillar,a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:182:17",className:"ml-1 text-inkmuted",children:["（",o.char,"）"]})]}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:184:15",className:`${_} whitespace-nowrap`,children:a.jsxs("span",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:185:17",className:"inline-block rounded-full border border-golddim/40 bg-golddim/10 px-2.5 py-0.5 text-[11.5px] tracking-[0.08em] text-golddim",children:["命中 · ",o.name,"·",o.pillar]})}),a.jsx("td",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:189:15",className:_,children:o.modernExplanation})]},`${r.name}-${o.pillar}-${o.char}-${s}`)))})]})}function _o({chart:t}){const e=t.chenggu;if(!e)return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:204:7",className:"rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:205:9",className:"font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"称骨"}),a.jsxs("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:206:9",className:"mt-3 text-[13px] text-inkmuted",children:["暂不可用",t.input.hour===null?"（时辰不详，称骨需时柱）":""]})]});const n=o=>`${(o/10).toFixed(1)} 两`,r=[{label:`年（${e.yearGanzhi}）`,q:e.yearQian},{label:`月（农历${e.lunarMonth}月）`,q:e.monthQian},{label:`日（${e.lunarDay}日）`,q:e.dayQian},{label:`时（${e.hourBranch}时）`,q:e.hourQian}];return a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:220:5",className:"rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:221:7",className:"text-center font-serif text-[15px] font-bold tracking-[0.12em] text-inktext",children:"称骨（袁天罡称骨歌）"}),a.jsx("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:224:7",className:"mt-5 grid grid-cols-2 gap-3 md:grid-cols-4",children:r.map(o=>a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:226:11",className:"rounded-lg border border-golddim/20 bg-silk px-3 py-3 text-center",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:227:13",className:"text-[11.5px] tracking-[0.08em] text-inkmuted",children:o.label}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:228:13",className:"mt-1 font-serif text-[16px] font-bold text-inktext",children:n(o.q)})]},o.label))}),a.jsxs("div",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:232:7",className:"mt-5 text-center",children:[a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:233:9",className:"text-[11.5px] tracking-[0.16em] text-inkmuted",children:"总骨重"}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:234:9",className:"mt-1 font-serif text-[34px] font-black leading-none text-golddim",children:e.totalText})]}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:238:7",className:"mt-4 whitespace-pre-line border-t border-golddim/15 pt-4 text-center font-serif text-[14.5px] leading-[2] text-inktext",children:e.verse}),a.jsx("p",{"code-path":"src\\components\\bazi-v2\\ChartDetails.tsx:241:7",className:"mt-3 text-center text-[11.5px] text-inkmuted",children:e.source})]})}export{_o as C,mo as G,Oo as M,No as R,$o as S,Eo as T,ho as a,Co as b};
