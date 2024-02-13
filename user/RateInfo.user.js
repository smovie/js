// ==UserScript==
// @name        Rate Info
// @namespace   Violentmonkey Scripts
// @include     /https://www\.age(fans|mys|dm)\.[\w]+/
// @include     https://bgm.tv/*
// @include     https://movie.douban.com/subject/*
// @include     https://www.bilibili.com/bangumi/*
// @include     /https://www\.(mxdm9\.com|wjys\.cc)\/.*/
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_openInTab
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// @version     0.1.1
// @author      -
// @description 1/25/2023, 3:29:51 PM
// ==/UserScript==

(function(){
    GM_addStyle('#rateinfo, .rateresult{border: 1px solid white;} .rateresult {max-height: 98px; overflow: auto;margin-bottom:0;padding-left:0;} \
            .rateresult .result {height: 70px;display: flex;width:100%;} .rateresult .content {position: relative;width: calc(100% - 80px);} .rateresult h3 {display: inline-flex;} \
            .rateresult .rating-info .rate_score {color: #e09015;font-size: 16px;font-weight:bold;} .rateresult .rate_nums{color:white;} .rateresult span:hover {color: inherit;} \
            .ic-mark, .ic-movie-mark {display:none;} .rateresult span a {font-weight: bold;font-size:16px;} .rateresult .rating-info span,.rateresult li {font-size:12px;} \
            .rateresult .rating-info {font-size:12px;margin-top: 5px;} #detailname .favbtn, #detailname .bilisearch, #detailname .bgmsearch{font-weight: normal;	font-size: 16px;} \
            .rateresult li {width:100%; border-bottom: 1px solid #F2F2F2;overflow: hidden;line-height: 1.2;} .rating span {color: #ffa726;font-weight: bold;} .title {white-space: nowrap;} \
            .rateresult .cast {text-overflow: ellipsis;overflow: hidden;color: deepskyblue; font-size: 12px;margin-top:5px; white-space: nowrap;} #cast, .cast span {margin-right: 5px;} \
            .rateresult img {float: left;width: 50px;margin: 0 5px 0;height:70px;} .rateresult .subject-info{display: inline-grid;position: absolute;height: 100%;width: -moz-available;} \
            .rateresult a {text-decoration: none;display: block;overflow: hidden;position:relative;}');
    var pn = $C('div', {id: 'rateinfo'});
    var year, oname, cname, biliSid;
    var loc = location.href;
    var isMini = false;
    var marks = /’|‘|\'|“|”|\"|【|\[|】|\]|｛|\{|｝|\}|，|,|：|:|《|\<|》|\>|。|\.|？|\?|！|\!|￥|\$|无修/g;

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
    } else if (loc.match('https://bgm.tv/subject/')) {
        GM_addStyle('div.title {padding-top: 0;white-space: nowrap;overflow: hidden;} .rateresult .subject-cast,.rateresult .cast {display:none;} ');
        insertPos = $('#panelInterestWrapper .shareBtn');
        oname = $('.nameSingle a').textContent;
        cname = $('.nameSingle a').title;
        var infobox = $All('#infobox li');
        for (let l of infobox) {
            if (l.textContent.match('放送开始')) {
                year = l.textContent.match(/\d{4}/)[0];
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
    } else if (loc.match('https://www.bilibili.com/bangumi/') && __INITIAL_STATE__) {
        GM_addStyle('div.title {padding-top: 0;white-space: nowrap;overflow: hidden;} .rateresult .cast {display:none;} \
                    .rateresult li{font-size: 10px; color: white;} .rateresult {max-width: 250px;} .rateresult h3 a { font-weight: bold; font-size: 14px; color: white;} \
                    .media-info-score-wrp {padding-top: 0; margin-top: -30px;}');
        insertPos = $('.media-info-score-wrp');
        var mdi = __INITIAL_STATE__.mediaInfo;
        cname = mdi.title;
        oname = mdi.origin_name ;
        year = (mdi.publish.pub_date||mdi.publish.pub_time).match(/\d+/)[0];
        if (loc.match('/bangumi/play/')) {
            isMini = true;
            insertPos = $('#media_module');
            oname = mdi.jp_title || mdi.jpTitle;
            biliSid = __INITIAL_STATE__.mediaInfo.season_id;
            GM_addStyle('.media-cover {margin-left: 47px;} #rateinfo {position: absolute;} .rateresult li{color:tomato;} .rateresult .rate_nums {color: darkgray;margin-top: -6px;} \
                        #rateinfo, .rateresult, .rateresult li {border: 1px solid pink; overflow: hidden;} .main-container .media-info .media-right {padding-left:180px;} \
                        .rateresult .result {height: 28px;} .rateresult .rate_score{margin-top: -3px;} .media-rating{left:450px;}');
        }
    } else if (loc.match(/mxdm9\.com\/dongman|wjys\.cc\/vod(play|detail)/)) {
        GM_addStyle('.box {margin-bottom:5px;} .player-block, .player-info {padding-top:0;} .header-content {height: 50px;} #header{padding-top: 50px !important;} \
                .page #header {margin-bottom:0;} .view .video-info{display: inline-block;width:calc(100% - 380px);} #rateinfo{float: right; width:380px;position:relative;} \
                .video-cover{right:415px; position: absolute;} .player-box-side, .player-box-side .module-tab {max-height: 220px; } .player-info{display: inline-block;} \
                .play .player-side-playlist .module-blocklist a {margin:2px; line-height:30px;font-size:16px;} \
                .player-side-playlist{padding: 5px 20px 5px 20px;} .player-side-tab .module-tab-item {padding:6px;}');
        if (loc.match(/vodplay/)) {
            GM_addStyle('#rateinfo {color:white;} #rateinfo a{color:darkgray;}');
        }
        insertPos = $('.view .view-heading, .play #main .player-box-side');
        cname = ($('.page-title a') || $('.page-title')).textContent;
        //year = $('.video-info-items:nth-child(2) > div:nth-child(2), .tag-link[href*="/show/1-----------"]').textContent.replaceAll(/\s/g, '');

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
                    if (dbOname.replaceAll(marks, '') == oname.replaceAll(marks, '')) {
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
                var liTt = $C('li');
                if (isMini) {
                    liTt.textContent = '豆瓣';
                    conDiv.innerHTML = `<div><p class="rate_score">${dbd.score}</p><p class="rate_nums" title="评价人数">(${dbd.total})</p></div>`;
                } else {
                    imgDiv.appendChild(imgNode);
                    resLi.appendChild(imgDiv);
                    conDiv.innerHTML = `<div class="title"><span title="${dbd.title}"><a href="${dbd.url}" target="_blank">${dbd.title}</a></span><div class="rating-info">
                                        <span class="allstar25"></span><span class="rate_score">${dbd.score}</span><span class="rate_nums" title="评价人数"> (${dbd.total})</span>
                                        <span class="oname" title="原名:${oname} (首播${dbd.year})"> 原名:${oname} (首播${dbd.year})</span></div></div><p class="cast"></p>`;
                       // : `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数">(${total})</span></div>`;
                    liTt.textContent = '豆瓣评分:';
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
            var bgmSearchApi = `https://api.bgm.tv/search/subject/${encodeURIComponent(searchName.replace(/[\,\.\!\?\"\'\#]+/g, ' '))}?type=2`;
            console.log('BGM:', bgmSearchApi); // bgmSearchApi还可以增加responseGroup参数，值为small、medium、large，返回信息依次变多，不加默认为small
            var getBGMInfo = ()=> {
                var bgmApi = `https://api.bgm.tv/subject/${bgmId}?responseGroup=medium`;
                XHR({url:bgmApi, headers: {Referer: 'https://bgm.tv'}, isjson:true}).then(r=>{
                    var bgmUrl = r.url.replace('http:', 'https:');
                    var score = r.rating.score.toFixed(1);
                    var total = r.rating.total;
                    var title = r.name_cn;
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
                    var liTt = $C('li');
                    if (isMini) {
                        liTt.textContent = 'BGM';
                        conDiv.innerHTML = `<div><p class="rate_score">${score}</p><p class="rate_nums" title="评价人数">(${total})</p></div>`;
                    } else {
                        imgDiv.appendChild(imgNode);
                        resLi.appendChild(imgDiv);
                        conDiv.innerHTML = `<div class="title"><span title="${title}"><a href="${bgmUrl}" target="_blank">${title}</a></span><div class="rating-info">
                                            <span class="allstar25"></span><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"> (${total})</span>
                                            <span class="oname" title="原名:${oTitle} (首播${rDate} 共${eps}集)"> 原名:${oTitle} (首播${rDate} 共${eps}集)</span></div></div>
                                            <p class="cast" title="${actors}">${actors}</p>`;
                           // : `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数">(${total})</span></div>`;
                        liTt.textContent = 'BGM评分:';
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
                        bgmId = r.list[0].id;
                        for (let l of r.list) {
                            if (l.name == oname || l.name_cn == retryName) {
                                bgmId = l.id;
                                break;
                            }
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
            var searchApi = `https://www.anikore.jp/anime_title/${encodeURIComponent(oname)}/`;
            console.log('Anikore:', searchApi);
            XHR({url:searchApi, headers: {Referer: ref}, isjson:false}).then(r=>{
                var dom = new DOMParser().parseFromString(r, "text/html");
                if ($('.l-searchPageHeader strong', dom) && Number($('.l-searchPageHeader strong', dom).textContent) > 0) {
                    var rss = $All('.l-searchPageRanking_unit', dom);
                    var rs = rss[0];
                    for (let i of rss) {
                        var y = $('.l-searchPageRanking_unit_mainBlock_chronicle') && $('.l-searchPageRanking_unit_mainBlock_chronicle').textContent.match(/\d{4}/);
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
                    var liTt = $C('li');
                    if (isMini) {
                        liTt.textContent = 'Anik';
                        conDiv.innerHTML = `<div><p class="rate_score">${score}</p><p class="rate_nums" title="评价人数">(${total})</p></div>`;
                    } else {
                        imgDiv.appendChild(imgNode);
                        resLi.appendChild(imgDiv);
                        conDiv.innerHTML = `<div class="title"><span title="${title}"><a href="${url}" target="_blank">${title}</a></span><div class="rating-info">
                                            <span class="allstar25"></span><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"> (${total})</span>
                                            <span class="oname" title="原名:${oTitle} (${rDate})"> 原名:${oTitle} (${rDate})</span></div></div>`;
                        liTt.textContent = 'Anikore评分:';
                            //: `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数">(${total})</span></div>`;
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
                    var liTt = $C('li');
                    if (isMini) {
                        conDiv.innerHTML = `<div><p class="rate_score">${score}</p><p class="rate_nums" title="评价人数"></p></div>`;
                        liTt.textContent = 'MAL';
                    } else {
                        imgDiv.appendChild(imgNode);
                        resLi.appendChild(imgDiv);
                        conDiv.innerHTML = `<div class="title"><span title="${title}"><a href="${url}" target="_blank">${title}</a></span><div class="rating-info">
                                            <span class="allstar25"></span><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"></span>
                                            <span class="oname" title="原名:${oTitle} (Aired:${aired} Status:${status})"> 原名:${oTitle} (Aired:${aired} Status:${status})</span></div></div>`;
                            //: `<div class="rating-info" title="${title}"><span class="rate_score">${score}</span><span class="rate_nums" title="评价人数"></span></div>`;
                        liTt.textContent = 'Myanimelist评分:';
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
            if (loc.match(/www\.bilibili\.com\/bangumi\/media\/|\.mxdm9\.com\/dongman|\.wjys\.cc\/vod/)) {
                insertPos.appendChild(pn);
            } else if (loc.match('https://www.bilibili.com/bangumi/play/')) {
                $('#media_module img').onload = ()=> {insertPos.insertAdjacentElement('afterbegin', pn);};
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
        }
    };

    if (oname) {
        init();
    } else if (biliSid && loc.match('https://www.bilibili.com/bangumi/play/')) {
        var ssApi = 'https://bangumi.bilibili.com/view/web_api/season?season_id=' + biliSid;
        XHR({url:ssApi,isjson:true,headers:{Referer:'https://www.bilibili.com/'} }).then(r=>{
            if (r.result && r.result.jp_title) {
                oname = r.result.jp_title;
                init();
            }
        });
    } else if (cname) {
        var bgmSearchApi = `https://api.bgm.tv/search/subject/${encodeURIComponent(cname.replace(marks, ' '))}?type=2`;
        console.log(bgmSearchApi);
        XHR({url:bgmSearchApi, headers: {Referer: 'https://bgm.tv'}, isjson:true}).then(r=>{
            if (r.results > 0) {
                bgmId = r.list[0].id;
                oname = r.list[0].name;
                for (let l of r.list) {
                    if (l.name_cn == cname) {
                        bgmId = l.id;
                        oname = l.name;
                        break;
                    }
                }
                init();
            }
        });
    }

    addUnionSearch(); // not finished yet
    function addUnionSearch() {
        var sites = {Douban: 'https://www.douban.com/search?cat=1002&q={keyword}', Age: 'https://www.agedm.org/search?query={keyword}',
                     Bilibili: 'https://search.bilibili.com/bangumi?search_source=5&keyword={keyword}', Mx: 'https://www.mxdm9.com/search/-------------.html?wd={keyword}',
                     Bgm: 'https://bgm.tv/subject_search/{keyword}?cat=2', Wjys: 'https://www.wjys.cc/vodsearch.html?wd={keyword}'};
        var us = $C('select', {id:'unionSearch', style:'color: orange; background: black;font-size:16px;'});
        for (const [k, v] of Object.entries(sites)) {
            var opt = $C('option', {value: v});
            opt.textContent = k;
            us.appendChild(opt);
            if (location.host.toUpperCase().match(k.toUpperCase())) {
                opt.selected = true;
            }
        }
        var inputNode = $('#query, .search-input, .searchInputL');
        inputNode.insertAdjacentElement('beforebegin', us);
        $('#button-addon2, .search-go, .searchBtnL').onclick = ()=> {
            var txt = inputNode.value;
            if (!location.host.toUpperCase().match(us.options[us.selectedIndex].label.toUpperCase) && txt.length > 0) {
                GM_openInTab(us.value.replace('{keyword}', encodeURIComponent(txt)));
                return false;
            }
        };
        var title = $('.video_play_detail_wrapper .card-title, .video_detail_title, .page-title a') || $('.page-title');
        if (title) {
            inputNode.value = title.textContent;
        }
    }

})()
