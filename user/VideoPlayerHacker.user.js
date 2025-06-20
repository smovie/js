// ==UserScript==
// @name        Video Player Hacker
// @namespace   Violentmonkey Scripts
// @include     /https?:\/\/[\w]+\.(mxdm\d?\.\w+|wjys\d?\.cc)\/.*/
// @match       https://danmu.yhdmjx.com/m3u8.php*
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// @require     https://cdn.jsdelivr.net/npm/hls.js/dist/hls.min.js
// @require     https://cdn.jsdelivr.net/npm/dplayer/dist/DPlayer.min.js
// @version     0.1.5
// @author      -
// @description 2024/1/12 18:29:44
// ==/UserScript==

(function(){
    var isHackJS = false;
    var loc = location.href;
    var JSLoaded = false;
    var ignoreJS = /\/(aes|flv\.min|main|md5|jquery\.min\layer|btjsonplayer.+)\.js/;
    var nextUrl = null;
    var mxdmDomain = 'https://www.mxdm.tv';
    var cDomain = location.origin;
    var isRetried = false;
    var isMsgAdded = false;
    var dp = null;
    var vid = null;
    var ep = null;
    var line = null;
    var name = null;

    if (loc.match('https://danmu.yhdmjx.com/m3u8.php')) {
        console.log('start loading video ...');
        var intval = setInterval(()=>{
            var s = $('video');
            if (s && s.src) {
                clearInterval(intval);
                parent.postMessage({videoSrc: s.src}, '*');
                console.log('video loaded');
            }
        },1e3);
        return;
    }

    GM_addStyle('iframe{animation:frame 1ms; outline:none;} @keyframes frame{from{opacity:.9;}to{opacity:1;}} }');
    GM_addStyle('video{animation:h5videoload 1ms; outline:none;} @keyframes h5videoload{from{opacity:.9;}to{opacity:1;}} }');
    document.addEventListener('animationstart', e => {
        if (e.animationName == 'frame' && isHackJS) {
            e.target.remove();
        } else if (e.animationName == 'h5videoload') {
            initVideo(e.target);
        }
    });

    //var player_aaaa = {url: '50VtRCxDc%2FV%2F%2BvAa9vlHSEriFbkytw5X4V9aIwgIAR97ShhC5rkb6erJxVYlsJFiZQwWUDxrUVa%2FORFjGzZuQQ%3D%3D'};
    if (loc.match(/mxdm\d?\.\w+|wjys\d?\.\w+/)) { //#e111ef
        GM_addStyle('#mxoneweek-tabs{z-index:1;} body.play {overflow:auto;} .tips-box,.drop.pc,.video-player-handle-more,.video-info-share{display:none;} \
                #cbNxtBtn{font-size: 20px; vertical-align: middle; padding: 2px 12px 0 5px;cursor: pointer;color: white;} #header .search-input{color:#e3e6eb !important} \
                .yzmplayer-played, .dplayer-played, .dplayer-thumb {background: #fd3a63 !important;} #header .content {max-width: 1280px;} \
                .nav .nav-menu-item{padding:0 8px;} .icon-reload::before{content:"\\e902";} .logo img{height:20px} .brand{margin:0;} .wapblock{float:right;} \
                #reloadBtn {font-size: 20px;vertical-align: middle;padding: 2px 12px 0 5px;cursor: pointer;color: white;}');
        GM_addStyle('.showbar .yzmplayer-controller,.showbar .leleplayer-controller,.showbar .dplayer-controller {margin-bottom: 2px;opacity: 1 !important;padding:0 !important;} \
                #history,#favlist {max-height: 400px;overflow: auto;scrollbar-width: thin; padding: 5px;} #history .list-item-link, #favlist .list-item-link{padding-right:20px;} \
                .leleplayer-bar-wrap, .leleplayer-bar, .dplayer-bar-wrap {width:100% !important;} .leleplayer-icons.leleplayer-icons-left {padding-left: 20px;}'); // show process bar
        GM_addStyle('.list-item:hover .delHistory,.list-item:hover .delFav {display: inline-block;} .delHistory,.delFav {right: 10px;position: absolute;display: none;} .delHistory:hover,.delFav:hover{color:red;}');
        GM_addStyle('.diplayer-loading-icon{display:none !important;} .mxoneweek-list .item-link span {max-width: 275px;white-space: nowrap;text-overflow: ellipsis;overflow: hidden;}');
        clearOldHistory();
        if (loc.match(/mxdm\d?\.\w+\/dongmanplay\/|wjys\d?\.\w+\/vodplay\//)) {
            var lines = $All('.module-tab-item.tab-item');
            var vi = getVideoInfo();
            ep = vi.ep;
            vid = vi.vid;
            line = vi.line;
            name = vi.name;
            if (lines.length > 0 && lines.length < parseInt(line)) {
                lines[0].click();
                return;
            }
            GM_addStyle('.player-info .video-info-main{display:block;} .csTitle {vertical-align: top;} .dplayer-bar-time::after {content: attr(offset);margin-left:5px;display: inline-block;   white-space: nowrap;} \
                .page-title a {  max-width: 490px;  display: inline-block;  white-space: nowrap;  text-overflow: ellipsis;  overflow: hidden; }');

            $('#playleft').appendChild($C('div', {id: 'player', style:"position:absolute;left:0px;top:0px;width: 100%;height: 100%;background: black;"}));

            mxdm();

            var vph = $('.video-player-handle');
            if (vph) {
                var showBarDiv = $CS('<div class="drop"><input id="showBarBtn" type="checkbox" style="-webkit-appearance: auto;"><span style="color: #8f8f8f;font-size: 12px;">显示进度条</span></div>');
                vph.insertAdjacentElement('afterbegin', showBarDiv);
                var showBarBtn = $('#showBarBtn');
                showBarBtn.checked = GM_getValue('showBar') || false;
                if (showBarBtn.checked) {
                    $('#main').classList.add('showbar');
                }
                showBarBtn.onclick = ()=> {
                    $('#main').classList.toggle('showbar', showBarBtn.checked);
                    GM_setValue('showBar', showBarBtn.checked);
                };
            }

            var nxtBtn = $('a.handle-btn');
            if (nxtBtn) {
                setNextButton();
                nxtBtn.onclick = e => {
                    e.preventDefault();
                    playNext();
                }
                var autoPlayDiv = $CS('<div class="drop"><input id="autoPlayBtn" type="checkbox" style="-webkit-appearance: auto;"><span style="color: #8f8f8f;font-size: 12px;">自动播放</span></div>');
                nxtBtn.insertAdjacentElement('beforebegin', autoPlayDiv);
                var autoPlayBtn = $('#autoPlayBtn');
                autoPlayBtn.checked = GM_getValue('autoPlay') || false;
                autoPlayBtn.onclick = ()=> {
                    //autoPlayBtn.checked = !autoPlayBtn.checked;
                    GM_setValue('autoPlay', autoPlayBtn.checked);
                };

            }
            if (localStorage.videoVolume) {
                localStorage['leleplayer-volume'] = localStorage.videoVolume;
                localStorage['dplayer-volume'] = localStorage.videoVolume;
            }
            var cEsp = $('.scroll-content a.selected');
            if (cEsp) {
                cEsp.scrollIntoView({block: "center", inline: "nearest"});
            }

        }
        if ($('#mxoneweek-tabs-list')) {
            $('#mxoneweek-tabs-list').onmouseover = e=> {
                var n=e.target;
                if (n.className == 'item-link' && !n.title) {
                    n.title = n.innerText;
                } else if (n.parentNode.className == 'item-link' && !n.parentNode.title) {
                    n.parentNode.title = n.parentNode.innerText;
                }
            }
        }
        if (loc.match(/\/(show|type)\//)) {
            var other = $C('a', {href: '/show/riman---其他--------.html', class: 'library-item', style:'color:yellow'});
            other.textContent = '其他';
            $('div.library-box:nth-child(2) > div:nth-child(1) > div:nth-child(2)').appendChild(other);
        }
        var playList = $All('.module-list .module-item');
        playList.forEach(pl => {
            var pa = $('.module-item-pic a', pl);
            pa.href = pa.href.replace('/dongman/', '/dongmanplay/').replace('.html', '-1-1.html');
            pa.target = '_blank';
            var cas = $All('.module-item-content a', pl);
            cas.forEach(ca => ca.target = '_blank');
            $('.module-item-titlebox a', pl).target = '_blank';
        });
        var curr = $('div.selected .scroll-content a[class="selected"]');
        if (curr) {
            saveHistory();
        }
        setHistoryView();

        var nav = $('.nav .nav-menu-items');
        var navHd = $('.header-module .nav-menu-items');
        if (nav && navHd) {
            GM_addStyle('.icon-fav::before {content: "\ue622"; } #favlist{scrollbar-width: thin;scrollbar-color: #d706ac gray;max-height: 400px;overflow: auto;} \
            #favlist .drop-content-items{padding:10px;} .player-info .video-info-header {max-width: 80%;}');
            var nle = nav.lastElementChild;
            nle.classList.add('drop');
            nle.innerHTML = '<span class="nav-fav drop"><i class="iconfont nav-menu-icon icon-fav"></i><div class="drop-content drop-history"><div class="drop-content-box"><ul class="drop-content-items" id="favlist"><li class="list-item list-item-title"><a href="" class="playlist favclean"><i class="icon-clear"></i></a><strong>我的收藏记录</strong></li></ul></div></span>';
            navHd.appendChild(nle);
            navHd.appendChild($CS('<li class="space-line-bold"></li>'));
            var favList = GM_getValue('favList') || {};
            var fNode = $('#favlist');
            var addFavBtn = $('.display .btn-collect');
            var cid = loc.match(/dongman(play)?\/\d+/)? loc.match(/\/(\d+)/)[1] : '';
            if (loc.match(/dongmanplay/) && !addFavBtn) {
                addFavBtn = $CS('<a href="javascript:void(0);" data-type="2" data-mid="1" class="mac_ulog  btn-large csTitle"><i class="iconfont  icon-shoucang"></i>收藏</a>');
                $('a.page-title, span.page-title').insertAdjacentElement('afterend', addFavBtn);
            }
            var delFav = id => {
                if ($('#id'+id, fNode)) {
                    $('#id'+id, fNode).remove();
                }
                favList = GM_getValue('favList') || {};
                delete favList[id];
                GM_setValue('favList', favList);
                if (addFavBtn && cid == id) {
                    addFavBtn.lastChild.textContent = '收藏';
                    addFavBtn.title = '点击收藏';
                }
            };
            var setFavMenu = (id, title) => {
                var nl = $CS(`<li id="id${id}" class="list-item"><a href="${cDomain}/dongman/${id}.html" title="${title}" class="list-item-link" ><i class="icon-play"></i>${title}<span class="delFav" title="删除收藏">✖</span></a></li>`);
                $('.delFav', nl).onclick = e => {
                    e.preventDefault();
                    delFav(id);
                }
                fNode.appendChild(nl);
            };
            for (let k in favList) {
                setFavMenu(k, favList[k]);
            }
            if (addFavBtn) {
                var title = $('.page-title').textContent.trim();
                if (favList[cid]) {
                    addFavBtn.lastChild.textContent = '已收藏';
                    addFavBtn.title = '点击取消收藏';
                }
                addFavBtn.onclick = e => {
                    favList = GM_getValue('favList') || {};
                    if (!favList[cid]) {
                        if (addFavBtn.lastChild.textContent == '已收藏') {
                            addFavBtn.lastChild.textContent = '收藏';
                            addFavBtn.title = '点击收藏';
                        } else {
                            setFavMenu(cid,title);
                            favList[cid] = title;
                            addFavBtn.lastChild.textContent = '已收藏';
                            addFavBtn.title = '点击取消收藏';
                            GM_setValue('favList', favList);
                        }
                    } else {
                        if (addFavBtn.lastChild.textContent == '收藏') {
                            addFavBtn.lastChild.textContent = '已收藏';
                            addFavBtn.title = '点击取消收藏';
                        } else {
                            delFav(cid);
                        }
                    }
                };
            }
        }
    }

    document.addEventListener('keyup', e => {
        switch(e.code) {
            case 'BracketRight': playNext();break; // ']'
        }
    });
    window.addEventListener('beforeunload', e => {
        var curr = $('div.selected .scroll-content a[class="selected"]');
        if (curr) {
            saveHistory();
        }
    });

    function saveHistory(isNext) {
        var mxHistory = GM_getValue('mxHistory') || {};
        var v = getVideoInfo();
        var ts = (mxHistory[vid] && mxHistory[vid].e == v.ep)? mxHistory[vid].t : 0;
        if (!isNext && dp && dp.video && dp.video.currentTime > 30) {
            ts = dp.video.currentTime;
        }
        mxHistory[vid] = {n: name, l: v.line, e: v.ep, t: ts, s: Date.now()};
        GM_setValue('mxHistory', mxHistory);
    }

    function setHistoryView(isNext) {
        if (isNext) {
            var epNode = $(`#history a[href*="/${vid}-"] span`);
            if (epNode) {
                epNode.innerText = epNode.innerText.replace(/\d+/, getVideoInfo().ep);
            }
            return;
        }
        var hNode = $('#history');
        var hTips = $('#history .drop-tips');
        var hList = $All('#history .list-item-link').forEach(l => l.parentNode.remove());
        var mh = GM_getValue('mxHistory') || {};
        var vids = Object.keys(mh).sort((a,b)=>mh[a].s < mh[b].s);
        if (vids.length > 0 && hTips) {
            hTips.remove();
        }
        vids.forEach(id => {
            let v = mh[id];
            let li = $C('li', {class: 'list-item'});
            let a = $C('a', {class: 'list-item-link'});
            let i = $C('i', {class:'icon-play'});
            let sp = $C('span', {text: `第${v.e}集`});
            a.href = `${cDomain}/dongmanplay/${id}-${v.l}-${v.e}.html`;
            a.appendChild(i);
            a.appendChild(sp);
            a.title = v.n;
            let d = $C('i', {class:'delHistory', title:'删除历史', text:'✖'});
            d.onclick = e => {
                e.preventDefault();
                li.remove();
                delete mh[id];
                GM_setValue('mxHistory', mh);
            };
            a.appendChild(d);
            a.appendChild(document.createTextNode(v.n));
            li.appendChild(a);
            hNode.appendChild(li);
        });
        var clearAll = $('.playlist.historyclean');
        if (clearAll) {
            clearAll.title = '清空历史';
            clearAll.onclick = e => {
                e.preventDefault();
                if (confirm('确定清空播放历史？')) {
                    $All('#history .list-item-link').forEach(l => l.parentNode.remove());
                    GM_setValue('mxHistory', {});
                }
            };
        }
    }

    function getVideoInfo() {
        var vi = location.href.match(/\d+-\d+-\d+/)[0].split('-');
        return {vid: vi[0], line: vi[1], ep: vi[2], name: $('.page-title a').innerText};
    }

    function clearOldHistory() {
        var mxHistory = GM_getValue('mxHistory') || {};
        var mxLastCheck = GM_getValue('mxLastCheck') || 0;
        var tt = 3600 * 24 * 90 * 1e3;
        var now = Date.now();
        if (now - mxLastCheck > tt) { // claer old record every 3 month
            GM_setValue('mxLastCheck', Date.now());
            for (const k in mxHistory) {
                if (mxHistory[k].s && now - mxHistory[k].s > tt) {
                    delete mxHistory[k];
                }
            }
            GM_setValue('mxHistory', mxHistory);
        }
    }

    function playNext() {
        localStorage.videoVolume = $('video').volume;
        var curr = $('div.selected .scroll-content a[class="selected"]');
        var nxt = curr.nextElementSibling;
        var setNext = url => {
            curr.classList.remove('selected');
            nxt.classList.add('selected');
            if (loc.match(/wjys\d?\.\w+/)) {
                if (url.match(/http.+\.(m3u8|mp4)/)) {
                    if (dp) {
                        dp.switchVideo({ url: url});
                    }
                } else {
                    YZN.play(url);
                }
            } else {
                mxdm(url);
            }

            $('video').pause();
            unsafeWindow.toggleInfoPanel('加载下一集...'); // 'toggleInfoPanel' from 'Video Player Enhancement' user script
            //setInterval(()=>console.log('XXXX', dp.video.duration), 2e3);
            history.replaceState(null,'', nxt.href);
            setNextButton();
            $('.btn-pc').textContent = nxt.innerText;
            //var ep = $('div.selected .scroll-content a[class="selected"] span').textContent;
            document.title = document.title.replace(/第\d+集/, nxt.innerText);
            var tt = $('.page-title a').title;
            saveHistory(true);
            setHistoryView(true);
        };
        if (nxt && nxt.nodeName == 'A' && nxt.href.match(/\/\d+-\d+-\d+\.html/)) {
            var isSetNext = false;
            if (nextUrl) {
                setNext(nextUrl);
                isSetNext = true;
                nextUrl = null;
            }
            XHR({url: nxt.href}).then(r=>{
                var ss = r.match(/var player_aaaa=.+url\":\"([^\"]+)\",\"url_next\":\"([^\"]+)/);
                if (!isSetNext) {
                    setNext(ss[1]);
                }
                nextUrl = ss[2];
            });
        }
    }

    function reloadVideo() {
        var a = $('.page-title.btn-pc');
        if (a && a.href && a.href.match(/url=.+/)) {
            $('#player video').pause();
            unsafeWindow.toggleInfoPanel('重新加载中...');
            savePlayTime();
            mxdm(a.href.match(/url=(.+)/)[1]);
        }
    }

    function setNextButton() {
        if (nxtBtn) {
            var curr = $('div.selected .scroll-content a[class="selected"]');
            var nxt = curr.nextElementSibling;
            if (nxt && nxt.nodeName == 'A') {
                nxtBtn.style.display = 'inline-block';
                nxtBtn.href = nxt.href;
            } else {
                nxtBtn.style.display = 'none';
                $('#cbNxtBtn').style.display = 'none';
            }
        }
    }

    function mxdm(fUrl) {
        var vDomain = 'https://danmu.yhdmjx.com/';
        var vDomainParse = vDomain + 'm3u8.php?url=';
        if (loc.match('wjys')) {
            vDomain = 'https://tv.naifei.ws/player/';
            vDomainParse = vDomain + 'jiexi.php?v=';
        }
        if (!fUrl && typeof player_aaaa !== 'undefined') {
            $All('#playleft iframe').forEach(f=>f.remove());
            nextUrl = player_aaaa.url_next;
            if (player_aaaa.url.match(/http.+\.(m3u8|mp4)/)) {
                if (dp) {
                    dp.switchVideo({ url: player_aaaa.url});
                } else {
                    dp = new DPlayer({
                        container: document.getElementById('player'),
                        autoplay: true,
                        volume: 1,
                        video: { url: player_aaaa.url}
                    });
                }
                dp.play();
                return;
            } else {
                fUrl = vDomainParse + player_aaaa.url;
            }
        } else if (fUrl) {
            fUrl = vDomainParse + fUrl;
        }
        if (fUrl) {
            var pt = $('.page-title.btn-pc');
            if (pt) {
                pt.replaceWith($C('a', {href: fUrl, class:'btn-pc page-title episode csTitle', text: pt.textContent, target: '_blank'}));
            }
            if (!isHackJS) {
                $('#playleft').appendChild($C('iframe',  {src: fUrl}));
                if (!isMsgAdded) {
                    isMsgAdded = true;
                    GM_addStyle('iframe {width:0 !important;height:0 !important;} .MacPlayer video {position: absolute;top: 0;bottom: 0;left: 0;width: 100%;height: 100%;border: 0;}');
                    window.addEventListener("message", evt => {
                        var msg = evt.data.videoSrc;
                        if (msg) {
                            ep = getVideoInfo().ep;
                            console.log('rebuilding video player ...', vid, ep);
                            $All('#playleft iframe').forEach(f=>f.remove());
                            if (dp) {
                                dp.switchVideo({ url: msg});
                            } else {
                                dp = new DPlayer({
                                    container: document.getElementById('player'),
                                    autoplay: true,
                                    volume: 1,
                                    video: { url: msg}
                                });
                            }
                            var lpt = GM_getValue('mxHistory');
                            if (lpt) {
                                if (lpt[vid] && lpt[vid].e == getVideoInfo().ep && lpt[vid].t) {
                                    dp.seek(lpt[vid].t);
                                    dp.notice('已自动跳转至上次播放位置!', 5000, 0.8);
                                }
                            }
                            dp.play();
                        }
                    });
                }
                return;
            }
            XHR({url:fUrl, timeout: 10e3}).then(r=>{
                var alt = r.match('解析不到该播放地址') || r.match('XHR TIMEOUT');
                if (alt) {
                    if (isRetried) {
                        isRetried = false;
                        alert(alt[0]);
                        return;
                    } else {
                        isRetried = true;
                        mxdm(fUrl);
                    }
                }
                var dom = new DOMParser().parseFromString(r, "text/html");
                var ss = $All('script', dom);
                var sa = ['var danmuon = false;'];
                ss.forEach(s=> {
                    var attr = s.getAttribute('src');
                    var str = '';
                    if (attr) {
                        if (JSLoaded && attr.match(ignoreJS)) {return;}
                        str = attr.match(/^http/i)? attr : vDomain + attr;
                    } else {
                        str = s.textContent.replace(/lele\.start\(\)|YZN\.start\(\)/, '');
                    }
                    sa.push(str);
                });
                var mjs = $('script[src*="/ver.js"]', dom);
                if (mjs) {
                    var mjsSrc = mjs.getAttribute('src');
                    mjsSrc = mjsSrc.match(/^http/i)? mjsSrc : vDomain + mjsSrc;
                    XHR({url:mjsSrc}).then(js=> {
                        var jsfs = js.match(/\{[^\}]+\}/)[0].match(/http.+\.js/ig);
                        mjs.remove();
                        jsfs.forEach(s=>{
                            if (JSLoaded && s.match(ignoreJS)) {return;}
                            sa.push(s);
                        });
                        addScripts(sa);
                    });
                } else {
                    addScripts(sa);
                }
                var ls = $All('link', dom);
                ls.forEach(l=> {
                    var src = l.getAttribute('href');
                    if (src) {
                        src = src.match(/^http/i)? src : vDomain + src;
                        addStyle(src);
                    }
                });
                $All('iframe').forEach(i=>i.remove());
            });

        }

    }

    function addScripts(sa) {
        if (sa.length == 0) {
            if (unsafeWindow.lele) { JSLoaded = true;
                lele.start();
            } else if (unsafeWindow.YZN) {
                setTimeout(()=> YZN.play(YZN.decrypt(config.url)), 1e3);
            }
            return;
        }
        var s = sa.shift();
        var node = $C('script');
        if (s.match(/^https?:\/\//i)) {
            node.setAttribute('src', s);
            node.onload = ()=> {
                addScripts(sa);
            }
        } else {
            node.textContent = s;
            addScripts(sa);
        }
        $('head').appendChild(node);
    }

    function addStyle(s) {
        var node;
        if (s.match(/^https?:\/\//i)) {
            node = $C('link', {rel: "stylesheet"});
            node.href = s;
        } else {
            node = $C('style');
            node.textContent = s;
        }
        $('head').appendChild(node);
    }

    function initVideo(v) {
        if (!$('#cbNxtBtn') && $('a.handle-btn').style.display != 'none') {
            var cloneNxtBtn = $('.icon-next').cloneNode(true);
            var reloadBtn = cloneNxtBtn.cloneNode(true);
            cloneNxtBtn.id = 'cbNxtBtn';
            cloneNxtBtn.title = '播放下集';
            cloneNxtBtn.onclick = playNext;
            reloadBtn.id = 'reloadBtn';
            reloadBtn.className = 'icon-reload';
            reloadBtn.title = '重新加载视频';
            reloadBtn.onclick = reloadVideo;
            $('#bofang,.yzmplayer-play-icon, .dplayer-play-icon').insertAdjacentElement('afterend', reloadBtn);
            $('#bofang,.yzmplayer-play-icon, .dplayer-play-icon').insertAdjacentElement('afterend', cloneNxtBtn);
        }
        v.onended = ()=> {
            if (localStorage.videoVolume != v.volume) {
                localStorage.videoVolume = v.volume;
            }
            if($('#autoPlayBtn').checked) playNext();
        };
        if (isHackJS) {
            $('#player').classList.remove('leleplayer-pause', 'yzmplayer-pause');
            $('#player').classList.add('leleplayer-playing', 'yzmplayer-playing');
            v.onplaying = ()=> {
                $('#player').classList.remove('leleplayer-pause', 'yzmplayer-pause');
                $('#player').classList.add('leleplayer-playing', 'yzmplayer-playing');
            };
        }
        var timeBar = $('.dplayer-bar-wrap');
        var tbt = $('.dplayer-bar-time', timeBar);
        if (timeBar) {
            timeBar.onmousemove = e => {
                let tt = tbt.innerText.split(':');
                let pt = parseInt(tt[0]) * 60 + parseInt(tt[1]);
                let offset = Math.floor(pt - v.currentTime);
                let offsetTxt = ((offset > 0)? '快进' : '倒退') + Math.abs(offset) + '秒';
                tbt.setAttribute('offset', offsetTxt);
            }
        }
    }

})()
