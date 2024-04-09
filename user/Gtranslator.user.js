// ==UserScript==
// @name      Gtranslator
// @version     2.3.7
// @description google翻译及发音
// @note       如果要用HTML5的audio，需发送伪造Referer或者用GM_xmlhttpRequest获取blob
// @include     *
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @run-at      document-start
// ==/UserScript======================================

(function() {
    var translateApi = GM_getValue('api') || 'google'; // google or bing
    var tLastApi;
    var tBorder = {'google': 'gbox_75548', 'bing': 'bbox_75548'};
    var isEn = 0;
    var isTranslating = false;
    var isPageTranslateInit = false;
    var isCssInit = false;
    var isChrome = navigator.userAgent.includes('Chrome');
    var defaultLangFrom = "auto";
    var defaultLangTo = navigator.language || "zh-CN";
    var defaultSpeakLang = "en";
    var speakLangFrom  = "";
    var translatedWord = "";
    var lastWord = "";
    var lastResult = "";
    var lastSpeakWord = "";
    var lastSpeakLang = "";
    var maxGoogleTTSLen = 200; //chinese is half
    var GTDWeb = "https://translate.google.com"; // (navigator.language == "zh-CN")? "https://translate.google.cn" : "https://translate.google.com"; // google translate CN is dead
    var GTD = "https://translate.google.com"; //"https://translate.googleapis.com";
    var TTSD = GTD + "/translate_tts?client=t&ie=UTF-8&client=tw-ob&q=";
    var BTD = 'https://www.bing.com/';
    var langsCode = getLangsCode();
    var TLangFrom = GM_getValue('from') || defaultLangFrom;
    var TLangTo = GM_getValue('to') || defaultLangTo;
    var bingAlliedLangs = {'auto': 'auto-detect', 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant'};
    //var uniqID = 75548; Math.floor(Math.random()*99999);

    document.addEventListener('mouseup', function(event) {
        if ($('body') == null) return; // xml doc
        var word = getSelection(event).trim();
        var gt = $('#gtranslator_75548');
        if(word) {
            isTranslating = false;
            if(!gt) {
                initStyle();
                $('body').insertAdjacentHTML('beforeend', '<gt id="gtranslator_75548"><div id="gbar_75548"><a id="translate_75548"></a><a id="speakFrom_75548"></a><div id="langSelect_75548"><button id="fromlabel_75548">From:</button><select id="langSelectFrom_75548">' +langsCode + '</select><button id="exchange_75548" title="Exchange">To</button><select id="langSelectTo_75548">' +langsCode + '</select></div><a id="speakTo_75548"></a></div><span id="word_75548"></span><div id="gres_75548"></div></gt>');
                gt = $('#gtranslator_75548');
                initEvent();
            }
            $("#translate_75548").title = "Click to translate";
            $("#word_75548").textContent = word.toString();
            $("#gres_75548").textContent = '';
            var top = document.body.scrollTop || document.documentElement.scrollTop;
            var left = document.body.scrollLeft || document.documentElement.scrollLeft;
            var leftPos = event.clientX, topPos = event.clientY, winWidth = window.innerWidth, winHeight = window.innerHeight;
            if (leftPos + 40 > winWidth) {
                gt.style.right = "10px";
            } else if (leftPos < 0) {
                gt.style.left =  left + "px";
            } else {
                gt.style.left = leftPos +left + 'px';
            }
            if (topPos + 60 > winHeight) {
                gt.style.top = topPos - 60 + top + 'px';
            } else if (topPos < 0) {
                gt.style.top = 40 + top + 'px';
            } else {
                gt.style.top = 20 + topPos + top + 'px';
            }
            gt.className = 'hideCom_75548 ' + tBorder[translateApi];
        } else if (gt) {
            gt.className = '';
        }
    }, false);

    function initEvent() {
        $("#gres_75548").onmouseup = function(e) {
            e.preventDefault();
            e.stopPropagation();
        };
        $("#gbar_75548").onmouseup = function(e) {
            e.preventDefault();
            e.stopPropagation();
        };
        $("#translate_75548").onmouseover = function(e) {
            e.preventDefault();
            e.stopPropagation();
        };
        $("#translate_75548").onmouseup = function(e) {
            if (e.button == 0) {
                var word = $('#word_75548').textContent;
                $("#translate_75548").title = "Translating...";
                $("#langSelectFrom_75548").value = TLangFrom;
                $("#langSelectTo_75548").value = TLangTo;
                if (lastWord != word && !isTranslating || tLastApi != translateApi) {
                    isTranslating = true;
                    word = getSelection(e).trim() || word;
                    translate(word, TLangFrom, TLangTo);
                    tLastApi = translateApi;
                }  else if (!isTranslating) {
                    resetPosition();
                    $('#gres_75548').innerHTML = lastResult;
                    showComponents();
                }
                $('#gres_75548').title="Translated by " + translateApi;
            }
            e.preventDefault();
            e.stopPropagation();
        };
        $("#translate_75548").oncontextmenu = function(e) {
            e.preventDefault();
            e.stopPropagation();
            translateApi = (translateApi == 'google')? 'bing' : 'google';
            $('#gtranslator_75548').className = 'hideCom_75548 ' + tBorder[translateApi];
            GM_setValue('api', translateApi);
        };
        $("#langSelectFrom_75548").onchange = function() {
            selectLangChange();
        };
        $("#langSelectTo_75548").onchange = function() {
            selectLangChange();
        };
        $("#exchange_75548").onclick = function() {
	        var langFrom = $("#langSelectFrom_75548").value;
         	var langTo = $("#langSelectTo_75548").value;
         	$("#langSelectFrom_75548").value = langTo;
         	$("#langSelectTo_75548").value = langFrom;
            selectLangChange();
        };
       $("#speakFrom_75548").onmouseup = function() {
            var word = $('#word_75548').textContent;
            speak(word, speakLangFrom);
        };
        $("#speakTo_75548").onmouseup = function() {
            speak(translatedWord, TLangTo);
        };
    }

     function showComponents() {
         $("#gtranslator_75548").className = 'showCom_75548';
         var lsf = $("#langSelectFrom_75548");
         if (lsf.value == "auto") {
              lsf.title = $("#langSelectFrom_75548 option[value='"+ speakLangFrom +"']").textContent;
         }
         var mLink = GTDWeb + "/#" + lsf.value + "/" + $('#langSelectTo_75548').value + "/" + encodeURIComponent($('#word_75548').textContent);
         $("#gres_75548").lastChild.insertAdjacentHTML('beforeend', '<a id="moreDetails_75548" href="' + mLink + '" target="_blank" title="More"></a><a id="ptbtn_75548" href="javascript:void();" title="Page translate"></a>');
         $("#ptbtn_75548").onclick = ()=> {
             if (isPageTranslateInit) {
                 $('.goog-te-gadget-simple').click();
             } else {
                 addTrans();
             }
         };
     }

     function selectLangChange() {
         var word = $('#word_75548').textContent;
         TLangFrom = $("#langSelectFrom_75548").value;
         TLangTo = $("#langSelectTo_75548").value;
         translate(word, TLangFrom, TLangTo);
         GM_setValue('from', TLangFrom);
         GM_setValue('to', TLangTo);
     }

    function getSelection(evt) {
        var selection = '';
        if (evt == null || evt.target == null) {
            return selection;
        }
        var eventTarget = evt.target ;
        var nodeLocalName = eventTarget.localName.toLowerCase();

        if ((nodeLocalName == "textarea") || (nodeLocalName == "input" && eventTarget.type == "text")) {            // Input or textarea ?
            selection = eventTarget.value.substring(eventTarget.selectionStart, eventTarget.selectionEnd);
        } else { // Text selection.
            selection = window.getSelection().toString();
        }
        return selection;
    }

    function translate(word, from, to) {
        switch(translateApi) {
            case 'google': googleTranslator(word, from, to);break;
            case 'bing': bingTranslator(word, from, to);break;
        }
    }

    function googleTranslator(word, from, to) {
        var tl = isEn ? "en" : "zh-CN";
        var ts = new Date().getTime();
        // var apiUrl = GTD + "/translate_a/t?client=dict-chrome-ex&hl=auto&sl=" + from + "&tl=" + to + "&text=" + encodeURIComponent(word); //old
        var apiUrl = GTD + "/translate_a/single?client=gtx&dt=t&hl=auto&sl=" + from + "&tl=" + to + "&q=" + encodeURIComponent(word);
        XHR({headers: {Referer: GTD}, url : apiUrl, isjson: true}).then(res => {
            $("#word_75548").innerHTML = word.toString();
            var tw = '';
            if (res.sentences) {
                for(let s of res.sentences) {
                    if (s.trans != undefined) {
                        tw += s.trans;
                    }
                }
            } else if (Array.isArray(res)) {
                var tempRes = res[0];
                if (Array.isArray(tempRes)) {
                    for(i=0; i<tempRes.length; i++) {
                        if (tempRes[i].length == 0) {
                            break;
                        } else {
                            tw += tempRes[i][0];
                        }
                    }
                }

                if (res.length > 2 && res[2]) {
                    speakLangFrom = res[2];
                }
            }
            translatedWord = tw;
            var result = ["<span class='resultTitle_75548'>", tw, "</span>"];
            if (res.dict) {
                for(let d of res.dict) {
                    result.push("<div class='result_75548'><span>[", d.pos, ": </span>");
                    for (let i = 0; i < d.terms.length; i++) {
                        result.push("<span title='");
                        if (d.entry[i] && d.entry[i].reverse_translation) {
                            result.push(d.entry[i].reverse_translation.join(', '));
                        }
                        result.push("'>", d.terms[i]);
                        result.push((i == d.terms.length - 1)? "</span>" : ", </span>");
                    }
                    result.push("]</div>");
                }
            }
            if (res.src != undefined) {
                speakLangFrom = res.src;
            }
            lastWord = word;
            lastResult = result.join('');
            $("#gres_75548").innerHTML = lastResult;
            showComponents();
            resetPosition();
            console.log("Translate request cost: ", new Date().getTime() - ts, "ms");
        });
        //dict  http://www.google.com/dictionary/json?callback=dict_api.callbacks.id100&q={0}&sl=en&tl=en
    }

    function speak(word, speakLang) {
        if (speakLang == null || speakLang == "" || speakLang  == "auto" || speakLang  == "ms") {
            speakLang  = defaultSpeakLang;
        }
        var fw = formatWord(word);
        if (fw.length > 1) {
            var ttsLink = TTSD + encodeURIComponent(fw[1]) + "&tl=" + speakLang;
            var na = $('#nextHTML5Audio1_75548');
            if (!na) {
                na = document.createElement("audio");
                na.setAttribute("id", "nextHTML5Audio1");
                na.setAttribute("preload", "auto");
                document.body.appendChild(na);
            }
            XHR({url: ttsLink, headers: {Referer: ttsLink}, responseType: 'blob'}).then(r => {
                var blob = new Blob([r], {type: 'audio/mpeg'});
                na.src = window.URL.createObjectURL(blob);
            });
            if (fw.length >2) {
                var na2 = $('#nextHTML5Audio2_75548');
                if (na2 == null) {
                    na2 = document.createElement("audio");
                    na2.setAttribute("id", "nextHTML5Audio2");
                    na2.setAttribute("preload", "auto");
                    document.body.appendChild(na2);
                }
            }
        }
        switch(translateApi) {
            case 'google':speakWord(fw, speakLang);break;
            case 'bing': bTTSSpeak(word, speakLang);break;
        }
    }

    function speakWord(fw, speakLang) {
        var word = fw[0];
        var ttsLink = TTSD + encodeURIComponent(word) + "&tl=" + speakLang;
        var sa = $("#HTML5Audio");
        if (!sa) {
            sa = document.createElement("audio");
            sa.setAttribute("id", "HTML5Audio");
            document.body.appendChild(sa);
        }
        var noscript = $("a#speakAudio.__noscriptPlaceholder__.__noscriptObjectPatchMe__");
        if (noscript) {
            noscript.parentNode.removeChild(noscript);
            alert("Speaker blocked by Noscript");
        } else {
            if (word != lastSpeakWord || speakLang != lastSpeakLang || !sa.src) {
                XHR({url: ttsLink, headers: {Referer: ttsLink}, responseType: 'blob'}).then(r => {
                    var blob = new Blob([r], {type: 'audio/mpeg'});
                    sa.src = window.URL.createObjectURL(blob);
                    try {
                    	sa.onerror = function(e){
                        	console.log(e);
                        	var ha=$("#HTML5Audio");
                        	ha.parentNode.removeChild(ha);
                        };
                    	sa.onended = function(){
                        	fw.shift();
                        	if(fw.length>0){
                            	speakNextWord(fw, speakLang, 'nextHTML5Audio1');
                        	}
                        };
                	} catch(e) {
            	    	console.log(e);
                	}
                    sa.load();
                    sa.play();
                });
            } else {
                sa.load();
                sa.play();
            }
        }
        lastSpeakWord = word;
        lastSpeakLang = speakLang;
    }

    function speakNextWord(fw, speakLang, nextId) {
        var nextAudio = $('#'+nextId);
        var ni = (nextId == 'nextHTML5Audio1')? 'nextHTML5Audio2' : 'nextHTML5Audio1';
        if (fw.length > 1) {
            var ttsLink = TTSD + encodeURIComponent(fw[1]) + "&tl=" + speakLang;
            XHR({url: ttsLink, headers: {Referer: ttsLink}, responseType: 'blob'}).then(r => {
                var blob = new Blob([r], {type: 'audio/mpeg'});
                $('#'+ni).src = window.URL.createObjectURL(blob);
                nextAudio.load();
                nextAudio.play();
            });
        }
        nextAudio.onended = function() {
            fw.shift();
            if (fw.length > 0) {
                speakNextWord(fw, speakLang, ni);
            }
        };
        nextAudio.load();
        nextAudio.play();
    }

    function formatWord(word) {
        var wordLen = getWordLength(word);
        var fw = [];
        if (wordLen > maxGoogleTTSLen) {
            var index = 0;
            var totalLen = 0;
            var tokens = word.replace(/([^\x00-\xff])/g,' $1 ').replace(/\s+/ig,' ').replace(/^ */,'').replace(/ *$/,'').split(' ');
            fw[index] = '';
            for(var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                var len = getWordLength(token);
                if(totalLen + len + 1 > maxGoogleTTSLen) {
                    totalLen = 0;
                    fw[index] = fw[index].trim();
                    fw[++index] = '';
                }
                fw[index] += (token.length==len)? token + " " : token;
                totalLen += (token.length==len)? len + 1 : len;
            }
        } else {
            fw[0] = word;
        }
        return fw;
    }

    function resetPosition() {
    	var top = document.body.scrollTop || document.documentElement.scrollTop;
    	var left = document.body.scrollLeft || document.documentElement.scrollLeft;
    	var winWidth = window.innerWidth, winHeight = window.innerHeight;
        var gT = $("#gtranslator_75548");
        var leftPos = parseInt(gT.style.left.replace(/\D+/g,""));
        var topPos = parseInt(gT.style.top.replace(/\D+/g,""));
        if (leftPos - left + 280 > winWidth) {gT.style.left = "auto"; gT.style.right = "10px";}
    }

    function getWordLength(str) {
        var len = str.length;
        var reLen = 0;
        for (var i = 0; i < len; i++) {
            if (str.charCodeAt(i) < 27 || str.charCodeAt(i) > 126) {
                // 全角
                reLen += 2;
            } else {
                reLen++;
            }
        }
        return reLen;
    }

    function getLangsCode() {
        var lc = '';
        var langs = {'auto': 'Auto','en': 'English','zh-CN': 'Chinese (S)','zh-TW': 'Chinese (T)','ja': 'Japanese','af': 'Afrikaans','sq': 'Albanian','am': 'Amharic','ar': 'Arabic','hy': 'Armenian','as': 'Assamese','ay': 'Aymara','az': 'Azerbaijani','bm': 'Bambara','eu': 'Basque','be': 'Belarusian','bn': 'Bengali','bho': 'Bhojpuri','bs': 'Bosnian','bg': 'Bulgarian','ca': 'Catalan','ceb': 'Cebuano','ny': 'Chichewa','co': 'Corsican','hr': 'Croatian','cs': 'Czech','da': 'Danish','dv': 'Dhivehi','doi': 'Dogri','nl': 'Dutch','eo': 'Esperanto','et': 'Estonian','ee': 'Ewe','tl': 'Filipino','fi': 'Finnish','fr': 'French','fy': 'Frisian','gl': 'Galician','ka': 'Georgian','de': 'German','el': 'Greek','gn': 'Guarani','gu': 'Gujarati','ht': 'Haitian Creole','ha': 'Hausa','haw': 'Hawaiian','iw': 'Hebrew','hi': 'Hindi','hmn': 'Hmong','hu': 'Hungarian','is': 'Icelandic','ig': 'Igbo','ilo': 'Ilocano','id': 'Indonesian','ga': 'Irish','it': 'Italian','jw': 'Javanese','kn': 'Kannada','kk': 'Kazakh','km': 'Khmer','rw': 'Kinyarwanda','gom': 'Konkani','ko': 'Korean','kri': 'Krio','ku': 'Kurdish (K)','ckb': 'Kurdish (S)','ky': 'Kyrgyz','lo': 'Lao','la': 'Latin','lv': 'Latvian','ln': 'Lingala','lt': 'Lithuanian','lg': 'Luganda','lb': 'Luxembourgish','mk': 'Macedonian','mai': 'Maithili','mg': 'Malagasy','ms': 'Malay','ml': 'Malayalam','mt': 'Maltese','mi': 'Maori','mr': 'Marathi','mni-Mtei': 'Meiteilon (M)','lus': 'Mizo','mn': 'Mongolian','my': 'Myanmar (B)','ne': 'Nepali','no': 'Norwegian','or': 'Odia (Oriya)','om': 'Oromo','ps': 'Pashto','fa': 'Persian','pl': 'Polish','pt': 'Portuguese','pa': 'Punjabi','qu': 'Quechua','ro': 'Romanian','ru': 'Russian','sm': 'Samoan','sa': 'Sanskrit','gd': 'Scots Gaelic','nso': 'Sepedi','sr': 'Serbian','st': 'Sesotho','sn': 'Shona','sd': 'Sindhi','si': 'Sinhala','sk': 'Slovak','sl': 'Slovenian','so': 'Somali','es': 'Spanish','su': 'Sundanese','sw': 'Swahili','sv': 'Swedish','tg': 'Tajik','ta': 'Tamil','tt': 'Tatar','te': 'Telugu','th': 'Thai','ti': 'Tigrinya','ts': 'Tsonga','tr': 'Turkish','tk': 'Turkmen','ak': 'Twi','uk': 'Ukrainian','ur': 'Urdu','ug': 'Uyghur','uz': 'Uzbek','vi': 'Vietnamese','cy': 'Welsh','xh': 'Xhosa','yi': 'Yiddish','yo': 'Yoruba','zu': 'Zulu'};
       //'bing' : {'auto-detect':'Auto','en': 'English','zh-Hans': 'Chinese Simplified','zh-Hant': 'Chinese Traditional','af': 'Afrikaans','sq': 'Albanian','am': 'Amharic','ar': 'Arabic','hy': 'Armenian','as': 'Assamese','az': 'Azerbaijani','bn': 'Bangla','ba': 'Bashkir','eu': 'Basque','bs': 'Bosnian','bg': 'Bulgarian','yue': 'Cantonese (Traditional)','ca': 'Catalan','lzh': 'Chinese (Literary)','hr': 'Croatian','cs': 'Czech','da': 'Danish','prs': 'Dari','dv': 'Divehi','nl': 'Dutch','et': 'Estonian','fo': 'Faroese','fj': 'Fijian','fil': 'Filipino','fi': 'Finnish','fr': 'French','fr-CA': 'French (Canada)','gl': 'Galician','ka': 'Georgian','de': 'German','el': 'Greek','gu': 'Gujarati','ht': 'Haitian Creole','he': 'Hebrew','hi': 'Hindi','mww': 'Hmong Daw','hu': 'Hungarian','is': 'Icelandic','id': 'Indonesian','ikt': 'Inuinnaqtun','iu': 'Inuktitut','iu-Latn': 'Inuktitut (Latin)','ga': 'Irish','it': 'Italian','ja': 'Japanese','kn': 'Kannada','kk': 'Kazakh','km': 'Khmer','tlh-Latn': 'Klingon (Latin)','ko': 'Korean','ku': 'Kurdish (Central)','kmr': 'Kurdish (Northern)','ky': 'Kyrgyz','lo': 'Lao','lv': 'Latvian','lt': 'Lithuanian','mk': 'Macedonian','mg': 'Malagasy','ms': 'Malay','ml': 'Malayalam','mt': 'Maltese','mr': 'Marathi','mn-Cyrl': 'Mongolian (Cyrillic)','mn-Mong': 'Mongolian (Traditional)','my': 'Myanmar (Burmese)','mi': 'Māori','ne': 'Nepali','nb': 'Norwegian','or': 'Odia','ps': 'Pashto','fa': 'Persian','pl': 'Polish','pt': 'Portuguese (Brazil)','pt-PT': 'Portuguese (Portugal)','pa': 'Punjabi','otq': 'Querétaro Otomi','ro': 'Romanian','ru': 'Russian','sm': 'Samoan','sr-Cyrl': 'Serbian (Cyrillic)','sr-Latn': 'Serbian (Latin)','sk': 'Slovak','sl': 'Slovenian','so': 'Somali','es': 'Spanish','sw': 'Swahili','sv': 'Swedish','ty': 'Tahitian','ta': 'Tamil','tt': 'Tatar','te': 'Telugu','th': 'Thai','bo': 'Tibetan','ti': 'Tigrinya','to': 'Tongan','tr': 'Turkish','tk': 'Turkmen','uk': 'Ukrainian','hsb': 'Upper Sorbian','ur': 'Urdu','ug': 'Uyghur','uz': 'Uzbek (Latin)','vi': 'Vietnamese','cy': 'Welsh','yua': 'Yucatec Maya','zu': 'Zulu'};
        if (!langs[defaultLangTo]) {
            var l = defaultLangTo.split('-')[0];
            if (langs[l]) {
                defaultLangTo = l;
            }
        }
        for (var k in langs) {
            lc += '<option value="'+ k + '">' + langs[k] +'</option>';
        }
        return lc;
    }

    var bHeader = {'credentials': 'include', 'mode': 'cors','User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41','Accept': '*/*','Accept-Language': 'en-US','Content-type': 'application/x-www-form-urlencoded','Sec-Fetch-Dest': 'empty','Sec-Fetch-Mode': 'cors','Sec-Fetch-Site': 'same-origin','x-forwarded-for': '8.8.8.8','Pragma': 'no-cache','Cache-Control': 'no-cache','referrer': BTD};

    function bingTranslator(word, from, to) {
        var bToken = GM_getValue('bToken');
        var bKey = GM_getValue('bKey');
        var bTokenExp = GM_getValue('bTokenExp');
        if (!bToken || Date.now() - bKey > bTokenExp) {
            XHR({url:"https://www.bing.com/translator"}).then(r=>{
                var j = JSON.parse(r.match(/params_AbusePreventionHelper\s?=\s?([^\]]+\])/)[1]);
                GM_setValue('bToken', j[1]);
                GM_setValue('bKey', j[0]);
                GM_setValue('bTokenExp', j[2]);
                getBingData(word, from, to);
            });
        } else {
            getBingData(word, from, to);
        }
    }

    function getBingData(word, from, to) {
        from = bingAlliedLangs[from];
        to = bingAlliedLangs[to];
        XHR({url: "https://www.bing.com/ttranslatev3?IG=14C8373824954B109797068C0C915CEA&IID=translator.5023.3",
            "headers": bHeader,
            "data": `&fromLang=${from}&text=${word}&to=${to}&token=${GM_getValue('bToken')}&key=${GM_getValue('bKey')}`,
            "method": "POST", isjson: true
        }).then(r => {
            $("#word_75548").innerHTML = word.toString();
            var dLang = r[0].detectedLanguage.language;
            speakLangFrom = bingAlliedLangs[dLang] || dLang;
            translatedWord = r[0].translations[0].text;
            lastWord = word;
            lastResult = "<span class='resultTitle_75548'>" + translatedWord + "</span>";
            $("#gres_75548").innerHTML = lastResult;
            showComponents();
            resetPosition();
        });
    }

    function bTTSSpeak(word, speakLang) {
        var sa = $('#HTML5Audio');
        if (word == lastSpeakWord && speakLang == lastSpeakLang && !sa.src) {
            sa.play();
            return;
        }
        var tk = GM_getValue('bTTSToken');
        var tExp = GM_getValue('bTTSExp');
        var tTs = GM_getValue('bTTSTs');
        if (!tk || Date.now() - tTs > tExp) {
            XHR({url:'https://www.bing.com/tfetspktok?isVertical=1&&IG=84AF12D291A345F49ED438E78C5EDA0F&IID=translator.5023.2', method: 'POST', isjson: true,
                "headers": bHeader, data: `&token=${GM_getValue('bToken')}&key=${GM_getValue('bKey')}`
            }).then(r=>{
                console.log('expiryDurationInMS:',r.expiryDurationInMS, 'region:',r.region);
                GM_setValue('bTTSToken', r.token);
                GM_setValue('bTTSExp', r.expiryDurationInMS);
                GM_setValue('bTTSTs', Date.now());
                bTTSLoad(r.token, word, speakLang);
            });
        } else {
            bTTSLoad(tk, word, speakLang);
        }
    }
    function bTTSLoad(token, word, speakLang) {
        var snames = {'en-US': 'en-US-AriaNeural', 'zh-CN': 'zh-CN-XiaoxiaoNeural', 'zh-TW': 'zh-CN-XiaoxiaoNeural'};
        speakLang = (speakLang == 'en')? 'en-US' : speakLang;
        var sname = snames[speakLang] || speakLang;
        XHR({url:"https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1?",
            "headers": { "credentials": "include",
                "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
                "Accept": "*/*",
                "Accept-Language": "zh-CN,en-US;q=0.7,zh;q=0.3",
                "Content-Type": "application/ssml+xml",
                "Authorization": "Bearer " + token,
                "X-MICROSOFT-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
                "cache-control": "no-cache",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "referrer": "https://www.bing.com/",
                "mode": "cors",
                "Pragma": "no-cache"
            },
            "data": `<speak version='1.0' xml:lang='${speakLang}'><voice xml:lang='${speakLang}' xml:gender='Female' name='${sname}'><prosody rate='-20.00%'>${word}</prosody></voice></speak>`,
            "method": "POST",
            "responseType": "blob"
        }).then(r=>{
            var sa = $('#HTML5Audio') || document.createElement("audio");
            sa.setAttribute("id", "HTML5Audio");
            document.body.appendChild(sa);
            var blob = new Blob([r], {type: 'audio/mpeg'});
            sa.src = window.URL.createObjectURL(blob);
            sa.load();
            sa.play();
        });
    }

    function initStyle() {
        if (isCssInit) {
            return;
        }
        var volIcon = isChrome? '1F50A' : '1F509';
        var s = GM_addStyle("\
            #gtranslator_75548{width:20px;display:none;z-index:99999;background:#fff;border-radius: 4px 4px 4px 4px;box-sizing: initial;box-shadow: 1px 1px 6px #000;color:#0B9D96;position:absolute;text-shadow:0 0 1px #FFF;font-size:12px;} \
            #gtranslator_75548, #gtranslator_75548 * {padding:0; margin:0; max-width: 320px} #word_75548 {display:none;} \
            #gtranslator_75548 option {font-size: 12px;} #gtranslator_75548 * {color:black; background:white;} \
            #translate_75548, #gres_75548 {float:left;clear:right;padding: 0;} #translate_75548::before {content: '📚'; font-size:16px;} \
            #translate_75548 {width:16px;height:20px;display:block;font-size: 16px;margin: 0 0 0 1px;opacity:0.8;} \
            .gbox_75548 {border:3px solid;border-color: red deepskyblue green gold;} .bbox_75548 {border:3px solid deepskyblue;} \
            #speakFrom_75548 {width:16px;display:inline-block;display:none;opacity:0.55;} \
            #gtranslator_75548 #speakTo_75548 {width:16px;display:inline-block;display:none;opacity:0.55;float:right;} #langSelect_75548 select {border: 1px solid white;} \
            #speakFrom_75548::before, #speakTo_75548::before {content: '\\" + volIcon + "';} \
            #moreDetails_75548, #ptbtn_75548 {display:inline-block;opacity:0.55;} #moreDetails_75548::before {content: '↗';} #ptbtn_75548::before {content: '📜';font-size:10px;} \
            #gtranslator_75548 #gres_75548 {display:none;margin:2px;background: -moz-linear-gradient(center top , #EBEBEB, #FFFFFF) repeat scroll 0 0 transparent;font-size: 12px; line-height: 16px; width:calc(100% - 4px);max-width: 300px; text-align: left; word-wrap: break-word;} \
            .result_75548 {color: #777777; font-weight: bold;} .result_75548 span:hover {color:black;} .resultTitle_75548 {padding-right:16px;} \
            #gtranslator_75548 a {text-shadow: 1px 1px 1px #CDCDCD;font-size: 14px; font-weight: bold; text-decoration: none; color: #000000; float: left; line-height: 20px;height:20px; text-align: left;cursor:pointer; } \
            #gtranslator_75548 #speakTo_75548:hover, #moreDetails_75548:hover, #ptbtn_75548:hover, #speakFrom_75548:hover, #exchange_75548:hover, #translate_75548:hover {opacity:1;} \
            #exchange_75548 {min-width: 15px; max-width: 20px; background: none repeat scroll 0% 0% #009AFD; color: #FFF; border: 1px solid #1777B7; box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.3) inset, 0px 1px 1px rgba(100, 100, 100, 0.3); border-radius:3px; opacity:0.9;} \
            #langSelect_75548 {display:none;color:black;font-size:12px;max-height:20px;} #nextHTML5Audio1_75548, #nextHTML5Audio2_75548 {visibility:hidden;} \
            #langSelectFrom_75548,#langSelectTo_75548 {width:auto;height:auto;padding:0px;margin:0px;font-size:12px;} \
            #gbar_75548 {width:100%;background: -moz-linear-gradient(center top , #FFF 0%, #F1F1F1 100%) repeat scroll 0 0 transparent;height:20px; border-radius: 4px 4px;} \
            #langSelect_75548 > button {line-height: 1;min-height: 15px;max-height: 20px;font-size: 12px;padding: 0;margin: 0;cursor: pointer;} \
            #fromlabel_75548 {min-width:35px;max-width:40px;border:none;} #fromlabel_75548::-moz-focus-inner {border: 0;} #gtranslator_75548 #moreDetails_75548, #gtranslator_75548 #ptbtn_75548 {height:16px;width:16px;float:right;} \
            .showCom_75548 #translate_75548,.showCom_75548 #word_75548{display:none;} #gtranslator_75548.showCom_75548 #gres_75548 {display:block;} \
            .showCom_75548 #speakFrom_75548, #gtranslator_75548.showCom_75548 #speakTo_75548 {display:inline-block;} .showCom_75548 #langSelect_75548 {display:inline-flex;} \
            #gtranslator_75548.showCom_75548{width:auto;display:block;} .showCom_75548 #gbar_75548{margin:0 2px 0 2px;width:calc(100% - 4px);} \
            #gtranslator_75548.hideCom_75548{width:20px;display:block;} \
        ");

        if (!s.sheet && document.styleSheets[0]) {
            asideAddStyle(s);
        }
        isCssInit = true;
    }

    function asideAddStyle(s) {
        var rs = s.textContent.split('}');
        rs.pop();
        rs.forEach(s=>document.styleSheets[0].insertRule(s+'}'));
    }
    function $(selectors) {
        return document.querySelector(selectors);
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

        return new Promise((resolve, reject) => {
            details.onload = e =>{
                try {resolve((method=='HEAD')? ((req.finalUrl)? e.finalUrl : e.responseHeaders) : ((isjson)? JSON.parse(e.responseText) : ((rspt)? e.response : e.responseText)))}
                catch(e){ reject('XHR error'); }
            };
            GM_xmlhttpRequest(details);
        });
    }

    function addTrans() {
        if (isPageTranslateInit) {
            return;
        }
        isPageTranslateInit = true;
        $('#googlePageTranslate').removeEventListener('mouseover', addTrans);
        var ptApi = GTDWeb + "/translate_a/element.js?cb=googleTranslateElementInit";
        XHR({url: ptApi}).then(r=> {
            var s = document.createElement('script');                 //var js = s.textContent.match(/_loadJs\(b\+\'(\/translate_static\/js\/element\/.+\.js)\'\);/);
            s.textContent = r.replace(/c\._pbi\=b\+\'\/translate_static\/img\/te_bk\.gif\';/, '') //remove background img
            if (navigator.language == "zh-CN") {
                //s.textContent = r.replace('translate-pa.googleapis.com', 'translate-pa.googleapis.cn');
            }
            document.head.appendChild(s);
            s = document.createElement('script');
            s.textContent = 'function googleTranslateElementInit() { new google.translate.TranslateElement({pageLanguage: "auto", layout: google.translate.TranslateElement.InlineLayout.SIMPLE, autoDisplay: false}, "googlePageTranslate"); }' ;
            document.head.appendChild(s);
            //$('#googlePageTranslate').style.opacity = '1';
        });
    }
    function pageTranslateInit() {
        var s = GM_addStyle('#googlePageTranslate {opacity:0;position: fixed;top: 0;left: 0;width: 16px;height: 16px;line-height: initial;overflow: hidden;cursor: pointer;} \
                #googlePageTranslate:hover{opacity:1;} #googlePageTranslate::before {content:"⌛";position: fixed;top: 0;left: 0;font-size: 12px;z-index: -1;} #googlePageTranslate, iframe.skiptranslate { z-index: 9999999999; } \
                .goog-te-gadget-icon{width:16px !important;height:16px !important;margin: -2px 0 0 -2px !important;vertical-align: initial !important;} #googlePageTranslate:hover {opacity:1;}');
        if (!s.sheet && document.styleSheets[0]) {
            asideAddStyle(s);
        }
        document.body.insertAdjacentHTML('afterbegin', '<div id="googlePageTranslate"></div>');
        $('#googlePageTranslate').addEventListener('mouseover', addTrans);
    };
    window.addEventListener('DOMContentLoaded', pageTranslateInit);

})();
