// ==UserScript==
// @name         Google Search Language Select
// @namespace    abs
// @description  You can select language.
// @include      /https?:\/\/www\.google\.[\w]{2,3}(\.[\w]{2,3})?\/((search|webhp).+|$)/
// @include      https://encrypted.google.com/*
// @grant        GM_addStyle
// @version      1.2.2
// ==/UserScript==

(function(){
    //show image size
    GM_addStyle(".isv-r.PNCib.BUooTd::after {  content: attr(data-ow)'x'attr(data-oh); font-size: 12px; float: right;  position: inherit;  background: rgba(128, 128, 128, .2); bottom: 60px;text-shadow: 1px 1px black; } .bRMDJf {background: none !important;} .bRMDJf img {position:relative; z-index:-1;}");
    GM_addStyle('.gtlss_ww_dark {background:#202124; color:#ddd;} #tn_1 {text-align: left;} .qcTKEe .D0HoIc{justify-content: flex-start;} #hdtbMenus {display: inline-flex;}');

    var isDarkMode = false;
    if (document.querySelector('[data-darkmode="true"]')) {
        isDarkMode = true;
    }
    defaultShowSearchToolbar();
    convertUnit();
	var fms = document.getElementsByTagName("form");
	for (i in fms){
		fms[i].onsubmit = "return q.value!=''";
	}
	var W = (typeof(unsafeWindow) != 'undefined') ? unsafeWindow: window;
	var GOOGLE = W.google;
	var HL = (GOOGLE) && GOOGLE.kHL || (/\?hl=ja&?/.test(location.href)) && 'zh-CN' || 'en';

	var FORM = document.getElementById('tsf') || document.getElementById('gbqf');
	var pointN = document.querySelector('.A8SBwf') || document.querySelector('div[jsmodel="vWNDde"]') || document.querySelector('#gbqfbw') || document.querySelector('#sbtc') || document.querySelector('.SSBXXc');
	var POINT = document.querySelector('#sftab');
	POINT = POINT && POINT.nextSibling || null;
    var table = (FORM)? FORM.querySelector('table .lst-td') : null;
    GM_addStyle(".minidiv #gtlss_ww {height: 32px !important;}");

	var GoogleSearch = {
		init: function(){
			var lsbb = document.querySelectorAll('div.ds > div.lsbb')[0];
			if(lsbb){
				lsbb.style.borderLeft = '1px solid #CCCCCC';
			}

			this.language();
		},

		language: function(){
			var langs = (HL === 'ja') && {
					'すべての言語'	: '',
					'英語'			: 'lang_en',
					'日本語'			: 'lang_ja',
//					'スペイン語'		: 'lang_es',
//					'ポルトガル語'		: 'lang_pt',
//					'フランス語'		: 'lang_fr',
//					'イタリア語'		: 'lang_it',
//					'ドイツ語'		: 'lang_de',
//					'ロシア語'		: 'lang_ru',
					'中国語': 'lang_zh-CN|lang_zh-TW',
					'中国語 簡体'	: 'lang_zh-CN',
					'中国語 繁体'	: 'lang_zh-TW',
					'韓国語'			: 'lang_ko'
//					'アラビア語'		: 'lang_ar',
//					'クロアチア語'		: 'lang_hr',
//					'オランダ語'		: 'lang_nl',
//					'スウェーデン語'	: 'lang_sv',
//					'デンマーク語'		: 'lang_da'
				}|| (HL === 'zh-CN') && {
					'任何语言' : '',
					'英文': 'lang_en',
					'简体中文': 'lang_zh-CN',
					'繁体中文': 'lang_zh-TW',
					'日文': 'lang_ja',
					'韩国语': 'lang_ko'
				}
				|| (HL === 'zh-TW') && {
					'任何語言' : '',
					'英文': 'lang_en',
					'簡體中文': 'lang_zh-CN',
					'正體中文': 'lang_zh-TW',
					'日文': 'lang_ja',
					'韓国語': 'lang_ko'
				}
			   || {
					'Language'			: '',
					'English'				: 'lang_en',
//					'Spanish'				: 'lang_es',
//					'Portuguese'			: 'lang_pt',
//					'French'				: 'lang_fr',
//					'Italian'				: 'lang_it',
//					'German'				: 'lang_de',
//					'Russian'				: 'lang_ru',
					'中文': 'lang_zh-CN|lang_zh-TW',
					'简体中文'	: 'lang_zh-CN',
					'繁体中文'	: 'lang_zh-TW',
                    'Japanese'				: 'lang_ja',
					'Korean'				: 'lang_ko'
//					'Arabic'				: 'lang_ar',
//					'Croatian'				: 'lang_hr',
//					'Dutch'					: 'lang_nl',
//					'Swedish'				: 'lang_sv',
//					'Danish'				: 'lang_da'
				};

			var lrs = document.getElementsByName('lr');
			var lrValue = "";
			if (lrs != null && lrs.length > 0) lrValue = lrs[0].value;

			var inpt = document.createElement("input");
			inpt.setAttribute("type", "text");
			inpt.setAttribute("name", "filter");
			inpt.setAttribute("value", "0");
			inpt.setAttribute("style", "display:none;");
			//FORM.appendChild(inpt); // has bug for submit

			var select = document.createElement('select');
			select.setAttribute('type','SELECT');
			select.setAttribute('name', 'lr');
			select.setAttribute('id', 'gtlss_ww');
			if (isDarkMode) {
                select.className = 'gtlss_ww_dark';
            }

			var options = '';
			for(var i in langs){
				var lang = langs[i];
				if (lang == lrValue)
					options += '<option value="'+lang+'" selected>'+i+'</option>';
				else
					options += '<option value="'+lang+'">'+i+'</option>';
			};
			select.innerHTML = options;
			select.addEventListener('change',function(evt){
				//var target = evt.target;
				//if(!target.value)  return;
				//var lrs = document.getElementsByName('lr');
				//for(var i=0,l=lrs.length;i<l;i++){
				//	var lr = lrs[i];
				//	lr.removeAttribute('checked');
				//}
                var lr = document.querySelector('#tophf input[name=lr]');
                if (lr) {
                    lr.remove();
                }
				FORM.submit();
			},false);

			if(POINT && pointN == null || table) {		//for basic version	or hl!=en
				select.setAttribute('style','vertical-align: middle; margin-right: 5px; margin-left: 2px;');
				var td = document.createElement('td');
				td.appendChild(select);
				if (POINT == null) {
						var p = FORM.querySelector(".ds");
						p.parentNode.parentNode.insertBefore(td, p.parentNode);
				} else {
					var point = POINT.nextSibling;
					POINT.parentNode.insertBefore(td,point);
				}
//				var divW = FORM.querySelector(".lst-a");
//				var tdW = FORM.querySelector(".lst-td");
//				divW.style.width = "425px";
//				tdW.style.width = "425px";
				select.classList.add("gsfi");
			}else{
				//var div = document.createElement('div');
				//div.appendChild(select);
				//pointN.parentNode.insertBefore(div,pointN);
				if (pointN) { pointN.appendChild(select); }
				else if (FORM) {FORM.appendChild(select); }

				//div.setAttribute('style', 'position: absolute; right: 0px; top: 0px');
				var st_1 = document.querySelector('#sfdiv');
				var st_2 = document.querySelector('#gbqfq');
                var st_3 = document.querySelector('.A8SBwf'), st_3_1 = document.querySelector('.RNNXgb');
				if (st_1) st_1.style.maxWidth = "488px";
				if (st_2) st_2.style.padding = "1px 0px 0px 0px";
                if (st_3 && st_3_1) {
                    st_3.style.width = st_3_1.style.width = "540px";
                    st_3.style.paddingTop = "0";
                }
				select.classList.add("gbqfif");
			}

			var lrs = document.querySelectorAll("#tsf input[name='lr']");
			if (lrs && lrs.length > 0) {
				for(var i=0,l=lrs.length;i<l;i++){
					try {
						FORM.removeChild(lrs[i]);
					} catch (e) {}
				}
			}

			if (document.querySelector("#sblsbb")) {
			    select.setAttribute('style',"position: absolute; z-index: 7; padding: 0px; outline: medium none; right: 0px; margin-top: -41.5px; margin-right: 70px; height: 39px; vertical-align: middle;");
		    } else if (document.querySelector('.A8SBwf')) {
                select.setAttribute('style',"position: absolute; z-index: 7; padding: 0px; outline: medium none; right: 0px; margin-top: -46px; top: 46px; margin-right: -100px; height: 46px; vertical-align: middle;font-size:14px;");
            } else {
    		    select.setAttribute('style',"position: absolute; z-index: 7; padding: 0px; outline: medium none; right: 0px; margin-top: -46px; margin-right: -90px; height: 46px; vertical-align: middle;");
		    }

            //add image search size choose
            if (location.href.match(/tbm=isch/)) {
                var iPanel = document.querySelector('.ooPrBf');
                var obs = new MutationObserver(function(mutations) {
                    mutations.map(function(m){
                        var al = m.target.querySelector('[aria-label="Any size"]');
                        if (al) {
                            var pn = al.parentNode;
                            //var asz = {"Larger than 400x300": "tbs=isz:lt,islt:qsvga","Larger than 640x480": "tbs=isz:lt,islt:vga","Larger than 800x600": "tbs=isz:lt,islt:svga","Larger than 1024x768": "tbs=isz:lt,islt:xga","Larger than 1600x1200": "tbs=isz:lt,islt:2mp","Larger than 2272x1704": "tbs=isz:lt,islt:4mp"};
                            var asz = {"Larger than 1024x768": "tbs=isz:lt,islt:xga","Larger than 2 MP": "tbs=isz:lt,islt:2mp","Larger than 4 MP": "tbs=isz:lt,islt:4mp"};
                            var cs = ["Larger than 1024x768", "Larger than 2 MP", "Larger than 4 MP"];
                            for (var [key, value] of Object.entries(asz)) {
                                if (pn.querySelector('[aria-label="'+key+'"]')) {
                                    continue;
                                }
                                var a = document.createElement('a');
                                var d = document.createElement('div');
                                var sp = document.createElement('span');
                                sp.className = 'igM9Le';
                                d.className = 'Hm7Qac';
                                a.className = 'MfLWbb';
                                sp.textContent = key;
                                a.href = (location.href.match(/(\&|\?)tbs=/))? location.href.replace(/tbs=[^\&$]+/, value) : location.href + '&' + value;
                                a.setAttribute('aria-label', key);
                                d.appendChild(sp);
                                a.appendChild(d);
                                var ls = pn.querySelectorAll('[aria-label]');
                                var lastIndex = cs.indexOf(ls[ls.length-1].getAttribute('aria-label'));
                                if (cs.indexOf(key) > lastIndex) {
                                    pn.appendChild(a);
                                } else {
                                    pn.insertBefore(a, ls[ls.length-1]);
                                }
                            }
                        }
                    });
                });
                obs.observe(iPanel, {childList: true, subtree: true});
            }
		}
	};

	GoogleSearch.init();

	//Resurrect Google Cache & Related links.  // 2021-09-25 not work any more
	// var c=document.createElement("style");
	// c.setAttribute("type", "text/css");
	// c.appendChild(document.createTextNode("div.action-menu-button {display:none !important;} .action-menu .clickable-dropdown-arrow {display:none !important;} .action-menu-panel, .action-menu-panel ul, .action-menu-item {display:inline-block !important; visibility: visible !important; border:none !important; box-shadow:none !important; background-color:transparent !important; margin:0  !important; padding:0 !important; top:0 !important; height:auto !important; line-height:auto !important;} .action-menu-item a.fl {padding:0 6px !important; display:inline !important;} .action-menu-panel {position:static;} .action-menu-item a.fl:hover {text-decoration:underline !important;}"));
	// document.body.appendChild(c);
    GM_addStyle('.cache {position: absolute; top: 0;right: 0; opacity: 0;} .tF2Cxc:hover .cache {opacity: 1;}');
    var sr = document.querySelectorAll('div.yuRUbf');
    sr.forEach(r=> {
        var h = r.querySelector('a').href;
        var n = document.createElement('a');
        n.setAttribute('target', '_blank');
        n.href='https://webcache.googleusercontent.com/search?q=cache:'+ encodeURIComponent(h);
        r.appendChild(n);
        n.textContent='cache';
        n.className='cache';
    });

})();


