// Fibery option colors and emoji on the workspace theme. Fibery stores an option's color as a hex (`enum/color`) and
// its emoji as a shortcode (`enum/icon`, ":rocket:"); apps render them with the theme's 12 highlight hues, so light and
// dark themes keep working and no shade is ever computed from the hex. Pure, without imports: Node tests use it as is.
// Fibery's standard option palette → theme hue. #FBA32F goes to yellow, not orange: orange is the workspace accent's
// family (buttons, focus), and "waiting" options painted orange would read as controls.
const PALETTE = [
    ["#4a4a4a", "grey"],
    ["#6a849b", "grey"],
    ["#99a2ab", "grey"],
    ["#d40915", "red"],
    ["#e72065", "pink"],
    ["#9c2baf", "purple"],
    ["#673db6", "violet"],
    ["#3e53b4", "blue"],
    ["#2978fb", "blue"],
    ["#199ee3", "aqua"],
    ["#1fbed3", "turquoise"],
    ["#159789", "aquamarine"],
    ["#4faf54", "green"],
    ["#8ec351", "green"],
    ["#fba32f", "yellow"],
    ["#fc551f", "orange"],
    ["#b04e31", "orange"],
];
const rgbOf = (hex) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!m)
        return null;
    const digits = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    const n = parseInt(digits, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const PALETTE_RGB = PALETTE.map(([hex, hue]) => [rgbOf(hex), hue]);
/**
 * Theme hue for a Fibery option color (`enum/color`). Fibery's 17 standard colors map by a fixed table
 * (case-insensitive); any other hex takes the hue of the nearest standard color (RGB distance) — a choice of token,
 * never a new color. `null`, `undefined` or a value that is not a hex → `null`: render the option neutral.
 */
export function fiberyHue(hex) {
    if (!hex)
        return null;
    const rgb = rgbOf(hex);
    if (!rgb)
        return null;
    let best = null;
    let bestDistance = Infinity;
    for (const [[r, g, b], hue] of PALETTE_RGB) {
        const distance = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = hue;
        }
    }
    return best;
}
// Shortcodes Fibery's emoji picker stores (emoji-mart names). First block: the codes CRM options use today; second:
// common status emoji, so an option re-iconed in Fibery most likely still shows.
const EMOJI = {
    rocket: "\u{1F680}",
    eyes: "\u{1F440}",
    zzz: "\u{1F4A4}",
    heavy_multiplication_x: "✖️",
    heavy_minus_sign: "➖",
    telephone_receiver: "\u{1F4DE}",
    x: "❌",
    hourglass: "⌛",
    scroll: "\u{1F4DC}",
    no_entry_sign: "\u{1F6AB}",
    wastebasket: "\u{1F5D1}️",
    grey_question: "❔",
    email: "✉️",
    speech_balloon: "\u{1F4AC}",
    necktie: "\u{1F454}",
    desktop_computer: "\u{1F5A5}️",
    inbox_tray: "\u{1F4E5}",
    outbox_tray: "\u{1F4E4}",
    white_check_mark: "✅",
    heavy_check_mark: "✔️",
    warning: "⚠️",
    no_entry: "⛔",
    question: "❓",
    exclamation: "❗",
    fire: "\u{1F525}",
    star: "⭐",
    sparkles: "✨",
    tada: "\u{1F389}",
    trophy: "\u{1F3C6}",
    bulb: "\u{1F4A1}",
    hourglass_flowing_sand: "⏳",
    date: "\u{1F4C5}",
    calendar: "\u{1F4C6}",
    memo: "\u{1F4DD}",
    pushpin: "\u{1F4CC}",
    link: "\u{1F517}",
    lock: "\u{1F512}",
    moneybag: "\u{1F4B0}",
    handshake: "\u{1F91D}",
    briefcase: "\u{1F4BC}",
    office: "\u{1F3E2}",
    "+1": "\u{1F44D}",
    thumbsup: "\u{1F44D}",
    "-1": "\u{1F44E}",
    thumbsdown: "\u{1F44E}",
    wave: "\u{1F44B}",
    bust_in_silhouette: "\u{1F464}",
    busts_in_silhouette: "\u{1F465}",
    phone: "☎️",
    telephone: "☎️",
    iphone: "\u{1F4F1}",
    computer: "\u{1F4BB}",
    globe_with_meridians: "\u{1F310}",
    construction: "\u{1F6A7}",
    rotating_light: "\u{1F6A8}",
    bell: "\u{1F514}",
    red_circle: "\u{1F534}",
    large_green_circle: "\u{1F7E2}",
    large_yellow_circle: "\u{1F7E1}",
    large_blue_circle: "\u{1F535}",
    white_circle: "⚪",
    black_circle: "⚫",
    video_game: "\u{1F3AE}",
    art: "\u{1F3A8}",
    package: "\u{1F4E6}",
    clipboard: "\u{1F4CB}",
};
/**
 * Unicode emoji for a Fibery icon shortcode (`enum/icon`, ":rocket:" or "rocket"). Unknown codes → `null`: better no
 * emoji than its code as text.
 */
export function fiberyEmoji(shortcode) {
    if (!shortcode)
        return null;
    const name = shortcode.trim().replace(/^:|:$/g, "");
    return Object.prototype.hasOwnProperty.call(EMOJI, name) ? EMOJI[name] : null;
}
// Hues for people (avatars): none of them is a state code in apps (red, yellow, green, aqua, violet) or the accent's
// family (orange), and a circle with initials is a different shape from a badge or a dot anyway.
const PERSON_HUES = ["blue", "turquoise", "aquamarine", "purple", "pink"];
/** Stable hue for a person or record id, e.g. an avatar's fill: the same id always gets the same one of 5 hues. */
export function hueFor(id) {
    // FNV-1a: tiny, stable across sessions and engines, spreads short ids well.
    let hash = 0x811c9dc5;
    for (let i = 0; i < id.length; i++) {
        hash ^= id.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return PERSON_HUES[(hash >>> 0) % PERSON_HUES.length];
}
