export const $  = (sel) => document.querySelector(sel);
export const $all = (sel) => Array.from(document.querySelectorAll(sel));

window.$ = $;
window.$all = $all;
