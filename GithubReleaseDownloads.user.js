// ==UserScript==
// @name         Github Release Downloads
// @namespace    https://github.com/Hibi-10000/GithubReleaseDownloads
// @version      0.1.0
// @author       Hibi_10000
// @license      MIT
// @description  Show download count for releases on Github
// @source       https://github.com/Hibi-10000/GithubReleaseDownloads
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @grant        none
// @match        https://github.com/*
// @updateURL    https://github.com/Hibi-10000/GithubReleaseDownloads/releases/latest/download/GithubReleaseDownloads.user.js
// @downloadURL  https://github.com/Hibi-10000/GithubReleaseDownloads/releases/latest/download/GithubReleaseDownloads.user.js
// ==/UserScript==

'use strict';

let observer = new MutationObserver(observerFunc)
const setObs = () => {
    const body = document.querySelector("body");
    if (body != null) {
        observer.observe(body, {childList: true, subtree: true});
    }
    else {
        window.setTimeout(setObs, 1000);
    }
}

function observerFunc() {
    if (/https?:\/\/github.com\/.+?\/.+?\/releases.*/.test(document.URL)) {
        run();
    }
}

const getRepo = () => {
    //return document.querySelector('meta[name="octolytics-dimension-repository_nwo"]').content;
    return document.URL.match(/(?<=^https?:\/\/github.com\/).+?\/.+?(?=\/releases)/)[0];
}

const getReleaseTag = () => {
    const ifEmpty = document.URL.replace(/^https?:\/\/github.com\/.+?\/.+?\/releases/, "");
    return ifEmpty === "" ? null : ifEmpty.match(/(?<=^\/tag\/)[^/?#]+/)[0];
}

function run() {
    const tag = getReleaseTag();
    const response = fetch(`https://api.github.com/repos/${getRepo()}/releases${tag !== null ? `/tags/${tag}` : ""}`);
    response.then(res => {
        if (res.ok) {
            res.json().then(json => {
                setDLCount(json, tag !== null);
            });
        }
    }).catch(error => {
        console.error('Error:', error);
    });;
}

function setDLCount(json, /** @type {boolean} */ isTag) {
    document.querySelectorAll(`a[href^="/${getRepo()}/releases/download/"]`).forEach(link => {
        const name = link.href.match(/(?<=\/)[^/?#]+$/)[0];
        const assets = tag => {
            return createElement(tag.assets, name, link);
        }
        if (isTag) {
            assets(json);
        } else {
            for (const tag of json) {
                if (assets(tag)) break;
            }
        }
    });
}

//大部分がaddshore/browser-github-release-downloads(MIT License)のコード
function createElement(assets, name, link) {
    for (const asset of assets) {
        if (asset.name === name) {
            var sizeContainer = link.parentNode.parentNode.children[1];
            if (!sizeContainer) {
                console.log("No size parent element selectable to attached download count to");
                continue;
            }
            //そこにgrdcounterがあるかどうか確認する
            const grdcounter = sizeContainer.querySelector('.grdcounter');
            if (grdcounter != null) continue;

            var size = sizeContainer.children[0];
            if (!size) {
                console.log("No size element selectable to attached download count to");
                continue;
            }
            var dwnCount = document.createElement('span');
            //dwnCount.id = 'grdcounter'
            dwnCount.className = 'grdcounter color-fg-muted text-sm-right ml-md-3'; // Right style
            //dwnCount.classList.remove('flex-auto');
            //size.classList.remove('flex-auto');
            var d = asset.download_count;
            dwnCount.appendChild(document.createTextNode(d + ' Downloads'));
            //var dwnIcon = document.createElement('span');
            //dwnCount.appendChild(dwnIcon);
            sizeContainer.insertBefore(dwnCount, size);
            //size.style.setProperty('flex', 'none', 'important');
            //dwnCount.style.setProperty('flex', 'none', 'important');
            //dwnCount.style.flexGrow = '2';
            //dwnCount.style.minWidth = dwnCount.offsetWidth + 3 + 'px';
            //dwnCount.style.marginLeft = '5px';
            dwnCount.style.whiteSpace = 'nowrap';
            //size.classList.remove('text-sm-left');
            //size.classList.add('text-sm-right');
            size.classList.remove('flex-auto');
            return true;
        }
    }
    return false;
}

(function() {
    setObs();
})();
