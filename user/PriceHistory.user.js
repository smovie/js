// ==UserScript==
// @name        Price History
// @namespace   abs
// @version     1.1.1
// @description 在网上商店产品页面，自动插入价格历史。
// @include     /^https?:\/\/((n?pc|m)?item(\.m)?|book|mvd)\.jd\.(hk|com)\/.+\.html/
// @include     /https?:\/\/www\.newegg\.com\.cn\/Product\/.*/
// @include     /https?:\/\/www\.amazon\.cn\/(.+)?(dp\/|gp\/|mn\/detailApp)/
// @include     /https?:\/\/product\.dangdang\.com\/product\.aspx\?product_id=.*/
// @include     /^https?:\/\/www\.suning\.com\/emall\/(sngbv|snupgbpv|prd).+\.html.*/
// @include     /^https?:\/\/product\.suning\.com\/(\d+\/)?\d+\.html.*/
// @include     http://www.gome.com.cn/ec/homeus/jump/product/*.html*
// @include     http://www.lusen.com/Product/ProductInfo.aspx?Id=*
// @include     http://www.efeihu.com/Product/*.html*
// @include     http://www.tao3c.com/product/*
// @include     http://www.coo8.com/product/*.html*
// @include     /^https?:\/\/(www|item)\.yihaodian\.com\/item\/.*/
// @include     http://www.1mall.com/item/*
// @include     http://www.ouku.com/goods*
// @include     http://www.redbaby.com.cn/*/*.html*
// @include     http://cn.strawberrynet.com/a/b/c/*/
// @include     http://web1.sasa.com/SasaWeb/sch/product/viewProductDetail.jspa?itemno=*
// @include     http://www.bookschina.com/*.htm
// @include     http://www.wl.cn/*
// @include     http://product.china-pub.com/*
// @include     http://www.winxuan.com/product/*
// @include     http://www.99read.com/product/*
// @include     http://www.new7.com/product/*
// @include     http://detail.bookuu.com/*.html
// @include     /^https?:\/\/(s|item)\.taobao\.com\/.*/
// @include     /^https?:\/\/(chaoshi\.)?detail\.tmall\.com\/item\.htm.*/
// @include     https://www.gwdang.com/slider/verify.html*
// @include     https://www.gwdang.com/static_page/captcha/*
// @include     https://gwdang.com/trend/*
// @include     https://tool.manmanbuy.com/m/*
// @run-at      document-start
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       unsafeWindow
// ==/UserScript==


