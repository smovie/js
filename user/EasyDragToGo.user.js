// ==UserScript==
// @name        Easy Drag To Go
// @namespace   jerrymouse
// @include     *
// @version     1.4.0
// @grant       GM_setClipboard
// @grant       GM_openInTab
// @run-at      document-start
// ==/UserScript==

(function() {

    const zoomFactor = 5;
    const eDrag = {
        "R": {SE: "https://www.google.com/search?hl=en&safe=off&filter=0&q="},
        "L": {SE: "https://www.google.com/search?hl=en&safe=off&filter=0&tbm=isch&sout=0&tbs=iar:a,imgo:1&q=",
              //SIE: "https://www.google.com/searchbyimage?hl=en&safe=off&image_url="}, //old
             SIE: "https://lens.google.com/uploadbyurl?hl=en&safe=off&url="}, //new
        "D": {SE: "http://127.0.0.1/?search="},
        "U": "COPY"
    };
    const detectTxtorUrlDirection = "R";
    const linkOpenDirection = "R";
    const replaceText = true; // replace selected text in text node when middle click to paste
    const urlRegex = /^\s*(?:(?:(?:ht|f)tps?:\/\/)?(?:(?:[\w-]+?)(?:\.(?:[\w-]+?))*(?:\.(?:[a-zA-Z]{2,5}))|(?:(?:\d+)(?:\.\d+){3}))(?::\d{2,5})?(?:\/\S*|$)|data:text\/[\u0025-\u007a]+)\s*$/;
    var searchEngine = "https://www.google.com/search?hl=en&safe=off&filter=0&q="; // default
    var scrollbarWidth;
	var evts = ["dragstart", "dragover", "drop", "contextmenu", "mousedown", "mouseup", "click", "wheel", "visibilitychange"];
	evts.forEach(function(type) {
		document.addEventListener(type, handle, true);
	});
	window.addEventListener("unload", function() {
		evts.forEach(function(type) {
			document.removeEventListener(type, handle, true);
		});
	}, false);

    function handle(evt) {
        var isImage = evt.target.localName == "img";
        var isLink = evt.target.localName == "a";
        switch (evt.type) {
        case "wheel":
            if (this.rClicked && isImage) {
                evt.preventDefault();
                //evt.stopPropagation();
                this.imgZoom = true;
                var d = (Math.abs(evt.deltaY) > Math.abs(evt.deltaX))? evt.deltaY : evt.deltaX;
                var img = evt.target;
                var zf = (d > 0)? (100 + zoomFactor) : (100 - zoomFactor);
                storeOriginalImgSize(img);
                //console.log("IMG", d, zf, img.width, img.height);
                setImageSize(img, img.width * zf / 100, img.height * zf / 100);
                //console.log("IMG", d, zf, img.width, img.height);
            }
            break;
        case "mousedown":
            if (evt.button == 1 && replaceText) {
                clearSelectedText(evt.target);
            } else if (evt.button == 2) {
                this.rClicked = true;
                if (isImage) {
                    evt.target.addEventListener('wheel', imgWheel, true);
                }
            } else if (evt.button == 0 && this.rClicked && isImage) {
                evt.preventDefault();
                evt.stopPropagation();
            }
            break;
        case "mouseup":
            if (evt.button == 2) {
                this.rClicked = false;
                if (isImage) {
                    evt.target.removeEventListener('wheel', imgWheel, true);
                }
            } else if (this.rClicked && isImage) {
                var img = evt.target;
                if (!scrollbarWidth) {
                    scrollbarWidth = getScrollBarWidth();
                }
                if (evt.button == 0) {  // switch img between original size and full window width&height
                    evt.preventDefault();
                    evt.stopPropagation();
                    if (evt.target.naturalWidth == 0) { // reload broken images
                        revealAllBrokenImgs();
                    } else {
                        this.imgZoom = true;
                        storeOriginalImgSize(img);
                        //var rect = img.getBoundingClientRect();
                        var rect = img.parentNode.getBoundingClientRect();
                        if (img.dataset.imgOriginalWidth != img.width) {
                            restoreOriginalImgSize(img);
                        } else if (img.naturalWidth < img.naturalHeight) {
                            //setImageSize(img, window.innerWidth - rect.left - scrollbarWidth, "auto");
                            // setImageSize(img, window.innerWidth - scrollbarWidth, "auto");
                            setImageSize(img, window.innerWidth - scrollbarWidth - rect.left, "auto");
                        } else {
                            setImageSize(img, "auto", window.innerHeight - scrollbarWidth);
                        }
                    }
                } else if (evt.button == 1) {  // switch img between natural size and full window width&height
                    evt.preventDefault();
                    evt.stopPropagation();
                    this.imgZoom = true;
                    if (img.naturalWidth != img.width) {
                        setImageSize(img, img.naturalWidth, img.naturalHeight);
                    } else if (img.naturalWidth > img.naturalHeight) {
                        setImageSize(img, window.innerWidth - scrollbarWidth, "auto");
                    } else {
                        setImageSize(img, "auto", window.innerHeight - scrollbarWidth);
                    }
                }
            }
            break;
        case "visibilitychange":
            if (document.hidden && this.rClicked) {
                this.rClicked = false;
            }
            break;
        case "click":
            if (this.rClicked) {
                evt.preventDefault();
                evt.stopPropagation();
            } else if (document.contentType.match("image") && isImage) {
                evt.target.style.marginTop = (evt.target.height > window.innerHeight)? "0" : null;
            }
            break;
        case "contextmenu":
            if (this.imgZoom) {
                evt.preventDefault();
                evt.stopPropagation();
                this.imgZoom = false;
            } else {
                // if (isImage) {
                //     buildImgMenu(evt.target);
                // } else if (isLink) {
                //     buildLinkMenu(evt.target);
                // }
                // if (evt.target.title) {
                //     buildCopyTitleMenu(evt.target);
                // }
                buildMenu(evt.target, {isImage: isImage, isLink: isLink, isTitle: evt.target.title != null});
            }
            break;
        case "dragstart":
            this.startPoint = [evt.screenX, evt.screenY];
            if (evt.clientX && evt.clientY) {
                this.sourcePoint = document.elementFromPoint(evt.clientX, evt.clientY); // for img in a
            }
            this.sourceNode = evt.target;
            if (isImage) {
                evt.dataTransfer.setData("application/x-moz-file-promise-url", evt.target.src);
            }
            if (this.sourcePoint) {
                this.sourceIsImage =  this.sourcePoint.localName == "img" || this.sourceNode.localName == "img";
                this.sourceIsLink = this.sourcePoint.localName == "a" || this.sourceNode.localName == "a";
            }
            break;
        case "dragover":
            evt.preventDefault();
            break;
        case "drop":
            if (this.startPoint && !isTextNode(evt.target) && evt.target.contentEditable != "true") {
                evt.preventDefault();
                evt.stopPropagation();
                var [subX, subY] = [evt.screenX - this.startPoint[0], evt.screenY - this.startPoint[1]];
                var [distX, distY] = [(subX > 0 ? subX : (-subX)), (subY > 0 ? subY : (-subY))];
                var direction;
                var linkURLs = [];
                var dt = evt.dataTransfer;
                var imageSrc = (this.sourceIsImage)? this.sourceNode.src : this.sourcePoint.src;
                var nodeUrl = getNodeUrl(dt);
                var linkText = (this.sourceIsLink)? this.sourceNode.innerText || this.sourcePoint.innerText : '';
                //check if selected multiple links
                var links = document.links;
                var selection = window.getSelection();
                var selectedText = selection.toString() || getSelectedText(this.sourceNode);
                if (links && selection) {
                    for (let link of links) {
                      if (selection.containsNode(link, true) && linkURLs.indexOf(link.href) == -1)
                        linkURLs.push(link.href);
                    }
                }
                if (distX > distY) {
                    direction = subX < 0 ? "L" : "R";
                } else {
                    direction = subY < 0 ? "U" : "D";
                }
                var text = evt.dataTransfer.getData("text/plain");
                if (eDrag[direction] == "COPY" && (selectedText || this.sourceIsImage || this.sourceIsLink)) {
                    var copyText = (selectedText)? selectedText : linkText;
                    if (!copyText) {
                        copyText = (this.sourceIsImage)? this.sourceNode.alt || this.sourceNode.title || this.sourcePoint.alt||this.sourcePoint.title : '';
                    }
                    GM_setClipboard(copyText);
                    break;
                } else {
                    searchEngine = eDrag[direction].SE;
                }
                if (linkURLs.length > 1) { //open selected multiple links in new tabs, true means background
                    // var cnt = 0;
                    linkURLs.reverse().forEach(aURL => {
                        //setTimeout(()=>GM_openInTab(aURL, { active: false, insert: true }), 100 * cnt);
                        //cnt++;
                        GM_openInTab(aURL, { active: false, insert: true });
                    });
                } else if (linkURLs.length == 1 && selection.toString().length > 0) {
                    if (urlRegex.test(selection.toString())) {
                        GM_openInTab(selection.toString(), { active: false, insert: true });
                    } else {
                        GM_openInTab(searchEngine + encodeURIComponent(selection.toString()), { active: false, insert: true });
                    }
                } else if (eDrag[direction].SIE && imageSrc) {
                    GM_openInTab(eDrag[direction].SIE + imageSrc, { active: false, insert: true });
                } else if (nodeUrl && direction == linkOpenDirection) { //新标签打开文件(后台)
                    GM_openInTab(nodeUrl, { active: false, insert: true });
                } else if (urlRegex.test(text) && direction == detectTxtorUrlDirection) {
                    GM_openInTab((text.match(/^\s*(https?|ftp):\/\//))? text : "http://" + text);
                } else {
                    GM_openInTab(searchEngine + encodeURIComponent(linkText || text), { active: false, insert: true });
                }
                this.startPoint = 0;
            }
        }
    }

    function isTextNode(n) {
        return n.localName == "textarea" || (n.localName == "input" && n.type.match(/text|password|search/));
    }

    function getSelectedText(elem) { // only for input[type=text] and textarea
        var text = '';
        if(isTextNode(elem)) {
            text = elem.value.substring(elem.selectionStart, elem.selectionEnd);
        }
        return text;
    }
    function getNodeUrl(dt) {
        return (dt.types.includes("application/x-moz-file-promise-url") || dt.types.includes("text/x-moz-url"))? (dt.getData("application/x-moz-file-promise-url") || dt.getData("text/x-moz-url").split("\n")[0]) : '';
    }
    function clearSelectedText(elem) { // only for input[type=text] and textarea
        if(isTextNode(elem)) {
            elem.value = elem.value.substring(0, elem.selectionStart) + elem.value.substring(elem.selectionEnd);
        }
    }

    function setImageSize(img, w, h) {
        img.setAttribute("width", (w == "auto")? w : w + "px");
        img.setAttribute("height", (h == "auto")? h : h + "px");
        img.style.width = (w == "auto")? w : w + "px";
        img.style.height = (h == "auto")? h : h + "px";
        if (document.contentType.match("image")) {
            //img.classList.toggle("overflowingVertical", img.height > window.innerHeight || h > window.innerHeight);
            //img.style.marginTop = (img.height > window.innerHeight || h > window.innerHeight)? "0" : null;
            img.style.bottom = (img.height > window.innerHeight)? "auto" : 0;
        } else {
            img.style.padding = img.style.padding = img.style.maxHeight = img.style.maxWidth = "unset";
        }
    }

    function storeOriginalImgSize(img) {
        if (!img.dataset.imgOriginalWidth) {
            img.dataset.imgOriginalWidth = img.width;
        }
        if (!img.dataset.imgOriginalHeight) {
            img.dataset.imgOriginalHeight = img.height;
        }
    }

    function restoreOriginalImgSize(img) {
        if (img.dataset.imgOriginalWidth && img.dataset.imgOriginalHeight) {
            setImageSize(img, img.dataset.imgOriginalWidth, img.dataset.imgOriginalHeight);
        }
    }

    function buildMenu(node, types) {
        var menu = document.querySelector('#easyDragMenu') || document.createElement("menu");
        menu.type = "context";
        menu.id = "easyDragMenu";
        menu.replaceChildren();
        var mi;
        if (types.isImage && (!node.complete || node.matches("[src]:-moz-broken"))) {
            mi = document.createElement("menuitem");
            mi.label = "重新载入所有未显示图片";
            mi.onclick = function() {
                revealAllBrokenImgs();
            };
            menu.appendChild(mi);
        }
        if (types.isLink && urlRegex.test(node.textContent)) {
            mi = document.createElement("menuitem");
            mi.label = "在新标签页打开链接文本";
            mi.onclick = function() {
                GM_openInTab((node.textContent.match(/^\s*(https?|ftp):\/\//))? node.textContent : "http://" + node.textContent);
            };
            menu.appendChild(mi);
        }
        if (types.isTitle && (node.title||node.alt)) {
            mi = document.createElement("menuitem");
            mi.label = "复制Title";
            mi.onclick = function() {
                GM_setClipboard(node.title||node.alt);
            };
            menu.appendChild(mi);
        }
        if (menu.querySelectorAll("menuitem").length > 0) {
            document.body.appendChild(menu);
            node.setAttribute("contextmenu", menu.id);
        }
    }

    function getImageBase64(img) {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        document.body.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var base64 = canvas.toDataURL('image/png');
        document.body.removeChild(canvas);
        return base64;
    }

    function revealAllBrokenImgs() {
        var imgs = document.images; // collection not array, convert to array: Array.from(imgs)
        for (var i = 0; i < imgs.length; i++) {
            if (!imgs[i].complete || imgs[i].naturalWidth == 0) {
                var tempSrc = imgs[i].src;
                imgs[i].src += ((imgs[i].src.indexOf("?") != -1) ? "&" : "?") + new Date().getTime();
                imgs[i].src = tempSrc;
            }
        }
    }

    function getScrollBarWidth () {
        var inner = document.createElement('p');
        inner.style.width = "100%";
        inner.style.height = "200px";

        var outer = document.createElement('div');
        outer.style.position = "absolute";
        outer.style.top = "0px";
        outer.style.left = "0px";
        outer.style.visibility = "hidden";
        outer.style.width = "200px";
        outer.style.height = "150px";
        outer.style.overflow = "hidden";
        outer.appendChild (inner);

        document.body.appendChild (outer);
        var w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        var w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        document.body.removeChild (outer);

        return (w1 - w2);
    }

    //from ff84, use wheel on image to zoom will sroll page, event.preventDefault() for document or window wheel event not working, so add this on image when right mouse down.
    function imgWheel(e) {
        e.preventDefault();
    }

    function configUI() {

    }

})();
