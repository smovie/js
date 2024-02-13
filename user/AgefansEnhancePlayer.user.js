// ==UserScript==
// @name        Agefans enhance player
// @namespace   Violentmonkey Scripts
// @include     /https://www\.age(fans|mys|dm)\.[\w]+/
// @match       https://*.sp-flv.com*/*
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_openInTab
// @version     1.2.3
// @author      waiwai
// @description 2/22/2020, 2:05:35 PM, backup site: www.agefans.cc
// ==/UserScript==

(function() {
    console.clear = ()=> {};
    //history.replaceState(null,'', 'https://www.agefans.tv/play/20170087?playid=3_4')
    //document.querySelector('.movurl[style*="display: block"] [href="'+location.pathname+location.search+'"]')
    //&getplay_url=%2F_getplay%3Faid%3D20180103%26playindex%3D3%26epindex%3D12%26r%3D0.6593442611036935&vlt_l=0&vlt_r=0

    //bgm.tv search api: https://api.bgm.tv/search/subject/{name}?type=2
    //bgm.tv detail api: https://api.bgm.tv/subject/{subject_id}?responseGroup=medium , responseGroup can be small or medium or large

    var maxHistory = 100;
    var oLoc = location.origin;
    var danmuSet = {}, currentSsid, isDmNotFound = false;
    const dmFilters = getDanmuFilter();
    var totalRetry = 0;
    var fkey;
    var getTK = dir => {
        var cur = document.querySelector('.movurl[style*="block"] [href="'+location.pathname+location.search+'"]');
        if (cur) {
            var node, li;
            if (dir == 'next' || dir == 'ended') {
                li = cur.parentNode.nextElementSibling;
                node = li && li.querySelector('a');
            } else if (dir == 'prev') {
                li = cur.parentNode.previousElementSibling;
                node = li && li.querySelector('a');
            } else if (dir == 'reload') {
                node = cur;
            }
            if (node) {
                var nhref = node.href;
                console.log(nhref);
                clearCookies();
                XHR({url:nhref, headers: {Referer:location.href, "Pragma": "no-cache", "Cache-Control": "no-cache"} }).then(r=>{
                    var dom = new DOMParser().parseFromString(r, "text/html");
                    document.title = dom.title;
                    // var t1 = getCookie('t1');
                    // var t2 = new Date().getTime();
                    // var k1 = getCookie('k1');
                    // var tt1 = Math.round(Number(t1) / 0x3e8) >> 0x5;
                    // var k2 = (tt1 * (tt1 % 0x1000) + 0x99d6) * (tt1 % 0x1000) + tt1;
                    // setCookie('t2', t2, 30);
                    // setCookie('k2', k2, 30);
                    history.replaceState(null,'', nhref);
                    __getplay_pck();
                    __getplay_pck2();
                    cur.style = '';
                    node.style = 'border: 1px solid rgb(238, 0, 0); color: rgb(238, 0, 0);';
                    var retryTimes = 0;
                    var errorProc = emsg => {
                        if (totalRetry > 2) {
                            console.log("Retry failed!!!");
                        } else if (retryTimes >= 3) {
                            console.log("retry Times ", retryTimes, "total retry:", retryTimes * totalRetry);
                            totalRetry++;
                            retryTimes = 0;
                            history.replaceState(null,'', cur.href);
                            setTimeout(()=>getTK(dir), 1e3);
                        } else {
                            // setCookie('t2', new Date().getTime(), 30);
                            console.log(emsg);
                            retryTimes++;
                            setTimeout(getVurl, 1e3);
                        }
                    };
                    // var purl = __age_cb_getplay_url();
                    // var apiUrl = location.origin + purl;// + "&r2=1" for iframe
                    var count = 0;
                    var getVurl = ()=> {
                        if (count++ > 3) {
                            return;
                        }
                        $('iframe').src = '';
                        __yx_SetMainPlayIFrameSRC("age_playfram", __age_cb_getplay_url);
                        setTimeout(()=>{
                            var fsrc = $('iframe').src;
                            if (fsrc == '' || fkey && !fsrc.match(fkey)) {
                                //getVurl();
                                console.log('get video failed!');
                            }
                        }, 2e3);
                    };

                    getVurl();

                });
            }
        }
    };

    var top = document.querySelector('#top');
    if (top) {
        GM_addStyle('.history {float: right;text-align: right;cursor: pointer; } .history .label {text-align: center;} \
            .history .hday {color:#60b8cc;border-top: 1px solid #e5e9ef;} .history .hday::before {content: attr(hday);} .history .htext{margin-right:5px;max-width: 315px;} \
            .history .hptext{float:right;} .history span {overflow: hidden;text-overflow: ellipsis;display: inline-block;} .history li {display: inline-block;width:100%;} \
            .hpanel ul li:hover {background:black;} #fav_panel li a {width:90%;} #fav_panel .favdelbtn {display:none;float:right;} #fav_panel li:hover .favdelbtn {display:block;} \
            .history .hpanel {line-height: initial;overflow: hidden auto;width: max-content;max-height: 350px;display:none;text-align: left;max-width: 400px;position: absolute;transform: translateX(-50%);;background:#606061d0;box-shadow: rgba(21, 20, 20, 0.58) 0px 2px 4px;border: 1px solid #4d4646;border-radius: 4px 4px 4px 4px;z-index: 100;scrollbar-color: darkred black;} \
            .hpanel a {display: inline-block;white-space: nowrap;width:100%;} .history:hover .hpanel {display:block;} .favbtn{margin-left: 5px;margin-top: 2px;} .favbtn a {text-decoration: none;} \
            .history li.hday:hover {background: unset;} .addfav, .delfav {cursor: pointer;} \
            .bilisearch::before, .bgmsearch::before{content:"🔍"} .bilisearch::after{content:"📺";color:rgba(0,0,0,.4);text-shadow:0 0 #00a1d6;} .bgmsearch::after{content:"📺";color:rgba(0,0,0,.4);text-shadow:0 0 #f09199;} \
            .addfav::before {content:"📥加入收藏";} .delfav::before {content:"📤移出收藏";} .rateresult li img {min-height: 60px;}');

        var compareDays = (today, compday) => {
            return new Date(today.toLocaleDateString()).getTime() - new Date(compday.toLocaleDateString()).getTime();
        };
        var setHistoryMenu = ()=> {
            var hDiv = document.createElement('div');
            var hDivTxt = document.createElement('div');
            hDiv.className = 'history nav_button';
            hDivTxt.textContent = '历史';
            hDivTxt.className = 'label';
            hDiv.appendChild(hDivTxt);
            var hPanel = document.createElement('div');
            hPanel.className = 'hpanel';
            hDiv.appendChild(hPanel);
            top.appendChild(hDiv);
            var setPanel = ()=> {
                var h = GM_getValue('playHistory') || {};
                if (Object.keys(h).length == 0) { // try load record from GM storage
                    h = JSON.parse(localStorage.playHistory || '{}');
                }
                hPanel.innerHTML = '';
                var ul = document.createElement('ul');
                var sks = Object.keys(h).sort((a,b)=>Number(h[b].ts) - Number(h[a].ts));
                if (sks.length == 0) {
                    hPanel.textContent = '还没有历史记录！';
                } else {
                    sks = sks.slice(0, maxHistory);
                    var d = new Date();
                    var createMenu = (k, day) => {
                        if (day && !ul.querySelector('[hday=' + day + ']')) {
                            var dli = document.createElement('li');
                            dli.className = 'hday';
                            dli.setAttribute('hday', day);
                            ul.appendChild(dli);
                        }
                        var li = document.createElement('li');
                        var a = document.createElement('a');
                        var spt = document.createElement('span');
                        spt.className = 'htext';
                        spt.textContent = h[k].tt;
                        spt.title = h[k].tt;
                        a.appendChild(spt);
                        var spp = document.createElement('span');
                        spp.className = 'hptext';
                        var perc = (h[k].vct / h[k].vd * 100).toFixed(0);
                        spp.textContent = (isNaN(perc)? 0 : ((perc > 100)? 100 : perc)) + '%';
                        a.appendChild(spp);
                        a.href = oLoc + '/play/' + k + '?playid=' + h[k].pidx + '_' + h[k].eidx;
                        li.appendChild(a);
                        ul.appendChild(li);
                    };
                    sks.forEach(k=>{
                        var tsd = new Date(Number(h[k].ts));
                        var cd = compareDays(d, tsd);
                        if (cd == 0) {
                            createMenu(k, '今日');
                        } else if (cd == 24 * 3600 * 1000) {
                            createMenu(k, '昨日');
                        } else if (cd <= 7 * 24 * 3600 * 1000) {
                            createMenu(k, '近一周');
                        } else if (cd <= 30 * 24 * 3600 * 1000) {
                            createMenu(k, '近一月');
                        } else if (cd <= 365 * 24 * 3600 * 1000) {
                            createMenu(k, '近一年');
                        } else if (cd > 365 * 24 * 3600 * 1000) {
                            createMenu(k, '一年前');
                        } else {
                            createMenu(k);
                        }

                    });
                    hPanel.appendChild(ul);
                }
            };
            //setPanel();
            // hDiv.onmouseenter = setPanel;
            hDivTxt.onmouseenter = setPanel;
        };
        setHistoryMenu();

        var setFavMenu = ()=> {
            var hDiv = $C('div', {id: 'fav_panel'});
            var hDivTxt = document.createElement('div');
            hDiv.className = 'history nav_button';
            hDivTxt.textContent = '收藏';
            hDivTxt.className = 'label';
            hDiv.appendChild(hDivTxt);
            var hPanel = document.createElement('div');
            hPanel.className = 'hpanel';
            hDiv.appendChild(hPanel);
            top.appendChild(hDiv);
            var setPanel = (e)=> {
                var f = GM_getValue('fav') || {};
                if (Object.keys(f).length == 0) { // if no record in loacal storage try load from GM storage
                    f = JSON.parse(localStorage.fav || '{}');
                }
                hPanel.innerHTML = '';
                var ul = document.createElement('ul');
                var sks = Object.keys(f).sort((a,b)=>Number(f[b].ts) - Number(f[a].ts));
                if (sks.length == 0) {
                    hPanel.textContent = '还没有收藏记录！';
                } else {
                    var d = new Date();
                    var createMenu = (k, day) => {
                        if (day && !ul.querySelector('[hday=' + day + ']')) {
                            var dli = document.createElement('li');
                            dli.className = 'hday';
                            dli.setAttribute('hday', day);
                            ul.appendChild(dli);
                        }
                        var li = document.createElement('li');
                        var a = document.createElement('a');
                        var spt = document.createElement('span');
                        spt.className = 'htext';
                        spt.textContent = f[k].tt;
                        a.appendChild(spt);
                        a.href = oLoc + '/play/' + k + (f[k]['ep']? ('?playid=' + f[k]['ep']) : '');
                        li.appendChild(a);
                        var delBtn = $C('span', {class:'favdelbtn', title:'移出收藏'});
                        delBtn.textContent = '🗑️';
                        li.appendChild(delBtn);
                        delBtn.onclick = ()=> {
                            ul.removeChild(li);
                            var f = JSON.parse(localStorage.fav || '{}');
                            delete f[k];
                            localStorage.fav = JSON.stringify(f);
                            var gmf = GM_getValue('fav') || {};
                            delete gmf[k];
                            GM_setValue('fav', gmf);
                        };
                        ul.appendChild(li);
                    };
                    sks.forEach(k=>{
                        var tsd = new Date(Number(f[k].ts));
                        var cd = compareDays(d, tsd);
                        if (cd == 0) {
                            createMenu(k, '今日');
                        } else if (cd == 24 * 3600 * 1000) {
                            createMenu(k, '昨日');
                        } else if (cd <= 7 * 24 * 3600 * 1000) {
                            createMenu(k, '近一周');
                        } else if (cd <= 30 * 24 * 3600 * 1000) {
                            createMenu(k, '近一月');
                        } else if (cd <= 365 * 24 * 3600 * 1000) {
                            createMenu(k, '近一年');
                        } else if (cd > 365 * 24 * 3600 * 1000) {
                            createMenu(k, '一年前');
                        } else {
                            createMenu(k);
                        }

                    });
                    hPanel.appendChild(ul);
                }
            };
            //setPanel();
            // hDiv.onmouseenter = setPanel;
            hDivTxt.onmouseenter = setPanel;
            var setFavButton = ()=> {
                var tts = $All('.cell_imform_name, .detail_imform_name, #detailname a');
                var ff = GM_getValue('fav') || {};
                if (Object.keys(ff).length == 0) {
                    ff = JSON.parse(localStorage.fav || '{}');
                }
                tts.forEach(tt => {
                    var txt = tt.innerText;
                    var vid = tt.href? tt.href.match(/\d+/)[0] : location.href.match(/detail\/(\d+)/)[1];
                    var btn = $C('button', {class: 'favbtn', style:'color:#d0e0f0;'});
                    btn.classList.add(ff[vid]? 'delfav' : 'addfav');
                    btn.onclick = ()=> {
                        var f = GM_getValue('fav') || {};
                        var gmf = JSON.parse(localStorage.fav || '{}');
                        if (Object.keys(f).length == 0 && Object.keys(gmf).length != 0) {
                            f = gmf;
                        }
                        if (btn.classList.contains('addfav')) {
                            btn.classList.replace('addfav', 'delfav');
                            f[vid] = {tt: txt, ts: Date.now()};
                            gmf[vid] = f[vid];
                        } else {
                            btn.classList.replace('delfav', 'addfav');
                            delete f[vid];
                            delete gmf[vid];
                        }
                        localStorage.fav = JSON.stringify(f);
                        GM_setValue('fav', gmf);
                    };
                    tt.parentNode.appendChild(btn);
                    // add serch Bilibili button
                    var bbtn = $C('button', {class: 'favbtn'});
                    bbtn.innerHTML = `<a class="bilisearch" href="https://search.bilibili.com/bangumi?keyword=${encodeURIComponent(txt)}" target="_blank" title="B站搜索"></a>`;
                    tt.parentNode.appendChild(bbtn);
                    var bgmbtn = $C('button', {class: 'favbtn'});
                    bgmbtn.innerHTML = `<a class="bgmsearch" href="https://bgm.tv/subject_search/${encodeURIComponent(txt)}?cat=2" target="_blank" title="BGM搜索"></a>`;
                    tt.parentNode.appendChild(bgmbtn);
                });
            };
            setFavButton();
            if (location.href.includes(oLoc + '/search?query=')) {
                var fm = $('#top_search_from');
                var bbtn = $C('button', {class: 'search_input', title: 'B站搜索', style:'float: right;width: auto;border: 1px solid;height: 36px;cursor: pointer;color: rgba(0,0,0,.4); text-shadow: 0 0 #00a1d6; font-size: 20px; line-height: initial; padding: 0 2px;'});
                bbtn.textContent = '📺';
                fm.parentNode.insertBefore(bbtn, fm);
                bbtn.onclick = ()=> {
                    var txt = $('#top_search_input').value;
                    if (txt && txt.trim().length > 0) {
                        GM_openInTab("https://search.bilibili.com/bangumi?keyword=" + encodeURIComponent(txt));
                    }
                    return false;
                };
                var bgmbtn = $C('button', {class: 'search_input', title: 'BGM搜索', style:'float: right;width: auto;border: 1px solid;height: 36px;cursor: pointer;color: rgba(0,0,0,.4); text-shadow: 0 0 #f09199; font-size: 20px; line-height: initial; padding: 0 2px;'});
                bgmbtn.textContent = '📺';
                fm.parentNode.insertBefore(bgmbtn, fm);
                bgmbtn.onclick = ()=> {
                    var txt = $('#top_search_input').value;
                    if (txt && txt.trim().length > 0) {
                        GM_openInTab(`https://bgm.tv/subject_search/${encodeURIComponent(txt)}?cat=2`);
                    }
                    return false;
                };
            }
        };
        setFavMenu();


        var setContinuePlayBtn = ()=> {
            if (location.href.includes('/detail/')) {
                var h = GM_getValue('playHistory') || {};
                var f = GM_getValue('fav') || {};
                var vid = location.href.match(/detail\/(\d+)/)[1];
                var ep;
                if (h[vid]) {
                    ep = h[vid].pidx + '_' + h[vid].eidx
                } else if (f[vid]) {
                    ep = f[vid].ep;
                }
                if (ep) {
                    var lnk = oLoc + '/play/' + vid + '?playid=' + ep;
                    var btn = $C('button', {id:'cpb', class:'favbtn'});
                    btn.innerHTML = '<a href="' + lnk + '" style="color: chartreuse;">继续播放</a>';
                    var pn = $('#playlist-div .blocktitle');
                    if (pn && !$('#cpb')) {
                        pn.appendChild(btn);
                    }
                }
            }
        };

        setContinuePlayBtn();
    }

    if(oLoc.match(/https:\/\/www\.age(fans|mys|dm)\.[\w]+/)) {
        if ($('#top')) {
            beautifyPage_old();
        } else {
            beautifyPage();
        }
    }

    if (location.href.match(oLoc + '/play/')) {
        GM_addStyle('#ssiddatalist {display: none;width: 100px;background: black;color: deeppink;border: 1px solid black;} #ssiddatalist option {color: deeppink;}');
        GM_addStyle('.fullscn {opacity: 0;} #videofilter {font-size: 10px;margin-left: 15px;border: 1px solid currentColor;} #videofilter input[type="text"] {width: 25px;border-width: 1px;border-color: #404041;background: black;}');
        GM_addStyle('#dmopc{display:none;} #dmctr.danmuon:hover #dmopc{display:block}');
        GM_addStyle('.fullpage {position: fixed;  top: 0;  left: 0;  z-index: 999999; }');
        // document.querySelector('.nav_button_current').onclick = ()=> {console.log(document.cookie); getTK();};
        // var cs = document.querySelector('#clickscript') || document.createElement('script');
        // cs.id = 'clickscript';
        // cs.innerHTML = "function clickForIframe() {document.querySelector('.nav_button_current').click(); }";
        // document.head.appendChild(cs);
        var f = $('iframe');
        f.style.background = 'black';
        f.focus();
        f.onload = ()=> {
            if (f.src != location.href) {
                GM_setValue(f.src, [location.href, document.title.replace(/\s*\[.+|\s*-在线观看.+/, ''), document.querySelectorAll('.movurl[style*="block"] li').length]);
            }
        }

        var fbtn = document.querySelector('.fullscn');
        var toggleFullPage = ()=> {
            if (!document.mozFullScreen) {
                if (f.parentNode.id == 'fullplayleft' || document.body.style.overflow == 'hidden') {
                    document.body.style.overflow = '';
                } else {
                    document.body.style.overflow = 'hidden';
                }
                if (fbtn) {
                    fbtn.click();
                } else {
                    f.classList.toggle('fullpage');
                }
            } else {
                document.exitFullscreen();
            }
        };
        var toggleFullScreen = ()=> {
            if (document.fullscreen) {
                document.exitFullscreen();
            } else {
                f.requestFullscreen();
            }
        };
        window.addEventListener("message", evt => {
            var msg = evt.data.msg;
            var dir = ['next', 'prev', 'reload', 'ended'];
            if (msg == 'file' && !fkey && evt.data.file) {
                fkey = evt.data.file;
            } else if(dir.includes(msg)) {
                sessionStorage.isFullScreen = document.mozFullScreen;
                getTK(msg);
            } else if (msg == 'mdlclick') {
                toggleFullPage();
            } else if (msg == 'loaddanmu') {
                loadDanmu();
            }
        }, false);

        // f.addEventListener('mousedown', (e)=> {
        //     if (e.which == 2 && f.src && new URL(f.src).hostname != location.hostname) {
        //         toggleFullPage();
        //     }
        // }, true);

        document.addEventListener('keyup', e => { // for location and iframe not original src
            if (f.src && new URL(f.src).hostname != location.hostname && !isTextNode(e.target)) {
                if (e.code == 'KeyW') {
                    toggleFullPage();
                } else if (e.code == 'KeyF') {
                    toggleFullScreen();
                }
            }
        });

        var setLoadDanmuUI = ()=> {
            var pn = $('#detailname');
            if (pn) {
                $('a', pn).style.float = 'left';
                var dmUIDiv = $C('div', {id:'danmuui', style:'display: inline-flex;float:right;'});
                var ssidInput = $C('input', {id:'ssidtext', type:'text', title:'B站番剧ID', style:'width: 60px;background: black;color: orange;margin-left:5px;'});
                var loadBtn = $C('input', {id:'loaddmbtn',type:'button', value:'B', title:'加载B站弹幕', style:'color:#00a1d6;border: 1px solid;outline:none;cursor: pointer;width: 21px;height: 21px;padding:0;'});
                var ssidDatalist = $C('select', {id:'ssiddatalist',title:'B站相关番剧'});
                var autoLoadSwitch = $C('input', {id:'autoloadswitch', type:'checkbox',style:'margin-left: 5px;'});
                var autoLoadLabel = $C('span', {style:'font-size: 14px;'});
                autoLoadLabel.textContent = '自动载入弹幕';
                var danmu = GM_getValue('danmu') || {};
                var dmBtnColor = danmu.status? '#00a1d6': '#888899';
                var dmCtr = $C('div', {id:'dmctr', style:'width:30px;'});
                var dmOpc = $C('input', {id:'dmopc', type:'range', value:'100', min:'5', max:'100', step:'5', orient:'vertical', title:'弹幕透明度', style:'outline: none;height: 25px;width:8px;position: absolute;margin-top: -25px;margin-left: 30px;'});
                var dmSwitch = $C('input', {id:'dmswitch', type:'button',value: '弹', style:'cursor: pointer;outline: none;margin-left: 5px;font-size: 16px;padding: 0;width: 21px;height: 21px;border: 1px solid;color:' + dmBtnColor});
                dmCtr.appendChild(dmSwitch);
                dmCtr.appendChild(dmOpc);
                dmOpc.value = danmu.opacity? danmu.opacity*100 : 100;
                dmOpc.title = '弹幕透明度:' + dmOpc.value;
                dmOpc.oninput = ()=> {
                    dmOpc.title = '弹幕透明度:' + dmOpc.value;
                    f.contentWindow.postMessage({msg: 'danmuopacity' ,value:dmOpc.value/100}, location.origin);
                };
                dmOpc.onchange = ()=> {
                    danmu = GM_getValue('danmu') || {};
                    danmu.opacity = dmOpc.value/100;
                    GM_setValue('danmu', danmu);
                };
                var videoFilter = $C('div', {id: 'videofilter', title: '设置视频滤镜'});
                videoFilter.innerHTML = '<label>亮度</label><input id="brightness" type="NUMBER" min="0" step="1" value="100" size="4" placeholder="100"><label>对比</label><input id="contrast" type="NUMBER" min="0" step="1" value="100" size="4" placeholder="100"><label>饱和</label><input id="saturate" type="NUMBER" min="0" step="1" value="100" size="4" placeholder="100"><input type="button" value="应用" id="setfilter" style="display:none;"><input type="button" value="重置" id="resetfilter">';
                dmSwitch.filterInfo = '';
                dmSwitch.status = danmu.status? true : false;
                dmCtr.className = danmu.status? 'danmuon' : 'danmuoff';
                dmSwitch.title = danmu.status? '弹幕已开启' : '弹幕已关闭';
                dmSwitch.onclick = ()=> {
                    dmSwitch.status = (dmSwitch.status)? false : true;
                    dmCtr.className = danmu.status? 'danmuoff' : 'danmuon';
                    danmu = GM_getValue('danmu') || {};
                    danmu.status = dmSwitch.status;
                    GM_setValue('danmu', danmu);
                    dmBtnColor = danmu.status? '#00a1d6': '#888899';
                    dmSwitch.style.color = dmBtnColor;
                    dmSwitch.title = danmu.status? '弹幕已开启' + dmSwitch.filterInfo : '弹幕已关闭';
                    f.contentWindow.postMessage({msg: 'danmustatus' ,value:dmSwitch.status}, location.origin);
                };
                loadBtn.onclick = ()=> {
                    if (ssidInput.value && ssidInput.value.match(/\d+/) && currentSsid != ssidInput.value) {
                        var ssId = ssidInput.value.match(/\d+/)[0];
                        loadDanmu(ssId);
                        var avid = location.href.match(/\/play\/(\d+)/)[1];
                        var ssIds = GM_getValue('ssIds') || {};
                        ssIds[avid] = ssId;
                        GM_setValue('ssIds', ssIds);
                    }
                };

                dmUIDiv.appendChild(ssidDatalist);
                dmUIDiv.appendChild(ssidInput);
                dmUIDiv.appendChild(loadBtn);
                // div.appendChild(autoLoadSwitch);
                // div.appendChild(autoLoadLabel);
                dmUIDiv.appendChild(dmCtr);
                dmUIDiv.appendChild(videoFilter);
                //pn.appendChild(dmUIDiv);
                $('#menu0').appendChild(dmUIDiv);

                $('#brightness').onchange = $('#contrast').onchange = $('#saturate').onchange = $('#setfilter').onclick = ()=> {
                    f.contentWindow.postMessage({msg: 'setfilter', value: {b:$('#brightness').value, c:$('#contrast').value, s:$('#saturate').value} }, location.origin);
                };

                $('#resetfilter').onclick = ()=> {
                    $('#brightness').value = $('#contrast').value = $('#saturate').value = '100';
                    f.contentWindow.postMessage({msg: 'resetfilter'}, location.origin);
                };
                var afs = GM_getValue('avFilters') || {};
                var avid = location.href.match(/\/play\/(\d+)/)[1];
                if (afs[avid]) {
                    if (afs[avid].b) $('#brightness').value = afs[avid].b;
                    if (afs[avid].c) $('#contrast').value = afs[avid].c;
                    if (afs[avid].s) $('#saturate').value = afs[avid].s;
                }
            }
        };
        setLoadDanmuUI();

        window.onbeforeunload = ()=> {

        };

    } else if (location.href.match(/(www\.(agefans|agemys|agedm)\.[\w]+\/(age\/)?player\/)|(sp-flv\.com)/)) { // in iframe

        // reset right click menu
        if(window['oncontextmenu']) {
			window['oncontextmenu'] = null;
        }
		window.addEventListener('contextmenu', function(e){ e.stopPropagation(); }, true);

        hideIdleCursor();

        GM_addStyle('.hidecontrolbar [class^=controlbar], .hidecontrolbar [class^=timebob], #divtip-pre1 {display: none !important;} .hidecontrolbar [class^=timeprogressbg] {display: block !important;bottom:0 !important;height:3px !important;}');
        GM_addStyle('.blinkInfo {animation: blinker 3s linear infinite;} @keyframes blinker {50% {opacity: 0.2;}}');
        GM_addStyle('.loadingVideo [class^="pausecenter"] {display: none !important;} #player1 .dplayer-controller {opacity: 1;} #player1 .dplayer-controller .dplayer-bar-wrap {bottom:38px;}');
        GM_addStyle("video {animation:videoload 1ms;} @keyframes videoload{from{opacity:.9;}to{opacity:1;}}");
        // GM_addStyle('video {pointer-events: none;}'); //阻止自带的点击事件，但会阻止所有点击，包括右键

        try {
            var eps = 0;
            var pLoc = parent.location.href;
            var currentTitle = parent.document.title.replace(/\s*\[.+|\s*-在线观看.+/, "");
            var data = pLoc.match(/\/play\/(\d+)\?playid=(\d+)_(\d+)/);
        } catch(ex) {
            try {
                var pLocData = GM_getValue(location.href);
                if (pLocData) {
                    pLoc = pLocData[0];
                    currentTitle = pLocData[1];
                    GM_deleteValue(location.href);
                    data = pLoc.match(/\/play\/(\d+)\?playid=(\d+)_(\d+)/);
                    eps = pLocData[2];
                }
            } catch(ex) {}
        }
        var isPWC = false;
        var dmp, dmpInited = false, dms, lastDmTime = -1, isDmOn = true;
        var vct = 0, vd = 0;
        var isReload = false;
        var isErrorReload = false;
        var isEnded = false;
        var setHistory = ()=> {
            vd = $('video').duration;
            vct = $('video').currentTime;
            if (data && !isReload && vd && currentTitle) {
                var aid = data[1], pidx = data[2], eidx = data[3];
                // console.log('aid:', aid, 'pidx:', pidx , 'eidx:', data[3]);
                var h = GM_getValue('playHistory') || {};
                var gmh = JSON.parse(localStorage.playHistory || '{}');
                if (Object.keys(h).length == 0 && Object.keys(gmh).length > 0) { // in case localStorage history lost
                    h = gmh;
                }
                if (Object.keys(h).length > maxHistory) {
                    var keySort = Object.keys(h).sort((a,b)=>Number(h[a].ts) - Number(h[b].ts));
                    delete h[keySort[0]];
                }
                if (vd == 0 || isNaN(vd)) {
                    vd = 1;
                }
                //if (vct < 10 && h[aid] && h[aid].vct) vct = h[aid].vct;
                h[aid] = {pidx: pidx, eidx: eidx, vct: vct, vd: vd, ts: Date.now(), tt: currentTitle};
                localStorage.playHistory = JSON.stringify(h);
                gmh[aid] = h[aid];
                GM_setValue('playHistory', gmh);
                var f = JSON.parse(localStorage.fav || '{}');
                var gmf = GM_getValue('fav') || {};
                if (f[aid]) {
                    f[aid]['ep'] = pidx + '_' + eidx;
                    localStorage.fav = JSON.stringify(f);
                }
                if (gmf[aid]) {
                    gmf[aid]['ep'] = pidx + '_' + eidx;
                    GM_setValue('fav', gmf);
                }
            }
        };
        var toggleFullScreen = ()=> {
            var f = $('#age_playfram, iframe', parent.document);
            if (f) {
                if (parent.document.fullscreen) {
                    parent.document.exitFullscreen();
                } else {
                    f.requestFullscreen();
                }
            }
        };
        var toggleFullPage = ()=> {
            if (document.mozFullScreen) {
                toggleFullScreen();
            } else {
                parent.postMessage( {msg: 'mdlclick'}, parent.location.href);
            }
        };
        var clearTimer = 0;
        var toggleInfoPanel = (info, isLoop) => {
            var infoDiv = $('#vpeInfoPanel');
            var svSpan = $('#vpeCenterInfo');
            if (infoDiv && svSpan) {
                var loading = $('[class^=loading]');
                if (loading) loading.style.display = 'none';
                var pausecent = $('[class^="pausecenter"]');
                if (pausecent) pausecent.style.display = 'none';
                if (info) svSpan.textContent = info;
                infoDiv.style.opacity = '1';
                if (isLoop) {
                    infoDiv.isFrozen = true;
                    svSpan.className = 'blinkInfo';
                } else {
                    infoDiv.style.transition = 'all 0.3s ease';
                    if (clearTimer) {
                        clearTimeout(clearTimer);
                    }
                    clearTimer = setTimeout(()=>{
                        infoDiv.style.opacity = '0';
                        svSpan.textContent = '';
                        infoDiv.style.transition = 'all 0.5s ease 1s';
                    }, 1e3);
                }
            }
        };

        var setFilter = filter => {
            var v = $('video');
            if (!v) return;
            if (filter == 'reset') {
                v.style.removeProperty('filter');
                if (data && data[1]) {
                    var afs = GM_getValue('avFilters') || {};
                    if (afs[data[1]]) delete afs[data[1]];
                    GM_setValue('avFilters', afs);
                }
            } else if (filter) {
                var b = filter.b, c = filter.c, s = filter.s;
                var fs = '';
                if (b && b != '100' && !isNaN(Number(b))) {
                    fs += `brightness(${Number(b)/100})`;
                }
                if (c && c != '100' && !isNaN(Number(c))) {
                    fs += `contrast(${Number(c)/100})`;
                }
                if (s && s != '100' && !isNaN(Number(s))) {
                    fs += `saturate(${Number(s)/100})`;
                }
                if (fs) {
                    if (data && data[1]) {
                        var afs = GM_getValue('avFilters') || {};
                        if (afs[data[1]] != filter) {
                            afs[data[1]] = filter;
                            GM_setValue('avFilters', afs);
                        }
                    }
                    v.style.filter = fs;
                }
            }
        };
        var setPlayer = ()=> {
            if (!pLoc.match(/playid=\d+_(\d+)/)) return;
            if (eps == 0) {
                eps = parent.document.querySelectorAll('.movurl[style*="block"] li').length;
            }
            var cep = Number(pLoc.match(/playid=\d+_(\d+)/)[1]);
            var preBtn = document.querySelector('[data-title="上一集"]');
            var nxtBtn = document.querySelector('[data-title="下一集"]');
            var ctrBar = document.querySelector('[class^=controlbar]');
            var timePb = document.querySelector('[class^=timeprogress]');
            var timeBo = document.querySelector('[class^=timebo]');
            var fullBtn = $('[class^="fullch"]');
            var v = $('video');
            var vDiv = document.querySelector('#video, #player1').parentNode;
            var volBar = $('[class^="volumech"]');
            if (volBar) {
                volBar.replaceWith(volBar.cloneNode(true));
            }
            var loading = document.querySelector('[class^=loading]');
            if (loading) {
                loading.style.display = 'block';
                loading.style.background = '#80808080';
            }

            var isLoadVideoTriggered = false;
            var loadVideo = msg => {
                if (isLoadVideoTriggered) return;
                isLoadVideoTriggered = true;
                var info;
                v.pause();
                if (msg == 'reload') {
                    if (!isErrorReload) isReload = true;
                    info = isErrorReload? '正在加载' : '重新加载';
                } else if (msg == 'next' || msg == 'ended') {
                    info = '加载下一集';
                } else if (msg == 'prev') {
                    info = '加载上一集';
                }
                toggleInfoPanel(info, true);
                document.body.classList.add('loadingVideo');
                parent.postMessage( {msg: msg}, parent.location.href);
            };
            var errorProc = () => {
                if (v.src && v.src.includes('/404.mp4')) {
                    var et = $('[class^="errortext"]');
                    if (et) {
                        var pc = $('[class^="pausecenter"]');
                        if (pc) {
                            pc.style.display = 'none';
                        }
                        var ld = $('[class^="loading"]');
                        if (ld) {
                            ld.style.display = 'none';
                        }
                        et.textContent = '此列表无法播放！';
                        et.style.display = 'block';
                    }
                }
            };
            if (nxtBtn && cep < eps) {
                GM_addStyle('[data-title="下一集"] {display: block !important;}');
                nxtBtn.onclick = ()=> loadVideo('next');
            }
            if (preBtn && cep > 1) {
                GM_addStyle('[data-title="上一集"] {display: block !important;}');
                preBtn.onclick = ()=> loadVideo('prev');
            }
            if (ctrBar) {
                ctrBar.ondblclick = ()=> loadVideo('reload');
            }
            if (fullBtn) {
                fullBtn['onclick'] = null;
                fullBtn.addEventListener('click', e => {
                    toggleFullScreen();
                    e.stopPropagation();
                }, true);
            }
            if (v) {
                // for security reason, fullscreen only can be trigged by user
                //if (sessionStorage.isFullScreen == 'true' && !document.mozFullScreen) toggleFullScreen();

                errorProc();

                v.setAttribute('autoplay', 'true');

                var setLastPlayTime = ()=> {
                    if (data && v.duration > 0) {
                        var h = GM_getValue('playHistory') || {}; //JSON.parse(localStorage.playHistory || '{}');
                        var hr = h[data[1]];
                        if (hr && hr.pidx == data[2] && hr.eidx == data[3]) {
                            //v.currentTime = Number(hr.vct);
                            v.fastSeek(Number(hr.vct));
                            console.log('Last play time has set', hr.vct);
                            //document.querySelector('[class^=playch]').click();
                            // document.querySelector('[class^=playch]').dispatchEvent(new MouseEvent('click'));
                        }
                    }
                };

                setLastPlayTime();

                var setVolumeBar = ()=> {
                    var vup = $('[class^="volumeup"]');
                    var vbo = $('[class^="volumebo"]');
                    var vbb = $('[class^="volumech"]');
                    if (vup) vup.style.width = Math.round(v.volume * 60) + 'px';
                    if (vbo) vbo.style.left = Math.round(v.volume * 48) + 'px';
                    if (vbb) vbb.style.display = 'block';
                };

                //去除自带的点击事件，主要是和自定义的双击事件冲突
                var clickCount = 0; // 区分双击还是单击
                v['onclick'] = null;
                v.addEventListener('click', function(e) {
                    clickCount++;
                    if (clickCount == 1) {
                        setTimeout(function(){
                            if(clickCount == 1) {
                                (v.paused)? v.play() : v.pause();
                            }
                            clickCount = 0;
                        }, 300);
                    }
                    e.stopPropagation();
                }, true);

                v.ontimeupdate = ()=> {
                    vct = v.currentTime;
                    parent.vCurrentTime = vct;
                    var t = Math.round(vct);
                    if (isDmOn && dms && dms[t] && dms[t].length > 0 && !v.paused && lastDmTime != t && dmpInited) {
                        lastDmTime = t;
                        dms[t].forEach(dm=>dmp.fireDanmu(dm[0], dm[1]));
                    }
                }
                v.onpause = ()=> {
                    if (isDmOn && dmpInited) {
                        dmp.pause();
                    }
                };
                v.onplay = ()=> {
                    if (isDmOn && dmpInited) {
                        dmp.resume();
                    }
                };
                v.onseeking = ()=> {
                    if (isDmOn && dmpInited) {
                        dmp.clear();
                    }
                };
                v.onended = ()=> {
                    if (isEnded) {return;}
                    isEnded = true;
                    v.currentTime = v.duration - 0.1;
                    v.pause();
                    //parent.clickForIframe();
                    if (cep < eps) {
                        vct = v.currentTime;
                        loadVideo('ended');
                    }
                };
                v.onerror = ()=> {
                    // var ec = v.error.code;
                    // console.log("Video error, code:", ec);
                    // if (ec == 2 || ec == 4) { //MEDIA_ERR_NETWORK
                    //     isErrorReload = true;
                    //     loadVideo('reload');
                    // }
                    errorProc();
                }
                // document.onmousedown = e => {
                //     if (e.which == 2) {
                //         toggleFullPage();
                //     }
                // };
                v.onloadedmetadata = ()=> {
                    if (typeof player != "undefined" && player) {
                        player.ckplayerConfig.config.timeJump = 5;  //set seek time 5s
                        player.changeVolume(1);
                    }
                    var fn = v.src.match(/\/(\d+)_.+(\.f\d+\.mp4)/);
                    var fl = fn? new RegExp(fn[1] + '_.+\\.f\\d+\\.mp4') : null;
                    //console.log('file:',fl);
                    parent.postMessage( {msg: 'file', file: fl}, pLoc);
                    setLastPlayTime();
                };
                v.oncanplay = ()=> {
                    vd = v.duration;
                    parent.vDuration = vd;
                    if ($('#vpeTopInfo')) {
                        // $('#vpeTopInfo').textContent = currentTitle;
                        $('#vpeTopInfo').textContent = currentTitle + (sessionStorage.epTitle? ' ' + sessionStorage.epTitle : '');
                        toggleInfoPanel();
                    }
                    if (data && data[1]) {
                        var afs = GM_getValue('avFilters') || {};
                        if (afs[data[1]]) setFilter(afs[data[1]]);
                    }
                    // if (vct > 3) {
                        setHistory();
                    // }
                    if (localStorage.videoVolume && typeof player != undefined && player) {
                        var sv = parseFloat(localStorage.videoVolume);
                        player.volume = sv;
                        v.volume = sv;
                    }
                    setVolumeBar();
                };
                v.onvolumechange = () => {
                    if (typeof player != undefined && player) {
                        player.volume = v.volume;
                    }
                };
                var clearmv = 0;
                var switchControlBar = ()=> {
                    setVolumeBar();
                    if (clearmv) {
                        if (timeBo) {
                            ctrBar.style.display = timeBo.style.display = timePb.style.display = 'block';
                            vDiv.className = '';
                        }
                        clearTimeout(clearmv);
                        clearmv = 0;
                    }
                    clearmv = setTimeout(()=> {
                        if (timeBo) {
                            ctrBar.style.display = timeBo.style.display = 'none';
                            vDiv.className = 'hidecontrolbar';
                        }
                        //player.controlBarHide(true);
                    }, 2000);
                };
                vDiv.onmousemove = switchControlBar;
                switchControlBar()
                document.addEventListener('keydown',e => {
                    // player.controlBarHide(false);
                    var k = e.keyCode;
                    var ks = [19, 82, 33,34,37,38, 39, 40, 70, 87, 68]; //37 left, 39 right, 38 up, 40 down, 70 f, 87 w, 68 d, 82 r
                    if (ks.includes(k)) {
                        e.preventDefault();
                        e.stopPropagation();
                        switchControlBar();
                        if (k == 33 && cep > 1) {
                            loadVideo('prev');
                        }  else if (k == 34 && cep < eps) {
                            loadVideo('next');
                        } else if (k == 19 || k == 82) {
                            loadVideo('reload');
                        }
                        // else if (k == 70) toggleFullScreen();
                        // else if (k == 87) toggleFullPage();
                        // else if (k == 37) v.currentTime -= 5;
                        // else if (k == 39) {
                        //     if (v.currentTime + 5 < v.duration) {
                        //         v.currentTime += 5;
                        //     } else {
                        //         v.currentTime = v.duration;
                        //         v.pause();
                        //     }
                        // } else if (k == 40) {
                        //     if (v.volume < 0.05) player.changeVolume(0);
                        //     else player.changeVolume(v.volume - 0.05);
                        // } else if (k == 38) {
                        //     if (v.volume > 0.95) player.changeVolume(1);
                        //     else player.changeVolume(v.volume + 0.05);
                        // }
                    }
                });
                document.onkeyup = e => {
                    if ([33,34, 37,38,39,40].includes(e.keyCode)) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                };
                setLastPlayTime();
            }
        };
        document.addEventListener('animationstart', e => {
            if (e.animationName == 'videoload') {
                // var allVideo = $All('video');
                // if (allVideo.length > 1) {
                //     for (i = 0; i < allVideo.length - 1; i++) {
                //         allVideo[i].parentNode.parentNode.remove();
                //     }
                // }
                var pLocData = GM_getValue(location.href);
                pLoc = pLocData[0];
                currentTitle = pLocData[1];
                GM_deleteValue(location.href);
                data = pLoc.match(/\/play\/(\d+)\?playid=(\d+)_(\d+)/);
                eps = pLocData[2];
                setPlayer();
            }
        });
        if (pLoc) {
            parent.postMessage( {msg: 'loaddanmu'}, pLoc);
            setPlayer();
        } else {
            var ti = setInterval(()=>{
                var pLocData = GM_getValue(location.href);
                if (pLocData) {
                    clearInterval(ti);
                    pLoc = pLocData[0];
                    currentTitle = pLocData[1];
                    GM_deleteValue(location.href);
                    data = pLoc.match(/\/play\/(\d+)\?playid=(\d+)_(\d+)/);
                    eps = pLocData[2];
                    setPlayer();
                }
            }, 1e3);
        }

        window.addEventListener("message", evt => {
            var msg = evt.data.msg;
            if (msg == 'danmu') {
                $('#vpeTopInfo').textContent = currentTitle + (sessionStorage.epTitle? ' ' + sessionStorage.epTitle : '');
                if (!dmpInited) {
                    dmp = new danmuPlayer();
                    dmpInited = dmp.init();
                    dmp.setOpacity(evt.data.opacity);
                } else {
                    dmp.clear();
                }
                isDmOn = evt.data.status;
                dms = evt.data.danmu;
            } else if (msg == 'danmustatus') {
                if (evt.data.value) {
                    isDmOn = true;
                } else {
                    if (isDmOn && dmpInited) {
                        dmp.clear();
                    }
                    isDmOn = false;
                }
            } else if (msg == 'setfilter') {
                setFilter(evt.data.value);
            } else if (msg == 'resetfilter') {
                setFilter('reset');
            } else if (msg == 'pWindowClose') {
                isPWC = true;
            } else if (msg == 'danmuopacity' && dmpInited) {
                dmp.setOpacity(evt.data.value);
            }
        });

        window.onbeforeunload = ()=> {
            GM_deleteValue(location.href);
            sessionStorage.epTitle = '';
            setHistory();
        };
    }


    function beautifyPage() {
        setCookie('notice', new Date().toLocaleDateString('zh-CN').replaceAll('/',''), 1);
        GM_addStyle('body{position: relative;} .index-app-dl,#notice_box{position: absolute;bottom: 0;width: 100%;} .index-app-dl{bottom: -130px;width: 1116px;margin-left: -15px;} \
            .recommend_list {border-top: 1px solid rgba(255,255,255, .125);margin-top: 5px;} .weekly_list li{padding:1px 0 !important} .head_content_wrapper {padding: 0 !important;} \
            .text_list_box .text_list_box--bd .text_list_item li {padding: 1px 0 !important;} .mb-4 {margin-bottom: 5px !important;} h6.title {color: deeppink;} \
            .text_list_item li:nth-child(2n) {background-color: black !important;color: darksalmon !important;} .py-2 {padding-top: .1rem !important;padding-bottom: .1rem !important;} \
            .link-light, .link-light:hover, .text_list_box .title_sub {color: inherit !important;} section > .row .w-100 {width: auto !important;height: 170px;margin-left: auto;margin-right: auto;} \
            .watch-qrcode-popover, .feedback-popover {display: none;} .foot_content_wrapper, .global_notice_wrapper{display:none !important;} .side-tools {margin-left: 630px;} \
            .video_play_detail_wrapper .video_thumbs{max-width: 250px !important;width: 100% !important;} section.bg-dark:nth-child(2) {position: absolute;left: 0;top: 35px;width: 250px;padding: 1px !important;} \
            .rounded-3 {border-radius: 0 !important;} .comment-box-wrapper {bottom: -105px;position: absolute;width: 100%;}  .comment-list-wrapper.mb-4 {margin-top: -20px;} \
            .video_play_wrapper {margin-top:-16px;} .body_content_wrapper{margin-top:0 !important;} .mt-3 {margin-top: 0 !important;} .comment-content {padding-top: 0 !important;} \
            .comment-username {padding: 0 !important;} .comment-list-item {padding: 5px !important;} .card{margin-top: -20px;} .card .video_cover{padding-bottom: 10px;} \
            .video_detail_wrapper:nth-child(2){position: absolute;left: 1051px;width: 350px;top: 40px;background: rgba(0, 0, 0, .5);} .video_detail_box--bd {margin-top: 20px;} \
            .container:has(iframe){width: 800px;max-width:800px;margin-left: 250px;padding: 0;} .video_detail_right {max-width: 800px;} li.episode_end {background-size: auto 80% !important;} \
            .video_play_detail_wrapper .card-body {display: contents;} .video_play_detail_wrapper .cata_video_item .d-flex {display: contents !important;} \
            #comments_pagination_bottom .page-link{padding:0 !important;font-size:10px !important;} #comments_pagination_bottom {  margin: 0 !important; }');
        var epsEnds = $All('.episode_end');
        epsEnds.forEach(ee => {
            ee.title = $('.title_sub.text-truncate', ee).textContent;
        });
        var vds = $All('div.video_list_box .link-light');
        vds.forEach(vd => {
            vd.title = vd.textContent;
        });
        var vdesc = $('.video_detail_desc');
        var vcard = $('.video_play_detail_wrapper .card-body');
        if (vcard && !vdesc) {
            var vdi = $C('div', {class: 'video_detail_info'});
            vdesc = $C('div', {class: 'video_detail_desc'});
            vdi.innerHTML = '<span>剧情简介：\n</span>';
            vdesc.textContent = $('meta[name="description"]').content;
            vdi.appendChild(vdesc);
            vcard.appendChild(vdi);
        }
        var vtt = $('.video_play_detail_wrapper .card-title');
        if (vtt) {
            var vhref = location.href.match(/.+\/play\/\d+\//)[0].replace('play', 'detail');
            vtt.innerHTML = `<a href="${vhref}" target='_blank'>${vtt.textContent}</a>`;
        }
        addHiddenCatalog();
    }
    function beautifyPage_old() {
        GM_addStyle('#logo, #pp1,.svg_title {display:none;} #root #top{height: 56px;padding: 0 8px;} #nav {max-width:800px;} #pp{margin-top: -10px;} .blockcontent table {width: 100%;} #detailname{height:25px;margin-bottom:0;}');
        GM_addStyle('#cpraid {display:none !important;} #age_playfram {display:block !important;}'); // anti app
        //GM_addStyle('.div_right{width:994px;} #ageframediv{width:100% !important; min-width:980px;} .spaceblock1 {padding:2px 2px;} #root {width:1280px;}');
        GM_addStyle('#container > .spaceblock1 {display: none;} .div_left > .baseblock > .blockcontent {padding: 0;} .baseblock2 > ul.blockcontent {padding-top: 0;} ul > .detail_imform_kv {margin: 0;}'); //compact page
        GM_addStyle('#play_imform li {white-space: nowrap;max-width: 270px;overflow: hidden;text-overflow: ellipsis;} #play_imform li:hover {white-space: normal; 	word-break: break-word;} .play_desc {max-height: 200px;overflow-y: auto;scrollbar-width: thin;scrollbar-color: darkred black;}');
        GM_addStyle('#top_search_from {margin: 0;} .search_form, .nav_button, #nav, #root #top {height: 36px;line-height: 36px;} .movurl ul {max-height: 145px;overflow-y: auto;scrollbar-color: darkred black;} .movurl li a {padding: 0 2px;} .movurl li {min-width: 86px;margin: 3px 3px 0 0;} .movurl {width:100%;}');
        //GM_addStyle('input::-moz-focus-outer,input::-moz-focus-inner {border:0 !important;outline:none !important;}');
        var pl = $('#id_play_tabs'), pp = $('#pp'), dt = $('#detailname'), top = $('#top'), nav = $('#nav'), pi = $('#play_imform'), pd = $('.play_desc');
        if (pl && pp) {
            pp.appendChild(pl.parentNode);
        }
        if (dt && pp) {
            //pp.parentNode.parentNode.insertAdjacentElement('afterend', dt.parentNode.parentNode);
        }
        var loginout = $('.loginout');
        if (loginout) loginout.className += ' nav_button';
        if (top && nav) top.appendChild(nav);
        if (pi && pd) {
            var tr = pi.parentNode.parentNode;
            var td = $C('td', {style:'max-width:600px;float:right;'});
            td.appendChild(pd.parentNode.parentNode);
            tr.appendChild(td);
        }
        // var pan = Array.from($All('.baseblock')).find(b => $('.res_links', b));
        var rept = $('.report_div') && $('.report_div').parentNode;
        // if (pan && rept) {
        //     rept.parentNode.insertAdjacentElement('afterend', pan);
        // }
        var sForm = $('#top_search_from');
        if (sForm && !location.href.includes(oLoc + '/search?')) sForm.target = '_blank';
        scrollTo({top:0});

        var info = $All('ul .detail_imform_kv'); //compact page
        if (info.length > 1) {
            var infoP = info[0].parentNode;
            $('.detail_imform_tag', info[0]).textContent = '地区/种类:';
            var tv = $('.detail_imform_value', info[0]);
            tv.textContent += ' / ' + $('.detail_imform_value', info[1]).textContent;
            info[1].style.display = 'none';
            var auth, comp, web;
            for (let i of info) {
                if ($('.detail_imform_tag', i).textContent == '原作：') {
                    auth = i;
                } else if ($('.detail_imform_tag', i).textContent == '制作公司：') {
                    comp = i;
                } else if ($('.detail_imform_tag', i).textContent == '官方网站：') {
                    web = i;
                }
            }
            if (auth) infoP.appendChild(auth);
            if (comp) infoP.appendChild(comp);
            if (web) infoP.appendChild(web);
        }

        var rel = $All('.anime_icon1_name');
        rel.forEach(r=>r.title=r.textContent);

        // play page
        if (location.href.match(oLoc + '/play/')) {
            GM_addStyle('.spaceblock1{display:none;} .baseblock .blocktitle {padding: 0 2px 4px 2px;} .menu0 {margin-right: 0;line-height: inherit;} .menu0 li {width:80px;} .split {margin-left: 4px;} .baseblock .blockcontent {padding: 2px 2px;} #play_poster_img {width:256px;height:auto;} #div_left {width: 272px;display: inline-block;vertical-align: top;} #div_right {width: 738px;display: inline-block;vertical-align: top;margin-left: 0px;margin-right: -8px;} .relates_series {display: block;  margin: 4px 0px;}');
            var dl = $C('div');
            dl.id='div_left';
            var th = $C('div');
            th.appendChild($('#play_poster_img').parentNode);
            dl.appendChild(th);
            dl.appendChild($C('div', {class: 'line'}));
            var dpi = $C('div');
            dpi.appendChild(pi);
            dl.appendChild(dpi);
            var desc = pd.parentNode.parentNode;
            dl.appendChild(desc);
            var dr = $('#container');
            dr.id='div_right';
            var dc = $C('div');
            dc.id='container';
            dc.appendChild(dl);
            dc.appendChild(dr);
            window.onload = ()=> {
                dl.appendChild($('#wangpan-div').parentNode.parentNode);
                dl.appendChild(rept);
            };
            var r = $('#root');
            r.insertBefore(dc, $('#footer'));
            var fd = $('#ageframediv');
            fd.style = 'width:730px; height:432px';
            // var dtp = dt.parentNode;
            // while (dtp.nextElementSibling) {
            //     dtp.nextElementSibling.remove();
            // }
            // while (dtp.parentNode.nextElementSibling.className != 'baseblock') {
            //     dtp.parentNode.nextElementSibling.remove();
            // }
            $('#div_right .spaceblock1').remove();

            var dUrl = $('#detailname a').href;
            XHR({url: dUrl}).then(r => {
                var dom = new DOMParser().parseFromString(r, "text/html");
                var rs = $('.relates_series', dom);
                if (rs) {
                    desc.insertAdjacentElement('afterend', rs.parentNode.parentNode);
                }
            });
        }

        addHiddenCatalog();

        var tip = $('#new_tip1');
        var footer = $('#footer_container');
        if (tip && footer) {
            footer.appendChild(tip);
        } else if (tip) {
            document.body.appendChild(tip);
        }

    }

    function addHiddenCatalog() {
        if (location.href.match(oLoc + '/catalog/')) {
            var lnks = $All('a[href^="/detail/"]');
            lnks.forEach(l=>l.target='_blank');
            var type = Array.from($All('#filter_box a')).find(s=>s.textContent.match(/^类型/));
            if (type) {
                var st = type.nextElementSibling || type.parentNode.nextElementSibling;
                var lastA = st.lastElementChild;
                var cloneA = lastA.cloneNode(true);
                var nTag = '其他';
                cloneA.href = cloneA.href.replace(encodeURIComponent(cloneA.textContent), nTag);
                cloneA.classList.remove('active');
                // cloneA.style.color = 'yellow';
                cloneA.textContent = nTag;
                if (location.href.match(encodeURIComponent(nTag))) {
                    cloneA.classList.add('active');
                }
                st.appendChild(cloneA);
            }

            $All('.cell_imform_desc').forEach(d=>d.title=d.textContent);
        }
    }

    function danmuPlayer() {
        var dmPuased = false;
        var firingDm = new Set();
        var pool = [];
        var poolSize = 150;
        var rows = [];
        var maxRow = 15;
        var baseTop = 10;
        var showTime = 7;
        var dmLayout;
        var calcRect = function() { return dmLayout.getBoundingClientRect() };
        var calcRow = function(width, duration) {
            var rect = calcRect();
            var now = new Date().getTime();
            var check = function(row) {
                row = rows[row];
                if (!row) {
                    return true
                }
                if (row.endTime <= now) {
                    rows[row] = null;
                    return true
                } else {
                    var distance = rect.width + row.width;
                    var percent = (now - row.beginTime) / row.duration;
                    var left = rect.width - distance * percent;
                    if (left + row.width >= rect.width) {
                        return false
                    }
                    var remainTime = row.endTime - now;
                    var myDistance = rect.width + width;
                    var leftX = rect.width - (myDistance) * (remainTime / duration);
                    if (leftX < 0) {
                        return false
                    }
                }
                return true
            };
            var add = function(row) {
                rows[row] = {
                    duration: duration,
                    beginTime: now,
                    endTime: now + duration,
                    width: width
                };
            };
            var i = 0;
            while (true) {
                if (check(i)) {
                    add(i);
                    return i % maxRow;
                }
                i++;
            }
        };
        var resetDanmu = dm => {
            dm.style = "display: none;  position: absolute; will-change: transform; white-space: pre;";
            pool.push(dm);
            firingDm.delete(dm);
        };
        this.init = function() {
            var v = document.querySelector("div.h5vplayer video, video");
            if (v) {
                var dl = document.querySelector("#h5danmulayout");
                if (dl) { document.removeChild(dl); }
                dmLayout = document.createElement('div');
                dmLayout.setAttribute("id", "h5danmulayout");
                dmLayout.style = "position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; color:#fff; font-size:25px; line-height:1.25; overflow:hidden; opacity:1;text-shadow: #000000 1px 0px 1px, #000000 0px 1px 1px, #000000 0px -1px 1px, #000000 -1px 0px 1px;";
                pool = [];
                for (var i = 0; i < poolSize; i++) {
                    var dm = document.createElement('div');
                    dm.style = "display: none;  position: absolute; will-change: transform; white-space: pre;";
                    dmLayout.appendChild(dm);
                    pool.push(dm);
                }
                v.parentNode.appendChild(dmLayout);
                return true;
            }
            return false;
        };
        this.fireDanmu = function(text, color, cls) {
            var fire = function () {
                var rect = calcRect();
                var duration = rect.width * showTime;
                var dm = pool.shift();
                var timer = setTimeout(function () {
                    try {
                        resetDanmu(dm);
                    } catch(e) {}
                }, duration);
                dm.innerHTML = text;
                dm.duration = duration;
                dm.timer = timer;
                firingDm.add(dm);
                if (Array.isArray(cls)) { cls = cls.join(' '); }
                dm.className = cls || '';
                dm.style.left = (rect.width) + "px";
                dm.style.display = 'inline-block';
                dm.style.color = color;
                setTimeout(function () {
                    var dmRect = dm.getBoundingClientRect();
                    var row = calcRow(dmRect.width, duration);
                    dm.rectWidth = dmRect.width;
                    dm.style.top = (baseTop + row * dmRect.height) + "px";
                    dm.style.transition = "transform " + (duration/1000) + "s linear";
                    dm.style.transform = dm.tf = "translateX(-" + (rect.width+dmRect.width) + "px)";
                }, 0);
            };
            if (pool.length == 0) { return; }
            fire();
        };
        this.pause = function() {
            if (!dmPuased) {
                var rectWidth = calcRect().width;
                firingDm.forEach(dm => {
                    clearTimeout(dm.timer);
                    var cs = getComputedStyle(dm);
                    var tf = cs.transform;
                    dm.duration = (rectWidth + Number(tf.replace(/.+\(|\)|\s/g, '').split(',')[4]) + dm.rectWidth) * showTime;
                    dm.style.transform = tf;
                    dm.style.transition = 'none';
                });
                dmPuased = true;
            }
        };
        this.resume = function() {
            if (dmPuased) {
                firingDm.forEach(dm => {
                    var timer = setTimeout(function () {
                        try {
                            resetDanmu(dm);
                        } catch(e) {}
                    }, dm.duration);
                    dm.timer = timer;
                    dm.style.transform = dm.tf;
                    dm.style.transition = "transform " + (dm.duration/1000) + "s linear";
                });
                dmPuased = false;
            }
        };
        this.clear = function() {
            firingDm.forEach(dm => {
                clearTimeout(dm.timer);
                resetDanmu(dm);
            });
        };
        this.setOpacity = function(v) {
            if (dmLayout) {
                dmLayout.style.opacity = v;
            }
        };
    }
    function loadDanmu(csSsId) {
        var ssIds = GM_getValue('ssIds') || {};
        var ep = location.href.match(/playid=\d+_(\d+)/);
        var lEp = $('.movurl [style*="border"]') && $('.movurl [style*="border"]').textContent.match(/\d+/);
        var av = location.href.match(/\/play\/(\d+)/);
        if (!csSsId && ssIds[av[1]]) {
            csSsId = ssIds[av[1]];
        }
        if (isDmNotFound && !csSsId) return;
        var nameNode = $('#detailname a');
        var pubYear = parseInt(av[1].substring(0, 4));
        var bd = GM_getValue('BiliDanmu') || {};
        var dms;
        var f = document.querySelector('iframe');
        var marks = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘’，。、\s]/g;
        var isRecentDm = (time, txt) => {
            var recentTime = 10;
            for (i = time - recentTime; i <= time + recentTime; i++) {
                if (dms[i] && dms[i].find(dm=>dm[0].replaceAll(marks, "").includes(txt.replaceAll(marks, "")))) {
                    return true;
                }
            }
            return false;
        };
        var storeDanmu = ssid => {
            dms = {};
            $('#ssidtext').value = ssid;
            if (danmuSet[ssid] && danmuSet[ssid][ep[1]]) {
                console.log('use loaded danmu!');
                $('#ssiddatalist option[value="'+ssid+'"]').selected = true;
                dms = danmuSet[ssid][ep[1]].dms;
                var status = $('#dmswitch').status? true : false;
                var opacity = $('#dmopc').value/100;
                f.contentWindow.postMessage({msg: 'danmu', danmu: dms, status: status, opacity:opacity}, location.origin);
                var ssl = $('#ssiddatalist');
                if (ssl) {
                    $('#dmswitch').title = ssl.dataset[ssid];
                }
                return;
            }
            // var ssApi = `https://bangumi.bilibili.com/view/web_api/season?season_id=${ssid}`;
            var ssApi = `https://api.bilibili.com/pgc/web/season/section?season_id=${ssid}`;
            XHR({url:ssApi,isjson:true,headers:{Referer:bRef} }).then(ss=>{
                if (ss.result && (ss.result.episodes && ss.result.episodes.length > 0 || ss.result.main_section && ss.result.main_section.episodes)) {
                    var eps = ss.result.episodes || ss.result.main_section.episodes;
                    // if (Math.abs(eps.length - $All('.movurl[style*="block"] li').length) > 2) {
                    //     $('#ssidtext').value = 'B站无此剧';
                    //     return;
                    // }
                    var cep = (eps.length == 1)? eps[0] : eps[Number(ep[1])-1];
                    if ($('#play_poster_img')) {
                        $('#play_poster_img').title = '声优：\n' + ss.result.actors;
                    }
                    // if (lEp && (cep && Number(cep.index) == Number(lEp[0]) + 1 || !cep && eps.length == Number(lEp[0]) || Number(lEp[0]) != Number(ep[1]))) {
                    //     if (Number(lEp[0]) - 1 < 0) {
                    //         return;
                    //     } else {
                    //         cep = eps[Number(lEp[0])-1];
                    //     }
                    // }
                    if (!cep || cep.title && Number(cep.title) != Number(lEp[0])) {
                        cep = eps.find(p=>Number(p.title) == Number(lEp[0]));
                        if (!cep) return;
                    }

                    var cid = cep.cid;
                    var epTitle = cep.index_title || cep.long_title || '';
                    var epIndex = cep.index || cep.title || null;
                    sessionStorage.epTitle = epTitle;
                    if ($('#loaddmbtn')) $('#loaddmbtn').title = '加载B站弹幕\n' + epTitle + (epIndex? '[' + epIndex + ']' : '');
                    var cApi = `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`;
                    //var cApi = `https://comment.bilibili.com/${cid}.xml`; //another api
                    XHR({url:cApi,headers:{Referer:bRef} }).then(c=>{
                        var dom = new DOMParser().parseFromString(c, 'text/xml');
                        var count = 0, total = $All('d', dom).length;
                        $All('d', dom).forEach(d=>{
                            var txt = d.textContent;
                            var p = d.getAttribute('p').split(',');
                            var t = Math.round(p[0]);
                            var color = '#' + parseInt(p[3]).toString(16);
                            var ft = dmFilters.find(f=> f.test(txt));
                            if (ft || isRecentDm(t, txt)) {
                                count++;
                            } else {
                                dms[t] = dms[t] || [];
                                dms[t].push([txt, color]);
                            }
                        });
                        console.log('Total danmu:', total, 'filter danmu:', count);
                        var dmswitch = $('#dmswitch');
                        dmswitch.filterInfo = '\n总数/过滤：' + total + ' / ' + count;
                        dmswitch.title = dmswitch.status? '弹幕已开启' + dmswitch.filterInfo : '弹幕已关闭';
                        var epObj = danmuSet[ssid] || {};
                        epObj[ep[1]] = {cid:cid, dms:dms};
                        danmuSet[ssid] = epObj;
                        currentSsid = ssid;
                        var opacity = $('#dmopc').value/100;
                        f.contentWindow.postMessage({msg: 'danmu', danmu: dms, status: dmswitch.status, opacity:opacity}, location.origin);
                        var ssl = $('#ssiddatalist');
                        if (ssl) {
                            ssl.dataset[ssid] = dmswitch.title;
                        }
                    });
                    if (!$('#ssiddatalist option[value="'+ssid+'"]')) {
                        var opt = $C('option', {value: ssid});
                        opt.textContent = ss.result.title;
                        opt.selected = true;
                        $('#ssiddatalist').appendChild(opt);
                    }
                }
            });
        };
        if (csSsId) {
            storeDanmu(csSsId);
        }
        if (nameNode && av && ep) {
            var cid;
            var name = nameNode.textContent;
            var bRef = 'https://www.bilibili.com';
            var searchApi = `https://api.bilibili.com/x/web-interface/search/type?search_type=media_bangumi&keyword=${name}`;
            XHR({url:searchApi,isjson:true,headers:{Referer:bRef}}).then(r=>{
                var sss = [];
                if (r.data && r.data.result && r.data.result.length > 0) {
                    r.data.result.forEach(ss => {
                        if (new Date(ss.pubtime * 1000).getFullYear() == pubYear) {
                            sss.push(ss);
                        }
                    });
                }
                if (sss.length > 0) {
                    var ssid = sss[0].season_id;
                    var ssidList = $('#ssiddatalist');
                    if (sss.length > 1 && !ssidList.loaded) {
                        var optSet = false;
                        sss.forEach(ss=>{
                            var opt = $C('option', {value: ss.season_id});
                            opt.textContent = ss.title.replace(/<em[^>]+>|<\/em>/g,'');
                            ssidList.appendChild(opt);
                            if (opt.value == ssIds[av[1]]) {
                                opt.selected = true;
                                optSet = true;
                                ssidList.title = 'B站相关番剧:' + opt.textContent;
                            } else if (!optSet && opt.textContent == sessionStorage.avTitle) {
                                ssid = ss.season_id;
                                opt.selected = true;
                            }
                        });
                        ssidList.onchange = ()=> {
                            currentSsid = ssidList.value;
                            storeDanmu(currentSsid);
                            var ssIds = GM_getValue('ssIds') || {};
                            ssIds[av[1]] = currentSsid;
                            GM_setValue('ssIds', ssIds);
                            ssidList.title = 'B站相关番剧:' + ssidList.options[ssidList.selectedIndex].text;
                        };
                        ssidList.style.display = 'block';
                        ssidList.loaded = true;
                    }
                    if (!csSsId) {
                        if (currentSsid && danmuSet[currentSsid]) {
                            storeDanmu(currentSsid);
                        } else {
                            storeDanmu(ssid);
                        }
                    }
                    // var ssApi = `https://bangumi.bilibili.com/view/web_api/season?season_id=${ssid}`;
                    // XHR({url:ssApi,isjson:true,headers:{Referer:bRef} }).then(ss=>{
                    //     if (ss.result && ss.result.episodes && ss.result.episodes.length > 0) {
                    //         var eps = ss.result.episodes;
                    //         cid = eps[Number(ep[1])-1].cid;
                    //         storeDanmu(cid);
                            // if (ss.result.episodes.length > 1) {
                            //     var sidList = $('#ssiddatalist');
                            //     eps.forEach(ep=>{
                            //         var opt = $C('option', {})
                            //     });
                            // } else {
                            //     bd[av[1]] = bd[av[1]] || {};
                            //     bd[av[1]][ep[1]] = cid;
                            //     GM_setValue('BiliDanmu', bd);
                            // }
                    //     }
                    // });
                } else if (!csSsId) {
                    isDmNotFound = true;
                    console.log('B站无此剧！');
                    $('#ssidtext').value = 'B站无此剧';
                }
            });

        }
    }

    function hideIdleCursor() {
        var mouseTimer, cursorVisible = true;
        var disappearCursor = ()=> {
            mouseTimer = null;
            document.body.style.cursor = "none";
            cursorVisible = false;
        };
        mouseTimer = setTimeout(disappearCursor, 2000);
        document.addEventListener('mousemove', function() {
            if (mouseTimer) {
                clearTimeout(mouseTimer);
            }
            if (!cursorVisible) {
                document.body.style.cursor = "default";
                cursorVisible = true;
            }
            mouseTimer = setTimeout(disappearCursor, 2000);
        });
    }

    function XHR(req) {
        var details = {};
        var method = (req.finalUrl)? "HEAD" : req.method || "GET";
        var isjson = req.isjson || false;
        var rspt = req.responseType;
        details.url = req.url;
        details.method = method;
        if (req.headers) details.headers = req.headers;
        if (req.data) details.data = req.data;
        if (rspt) details.responseType = rsp;

        return new Promise((resolve, reject) => {
            details.onload = e =>{
                try {resolve((method=='HEAD')? ((req.finalUrl)? e.finalUrl : e.responseHeaders) : ((isjson)? JSON.parse(e.responseText) : ((rspt)? e.response : e.responseText)))}
                catch(e){ reject('XHR error'); }
            };
            GM_xmlhttpRequest(details);
        });
    }

    function getCookie(key) {
        return document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1");
    }
    function setCookie(name,value,days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }
    function clearCookies() {
        document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    }
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }
    function isTextNode(n) {
        return n.localName == "textarea" || (n.localName == "input" && (n.type == "text" || n.type == "password") || n.contentEditable == 'true');
    }
    function $(css, node) {
        return node? node.querySelector(css) : document.querySelector(css);
    }
    function $All(css, node) {
        return node? node.querySelectorAll(css) : document.querySelectorAll(css);
    }
    function $C(name, attrs) {
        var n = document.createElement(name);
        if (attrs) {
            Object.keys(attrs).forEach(k=>n.setAttribute(k, attrs[k]));
        }
        return n;
    }
    function $CS(str) { //create node from string
        var n = $C('div');
        n.innerHTML = str.trim();
        return n.firstChild;
    }

    function getDanmuFilter() {
        return [
            /脑残|下限|人渣|萌豚|有病|[老劳][资資]|崽子|扇脸|[撕怂]B|丢[你泥尼拟雷累类妮呢伱妮][老楼漏][母某]|扑街|欠(打|日|操|艹|抽|收拾)/,
            /(求|我|祝|保佑).{0,5}[考上]|保佑.{0,5}[我前不挂]|考神/,
            /^\s*([？！\.\?\!～~,，。\\\/]{1,})\s*$/,
            /痰|屄|尻|娼|嫖|婊|裱|贱|肏|吠|傻|痴|呸|呕|淫|啐|胴|烂|屎/,
            /[你我他她它老泥尼拟死妳伱妮呢][母马妈玛妹奶娘煤]|[^A-Za-z](NMB|nmb|Nmb|NIMABI|nimabi|C.{0,5}N.{0,5}M|c.{0,5}n.{0,5}m|fuck|FUCK|Fuck)[^A-Za-z]/,
            /祥瑞玉兔|家宅平安|祥瑞平安|羊踹玉兔|玉兔喊疼|[逝死]者安息|无意冒犯/,
            /[傻煞渣死二烧][逼笔哔碧比屄饼吊叼屌]|(2B|2b|SB|sb|Sb|S13|s13|NC|^.{0,4}nc.{0,4}$|Nc|nC)[^A-Za-z]/,
            /(去|弄|必须)死|杀了[你我他她它泥尼拟]|死.{0,2}(爸|妈|爹|娘|全家|户口本)|司马$/,
            /[由有]我(来){0,}[组租]成/,
            /(好|求不)卡|卡了|卡[成出粗][狗翔屎]|.*(带宽|宽带)|[小大粗细]水管|看不了|[黑花绿]屏/,
            /我知道你.{0,1}[在再能]看|[我只唯][宣爱]/,
            /灵车|坟[圈头]|棺材/,
            /([你尼泥拟]|[真也]).{0,3}[够垢]了/,
            /爱的(供[养氧]|自杀)|再问(供[养氧]|自杀)/,
            /(PA|Pa|pa|啪|帕|拍){3,}|割鸡|小(丁丁|鸡|J|j)|[鸡Jj][巴吧8Bb]|一(硬|石更)/,
            /^@.{1,9}$|若风|老E|老e|纯黑|bishi|鼻屎|碧诗|姥爷|aoao|AOAO|敖|厂长|伊丽莎白鼠|吃素的狮子|八尾妖[姬基鸡]|黄大蒜/,
            /分钟的(人生|鬼畜|精神污染)/,
            /[我你].*(宇宙|世界).*[丑笨帅傻酷]|大声.*(告诉|说出)/,
            /(其他|另|另外).{1,5}(个|位|名|铭|明).*[好嚎耗豪]|(你们|大家)好/,
            /你在[哪那]里|[别憋鳖][跑走]|的等[我等着]/,
            /脸不.{0,1}给.{0,1}看|[当档挡].*脸|是你们.{0,2}看/,
            /处女[币幣B]|[硬投][币幣](送上|[已一以]投)|投.{0,1}[币幣]/,
            /空降(成功|失败|完美)|(成功|失败|完美)空降|空难现场/,
            /跳([Oo][Pp]|[Ee][Dd])|([Oo][Pp]|[Ee][Dd])跳|^[Oo][Pp]$|^[Ee][Dd]$/,
            /好生?气|气[炸死飞]/, /^(.)\1+$|^\d+$/, /\d+.\d+.\d+/,
            /眼(睛|镜)里|来过/,/亲.*币/,
            /音无结弦|接受挑战|颜表立|又见面了|米|贵圈|画质|男主|女主|画面|经费|起立|awsl|emt|零开始|赞歌|有生之年|恭喜|vpn|翻墙|停不下来/,
            /生日|卡|考古|谢|注意|圣杯战争/, /^[a-zA-z0-9\s\-]+$/, /20\d\d|19\d\d/,
            /复习|温习|回顾|重温|温故|项链|送终|送钟|高能|高虐|完结|撒花|时臣|时辰|那一?年|我/,
            /全剧终|舒服|糟糕|可本|坚强|走好|截图|头七|看看|高甜|核能|截屏|泪目|从左到右|再来/,
            /([弹彈][幕目]|人|小伙伴).{0,2}(清|不见|多|少|薄|厚|没|木|有|无|呢|捏|哪|纳|支援|不够|开)/,
            /(清|不见|多|少|薄|厚|没|木|有|无|开).{0,2}([弹彈][幕目]|人|小伙伴)|^([弹彈][幕目]|人|小伙伴)[呢捏哪纳].{0,3}$/,
            /签到|打卡|留..念|到此一游|观光团|每[天日]\S{1,}|\S{1,}周目|[第每]\S{1,}遍|一[天日]不[看听].*难受/,
            /[①②③④⑤⑥⑦⑧⑨０１２３４５６７８９0-9 〇一二两俩三仨四五六七八九十零百千万亿Ww]{2,4}.{0,1}遍|[就才].*(看|听|循环)遍.*关/,
            /\bop\b|\bed\b|\bbgm\b/i,
            /^[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘’，。、\s]+$/,
            /好听/,
            /晴艾|艾晴/
        ];
    }
})();
