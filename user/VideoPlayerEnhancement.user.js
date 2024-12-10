// ==UserScript==
// @name        Video Player Enhancement
// @version     0.1.8
// @description
// @include     /https?:\/\/(www|m|v)\.douyu(tv)?\.com/.*/
// @include     /https?:\/\/live\.bilibili\.com/.+/
// @include     https://www.huya.com/*
// @include     /https://www\.age(fans|mys|dm)\.[\w]+\/(age\/)?player\/.+/
// @include     /https:\/\/(www|m)\.youtube\.com\/watch.+/
// @match       https://*.sp-flv.com*/*
// @match       https://43.240.156.118:8443/*
// @include     /https:\/\/\w+\.(pornhub|youporn|tube8|thumbzilla|redtube)\.com\/.*/
// @match       https://www.xvideos.com/*
// @include     /https:\/\/(\w+\.)?xhamster\.com\/.*/
// @match       https://player.hanime.tv/*
// @match       https://hanime1.me/*
// @match       https://www.hentaicity.com/video/*
// @match       https://live.qq.com/*
// @match       https://*.cctv.com/*
// @match       http://127.0.0.1/*
// @include     /https?:\/\/[\w]+\.(mxdm|wjys)\d?\.\w+\/.*/
// @require     https://raw.githubusercontent.com/smovie/js/refs/heads/main/util.js
// @grant       unsafeWindow
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_openInTab
// @run-at      document-body
// ==/UserScript==

//https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
//https://raw.githubusercontent.com/smovie/js/refs/heads/main/util.js