function redirectGoogleVerify() {
    var s = "https://ipv4.google.com/sorry/index?continue=";
    if (location.href.indexOf(s) == 0) {
        setTimeout(function() { location.href = decodeURIComponent(location.href.replace(s, "").replace(/&q=.+$/, "")); }, 500);
    }
}

function defaultShowSearchToolbar() {
    var toolbar = document.querySelector("#hdtbMenus");
    var appbar = document.querySelector("#appbar");
    if (toolbar && appbar) {
        toolbar.className = "hdtb-td-o";
        appbar.className = 'appbar hdtb-ab-o';
    } else {
        // toolbar = document.querySelector('.ECgenc');
        // toolbar && toolbar.classList.remove('eLNT1d');
        appbar = document.querySelector('.ZXJQ7c');
        // appbar && appbar.classList.add('XD1Bsc');
        appbar && appbar.click();
    }

}

function convertUnit() {
    var getUnitValue = d => {
        var cm = 0;
        if (d.match(/\d+\′/)) {
            cm += parseInt(d.match(/\d+\′/)[0]) * 30.48;
        }
        if (d.match(/\d+\″/)) {
            cm += parseInt(d.match(/\d+\″/)[0]) / 0.39370;
        }
        return Math.round(cm);
    };
    var ht = document.querySelector('#rhs_block [data-attrid="kc:/people/person:height"] .kno-fv');
    if (ht) {
        var v = getUnitValue(ht.textContent);
        if (v) ht.textContent += ' (' + v + 'cm)';
    }
    var t = document.querySelector('#rso ._tN ._i2g span');
    if (t && t.textContent == 'Height') {
        var h = document.querySelector('#rso ._cFb ._XWk');
        if (h) {
            var v = getUnitValue(h.textContent);
            if (v) h.textContent += ' (' + v + 'cm)';
        }
        var oa = document.querySelectorAll('#rso ._c4 ._aMb');
        oa.forEach(o =>{
            var v = getUnitValue(o.textContent);
            if (v) o.textContent += ' (' + v + 'cm)';
        });
    }
}
