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