(function(){
    var loc = location.href;
    var video, infoPanel, infoDiv = $('#vpeInfoPanel') || $C("div", {id: 'vpeInfoPanel'});;
    var volumeStep = 0.05;
    var seekStep = 5;
    var rateStep = 0.05;
    var playbackTurbo = 2;
    var playbackRateTemp = 1;
    var isFastPlay = false;
    var conf = {};
    if (loc.includes('douyu.com')) {
        conf = loc.includes('v.douyu.com')? douyuVideo() : douyu();
    } else if (loc.includes('live.bilibili.com')) {
        conf = bilibililive();
    } else if (loc.includes('huya.com')) {
        conf = huya();
    } else if (loc.match(/age(fans|dm)\.[\w]+|sp-flv\.com|43\.240\.156\.118/)) {
        conf = agefans();
    } else if (loc.match(/(pornhub|youporn|tube8|thumbzilla|redtube)\.com/)) {
        conf = phub();
    } else if (loc.match(/xvideos\.com/)) {
        conf = xvideos();
    } else if (loc.match(/xhamster\.com/)) {
        conf = xhamster();
    } else if (loc.match(/hanime\.tv/)) {
        conf = hanime();
    } else if (loc.match(/hanime1\.me/)) {
        conf = hanime1();
    } else if (loc.match(/\.youtube\.com\/watch/)) {
        conf = youtube();
    } else if (loc.match(/live\.qq\.com\//)) {
        conf = qqLive();
    } else if (loc.match(/\.cctv\.com\//)) {
        conf = cctv();
    } else if (loc.match(/(mxdm|wjys)\d?\.\w+/)) {
        conf = mxdm();
    } else if (loc.match('www.hentaicity.com')) {
        conf = hentaicity();
    } else {
        conf = common();
    }

    vpe(conf);

    function vpe(configs) {
        GM_addStyle('#vpeInfoPanel {text-align: center;opacity: 0;cursor: default;} \
            span#vpeCenterInfo{white-space: pre-line;position: absolute;left: 50%;top: 50%;transform:translate(-50%, -50%);width: auto;height: 30px;font-weight: 1000;font-size: 24px;-webkit-text-fill-color: #fff;-webkit-text-stroke: 1px #000;z-index: 9999;font-family: Microsoft Yahei;} \
            #vpeTopInfo {position: absolute;left: 0;top: 0;font-size: 20px;width: 100%;height: 30px;z-index: 9999;color:#db3c8e;text-shadow: black 1px 0px 1px, black 0px 1px 1px, black 0px -1px 1px, black -1px 0px 1px;} \
            .topInfoAnima {animation-name: fastPlay; animation-duration: 1s; animation-iteration-count: infinite;} \
            @keyframes fastPlay { from {opacity: 1;} to {opacity: 0.5;} } .clock{float:right;opacity:0;} .topTitle{float:left;opacity:0;} \
            .vpeIcon::before {content: attr(vpeIcon);display:inline-block;width:36px;}'); //color: transparent;text-shadow: 0 0 0 #dd318a;-webkit-text-fill-color: transparent;-webkit-text-stroke: transparent;
        var c = configs || {};
        var vs = c.videoSelector || 'video';
        var disabledKey = c.disabledKey || [];
        var vpeInit = v => {
            if (!v) return;
            video = v;
            if (c.videoVolume) {
                v.volume = c.videoVolume;
            } else if (localStorage.videoVolume) {
                v.volume = localStorage.videoVolume;
            }
            if (c.init) {
                c.init();
            }
            infoPanel = c.infoPanel || v.parentNode;
            var clearTimer = 0;
            var icon = '';
            var centerSpan = $('#vpeCenterInfo') || $C("span", {id:'vpeCenterInfo'});
            var topSpan = $('#vpeTopInfo') || $C("span", {id:'vpeTopInfo'});
            var topMdlSpan = $('#vpeTopMdlInfo') || $C("span", {id:'vpeTopMdlInfo'});
            var topTitle = c.title;
            if (topTitle) {
                topSpan.appendChild($C('span', {'class':'topTitle', 'text': topTitle}));
            }
            topSpan.appendChild(topMdlSpan);
            topSpan.appendChild(getClock());
            infoDiv.appendChild(centerSpan);
            infoDiv.appendChild(topSpan);
            infoPanel.appendChild(infoDiv);
            var wheelPanel = c.wheelPanel || infoPanel;
            var eventCpt = c.eventCpt || false;
            var updateVolumeBar = c.updateVolumeBar;
            var toggleFullPage = c.toggleFullPage || function() {

            };
            var toggleFullScreen = c.toggleFullScreen || function() {

            };
            var updateProgressBar = c.updateProgressBar || function() {

            };
            var togglePlayPause = c.togglePlayPause || function(e) {
                // e.preventDefault();
                // e.stopPropagation();
                if (v.paused) {
                    v.play();
                } else {
                    v.pause();
                }
            };
            var toggleDanmu = c.toggleDanmu || function() {

            };
            var whenVideoPlaying = c.whenVideoPlaying || function() {

            };
            v.onplaying = e => {
                whenVideoPlaying();
            };
            unsafeWindow.toggleInfoPanel = (info) => {
                if (!$('#vpeInfoPanel')) {
                    infoPanel.appendChild(infoDiv);
                }
                if (infoDiv.isFrozen) return;
                if (info) centerSpan.textContent = info;
                if ($('.clock')) {
                    if (document.fullscreen) $('.clock').style.opacity = '1';
                    else $('.clock').style.opacity = '0';
                }
                if ($('.topTitle')) {
                    if (document.fullscreen || document.fullPage) {
                        $('.topTitle').textContent = c.title;
                        $('.topTitle').style.opacity = '1';
                    } else $('.topTitle').style.opacity = '0';
                }
                infoDiv.style.opacity = '1';
                infoDiv.style.transition = 'all 0.3s ease';
                if (clearTimer) {
                    clearTimeout(clearTimer);
                    clearTimer = 0;
                }
                clearTimer = setTimeout(()=>{
                    centerSpan.classList.remove('vpeIcon');
                    if (!isFastPlay) infoDiv.style.opacity = '0';
                    centerSpan.textContent = '';
                    infoDiv.style.transition = 'all 0.5s ease 1s';
                }, 1e3);
            };
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
                } else if (v.volume > 0.33) {
                    icon = '🔉 ';
                } else if (v.volume > 0) {
                    icon = '🔈 ';
                } else {
                    icon = '🔇 ';
                }
                //centerSpan.setAttribute('vpeIcon', icon);
                //centerSpan.classList.add('vpeIcon');
                toggleInfoPanel(icon + (v.volume * 100).toFixed(0));

                if (updateVolumeBar) updateVolumeBar();
            };
            var seekVideo = function(offset) {
                if (conf.isLive || v.duration === Infinity) {
                    return;
                }
                var t;
                if (v.currentTime + offset >= v.duration) {
                    t = v.duration - 0.1;
                } else if (v.currentTime + offset < 0) {
                    t = 0;
                } else {
                    t = v.currentTime + offset;
                }
                v.currentTime = t;
                // var str = formatTime(t) + '\n' + ((offset>0)? '⏩ +' + offset : '⏪ ' + offset)  + 's';
                var str = ((offset>0)? '⏩ ' : '⏪ ') + formatTime(t);
                toggleInfoPanel(str);
                updateProgressBar();
            };
            var changeVideoRate = (r, abs) => {
                v.playbackRate = abs? r : v.playbackRate + r;
                var ri = (Number(v.playbackRate.toFixed(2)) == 1)? '▶ ' : '⏩ ';
                toggleInfoPanel(ri + v.playbackRate.toFixed(2).replace(/0$/, '') + 'x');
                if (r >= 2) {
                    $('#vpeTopMdlInfo').textContent = '▶▶▶▶'.substring(0,r);
                    $('#vpeTopMdlInfo').classList.add('topInfoAnima');
                    isFastPlay = true;
                } else if (isFastPlay) {
                    $('#vpeTopMdlInfo').classList.remove('topInfoAnima');
                    $('#vpeTopMdlInfo').textContent = '';
                    isFastPlay = false;
                }
            };
            wheelPanel.addEventListener('wheel', e => {
                var d = (Math.abs(e.deltaY) > Math.abs(e.deltaX))? e.deltaY : e.deltaX;
                var step = (d>0)? -volumeStep : volumeStep;
                e.preventDefault();
                e.stopPropagation();
                if (this.rPressed) {
                    changeVideoRate(step);
                    this.rPressedFunc = true;
                } else {
                    changeVolume(step);
                }
            });
            wheelPanel.addEventListener('mousedown', e => {
                if (e.which == 1 && conf.isLive && !isTextNode(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                } else if (e.which == 2 && !isTextNode(e.target)) {
                    e.preventDefault();
                    toggleFullPage();
                } else if (e.which == 3) {
                    this.rPressed = true;
                } else if (e.which == 1 && this.rPressed) {
                    this.lPressed = true;
                    var sInt = setInterval(()=>{
                        if (this.lPressed && this.rPressed) {
                            seekVideo(5);
                        } else {
                            clearInterval(sInt);
                        }
                    }, 500);
                }
            }, eventCpt);
            wheelPanel.addEventListener('mouseup', e => {
                if (e.which == 3 && this.rPressed) {
                    this.rPressed = false;
                } else if (e.which == 1) {
                    this.lPressed = false;
                    if (this.rPressed) {
                        e.preventDefault();
                        e.stopPropagation();
                        seekVideo(5);
                    }
                }
            }, eventCpt);

            v.addEventListener('contextmenu', e => {
                if (this.rPressedFunc) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.rPressedFunc = false;
                }
            });

            v.addEventListener('click', e => {
                if (e.detail == 1 && conf.isLive && !isTextNode(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            wheelPanel.addEventListener('dblclick', e => {
                if (!this.rPressed) {
                    toggleFullScreen();
                }
                e.preventDefault();
                e.stopPropagation();
            }, eventCpt);

            // v.addEventListener('dblclick', e => {
            //     toggleFullScreen();
            //     e.preventDefault();
            //     e.stopPropagation();
            // }, eventCpt);

            wheelPanel.onmousemove = ()=> toggleInfoPanel();
            document.addEventListener('keydown', e => {
                if (isTextNode(e.target) || disabledKey.includes(e.code)) {
                    return;
                }
                if (['KeyW','KeyD','KeyF','ArrowUp', 'ArrowDown', 'ArrowLeft','ArrowRight','Space', 'ControlRight', 'ShiftRight', 'Period'].includes(e.code)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                switch(e.code) {
                    case 'KeyW': toggleFullPage(); break;
                    case 'KeyF': toggleFullScreen(); break;
                    case 'KeyD': toggleDanmu();toggleInfoPanel(); break;
                    case 'ArrowUp': changeVolume(volumeStep); break;
                    case 'ArrowDown': changeVolume(-volumeStep); break;
                    case 'ArrowLeft': seekVideo(-seekStep); break;
                    case 'ArrowRight': seekVideo(seekStep); break;
                    case 'Space': togglePlayPause(); break;
                    case 'Equal':;
                    case 'NumpadAdd': changeVideoRate(rateStep);break;
                    case 'Minus':;
                    case 'NumpadSubtract': changeVideoRate(-rateStep);break;
                    case 'KeyR':;case 'NumpadMultiply':;case 'Backslash':;case 'KeyS': changeVideoRate(1, true);break;
                    case 'ControlRight': if (v.playbackRate != playbackTurbo) {playbackRateTemp = v.playbackRate; changeVideoRate(playbackTurbo, true);}break;
                    case 'ShiftRight': if (v.playbackRate != playbackTurbo + 1) {playbackRateTemp = v.playbackRate; changeVideoRate(playbackTurbo + 1, true);}break;
                    case 'Period':;
                    case 'Numpad6': if (v.playbackRate != playbackTurbo + 2) {playbackRateTemp = v.playbackRate; changeVideoRate(playbackTurbo + 2, true);}break;
                    case 'ControlLeft': this.ctrlLeftPressed = true;break;
                    case 'ShiftLeft': this.shftLeftPressed = true;break;
                }
            }, true);
            document.addEventListener('keyup', e => {
                if (isTextNode(e.target) || disabledKey.includes(e.code)) {
                    return;
                }
                if (['KeyW','KeyD','KeyF','ArrowUp', 'ArrowDown', 'ArrowLeft','ArrowRight','Space', 'ControlRight', 'ShiftRight', 'Period'].includes(e.code)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                switch(e.code) {
                    case 'ControlRight':;
                    case 'ShiftRight':;
                    case 'Period':;
                    case 'Numpad6': changeVideoRate(playbackRateTemp, true);break;//v.playbackRate = 1.001;break;// currentTime-=1e-6;break;
                    case 'ControlLeft': this.ctrlLeftPressed = false;break;
                    case 'ShiftLeft': this.shftLeftPressed = false;break;
                }
            },true);

            window.addEventListener('beforeunload', c.beforeunload || function(e) {
                if (localStorage.videoVolume != v.volume) {
                    localStorage.videoVolume = v.volume;
                }
            });
        };

        waitForElements({selector: vs, callback: vpeInit});
    }

    function bilibililive() {
        return {
            isLive: true,
            updateVolumeBar: function() {
                var bss = $All('.blpui-slider-span');
                if (bss.length == 0) {return;}
                var av = 100 / bss.length;
                bss.forEach((s, i)=>{
                    s.innerHTML = '';
                    if (av * i < video.volume * 100) {
                        s.className = "blpui-slider-span no-select slider-span-active";
                    } else {
                        s.className = "blpui-slider-span no-select";
                    }
                });
            },
            toggleFullPage: function() {
                var p = $('.bilibili-live-player-video-controller-web-fullscreen-btn button, div.tip-wrap:nth-child(2) > div > span.icon');
                if (p) {
                    p.click();
                    var as = document.querySelector("#aside-area-toggle-btn");
                    as && as.click();
                } else {
                    var lp = $('.bilibili-live-player');
                    var dic = $('.danmaku-item-container');
                    if (document.fullscreen) {
                        document.exitFullscreen();
                    } else if ($('body').classList.contains('player-full-win')) {
                        $('body').className = 'hide-aside-area';
                        if (lp) {
                            lp.dataset.playerState = 'web-fullscreen';
                        }
                        if (dic) {
                            dic.style = '';
                        }
                    } else {
                        $('body').className = 'player-full-win over-hidden hide-aside-area';
                        if (lp) {
                            lp.dataset.playerState = 'normal';
                        }
                        if (dic) {
                            dic.style.width = '100%';
                            dic.style.height = '100%';
                        }
                    }
                }
            },
            toggleFullScreen: function() {
                var p = $('.bilibili-live-player-video-controller-fullscreen-btn button');
                if (p) {
                    p.click();
                } else {
                    var lp = $('#live-player');
                    if (document.fullscreen) {
                        document.exitFullscreen();
                    } else if (lp) {
                        lp.requestFullscreen();
                    }
                }
            },
            toggleDanmu: function() {

            },
            beforeunload: function(e) {
                var uid = __LIVE_USER_LOGIN_STATUS__ && __LIVE_USER_LOGIN_STATUS__.uid;
                if (uid) {
                    var cfg = JSON.parse(localStorage['web-player-ui-config:'+uid]);
                    var vol = ($('video').volume * 100).toFixed(0);
                    if (cfg.volume.value != vol) {
                        cfg.volume.value = vol;
                        localStorage['web-player-ui-config:'+uid] = JSON.stringify(cfg);
                    }
                }
            },
            get wheelPanel() {
                return $('.bilibili-live-player-video-area, #live-player');
            },
            get infoPanel() {
                return $('#live-player, video');
            }
        };
    }

    function douyu() {
        return {
            isLive: true,
            updateVolumeBar: function() {
                if (localStorage.player_storage_volume_h5p_room) {
                    localStorage.player_storage_volume_h5p_room = localStorage.player_storage_volume_h5p_room.replace(/\"v\"\:\"[^\"]+/,'"v":"'+video.volume);
                }
                var point = $("[class^=VolumeBar-] [class^=point-]");
                var back = $("[class^=VolumeBar-] [class^=back-]");
                var front = $("[class^=VolumeBar-] [class^=front-]");
                var tips = $("[class^=VolumeBar-] [class^=tips-]");
                if (point) {
                    var blen = parseInt(window.getComputedStyle(back).width);
                    point.style.left = Math.round(video.volume * blen) + "px";
                    front.style.width = Math.round(video.volume * blen) + "px";
                    tips.textContent = tips.textContent.replace(/\d+/, Math.round(video.volume * 100));
                    tips.style.visibility = "visible";
                    if (this.tipshow) {
                        clearTimeout(this.tipshow);
                    }
                    var cb = $("[class^=controlbar-]");
                    if (cb && cb.className.match("hide-")) {
                        cb.backClass = cb.className;
                        cb.setClass = true;
                        cb.className = cb.className.split(/\s+/)[0];
                    }
                    this.tipshow = setTimeout(()=>{
                        tips.style.visibility = "hidden";
                        this.tipshow = 0;
                        setTimeout(()=>{ if (cb && cb.setClass) cb.className = cb.backClass; cb.setClass = false;}, 2000);
                    },1500);
                }
            },
            toggleFullPage: function() {
                var ps = $All('div[class^="wfs-"]');
                if (this.cfc) {
                    document.body.className = "";
                    this.cfc = false;
                    video.style.width = video.style.height = "100%";
                    var cb = $("[class^=controlbar-]");
                    if (cb) cb.style.width = "100%";
                } else if (shark_room_jsonp != undefined && shark_room_jsonp && shark_room_jsonp[10] && ps.length == 0 && $('.ChatRankWeek-listContent') && $('.ChatRankWeek-listContent').hasChildNodes()) {
                    document.body.className = "is-fullScreenPage is-fullScreenAll";
                    $(".layout-Player-asidetoggleButton").click();
                    this.cfc = true;
                } else if (ps.length == 2) {
                    var p = (ps[0].className.match("removed"))? ps[1] : ps[0];
                    p.click();
                    if (document.body.className && window.getComputedStyle($(".layout-Player-aside")).display == "block") {
                        $(".layout-Player-asidetoggleButton").click();
                    }
                } else if (ps.length == 0) {
                    var v = $('video'), b = $('body');
                    if (v && v.readyState) {
                        console.log("src", v.readyState, v.src )
                        b.classList.toggle('is-fullScreenPage');
                        if (document.body.className && window.getComputedStyle($(".layout-Player-aside")).display == "block") {
                            $(".layout-Player-asidetoggleButton").click();
                        }
                    } else if (b.classList.contains('is-fullScreenPage')) {
                        b.classList.remove('is-fullScreenPage');
                    }
                    if (v && v.readyState && !v.isStyleInit) {
                        v.isStyleInit = true;
                        GM_addStyle('video{width:inherit !important;height:inherit !important;} div[class^="controlbar-"]{width:100% !important;}');
                    }
                }
            },
            toggleFullScreen: function() {
                var fs = $All('div[class^="fs-"]');
                if (fs.length > 0) {
                    var f = (fs[0].className.match("removed"))? fs[1] : fs[0];
                    f.click();
                }
            },
            toggleDanmu: function() {
                var dmsws = $All('[class^="showdanmu"],[class^="hidedanmu"]');
                if (dmsws.length > 0) {
                    var sw = (dmsws[0].className.match("removed"))? dmsws[1] : dmsws[0];
                    sw.click();
                }
            },
            get wheelPanel() {
                return $('#js-player-video-case');
            }
        };
    }

    function douyuVideo() {
        return {
            isShadowRoot: true,
            toggleFullPage: function() {
                var dv = $('demand-video');
                if (dv && dv.shadowRoot) {
                    var dcb = $("#demandcontroller-bar", dv.shadowRoot);
                    if (dcb && $('.ControllerBar-PageFull', dcb.shadowRoot)) {
                        $('.ControllerBar-PageFull', dcb.shadowRoot).click();
                    }
                }
            },
            toggleFullScreen: function() {
                var dv = $('demand-video');
                if (dv && dv.shadowRoot) {
                    var dcb = $("#demandcontroller-bar", dv.shadowRoot);
                    if (dcb && $('.ControllerBar-WindowFull', dcb.shadowRoot)) {
                        $('.ControllerBar-WindowFull', dcb.shadowRoot).click();
                    }
                }
            },
            get wheelPanel() {
                return $('demand-video');
            },
            get videoSelector() {
                return ()=> {return $('#__video', $('demand-video').shadowRoot)};
            },
            get infoPanel() {
                return $('demand-video').parentNode;
            }
        }
    }

    function mxdm() {
        GM_addStyle('.index-logo {margin-right: 400px;margin-top: -20px;height:50px;} .fullPage {overflow:hidden;} .fullPage #player{position:fixed !important;z-index:999999;}');
        let tfp = ()=> {
            if (document.fullscreen) {
                document.exitFullscreen();
            } else {
                if ($('body').classList.contains('fullPage')) {
                    $('body').classList.remove('fullPage');
                    document.fullPage = false;
                } else {
                    $('body').classList.add('fullPage');
                    document.fullPage = true;
                }
            }
        };
        let rebuildDPFP = btn => {
            let cBtn = btn.cloneNode(true);
            btn.replaceWith(cBtn);
            cBtn.onclick = tfp;
        };
        waitForElements({selector: '.dplayer-full-in-icon', callback: rebuildDPFP});
        return {
            toggleFullPage: tfp,
            toggleFullScreen: function() {
                //$('.leleplayer-full .leleplayer-full-icon').click();
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('#player') && $('#player').requestFullscreen();
                }
            },
            updateVolumeBar: function() {
                if ($('.leleplayer-volume-bar-inner')) {
                    $('.leleplayer-volume-bar-inner').style.width = Math.round(video.volume * 100) + '%';
                } else if ($('.dplayer-volume-bar-inner')) {
                    $('.dplayer-volume-bar-inner').style.width = Math.round(video.volume * 100) + '%';
                }
            },
            get wheelPanel() {
                return $('#player, video');
            },
            get infoPanel() {
                return $('#player') || $('video').parentNode;
            },
            get title() {
                return $('h1.page-title').textContent + (($('.episode'))? ' ' + $('.episode').textContent : '');
            }
        }
    }

    function agefans() {
        // var allVideo = $All('video');
        // if (allVideo.length > 1) {
        //     for (i = 0; i < allVideo.length - 1; i++) {
        //         allVideo[i].parentNode.parentNode.remove();
        //     }
        // }
        return {
            toggleFullPage: function() {
                var fpb = $('.fullscn', parent.document);
                if (fpb) {
                    if (parent.document.fullscreen) {
                        parent.document.exitFullscreen();
                        if (parent.document.body.style.overflow == 'hidden') {
                            parent.document.body.style.overflow = '';
                            fpb.click();
                        }
                    } else {
                        parent.document.body.style.overflow = ($('#fullplayleft', parent.document))? '' : 'hidden';
                        fpb.click();
                    }
                }
            },
            toggleFullScreen: function() {
                var w = window;
                try {
                    if (parent.document) {
                        w = parent;
                    }
                } catch(e) {}
                var f = $('#age_playfram, iframe, body', w.document);
                if (f) {
                    if (w.document.fullscreen) {
                        w.document.exitFullscreen();
                    } else {
                        f.requestFullscreen();

                    }
                }
            },
            toggleDanmu: function() {
                var btn = $('#dmswitch', parent.document);
                btn && btn.click();
                var sp = $('#vpeCenterInfo');
                if (sp) {
                    sp.textContent = (btn.parentNode.className == 'danmuon')? '弹幕开' : '弹幕关';
                    sp.setAttribute('vpeIcon', '');
                }

            },
            updateProgressBar: function() {
                var w = (video.currentTime / video.duration * 100) + '%';
                var timePb = $('[class^="timeprogressch"]');
                var timeBo = $('[class^="timeboch"]');
                var timeTxt = $('[class^="timetextch"]');
                if (timePb) timePb.style.width = w;
                if (timeBo) timeBo.style.left = 'calc(' + w + ' - 8px)';
                this.durationText = this.durationText || formatTime(video.duration);
                if (timeTxt) {
                    timeTxt.textContent = formatTime(video.currentTime) + ' / ' + this.durationText;
                    //console.log('time set:', timeTxt.textContent);
                }
            },
            updateVolumeBar: function() {
                var vup = $('[class^="volumeup"]');
                var vbo = $('[class^="volumebo"]');
                if (vup) vup.style.width = Math.round(video.volume * 60) + 'px';
                if (vbo) vbo.style.left = Math.round(video.volume * 48) + 'px';
            },
            //togglePlayPause: function() {},
            get wheelPanel() {
                return $('#player1, #video, video');
            },
            get infoPanel() {
                return $('#player1, #video') || $('video').parentNode;
            }

        };
    }

    function qqLive() {
        document.addEventListener('mouseup', e => {
            var n = e.target;
            if (e.which == 2 && n.nodeName == "P" && n.getAttribute('href').match(/^\/\d+/)) {
                GM_openInTab(location.origin + n.getAttribute('href'));
            }
        });
        return {
            isLive: true,
            init: function() {
                var bn = $('#block');
                if (bn) {
                    bn.click();
                    setTimeout(()=> {$All('div>[type="checkbox"]', bn.parentNode).forEach(i=>i.click());bn.click();}, 1e2);
                }
            },
            toggleFullPage: function() {
                $('[class*="webfull-screen-btn"] input').click();
            },
            toggleFullScreen: function() {
                $('[class*="fullscreen-btn"]').click();
            },
            toggleDanmu: function() {
                $('[class*="danmu-btn"] input').click();
            },
            get wheelPanel() {
                return $('#live-room-player, video');
            },
            get infoPanel() {
                return $('#live-room-player') || $('video').parentNode;
            }
        }
    }

    function cctv() {
        return {
            isLive: (loc.match(/tv\.cctv\.com\//))? true : false,
            toggleFullPage: function() {
                $('#player_pagefullscreen_player,.vjs-webfullscreen-control').click();
            },
            toggleFullScreen: function() {
                $('#player_fullscreen_player,.vjs-fullscreen-control').click();
            },
            get wheelPanel() {
                return $('#video, video');
            },
            get infoPanel() {
                return $('#player') || $('video').parentNode;
            }
        }
    }


    function huya() {
        return {
            isLive: true,
            updateVolumeBar: function() {
                var v = (video.volume * 85).toFixed(0) + 'px';
                $('.sound-bar').style.width = v;
                $('.sound-btn').style.left = v;
            },
            toggleFullPage: function() {
                $('#player-fullpage-btn').click();
            },
            toggleFullScreen: function() {
                $('#player-fullscreen-btn').click();
            },
            toggleDanmu: function() {

            },
            get wheelPanel() {
                return $('#player-wrap');
            }
        };
    }
    function phub() {
        //html.supportsGridLayout .wrapper .container{max-width:100%;width:100%;}
        GM_addStyle('body.fullpage .wide video-element,body.fullpage  .wide .video-element-wrapper-js{position: fixed !important; width: 100%; height: 100%; z-index: 5; } \
                body.fullpage .dialog.rounded-container{z-index:6;} body.fullpage #header {z-index: -1;} body.fullpage {overflow:hidden;} \
                .mgp_playingState .mgp_bigPlay, .mgp_overlayText, .mgp_contextMenu, #js-abContainterMain, #pb_template{display:none !important;} \
                #hd-rightColVideoPage {max-height: 850px;overflow-y: auto;} \
                .fullpage #player, .fullpage #videoContainer, .fullpage #redtube-player {position: fixed !important;left: 0;top: 0;width: 100%;z-index: 9999;height: 100% !important;} \
                .video-actions-menu {height:20px !important;} #ageDisclaimerMainBG{display:none;} #relatedVideosCenter {width: 125%;} \
                html.supportsGridLayout #header.hasAdAlert {grid-template-rows: auto 0px 40px !important;} .video-actions-container{padding-top:0 !important;} \
                #main-container #player .mgp_bigPlay, #videoWrapper #videoContainer .mgp_bigPlay, #redtube_layout #redtube-player .mgp_bigPlay {position: absolute;left: 15px;top: 15px;width:30px;height:30px;} \
                #modalWrapMTubes {width: 0;height: 0;}');
        // larger preview
        GM_addStyle('.video-box-image:hover {width: 160%;height: 284px;z-index: 13;left: -30%;top: -20%;} #mainContent .video-box-image:hover .thumb-image {height: 284px;max-height: unset;} .video-box-image:hover video {max-height: unset;} .video-box {height: 220px;} \
                #singleFeedSection li.videoblock {height: 265px;} .phimage:hover, #relatedSection .responsiveListing li div.phimage:hover {width: 160%;height: 160%;z-index: 9;left: -30%;top: -20%;} .wrap.flexibleHeight {max-height: 265px;} \
                #main-container #hd-rightColVideoPage{width:400px} #recommendedVideos .phimage:hover {width: 100% !important;height: 100%; left:0;top:0;} #recommendedVideos .phimage:hover ~ .thumbnail-info-wrapper {display: none;} #recommendedVideos {grid-row-gap: 5px !important;} \
                .video_thumb_wrap:hover {width: 160%;height: 160%;z-index: 99;left: -30%;}  .videoblock_list, .video_block_wrapper{max-height:200px;} #video_left_col { width: 1200px;} \
                .phimage:hover .linkVideoThumb {height: 288px;} #recommendedVideos .phimage:hover .linkVideoThumb {height: 215px;} .responsiveListing > li a .videoPreviewEl {width:100%;height:100%;z-index:11;} #relatedSection .responsiveListing li div.phimage, .responsiveListing > li a img {height: 100%;width: 100%;} #relatedSection .responsiveListing li{height:180px}');
        if (loc.match('pornhub.com') && getCookie('accessAgeDisclaimerPH') != '1') {
            setCookie('accessAgeDisclaimerPH', '1', 9999, '.pornhub.com');
            setCookie('lang', 'en', 9999, '.pornhub.com');
            if (!loc.match('www.pornhub.com')) {
                location.href = loc.replace(/https?:\/\/\w+\.pornhub\.com/, 'https://www.pornhub.com');
            }
        } else if (loc.match('youporn.com') && getCookie('access') != '1') {
            setCookie('access', '1', 9999, 'www.youporn.com');
        } else if (loc.match('tube8.com') && getCookie('access') != '1') {
            setCookie('access', '1', 9999);
        } else if (loc.match('thumbzilla.com')) {
            setCookie('accessAgeDisclaimerTZ', '1', 9999, '.thumbzilla.com');
        } else if (loc.match('redtube.com')) {
            setCookie('showAgeDisclaimer', '1', 9999, 'www.redtube.com');
        }
        var vf = $('#modalWrapMTubes .buttonOver18, #accessButton,#btn_agree');
        if (vf) vf.click();
        var ls = JSON.parse(localStorage.mgp_player || '{}');
        if (!ls.quality || ls.quality && ls.quality.quality != 1080) {
            ls.quality = {auto: false, quality: 1080};
            localStorage.mgp_player = JSON.stringify(ls);
        }
        var wideNode = '#player, #videoContainer, #redtube-player';
        return {
            videoVolume: 0.2,
            eventCpt: true,
            init: function() {
                if (ls.cinemaMode) {
                    $('body').classList.add('fullpage');
                    if ($(wideNode)) $(wideNode).classList.add('wide');
                }
                if ($('.mgp_cinema [data-text="Large Player"]')) {
                    $('.mgp_cinema [data-text="Large Player"]').onclick = e =>{$('body').classList.add('fullpage');$(wideNode).classList.add('wide');};
                }
                if ($('.mgp_cinema [data-text="Small Player"]')) {
                    $('.mgp_cinema [data-text="Small Player"]').onclick = e =>{$('body').classList.remove('fullpage');$(wideNode).classList.remove('wide')};
                }
            },
            toggleFullPage: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('body').classList.toggle('fullpage', !$(wideNode).classList.contains('wide'));
                    $(wideNode).classList.toggle('wide', $('body').classList.contains('fullpage'));
                    if ($('[class$="_cinema"],[class*="_cinema"][class$="_active"]')) {
                        $('[class$="_cinema"],[class*="_cinema"][class$="_active"]').dispatchEvent(new Event('mouseup'));
                    }
                }
            },
            toggleFullScreen: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('[class$="_fullscreen"],[class*="_fullscreen"][class$="_active"], .mgp_fullscreen').dispatchEvent(new Event('mouseup'));
                }
            },
            get wheelPanel() {
                return $('.mgp_eventCatcher, video-element,.video-element-wrapper-js');
            },
            get videoSelector() {
                return '[class$="_videoWrapper"] video';
            }
        };
    }

    function xvideos() {
        GM_addStyle('.fullpage #hlsplayer {position: fixed !important;left: 0;top: 0;width: 100%;z-index: 999;height: 100% !important;} \
            body.fullpage {overflow:hidden;} .fullpage #page.video-page #content{z-index:999;} .videoad-title {  display: none; }');
        // Larger preview
        GM_addStyle('.thumb-inside:hover {width: 160%;height: 160%;z-index: 88;overflow: unset;left: -30%;}');
        var vl = JSON.parse(localStorage.player_volume || '{}');
        if (vl.value != 0.2) {
            vl.value = 0.2;
            vl.expired = 2048497390.144;
            localStorage.player_volume = JSON.stringify(vl);
        }
        return {
            videoVolume: 0.2,
            init: function() {
                if ($('img[title="Double player size"]')) {
                    $('img[title="Double player size"]').onclick = e => {$('body').classList.toggle('fullpage');};
                }
            },
            toggleFullPage: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('body').classList.toggle('fullpage');
                }
            },
            toggleFullScreen: function() {
                $('img[title="Fullscreen"]').click();
            },
            updateVolumeBar: function() {
                if ($('.volume-bar-fill')) {
                    $('.volume-bar-fill').style.width = `${video.volume*100}%`;
                }
            },
            get wheelPanel() {
                return $('#hlsplayer');
            },
            get videoSelector() {
                return '#hlsplayer video';
            }
        };
    }

    function xhamster() {
        GM_addStyle('.fullpage #player-container {position: fixed !important;left: 0;top: 0;width: 100%;z-index: 999;height: 100% !important;} \
            body.fullpage {overflow:hidden;} .fullpage main {z-index:9;} .desktop-dialog-open:has(.parental-control-dialog) {display: none;} \
            [data-role="promo-messages-wrapper"], [class^="cookiesAnnounce"]{display:none !important;}');
        // Larger preview
        GM_addStyle('.thumb-list--sidebar .thumb-list__item .thumb-image-container:hover {width: 160%;height: 240px;z-index: 9;left: -30%;}  .thumb-list__item.video-thumb.video-thumb--type-video:hover {height: 240px;}');
        if ($('[data-role="parental-control-confirm-button"]')) {
            $('[data-role="parental-control-confirm-button"]').click();
        }
        let ls = JSON.parse(localStorage['x-player-settings'] || '{}');
        if (ls.quality != '1080p') {
            ls.quality = '1080p';
            localStorage['x-player-settings'] = JSON.stringify(ls);
        }
        if (getCookie('parental-control') != 'yes') {
            setCookie('parental-control', 'yes', 9999, '.xhamster.com');
            GM_addStyle('.xh-scroll-disabled{overflow:auto;}');
        }
        return {
            videoVolume: 0.2,
            init: function() {
                if ($('.large-mode')) {
                    $('.large-mode').onmouseup = e =>{
                        $('body').classList.toggle('fullpage', !$('.large-mode[data-xp-tooltip="Exit large mode"]'));
                    }
                }
            },
            toggleFullPage: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('body').classList.toggle('fullpage', !$('.large-mode[data-xp-tooltip="Exit large mode"]'));
                    if ($('.large-mode')) {
                        $('.large-mode').click();
                    }
                }
            },
            toggleFullScreen: function() {
                $('.fullscreen-button').click();
            },
            get wheelPanel() {
                return $('#player-container');
            },
            get videoSelector() {
                return '#player-container video';
            }
        };
    }

    function hanime() {
        return {
            videoVolume: 0.2,
            toggleFullPage: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('button.vjs-icon-square').click();
                }
            },
            toggleFullScreen: function() {
                $('button.vjs-fullscreen-control').click();
            },
            get wheelPanel() {
                return $('#primary_video');
            }
        };
    }
    function hanime1() {
        $All('img').forEach(i=>i.setAttribute("loading", "lazy"));
        GM_addStyle('body.fullpage .plyr--video {position: fixed;width: 100%;z-index: 99999;top: 0;left: 0;height: 100%;} body.fullpage {overflow:hidden;} \
            #player-div-wrapper .plyr--hide-controls .plyr__controls {opacity: 1; transform: translateY(calc(100% - 30px));} .plyr__time {margin-left: 0;margin-right: auto;} \
            #player-div-wrapper .plyr--hide-controls input[type="range"]::-moz-range-track, #player-div-wrapper .plyr--hide-controls input[type="range"]::-moz-range-progress {height: 3px;} \
            #player-div-wrapper .plyr--hide-controls input[type="range"]::-moz-range-thumb {height: 5px; border-radius: 30%;} .plyr__time::after{content:attr(duration);} \
            #player-div-wrapper .plyr__controls__item:first-child {margin-right:0;} .plyr__progress__container {position: absolute;width: 100%;top: 18px; right:0;} \
            #player-div-wrapper .plyr__progress__buffer::-moz-progress-bar {background: aliceblue;} .plyr__time--current {margin-right: 0;} \
            .plyr--hide-controls .plyr__progress__buffer::-moz-progress-bar {height: 3px;margin-top: 1px;}');
        return {
            videoVolume: 0.2,
            eventCpt: true,
            init: function() {
                let pv = $('.plyr--video');
                if (pv) {
                    pv.onkeydown = pv.onkeyup = pv.onkeypress = $('body').onkeydown = null;
                }
                let sk = $('[id^=plyr-seek-]');
                let nsk = sk.cloneNode(true);
                sk.style.display = 'none';
                sk.parentNode.appendChild(nsk);
                sk.remove();
                let bb = $('.plyr__progress__buffer');
                let nbb = bb.cloneNode(true);
                bb.style.display = 'none';
                bb.parentNode.appendChild(nbb);
                bb.remove();
                let v = $('video');
                if (v) {
                    setInterval(()=> {
                        let bl = v.buffered;
                        if (bl && bl.length > 0) {
                            nbb.value = v.buffered.end(bl.length - 1) * 100 / v.duration;
                        }
                    }, 2e3);
                    nsk.onchange = function(e) {
                        v.currentTime = nsk.value * v.duration / 100;
                    };
                    nsk.onfocus = function(e) {
                        e.target.blur();
                        v.focus();
                    };
                    v.ontimeupdate = function(e) {
                        nsk.value = v.currentTime * 100 / v.duration;
                        // if (v.currentTime < 3 && $('.plyr__time').textContent.match('-')) {
                        //     $('.plyr__time').click();
                        // }
                    };
                    v.onseeking = function(e) {
                        nsk.value = v.currentTime * 100 / v.duration;
                    };
                    // if (v.duration) {
                    //     $('.plyr__time').setAttribute('duration', ' / ' + formatTime(v.duration));
                    // } else {
                    //     v.ondurationchange = e => {
                    //         $('.plyr__time').setAttribute('duration', ' / ' + formatTime(v.duration));
                    //     };
                    // }
                }
                var dBtn = $('#downloadBtn');
                if (dBtn) {
                    GM_addStyle('#downloadBtn {left:0; position: relative;   display: inline-block;   border-bottom: 1px dotted black; } #downloadBtn .downDetail \
                        {   visibility: hidden;   width: 120px;   background-color: black;   color: #fff;   text-align: center;   border-radius: 6px;   \
                        padding: 5px 0;   position: absolute;   z-index: 1;   top: 100%;   left: 50%;   margin-left: -60px; }  #downloadBtn:hover .downDetail \
                        {   visibility: visible; } .video-buttons-wrapper {overflow-y: unset !important;}');
                    dBtn.appendChild($C('div', {class: 'downDetail', title:'点击复制链接'}));
                    $All('#player source').forEach(s => {
                        var c = $C('div');
                        var a = $C('a', {href: s.src, target:'_blank', text: s.getAttribute('size')});
                        a.onclick = e => {
                            e.preventDefault();
                            GM_setClipboard(a.href);
                        }
                        c.appendChild(a);
                        $('.downDetail').appendChild(c);
                    });
                }
            },
            toggleFullPage: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('body').classList.toggle('fullpage');
                }
            },
            toggleFullScreen: function() {
                $('[data-plyr="fullscreen"]').click();
            },
            whenVideoPlaying: function() {
                if ($('.plyr__poster')) {
                    $('.plyr__poster').style.display = 'none';
                }
            },
            get wheelPanel() {
                return $('.plyr--video');
            }
        };
    }

    function hentaicity() {
        GM_addStyle('#playerz .fluid_theatre_mode {top: 0;z-index: 2048;height: 100% !important;} html:has(.fluid_theatre_mode) {overflow: hidden;}');
        return {
            videoVolume: 0.2,
            disabledKey: ['ArrowUp', 'ArrowDown', 'ArrowLeft','ArrowRight'],
            toggleFullScreen: function() {
                $('.fluid_button_fullscreen').click();
            },
            toggleFullPage: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('.fluid_button_theatre').click();
                }
            },
            get wheelPanel() {
                return $('.fluid_video_wrapper_video-id,video');
            }
        }
    }

    function common() {
        return {
            videoVolume: 0.2,
            toggleFullScreen: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                } else {
                    $('video').requestFullscreen();
                }
            },
            get wheelPanel() {
                return $('video');
            }
        }
    }
    function youtube() {
        GM_addStyle('#player-container-id.fullpage {position: fixed; z-index: 5; width: 100%; top: 0; bottom: 0; background: black; } .dialog-container{z-index: 6 !important;} .fullpage .html5-main-video { width: 100% !important; height: auto !important; } .html5-video-container{height:100%;}');
        return {
            toggleFullPage: function() {
                if ($('#player-container-id')) {
                    $('#player-container-id').classList.toggle('fullpage');
                } else {
                    $('button.ytp-size-button')?.click();
                }
            },
            toggleFullScreen: function() {
                $('button.ytp-fullscreen-button, button.fullscreen-icon').click();
            },
//             togglePlayPause: function() {

//             },
            get infoPanel() {
                return $('#ytd-player, #player-container-id');
            }
        };
    }

    function getClock() {
        var cNode = $C('span', {'class': 'clock'});
        var startTime = ()=> {
            const today = new Date();
            let h = today.getHours();
            let m = today.getMinutes();
            let s = today.getSeconds();
            if ((m == 29 || m == 59) && s > 45 || (m == 30 || m == 0) && s < 15) {
                infoDiv.style.opacity = '1';
                if (s == 14) {
                    setTimeout(()=>{infoDiv.style.opacity = '0';}, 1e3);
                }
            }
            m = (m<10)? '0' + m : m;
            s = (s<10)? '0' + s : s;;
            cNode.innerHTML =  h + ":" + m + ":" + s;
        };
        setInterval(startTime, 1000);
        return cNode;
    }

})();
