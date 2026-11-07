// ─── Zip ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++)
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();
const crc32 = (data) => {
    let crc = 0xffffffff;
    for (const byte of data)
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
};
const pipe = async (data, stream) => new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer());
const zip = async (files) => {
    const parts = [];
    const central = [];
    let offset = 0;
    for (const file of files) {
        const name = new TextEncoder().encode(file.name);
        const compressed = await pipe(file.data, new CompressionStream("deflate-raw"));
        const crc = crc32(file.data);
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(8, 8, true); // deflate
        local.setUint16(12, 0x21, true); // 1980-01-01
        local.setUint32(14, crc, true);
        local.setUint32(18, compressed.length, true);
        local.setUint32(22, file.data.length, true);
        local.setUint16(26, name.length, true);
        parts.push(new Uint8Array(local.buffer), name, compressed);
        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(10, 8, true);
        entry.setUint16(14, 0x21, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, compressed.length, true);
        entry.setUint32(24, file.data.length, true);
        entry.setUint16(28, name.length, true);
        entry.setUint32(42, offset, true);
        central.push(new Uint8Array(entry.buffer), name);
        offset += 30 + name.length + compressed.length;
    }
    const centralSize = central.reduce((n, p) => n + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    const all = [...parts, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of all) {
        out.set(p, at);
        at += p.length;
    }
    return out;
};
const NOT_XLSX = "Это не файл XLSX";
const unzip = async (bytes) => {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
        if (view.getUint32(i, true) === 0x06054b50) {
            end = i;
            break;
        }
    }
    if (end < 0)
        throw new Error(NOT_XLSX);
    const count = view.getUint16(end + 10, true);
    let at = view.getUint32(end + 16, true);
    const files = new Map();
    for (let i = 0; i < count; i++) {
        if (view.getUint32(at, true) !== 0x02014b50)
            throw new Error(NOT_XLSX);
        const method = view.getUint16(at + 10, true);
        const size = view.getUint32(at + 20, true);
        const nameLength = view.getUint16(at + 28, true);
        const extraLength = view.getUint16(at + 30, true);
        const commentLength = view.getUint16(at + 32, true);
        const localOffset = view.getUint32(at + 42, true);
        const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
        if (size === 0xffffffff || localOffset === 0xffffffff)
            throw new Error("Файл слишком большой");
        const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
        const data = bytes.subarray(dataStart, dataStart + size);
        if (method === 0)
            files.set(name, data);
        else if (method === 8)
            files.set(name, await pipe(data, new DecompressionStream("deflate-raw")));
        at += 46 + nameLength + extraLength + commentLength;
    }
    return files;
};
const ENTITIES = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
const decodeEntities = (text) => text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, code) => code[0] === "#"
    ? String.fromCodePoint(code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1)))
    : (ENTITIES[code] ?? whole));
// Element names lose their namespace prefix ("x:row" → "row"); attribute names keep it ("r:id").
const parseXml = (xml) => {
    const root = { name: "#root", attrs: {}, children: [], text: "" };
    const stack = [root];
    // Attribute values may hold ">" (e.g. a number format "[>=100]"), so the attribute part skips quoted strings.
    const token = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<[?!][\s\S]*?>|<(\/?)([^\s>/]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g;
    for (let m = token.exec(xml); m; m = token.exec(xml)) {
        const top = stack[stack.length - 1];
        if (m[1] !== undefined)
            top.children.push({ name: "#text", attrs: {}, children: [], text: m[1] });
        else if (m[6] !== undefined)
            top.children.push({ name: "#text", attrs: {}, children: [], text: decodeEntities(m[6]) });
        else if (m[3] !== undefined) {
            const name = m[3].replace(/^[^:]*:/, "");
            if (m[2] === "/") {
                if (stack.length > 1)
                    stack.pop();
                continue;
            }
            const attrs = {};
            for (const a of m[4].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))
                attrs[a[1]] = decodeEntities(a[2] ?? a[3] ?? "");
            const node = { name, attrs, children: [], text: "" };
            top.children.push(node);
            if (m[5] !== "/")
                stack.push(node);
        }
    }
    return root;
};
const child = (node, name) => node?.children.find((c) => c.name === name);
const childrenOf = (node, name) => node?.children.filter((c) => c.name === name) ?? [];
const textOf = (node) => node ? node.children.map((c) => (c.name === "#text" ? c.text : textOf(c))).join("") : "";
// Shared and inline strings: plain <t>, or rich-text runs <r><t>; phonetic hints (<rPh>) are not part of the text.
const stringItem = (node) => child(node, "t") ? textOf(child(node, "t")) : childrenOf(node, "r").map((r) => textOf(child(r, "t"))).join("");
const escapeXml = (text) => text
    // Characters XML 1.0 can't hold at all.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