window.addEventListener("DOMContentLoaded", ()=> {

    var gwdUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36';
    var gwdVerifyUrl = "https://www.gwdang.com/trend/";
    var gwdVerifyUrl2 = "https://www.gwdang.com/static_page/captcha/";
    var mmmVerifyUrl = "https://tool.manmanbuy.com/m/ValidateAlibaba.aspx";
    var gwdPUid;

    var url = window.location.href;

    // if (top != self) {
    //     if (url.match(gwdVerifyUrl2)) {
    //         GM_setValue("gwdCookieSet", false);
    //         var gvi2 = setInterval(()=>{
    //             if (document.querySelector(".verify-tip.success")) {
    //                 clearInterval(gvi2);
    //                 GM_setValue("gwdCookieSet", true);
    //             }
    //         }, 1000);
    //         return
    //     } else if (url.match(gwdVerifyUrl)) {
    //         GM_setValue("gwdCookieSet", false);
    //         if(localStorage["gwdang-dfp"] && localStorage["gwdang-fp"]) {
    //             setCookie("dfp", localStorage["gwdang-dfp"], 9999);
    //             setCookie("fp", localStorage["gwdang-fp"], 9999);
    //             GM_setValue("gwdCookieSet", true);
    //         }
    //         return;
    //     } else if (url.match("https://tool.manmanbuy.com/m/disSitePro.aspx")) {
    //         GM_setValue("mmmCookieSet", true);
    //         return;
    //     } else if (url.match(mmmVerifyUrl)) {
    //         mmmBypassVerify();
    //         return;
    //     }
    // }

    //var gwdApiUrl = "http://gwdang.com/app/price_trend/?callback=&days=&dp_id=" + product_uid + "-3"; // old api not work, '3' is jd, '25' is suning
    //var gwdApiUrl = "https://browser.gwdang.com/extension/price_towards?url=" + encodeURIComponent(location.href); // backup api need verify everyday
    //var gwdApiUrl = "https://gwdang.com/trend/data_www?show_prom=true&v=2&get_coupon=1&price=&period=360&dp_id=" + product_uid; // backup api need verify everyday
    //var gwdApiUrl = "https://m.gwdang.com/trend/data_new?opt=trend&price=&is_coupon=1&from=m&period=360&dp_id="
    // Violentmonkey:苏宁第三方的网页有错误，需要添加@inject-into content, 否则无法执行脚本。 Tampermonkey 无此问题
    var gwdApiUrl2 = "https://m.gwdang.com/trend/data_new?opt=trend&price=&is_coupon=1&from=m&period=360&dp_id=";
    var gwdApiUrl = "https://www.gwdang.com/trend/data_www?show_prom=true&v=2&get_coupon=1&price=&period=360&dp_id=";
    //var gwdApiUrl = "https://m.gwdang.com/mapp/v3/price_trend?_channel=mapp&app_platform=mapp&dp_id=";

    var mmmApiUrl = "https://tool.manmanbuy.com/m/disSitePro.aspx?c_from=m&url=" + encodeURIComponent(location.href);
    //var mmmApiUrl = "https://bijiatool-v2.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx?methodName=getZhekou&ipagesize=1&ipage=1&zkOrderby=price&p_url=" + encodeURIComponent(location.href) + "&_=" + Date.now();
    var mmmApiUrl2;     // https://tool.manmanbuy.com/history.aspx?action=gethistory&url=&token=

    if (url.match('https://gwdang.com/trend/')) {
        var tn = $('.search_colum a');
        if (a && a.href == url) {
            location.reload();
            return;
        }
    }
//     if (url.includes(gwdVerifyUrl2)) {

//         var timer = setInterval(() => {
//             var vf = document.querySelector('.slider_tab.enabled');
//             if (vf && vf.textContent) {
//                 clearInterval(timer);
//                 vf.click();
//                 var page = document.querySelector(".page.yahei");
//                 var slide = document.querySelector(".slider_div");
//                 if (page && slide) {
//                     page.replaceWith(slide);
//                 }
//             }
//         }, 1000);
//         if (top != self) {
//             window.onbeforeunload = () => {
//                 var pUrl = location.href.match(/fromUrl=(.+)/);
//                 if (pUrl) {
//                     //window.parent.location = decodeURIComponent(pUrl[1]); // may cause problem
//                 }
//             };
//         }
//         return;
//     }
//
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
        useMmmData(img_node, mmmApiUrl, 'load');
        // 加上链接
        var link = document.createElement('a');
        link.href = detail_url;
        link.target = "_blank";
        link.appendChild(img);
        img_node.appendChild(link);
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
        gwdPUid = product_uid + "-3";
        if (prefix == '360buy') {
            gwd_url = gwdApiUrl + gwdPUid;
            gwd_url2 = gwdApiUrl2 + gwdPUid;
        } else {
            gwd_url = "https://browser.gwdang.com/brwext/dp_query?url=" + encodeURIComponent(location.href) + "&crc64=1&_=" + Date.now();
        }
        console.log(gwd_url, gwd_url2);
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
        //if (url.match(/jd\.(com|hk)/)) {
        //    pUrl = url.match(/[^\?]+/)[0]; //`https://item.jd.com/${pid}.html`;
        //    token = d.encrypt(pUrl, 2, true);
        //}
        //mmmApiUrl2 = `http://tool.manmanbuy.com/history.aspx?action=gethitory&url=${encodeURIComponent(pUrl)}&token=${token}`;
    }

    /* 网店处理规则 */
    var sites = [{
        domain : 'jd.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            if (url.match(/^https?:\/\/(n?pc)?item(\.m)?\.jd\.com/)) {
                reg = new RegExp('/(\\d+)\.html');
                product_uid = url.match(reg)[1];
                history_url = create_product_history_url('360buy', product_uid);
            } else {
                reg = new RegExp('https?://.+\.jd\.com/(\\d+).html');
                product_uid = url.match(reg)[1];
                history_url = create_book_history_url('360buy', product_uid);
            }
            if (url.match(/\.m\.jd\./)) {
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
            if (url.match(/^https?:\/\/(n?pc|m)?item\.jd\.hk/)) {
                reg = new RegExp('(\\d+)\.html');
                product_uid = url.match(reg)[1];
                history_url = create_product_history_url('360buy', product_uid);
            } else {
                reg = new RegExp('https?://.+\.jd\.hk/(\\d+)\.html');
                product_uid = url.match(reg)[1];
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
            if (url.match(/^https?:\/\/(chaoshi\.)?detail\.tmall\.com\/item\.htm.*/)) {
                reg = new RegExp('id=(\\d+)');
                product_uid = url.match(reg)[1];
                history_url = create_product_history_url('tmall', product_uid);
            }
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.tb-skin');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'taobao.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            if (url.match(/^https?:\/\/item\.taobao\.com\/item\.htm.*/)) {
                reg = new RegExp('id=(\\d+)');
                product_uid = url.match(reg)[1];
                history_url = create_product_history_url('tmall', product_uid);
            }
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.tb-skin');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    },{
        domain : 'newegg.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.newegg.com.cn/[Pp]roduct/([^.]+).htm');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('newegg', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.mainInfoArea');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'amazon.cn',
        get_history_url: function() {
            var reg, product_uid, history_url;
            var asin = document.querySelector("#ASIN");
            if (asin && asin.value) {
                product_uid = asin.value.toLowerCase();
            } else {
                if (url.indexOf('/gp/product/') !== -1) {
                    reg = new RegExp('https?://www.amazon.cn/gp/product/([^/]+)/\?');
                } else if (url.indexOf('/dp/') !== -1) {
                    reg = new RegExp('https?://www.amazon.cn/[^/]*/\?dp/([^/]+)/\?');
                } else {
                    reg = new RegExp('https?://www.amazon.cn/mn/detailApp.*asin=(\\w+)');
                }
                product_uid = url.match(reg)[1].toLowerCase();
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
            product_uid = url.match(reg)[1];
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
        domain : 'yixun.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://item.yixun.com/item-([^.]+).html');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('icson', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.xbase_row3');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'suning.com',
        get_history_url: function() {
            var reg, mess, product_uid, history_url;
            // 真恶心的url设计
            reg = new RegExp('https?://www.suning.com/emall/(.+?).html');
            if (url.match(reg)) {
                mess = url.match(reg)[1].split('_');
                if (mess[0] === 'prd') {
                    product_uid = mess[4];
                }
                else {
                    product_uid = mess[3];
                }
            } else {
                reg = new RegExp('https?://.+\.suning\.com/(\\d+/)?(\\d+).html');
                product_uid = url.match(reg)[2];
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
        domain : 'lusen.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.lusen.com/Product/ProductInfo.aspx\\?Id=(\\d+)');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('lusen', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.goodsBox .right');
            insertAfter(image_node, place_node);
        }
    }, {
        domain : 'efeihu.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.efeihu.com/Product/(\\d+?)\.html');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('efeihu', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.vi_choose');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'tao3c.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.tao3c.com/product/(\\d+).html');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('tao3c', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.detail_info_rm3');
            insertAfter(image_node, place_node);
        }
    }, {
        domain : 'coo8.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.coo8.com/product/(\\d\+)\.html');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('coo8', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('ul[class="c8-ulbox"]');
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
    }, {
        // 又是照抄上面
        domain : '1mall.com',
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
    }, {
        domain : 'ouku.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.ouku.com/goods(\\d+)');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('ouku', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.celldetail_contright_xinde1');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'redbaby.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.redbaby.com.cn/\\w\+/\\d\{7}(\\d+?)\.html');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('redbaby', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.productRightBase');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'cn.strawberrynet.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://cn.strawberrynet.com/a/b/c/(\\d+?)/');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('strawberry', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.white_bg.product .fright');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'sasa.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://web1.sasa.com/SasaWeb/sch/product/viewProductDetail.jspa\\?itemno=(\\d+)');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('sasa', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('table[itemtype]');
            insertAfter(image_node, place_node);
        }
    }, {
        domain : 'bookschina.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.bookschina.com/(\\d+).htm');
            product_uid = url.match(reg)[1];
            history_url = create_book_history_url('bookschina', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelectorAll('.float98')[1];
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'wl.cn',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.wl.cn/(\\d+)/?');
            product_uid = url.match(reg)[1];
            history_url = create_book_history_url('wl', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.pro.layout.blankbtm');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'china-pub.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://product.china-pub.com/(\\d+)');
            product_uid = url.match(reg)[1];
            history_url = create_book_history_url('chinapub', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.buybook');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'winxuan.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.winxuan.com/product/(\\d+)');
            product_uid = url.match(reg)[1];
            history_url = create_book_history_url('wenxuan', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.goods_info');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : '99read.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.99read.com/[pP]roduct/(\\d+).aspx');
            product_uid = url.match(reg)[1];
            history_url = create_book_history_url('99read', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelectorAll('.NeiRongA-box')[1];
            place_node.parentNode.insertBefore(image_node, place_node.previousElementSibling);
        }
    }, {
        domain : 'new7.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://www.new7.com/product/(\\d+).html');
            product_uid = url.match(reg)[1];
            history_url = create_product_history_url('all3c', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('.buy');
            place_node.parentNode.insertBefore(image_node, place_node.nextElementSibling);
        }
    }, {
        domain : 'bookuu.com',
        get_history_url: function() {
            var reg, product_uid, history_url;
            reg = new RegExp('http://detail.bookuu.com/(\\d\+)\.html');
            product_uid = url.match(reg)[1];
            history_url = create_book_history_url('bookuu', product_uid);
            return history_url;
        },
        request_callback: function(response) {
            var image_node, place_node;
            image_node = create_history_image_node(response);
            place_node = document.querySelector('#rightcontent .desc');
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
        if (url.indexOf(sites[i].domain) !== -1) {
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
        //console.log("mmmApiUrl:", url);
        var dt, cp, ttl, mmmVerify = false;
        var mmmUA = "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";
        var isJson = true;
        if (url.match("/m/disSitePro.aspx")) {
            isJson = false;
        }

        XHR({url:url, isjson: isJson, headers: {"User-Agent": mmmUA, Referer: 'https://tool.manmanbuy.com'}}).then(r=> {
            if (isJson) {
                if (r.ok == 1 && r.zklist && r.zklist.length > 0) {
                    var d = r.zklist[0];
                    dt = new Date(Number(d.dt.match(/\d+/)[0])).toLocaleDateString('zh-CN');
                    cp = d.currentprice;
                    ttl = (d.TJYY? d.TJYY : '') + (d.spprice? d.spprice : '');
                } else if (r.datePrice) {
                    dt = eval("new " + r.lowerDate.replaceAll("/", "")).toLocaleDateString('zh-CN');
                    cp = r.lowerPrice;
                }
            } else {
                var mmdata = r.match(/<script type=\"text\/javascript\">\s+\$\(document\)\.ready\(function[^\[]+(\[.+\])\'/);
                if (mmdata) {
                    var mmArr = JSON.parse('['+mmdata[1]+']');
                    var mds = mmArr.sort((a,b)=>a[1]>b[1]);
                    var md = mds[0];
                    dt = new Date(md[0]).toLocaleDateString('zh-CN');
                    cp = md[1];
                    ttl = md[2];
                } else {
                    mmmVerify = true;
                }
            }

            var c = document.createElement("canvas");
            c.width = 630;
            c.height = 25;
            var ctx = c.getContext('2d');
            ctx.font = "16px 微软雅黑";
            var tt = `慢慢买最低价格日期:${dt}，最低价格:`;
            ctx.fillText(tt, 10, 20);
            if (cp) {
                var w = ctx.measureText(tt).width;
                ctx.fillStyle = 'red';
                ctx.fillText(`￥${cp}`, 10 + w, 20);
            }
            if (mmmVerify) {
                var f = document.createElement("iframe");
                f.src = mmmVerifyUrl;
                f.style = 'width:1px; height:1px;visibility: hidden;';
                var fi = setInterval(()=> {
                    if (GM_getValue("mmmCookieSet")) {
                        GM_setValue("mmmCookieSet", false);
                        clearInterval(fi);
                        f.remove();
                        useMmmData(imgNode, url, type)
                    }
                }, 1000);
                imgNode.parentNode.insertBefore(f, imgNode);
                tt = '慢慢买需要验证！';
            } else {
                var a = document.createElement("a");
                c.title = ttl;
                a.appendChild(c);
                a.href = 'https://tool.manmanbuy.com/HistoryLowest.aspx?url=' + encodeURIComponent(location.href);
                a.target = "_blank";
                imgNode.parentNode.insertBefore(a, imgNode);
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
        var minPriceStr = "购物党一年内最低标价:￥", minPriceDateStr = "最低标价日期:";
        var minGetPriceStr = "，折后最低价:", minGetPriceDateStr = "，折后最低价日期:", mgp;
        var gwdPage = "https://www.gwdang.com/trend?url="  + encodeURIComponent(location.href);
        var gvurl = 'https://www.gwdang.com/trend/' + gwdPUid + '.html?static=true&time=' + Math.floor(Date.now()/1000);
        var setPrice = obj => {
            var tt, dateFrom, minPrice, minGetPrice, tt2, minST, minPST, vfUrl;
            if (obj.is_ban == 1 || (obj.series && obj.series[0].min == 91100)) {
                if (type == 'banRetry') {
                    return;
                }
                tt = "购物党需要验证，正在进行验证！";

                var f = document.createElement('iframe');
                f.style = 'width:320px; height:256px;';
                f.src = a.href;
                // f.style = 'width:1px; height:1px;visibility: hidden;';
                f.onload = ()=> {
                    setTimeout(()=>{
                        f.remove();
                        // a.remove();
                        useGwdData(imgNode, url, 'banRetry');
                    }, 2e3);
                    // var ci = setInterval(()=>{
                    //     if (GM_getValue("gwdCookieSet")) {
                    //         clearInterval(ci);
                    //         GM_setValue("gwdCookieSet", false);
                    //         f.remove();
                    //         a.remove();
                    //         useGwdData(imgNode, url, type);
                    //     }
                    // }, 1000);
                };
                //imgNode.parentNode.insertBefore(f, imgNode);


            } else if (url.match(/browser\.gwdang\.com\/extension\/price_towards/)) {
                dateFrom = new Date(obj.store[0].all_line_begin_time).toISOString().split("T")[0];
                minPrice = obj.store[0].lowest;
                minGetPrice = obj.store[1].lowest;
                //tt = dateFrom + minPriceStr + minPrice + minGetPriceStr + minGetPrice;
                tt = minPriceStr + minPrice + minGetPriceStr;
                mgp = minGetPrice;
            } else if (url.match(/gwdang\.com\/trend\/data_www|m\.gwdang\.com\/mapp/) && obj.series[0]) {
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
            } else {
                tt = '抱歉，该商品暂无比价结果~';
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
            imgNode.parentNode.insertBefore(a, imgNode);
        };
        //console.log(url);
        var banRetry = false;
        var fp = randomString(32);
        var dfp = randomString(60);
        var getPrice = () => {
            var hd = {Referer: 'https://www.gwdang.com/', 'Cookie': `fp=${fp};dfp=${dfp};`, Accept: 'application/json, text/javascript, */*', Pragma: 'no-cache', 'Cache-Control': 'no-cache', 'authority':'www.gwdang.com'};
            GM_xmlhttpRequest({
                method: 'GET',
                headers: hd,
                url: url,
                // timeout: 5000,
                onload: function(resp) {
                    var obj = JSON.parse(resp.responseText.replace(/^\(|\)$/g, ""));//alert(obj.dp_id)
                    if (obj.is_ban == 1 && banRetry == false) {
                        banRetry = true;
                        // var gvurl = 'https://www.gwdang.com/trend/' + gwdPUid + '.html?static=true&time=' + Math.floor(Date.now()/1000);
                        console.log('gvurl:', gvurl);
                        a.href = gvurl;
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

        getPrice();

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

    function XHR(req) {
        var details = {};
        var method = (req.finalUrl)? "HEAD" : req.method || "GET";
        var isjson = req.isjson || false;
        var rspt = req.responseType;
        details.url = req.url;
        details.method = method;
        if (req.headers) details.headers = req.headers;
        if (req.data) details.data = req.data;
        if (rspt) details.responseType = rspt;
        if (req.synchronous === true) details.synchronous = true;

        return new Promise((resolve, reject) => {
            details.onload = e =>{
                try {resolve((method=='HEAD')? ((req.finalUrl)? e.finalUrl : e.responseHeaders) : ((isjson)? JSON.parse(e.responseText) : ((rspt)? e.response : e.responseText)))}
                catch(e){ reject('XHR error'); }
            };
            GM_xmlhttpRequest(details);
        });
    }
});
