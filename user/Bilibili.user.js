// ==UserScript==
// @name        Bilibili
// @author      Jerrymouse
// @namespace   nana_vao_bilibili
// @description B站的h5播放相关，原生右键菜单、显示时间线
// @version     0.2.5
// @include     /https?:\/\/([^\.]+\.)?bilibili\.com/
// @grant       unsafeWindow
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @grant       GM_openInTab
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// @run-at      document-body
// ==/UserScript==

//downloadUrl: https://raw.githubusercontent.com/xinggsf/gm/master/bilibili-h5.user.js
// ！！！BUG：关闭整个浏览器的时候XHR删除关键字失败！！！ Please close tab first to invoid this problem
// chrome below 55 not supported async function

// api collection
// https://api.bilibili.com/x/web-interface/view?bvid=${bvid}
// http://api.bilibili.com/archive_stat/stat?type=jsonp&aid=${aid}

(function(){
    const loc = location.href;
    const biliHeaders = {Referer: 'https://www.bilibili.com/', Cookie: document.cookie, Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://www.bilibili.com', Pragma: 'no-cache', 'Cache-Control': 'no-cache'};
    const isChrome = navigator.userAgent.includes('Chrome');
    const volumeStep = 0.05;
    var showLikePer = false;
    var hideVd, hideAu;

    GM_addStyle('.adblock-tips{display:none !important;}');
    if (!loc.match(/^https:\/\/live\.bilibili\.com\//)) {
        GM_addStyle('html.gray {-webkit-filter: grayscale(0) !important;filter: grayscale(0) !important;} ');
        GM_addStyle('.video-page-special-card-small,.video-page-game-card-small,.guo-chuang-area,.manga-card-list {display:none !important;} ');
        GM_addStyle('.feed-floor .channel-floor {background: #ffc0cb70;} ');
        GM_addStyle("#vpeInfoPanel {text-align: center;opacity: 0;cursor: default;} #vpeCenterInfo{position: absolute;left: 50%;top: 50%;transform:translate(-50%, -50%);width: auto;height: 32px;font-weight: 1000;font-size: 24px;-webkit-text-fill-color: #fff;-webkit-text-stroke: 1px #000;font-weight: 1000;z-index: 9999; background: rgba(0, 0, 0, 0.6) none repeat scroll 0% 0%; line-height: 32px; padding: 5px; border-radius: 4px;}");
    }

    if (loc.match(/^https:\/\/www\.bilibili\.com\/(\?.*)?/)) {
        //document.addEventListener('mouseover', e=>{ console.log(e.target, e.target.nodeName)  });
        GM_addStyle('.bili-live-card, .floor-single-card, .video-page-special-card {display:none !important;}'); //hide live in index page
        GM_addStyle('.hidevideo{float:right;bottom:0;position:sticky;cursor:pointer;display:none;margin-right:-17px;} .hideauthor{position:absolute;right:0;cursor:pointer;display:none;} \
            .bili-video-card__info--tit:hover .hidevideo, .bili-video-card__info--bottom:hover .hideauthor {display: block;} \
            .recommended-swipe {grid-column:1/2;grid-row:1/2;} ');
        GM_addStyle('#app .video-sections-content-list {max-height:400px;height:auto !important;}');
        GM_addStyle('.recommended-container_floor-aside .container .feed-card,.recommended-container_floor-aside .container .bili-video-card \
            {margin-top: 0 !important;} \
            .container>.feed-card:not(:has([href^="https://www.bilibili.com"])), .container>.bili-video-card:not(:has([href^="https://www.bilibili.com"])){display:none;}');

        if (window.screen.height * window.devicePixelRatio < 1080) {
            GM_addStyle('.bili-header .slide-down .center-search-container{margin-bottom:2px;} .header-channel{top:40px;} .bili-header .bili-header__bar{height:40px;} .bili-header{min-height:40px;} \
                    .header-channel-fixed{max-height:32px;padding: 2px var(--layout-padding, 60px);} .bili-header .red-num--message, .bili-header .red-num--dynamic {top:-2px;}');
        }
        hideVd = GM_getValue('hideVideo') || {};
        var isModHideVd = false;
        var hvds = [];
        Object.keys(hideVd).forEach(k=>{
            if (Date.now() - hideVd[k] > 2592e6) { // remove hide video if more than 1 month
                delete hideVd[k];
                isModHideVd = true;
            } else {
                hvds.push(`[href*="${k}"]`);
            }
        });
        if (hvds.length > 0) {
            //GM_addStyle(`.feed-card:has(${hvds.join(",")}), .bili-video-card:has(${hvds.join(",")}){display:none;}`);
        }
        if (isModHideVd) {
            GM_setValue('hideVideo', hideVd);
        }

        hideAu = GM_getValue('hideAuthor') || [];
        var haus = [];
        hideAu.forEach(a=>haus.push(`[href*="${a}"]`))
        if (haus.length > 0) {
            //GM_addStyle(`.feed-card:has(${haus.join(",")}), .bili-video-card:has(${haus.join(",")}){display:none;}`);
        }
    }

    if (loc.match("https://t.bilibili.com/")) {
        GM_addStyle('#bili-header-container > .bili-header{position:fixed;width:100%;z-index:9999;} #bili-header-container{height:60px;} #app aside section.sticky{top:55px;}');
    }

    var ml = '', vid = '', plOrder = 'sequential', initPlOrder = false;
    setMedialistPlay();

    var infoDiv = $('#vpeInfoPanel') || $C("div", {id: 'vpeInfoPanel'});
    var centerSpan = $('#vpeCenterInfo') || $C("span", {id:'vpeCenterInfo'});
    infoDiv.appendChild(centerSpan);
    var clearInfoTimer = 0;
    var toggleInfoPanel = (info) => {
        if (infoDiv.isFrozen) return;
        if (info) centerSpan.textContent = info;
        infoDiv.style.opacity = '1';
        infoDiv.style.display = 'block';
        infoDiv.style.transition = 'all 0.3s ease';
        if (clearInfoTimer) {
            clearTimeout(clearInfoTimer);
        }
        clearInfoTimer = setTimeout(()=>{
            // centerSpan.classList.remove('vpeIcon');
            infoDiv.style.opacity = '0';
            infoDiv.style.display = 'none';
            centerSpan.textContent = '';
            infoDiv.style.transition = 'all 0.5s ease 1s';
        }, 1e3);
    };

    var videoQualitySet = false;
    var giftNumSpan = document.createElement('span');
    var csrf = getCookie('bili_jct');
    var userid = getCookie('DedeUserID');
    var setPlayer = v => {
        var pl = $('#bilibiliPlayer,#bilibili-player,#live-player,div.bilibili-live-player-video-area,div.bilibili-live-player-video-danmaku');
        doClick($('i.bilibili-player-iconfont-repeat.icon-24repeaton')); //关循环播放

        //单击下一视频按钮后，B站的弹幕按钮有问题 div.bilibili-player-video-btn-danmaku:not(video-state-danmaku-off)
        var dc = 0;
        var c = 0;
        var playbtnClicked = false;
        var i = setInterval(function() {
            var qt = $('li.bui-select-item[data-value="80"],li.bui-select-item[data-value="64"]');
            var cp = $('input.bilibili-player-video-danmaku-input[style="display: inline;"]') || unsafeWindow.__INITIAL_STATE__ && unsafeWindow.__INITIAL_STATE__.loginInfo && unsafeWindow.__INITIAL_STATE__.loginInfo.isLogin; // check point if login
            var playbtn = $('div.bilibili-player-video-btn.bilibili-player-video-btn-start.video-state-pause'); // get play button to play auto
            if (qt && cp && !videoQualitySet) { // set high quality
                doClick(qt);
                videoQualitySet = true;
                clearInterval(i);
            } else if (c++ > 20) {
                clearInterval(i);
            }
        }, 250);

        var changeVolume = (step) => {
            if (v.volume + step >= 1) {
                v.volume = 1;
            } else if (v.volume + step <= 0) {
                v.volume = 0;
            } else {
                v.volume += step;
            }
            if (v.volume > 0.66) {
                icon = '🔊 ';
            } else if (video.volume > 0.33) {
                icon = '🔉 ';
            } else if (video.volume > 0) {
                icon = '🔈 ';
            } else {
                icon = '🔇 ';
            }
            toggleInfoPanel(icon + (v.volume * 100).toFixed(0));
        };
        pl.onmousedown = function (e) { //middle click toggle fullpage
            var selector = '.bpx-player-ctrl-web,div.bilibili-player-video-web-fullscreen,.squirtle-video-pagefullscreen,.bilibili-live-player-video-controller-web-fullscreen-btn button';
            var p = $(selector);
            if (e.which ==2) {
                e.preventDefault();
                e.stopPropagation();
                if (p) {p.click();}
                else {waitForElements({selector:selector, callback: n=>n.click(), maxIntervals:100});}
            }
        };
        /*if (isChrome) {
            pl.onwheel = e => {
                var d = (Math.abs(e.deltaY) > Math.abs(e.deltaX))? e.deltaY : e.deltaX;
                var step = (d>0)? -volumeStep : volumeStep;
                e.preventDefault();
                e.stopPropagation();
                changeVolume(step);
            };
        }*/
        v.oncanplay = function() {
            waitForElements({selector: '.bpx-player-shadow-progress-area', callback: showTimeLineInFullMode});
            var t = $('div[name="time_textarea"]');
            if (t && t.innerHTML == "00:00" && localStorage.danmuStatus == 'off') {
                doClick($('div[name=ctlbar_danmuku_on]'));
            }
            var pbr = sessionStorage.playbackrate;
            if (pbr) {
                var j = JSON.parse(sessionStorage.bilibili_player_settings);
                j.video_status.videospeed = Number(Number(pbr).toFixed(2));
                sessionStorage.bilibili_player_settings = JSON.stringify(j);
                v.playbackRate = j.video_status.videospeed;
                var vsn = $('.bilibili-player-video-btn-speed-name');
                if (vsn) vsn.textContent = (v.playbackRate == 1)? '倍速' : v.playbackRate.toFixed(2).replace(/0$/, '') + 'x';
                // setPlaybackRateText(v.playbackRate);
            }
            if (location.href.includes('/medialist/play/')) {
                var mp = JSON.parse(localStorage.medialistplay || '{}');
                var mlVid = location.href.match(/\/medialist\/play\/([^\?]+)/)[1].split('/');
                ml = mlVid[0];
                vid = mlVid[1];
                if (!mp[ml]) {
                    mp[ml] = {};
                    mp[ml].o = plOrder;
                }
                mp[ml].v = vid;
                localStorage.medialistplay = JSON.stringify(mp);
            }
            var topTt = $('.bilibili-player-video-top, .bpx-player-top-wrap');
            if (topTt) {
                topTt.style.visibility = 'visible';
                topTt.style.opacity = '1';
                setTimeout(()=>{
                    topTt.style = '';
                }, 5e3);
            }

        };
        v.onended = function() {
            var bs = localStorage.bpx_player_profile;
            var ap = bs && JSON.parse(localStorage.bpx_player_profile).media.autoplay;
            var ml = $('#multi_page, .base-video-sections, .video-section-list') || location.href.includes('/medialist/play/') || location.href.includes('/bangumi/play/');
            var act = $('.player-auxiliary-playlist-item-active, .video-episode-card__info-playing');
            if (ml && act && (act == ($('.player-auxiliary-playlist-list')&&$('.player-auxiliary-playlist-list').lastElementChild) || act.parentNode == $('.video-section-list').lastElementChild) && !act.classList.contains('player-auxiliary-playlist-item-showp') && $('.player-auxiliary-btn-playlist-order[data-order="sequential"]')) {
                return;
            }
            var next = $('.bilibili-player-video-btn-next, .bpx-player-ctrl-next');
            if (ml && next && GM_getValue('playlistAutoPlay')) {
                var count = 3, i;
                $('#vpeInfoPanel').style.opacity = '1';
                $('#vpeCenterInfo').style.top = '20px';
                if (!$('#vpeCenterText')) {
                    $('#vpeCenterInfo').appendChild($C('div', {id:'vpeCenterText'}));
                    $('#vpeCenterText').textContent = count + 's后自动播放下一个';
                }
                if (!$('#stopAutoPlay')) {
                    $('#vpeCenterInfo').appendChild($C('div', {id:'stopAutoPlay'}));
                    $('#stopAutoPlay').textContent = '取消';
                    $('#stopAutoPlay').style.cursor = 'pointer';
                    $('#stopAutoPlay').onclick = evt=> {
                        evt.preventDefault();
                        evt.stopPropagation();
                        clearInterval(i);
                        $('#vpeInfoPanel').style.opacity = '0';
                        $('#vpeCenterInfo').style.top = '';
                        $('#vpeCenterText').remove();
                        $('#stopAutoPlay').remove();
                    }
                }
                i = setInterval(()=>{
                    if (count-- <=0) {
                        next.click();
                        clearInterval(i);
                        $('#vpeInfoPanel').style.opacity = '0';
                        $('#vpeCenterInfo').style.top = '';
                        $('#vpeCenterText').remove();
                        $('#stopAutoPlay').remove();
                    }
                    if (count > 0)$('#vpeCenterText').textContent = count + 's后自动播放下一个';
                }, 1e3);
                //next.click();
            }
        };
        pl.addEventListener('dblclick', e=>{ //使用pl.ondblclick = function(e)会和网站自带的冲突
            var p = $('div.bilibili-player-video-btn-fullscreen,.bilibili-live-player-video-controller-fullscreen-btn button');
            if (p) {
                e.preventDefault();
                e.stopPropagation();
                p.click();
                var as = $("#aside-area-toggle-btn");
                if (as) as.click();
                // setPlaybackRateText(Number(v.playbackRate.toFixed(2)));
            }
        }, true);
        document.onkeydown = document.onkeypress = e => {
            if (isTextNode(e.target)) {
                return;
            }
            var k = e.key.toLowerCase();
            if (k == 'w') {
                e.preventDefault();
                e.stopPropagation();
            } else if (e.code == 'ControlRight' && v.playbackRate != 2) {
                sessionStorage.videoBeforeTurboSpeed = v.playbackRate;
                v.playbackRate= 2;
                toggleInfoPanel('⏩ 2x');
            } else if (e.code == 'ShiftRight' && v.playbackRate != 4) {
                sessionStorage.videoBeforeTurboSpeed = v.playbackRate;
                v.playbackRate = 4;
                toggleInfoPanel('⏩ 4x');
            } else if (e.code == 'Period' && v.playbackRate != 8) {
                sessionStorage.videoBeforeTurboSpeed = v.playbackRate;
                v.playbackRate = 8;
                toggleInfoPanel('⏩ 8x');
            }
        };

        document.onkeyup = e => {
            var nn = e.target.nodeName;
            if (nn.match(/input|textarea/i) || e.altKey || e.ctrlKey || e.shiftKey) {
                return;
            }
            var k = e.key.toLowerCase();
            var spc = ['+', '=', '-', 'r', '*', '\\'];
            if (k == 'd') {             // system is included

            } else if (k == 't') {
                var tmBtn = $('#timeline input');
                if (tmBtn) {
                    tmBtn.click();
                    var msg = tmBtn.checked? '显示时间线' : '隐藏时间线';
                    toggleInfoPanel(msg);
                }
            } else if (k == 'w' || k =='s') {
                e.preventDefault();
                e.stopPropagation();
                var p = $('.bpx-player-ctrl-web,div.bilibili-player-video-web-fullscreen,.squirtle-video-pagefullscreen,.bilibili-live-player-video-controller-web-fullscreen-btn button');
                if(p){p.click();}
            } else if (k == 'f' && $('.bilibili-live-player-video-controller-fullscreen-btn button')) {
                $('.bilibili-live-player-video-controller-fullscreen-btn button').click();
            } else if (k == 'a' && $('.next-button')) {
                $('.next-button').click();
            } else if (spc.includes(k)) {
                if (k == '+' || k == '=') v.playbackRate += .05;
                if (k == '-') v.playbackRate -= .05;
                if (k == 'r' || k == '*' || k == '\\') v.playbackRate = 1;
                if (sessionStorage.bilibili_player_settings) {
                    var j = JSON.parse(sessionStorage.bilibili_player_settings);
                    sessionStorage.playbackrate = v.playbackRate;
                    j.video_status.videospeed = Number(v.playbackRate.toFixed(2));
                    sessionStorage.bilibili_player_settings = JSON.stringify(j);
                }
                var vsn = $('.bilibili-player-video-btn-speed-name, .bpx-player-ctrl-playbackrate-result');
                if (vsn) vsn.textContent = (v.playbackRate == 1)? '倍速' : v.playbackRate.toFixed(2).replace(/0$/, '') + 'x';
                var ri = (Number(v.playbackRate.toFixed(2)) == 1)? '' : '⏩ ';
                toggleInfoPanel(ri + v.playbackRate.toFixed(2).replace(/0$/, '') + 'x');
            } else if (k == 'arrowright') {
                setTimeout(()=>{
                    if (sessionStorage.playbackrate) {
                        v.playbackRate=Number(sessionStorage.playbackrate);
                        var vsn = $('.bilibili-player-video-btn-speed-name');
                        if (vsn) vsn.textContent = (v.playbackRate == 1)? '倍速' : v.playbackRate.toFixed(2).replace(/0$/, '') + 'x';
                        var ri = (Number(v.playbackRate.toFixed(2)) == 1)? '' : '⏩ ';
                        toggleInfoPanel(ri + v.playbackRate.toFixed(2).replace(/0$/, '') + 'x');
                    }
                }, 500);
            } else if (['ControlRight', 'Period', 'ShiftRight'].includes(e.code)) {
                v.playbackRate = sessionStorage.videoBeforeTurboSpeed;
                toggleInfoPanel('▶ 1x');
            }
        };
    };

    function setPlaybackRateText(pbr) {
        var n = $('.bilibili-player-volumeHint');
        if (n) {
            if (pbr > 1) {
                n.setAttribute('pbr', '⏩ ' + pbr + 'x');
            } else if (pbr < 1) {
                n.setAttribute('pbr', '⏪ ' + pbr + 'x');
            } else {
                n.setAttribute('pbr', '');
            }
        }
    }

    if (unsafeWindow.__INITIAL_STATE__ && unsafeWindow.__INITIAL_STATE__.mediaInfo) { // set old player media info
        var cv = $('.info-cover img');
        var mi = unsafeWindow.__INITIAL_STATE__.mediaInfo;
        var pi = unsafeWindow.__INITIAL_STATE__.pubInfo;
        var setInfo = img => {
            img.title = "首播: " + pi.pub_time.split(/\s+/)[0] + "\n类型: " + mi.style.join(" ") +  "\n声优:\n" + mi.actors + "\n简介:\n" + mi.evaluate;
        };

        if (cv) {
            cv.onload = function() {
                setInfo(cv);
            }
            if (!cv.title) setInfo(cv);
        }
    }

    if (location.href.match(/live\.bilibili\.com\/(blanc\/)?\d+/)) {
        GM_addStyle("#chat-history-list .title-label, #chat-history-list .fans-medal-item-ctnr, #chat-history-list .vip-icon, #chat-history-list .guard-icon, #chat-history-list .user-level-icon, .july-activity-entry, #shop-popover-vm {display: none;}");
        GM_addStyle(".danmaku-item:hover .title-label, .danmaku-item:hover .fans-medal-item-ctnr, .danmaku-item:hover .user-level-icon {display: inline-block !important;}")
        GM_addStyle("#liveTime {margin-left: 8px; font-size: 12px; color: rgb(153, 153, 153);} .count-input {width:60px !important;} .count-inputs {width:137px !important;}");
        GM_addStyle(".latiao {color: chocolate} .latiao::after {content:attr(latiao); color: deeppink;} #player-ctnr {margin-top: 10px;}");
        GM_addStyle("#showVolume::before{content:attr(volumeicon);float:left;} .chat-history-panel .chat-history-list .chat-item.system-msg .msg-content {overflow-y: auto;scrollbar-width: thin;max-height: 85px;scrollbar-color: coral black;}");
        GM_addStyle("#giftnum::before{content:attr(status);font-size: 14px; animation:backtopblinker 3s linear infinite;} @keyframes backtopblinker {50% {opacity: 0.1;}}");
        GM_addStyle(".task-box, .gift-presets, .guard-ent, .mailbox-cntr,.btn.live-skin-highlight-text, .player-full-win #web-player__bottom-bar__container {display:none !important;} #gift-control-vm,#gift-control-vm .gift-control-panel{height: auto;} .live-room-app main.app-content {padding-top: 52px;} #head-info-vm .header-info-ctnr {padding-top:0;padding-bottom:0;height:auto;} #head-info-vm {height:auto;}");
    } else {
        GM_addStyle(".v-wrap #viewbox_report.video-info {height:46px;padding-top:2px;} #viewbox_report .video-title {margin-bottom:2px;} #arc_toolbar_report {margin-top: 2px;padding-bottom: 2px;} #bilibiliPlayer .bilibili-player-video-sendbar {height:auto;} #internationalHeader .mini-header{height:auto;} #internationalHeader .mini-header__content{padding:0px 24px;} #v_desc {margin-top: 5px;} #v_desc .tip-info{margin-bottom: 5px;}");
        GM_addStyle("body{font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Helvetica,PingFang SC,Hiragino Sans GB,Microsoft YaHei,sans-serif}");
    }

    document.addEventListener('animationstart', e => {
        if (e.animationName == 'bilibili') {
            var v = $("video");
            setPlayer(v);
            filterDanmu();
            v.parentNode.appendChild(infoDiv);
            if (showLikePer && __INITIAL_STATE__ && __INITIAL_STATE__.videoData && __INITIAL_STATE__.videoData.stat) {
                var ps = __INITIAL_STATE__.videoData.stat.view;
                var ls = __INITIAL_STATE__.videoData.stat.like;
                var like = $C('span', {style:'font-size:10px;'});
                like.textContent = '('+Math.round(ls / ps * 100) + '%)';
                setTimeout(()=>$('.like').appendChild(like), 3e3);
            }
        } else if (e.animationName == 'navload') {
            //document.cookie.replace(/(?:(?:^|.*;\s*)DedeUserID\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            if ($('#fav')) {
                return;
            } else if ($('.nav-con>.fr')) {
                $('.nav-con>.fr').insertAdjacentHTML('beforeend', '<li class="nav-item" id="fav"><a href="//space.bilibili.com/' + userid + '/bangumi" class="t">订阅</a></li>');
            } else if (!$('li[report-id="playpage_bangumi"]') && $('.nav-wrapper-right .nav-con-ul')) {
                $('.nav-wrapper-right .nav-con-ul').insertAdjacentHTML('beforeend', '<li class="nav-item" report-id="playpage_bangumi"><a href="//space.bilibili.com/' + userid + '/bangumi" class="t">订阅</a></li>');;
            } else if ($('.nav-user-center .mini-favorite')) {
                e.target.parentNode.parentNode.insertAdjacentHTML('afterend', '<div class="item" id="fav"><a href="//space.bilibili.com/' + userid + '/bangumi" class="name">订阅</a></div>');
            }
        } else if (e.animationName == 'payload') {
            // var nextBtn = $('.bilibili-player-video-btn-next');
            // var v = $("video");
            // if (nextBtn && v.duration - v.currentTime < 10) nextBtn.click();
        } else if (e.animationName == 'liveRoomInfo') {
        } else if (e.animationName == 'avlink') {
            setNewPlayerInfo();
        } else if (e.animationName == 'danmubutton') {
            //showTimeLineInFullMode();
        } else if (e.animationName == 'playlistOrder') {
            e.target.onclick = ()=> {
                plOrder = e.target.dataset.order;
                var mp = JSON.parse(localStorage.medialistplay || '{}');
                if (!initPlOrder) {
                    mp[ml].o = plOrder;
                    localStorage.medialistplay = JSON.stringify(mp);
                } else {
                    if (mp[ml].o == plOrder) {
                        initPlOrder = false;
                    } else {
                        setTimeout(()=>$('.player-auxiliary-btn-playlist-order').click(), 100);
                    }
                }
            };
            var mp = JSON.parse(localStorage.medialistplay || '{}');
            if (mp[ml] && mp[ml].o != e.target.dataset.order) {
                //e.target.click(); // issue with bili update
            }
            setTimeout(modAutoPlayButton, 5e3);
        } else if (e.animationName == 'bvca') {
            var n = e.target;
            var bvid = n.href.match(/\/video\/([^\/\?]+)/)[1];
            var bia = $('.bili-video-card__info--bottom', n.parentNode);
            $('a', bia).href = $('a', bia).href.replace(/\?.*$/, '');
            var baid = $('a', bia).href.match(/\d+/)[0];
            var baName = $('.bili-video-card__info--author', bia).textContent;
            if (hideAu.includes(baid) || hideVd[bvid]) {
                $(`.feed-card:has(a[href*="${bvid}"]), .bili-video-card:has(a[href*="${bvid}"])`).remove();
                return;
            }
            var biv = $('.bili-video-card__info--tit', n.parentNode);
            var ha = $C('span', {class:'hideauthor', title:'加入黑名单'});
            var hv = $C('span', {class:'hidevideo', title:'隐藏此视频'});
            ha.textContent = '❌';
            hv.textContent = '✖️';
            hv.onclick = ()=> {
                var pn = n.parentNode.parentNode;
                if (pn.parentNode.classList.contains('feed-card')) {
                    pn = pn.parentNode;
                }
                pn.remove();
                var hideVd = GM_getValue('hideVideo') || {};
                hideVd[bvid] = Date.now();
                GM_setValue('hideVideo', hideVd);
            };
            ha.onclick = ()=> {
                if (confirm('把"' + baName + '"加入黑名单？')) {
                    var d = `fid=${baid}&act=5&csrf=${getCookie('bili_jct')}`;
                    XHR({url:'https://api.bilibili.com/x/relation/modify', method:'POST', headers: biliHeaders, data: d, isjson:true}).then(r=>{console.log('拉黑:',r)});
                    $All(`.feed-card:has(a[href*="/${baid}"]), .bili-video-card:has(a[href*="/${baid}"])`).forEach(i=>i.remove());
                }
            };
            if (loc.match(/^https:\/\/www\.bilibili\.com\/(\?.*)?/)) {
                setTimeout(()=>{bia.appendChild(ha);biv.insertAdjacentElement('afterbegin', hv)}, 2e3);
            }
            if (showLikePer) {
                var vi = 'https://api.bilibili.com/x/web-interface/archive/stat?bvid=' + bvid;
                XHR({url:vi, isjson:true}).then(r=>{
                    console.log(r.data.bvid, r.data.view, r.data.like);
                    if (!$('.vlike', n)) {
                        var like = $C('span', {class: 'vlike'});
                        like.textContent = Math.round(r.data.like / r.data.view * 100) + '%';
                        if (n.className == 'bili-dyn-card-video') {
                            $('.bili-dyn-card-video__stat', n).appendChild(like);
                        } else {
                            $('.bili-video-card__stats--left', n).appendChild(like);
                        }
                    }
                });
            }
        }
    });

    GM_addStyle("video {animation:bilibili 1ms; outline:none;} @keyframes bilibili{from{opacity:.9;}to{opacity:1;}}");
    GM_addStyle(".room-info-down-row {animation:liveRoomInfo 1ms;} @keyframes liveRoomInfo{from{opacity:.9;}to{opacity:1;}}");
    GM_addStyle(".nav-con>.fr, .nav-wrapper-right .nav-con-ul,.nav-user-center .mini-favorite {animation:navload 1ms;} @keyframes navload{from{opacity:.9;}to{opacity:1;}}");
    GM_addStyle(".bilibili-player-bangumipay-panel-wrap-btn, .bilibili-player-electric-panel-jump, .bilibili-player-video-toast-item-jump {animation:payload 1ms;} @keyframes payload{from{opacity:.9;}to{opacity:1;}}");
    GM_addStyle(".title-length-limit {max-width: 350px !important;} .history-record-m {overflow: hidden auto;height: 350px;}");
    GM_addStyle(".bilibili-player-video-danmaku-switch, .bpx-player-dm-switch {animation:danmubutton 1ms;} @keyframes danmubutton{from{opacity:.9;}to{opacity:1;}}");
    GM_addStyle(".player-mode-webfullscreen {overflow:hidden;}");
    GM_addStyle('#dbrating::before {content: "豆";color: green;font-size: 10px;font-weight: bold;} .media-rating {position: absolute;top: 22px;left: 420px;} #dbrating{position: absolute;left: 490px;top: 22px;height:44px;} #media_module .up-info-wrapper{float:right;margin-top:20px;}');
    GM_addStyle('#app {margin-top:0;} #toolbar_module{height:30px;} .media-wrapper {padding-top: 5px !important;} #media_module{padding-top: 6px;}');
    GM_addStyle(".bili-video-card__wrap > a, .bili-dyn-card-video {animation:bvca 1ms; outline:none;} @keyframes bvca{from{opacity:.9;}to{opacity:1;}} .vlike::before {content: '👍 '; }");

    if (location.href.match(/^https?:\/\/www\.bilibili\.com\/bangumi\//)) {
        GM_addStyle(".bilibili-player-video-subtitle {display: none !important;}");
        GM_addStyle(".media-show-time, .media-type {position: absolute; right: 0;} .media-voice {margin-bottom: 8px;font-size: 12px;color: #00a1d6;} .media-count::after {position: absolute;right: 0;content: attr(showtime);}");
        GM_addStyle(".av-link {animation:avlink 1ms;} @keyframes avlink{from{opacity:.9;}to{opacity:1;}}");
    }
    // GM_addStyle(".bilibili-player-volumeHint::before {  content: attr(pbr);  font-size: 10px;  bottom: -10px;  position: absolute;  left: 11px; }");

    //waitForElements({selector: '.bpx-player-shadow-progress-area', callback: showTimeLineInFullMode});

    window.addEventListener('beforeunload', e => {
        if (localStorage.timelineH != $('#timelineHeight').value) {
            localStorage.timelineH = $('#timelineHeight').value;
        }
    });

    function modAutoPlayButton() {
        var anbtn = $('.next-button');
        if (anbtn && !$('#bnbtn')) {
            GM_addStyle('.next-button{float:right;display: inline-flex;} .next-button .switch-button::after {height:12px;width:12px;} .next-button .switch-button{height:16px;width:26px;} .next-button .txt {white-space: nowrap;}');
            $('.txt', anbtn).textContent = '全部自动连播';
            var bnbtn = anbtn.cloneNode(true);
            bnbtn.id = 'bnbtn';
            $('.txt', bnbtn).textContent = '仅限剧集连播';
            var sb = $('.switch-button', bnbtn);
            bnbtn.onclick = () => {
                sb.classList.toggle('on');
                GM_setValue('playlistAutoPlay', sb.classList.contains('on'));
            };
            sb.classList.toggle('on', GM_getValue('playlistAutoPlay'));
            anbtn.parentNode.appendChild(bnbtn);
        }
    }

    function showTimeLineInFullMode() {
        var bar = $('.bpx-player-shadow-progress-area');
        var btn = $('#timeline input');
        if (!btn) {
            GM_addStyle('.bpx-player-dm-root .bui-switch .choose_danmaku {display: inline-block;position: absolute;left: 50%; margin-left: -32px; bottom: 38px; \
                    width: 64px;height: 29px;text-align: center;line-height: 30px; border-radius: 2px; background: rgba(0,0,0,.9); opacity: 0; color: #fff; \
                    font-size: 12px; -webkit-transform: translateY(5px); transform: translateY(5px); pointer-events: none; z-index: 99999; \
                    -webkit-transition: all .2s ease-in-out; transition: all .2s ease-in-out; } \
                    .bpx-player-dm-root .bui-switch:hover .choose_danmaku {opacity: 1; -webkit-transform: translateY(0);transform: translateY(0); } \
                    .bpx-player-shadow-progress-area:not(.permanent) {opacity:0 !important} .bpx-player-shadow-progress-area{height:var(--tlh, 4px);max-height:var(--tlh, 4px);} \
                    #timelineHeight{opacity:0;transition:all 0.5s ease 1s;} #timelineHeight:hover {opacity: 1;transition: all 0.3s ease;}');
            var p = $('.bilibili-player-video-danmaku-root, .bpx-player-dm-root');
            var ss = $All('style[data-injector="video"]');
            var r1 = '.bilibili-player.mode-fullscreen .bilibili-player-video-control-wrap .bilibili-player-video-control .bilibili-player-video-progress-shadow';
            var r2 = '[data-screen="full"] .squirtle-progress-wrap {display:block !important;}';
            for (let s of ss) {
                if(s.textContent.match(r1)) {
                    var rs = s.sheet.rules;
                    for (var i = 0; i < rs.length; i++) {
                        if (rs[i].cssText.includes(r1) && rs[i].style.opacity == 0) {
                            s.sheet.deleteRule(i);
                            break;
                        }
                    }
                    break;
                }
            }
            var isClassic = !$('.bpx-docker');
            var st = document.createElement('style');
            bar.classList.add('permanent');
            st.id = 'showTimeLineInFull';
            document.head.appendChild(st);
            st.innerHTML = isClassic? r1 + ' {opacity:0 !important;}' : r2;
            st.sheet.disabled = isClassic;
            p.insertAdjacentHTML('afterbegin', '<div class="bilibili-player-video-danmaku-switch bui bui-switch" id="timelineAdjust"> \
                    <input type="number" name="quantity" min="1" step="1" style="width: 35px;height:20px;" id="timelineHeight"><span class="choose_danmaku">时间线厚度</span></div> \
                    <div id="timeline" class="bilibili-player-video-danmaku-switch bui bui-switch" aria-label="显示时间线"><input class="bui-switch-input" type="checkbox" checked=""> \
                    <label class="bui-switch-label"><span class="bui-switch-body"><span class="bui-switch-dot">⌛️</span></span></label><span class="choose_danmaku">隐藏时间线</span></div>');
            var lb = $('#timeline .choose_danmaku');
            btn = $('#timeline input');
            btn.onclick = function() {
                localStorage.timeline = (btn.checked)? 'on' : 'off';
                if (isClassic) {
                    st.sheet.disabled = btn.checked;
                    lb.textContent = (btn.checked)? '隐藏时间线' : '显示时间线';
                } else {
                    bar.classList.toggle('permanent');
                    lb.textContent = (btn.checked)? '隐藏时间线' : '显示时间线';
                }
            };
            if (localStorage.timeline == 'off' && btn.checked) {
                btn.click();
                st.sheet.disabled = !isClassic;
                lb.textContent = '显示时间线';
            }
            var tlh = $('#timelineHeight');
            var tlhMax = 30;
            var tlhDefault = Number(localStorage.timelineH || 4);
            bar.style = "--tlh:" + tlhDefault + "px";
            tlh.value = tlhDefault;
            tlh.setAttribute('max', tlhMax);
            tlh.oninput=e=>{
                if(e.target.value < 1) {e.target.value = 1;}
                else if (e.target.value > tlhMax) {e.target.value = tlhMax;}
                else e.target.value = Number(e.target.value).toFixed(0);
                $('.bpx-player-shadow-progress-area').style = "--tlh:" + e.target.value + "px";
            };
        } else {
            bar.style = "--tlh:" + $('#timelineHeight').value + "px";
            if (btn.checked) {
                bar.classList.add('permanent');
            }
        }
    }

    function filterDanmu() {
        var dml = $(".bilibili-player-video-danmaku");
        if (!dml) return;
        var dms = [], expTimer = 12 * 1e3;
        new MutationObserver(function(mutations) {
            mutations.forEach(m=>{
                m.addedNodes.forEach(n=>{
                    var now = Date.now();
                    dms = dms.filter(d => now - d.t < expTimer);
                    if (dms.find(d => d.c.includes(n.textContent))) {
                        n.textContent = '';
                    } else {
                        dms.push({c:n.textContent, t:now});
                    }
                });
            });
        }).observe(dml, {childList: true, subtree: true});
    }

    function setNewPlayerInfo() { // set new player media info
        if ($('.media-voice')) return;
        var mc = $('.media-cover');
        var ssid = unsafeWindow.__INITIAL_STATE__ && unsafeWindow.__INITIAL_STATE__.mediaInfo && unsafeWindow.__INITIAL_STATE__.mediaInfo.ssId;
        if (!mc || !ssid) return;
        var i = setInterval(()=>{
            var img = $('.media-cover img');
            if (img) {
                clearInterval(i);
                mc.href = img.src.replace(/@\d+w_\d+h.*$/,'');
            }
        }, 1e3);
        var apiUrl = 'https://bangumi.bilibili.com/view/web_api/season?season_id=' + ssid; //https://bangumi.bilibili.com/view/web_api/season?ep_id=
        console.log('BApi:', apiUrl);
        XHR({url: apiUrl, headers: {Referer: location.href}, isjson: true}).then(r=>{
            if (r.code == 0) {
                var rs = r.result;
                var pt = new Date(rs.publish.pub_time);
                var fst = getLocaleDateString(pt);
                mc.title = "首播: " + fst + "\n类型: " + rs.style.join(" ") +  "\n声优:\n" + rs.actors;
                $('.media-count').setAttribute('showtime', "首播: " + fst);
                var mtSpan = document.createElement('span');
                mtSpan.className = 'media-type';
                mtSpan.textContent = "类型: " + rs.style.join(" ");
                $('.pub-wrapper').appendChild(mtSpan);
                var mvSpan = document.createElement('div');
                mvSpan.className = 'media-voice';
                mvSpan.innerHTML = "声优：<br>" + rs.actors.replace(/\n/g, '│');
                $('.media-right').insertBefore(mvSpan, $('.media-desc'));
            }
        });
    }


    function setMedialistPlay() {
        GM_addStyle('.player-auxiliary-btn-playlist-order,.video-section-list {animation:playlistOrder 1ms; outline:none;} @keyframes playlistOrder{from{opacity:.9;}to{opacity:1;}}');
        var mp = JSON.parse(localStorage.medialistplay || '{}');
        if (location.href.includes('/medialist/play/')) {
            var mlVid = location.href.match(/\/medialist\/play\/([^\?]+)/)[1].split('/');
            ml = mlVid[0];
            vid = mlVid[1];
            var vo = mp[ml];
            if (vo && vo.o && vo.o != plOrder) {
                initPlOrder = true;
            }
            return;
        }

        var cVid = location.href.match(/^https:\/\/www\.bilibili\.com\/video\/([^\?]+)/);
        if (cVid) {
            for (const [k, v] of Object.entries(mp)) {
                if (v.v == cVid[1]) {
                    location.href = 'https://www.bilibili.com/medialist/play/' + k + '/' + cVid[1];
                    break;
                }
            }
        }
    }

    function doClick(e) {
        if (e) e.click ? e.click(): e.dispatchEvent(new MouseEvent('click'));
    }

    function getLocaleDateString(d) {
        return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

})();
