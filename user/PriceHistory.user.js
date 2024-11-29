// ==UserScript==
// @name        Price History
// @namespace   abs
// @version     1.1.3
// @description 在网上商店产品页面，自动插入价格历史。
// @include     /^https?:\/\/((n?pc|m)?item(\.m)?|book|mvd)\.(yiyao)?jd\.(hk|com)\/.+\.html/
// @include     /https?:\/\/www\.amazon\.cn\/(.+)?(dp\/|gp\/|mn\/detailApp)/
// @include     /https?:\/\/product\.dangdang\.com\/product\.aspx\?product_id=.*/
// @include     /^https?:\/\/www\.suning\.com\/emall\/(sngbv|snupgbpv|prd).+\.html.*/
// @include     /^https?:\/\/product\.suning\.com\/(\d+\/)?\d+\.html.*/
// @include     http://www.gome.com.cn/ec/homeus/jump/product/*.html*
// @include     /^https?:\/\/(www|item)\.yihaodian\.com\/item\/.*/
// @include     /^https?:\/\/(s|item)\.taobao\.com\/.*/
// @include     /^https?:\/\/(chaoshi\.)?detail\.tmall\.com\/item\.htm.*/
// @run-at      document-start
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
// ==/UserScript==


window.addEventListener("DOMContentLoaded", ()=> {

    var gwdUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36';
    var gwdVerifyUrl = "https://www.gwdang.com/trend/";
    var gwdVerifyUrl2 = "https://www.gwdang.com/static_page/captcha/";
    var mmmVerifyUrl = "https://tool.manmanbuy.com/m/ValidateAlibaba.aspx";
    var mmmWebUrl = "https://tool.manmanbuy.com/m/history.aspx?type=history_mobile_tool&url=";
    var gwdPUid;
    var ts = new Date().getTime();

    var loc = window.location.href;

    //var gwdApiUrl = "http://gwdang.com/app/price_trend/?callback=&days=&dp_id=" + product_uid + "-3"; // old api not work, '3' is jd, '25' is suning
    //var gwdApiUrl = "https://browser.gwdang.com/extension/price_towards?url=" + encodeURIComponent(location.href); // backup api need verify everyday
    //var gwdApiUrl = "https://gwdang.com/trend/data_www?show_prom=true&v=2&get_coupon=1&price=&period=360&dp_id=" + product_uid; // backup api need verify everyday
    //var gwdApiUrl = "https://m.gwdang.com/trend/data_new?opt=trend&price=&is_coupon=1&from=m&period=360&dp_id="
    // Violentmonkey:苏宁第三方的网页有错误，需要添加@inject-into content, 否则无法执行脚本。 Tampermonkey 无此问题
    var gwdApiUrl2 = "https://m.gwdang.com/trend/data_new?opt=trend&price=&is_coupon=1&from=m&period=360&dp_id=";
    var gwdApiUrl = "https://www.gwdang.com/trend/data_www?show_prom=true&v=2&get_coupon=1&price=&period=360&dp_id=";
    //var gwdApiUrl = "https://m.gwdang.com/mapp/v3/price_trend?_channel=mapp&app_platform=mapp&dp_id=";

    // from https://greasyfork.org/zh-CN/scripts/472757
    var gwdApi3 = 'https://browser.gwdang.com/extension/price_towards?ver=1&format=json&version='+ts+'&from_device=default&union=union_gwdang&crc64=1&url=' + encodeURIComponent(loc);

    var mmmApiUrl = "https://tool.manmanbuy.com/m/disSitePro.aspx?c_from=m&url=" + encodeURIComponent(loc.replace(/\&?skuId=\d+/, ''));
    //var mmmApiUrl = "https://bijiatool-v2.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx?methodName=getZhekou&ipagesize=1&ipage=1&zkOrderby=price&p_url=" + encodeURIComponent(location.href) + "&_=" + Date.now();
    //var mmmApiUrl2;     // https://tool.manmanbuy.com/history.aspx?action=gethistory&url=&token=
    var mmmApiUrl2 = "https://bijiatool-v2.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx?methodName=getBiJiaInfo&jsoncallback=&p_url=" + loc;

    //from https://greasyfork.org/zh-CN/scripts/418355
    var ssApiUrl = 'https://api.shop.xuelg.com/lsjg/?jdurl=' + location.href.replace(/\?.+/, '');

    if (loc.match('gwdang.com')) {

    }


    // 图书类还是 Google Chart
    function google_chart(response) {
        var temp_document, img_node, img_node_src, image_node;
        temp_document = document.createElement('html');
        temp_document.innerHTML = response.responseText;
        img_node = temp_document.querySelector('div.fNumber img');
        if (img_node === null) {
            image_node = document.createElement('p');
            image_node.innerHTML = '正在加载历史价格数据，<a href="' + response.finalUrl + '">查看链接</a>。';
        } else {
            // 修改样式
            img_node_src = img_node.src.replace('chs=630x180', 'chs=720x240');
            img_node_src = img_node_src.replace('chts=FF0000%2c13', 'chts=FF0000%2c14');
            img_node_src = img_node_src + '&chdls=,14';
            img_node.src = img_node_src;
            img_node_src.style.maxWidth = '100%';
            img_node.width = 720;
            img_node.height = 240;
            //img_node.style.marginTop = '10px';
            img_node.style.marginBottom = '10px';
            // 加上链接
            image_node = document.createElement('a');
            image_node.href = response.finalUrl;
            image_node.appendChild(img_node);
        }
        return image_node;
    }

    // 非图书类是自托管图片
    function self_host(urls) {
        var img_node = document.createElement('div');
        var detail_url = urls[0];
        var chart_url = urls[1];
        var img = document.createElement('img');
        img_node.id = 'priceHistoryBox';
        img.src = chart_url;
        img.width = 630;
        img.setAttribute('height', 'auto');
        img.style.maxWidth = '100%';
        img.alt = '正在加载历史价格数据，查看链接。';
        //img_node.style.marginTop = '10px';
        img.style.marginBottom = '10px';
        img.onerror = ()=> {img.alt = 'boxz加载数据失败！';img.style.display = 'none';};
        // img_node.onerror = function(e) { if (urls.length > 2) useGwdData(this, urls[2], e.type);}
        // img_node.onload = function(e) { if (urls.length > 2) useGwdData(this, urls[2], e.type);}
        // setTimeout(function(){if(!img_node.complete && urls.length> 2) useGwdData(img_node, urls[2], "timeout");}, 2000);
        if (urls[2]) useGwdData(img_node, urls[2], 'load');
        useMmmData(img_node, mmmApiUrl2, 'load');
        // 加上链接
        var link = document.createElement('a');
        link.href = detail_url;
        link.target = "_blank";
        link.appendChild(img);
        //img_node.appendChild(link);
        return img_node;
    }

    // 获得价格历史图片
    function create_history_image_node(response) {
        var image_node;
        if (response.responseText === undefined) {
            image_node = self_host(response);
        }
        else {
            image_node = google_chart(response);
        }
        return image_node;
    }

    function create_product_history_url(prefix, product_uid) {
        var detail_url = 'http://www.boxz.com/products/' + prefix + '-' + product_uid + '.shtml';
        var chart_url = 'http://www.boxz.com/pic/small/' + prefix + '-' + product_uid + '.png';
        var gwd_url, gwd_url2 = '';
        if (prefix == '360buy') {
            gwdPUid = product_uid + "-3";
            gwd_url = gwdApiUrl + gwdPUid;
            gwd_url2 = gwdApiUrl2 + gwdPUid;
        } else {
            gwdPUid = product_uid;
            gwd_url = "https://browser.gwdang.com/brwext/dp_query?url=" + encodeURIComponent(location.href) + "&crc64=1&_=" + Date.now(); // not precision
        }
        console.log(gwd_url, gwd_url2);
        console.log(gwdApi3);
        return [detail_url, chart_url, gwd_url];
    }

    function create_book_history_url(prefix, product_uid) {
        var detail_url = 'http://www.boxz.com/books/' + prefix + '-' + product_uid + '.shtml';
        var chart_url = null;
        return [detail_url, chart_url];
    }

    function insertAfter(image_node, place_node) {
        var parentNode = place_node.parentNode;
        if (place_node.nextElementSibling) {
            parentNode.insertBefore(image_node, place_node.nextElementSibling);
        } else {
            parentNode.appendChild(image_node);
        }
    }

    function setMMMApiUrl(pid) {
        //var pUrl, token;
        //if (loc.match(/jd\.(com|hk)/)) {
        //    pUrl = loc.match(/[^\?]+/)[0]; //`https://item.jd.com/${pid}.html`;
        //    token = d.encrypt(pUrl, 2, true);
        //}
        //mmmApiUrl2 = `http://tool.manmanbuy.com/history.aspx?action=gethitory&url=${encodeURIComponent(pUrl)}&token=${token}`;
    }

    /* 网店处理规则 */
    var sites = [{
        domain : 'jd.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            if (loc.match(/^https?:\/\/(n?pc)?item(\.m)?\.(yiyao)?jd\.com/)) {
                reg = new RegExp('/(\\d+)\.html');
                product_uid = loc.match(reg)[1];
                history_url = create_product_history_url('360buy', product_uid);
            } else {
                reg = new RegExp('https?://.+\.jd\.com/(\\d+).html');
                product_uid = loc.match(reg)[1];
                history_url = create_book_history_url('360buy', product_uid);
            }
            if (loc.match(/\.m\.jd\./)) {
                GM_addStyle('.item_floor {padding:0;} #imk2FixedBottom{display:none;}');
            }
            // setMMMApiUrl(product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('#choose') || document.querySelector("#discountFloor") || document.querySelector(".p-choose-wrap") || document.querySelector('.itemover-tip');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'jd.hk',
        get_history_url: function() {
            var reg, product_uid, history_url;
            if (loc.match(/^https?:\/\/(n?pc|m)?item\.jd\.hk/)) {
                reg = new RegExp('(\\d+)\.html');
                product_uid = loc.match(reg)[1];
                history_url = create_product_history_url('360buy', product_uid);
            } else {
                reg = new RegExp('https?://.+\.jd\.hk/(\\d+)\.html');
                product_uid = loc.match(reg)[1];
                history_url = create_book_history_url('360buy', product_uid);
            }
            //setMMMApiUrl(product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('#choose') || document.querySelector("#choose-btns") && document.querySelector("#choose-btns").parentNode || document.querySelector("#discountGap");
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'tmall.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            if (loc.match(/^https?:\/\/(chaoshi\.)?detail\.tmall\.com\/item\.htm.*/)) {
                reg = new RegExp('id=(\\d+)');
                product_uid = loc.match(reg)[1];
                history_url = create_product_history_url('tmall', product_uid);
            }
            return history_url;
        },
        request_callback: function(response) {
            var image_node = create_history_image_node(response);
            waitForElements({selector: '.tb-skin, [class^="PurchasePanel-"], [class*=BasicContent--actions-]', callback: n=>n.parentNode.insertBefore(image_node, n.nextElementSibling)});
        }
    }, {
        domain : 'taobao.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            if (loc.match(/^https?:\/\/item\.taobao\.com\/item\.htm.*/)) {
                reg = new RegExp('id=(\\d+)');
                product_uid = loc.match(reg)[1];
                history_url = create_product_history_url('tmall', product_uid);
            }
            return history_url;
        },
        request_callback: function(response) {
            var image_node = create_history_image_node(response);
            waitForElements({selector: '.tb-skin, [class^="PurchasePanel-"]', callback: n=>n.parentNode.insertBefore(image_node, n.nextElementSibling)});
        }
    }, {
        domain : 'amazon.cn',
        get_history_url: function() {
            var reg, product_uid, history_url;
            var asin = document.querySelector("#ASIN");
            if (asin && asin.value) {
                product_uid = asin.value.toLowerCase();
            } else {
                if (loc.indexOf('/gp/product/') !== -1) {
                    reg = new RegExp('https?://www.amazon.cn/gp/product/([^/]+)/\?');
                } else if (url.indexOf('/dp/') !== -1) {
                    reg = new RegExp('https?://www.amazon.cn/[^/]*/\?dp/([^/]+)/\?');
                } else {
                    reg = new RegExp('https?://www.amazon.cn/mn/detailApp.*asin=(\\w+)');
                }
                product_uid = loc.match(reg)[1].toLowerCase();
            }
            var category = document.querySelector('.nav-a-content');
            if (category && category.textContent.trim() === '图书') {
                history_url = create_book_history_url('amazon', product_uid);
            } else {
                history_url = create_product_history_url('amazon', product_uid);
            }
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('#feature-bullets');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'dangdang.com',
        get_history_url: function() {
            var reg, category, product_uid, history_url;
            reg = new RegExp('http://product.dangdang.com/[pP]roduct.aspx\\?product_id=(\\d+)');
            product_uid = loc.match(reg)[1];
            category = document.querySelector('.nav_top li.on a').textContent;
            if (category === '图书' || category === '音像') {
                history_url = create_book_history_url('dangdang', product_uid);
            } else {
                history_url = create_product_history_url('dangdang', product_uid);
            }
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.show_info');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'suning.com',
        get_history_url: function() {
            var reg, mess, product_uid, history_url;
            // 真恶心的url设计
            reg = new RegExp('https?://www.suning.com/emall/(.+?).html');
            if (loc.match(reg)) {
                mess = loc.match(reg)[1].split('_');
                if (mess[0] === 'prd') {
                    product_uid = mess[4];
                }
                else {
                    product_uid = mess[3];
                }
            } else {
                reg = new RegExp('https?://.+\.suning\.com/(\\d+/)?(\\d+).html');
                product_uid = loc.match(reg)[2];
            }
            history_url = create_product_history_url('suning', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            // 真混乱
            place_node = document.querySelector('.proinfo-memo');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'gome.com',
        get_history_url: function() {
            var product_uid, history_url;
            product_uid = document.querySelector('#hideSkuid').value;
            history_url = create_product_history_url('gome', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('#choose');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'yihaodian.com',
        get_history_url: function() {
            var product_uid, history_url;
            product_uid = document.querySelector('#mainProductId').value;
            history_url = create_product_history_url('yihaodian', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.produce');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }];

    function start_request(site) {
        var urls = site.get_history_url();
        if (urls[1] === null) {
            // 图书类
            GM_xmlhttpRequest({
                method: 'GET',
                url: urls[0],
                onload: site.request_callback
            });
        }
        else {
            // 非图书类
            site.request_callback(urls);
        }
    }

    /* 开始处理 */
    var i, site;
    for (i = 0; i < sites.length; i += 1) {
        if (loc.indexOf(sites[i].domain) !== -1) {
            site = sites[i];
            break;
        }
    }
    start_request(site);


    // <img src="/image/..." onerror="javascript:this.src='images/default.jpg'"/>
    function imageExists(image_url){
        var http = new XMLHttpRequest();
        http.open('HEAD', image_url, false);
        http.send();
        return http.status != 404;
    }

    function useMmmData(imgNode, url, type) {
        console.log("mmmApiUrl:", url);
        var minGetDate='', minGetPrice='', minShowDate='', minShowPrice='', ttl='', mmmVerify = false, sLow='';
        var mmmUA = "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";
        var isJson = true;
        var isFinalUrl = false;
        var errmsg = '';
        var setHistoryPrice = () => {
            var c = document.createElement("canvas");
            c.width = 630;
            c.height = 25;
            var ctx = c.getContext('2d');
            ctx.font = "16px 微软雅黑";
            if (minGetDate) {
                var tt = '慢慢买：';
                if (minShowDate && minShowPrice) {
                    tt += `最低标价￥${minShowPrice}，`;
                    ttl += `最低标价日期${minShowDate}，`;
                }
                tt += `折后最低价`;
                ttl += `折后最低日期${minGetDate}`;
                ttl += sLow;
                ctx.fillText(tt, 10, 20);
            }
            if (minGetPrice) {
                var w = ctx.measureText(tt).width;
                ctx.fillStyle = 'red';
                ctx.fillText(`￥${minGetPrice}`, 10 + w, 20);
            }
            if (errmsg) {
                ctx.fillText(errmsg, 10, 20);
            }
            if (mmmVerify) {
                var mmmBtn = document.createElement('a');
                mmmBtn.id = 'mmmBtn';
                var btn = $C('button');
                btn.textContent = '慢慢买需要验证';
                mmmBtn.appendChild(btn);
                mmmBtn.href = url;
                mmmBtn.target = '_blank';
                imgNode.appendChild(mmmBtn);
                btn.onclick = e => {
                    if (btn.textContent == '重新加载慢慢买') {
                        e.preventDefault();
                        mmmBtn.remove();
                        useMmmData(imgNode, url, type);
                    } else {
                        btn.textContent = '重新加载慢慢买';
                    }
                }
            } else {
                var a = document.createElement("a");
                c.title = ttl;
                a.appendChild(c);
                a.href = mmmWebUrl + encodeURIComponent(location.href); //'https://tool.manmanbuy.com/HistoryLowest.aspx?url=' + encodeURIComponent(location.href);
                a.target = "_blank";
                //imgNode.parentNode.insertBefore(a, imgNode);
                imgNode.appendChild(a);
            }
        };
        if (url.match("/m/disSitePro.aspx")) {
            isJson = false;
            isFinalUrl = true;
        }
        XHR({url:url, isjson: isJson, finalUrl: isFinalUrl, headers: {"User-Agent": mmmUA, Referer: 'https://tool.manmanbuy.com'}}).then(r=> {
            if (isJson) {
                if (r.ok == 1 && r.zklist && r.zklist.length > 0) {
                    var d = r.zklist[0];
                    minGetDate = new Date(Number(d.dt.match(/\d+/)[0])).toLocaleDateString('zh-CN');
                    minGetPrice = d.currentprice;
                    ttl = (d.TJYY? d.TJYY : '') + (d.spprice? d.spprice : '');
                    setHistoryPrice();
                } else if (r.datePrice) {
                    minGetDate = eval("new " + r.lowerDate.replaceAll("/", "")).toLocaleDateString('zh-CN');
                    minGetPrice = r.lowerPrice;
                    setHistoryPrice();
                } else if (r.lowerPrice && r.lowerPriceyh) {
                    minGetPrice = r.lowerPriceyh;
                    minShowPrice = r.lowerPrice;
                    minGetDate = eval("new " + r.lowerDateyh.replaceAll("/", "")).toLocaleDateString('zh-CN');
                    minShowDate = eval("new " + r.lowerDate.replaceAll("/", "")).toLocaleDateString('zh-CN');
                    if (r.jiagequshiyh) {
                        var yh = eval(`[${r.jiagequshiyh}]`).sort((a,b)=>a[1]>b[1]);
                        for (let i of yh) {
                            if (i[1] > minGetPrice) {
                                sLow = `，第二低价:￥${i[1]}, 日期:${new Date(i[0]).toLocaleDateString('zh-CN')}`;
                                break;
                            }
                        }
                    }
                    setHistoryPrice();
                } else if (url == mmmApiUrl2) {
                    useMmmData(imgNode, mmmApiUrl, type);
                }
            } else if(r.match("https://tool.manmanbuy.com/m/ValidateAlibaba.aspx")) {
                mmmVerify = true;
                setHistoryPrice();
            } else {
                var tokens = r.replace(/^.+\?/, '').split('&');
                var fd = new FormData();
                tokens.forEach(t => {
                    var kv = t.split('=');
                    fd.append(kv[0], decodeURIComponent(kv[1]));
                });
                XHR({url:'https://apapia-history-weblogic.manmanbuy.com/h5/share/trendData', method:'POST', data: fd, isjson:true}).then(j=>{
                    if (j.ok == 1 && j.result) {
                        minGetPrice = j.result.priceRemark.lowestPrice;
                        minGetDate = j.result.priceRemark.lowestDate.split(' ')[0];
                    } else if (j.ok == 0 && j.code == 6001) {
                        errmsg = j.msg;
                    } else {
                        mmmVerify = true;
                    }
                    setHistoryPrice();
                });
            }


        });
    }


    function useGwdData(imgNode, url, type) {
        if (imgNode.getAttribute("errerHandle")) {
            return;
        }
        if (type == "error" || type == "timeout") {
            imgNode.setAttribute("errerHandle", "true");
        }

        var a = document.createElement("a");
        var img = document.createElement("img");
        var minPriceStr = "购物党：最低标价￥", minPriceDateStr = "最低标价日期:";
        var minGetPriceStr = "，折后最低价", minGetPriceDateStr = "。折后最低价日期:", mgp;
        var gwdPage = "https://www.gwdang.com/trend?url=" + encodeURIComponent(location.href);
        var gvurl = `https://gwdang.com/v2/trend/${gwdPUid}.html?static=true&time=${ts}`;
        var gwdVerify = false;
        var gwdVerifyUrl = "https://www.gwdang.com/slider/verify.html?fromUrl=" + encodeURIComponent(location.href);

        //var gvurl = 'https://www.gwdang.com/trend/' + gwdPUid + '.html?static=true&time=' + Math.floor(Date.now()/1000);
        var setPrice = obj => {
            var tt, dateFrom, minPrice, minGetPrice, tt2, minST, minPST, vfUrl;
            if (obj.is_ban == 1 || (obj.series && obj.series[0].min == 91100)) {
                if (type == 'banRetry') {
                    return;
                }
                tt = "购物党需要验证，正在进行验证！";
                gwdVerify = true;

            } else if (url.match(/browser\.gwdang\.com\/extension\/price_towards/)) {
                dateFrom = new Date(obj.store[0].all_line_begin_time).toISOString().split("T")[0];
                minPrice = obj.store[0].lowest;
                minGetPrice = obj.store[1].lowest;
                //tt = dateFrom + minPriceStr + minPrice + minGetPriceStr + minGetPrice;
                tt = minPriceStr + minPrice + minGetPriceStr;
                mgp = minGetPrice;
            } else if (url.match(/gwdang\.com\/trend\/data_www|m\.gwdang\.com\/mapp/) && obj.series && obj.series[0]) {
                dateFrom = new Date(obj.series[0].data[0].x*1000).toISOString().split("T")[0];
                minPrice = obj.series[0].min / 100.0;
                minGetPrice = (obj.promo_series)? obj.promo_series[0].min / 100.0 : minPrice;
                //tt = dateFrom + minPriceStr + minPrice + minGetPriceStr + minGetPrice;
                tt = minPriceStr + minPrice + minGetPriceStr;
                mgp = minGetPrice;
                minST = new Date(obj.series[0].min_stamp*1e3).toLocaleDateString("zh-CN");
                tt2 = minPriceDateStr + minST;
                if (obj.promo_series) {
                    minGetPrice = obj.promo_series[0].min / 100.0;
                    minPST = new Date(obj.promo_series[0].min_stamp*1e3).toLocaleDateString("zh-CN");
                    var minP = obj.promo_detail.find(p=>p.time == obj.promo_series[0].min_stamp && p.price == obj.promo_series[0].min);
                    var minT = [];
                    if (minP) minP.msg.forEach(m=>minT.push(m.text));
                    tt2 += minGetPriceDateStr + minPST + (minP? "，标价：" + (minP.ori_price / 100) + '，' : '') + minT.join('，');
                }
            } else if (url.match(/gwdang\.com\/trend\/data_new/) && obj.data && obj.data.series[0]) {
                dateFrom = new Date(obj.data.series[0].data[0].x*1000).toISOString().split("T")[0];
                minPrice = obj.data.series[0].min / 100.0;
                minST = new Date(obj.data.series[0].min_stamp*1e3).toLocaleDateString("zh-CN");
                tt = minPriceStr + minPrice;
                tt2 = minPriceDateStr + minST;
                var minT = [], minP;
                if (obj.data.promo_series) {
                    minGetPrice = obj.data.promo_series[0].min / 100.0;
                    minPST = new Date(obj.data.promo_series[0].min_stamp*1e3).toLocaleDateString("zh-CN");
                    minP = obj.data.promo_detail.find(p=>p.time == obj.data.promo_series[0].min_stamp && p.price == obj.data.promo_series[0].min);
                    tt += minGetPriceStr;
                    mgp = minGetPrice;
                    if (minP) minP.msg.forEach(m=>minT.push(m.text));
                    tt2 += minGetPriceDateStr + minPST + (minP? "，标价：" + (minP.ori_price / 100) + '，' : '') + minT.join('，');
                } else if (obj.data.promo_detail) {
                    minP = obj.data.promo_detail.sort((a,b)=>a.price > b.price)[0];
                    tt += minGetPriceStr;
                    mgp = minP.price / 100;
                    minPST = new Date(minP.time*1e3).toLocaleDateString("zh-CN");
                    minP.msg.forEach(m=>minT.push(m.text));
                    tt2 += minGetPriceDateStr + minPST + (minP? "，标价：" + (minP.ori_price / 100) + '，' : '') + minT.join('，');
                }
                //tt = dateFrom + minPriceStr + minPrice + minGetPriceStr + minGetPrice;
            } else if(gwdApi3) {
                var lowest = parseFloat(obj.store[0].lowest);
                var allPromo = (obj.promo || []).concat(obj.nopuzzle_promo || []).sort((a,b)=>a.ori_price > b.ori_price);
                if (allPromo.length > 0) {
                    var minBP = allPromo[0];
                    var minP2 = 0;
                    for (let i of allPromo) {
                        if (i.price > minBP.price) {
                            minP2 = i.price / 100;
                            break;
                        }
                    }
                    minGetPrice = minBP.ori_price / 100;
                    minST = new Date(minBP.time*1e3).toLocaleDateString("zh-CN");
                    minP = allPromo.sort((a,b)=>a.price > b.price)[0];
                    mgp = minP.price / 100;
                    mgp = (lowest < mgp)? lowest : mgp;
                    minPST = new Date(minP.time*1e3).toLocaleDateString("zh-CN");
                    tt = minPriceStr + minGetPrice + minGetPriceStr;
                    tt2 = minPriceDateStr + minST + minGetPriceDateStr + minPST + (minP? "，标价：" + (minP.ori_price / 100) + '，' : '') + [(minP.msg.promotion||''),(minP.msg.coupon||'')].join(' ') + "；第二低价为￥" + minP2;
                } else if (obj.store) {
                    var lowestData = new Date(obj.store[0].lowest_date*1e3).toLocaleDateString("zh-CN");
                    mgp = obj.store[0].lowest;
                    tt = '购物党最低价格日期：' + lowestData + '，最低价格：';
                    tt2 = '';
                }
            } else {
                tt = '抱歉，购物党暂无比价结果~';
            }
            var c = document.createElement("canvas");
            c.width = 630;
            c.height = 25;
            var ctx = c.getContext('2d');
            ctx.font = "16px 微软雅黑";
            ctx.fillText(tt, 10, 20);
            if (mgp) {
                var w = ctx.measureText(tt).width;
                ctx.fillStyle = 'red';
                ctx.fillText(`￥${mgp}`, 10 + w, 20);
            }

            if (type == "error") {
                img.height = c.height;
                img.src = c.toDataURL();
                img.removeAttribute("alt");
                //imgNode.parentNode.href = "javascript:void(0);";
                img.title = tt2;
            } else if (type == "load" || type == "timeout") {
                img.src = c.toDataURL();
                //imgNode.title = tt;
                img.title = tt2;
            }
            a.appendChild(img);
            a.href = (obj.is_ban == 1)? a.href : gvurl;
            a.target = "_blank";
            if (gwdVerify) {
                var gwdBtn = document.createElement('a');
                gwdBtn.id = 'gwdBtn';
                var btn = $C('button');
                btn.textContent = '购物党需要验证';
                gwdBtn.appendChild(btn);
                gwdBtn.href = gwdVerifyUrl;
                gwdBtn.target = '_blank';
                imgNode.appendChild(gwdBtn);
                btn.onclick = e => {
                    if (btn.textContent == '重新加载购物党') {
                        e.preventDefault();
                        gwdBtn.remove();
                        useGwdData(imgNode, url, type);
                    } else {
                        btn.textContent = '重新加载购物党';
                    }
                }
            } else {
                imgNode.appendChild(a);
            }
            // if (location.href.match('jd.com')) {
            //     GM_xmlhttpRequest({method:'GET', url: ssApiUrl, onload: function(r) {
            //         var rTxt = r.responseText;
            //         if (rTxt) {
            //             var json = JSON.parse(rTxt);
            //             var zdj = json['zuidijia'];
            //             var ssa = document.createElement('div');
            //             ssa.style.fontSize = '16px';
            //             ssa.innerHTML = '超简比价:' + zdj;
            //             imgNode.appendChild(ssa);
            //         }
            //     }});
            // }
        };
        //console.log(url);
        var banRetry = false;
        var fp = randomString(32);
        var dfp = randomString(60);
        var getPrice = (aUrl, headers) => {
            var hd = headers || {Referer: 'https://www.gwdang.com/',  Accept: 'application/json, text/javascript, */*', Pragma: 'no-cache', 'Cache-Control': 'no-cache', 'authority':'www.gwdang.com'};
            GM_xmlhttpRequest({
                method: 'GET',
                headers: hd,
                url: aUrl,
                // timeout: 5000,
                onload: function(resp) {
                    var rspTxt = resp.responseText;
                    var obj = {};
                    //console.log(rspTxt)
                    if (rspTxt && !rspTxt.match(/请勿频繁访问/)) {
                        obj = JSON.parse(rspTxt.replace(/^\(|\)$/g, ""));//alert(obj.dp_id)
                    } else {
                        obj.is_ban = 1;
                        banRetry = true;
                    }
                    if (obj.is_ban == 1 && banRetry == false) {
                        banRetry = true;
                        // var gvurl = 'https://www.gwdang.com/trend/' + gwdPUid + '.html?static=true&time=' + Math.floor(Date.now()/1000);
                        console.log('gvurl:', gvurl);
                        a.href = gwdVerifyUrl;
                        // XHR({url:gvurl, header:hd}).then(r=>{
                        //     getPrice();
                        // });
                    }
                    if (obj.dp_id) {
                        url = gwdApiUrl + obj.dp_id;
                        console.log(url);
                        getPrice();
                    } else {
                        setPrice(obj);
                    }
                },
                ontimeout: function() {
                    imgNode.title = "读取浮动价格超时！"
                }
            });
        };

        if (!gwdApi3) {
            GM_xmlhttpRequest({
                url: "https://browser.gwdang.com/brwext/permanent_id?version=2&default_style=bottom&referrer=",
                method: "HEAD",
                onload: function(r) {
                    var ck = r.responseHeaders.match(/set-cookie:(.+\n)+/g)[0].replace(/Max-Age.+None;\n|set-cookie: /g, '').trim();
                    getPrice(gwdApi3, {cookie: ck});
//                     GM_xmlhttpRequest({
//                         url: gwdApi3,
//                         method: "GET",
//                         headers: {cookie: ck},
//                         onload: function(res) {
//                             var json = JSON.parse(res.responseText);

//                         }
//                     });
                }
            });
        } else {
            getPrice(url);
        }

    }

    function randomString(e) {
        e = e || 32;
        var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz1234567890",
            a = t.length,
            n = "";
        for (let i = 0; i < e; i++) {
            n += t.charAt(Math.floor(Math.random() * a));
        }
        return n
    }

    function mmmBypassVerify(){
        var vbtnclicked = false;
        var vi = setInterval(()=> {
            var vbtn=document.querySelector("#SM_BTN_1");
            var sbtn=document.querySelector("#nc_1_n1z");
            if (vbtn && !vbtnclicked) {
                vbtnclicked = true;
                vbtn.click();
            } else if (sbtn) {
                clearInterval(vi);
                var mousedown = document.createEvent("MouseEvents");
                var rect = sbtn.getBoundingClientRect();
                var x = rect.x||rect.left;
                var y = rect.y||rect.top;
                var w = document.querySelector("#nc_1__scale_text").getBoundingClientRect().width;
                //点击滑块
                mousedown.initMouseEvent("mousedown",true,true,unsafeWindow,0, x, y, x, y,false,false,false,false,0,null);
                sbtn.dispatchEvent(mousedown);

                var dx = 0;
                var dy = 0;
                //滑动滑块
                var intervaltimer = setInterval(function(){
                    var mousemove = document.createEvent("MouseEvents");
                    var _x = x + dx;
                    var _y = y + dy;
                    mousemove.initMouseEvent("mousemove",true,true,unsafeWindow,0, _x, _y, _x, _y,false,false,false,false,0,null);
                    sbtn.dispatchEvent(mousemove);

                    sbtn.dispatchEvent(mousemove);
                    if(_x - x >= w){
                        clearInterval(intervaltimer);
                        var mouseup = document.createEvent("MouseEvents");
                        mouseup.initMouseEvent("mouseup",true,true,unsafeWindow,0, _x, _y, _x, _y,false,false,false,false,0,null);
                        sbtn.dispatchEvent(mouseup);
                    }
                    else{
                        dx += parseInt(Math.random()*(209-199)+199)/33;
                        //console.log(x,y,_x,_y,dx);
                    }
                }, 30);
            }
        }, 500);
    }
});
