// ==UserScript==
// @name        Video Player Hacker
// @namespace   Violentmonkey Scripts
// @include     /https?:\/\/[\w]+\.(mxdm\d?\.\w+|wjys\d?\.cc)\/.*/
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// @version     0.1.4
// @author      -
// @description 2024/1/12 18:29:44
// ==/UserScript==

(function(){
    var loc = location.href;
    var JSLoaded = false;
    var ignoreJS = /\/(aes|flv\.min|main|md5|jquery\.min\layer|btjsonplayer.+)\.js/;
    var nextUrl = null;
    var mxdmDomain = 'https://www.mxdm.tv';
    var cDomain = location.origin;
    var isRetried = false;
    GM_addStyle(' iframe{animation:frame 1ms; outline:none;} @keyframes frame{from{opacity:.9;}to{opacity:1;}} }');
    document.addEventListener('animationstart', e => {
        if (e.animationName == 'frame') {
            e.target.remove();
        } else if (e.animationName == 'h5videoload') { // 'h5videoload' from 'Video Player Enhancement' user script
            initVideo(e.target);
        }
    });

    //var player_aaaa = {url: '50VtRCxDc%2FV%2F%2BvAa9vlHSEriFbkytw5X4V9aIwgIAR97ShhC5rkb6erJxVYlsJFiZQwWUDxrUVa%2FORFjGzZuQQ%3D%3D'};
    if (loc.match(/mxdm\d?\.\w+|wjys\d?\.\w+/)) {
        GM_addStyle('#mxoneweek-tabs{z-index:1;} body.play {overflow:auto;} .tips-box,.drop.pc,.video-player-handle-more,.video-info-share{display:none;} \
                #cbNxtBtn{font-size: 20px; vertical-align: middle; padding: 2px 12px 0 5px;cursor: pointer;color: white;} #header .search-input{color:#e3e6eb !important} \
                .yzmplayer-played {background: rgb(225, 17, 239)} #header .content {max-width: 1280px;} .logo img{height:20px} .brand{margin:0;} \
                .nav .nav-menu-item{padding:0 8px;} .icon-reload::before{content:"\\e902";} \
                #reloadBtn {font-size: 20px;vertical-align: middle;padding: 2px 12px 0 5px;cursor: pointer;color: white;}');
        GM_addStyle('.yzmplayer-controller, .leleplayer-controller {margin-bottom: 2px;opacity: 1 !important;padding:0 !important;} \
                .leleplayer-bar-wrap, .leleplayer-bar {width:100% !important;} .leleplayer-icons.leleplayer-icons-left {padding-left: 20px;}'); // show process bar
        GM_addStyle('.list-item:hover .delHistory {display: inline-block;} .delHistory {right: 5px;position: fixed;display: none;} .delHistory:hover,.delFav:hover{color:red;}');
        GM_addStyle('.diplayer-loading-icon{display:none !important;}');
        if (loc.match(/mxdm\d?\.\w+\/dongmanplay\/|wjys\d?\.\w+\/vodplay\//)) {
            var lines = $All('.module-tab-item.tab-item');
            var currLine = loc.match(/\/\d+-(\d+)-\d+\.html/)[1];
            if (lines.length > 0 && lines.length < parseInt(currLine)) {
                lines[0].click();
                return;
            }
            GM_addStyle('.player-info .video-info-main{display:block;}');

            mxdm();
            $('.player-wrapper').appendChild($C('div', {id: 'player', style:"position:absolute;left:0px;top:0px;"}));
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
                    autoPlayBtn.checked = !autoPlayBtn.checked;
                    GM_setValue('autoPlay', autoPlayBtn.checked);
                };

            }
            if (localStorage.videoVolume) {
                localStorage['leleplayer-volume'] = localStorage.videoVolume;
            }
            var cEsp = $('.scroll-content a.selected');
            if (cEsp) {
                cEsp.scrollIntoView();
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
            setHistory(curr);
            setHistoryView(curr);
        }

        var ph = getCookie('mac_history_dianying');
        var gm_ph = GM_getValue('mxdm_history') || '[]';
        if (ph) {
            if (JSON.parse(ph).length >= JSON.parse(gm_ph).length && ph != gm_ph) {
                GM_setValue('mxdm_history', ph);
            }
        } else if (JSON.parse(gm_ph).length > 0) {
            setCookie('mac_history_dianying', gm_ph, 3650);
        }

        var hList = $All('#history .list-item-link');
        hList.forEach(l => {
            let d = $C('span', {class:'delHistory', title:'删除历史', text:'✖'});
            d.onclick = e => {
                e.preventDefault();
                l.parentNode.remove();
                let h = JSON.parse(getCookie('mac_history_dianying'));
                h.find((a,i) => {
                    if (a.vod_name == l.title) {
                        h.splice(i, 1);
                        setCookie('mac_history_dianying', JSON.stringify(h), 3650);
                    }
                });
            };
            l.appendChild(d);
        });

        var nav = $('.nav .nav-menu-items');
        var navHd = $('.header-module .nav-menu-items');
        if (nav && navHd) {
            GM_addStyle('.icon-fav::before {content: "\ue622"; } #favlist{scrollbar-width: thin;scrollbar-color: #d706ac gray;max-height: 400px;overflow: auto;} \
            #favlist .list-item-link {padding:0;} #favlist .drop-content-items{padding:10px;}');
            var nle = nav.lastElementChild;
            nle.classList.add('drop');
            nle.innerHTML = '<span class="nav-fav drop"><i class="iconfont nav-menu-icon icon-fav"></i><div class="drop-content drop-history"><div class="drop-content-box"><ul class="drop-content-items" id="favlist"><li class="list-item list-item-title"><a href="" class="playlist favclean"><i class="icon-clear"></i></a><strong>我的收藏记录</strong></li></ul></div></span>';
            navHd.appendChild(nle);
            var favList = GM_getValue('favList') || {};
            var fNode = $('#favlist');
            var addFavBtn = $('.display .btn-collect');
            if (loc.match(/dongmanplay/) && !addFavBtn) {
                addFavBtn = $CS('<a href="javascript:void(0);" data-type="2" data-mid="1" data-id="3822" class="mac_ulog  btn-large"><i class="iconfont  icon-shoucang"></i>收藏</a>');
                $('a.page-title').insertAdjacentElement('afterend', addFavBtn);
            }
            var setFav = (id, title) => {
                var nl = $CS(`<li class="list-item"><a href="${cDomain}/dongman/${id}.html" title="${title}" class="list-item-link" contextmenu="easyDragMenu"><i class="icon-play"></i>${title}<span class="delFav" title="删除收藏">✖</span></a></li>`);
                $('.delFav', nl).onclick = e => {
                    e.preventDefault();
                    nl.remove();
                    favList = GM_getValue('favList') || {};
                    delete favList[id];
                    GM_setValue('favList', favList);
                    if (addFavBtn) {
                        addFavBtn.lastChild.textContent = '收藏';
                    }
                }
                fNode.appendChild(nl);
            };
            for (let k in favList) {
                setFav(k, favList[k]);
            }
            if (addFavBtn) {
                var id = loc.match(/\d+/)[0];
                var title = $('.page-title').textContent.trim();
                if (favList[id]) {
                    addFavBtn.lastChild.textContent = '已收藏';
                }
                addFavBtn.onclick = e => {
                    favList = GM_getValue('favList') || {};
                    if (!favList[id]) {
                        setFav(id,title);
                        favList[id] = title;
                        addFavBtn.lastChild.textContent = '已收藏';
                        GM_setValue('favList', favList);
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
            setHistory(curr);
        }
    });

    function playNext() {
        localStorage.videoVolume = $('video').volume;
        var curr = $('div.selected .scroll-content a[class="selected"]');
        var nxt = curr.nextElementSibling;
        var setNext = url => {
            curr.classList.remove('selected');
            nxt.classList.add('selected');
            if (loc.match(/wjys\d?\.\w+/)) {
                YZN.play(url);
            } else {
                mxdm(url);
            }
            $('video').pause();
            unsafeWindow.toggleInfoPanel('加载下一集...'); // 'toggleInfoPanel' from 'Video Player Enhancement' user script
            history.replaceState(null,'', nxt.href);
            setNextButton();
            $('.btn-pc').textContent = nxt.innerText;
            //var ep = $('div.selected .scroll-content a[class="selected"] span').textContent;
            document.title = document.title.replace(/第\d+集/, nxt.innerText);
            var tt = $('.page-title a').title;
            setHistory(nxt);
            setHistoryView(nxt);
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
        mxdm();
    }

    function setHistory(node) {
        var tt = $('.page-title a').title;
        var ck = getCookie('mac_history_dianying');
        if (ck) {
            ck = JSON.parse(decodeURIComponent(ck));
            ck.find((a,i)=>{
                if (a.vod_name == tt) {
                    a.vod_url = node.href;
                    a.vod_part = node.innerText;
                    //[ck[0], ck[i]] = [ck[i], ck[0]];
                    ck.splice(i, 1);
                    ck.unshift(a);
                    setCookie('mac_history_dianying', JSON.stringify(ck), 3650);
                }
            });
        }
    }

    function setHistoryView(node) {
        var tt = $('.page-title a').title;
        var hs = [...$All('#history li a')];
        hs.find(i=>{
            if (i.title == tt) {
                i.href = node.href;
                $('span', i).textContent = node.innerText;
                $('#history li').insertAdjacentElement('afterend', i.parentNode);
            }
        });
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
            fUrl = vDomainParse + player_aaaa.url;
            nextUrl = player_aaaa.url_next;
        } else if (fUrl) {
            fUrl = vDomainParse + fUrl;
        }
        if (fUrl) {
            var pt = $('.page-title.btn-pc');
            if (pt) {
                pt.replaceWith($C('a', {href: fUrl, class:'btn-pc page-title episode', text: pt.textContent, target: '_blank'}));
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
        //v.oncanplay = ()=> {
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
                $('#bofang,.yzmplayer-play-icon').insertAdjacentElement('afterend', reloadBtn);
                $('#bofang,.yzmplayer-play-icon').insertAdjacentElement('afterend', cloneNxtBtn);
            }
        //};
        v.onended = ()=> {
            if (localStorage.videoVolume != v.volume) {
                localStorage.videoVolume = v.volume;
            }
            if($('#autoPlayBtn').checked) playNext();
        };
        $('#player').classList.remove('leleplayer-pause', 'yzmplayer-pause');
        $('#player').classList.add('leleplayer-playing', 'yzmplayer-playing');
        v.onplaying = ()=> {
            $('#player').classList.remove('leleplayer-pause', 'yzmplayer-pause');
            $('#player').classList.add('leleplayer-playing', 'yzmplayer-playing');
        };
    }

})()
