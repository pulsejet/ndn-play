/** Cache for dark mode */
let dark = false;

/** Check if currently in dark mode */
export function isDark(): boolean {
    return dark = (getComputedStyle(document.documentElement).getPropertyValue('--is-dark') === '1');
}

// Get initial cache
isDark();

/** Maps common colors to more pleasing counterparts */
export const COLOR_MAP: {[key: string]: string} = {
    get blue() { return '#75b7ff'; },
    get green() { return '#71f59f'; },
    get red() { return '#e44e6c'; },
    get orange() { return '#ffb066'; },
    get pink() { return '#f8a3ff'; },
    get lightgreen() { return '#a1ffc2'; },
    get lightorange() { return '#ffd1a6'; },
    get silver() { return '#e3e3e3'; },
    get gray() { return '#666666'; },

    get DEFAULT_LINK_COLOR() { return '#3583ea'; },
    get BROKEN_LINK_COLOR() { return dark ? '#444444' : '#cccccc'; },
    get DEFAULT_NODE_COLOR() { return '#a4b7fc'; },
    get SELECTED_NODE_COLOR() { return '#4ee44e'; },
    get ACTIVE_NODE_COLOR() { return '#ffcccb'; },
};