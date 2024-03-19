// ==UserScript==
// @name        Video Player Enhancement
// @version     0.1.1
// @description
// @include     /https?:\/\/(www|m|v)\.douyu(tv)?\.com/.*/
// @include     /https?:\/\/live\.bilibili\.com/.+/
// @include     https://www.huya.com/*
// @include     /https://www\.age(fans|mys|dm)\.[\w]+\/(age\/)?player\/.+/
// @include     /https:\/\/(www|m)\.youtube\.com\/watch.+/
// @match       https://*.sp-flv.com*/*
// @match       https://*.pornhub.com/*
// @match       https://live.qq.com/*
// @match       https://*.cctv.com/*
// @include     /https?:\/\/[\w]+\.(mxdm\d\.com|wjys\.cc)\/.*/
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// @grant       unsafeWindow
// @grant       GM_addStyle
// ==/UserScript==

(function(){
    var loc = location.href;
    var video, infoPanel, infoDiv = $('#vpeInfoPanel') || $C("div", {id: 'vpeInfoPanel'});;
    var volumeStep = 0.05;
    var playbackTurbo = 2;
    var playbackRateTemp = 1;
    var conf = {};
    var vpeInited = false;
    if (loc.includes('douyu.com')) {
        conf = loc.includes('v.douyu.com')? douyuVideo() : douyu();
    } else if (loc.includes('live.bilibili.com')) {
        conf = bilibililive();
    } else if (loc.includes('huya.com')) {
        conf = huya();
    } else if (loc.match(/age(fans|dm)\.[\w]+|sp-flv\.com/)) {
        conf = agefans();
    } else if (loc.match(/vip\.mfhd\.me|pornhub\.com|ph666.me/)) {
        conf = phub();
    } else if (loc.match(/\.youtube\.com\/watch/)) {
        conf = youtube();
    } else if (loc.match(/live\.qq\.com\/\d+/)) {
        conf = qqLive();
    } else if (loc.match(/\.cctv\.com\//)) {
        conf = cctv();
    } else if (loc.match(/mxdm\d\.com|wjys\.cc/)) {
        conf = mxdm();
    }

    vpe(conf);

    function vpe(configs) {
        GM_addStyle('#vpeInfoPanel {text-align: center;opacity: 0;cursor: default;} \
            #vpeCenterInfo{white-space: pre-line;position: absolute;left: 50%;top: 50%;transform:translate(-50%, -50%);width: auto;height: 30px;font-weight: 1000;font-size: 24px;-webkit-text-fill-color: #fff;-webkit-text-stroke: 1px #000;font-weight: 1000;z-index: 9999;} \
            #vpeTopInfo {position: absolute;left: 0;top: 0;font-size: 20px;width: auto;height: 30px;z-index: 9999;color:#db3c8e;text-shadow: black 1px 0px 1px, black 0px 1px 1px, black 0px -1px 1px, black -1px 0px 1px;} \
            .vpeIcon::before {content: attr(vpeIcon);display:inline-block;width:36px;}'); //color: transparent;text-shadow: 0 0 0 #dd318a;-webkit-text-fill-color: transparent;-webkit-text-stroke: transparent;
        var c = configs || {};
        var vs = configs.videoSelector || 'video';
        var vpeInit = ()=> {
            if (!video) return;
            if (c.videoVolume) video.volume = c.videoVolume;
            else if (localStorage.videoVolume) video.volume = localStorage.videoVolume;
            infoPanel = c.infoPanel || video.parentNode;
            var clearTimer = 0;
            var icon = '';
            var centerSpan = $('#vpeCenterInfo') || $C("span", {id:'vpeCenterInfo'});
            var topSpan = $('#vpeTopInfo') || $C("span", {id:'vpeTopInfo'});
            infoDiv.appendChild(centerSpan);
            infoDiv.appendChild(topSpan);
            infoPanel.appendChild(infoDiv);
            var wheelPanel = c.wheelPanel || infoPanel;
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
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            };
            var toggleDanmu = c.toggleDanmu || function() {

            };
            unsafeWindow.toggleInfoPanel = (info) => {
                if (!$('#vpeInfoPanel')) {
                    infoPanel.appendChild(infoDiv);
                }
                if (infoDiv.isFrozen) return;
                if (info) centerSpan.textContent = info;
                infoDiv.style.opacity = '1';
                infoDiv.style.transition = 'all 0.3s ease';
                if (clearTimer) {
                    clearTimeout(clearTimer);
                }
                clearTimer = setTimeout(()=>{
                    centerSpan.classList.remove('vpeIcon');
                    infoDiv.style.opacity = '0';
                    centerSpan.textContent = '';
                    infoDiv.style.transition = 'all 0.5s ease 1s';
                }, 1e3);
            };
            var changeVolume = (step) => {
                if (video.volume + step >= 1) {
                    video.volume = 1;
                } else if (video.volume + step <= 0) {
                    video.volume = 0;
                } else {
                    video.volume += step;
                }
                if (video.volume > 0.66) {
                    icon = '🔊 ';
                } else if (video.volume > 0.33) {
                    icon = '🔉 ';
                } else if (video.volume > 0) {
                    icon = '🔈 ';
                } else {
                    icon = '🔇 ';
                }
                //centerSpan.setAttribute('vpeIcon', icon);
                //centerSpan.classList.add('vpeIcon');
                toggleInfoPanel(icon + (video.volume * 100).toFixed(0));

                if (updateVolumeBar) updateVolumeBar();
            };
            var seekVideo = function(offset) {
                if (conf.isLive || video.duration === Infinity) {
                    return;
                }
                var t;
                if (video.currentTime + offset >= video.duration) {
                    t = video.duration - 0.1;
                } else if (video.currentTime + offset < 0) {
                    t = 0;
                } else {
                    t = video.currentTime + offset;
                }
                video.currentTime = t;
                // var str = formatTime(t) + '\n' + ((offset>0)? '⏩ +' + offset : '⏪ ' + offset)  + 's';
                var str = ((offset>0)? '⏩ ' : '⏪ ') + formatTime(t);
                toggleInfoPanel(str);
                updateProgressBar();
            };
            var changeVideoRate = (r, abs) => {
                video.playbackRate = abs? video.playbackRate = r : video.playbackRate + r;
                var ri = (Number(video.playbackRate.toFixed(2)) == 1)? '▶ ' : '⏩ ';
                toggleInfoPanel(ri + video.playbackRate.toFixed(2).replace(/0$/, '') + 'x');
            };
            wheelPanel.addEventListener('wheel', e => {
                var d = (Math.abs(e.deltaY) > Math.abs(e.deltaX))? e.deltaY : e.deltaX;
                var step = (d>0)? -volumeStep : volumeStep;
                e.preventDefault();
                e.stopPropagation();
                changeVolume(step);
            });
            wheelPanel.addEventListener('mousedown', e => {
                if (e.which == 1 && conf.isLive && !isTextNode(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                } else if (e.which == 2 && !isTextNode(e.target)) {
                    toggleFullPage();
                }
            });
            video.addEventListener('click', e => {
                if (e.detail == 1 && conf.isLive && !isTextNode(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            wheelPanel.addEventListener('dblclick', e => {
                toggleFullScreen();
                e.preventDefault();
                e.stopPropagation();
            });
            wheelPanel.onmousemove = ()=> toggleInfoPanel();
            document.addEventListener('keydown', e => {
                if (isTextNode(e.target)) {
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
                    case 'ArrowLeft': seekVideo(-5); break;
                    case 'ArrowRight': seekVideo(5); break;
                    case 'Space': togglePlayPause(); break;
                    case 'Equal':;
                    case 'NumpadAdd': changeVideoRate(0.05);break;
                    case 'Minus':;
                    case 'NumpadSubtract': changeVideoRate(-0.05);break;
                    case 'KeyR':;case 'NumpadMultiply':;case 'Backslash':;case 'KeyS': changeVideoRate(1, true);break;
                    case 'ControlRight': if (video.playbackRate != playbackTurbo) {playbackRateTemp = video.playbackRate; changeVideoRate(playbackTurbo, true);}break;
                    case 'ShiftRight': if (video.playbackRate != playbackTurbo + 1) {playbackRateTemp = video.playbackRate; changeVideoRate(playbackTurbo + 1, true);}break;
                    case 'Period':;
                    case 'Numpad6': if (video.playbackRate != playbackTurbo + 2) {playbackRateTemp = video.playbackRate; changeVideoRate(playbackTurbo + 2, true);}break;
                }
            }, true);
            document.addEventListener('keyup', e => {
                if (isTextNode(e.target)) {
                    return;
                }
                switch(e.code) {
                    case 'ControlRight':;
                    case 'ShiftRight':;
                    case 'Period':;
                    case 'Numpad6': changeVideoRate(playbackRateTemp, true);break;
                }
            },true);

            window.addEventListener('beforeunload', e => {
                localStorage.videoVolume = video.volume;
            });
            vpeInited = true;
        };

        // var timer = setInterval(()=>{
        //     if ($('video')) {
        //         video = $('video');
        //         clearInterval(timer);
        //         vpeInit();
        //     }
        // }, 1e3);
        if ($(vs)) {
            video = $(vs);
            vpeInit();
        } else if (configs.isShadowRoot) {
            var srCount = 0;
            var sri = setInterval(()=>{
                video = configs.video;
                if (video || srCount++ > 20) {
                    vpeInit();
                    clearInterval(sri);
                }
            }, 1e3);
        }
        GM_addStyle(`${vs} {animation:h5videoload 1ms; outline:none;} @keyframes h5videoload{from{opacity:.9;}to{opacity:1;}}`);
        document.addEventListener('animationstart', e => {
            if (e.animationName == 'h5videoload') {
                video = $(vs);
                if (!vpeInited) {
                    vpeInit();
                }
            }
        });
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
            get video() {
                return $('#__video', $('demand-video').shadowRoot);
            },
            get infoPanel() {
                return $('demand-video').parentNode;
            }
        }
    }

    function mxdm() {
        GM_addStyle('.index-logo {margin-right: 400px;margin-top: -20px;height:50px;}');
        return {
            toggleFullPage: function() {
                if (document.fullscreen) {
                    document.exitFullscreen();
                }
                if ($('body').style.overflow == 'hidden') {
                    $('body').style.overflow = 'auto';
                    $('#player').style.position = 'absolute';
                    $('#player').style.zIndex = 'auto';
                } else {
                    $('body').style.overflow = 'hidden';
                    $('#player').style.position = 'fixed';
                    $('#player').style.zIndex = '999999';
                }
            },
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
                }
            },
            get wheelPanel() {
                return $('#player, video');
            },
            get infoPanel() {
                return $('#player, video') || $('video').parentNode;
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
        return {
            isLive: true,
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
        GM_addStyle('body.fullpage .wide video-element,body.fullpage  .wide .video-element-wrapper-js{position: fixed !important; width: 100%; height: 100%; z-index: 5; } \
                body.fullpage .dialog.rounded-container{z-index:6;} body.fullpage #header {z-index: -1;} body.fullpage {overflow:hidden;}');
        return {
            videoVolume: 0.2,
            toggleFullPage: function() {
                $('body').classList.toggle('fullpage', !$('#player').classList.contains('wide'));
                $('[class$="_cinema"],[class*="_cinema"][class$="_active"]').dispatchEvent(new Event('mouseup'));
            },
            toggleFullScreen: function() {
                $('[class$="_fullscreen"],[class*="_fullscreen"][class$="_active"]').dispatchEvent(new Event('mouseup'));
            },
            get wheelPanel() {
                return $('video-element,.video-element-wrapper-js');
            },
            get videoSelector() {
                return '[class$="_videoWrapper"] video';
            }
        };
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
            togglePlayPause: function() {

            },
            get infoPanel() {
                return $('#ytd-player, #player-container-id');
            }
        };
    }


})();
