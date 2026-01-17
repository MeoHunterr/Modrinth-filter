// ==UserScript==
// @name         Modrinth Filter
// @namespace    https://github.com/MeoHunterr/Modrinth-filter
// @version      1.0.0
// @description  Adds a native-style UI to filter mods by tags on Modrinth.
// @author       MeoHunter
// @match        https://modrinth.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'modrinth_hidden_tags_config';
    let hiddenTags = JSON.parse(localStorage.getItem(STORAGE_KEY)) || ['client', 'client and server'];

    const styles = `
        #mnf-panel { position: fixed; bottom: 24px; right: 24px; width: 280px; background-color: #131313; border: 1px solid #282828; border-radius: 10px; padding: 16px; z-index: 10000; font-family: 'Inter', system-ui, sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.5); color: #e2e2e2; transition: opacity 0.3s; }
        #mnf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: 700; font-size: 14px; color: #fff; }
        #mnf-header span { color: #1bd96a; }
        #mnf-input { width: 100%; background-color: #050505; border: 1px solid #282828; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box; margin-bottom: 12px; transition: border-color 0.2s; }
        #mnf-input:focus { border-color: #1bd96a; }
        #mnf-tags { display: flex; flex-wrap: wrap; gap: 6px; max-height: 200px; overflow-y: auto; }
        .mnf-tag { display: inline-flex; align-items: center; background-color: #2c1a1a; color: #ff5c5c; border: 1px solid #4a2020; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; user-select: none; }
        .mnf-tag:hover { background-color: #3e2020; border-color: #ff5c5c; }
        .mnf-tag .close-icon { margin-left: 6px; font-size: 12px; opacity: 0.7; }
        #mnf-tags::-webkit-scrollbar { width: 4px; }
        #mnf-tags::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    function createUI() {
        const existing = document.getElementById('mnf-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'mnf-panel';
        panel.innerHTML = `
            <div id="mnf-header">
                <div><span>◆</span> Blocked Tags</div>
                <div style="opacity: 0.5; font-size: 10px;">Native Filter</div>
            </div>
            <input id="mnf-input" type="text" placeholder="Add tag (e.g., fabric)..." autocomplete="off">
            <div id="mnf-tags"></div>
        `;
        document.body.appendChild(panel);

        const input = panel.querySelector('#mnf-input');
        const list = panel.querySelector('#mnf-tags');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim().toLowerCase();
                if (val && !hiddenTags.includes(val)) {
                    hiddenTags.push(val);
                    saveConfig();
                    renderTags(list);
                    applyFilter();
                    input.value = '';
                }
            }
        });

        renderTags(list);
    }

    function renderTags(container) {
        container.innerHTML = '';
        if (hiddenTags.length === 0) {
            container.innerHTML = '<span style="color:#444; font-size:11px; font-style:italic; padding:4px;">No filters active</span>';
            return;
        }
        hiddenTags.forEach(tag => {
            const el = document.createElement('div');
            el.className = 'mnf-tag';
            el.innerHTML = `${tag} <span class="close-icon">✕</span>`;
            el.onclick = () => {
                hiddenTags = hiddenTags.filter(t => t !== tag);
                saveConfig();
                renderTags(container);
                resetAndApply();
            };
            container.appendChild(el);
        });
    }

    function saveConfig() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenTags));
    }

    function resetAndApply() {
        const cards = document.querySelectorAll('article.project-card, div.search-result');
        cards.forEach(c => c.style.display = '');
        applyFilter();
    }

    function applyFilter() {
        if (hiddenTags.length === 0) return;
        
        const cards = document.querySelectorAll('article.project-card, div.search-result');
        cards.forEach(card => {
            if (card.style.display === 'none') return;
            
            const elements = card.querySelectorAll('div, span, a, li');
            let shouldHide = false;
            
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                if (el.innerText.length > 0 && el.innerText.length < 50) {
                    if (hiddenTags.includes(el.innerText.toLowerCase().trim())) {
                        shouldHide = true;
                        break;
                    }
                }
            }
            
            if (shouldHide) card.style.display = 'none';
        });
    }

    createUI();
    setInterval(applyFilter, 500);
    
    const observer = new MutationObserver(() => applyFilter());
    observer.observe(document.body, { childList: true, subtree: true });

})();
