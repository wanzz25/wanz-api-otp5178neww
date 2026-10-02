const axios = require('axios');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, readFile } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const APPLE_EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json';
const APPLE_EMOJI_JSON_LOCAL = join(require('os').tmpdir(), 'emoji-apple-image.json');

let appleEmojiMap = null;
const emojiImageCache = new Map();

async function downloadFile(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5
    });
    return Buffer.from(res.data);
}

function getTimeStr() {
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return fmt.format(new Date()).replace(':', '.');
}

function emojiToUnicode(emoji) {
    return [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-');
}

async function loadAppleEmojiMap() {
    if (appleEmojiMap) return appleEmojiMap;
    if (!existsSync(APPLE_EMOJI_JSON_LOCAL)) {
        const buf = await downloadFile(APPLE_EMOJI_JSON_URL);
        await writeFile(APPLE_EMOJI_JSON_LOCAL, buf);
    }
    const raw = await readFile(APPLE_EMOJI_JSON_LOCAL, 'utf-8');
    appleEmojiMap = JSON.parse(raw);
    return appleEmojiMap;
}

async function getEmojiImage(emoji) {
    if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji);
    const map = await loadAppleEmojiMap();
    const base = emojiToUnicode(emoji);
    const variants = [
        base,
        base.replace(/-fe0f/gi, ''),
        `${base.replace(/-fe0f/gi, '')}-fe0f`,
        base.toUpperCase(),
        base.replace(/-fe0f/gi, '').toUpperCase(),
        base.replace(/-fe0f/gi, '').toUpperCase() + '-FE0F',
    ];
    let b64 = null;
    for (const v of variants) {
        if (map[v]) {
            b64 = map[v];
            break;
        }
    }
    if (!b64) return null;
    const buf = Buffer.from(b64, 'base64');
    const img = await loadImage(buf);
    emojiImageCache.set(emoji, img);
    return img;
}

async function drawAppleEmoji(ctx, emoji, x, y, size) {
    const img = await getEmojiImage(emoji);
    if (!img) {
        ctx.fillText(emoji, x, y);
        return;
    }
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu;

function measureTextCustom(ctx, text, fontSize) {
    const parts = text.split(EMOJI_REGEX);
    let totalWidth = 0;
    for (const part of parts) {
        if (!part) continue;
        EMOJI_REGEX.lastIndex = 0;
        if (EMOJI_REGEX.test(part)) {
            totalWidth += fontSize * 1.05;
        } else {
            totalWidth += ctx.measureText(part).width;
        }
        EMOJI_REGEX.lastIndex = 0;
    }
    return totalWidth;
}

async function drawTextWithEmojis(ctx, text, x, y, fontSize) {
    const parts = text.split(EMOJI_REGEX);
    let currentX = x;
    for (const part of parts) {
        if (!part) continue;
        EMOJI_REGEX.lastIndex = 0;
        if (EMOJI_REGEX.test(part)) {
            const emojiSize = fontSize * 1.05;
            const emojiCX = currentX + emojiSize / 2;
            const emojiCY = y;
            await drawAppleEmoji(ctx, part, emojiCX, emojiCY, emojiSize);
            currentX += emojiSize;
        } else {
            ctx.fillText(part, currentX, y);
            currentX += ctx.measureText(part).width;
        }
        EMOJI_REGEX.lastIndex = 0;
    }
}

function wrapText(ctx, text, maxWidth, fontSize) {
    ctx.font = `${fontSize}px InterRegular`;
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.includes('\n')) {
            const parts = word.split('\n');
            for (let j = 0; j < parts.length; j++) {
                const test = cur + (cur ? " " : "") + parts[j];
                if (measureTextCustom(ctx, test, fontSize) > maxWidth && cur) {
                    lines.push(cur);
                    cur = parts[j];
                } else {
                    cur = test;
                }
                if (j < parts.length - 1) {
                    lines.push(cur);
                    cur = "";
                }
            }
            continue;
        }
        const test = cur + (cur ? " " : "") + word;
        if (measureTextCustom(ctx, test, fontSize) > maxWidth && i > 0) {
            lines.push(cur);
            cur = word;
        } else {
            cur = test;
        }
    }
    if (cur) lines.push(cur);
    return lines;
}

