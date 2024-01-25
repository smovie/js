//https://cdn.jsdelivr.net/gh/smovie/js@main/util.js
//https://github.com/smovie/js/blob/main/util.js

// param t is second, not Millisecond 
function formatTime(t) {
    var hours   = Math.floor(t / 3600);
    var minutes = Math.floor((t - (hours * 3600)) / 60);
    var seconds = Math.floor(t - (hours * 3600) - (minutes * 60));
    if (hours   < 10 && hours > 0) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return (hours==0)?  minutes+' : '+seconds : hours+' : '+minutes+' : '+seconds;
}
function isTextNode(n) {
    return n.localName == "textarea" || (n.localName == "input" && (n.type == "text" || n.type == "password") || n.contentEditable == 'true');
}
function $(css, dom) {
    return dom? dom.querySelector(css) : document.querySelector(css);
}
function $All(css, dom) {
    return dom? dom.querySelectorAll(css) : document.querySelectorAll(css);
}
function $C(name, attrs) {
    var n = document.createElement(name);
    attrs && Object.keys(attrs).forEach(k=>n.setAttribute(k, attrs[k]));
    return n;
}
function $CS(str) { //create node from string
    var n = $C('div');
    n.innerHTML = str.trim();
    return n.firstChild;
}
// param req default value: 
// {url: URL, method: 'GET', finalUrl: 'false', isjson: 'false', responseType:'text',headers:Headers, data: PostData}
// only url is Required
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
    if (typeof req.timeout == "number" && req.timeout > 0) {
        details.timeout = req.timeout;
    }

    return new Promise((resolve, reject) => {
        details.onload = e =>{
            try {resolve((method=='HEAD')? ((req.finalUrl)? e.finalUrl : e.responseHeaders) : ((isjson)? JSON.parse(e.responseText) : ((rspt)? e.response : e.responseText)))}
            catch(e){ reject('XHR error'); }
        };
        if (details.timeout) {
            details.ontimeout = e => {
                resolve('XHR TIMEOUT');
            };
        }
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
//req default value: 
//{selector: Selector, callback: Callback, waitOnce: true, interval: 300, maxIntervals: MaxIntervals, onlyFirstNdoe: false}
// selector and callback is Required
function waitForElements(req) {
    var selector = req.selector;
    var callback = req.callback;
    var waitOnce = req.waitOnce || true;
    var interval = req.interval || 300;
    var maxIntervals = req.maxIntervals || -1;
    var onlyFirstNdoe = req.onlyFirstNdoe || false;
    var targetNodes = (selector === "function")? selector() : $All(selector);
    var targetsFound = targetNodes && targetNodes.length > 0;
    if (targetsFound) {
        for (let targetNode of targetNodes) {
            var attrAlreadyFound = "data-userscript-alreadyFound";
            var alreadyFound = targetNode.getAttribute(attrAlreadyFound) || false;
            if (!alreadyFound) {
                var cancelFound = callback(targetNode);
                if (cancelFound) {
                    targetsFound = false;
                } else {
                    targetNode.setAttribute(attrAlreadyFound, true);
                }
                if (onlyFirstNdoe) {
                    break;
                }
            }
        }
    }

    if (maxIntervals !== 0 && !(targetsFound && waitOnce)) {
        maxIntervals -= 1;
        setTimeout(function() {
            waitForElements(req);
        }, interval);
    }

}
