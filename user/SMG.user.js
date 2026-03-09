// ==UserScript==
// @name        SMG bestv.cn
// @namespace   Violentmonkey Scripts
// @match       https://weixinpay.bestv.cn/*
// @grant       GM_addStyle
// @version     0.1
// @author      -
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// @description 2026/3/8 20:48:18, https://weixinpay.bestv.cn/pay/smg_gongzhonghao_h5/index.html#/home
// ==/UserScript==

(function(){
    GM_addStyle('#app .no-player {display:none;} #app .channel_name{font-size: 14px; margin: 0; line-height: 1;} #app .channel_item{min-width:40px;} \
        #app .channel-icon, #app .channel-icon img{width: 40px; height: 40px;} #app .channel_wrap {padding: 0;min-height: 100px;}');
    const observer = new MutationObserver((mutationsList, observer) => {
        for (let m of mutationsList) {
            if (m.target.nodeName =='VIDEO' && !m.target.init) {
                let vSrc = m.target.src;
                console.log("videoSrc:", vSrc);
                m.target.muted = false;
                if (m.target.hasAttribute('muted')) {
                    m.target.removeAttribute('muted');
                }
                m.target.addEventListener('click', e=>{e.preventDefault();e.stopPropagation();}, true);
                m.target.init = true;
                //observer.disconnect();
                break;
            }
        }
    }).observe($('#app'), { childList: true, subtree: true, attributeOldValue: true });
})()