async function renderRinChat({ text = '', time, imgUrl, emojis } = {}) {
    const timeStr = time || getTimeStr();
    const txt = text;
    const caption = imgUrl ? txt : "";
    let emojiList = (emojis && emojis.length) ? emojis : ["😂", "😍", "😡", "🤍", "😭", "😔"];

    const RIN_BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/iqc-hytam.png';
    const RIN_DIR = join(require('os').tmpdir(), 'rinchat');
    const RIN_BG_LOCAL = join(RIN_DIR, 'iqc-hytam.png');
    const RIN_FONTS_DIR = join(RIN_DIR, 'fonts');

    const RIN_FONTS = [{
        url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
        file: 'Inter-Regular.ttf'
    }];

    const BG_W = 941;
    const BG_H = 1671;

    await mkdir(RIN_FONTS_DIR, { recursive: true });

    async function rinDownload(url, isJson = false) {
        const res = await axios.get(url, {
            responseType: isJson ? 'json' : 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            maxRedirects: 5
        });
        return isJson ? res.data : Buffer.from(res.data);
    }

    for (const f of RIN_FONTS) {
        const dest = join(RIN_FONTS_DIR, f.file);
        if (!existsSync(dest)) await writeFile(dest, await rinDownload(f.url));
        GlobalFonts.registerFromPath(dest, 'InterRegular');
    }

    if (!existsSync(RIN_BG_LOCAL)) {
        await writeFile(RIN_BG_LOCAL, await rinDownload(RIN_BG_URL));
    }

    await loadAppleEmojiMap();

    const canvas = createCanvas(BG_W, BG_H);
    const ctx = canvas.getContext('2d');
    const bgImg = await loadImage(RIN_BG_LOCAL);
    ctx.drawImage(bgImg, 0, 0, BG_W, BG_H);

    const PERMANENT_TIME_X = 463;
    const PERMANENT_TIME_Y = 8;
    const PERMANENT_TIME_SIZE = 27;

    ctx.fillStyle = "#ffffff";
    ctx.font = `${PERMANENT_TIME_SIZE}px InterRegular`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(timeStr, PERMANENT_TIME_X, PERMANENT_TIME_Y);

    const chatFontSize = 30;
    const maxWidthLimit = 530;
    const minBubbleWidth = 280;
    const lineHeight = chatFontSize + 14;
    const paddingX = 30;
    const paddingY = 20;
    const rad = 28;
    const fixedX = 35;
    const fixedBaseY = 946;

    ctx.font = `22px InterRegular`;
    const timeWidth = ctx.measureText(timeStr).width;

    let finalY, finalBubbleHeight, bubbleW;

    if (!imgUrl) {
        ctx.font = `${chatFontSize}px InterRegular`;
        const chatLines = wrapText(ctx, txt, maxWidthLimit, chatFontSize);

        let longestW = 0;
        chatLines.forEach(l => {
            const w = measureTextCustom(ctx, l.trim(), chatFontSize);
            if (w > longestW) longestW = w;
        });

        bubbleW = longestW + (paddingX * 2);
        bubbleW = Math.max(bubbleW, timeWidth + 75);
        bubbleW = Math.max(bubbleW, 180);

        const spaceTimeY = 12;
        finalBubbleHeight = (chatLines.length * lineHeight) + paddingY + spaceTimeY + 22;
        finalY = fixedBaseY - finalBubbleHeight;

        ctx.fillStyle = "#1c1c1e";
        ctx.beginPath();
        ctx.moveTo(fixedX + rad, finalY);
        ctx.lineTo(fixedX + bubbleW - rad, finalY);
        ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
        ctx.lineTo(fixedX + bubbleW, finalY + finalBubbleHeight - rad);
        ctx.quadraticCurveTo(fixedX + bubbleW, finalY + finalBubbleHeight, fixedX + bubbleW - rad, finalY + finalBubbleHeight);
        ctx.lineTo(fixedX + rad, finalY + finalBubbleHeight);
        ctx.quadraticCurveTo(fixedX + 8, finalY + finalBubbleHeight, fixedX + 8, finalY + finalBubbleHeight - 8);
        ctx.lineTo(fixedX + 8, finalY + rad);
        ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(fixedX + 12, finalY + finalBubbleHeight - 20);
        ctx.quadraticCurveTo(fixedX - 2, finalY + finalBubbleHeight - 4, fixedX - 8, finalY + finalBubbleHeight);
        ctx.quadraticCurveTo(fixedX + 6, finalY + finalBubbleHeight, fixedX + 22, finalY + finalBubbleHeight - 2);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = `${chatFontSize}px InterRegular`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (let i = 0; i < chatLines.length; i++) {
            const lineY = finalY + paddingY + (i * lineHeight) + (chatFontSize / 2);
            await drawTextWithEmojis(ctx, chatLines[i].trim(), fixedX + paddingX, lineY, chatFontSize);
        }
        ctx.restore();

        ctx.fillStyle = "#727278";
        ctx.font = `22px InterRegular`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(timeStr, fixedX + bubbleW - 22, finalY + finalBubbleHeight - 38);

    } else {
        const imgBuf = imgUrl.startsWith('http') ?
            await rinDownload(imgUrl) :
            await readFile(imgUrl);
        const imgObj = await loadImage(imgBuf);

        const imgAspect = imgObj.width / imgObj.height;
        bubbleW = Math.min(Math.max(imgObj.width, minBubbleWidth), maxWidthLimit);
        let imgDrawH = Math.round(bubbleW / imgAspect);
        bubbleW = Math.max(bubbleW, timeWidth + 75);

        let captionLines = [];
        if (caption) {
            ctx.font = `${chatFontSize}px InterRegular`;
            captionLines = wrapText(ctx, caption, bubbleW - paddingX * 2, chatFontSize);
        }

        const captionH = captionLines.length > 0 ?
            paddingY + (captionLines.length * lineHeight) :
            0;
        const timeRowH = 28;
        finalBubbleHeight = imgDrawH + captionH + timeRowH + (captionLines.length > 0 ? 4 : 0);
        finalY = fixedBaseY - finalBubbleHeight;

        ctx.fillStyle = "#1c1c1e";
        ctx.beginPath();
        ctx.moveTo(fixedX + rad, finalY);
        ctx.lineTo(fixedX + bubbleW - rad, finalY);
        ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
        ctx.lineTo(fixedX + bubbleW, finalY + finalBubbleHeight - rad);
        ctx.quadraticCurveTo(fixedX + bubbleW, finalY + finalBubbleHeight, fixedX + bubbleW - rad, finalY + finalBubbleHeight);
        ctx.lineTo(fixedX + rad, finalY + finalBubbleHeight);
        ctx.quadraticCurveTo(fixedX + 8, finalY + finalBubbleHeight, fixedX + 8, finalY + finalBubbleHeight - 8);
        ctx.lineTo(fixedX + 8, finalY + rad);
        ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(fixedX + 12, finalY + finalBubbleHeight - 20);
        ctx.quadraticCurveTo(fixedX - 2, finalY + finalBubbleHeight - 4, fixedX - 8, finalY + finalBubbleHeight);
        ctx.quadraticCurveTo(fixedX + 6, finalY + finalBubbleHeight, fixedX + 22, finalY + finalBubbleHeight - 2);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fixedX + rad, finalY);
        ctx.lineTo(fixedX + bubbleW - rad, finalY);
        ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
        ctx.lineTo(fixedX + bubbleW, finalY + imgDrawH);
        ctx.lineTo(fixedX + 8, finalY + imgDrawH);
        ctx.lineTo(fixedX + 8, finalY + rad);
        ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(imgObj, fixedX, finalY, bubbleW, imgDrawH);
        ctx.beginPath();
        ctx.moveTo(fixedX + 8, finalY + imgDrawH);
        ctx.lineTo(fixedX + 8, finalY + rad);
        ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
        ctx.lineTo(fixedX + bubbleW - rad, finalY);
        ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
        ctx.lineTo(fixedX + bubbleW, finalY + imgDrawH);
        ctx.strokeStyle = "#1c1c1e";
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.restore();

        if (captionLines.length > 0) {
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.font = `${chatFontSize}px InterRegular`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            for (let i = 0; i < captionLines.length; i++) {
                const lineY = finalY + imgDrawH + paddingY + (i * lineHeight) + (chatFontSize / 2);
                await drawTextWithEmojis(ctx, captionLines[i].trim(), fixedX + paddingX, lineY, chatFontSize);
            }
            ctx.restore();
        }

        ctx.fillStyle = "#727278";
        ctx.font = `22px InterRegular`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(timeStr, fixedX + bubbleW - 22, finalY + finalBubbleHeight - timeRowH);
    }

    const emojiSize = Math.round(54 * 1.03);
    const emCardH = emojiSize + Math.round(44 * 1.03);
    const emCardW = Math.round(530 * 1.03);
    const emCardX = fixedX + 8;
    const emCardY = finalY - emCardH - 18;

    ctx.fillStyle = "#1c1c1e";
    ctx.beginPath();
    ctx.roundRect(emCardX, emCardY, emCardW, emCardH, [emCardH / 2]);
    ctx.fill();

    const startX = emCardX + 55;
    const spacingX = 76;
    const emojiCY = emCardY + (emCardH / 2) + 2;

    for (let i = 0; i < Math.min(emojiList.length, 6); i++) {
        await drawAppleEmoji(ctx, emojiList[i], startX + (i * spacingX), emojiCY, emojiSize);
    }

    ctx.fillStyle = "#8e8e93";
    ctx.font = `${Math.round(36 * 1.03)}px InterRegular`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", startX + (6 * spacingX) - 8, emCardY + (emCardH / 2) - 2);

    return await canvas.encode('png');
}

module.exports = {
  name: "IQC iPhone Chat",
  desc: "IQC iPhone quoted image generator via NAPI Canvas (text + time + image)",
  category: "Image Creator",
  path: "/api/iqc?apikey=&time=&text=&imageUrl=",
  async run(req, res) {
    const { apikey, time, text, imageUrl } = req.query;
    
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid" });
    }
    if (!time || !text) {
      return res.status(400).json({ status: false, error: "Missing time or text parameter" });
    }

    try {
      // API request to render canvas
      const buffer = await renderRinChat({ 
        text: text, 
        time: time, 
        imgUrl: imageUrl 
      });

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length
      });
      res.end(buffer);

    } catch (e) {
      console.error("IQC Canvas Error:", e.message);
      res.status(500).json({
        status: false,
        error: "Terjadi kesalahan saat generate gambar IQC: " + e.message
      });
    }
  }
};
