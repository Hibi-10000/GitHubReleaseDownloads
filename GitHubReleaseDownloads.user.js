// ==UserScript==
// @name         GitHub Release Downloads
// @namespace    https://github.com/Hibi-10000/GitHubReleaseDownloads
// @version      0.2.2
// @author       Hibi_10000
// @license      MIT
// @description  Show download count for releases on Github
// @source       https://github.com/Hibi-10000/GitHubReleaseDownloads
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @grant        none
// @match        https://github.com/*
// @updateURL    https://github.com/Hibi-10000/GitHubReleaseDownloads/releases/latest/download/GitHubReleaseDownloads.user.js
// @downloadURL  https://github.com/Hibi-10000/GitHubReleaseDownloads/releases/latest/download/GitHubReleaseDownloads.user.js
// ==/UserScript==

'use strict';

const observer = new MutationObserver(observerFunc)
const initObserver = () => {
    const body = document.querySelector("body");
    if (body != null) {
        observer.observe(body, {childList: true, subtree: true});
    } else {
        window.setTimeout(initObserver, 1000);
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
            const tagName = link.href.match(/(?<=\/download\/)[^/?#]+(?=\/[^/?#]+$)/)[0];
            for (const tag of json) {
                if (tag.tag_name === tagName && assets(tag)) break;
            }
        }
    });
}

function createElement(assets, name, /** @type {Element} */ link) {
    for (const asset of assets) {
        if (asset.name === name) {
            const assetDataElem = link.parentNode.parentNode.children[1];
            if (assetDataElem == null) continue;

            //そこにgrdcounterが既に存在するか確認する
            if (assetDataElem.querySelector('#grdcounter') != null) continue;

            const assetDownloads = document.createElement('span');
            assetDownloads.id = 'grdcounter';
            assetDownloads.className = 'color-fg-muted text-sm-right ml-md-3';
            assetDownloads.textContent = `${asset.download_count} Downloads`;
            assetDownloads.style.whiteSpace = 'nowrap';

            const fileSize = assetDataElem.firstElementChild;
            if (fileSize == null) continue;
            assetDataElem.insertBefore(assetDownloads, fileSize);
            fileSize.classList.remove('flex-auto');
            return true;
        }
    }
    return false;
}

(function() {
    initObserver();
})();
