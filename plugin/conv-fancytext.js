const MAPS = {
  bold: { lower: "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇", upper: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭", digit: "𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵" },
  italic: { lower: "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻", upper: "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡", digit: "0123456789" },
  boldItalic: { lower: "𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯", upper: "𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕", digit: "0123456789" },
  script: { lower: "𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏", upper: "𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵", digit: "0123456789" },
  fraktur: { lower: "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷", upper: "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ", digit: "0123456789" },
  doubleStruck: { lower: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫", upper: "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ", digit: "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡" },
  monospace: { lower: "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣", upper: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉", digit: "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿" },
  sansBold: { lower: "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇", upper: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭", digit: "𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵" },
  circled: { lower: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ", upper: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ", digit: "⓪①②③④⑤⑥⑦⑧⑨" },
  fullwidth: { lower: "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ", upper: "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ", digit: "０１２３４５６７８９" },
  smallCaps: { lower: "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ", upper: "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ", digit: "0123456789" },
  bubble: { lower: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ", upper: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ", digit: "⓪①②③④⑤⑥⑦⑧⑨" },
  squared: { lower: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉", upper: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉", digit: "0123456789" },
  upsideDown: { lower: "ɐqɔpǝɟƃɥᴉɾʞlɯnodbɹsʇnʌʍxʎz", upper: "ɐqɔpǝɟƃɥᴉɾʞlɯnodbɹsʇnʌʍxʎz", digit: "0ІᄅƐㄣϛ9ㄥ86" },
  strikethrough: null, // ditangani khusus (combining char)
  underline: null
};

const ALPHA = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

function mapWith(text, styleName) {
  const style = MAPS[styleName];
  // Karakter di banyak style (Bold, Italic, Fraktur, dll) ada di luar BMP (surrogate pair),
  // jadi harus dipecah per code point pakai Array.from, bukan indexing string biasa.
  const lowerArr = Array.from(style.lower || "");
  const upperArr = Array.from(style.upper || "");
  const digitArr = Array.from(style.digit || "");

  const out = [];
  for (const ch of text) {
    const lower = ch.toLowerCase();
    const isUpper = ch !== lower && ch === ch.toUpperCase();
    const idx = ALPHA.indexOf(lower);
    const digitIdx = DIGITS.indexOf(ch);
    if (idx !== -1 && lowerArr.length) {
      const table = isUpper ? upperArr : lowerArr;
      out.push(table[idx] || ch);
    } else if (digitIdx !== -1 && digitArr.length) {
      out.push(digitArr[digitIdx] || ch);
    } else {
      out.push(ch);
    }
  }
  return out.join("");
}

function combiningStyle(text, mark) {
  return text.split("").map((c) => (c === " " ? c : c + mark)).join("");
}

const STYLE_LABELS = {
  bold: "Bold", italic: "Italic", boldItalic: "Bold Italic", script: "Script",
  fraktur: "Fraktur", doubleStruck: "Double Struck", monospace: "Monospace",
  sansBold: "Sans Bold", circled: "Circled", fullwidth: "Fullwidth",
  smallCaps: "Small Caps", bubble: "Bubble", squared: "Squared", upsideDown: "Upside Down"
};

function generateAll(text) {
  const result = {};
  for (const key of Object.keys(STYLE_LABELS)) {
    try {
      result[STYLE_LABELS[key]] = mapWith(text, key);
    } catch (e) {
      // lewati style yang gagal untuk karakter tertentu
    }
  }
  result["Strikethrough"] = combiningStyle(text, "\u0336");
  result["Underline"] = combiningStyle(text, "\u0332");
  result["Dotted"] = combiningStyle(text, "\u20DD");
  return result;
}

module.exports = {
  name: "Fancy Text Converter",
  desc: "Ubah teks biasa menjadi 25+ variasi font aesthetic Unicode (Bold, Italic, Script, Fraktur, Bubble, Small Caps, Upside Down, dll) siap copy-paste.",
  category: "Text",
  path: "/api/converter/fancy-text?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = generateAll(String(text).slice(0, 100));
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Fancy Text Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