// ─── Write ───────────────────────────────────────────────────────────────────
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const columnName = (index) => {
    let name = "";
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
        name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    return name;
};
// Style 1: text format ("@"), style 2: text format and bold, for the header.
const STYLES = `${XML_HEAD}<styleSheet xmlns="${MAIN_NS}">` +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
/**
 * An .xlsx file with one sheet: the first row is a bold, frozen header, every cell (and every column, for rows people
 * add later) is text-formatted, columns are as wide as their content (10–50 characters).
 *
 * @param sheetName Up to 31 characters; characters Excel forbids in sheet names are replaced.
 */
export async function writeXlsx(sheetName, rows) {
    const width = Math.max(1, ...rows.map((r) => r.length));
    const widths = Array.from({ length: width }, (_, i) => Math.min(50, Math.max(10, ...rows.map((r) => Math.max(...(r[i] ?? "").split("\n").map((l) => l.length))))) + 2);
    const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" style="1" customWidth="1"/>`).join("");
    const data = rows
        .map((row, r) => {
        const cells = Array.from({ length: width }, (_, c) => {
            const ref = `${columnName(c)}${r + 1}`;
            const style = r === 0 ? 2 : 1;
            const value = row[c] ?? "";
            return value === ""
                ? `<c r="${ref}" s="${style}"/>`
                : `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
        }).join("");
        return `<row r="${r + 1}">${cells}</row>`;
    })
        .join("");
    const sheet = `${XML_HEAD}<worksheet xmlns="${MAIN_NS}">` +
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
        `<sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${data}</sheetData></worksheet>`;
    const name = escapeXml(sheetName.replace(/[\\/?*:[\]]/g, " ").slice(0, 31) || "Sheet1");
    const text = (s) => new TextEncoder().encode(s);
    return zip([
        {
            name: "[Content_Types].xml",
            data: text(`${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                '<Default Extension="xml" ContentType="application/xml"/>' +
                '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
                '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
                '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
                "</Types>"),
        },
        {
            name: "_rels/.rels",
            data: text(`${XML_HEAD}<Relationships xmlns="${PKG_REL_NS}"><Relationship Id="rId1" ` +
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
        },
        {
            name: "xl/workbook.xml",
            data: text(`${XML_HEAD}<workbook xmlns="${MAIN_NS}" xmlns:r="${REL_NS}"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
        },
        {
            name: "xl/_rels/workbook.xml.rels",
            data: text(`${XML_HEAD}<Relationships xmlns="${PKG_REL_NS}">` +
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
                '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
                "</Relationships>"),
        },
        { name: "xl/styles.xml", data: text(STYLES) },
        { name: "xl/worksheets/sheet1.xml", data: text(sheet) },
    ]);
}
// ─── Read ────────────────────────────────────────────────────────────────────
// Built-in number formats that show dates (ECMA-376 §18.8.30 and the East Asian ones Excel maps to dates).
const DATE_FORMAT_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);
// A custom format shows a date when, outside quoted text, [colors] and escapes, it has a day, month or year part.
const isDateFormatCode = (code) => /[dmy]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, ""));
const columnIndex = (ref) => {
    const letters = /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? "";
    let n = 0;
    for (const ch of letters)
        n = n * 26 + ch.charCodeAt(0) - 64;
    return n - 1;
};
const serialToIso = (serial, date1904) => {
    const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
    return new Date(base + Math.floor(serial) * 86400000).toISOString().slice(0, 10);
};
const resolve = (base, target) => (target.startsWith("/") ? target.slice(1) : `${base}${target}`);
/**
 * The cells of the first sheet of an .xlsx file, row by row (gaps filled with empty cells). Numbers in a date format
 * come back as dates ("YYYY-MM-DD"); a cell with a formula comes back as a formula, whatever its result.
 *
 * @throws Error with a message for people when the file is not an XLSX workbook.
 */
export async function readXlsx(bytes) {
    const files = await unzip(bytes);
    const xml = (path) => {
        const data = files.get(path);
        return data ? parseXml(new TextDecoder().decode(data)) : undefined;
    };
    const workbook = child(xml("xl/workbook.xml"), "workbook");
    if (!workbook)
        throw new Error(NOT_XLSX);
    const date1904 = ["1", "true"].includes(child(workbook, "workbookPr")?.attrs.date1904 ?? "");
    const firstSheet = childrenOf(child(workbook, "sheets"), "sheet")[0];
    const sheetRel = Object.entries(firstSheet?.attrs ?? {}).find(([name]) => /(^|:)id$/.test(name))?.[1];
    const rels = childrenOf(child(xml("xl/_rels/workbook.xml.rels"), "Relationships"), "Relationship");
    const relTarget = (pick, fallback) => {
        const rel = rels.find(pick);
        return rel ? resolve("xl/", rel.attrs.Target) : fallback;
    };
    const sheetPath = relTarget((r) => r.attrs.Id === sheetRel, "xl/worksheets/sheet1.xml");
    const shared = childrenOf(child(xml(relTarget((r) => /\/sharedStrings$/.test(r.attrs.Type ?? ""), "xl/sharedStrings.xml")), "sst"), "si").map(stringItem);
    const styles = child(xml(relTarget((r) => /\/styles$/.test(r.attrs.Type ?? ""), "xl/styles.xml")), "styleSheet");
    const customFormats = new Map(childrenOf(child(styles, "numFmts"), "numFmt").map((f) => [Number(f.attrs.numFmtId), f.attrs.formatCode ?? ""]));
    const isDateStyle = childrenOf(child(styles, "cellXfs"), "xf").map((xf) => {
        const id = Number(xf.attrs.numFmtId ?? 0);
        return DATE_FORMAT_IDS.has(id) || (customFormats.has(id) && isDateFormatCode(customFormats.get(id)));
    });
    const sheet = child(xml(sheetPath), "worksheet");
    if (!sheet)
        throw new Error(NOT_XLSX);
    const rows = [];
    let rowIndex = -1;
    for (const row of childrenOf(child(sheet, "sheetData"), "row")) {
        rowIndex = row.attrs.r ? Number(row.attrs.r) - 1 : rowIndex + 1;
        const cells = [];
        let col = -1;
        for (const c of childrenOf(row, "c")) {
            col = c.attrs.r ? columnIndex(c.attrs.r) : col + 1;
            const t = c.attrs.t ?? "n";
            const raw = textOf(child(c, "v"));
            let cell;
            if (child(c, "f"))
                cell = { kind: "formula", value: t === "s" ? (shared[Number(raw)] ?? "") : raw };
            else if (t === "s")
                cell = { kind: "text", value: shared[Number(raw)] ?? "" };
            else if (t === "inlineStr")
                cell = { kind: "text", value: stringItem(child(c, "is")) };
            else if (t === "str")
                cell = { kind: "text", value: raw };
            else if (t === "b")
                cell = { kind: "boolean", value: raw === "1" };
            else if (t === "e")
                cell = { kind: "error", value: raw };
            else if (t === "d")
                cell = raw ? { kind: "date", value: raw.slice(0, 10) } : { kind: "empty" };
            else if (raw === "")
                cell = { kind: "empty" };
            else {
                const n = Number(raw);
                if (Number.isNaN(n))
                    cell = { kind: "text", value: raw };
                else if (isDateStyle[Number(c.attrs.s ?? 0)])
                    cell = { kind: "date", value: serialToIso(n, date1904) };
                else
                    cell = { kind: "number", value: n };
            }
            cells[col] = cell;
        }
        rows[rowIndex] = Array.from({ length: cells.length }, (_, i) => cells[i] ?? { kind: "empty" });
    }
    return Array.from({ length: rows.length }, (_, i) => rows[i] ?? []);
}
