import { THEME_STORAGE_KEY } from "./THEME_STORAGE_KEY";

export const THEME_PREPAINT_SCRIPT = `(()=>{try{const value=window.localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=value==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}})();`;
