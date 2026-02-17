// ==UserScript==
// @name        Rate Info
// @namespace   Violentmonkey Scripts
// @include     /https://www\.age(fans|mys|dm)\.[\w]+/
// @include     https://bgm.tv/*
// @include     https://movie.douban.com/subject/*
// @include     https://www.bilibili.com/bangumi/*
// @include     /https?://www\.(mxdm\d?\.\w+|wjys\.cc)\/.*/
// @include     /https://www\.aowu\.tv\/.*/
// @include     /https://www\.295yhw\.com\/.*/
// @include     /https://www\.fsdm\d+?\.com\/.*/
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_setValue
// @grant       GM_getValue
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// @version     0.1.9
// @author      -
// @description 1/25/2023, 3:29:51 PM
// ==/UserScript==

(function(){

    //https://filmarks.com/search/animes?q=%E6%81%8B%E3%81%AF%E5%8F%8C%E5%AD%90%E3%81%A7%E5%89%B2%E3%82%8A%E5%88%87%E3%82%8C%E3%81%AA%E3%81%84

    GM_addStyle('#rateinfo, .rateresult{border: 1px solid white;} .rateresult {max-height: 98px; overflow: auto;margin-bottom:0;padding-left:0;} \
            .rateresult .result {height: 70px;display: flex;width:100%;} .rateresult .content {position: relative;width: calc(100% - 80px);} .rateresult h3 {display: inline-flex;} \
            .rateresult .rating-info .rate_score {color: #e09015;font-size: 16px;font-weight:bold;} .rateresult .rate_nums{color:white;} .rateresult span:hover {color: inherit;} \
            .ic-mark, .ic-movie-mark {display:none;} .rateresult span a {font-weight: bold;font-size:16px;} .rateresult .rating-info span,.rateresult li {font-size:12px;} \
            .rateresult .rating-info {font-size:12px;margin-top: 5px;} #detailname .favbtn, #detailname .bilisearch, #detailname .bgmsearch{font-weight: normal;	font-size: 16px;} \
            .rateresult li {width:100%; border-bottom: 1px solid #F2F2F2;overflow: hidden;line-height: 1.2;} .rating span {color: #ffa726;font-weight: bold;} .title {white-space: nowrap;} \
            .rateresult .cast {text-overflow: ellipsis;overflow: hidden;color: deepskyblue; font-size: 12px;margin-top:5px; white-space: nowrap;} #cast, .cast span {margin-right: 5px;} \
            .rateresult img {float: left;width: 50px;margin: 0 5px 0;height:70px;} .rateresult .subject-info{display: inline-grid;position: absolute;height: 100%;width: -moz-available;} \
            .rateresult a {text-decoration: none;display: block;overflow: hidden;position:relative;} \
            #rateinfo .rateSiteName {position: absolute;background: #2f2c2ca6;width: auto;border:none;color:white;} ');
    var pn = $C('div', {id: 'rateinfo'});
    var year, oname, cname, cname2, isRetryCN2 = false, biliSid;
    var loc = location.href;
    var mxdmDomain = 'https://www.mxdm.tv/';
    var isMini = false;
    var marks = /[^\u2E80-\u2FDF\u3040-\u318F\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7FF0-9A-Za-z]+|无修|国语|完全新作|^新 /g;
    var domains = GM_getValue('domains') || {};

    if (loc.match(/https:\/\/www\.age(fans|mys|dm)\.[\w]+/)) {
        var node = $('.detail_imform_name, #detailname a,.video_detail_title, .video_play_detail_wrapper .card-title');
        var insertPos = $('.report_div') && $('.report_div').parentNode || $('.video_list_box, #comment-anchor');
        if (node) {
            cname = node.textContent;
        }
        var infos = $All('.detail_imform_tag, .play_imform_tag, .video_detail_info');
        for (i = 0; i < infos.length; i++) {
            if (infos[i].textContent.includes('首播时间')) {
                year = (infos[i].textContent.replace('首播时间：', '').match(/\d+|暂无/) || $('.detail_imform_value, .play_imform_val', infos[i].parentNode).textContent.match(/\d+|暂无/))[0];
            } else if (infos[i].textContent.includes('原版名称')) {
                oname = infos[i].textContent.replace('原版名称：', '') || $('.detail_imform_value, .play_imform_val', infos[i].parentNode).textContent;
            }
            if (year && oname) {
                break;
            }
        }
        if (domains.Age != location.origin) {
            domains.Age = location.origin;
            GM_setValue('domains', domains);
        }
    } else if (loc.match('https://bgm.tv/subject/')) {
        GM_addStyle('div.title {padding-top: 0;white-space: nowrap;overflow: hidden;} .rateresult .subject-cast,.rateresult .cast {display:none;} \
            #infobox li:nth-child(1) {font-size: 20px;color: chartreuse;font-weight: bold;} #columnSubjectHomeA, #bangumiInfo .infobox, #bangumiInfo .cover {width: 300px;} \
            .subjectNav .navTabs, .mainWrapper, .columns{width:1080px;} .global_score .number{font-size: 32px;} h1.nameSingle::after{content:attr(year);color: chartreuse;} \
            #browserItemList .avatarCoverPortrait {  min-height: 100px;  max-height: 120px;  max-width: 85px; } #browserItemList li {  max-width: 85px; } \
            #browserItemList a.title {  text-overflow: ellipsis;  overflow: hidden; } ');
        insertPos = $('#panelInterestWrapper .shareBtn');
        oname = $('.nameSingle a').textContent;
        cname = $('.nameSingle a').title;
        var infobox = $All('#infobox li');
        for (let l of infobox) {
            if (l.textContent.match('发售日|放送开始')) {
                year = l.textContent.match(/\d{4}/)[0];
                $('h1.nameSingle').setAttribute('year', `(${year})`);
                break;
            }
        }
    } else if (loc.match('https://movie.douban.com/subject/')) {
        GM_addStyle('div.title {padding-top: 0;white-space: nowrap;overflow: hidden;} .rateresult .cast {display:none;} \
                    .rateresult .result{height:60px;padding-top: 0;border-bottom: 0;margin-bottom: 0;} .rateresult img {height:60px;} .rateresult .rate_nums {color:black;}');
        insertPos = $('.aside');
        var metatt = $('meta[name="keywords"]').content.split(',');
        cname = metatt[0];
        oname = metatt[1];
        year = $('span.year').textContent.match(/\d+/)[0];
    } else if (loc.match('https://www.bilibili.com/bangumi/')) {
        GM_addStyle('div.title {padding-top: 0;white-space: nowrap;overflow: hidden;} .rateresult .cast {display:none;} \
                    .rateresult li{font-size: 10px; color: white;} .rateresult {max-width: 250px;} .rateresult h3 a { font-weight: bold; font-size: 14px; color: white;} \
                    .media-info-score-wrp {padding-top: 0; margin-top: -30px;}');
        insertPos = $('.media-info-score-wrp');
        var mdi;
        if (typeof __INITIAL_STATE__ != "undefined") {
            mdi = __INITIAL_STATE__.mediaInfo;
            cname = mdi.title;
            oname = mdi.origin_name ;
            year = (mdi.publish.pub_date||mdi.publish.pub_time).match(/\d+/)[0];
            if (loc.match('/bangumi/play/')) {
                oname = mdi.jp_title || mdi.jpTitle;
                biliSid = mdi.season_id;
            }
        } else if ($('#__NEXT_DATA__')) {
            var j = JSON.parse($('#__NEXT_DATA__').textContent);
            var d = j.props.pageProps.dehydratedState.queries[0].state.data;
            cname = d.season_title;
            biliSid = d.season_id;
            year = d.publish.pub_time.match(/\d+/)[0];
            oname = cname;
        }

        if (loc.match('/bangumi/play/')) {
            isMini = true;
            insertPos = $('#media_module') || $('[class^="mediainfo_mediaInfoWrap"]');
            GM_addStyle('.media-cover {margin-left: 47px;} #rateinfo {position: absolute;background: #00000082;} .rateresult li{color:tomato;} .rateresult .rate_nums {color: darkgray;margin-top: -6px;} \
                        #rateinfo, .rateresult, .rateresult li {border: 1px solid pink; overflow: hidden;} .main-container .media-info .media-right {padding-left:180px;} \
                        .rateresult .result {height: 28px;} .media-rating{left:450px;} \
                        .rateresult .rate_score {  margin-top: -3px;  margin-left: 25px;  font-weight: bold; }');
        }
    } else if (loc.match(/mxdm\d?\.\w+\/dongman|wjys\.cc\/vod(play|detail)/)) {
        GM_addStyle('.box {margin-bottom:5px;} .player-block, .player-info {padding-top:0;} .header-content {height: 50px;} #header{padding-top: 50px !important;} \
                .page #header {margin-bottom:0;} .view .video-info{display: inline-block;width:calc(100% - 380px);} #rateinfo{float: right; width:380px;position:relative;} \
                .video-cover{right:415px; position: absolute;} .player-box-side .module-tab {max-height: 220px; } .player-info{display: inline-block;} \
                .play .player-side-playlist .module-blocklist a {margin:2px; line-height:30px;font-size:16px;} .player-box-side, .tab-list.selected {max-height: 480px;height:fit-content;} \
                .player-side-playlist{padding: 5px 20px 5px 20px;} .player-side-tab .module-tab-item {padding:6px;} #rateinfo{z-index:8;} \
                .video-info-items {max-width: 650px;}');
        if (loc.match(/vodplay/)) {
            GM_addStyle('#rateinfo {color:white;} #rateinfo a{color:darkgray;}');
        }
        insertPos = $('.view .view-heading, .play #main .player-box-side');
        cname = ($('.page-title a') || $('.page-title')).textContent;
        cname2 = $('.video-subtitle') && $('.video-subtitle').textContent;
        year = [...$All('.video-info-aux > a.tag-link')].find(a=>a.textContent.match(/\d{4}/)).textContent.trim();
    } else if (loc.match(/www\.aowu\.tv\/(bangumi|play)\//)) {
        GM_addStyle('#rateinfo {width: 380px;} .player-right.cor5 {overflow-y: auto;} .fun.flex.between.around {display: none;} body:has(.player-switch-box) {overflow: hidden;} \
            #rateinfo .title {line-height: 1;padding: 0;height: 40px;} .player-switch-box .player-left {position: fixed;left: 0;top: 0;z-index: 99999;} \
            .player-switch-box:hover .player-switch {display: block;} .player-switch-box .player-switch {display: none;}');
        insertPos = $('.vod-detail .box-width');
        cname = $('.slide-info-title, .player-title-link').textContent;
        year = $('span.slide-info-remarks a, .player-details .cor4').textContent;
        if (loc.match(/\/play\//)) {
            insertPos = $('#play_vod').parentNode.parentNode;
            GM_addStyle('#rateinfo {display:none;} .title:hover #rateinfo {display: block;background: black;}');
            $('#play_vod').replaceWith($('.play-score'));
        }
    } else if (loc.match(/295yhw\.com\/(video|play)\//)) {
        GM_addStyle('.hl-ds-qrcode{display:none;} .hl-score-rating {padding: 0 !important;margin: 0 !important;} ');
        insertPos = $('.hl-score-wrap');
        cname = $('.hl-dc-title, span.hl-crumb-item').textContent;
        year = $('.hl-data-xs.hl-text-muted span, .hl-tag-item > a:nth-child(3)').textContent;
    } else if (loc.match(/fsdm\d+?\.com\/(vodplay|voddetail)/)) {
        insertPos = $('.sidebar .navbar');
        cname = $('.module-info-heading h1').textContent;
        year = $('.module-info-tag .module-info-tag-link').textContent;
    }


    if (loc.match(/mxdm/)) {
            if (domains.Mx != location.origin) {
                domains.Mx = location.origin;
                GM_setValue('domains', domains);
            }
    } else if (loc.match(/wjys/)) {
        if (domains.Wjys != location.origin) {
            domains.Wjys = location.origin;
            GM_setValue('domains', domains);
        }
    } else if (loc.match(/295yhw/)) {
        GM_addStyle('#unionSearch{width:80px;}');
        if (domains.Yh != location.origin) {
            domains.Yh = location.origin;
            GM_setValue('domains', domains);
        }
    } else if (loc.match(/aowu/)) {
        GM_addStyle('#search {	display: inline-flex;}');
        if (domains.Aowu != location.origin) {
            domains.Aowu = location.origin;
            GM_setValue('domains', domains);
        }
    } else if (loc.match(/fsdm/)) {
        //GM_addStyle('#search {	display: inline-flex;}');
        if (domains.Fsdm != location.origin) {
            domains.Fsdm = location.origin;
            GM_setValue('domains', domains);
        }
    }

    var setDoubanInfo = ()=> {
        var ul = $C('ul', {class: 'rateresult'});
        pn.appendChild(ul);
        var createActorNode = (actors, subInfo) => {
            if (actors && actors.length > 0) {
                subInfo.textContent = actors.join(', ');
                subInfo.title = actors.join('\n');
            }
        };
        var getDBInfo = (mid, subInfo, switchApi) => {
            if (!loc.match(/bgm\.tv|douban\.com/)) {
                var apiType = switchApi? 'movie' : 'tv';
                var infoApi = `https://m.douban.com/rexxar/api/v2/${apiType}/${mid}/credits`;
                console.log('douban cast api:', infoApi);
                XHR({url:infoApi, isjson:true, headers: {Referer:`https://m.douban.com/movie/subject/${mid}/`}}).then(res => {
                    var acts = [];
                    if (res.credits) {
                        var actors = res.credits.find(obj => obj.title == '演员');
                        if (actors) {
                            actors.celebrities.forEach(act => acts.push(act.name));
                            createActorNode(acts, subInfo);
                        }
                    } else if (!switchApi) {
                        getDBInfo(mid, subInfo, true);
                    } else {
                        infoApi = `https://movie.douban.com/subject/${mid}/celebrities`;
                        console.log('douban cast api:', infoApi);
                        XHR({url:infoApi, isjson:false, headers: {Referer:infoApi}}).then(r => {
                            var dom = new DOMParser().parseFromString(r, "text/html");
                            var pls = $All('.pl', dom);
                            for (i = 0; i < pls.length; i++) {
                                if (pls[i].textContent.includes('主演')) {
                                    $All('a', pls[i].parentNode).forEach(a=>acts.push(a.textContent));
                                    break;
                                }
                            }
                            createActorNode(acts, subInfo);
                        });
                    }
                });
            }
        };
        var searchDb = () => {
            var dbApi = 'https://m.douban.com/search/?type=1002&query=' + encodeURIComponent((oname? oname:cname).toLowerCase());
            console.log('douban api:', dbApi);
            XHR({url:dbApi, headers: {Referer: dbApi}}).then(r=>{
                var dom = new DOMParser().parseFromString(r, "text/html");
                var ss = $All('ul.search_results_subjects li', dom);
                if (ss.length == 0) {
                    console.log('No result in douban');
                    return;
                }
                ss.forEach((s, i)=>{
                    var dbName = $('.subject-title', s).textContent;
                    if (dbName.match(cname) || cname.match(dbName) || i == 0) {
                        var l = $('a', s);
                        var h = l.getAttribute('href');
                        l.href = h.replace('/movie/', 'https://movie.douban.com/');
                        l.target = '_blank';
                        ul.appendChild(s);
                        var subInfo = $('.subject-info', s);
                        var mid = h.match(/\d+/)[0];

                        // var infoApi = `https://m.douban.com/rexxar/api/v2/tv/${mid}?ck=&for_mobile=1`; // need Referer:`https://m.douban.com/movie/subject/${mid}/`
                        getDBInfo(mid, subInfo);
                    }
                });
            });
        };
        var searchDb2 = () => {
            var dbApi = `https://www.douban.com/search?cat=1002&q=${encodeURIComponent((oname? oname:cname).toLowerCase())}`;
            console.log("dbApi2: ", dbApi);
            XHR({url:dbApi, headers: {Referer: dbApi}}).then(r=>{
                var dom = new DOMParser().parseFromString(r, "text/html");
                var ss = $All('.result', dom);
                if (ss.length == 0) {
                    console.log('No result in douban');
                    return;
                }
                var dbData = [];
                for (i = 0; i < ss.length; i++) {
                    var s = ss[i];
                    var dbUrl = decodeURIComponent($('.title a', s).href).match(/url=(https:.+\/subject\/\d+\/)/)[1];
                    var dbTitle = $('.title a', s).textContent;
                    var sc = $('.subject-cast', s).textContent.split(' / ');
                    var dbOname = sc[0].replace('原名:', '');
                    var dbYear = sc[sc.length-1];
                    var imgSrc = $('.pic img', s).src;
                    var mid = dbUrl.match(/\/subject\/(\d+)\//)[1];
                    if (!$('.rating_nums', s)) {
                        continue;
                    }
                    var score = $('.rating_nums', s).textContent;
                    var total = $('.rating_nums', s).nextElementSibling.textContent.match(/\d+/)[0];
                    var data = {url:dbUrl, mid: mid, title: dbTitle, img: imgSrc, score:score, oname: dbOname, total: total, year:dbYear};
                    if (year == dbYear || (dbOname == oname && Math.abs(parseInt(year) - parseInt(dbYear)) < 2 )) {
                        //ul.appendChild(s);
                        dbData.push(data);
                    }
                    if (year == dbYear && dbOname.replaceAll(marks, '') == oname.replaceAll(marks, '')) {
                        dbData[0] = data;
                        break;
                    }
                }
                var dbd = dbData[0];
                if (!dbd) {return;}
                var resLi = $C('li', {class: "result"});
                var imgDiv = $C('div', {class: "pic"});
                var imgNode = $C('img', {src: dbd.img});
                var conDiv = $C('div', {class: 'content'});
                var liTt = $C('li', {class:'rateSiteName', text:'豆瓣'});
                if (isMini) {
                    conDiv.innerHTML = `<a href="${dbd.url}" target="_blank"><div><p class="rate_score">${dbd.score}</p><p class="rate_nums" title="评价人数">(${dbd.total})</p></div></a>`;
                } else {
                    imgDiv.appendChild(imgNode);
                    resLi.appendChild(imgDiv);
                    conDiv.innerHTML = `<div class="title"><span title="${dbd.title}"><a href="${dbd.url}" target="_blank">${dbd.title}</a></span><div class="rating-info">
                                        <span class="allstar25"></span><span class="rate_score">${dbd.score}</span><span class="rate_nums" title="评价人数"> (${dbd.total})</span>
                                        <span class="oname" title="原名:${oname} (首播${dbd.year})"> 原名:${oname} (首播${dbd.year})</span></div></div><p class="cast"></p>`;
                       // : `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数">(${total})</span></div>`;
                    getDBInfo(dbd.mid, $('.cast', conDiv));
                }
                resLi.appendChild(conDiv);
                ul.appendChild(liTt);
                ul.appendChild(resLi);
            });
        };

        searchDb2();
    };

    //API参考 https://bangumi.github.io/api/
    var bgmId;
    var setBgmInfo = (retryName)=> {
        var ul = $C('ul', {class: 'rateresult'});
        pn.appendChild(ul);
        if (oname) {
            var searchName = retryName? retryName : oname;
            var bgmSearchApi = `https://api.bgm.tv/search/subject/${encodeURIComponent(searchName.replace(marks, ' ').trim())}?type=2&responseGroup=large`;
            console.log('BGM:', bgmSearchApi); // bgmSearchApi还可以增加responseGroup参数，值为small、medium、large，返回信息依次变多，不加默认为small
            var getBGMInfo = ()=> {
                var bgmApi = `https://api.bgm.tv/subject/${bgmId}?responseGroup=medium`;
                XHR({url:bgmApi, headers: {Referer: 'https://bgm.tv'}, isjson:true}).then(r=>{
                    if (r.code == 404) {
                        console.log('BGM not found result');
                        return;
                    }
                    var bgmUrl = r.url.replace('http:', 'https:');
                    var score = r.rating.score.toFixed(1);
                    var total = r.rating.total;
                    var title = r.name_cn || r.name;
                    var oTitle = r.name;
                    var imgSrc = r.images.small.replace('http:', 'https:');
                    var eps = r.eps;
                    var rDate = r.air_date;
                    var actorsArr = [];
                    r.crt && r.crt.forEach(a=> { if(a.actors) actorsArr.push(a.actors[0].name) });
                    var actors = actorsArr.join(', ');
                    var resLi = $C('li', {class: "result"});
                    var imgDiv = $C('div', {class: "pic"});
                    var imgNode = $C('img', {src: imgSrc});
                    var conDiv = $C('div', {class: 'content'});
                    var liTt = $C('li', {class:'rateSiteName', text:'BGM'});
                    if (isMini) {
                        conDiv.innerHTML = `<div><p class="rate_score">${score}</p><p class="rate_nums" title="评价人数">(${total})</p></div>`;
                    } else {
                        imgDiv.appendChild(imgNode);
                        resLi.appendChild(imgDiv);
                        conDiv.innerHTML = `<div class="title"><span title="${title}"><a href="${bgmUrl}" target="_blank">${title}</a></span><div class="rating-info">
                                            <span class="allstar25"></span><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"> (${total})</span>
                                            <span class="oname" title="原名:${oTitle} (首播${rDate} 共${eps}集)"> 原名:${oTitle} (首播${rDate} 共${eps}集)</span></div></div>
                                            <p class="cast" title="${actors}">${actors}</p>`;
                           // : `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数">(${total})</span></div>`;
                    }
                    resLi.appendChild(conDiv);
                    ul.appendChild(liTt);
                    ul.appendChild(resLi);
                });
            };
            if (bgmId) {
                getBGMInfo();
            } else {
                XHR({url:bgmSearchApi, headers: {Referer: 'https://bgm.tv'}, isjson:true}).then(r=>{
                    if (r.results > 0) {
                        // bgmId = r.list[0].id;
                        // for (let l of r.list) {
                        //     if (l.name == oname || l.name_cn == retryName) {
                        //         bgmId = l.id;
                        //         break;
                        //     }
                        // }
                        //bgmId = r.list[0].id;
                        var tempYear = r.list[0].air_date;
                        var firstSameYearId = null;
                        for (let l of r.list) {
                            if (!l.name_cn) {
                                l.name_cn = l.name;
                            }
                            if (l.name_cn == cname || l.name_cn.replace(marks, ' ').trim() == cname.replace(marks, ' ').trim()) {
                                bgmId = l.id;
                                oname = l.name;
                                tempYear = l.air_date;
                                if (tempYear && year == tempYear.match(/\d+/)[0]) {
                                    break;
                                }
                            }
                            if (l.air_date && year == l.air_date.match(/\d+/)[0] && !firstSameYearId) {
                                firstSameYearId = l.id;
                            }
                        }
                        if (!bgmId && firstSameYearId) {
                            bgmId = firstSameYearId;
                        }
                        getBGMInfo();
                    } else if (!retryName) {
                        setBgmInfo(cname);
                    }
                });
            }
        }
    };



    var setAnikoreInfo = ()=> {
        var ul = $C('ul', {class: 'rateresult'});
        pn.appendChild(ul);
        if (oname) {
            var ref = 'https://www.anikore.jp';
            var searchApi = `https://www.anikore.jp/anime_title/${encodeURIComponent(oname.replaceAll(/\//g, '_'))}/`;
            console.log('Anikore:', searchApi);
            XHR({url:searchApi, headers: {Referer: ref}, isjson:false}).then(r=>{
                var dom = new DOMParser().parseFromString(r, "text/html");
                if ($('.l-searchPageHeader strong', dom) && Number($('.l-searchPageHeader strong', dom).textContent) > 0) {
                    var rss = $All('.l-searchPageRanking_unit', dom);
                    var rs = rss[0];
                    for (let i of rss) {
                        var y = $('.l-searchPageRanking_unit_mainBlock_chronicle', i) && $('.l-searchPageRanking_unit_mainBlock_chronicle', i).textContent.match(/\d{4}/);
                        if (y && y[0] == year) {
                            rs = i;
                            break;
                        }
                    }
                    var url = ref + $('.l-searchPageRanking_unit_mainBlock_image a', rs).getAttribute('href');
                    var score = (parseFloat($('.l-searchPageRanking_unit_score', rs).textContent) / 10).toFixed(1);
                    if (isNaN(score)) {
                        score = (parseFloat($('.l-searchPageRanking_unit_mainBlock_starPoint strong', rs).textContent) * 2).toFixed(1);
                    }
                    var total = $('.l-searchPageRanking_unit_mainBlock_starPoint span', rs).textContent;
                    var title = $('.l-searchPageRanking_unit_title_rankName', rs).nextSibling.textContent.trim();
                    var oTitle = title;
                    var imgSrc = $('.l-searchPageRanking_unit_mainBlock_image img', rs).dataset.src;
                    var rDate = $('.l-searchPageRanking_unit_mainBlock_chronicle', rs).textContent;
                    var resLi = $C('li', {class: "result"});
                    var imgDiv = $C('div', {class: "pic", style: "width: 50px;overflow: hidden;margin: 0 5px 0;"});
                    var imgNode = $C('img', {src: imgSrc, style: "width: 67px;margin-left: -8px;"});
                    var conDiv = $C('div', {class: 'content'});
                    var liTt = $C('li', {class:'rateSiteName',text:'ANK'});
                    if (isMini) {
                        conDiv.innerHTML = `<div><p class="rate_score">${score}</p><p class="rate_nums" title="评价人数">(${total})</p></div>`;
                    } else {
                        imgDiv.appendChild(imgNode);
                        resLi.appendChild(imgDiv);
                        conDiv.innerHTML = `<div class="title"><span title="${title}"><a href="${url}" target="_blank">${title}</a></span><div class="rating-info">
                                            <span class="allstar25"></span><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"> (${total})</span>
                                            <span class="oname" title="原名:${oTitle} (${rDate})"> 原名:${oTitle} (${rDate})</span></div></div>`;
                            //: `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数">(${total})</span></div>`;
                    }
                    resLi.appendChild(conDiv);
                    ul.appendChild(liTt);
                    ul.appendChild(resLi);
                }
            });
        }
    };

    var setFilmarksInfo = ()=> {
        var ul = $C('ul', {class: 'rateresult'});
        pn.appendChild(ul);
        if (oname) {
            var ref = 'https://filmarks.com';
            var searchApi = `https://filmarks.com/search/animes?q=${encodeURIComponent(oname)}`;
            console.log('Filmarks:', searchApi);
            XHR({url:searchApi, headers: {Referer: ref}, isjson:false}).then(r=>{
                var dom = new DOMParser().parseFromString(r, "text/html");
                var rss = $All('.js-cassette', dom);
                if (rss.length > 0) {
                    var rs = rss[0];
                    for (let i of rss) {
                        var y = $('.p-content-cassette__other-info', i) && $('.p-content-cassette__other-info', i).textContent.match(/\d{4}/);
                        if (y && y[0] == year) {
                            rs = i;
                            break;
                        }
                    }
                    var url = ref + $('.p-content-cassette__readmore', rs).getAttribute('href');
                    var score = (parseFloat($('.p-content-cassette__rate .c-rating__score', rs).textContent) * 2).toFixed(1);
                    var total = '';
                    var title = $('.p-content-cassette__title', rs).textContent.trim();
                    var oTitle = title;
                    var casts = [];
                    var castLis = $All('li', $('.p-content-cassette__people', rs).lastElementChild).forEach(i => casts.push(i.textContent));
                    var actors = casts.join(', ');
                    var imgSrc = $('.c2-poster-m img', rs).src;
                    var rDate = $('.p-content-cassette__other-info span', rs).textContent;
                    var resLi = $C('li', {class: "result"});
                    var imgDiv = $C('div', {class: "pic", style: "width: 50px;overflow: hidden;margin: 0 5px 0;"});
                    var imgNode = $C('img', {src: imgSrc, style: "width: 67px;margin-left: -8px;"});
                    var conDiv = $C('div', {class: 'content'});
                    var liTt = $C('li', {class:'rateSiteName',text:'FMS'});
                    if (isMini) {
                        conDiv.innerHTML = `<div><p class="rate_score">${score}</p><p class="rate_nums" title="评价人数">(${total})</p></div>`;
                    } else {
                        imgDiv.appendChild(imgNode);
                        resLi.appendChild(imgDiv);
                        conDiv.innerHTML = `<div class="title"><span title="${title}"><a href="${url}" target="_blank">${title}</a></span><div class="rating-info">
                                            <span class="allstar25"></span><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数">${total}</span>
                                            <span class="oname" title="原名:${oTitle} (${rDate})"> 原名:${oTitle} (${rDate})</span></div></div>
                                            <p class="cast" title="${actors}">${actors}</p>`;
                    }
                    resLi.appendChild(conDiv);
                    ul.appendChild(liTt);
                    ul.appendChild(resLi);
                }
            });
        }
    };

    var setMyanimelistInfo = ()=> {
        var ul = $C('ul', {class: 'rateresult'});
        pn.appendChild(ul);
        if (oname) {
            var ref = 'https://myanimelist.net/';
            var searchApi = `https://myanimelist.net/search/prefix.json?type=anime&keyword=${encodeURIComponent(oname)}`;
            console.log('Myanimelist:', searchApi);
            XHR({url:searchApi, headers: {Referer: ref}, isjson:true}).then(r=>{
                if (r.categories && r.categories[0].items) {
                    var rs = r.categories[0].items[0];
                    for(let i of r.categories[0].items) {
                        if (i.payload.aired.match(/\d{4}/) && i.payload.aired.match(/\d{4}/)[0] == year) {
                            rs = i;
                            break;
                        }
                    }
                    var id = rs.id;
                    var url = rs.url;
                    var score = (rs.payload.score == 'N/A')? 'N/A' : parseFloat(rs.payload.score).toFixed(1);
                    var title = rs.name;
                    var oTitle = oname;
                    var imgSrc = rs.image_url;
                    var aired = rs.payload.aired;
                    var status = rs.payload.status;
                    var resLi = $C('li', {class: "result"});
                    var imgDiv = $C('div', {class: "pic"});
                    var imgNode = $C('img', {src: imgSrc});
                    var conDiv = $C('div', {class: 'content'});
                    var liTt = $C('li', {class:'rateSiteName',text:'MAL'});
                    if (isMini) {
                        conDiv.innerHTML = `<div><p class="rate_score">${score}</p><p class="rate_nums" title="评价人数"></p></div>`;
                    } else {
                        imgDiv.appendChild(imgNode);
                        resLi.appendChild(imgDiv);
                        conDiv.innerHTML = `<div class="title"><span title="${title}"><a href="${url}" target="_blank">${title}</a></span><div class="rating-info">
                                            <span class="allstar25"></span><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"></span>
                                            <span class="oname" title="原名:${oTitle} (Aired:${aired} Status:${status})"> 原名:${oTitle} (Aired:${aired} Status:${status})</span></div></div>`;
                            //: `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"></span></div>`;
                    }
                    ul.appendChild(liTt);
                    resLi.appendChild(conDiv);
                    ul.appendChild(resLi);
                    var apiUrl = `https://api.myanimelist.net/v2/anime/${id}?fields=mean,num_scoring_users`;
                    var hds = {Accept: 'application/json', 'User-Agent': 'NineAnimator/2 CFNetwork/976 Darwin/18.2.0', Authorization: 'Bearer','X-MAL-Client-ID':'6114d00ca681b7701d1e15fe11a4987e'};
                    XHR({url:apiUrl, headers:hds, isjson: true}).then(r => {
                        $('.rate_nums', ul).textContent = '(' + r.num_scoring_users + ')';
                    });
                }
            });
        }
    };

    var init = ()=> {
        console.log('oname:', oname, 'cname:', cname);
        if (insertPos) {
            if (loc.match(/www\.bilibili\.com\/bangumi\/media\/|\/dongman|\.wjys\.cc\/vod|aowu\.tv\/|fsdm/)) {
                insertPos.appendChild(pn);
            } else if (loc.match('https://www.bilibili.com/bangumi/play/')) {
                //$('#media_module img').onload = ()=> {insertPos.insertAdjacentElement('afterbegin', pn);};
                insertPos.appendChild(pn);
            } else {
                insertPos.insertAdjacentElement('beforebegin', pn);
            }

            if (!loc.match('https://movie.douban.com/subject/')) {
                setDoubanInfo();
            }
            if (!loc.match('https://bgm.tv/subject/')) {
                setBgmInfo();
            }
            if (isMini) {
                GM_addStyle('.rateresult .result {height: auto;} #rateinfo {width: 45px; text-align: center;} .rateresult .content {width:42px;}');
            }
            setAnikoreInfo();
            setMyanimelistInfo();
            setFilmarksInfo();
        }
    };

    if (oname) {
        init();
    } else if (biliSid && loc.match('https://www.bilibili.com/bangumi/play/')) {
        var ssApi = 'https://bangumi.bilibili.com/view/web_api/season?season_id=' + biliSid; // api not work
        XHR({url:ssApi,isjson:true,headers:{Referer:'https://www.bilibili.com/'} }).then(r=>{
            if (r.result && r.result.jp_title) {
                oname = r.result.jp_title;
                init();
            }
        });
    } else if (cname) {
        searchCName(cname);
    }

    function searchCName(cn) {
        var cnFilter = cn.replace(marks, ' ').trim();
        var bgmSearchApi = `https://api.bgm.tv/search/subject/${encodeURIComponent(cnFilter)}?type=2&responseGroup=large`; //small, medium, large
        console.log(bgmSearchApi);
        XHR({url:bgmSearchApi, headers: {Referer: 'https://bgm.tv'}, isjson:true}).then(r=>{
            if (r.results > 0) {
                oname = r.list[0].name;
                var tempYear = r.list[0].air_date;
                var firstSameYearData = null;
                for (let l of r.list) {
                    if (!l.name_cn) {
                        l.name_cn = l.name;
                    }
                    if (l.name_cn == cn || l.name_cn.replace(marks, ' ').trim() == cnFilter) {
                        bgmId = l.id;
                        oname = l.name;
                        tempYear = l.air_date;
                        if (tempYear && year == tempYear.match(/\d+/)[0]) {
                            break;
                        }
                    }
                    if (l.air_date && year == l.air_date.match(/\d+/)[0] && !firstSameYearData) {
                        firstSameYearData = l;
                    }
                }
                if (!bgmId && firstSameYearData) {
                    bgmId = firstSameYearData.id;
                    oname = firstSameYearData.name;
                }
                console.log("BGM:", bgmId, oname, tempYear);
                init();
            } else if (cname2 && !isRetryCN2) {
                isRetryCN2 = true;
                searchCName(cname2);
            }
        });
    }

    addUnionSearch(); // not finished yet
    function addUnionSearch() {
        if (loc.match('bilibili.com')) {
            return;
        }
        var sites = {Douban: 'https://www.douban.com/search?cat=1002&q={keyword}', Age: (domains.Age || 'https://www.age.tv') + '/search?query={keyword}',
                     Bilibili: 'https://search.bilibili.com/bangumi?search_source=5&keyword={keyword}',
                     Mx: (domains.Mx || 'https://www.mxdm.tv') + '/search/-------------.html?wd={keyword}',
                     Bgm: 'https://bgm.tv/subject_search/{keyword}?cat=2', Wjys: (domains.Wjys || 'https://www.wjys.cc') + '/vodsearch.html?wd={keyword}',
                     Yh: (domains.Yh || 'https://www.295yhw.com') + '/search/-------------.html?wd={keyword}',
                     Aowu: (domains.Aowu || 'https://www.aowu.tv') + '/search/-------------.html?wd={keyword}',
                     Fsdm: (domains.Fsdm || 'https://www.fsdm02.com') + '/vodsearch/-------------.html?wd={keyword}'
                    };
        var us = $C('select', {id:'unionSearch', style:'color: orange; background: #212124;font-size:16px;border-radius: 10px;', class: "hl-search-select hl-text-subs"});
        for (const [k, v] of Object.entries(sites)) {
            var opt = $C('option', {value: v});
            opt.textContent = k;
            us.appendChild(opt);
            if (location.host.toUpperCase().match(k.toUpperCase())) {
                opt.selected = true;
            }
        }
        var inputNode = $('#query, .search-input, .searchInputL, #hl-search-text');
        if (inputNode) {
            inputNode.insertAdjacentElement('beforebegin', us);
            $('#button-addon2, .search-go, .searchBtnL, .search-input-sub, #hl-search-submit').onclick = ()=> {
                var txt = inputNode.value;
                if (!location.host.toUpperCase().match(us.options[us.selectedIndex].label.toUpperCase)) {
                    GM_openInTab(us.value.replace('{keyword}', encodeURIComponent(txt)));
                    return false;
                }
            };
            var title = $('.video_play_detail_wrapper .card-title, .video_detail_title, .page-title a') || $('.page-title');
            if (title) {
                inputNode.value = title.textContent;
            }
        }
    }

})()
