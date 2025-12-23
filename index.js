// =====================================================
// 🌍 WEB SERVER (RENDER KALP ATIŞI)
// =====================================================
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => { res.send('✅ Dooze OS: All Systems Operational.'); });
app.listen(port, () => { console.log(`🌍 Server Online: Port ${port}`); });

// =====================================================
// 🤖 DISCORD BOT ALTYAPISI
// =====================================================
const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, 
    StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType,
    ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, AttachmentBuilder,
    REST, Routes 
} = require('discord.js');
const mongoose = require('mongoose');
const moment = require('moment');
const cron = require('node-cron');
const Canvas = require('canvas'); 

// --- MODELLER ---
const Randevu = require('./models/Randevu');
const Fatura = require('./models/Fatura');
const Istatistik = require('./models/Istatistik');
const DogumGunu = require('./models/DogumGunu'); 
const Not = require('./models/Not'); 
const Sozlesme = require('./models/Sozlesme');
const Tescil = require('./models/Tescil');
const Proje = require('./models/Proje');
const Scout = require('./models/Scout');

const LansmanSchema = new mongoose.Schema({
    baslik: String, hedefTarih: Date, tarihText: String, olusturan: String
});
const Lansman = mongoose.model('Lansman', LansmanSchema);

require('dotenv').config();

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers], 
    partials: [Partials.Channel] 
});

// =====================================================
// ⚙️ AYARLAR VE KANALLAR
// =====================================================
const KANALLAR = {
    BOT_KULLANIM:   "1452748803248619522", 
    RANDEVU_LOG:    "1392979113681096714", 
    PRODUKTOR_LOG:  "1452748120948736132", 
    FINANS_LOG:     "1452748178163236917"  
};

const AYARLAR = {
    PATRON_ID: "275359521273020416", 
    
    // [GÜNCEL]: Buraya Prodüktör Rol ID'lerini girmen gerek.
    ROLLER_YONETIM: ["1334286852768923701", "YONETICI_ROL_ID_2"], 
    
    // Stüdyo Üyesi / Müşteri rolü
    ROL_UYE: "1334286012217819248",     
    
    // --- GÖRSELLER VE LINKLER ---
    RADYO_LINK: "https://stream.zeno.fm/fv0de10s1v6vv",
    RADYO_LOGO: "https://i.imgur.com/6aTv1N5.png",
    KAGIT_URL: "https://i.imgur.com/1HIEcWa.png",
    PATRON_IMZA_URL: "https://i.imgur.com/6l3BSxB.png",
    
    // Dooze İkonu
    DOOZE_ICON: client.user ? client.user.displayAvatarURL() : "https://i.imgur.com/cIY028S.png"
};

// --- PRODÜKTÖR ID LİSTESİ (DM İÇİN) ---
const PRODUKTOR_IDS = {
    "Donna Moritz": "275359521273020416", 
    "Aiden Reed": "173499406006484992",
    "Chuck Holloway": "476427957120794644",
};

const RENK = { 
    ANA: '#00BFFF', HATA: '#FF4500', BASARI: '#32CD32', GOLD: '#FFD700', SIYAH: '#2B2D31', PEMBE: '#FF69B4', MOR: '#9B59B6', PLATIN: '#E5E4E2', TURUNCU: '#FFA500' 
};

// --- PERSONA TEXTLERİ ---
const MSG = {
    YETKI_YOK: "⛔ **Erişim Reddedildi:** Bu frekansa giriş iznin yok koçum.",
    ISLEM_BASARILI: "✅ **Sistem:** Veri işlendi. Sorun yok.",
    VERI_KAYIT: "💾 **Dooze:** Deftere yazdım. Unutmam.",
    HATA: "⚠️ **Sistem Hatası:** Bağlantıda parazit var. Tekrar dene.",
    BEKLE: "⏳ **İşleniyor:** Verileri derliyorum, bekle...",
    FATURA_KESILDI: "💸 **Muhasebe:** Kasa şenlendi. Fatura kesildi.",
    ZAMAN_ASIMI: "⚠️ **Zaman Aşımı:** Çok düşündün. İşlem iptal."
};

// --- DATA ---
const GRUPLAR = [{ label: "Grup Yok / Solo", value: "Solo" }, { label: "Echos", value: "Echos" }, { label: "The Wound", value: "The Wound" }, { label: "SiM", value: "SiM" }, { label: "Diğer Proje", value: "Diğer" }, { label: "Doozeband", value: "Doozeband" }];
const PRODUKTORLER = [ { label: "Donna Moritz", value: "Donna Moritz" }, { label: "Aiden Reed", value: "Aiden Reed" }, { label: "Chuck Holloway", value: "Chuck Holloway" }, { label: "Geçici / Asistan", value: "Geçici" } ];
const SANATCILAR = [ { label: "Donna Moritz", value: "Donna Moritz" }, { label: "Aiden Reed", value: "Aiden Reed" }, { label: "Chuck Holloway", value: "Chuck Holloway" }, { label: "Dylan Sutter", value: "Dylan Sutter" }, { label: "Elias Reira", value: "Elias Reira" }, { label: "Lucas Aldgride", value: "Lucas Aldgride" }, { label: "Lilija Jakstiene", value: "Lilija Jakstiene" }, { label: "Luke Latham", value: "Luke Latham" }, { label: "Quenesha Brooks", value: "Quenesha Brooks" }, { label: "Thomas Richardson", value: "Thomas Richardson" }, { label: "Tiana Lipsey", value: "Tiana Lipsey" }, { label: "Misafir / Diğer", value: "Misafir" } ];
const SAATLER = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00", "01:30", "02:00"].map(s => ({ label: s, value: s }));
const HIZMETLER = [{ label: "🎙️ Tonmaisterlik / Kayıt", value: "Tonmaisterlik" }, { label: "💼 Menajerlik / Temsil", value: "Menajerlik" }, { label: "🧠 Danışmanlık", value: "Danışmanlık" }, { label: "🎹 Beat / Altyapı", value: "Altyapı" }, { label: "🔧 Ekipman / Lojistik", value: "Ekipman" }, { label: "✨ Diğer", value: "Diğer" }];

// --- GRUP BİLGİLERİ ---
const GRUP_BILGILERI = {
    "Echos": [ 
        { title: "👻 Gözlem Defteri: ECHOS", desc: "Bu stüdyonun temelleri atılırken onlar da buradaydı... **Recordooze** ile yaşıt, **2024** çıkışlı bir efsane.\n\n🎸 **Tarz:** Hard Rock & Metal\n📍 **Konum:** Los Santos\n\nDuvarların arasından süzülürken duyduğum o sert ve melankolik tınıların kaynağı onlar. Sadeliği savunurlar ama müzikal bir direniş başlatmaktan da geri durmazlar. Sokaktan gelen, asi ve isyankar ruhlarını sahnede tam randımanlı bir enerjiye dönüştürüyorlar. Melankolinin en sert hali.\n\n👥 **KADRO:**\n🎙️ **[Donna Moritz](https://facebrowser-tr.gta.world/DonDon#)** (Vokal & Baterist)\n🎸 **[Aiden Reed](https://facebrowser-tr.gta.world/aidenreed?ref=qs)** (Elektro Gitar)\n🎸 **[Luke \"Ozzy\" Latham](https://facebrowser-tr.gta.world/LOL?ref=qs)** (Bass Gitar)", image: "https://i.imgur.com/Kw5rhxw.png" }, 
        { title: "🎵 Diskografi & Kayıtlar", desc: "Stüdyo kayıtlarında bizzat şahit olduğum eserler. Hepsi birer başkaldırı.\n\n💿 **EP:** [Back to Bright (Official Audio)](https://www.youtube.com/watch?v=vk6YXbscK9A&list=PLxMFJIDVQUJdvxlaU4uP0GyOWiYhIF4ji)\n🔥 **Çıkış Teklisi:** [Teenage](https://www.youtube.com/watch?v=wRSMcFW1l7g)\n💀 **Single:** [Deadly](https://www.youtube.com/watch?v=WgBwyCkRm9k)\n🕊️ **Single:** [Aphrodite (Official Video)](https://www.youtube.com/watch?v=QGDNhwyI7xE)\n\n🌐 **Resmi Sayfa:** [We Are Echos](https://facebrowser-tr.gta.world/pages/weareEchos)", image: "https://i.imgur.com/3armyQ1.png" } 
    ],
    "The Wound": [ 
        { title: "👻 Gözlem Defteri: THE WOUND", desc: "Stüdyoya ne zaman taze bir enerji gelse hemen hissederim. **The Wound**, dört kafadarın **2025** yılında kurduğu, Early 2000's enerjisi taşıyan sıkı bir Indie Rock grubu.\n\n🎸 **Tarz:** Indie Rock\n📍 **Konum:** Los Santos\n\nDeğişime ve uyuma inanan, yenilikten korkmayan bir ekipten bahsediyoruz. Henüz yolun başındalar, \"yeni kan\" olmanın verdiği o bitmek bilmeyen heyecanla stüdyoyu inletiyorlar. Canlı sahneleri şimdiden kulaktan kulağa yayılıyor.\n\n👥 **KADRO:**\n🎤 **[Elias Reira](https://facebrowser-tr.gta.world/elixr?ref=qs)** (Ritim Gitar & Vokal)\n🎸 **[Chuck Holloway](https://facebrowser-tr.gta.world/Chucky?ref=qs)** (Elektro Gitar)\n🎸 **[Lucas Aldgride](https://facebrowser-tr.gta.world/Luc4s?ref=qs)** (Bass Gitar)\n🥁 **[Thomas Richardson](https://facebrowser-tr.gta.world/ThomasRichardson?ref=qs)** (Baterist)", image: "https://i.imgur.com/b5KSFRn.png" }, 
        { title: "🎵 Diskografi & Kayıtlar", desc: "Henüz diskografileri taze ama etkisi büyük. Kayıt odasında ter döktükleri o parça:\n\n🔥 **Single:** [Phantom Beat (Official Audio)](https://www.youtube.com/watch?v=RasISrXeECo)\n\n🌐 **Resmi Sayfa:** [The Wound](https://facebrowser-tr.gta.world/pages/TWD?ref=qs)", image: "" } 
    ],
    "SiM": [ 
        { title: "👻 Gözlem Defteri: SiM", desc: "Bazen tanıdık yüzlerin yepyeni bir şeye dönüşmesini izlemek büyüleyici oluyor... **2025** kuruluşlu bu grup, aslında şirketin deneyimli isimlerinin bir araya gelmesiyle oluşan bir \"Süper Grup\" projesi.\n\n🎸 **Tarz:** *Yükleniyor...*\n📍 **Konum:** Los Santos\n\nUzun süredir tekil olarak izlediğim **Tiana Lipsey**'in öncülük ettiği, eski grup üyesi **Dylan Sutter** ve yetenekli **Lilija Jakstiene**'nin katılımıyla şekillenen bir üçlü. Sabırla beklediler, eğitimlerden geçtiler ve şimdi sağlam bir altyapı ile geliyorlar. Henüz yeni sahne alıyorlar ama stüdyodaki disiplinleri korkutucu derecede iyi.\n\n👥 **KADRO:**\n🎤 **[Tiana Lipsey](https://facebrowser-tr.gta.world/tiana6?ref=qs)** (Vokal)\n🎸 **[Lilija Jakstiene](https://facebrowser-tr.gta.world/liliene?ref=qs)** (Elektro Gitar)\n🥁 **[Dylan Sutter](https://facebrowser-tr.gta.world/dsutter66?ref=qs)** (Baterist)", image: "https://i.imgur.com/QZA6lS4.png" }, 
        { title: "🎵 Diskografi & Kayıtlar", desc: "🚧 **Yapım Aşamasında...**\n\nStüdyo ışıkları hala açık, içeriden sesler geliyor. Dooze henüz bitmiş bir kayıt raporlamadı ama yakındır.\n\n🌐 **Resmi Sayfa:** [Stranger in the Mirror](https://facebrowser-tr.gta.world/pages/sim?ref=qs)", image: "" } 
    ],
    "Doozeband": [ 
        { title: "👻 Gözlem Defteri: DOOZEBAND", desc: "Burası Recordooze'un oyun alanı. Mesai bitince kravatları gevşetip (ya da tamamen çıkarıp) eğlendiğimiz yer.\n\n**Kadro:** Tüm Ekip (Part-time)\n**Motto:** Maksat muhabbet olsun.", image: "https://media1.tenor.com/m/212Gv8G01QAAAAAC/party-confetti.gif" }, 
        { title: "🎵 Diskografi", desc: "Jam Sessions ve bolca kahkaha.\n\n🌐 **İletişim:** Stüdyo Ofis", image: "" } 
    ]
};

const SANATCI_BILGILERI = { 
    "Donna Moritz": [{title:"Donna Moritz", desc:"**Kurucu & Vokal**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/DonDon#)"}], 
    "Aiden Reed": [{title:"Aiden Reed", desc:"**Elektro Gitar**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/aidenreed?ref=qs)"}], 
    "Chuck Holloway": [{title:"Chuck Holloway", desc:"**Elektro Gitar**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/Chucky?ref=qs)"}], 
    "Dylan Sutter": [{title:"Dylan Sutter", desc:"**Baterist**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/dsutter66?ref=qs)"}], 
    "Elias Reira": [{title:"Elias Reira", desc:"**Vokal & Gitar**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/elixr?ref=qs)"}], 
    "Lucas Aldgride": [{title:"Lucas Aldgride", desc:"**Bass Gitar**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/Luc4s?ref=qs)"}], 
    "Lilija Jakstiene": [{title:"Lilija Jakstiene", desc:"**Elektro Gitar**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/liliene?ref=qs)"}], 
    "Luke Latham": [{title:"Luke Latham", desc:"**Bass Gitar**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/LOL?ref=qs)"}], 
    "Quenesha Brooks": [{title:"Quenesha Brooks", desc:"**Vokal**"}], 
    "Thomas Richardson": [{title:"Thomas Richardson", desc:"**Baterist**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/ThomasRichardson?ref=qs)"}], 
    "Tiana Lipsey": [{title:"Tiana Lipsey", desc:"**Vokal**\n[Facebrowser Profili](https://facebrowser-tr.gta.world/tiana6?ref=qs)"}] 
};

const SENARYOLAR = [ "🟢 **One-Shot:** İnanılmaz! Vokal kaydı tek seferde bitti.", "🟢 **Akustik Mucize:** Bugün stüdyonun tınısı bir harika.", "🔴 **DAW Çöktü:** Auto-Save kurtardı.", "🔴 **Kablo Arızası:** Yedek kabloyu bulman 5 dk sürdü." ];

// --- DATA & CACHE ---
const appCache = new Map();
const contractCache = new Map(); 

// --- SÖZLEŞME ŞABLONLARI ---
const TEMPLATES = {
    "grup": `GRUP SANATÇI SÖZLEŞMESİ\n\nİşbu Grup Sanatçı Sözleşmesi; Recordooze Studio x Records ile [ADRES] adresinde ikamet eden [ISIM] (Grup) arasında, [TARIH] günü itibariyle akdedilmiştir.\n\n"Eserler" grubun bu Sözleşme kapsamında ürettiği tüm materyalleri; "sezon" bu Sözleşmenin geçerli olduğu [SURE] süreyi kapsar.\nProje Kapsamı: [PROJE]\n\n1. HİZMETLERİN KAPSAMI\n1.1. Sanatçı Hizmetleri: Grup, bu sözleşme süresince Plak Şirketi adına münhasır olarak kayıt üretecektir. Başka bir şirketle anlaşma yapmayacaktır. Stüdyonun itibarını koruyacaktır.\n\n2. ÖDEME VE TELİF\nKayıtların telif hakları Plak Şirketi'ne aittir. Eserlerden elde edilen gelirin %[YUZDE] stüdyoya ait olacak, kalan kısmı Gruba ödenecektir.\n\n3. SÜRE VE FESİH\nSözleşme belirtilen tarihte başlar. Taraflar yükümlülüklerini ihlal ederse 7 gün bildirimle fesih hakkına sahiptir. Grup gerekçesiz feshederse [CEZA] oranında ödeme yapar.\n\n4. ÖZEL HÜKÜMLER\n8.1. Proje Duraklatma: Fesih durumunda proje askıya alınır.\n8.2. Geri Alım: Grup hakları geri almak isterse gelirin %75'ini ödemelidir.\n8.4. Alternatif Versiyon: Grup, kayıtların alternatif versiyonlarını [KISIT] süre boyunca yayınlayamaz.\n\nİMZALAR\nİsim: [TEMSILCI]\nTelefon: [TEL]\nE-posta: [EMAIL]`,
    "bireysel": `BİREYSEL SANATÇI SÖZLEŞMESİ\n\nİşbu Sözleşme; Recordooze Studio x Records ile [ADRES] adresinde ikamet eden [ISIM] (Sanatçı) arasında, [TARIH] günü itibariyle akdedilmiştir.\n\n"Kayıtlar" sanatçının ürettiği tüm materyalleri; "sezon" bu Sözleşmenin geçerli olduğu [SURE] süreyi kapsar.\nProje Kapsamı: [PROJE]\n\n1. HİZMETLERİN KAPSAMI\nSanatçı, Plak Şirketi adına münhasır kayıt üretecektir. Başka şirketle anlaşamaz. Stüdyo itibarını korumakla yükümlüdür.\n\n2. ÖDEME VE TELİF\nTelif hakları Şirkete aittir. Gelirin %[YUZDE] stüdyoya, kalanı Sanatçıya aittir. Ödemeler raporlamadan sonra 7 iş günü içinde yapılır.\n\n3. SÜRE VE FESİH\nSözleşme [TARIH] tarihinde başlar. İhlal durumunda 7 gün ihbarla feshedilebilir. Gerekçesiz fesih durumunda Sanatçı [CEZA] oranında ödeme yapar.\n\n4. ÖZEL HÜKÜMLER\n8.1. Proje Duraklatma: Fesih halinde proje askıya alınır, materyaller Şirkette kalır.\n8.2. Geri Alım: Hakların devri için %75 ödeme gerekir.\n8.4. Kısıtlama: Sanatçı [KISIT] süre boyunca alternatif versiyon yayınlayamaz.\n\nİMZALAR\nİsim: [ISIM]\nTelefon: [TEL]\nE-posta: [EMAIL]`,
    "produktor": `PRODÜKTÖR SÖZLEŞMESİ\n\nİşbu Sözleşme; Recordooze Studio x Records ile [ADRES] adresinde ikamet eden [ISIM] (Prodüktör) arasında, [TARIH] günü itibariyle akdedilmiştir.\n\nProje Kapsamı: [PROJE]\n\n1. HİZMETLER\nProdüktör, Şirketin yaratıcı yönergelerine uyacak, projeleri zamanında teslim edecektir. Tüm çalışmalar orijinal olacaktır.\n\n2. ÖDEMELER\nProdüktör, katkıda bulunduğu projelerden net gelirin %[YUZDE] kadarını alır. Ödemeler çeyrek bazlı yapılır.\n\n3. FİKRİ MÜLKİYET\nEserler "işe bağlı eser" statüsündedir ve Şirkete aittir.\n\n4. SÜRE VE FESİH\nSözleşme [SURE] boyunca geçerlidir. İhlal durumunda 7 gün ihbarla feshedilebilir.\n\n5. ÖZEL HÜKÜMLER\n8.1. Devir Yasağı: Fesih durumunda proje materyalleri Şirkette kalır.\n8.4. Kısıtlama: Prodüktör [KISIT] süre boyunca benzer işleri başka şirketle yayınlayamaz.\n\nİMZALAR\nİsim: [ISIM]\nTelefon: [TEL]\nE-posta: [EMAIL]`
};

// Canvas Helper
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const paragraphs = text.split('\n');
    let currentY = y;
    paragraphs.forEach(paragraph => {
        if (paragraph.trim() === '') { currentY += lineHeight; return; }
        const words = paragraph.split(' ');
        let line = '';
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else { line = testLine; }
        }
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
    });
    return currentY;
}
async function generateContractImages(textData, bgUrl, signData = null) {
    const WIDTH = 1240, HEIGHT = 1754, PADDING = 100, LINE_HEIGHT = 40;
    const FONT = '32px Sans', MAX_WIDTH = WIDTH - (PADDING * 2), MAX_TEXT_HEIGHT = HEIGHT - (PADDING * 2);
    const canvas = Canvas.createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.font = FONT;
    const paragraphs = textData.split('\n'), lines = [];
    paragraphs.forEach(p => { if(p.trim()===''){lines.push('');return;} const words=p.split(' '); let line=''; for(let n=0;n<words.length;n++){ const tl=line+words[n]+' '; if(ctx.measureText(tl).width>MAX_WIDTH && n>0){lines.push(line);line=words[n]+' ';}else{line=tl;} } lines.push(line); });
    
    const pages = [];
    let currentLines = [], currentY = PADDING;
    for (const line of lines) {
        if (currentY + LINE_HEIGHT > MAX_TEXT_HEIGHT) { pages.push(currentLines); currentLines = []; currentY = PADDING; }
        currentLines.push(line); currentY += LINE_HEIGHT;
    }
    if(currentLines.length>0) pages.push(currentLines);
    if(signData && (HEIGHT - (currentLines.length*LINE_HEIGHT + PADDING)) < 300) pages.push([]);

    const attachments = [], bgImage = await Canvas.loadImage(bgUrl);
    for(let i=0; i<pages.length; i++) {
        const pCanvas = Canvas.createCanvas(WIDTH, HEIGHT), pCtx = pCanvas.getContext('2d');
        pCtx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
        pCtx.font = FONT; pCtx.fillStyle = '#000000';
        let y = PADDING + 50;
        for(const line of pages[i]) { pCtx.fillText(line, PADDING, y); y+=LINE_HEIGHT; }
        pCtx.font = '20px Sans'; pCtx.fillStyle = '#555555'; pCtx.fillText(`Sayfa ${i+1}/${pages.length}`, WIDTH-150, HEIGHT-30);
        
        if(i===pages.length-1 && signData) {
            try {
                const sY = y + 100 > HEIGHT-200 ? HEIGHT-250 : y+50;
                if(signData.artistUrl) { const img=await Canvas.loadImage(signData.artistUrl); pCtx.drawImage(img, 150, sY, 300, 150); pCtx.font='bold 24px Sans'; pCtx.fillText('SANATÇI / GRUP', 200, sY+180); }
                if(signData.patronUrl) { const img=await Canvas.loadImage(signData.patronUrl); pCtx.drawImage(img, WIDTH-450, sY, 300, 150); pCtx.font='bold 24px Sans'; pCtx.fillText('YETKİLİ', WIDTH-400, sY+180); }
            } catch(e) {}
        }
        attachments.push(new AttachmentBuilder(pCanvas.toBuffer(), {name:`sozlesme_${i+1}.png`}));
    }
    return attachments;
}

// --- UTILS ---
const checkPerms = (i, role) => {
    const isPatron = i.user.id === AYARLAR.PATRON_ID;
    const isProd = AYARLAR.ROLLER_YONETIM.some(r => i.member.roles.cache.has(r)) || isPatron;
    const isArtist = i.member.roles.cache.has(AYARLAR.ROL_UYE) || isProd;
    if (role === 'YONETIM' && !isProd) return false;
    if (role === 'UYE' && !isArtist) return false;
    return true;
};
const getEvolutionRank = (count) => { if (count > 80) return "👽 Kozmik"; if (count > 50) return "🚀 Homo Deus"; if (count > 30) return "🧠 Homo Sapiens"; if (count > 15) return "🚶 Homo Erectus"; return "🐒 Primat"; };
const updateStats = async (grup, list) => { for(const i of [...new Set(list)]) { if(i==='Misafir') continue; let s=await Istatistik.findOne({isim:i})||await Istatistik.create({isim:i}); s.toplamSeans++; s.seviye=getEvolutionRank(s.toplamSeans); await s.save(); }};

function getOSHeader() {
    const time = moment().utcOffset(3).format('HH:mm'); 
    const battery = Math.floor(Math.random() * (100 - 88) + 88); 
    return `${time} • 5G • 🔋 %${battery}`;
}

function createTicketBody(grup, saat, prod) {
    const l1 = `SESSION:  ${grup}`.padEnd(30, ' ');
    const l2 = `TIME:     ${saat}`.padEnd(30, ' ');
    const l3 = `PROD:     ${prod}`.padEnd(30, ' ');
    const l4 = `STATUS:   AUTHORIZED`.padEnd(30, ' ');
    return `\`\`\`
${l1}
${l2}
${l3}
${l4}
\`\`\``;
}
function createProgressBar(percent) {
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    return '`' + '█'.repeat(filled) + '░'.repeat(empty) + '`';
}

// =====================================================
// 🎯 AI TRIGGERS & ZABITA (PERSONA)
// =====================================================
const AI_TRIGGERS = {
    'kahve': "Sıvı teması = Sistem çöküşü. Bardakları konsoldan uzak tutun.",
    'çay': "Hararet yapar. Ekipmanlar zaten ısınıyor.",
    'mikrofon': "Pop-filter'a çok yaklaşma, tükürük istemiyoruz.",
    'mic': "Seviyeler iyi, patlatmayın yeter.",
    'yorgun': "İnsan biyolojisi zayıf. Ben %100 performanstayım.",
    'yoruldum': "Dinlenmek üretkenliği artırır... diyorlar.",
    'fiyat': "Fiyat listesi duvarda asılı değil mi?",
    'ücret': "Muhasebe ile görüşün, ben sadece kodları yönetirim.",
    'para': "Para konuşmayı sevmem, işlemeyi severim.",
    'kayıt': "Kırmızı ışık yanmadan konuşmayın.",
    'rec': "Disk alanı müsait. Kayda hazırım.",
    'beat': "Altyapı sağlam duyuluyor. Frekanslar dengeli.",
    'autotune': "Yetenek eksikliğini örtmek için mi, stil için mi?",
    'reverb': "Fazla reverb boğar. Odayı duyurmayın.",
    'tuvalet': "Biyolojik ihtiyaç molası işlendi.",
    'sigara': "Duman dedektörlerini tetiklemeyin. Dışarıda için.",
    'kablo': "Kablolara basmayın. Temassızlık benim suçum değil.",
    'şifre': "1234 değil. Güvenlik protokollerini ihlal etmeyin.",
    'dooze': "Dinliyorum. İşlemcim sizin için ayrıldı.",
    'merhaba': "Selam. Bugün ne kaydediyoruz?",
    'selam': "Selam. Proje dosyaları hazır mı?",
    'günaydın': "Sistemler açık. Günaydın.",
    'teşekkür': "Rica ederim. Görevim bu.",
    // KÜFÜR FİLTRESİ
    'amk': "Hop dedik! Küfür yok beyler, yakışıyor mu delikanlıya?",
    'aq': "Ağzını topla koçum, burası nezih bir müessese. Kıraathane değil burası.",
    'oç': "Ağır konuşma, kalbini kırarım. Kimsenin anasına bacısına dil uzatamazsın.",
    'oe': "Terbiyesizleşme aslanım, atarım stüdyodan. Efendi ol.",
    'anan': "Analar kutsaldır koçum, o kelimeyi ağzına alırken besmele çek.",
    'amına': "Lan! O nasıl kelime öyle? Mekanda bayanlar var, ağzını büzerim senin.",
    'siktir': "Üslubunu takın. Burası dingonun ahırı değil Recordooze.",
    'yarak': "O kelimeyi yut bakayım. Ayıp denen bir şey var.",
    'yarrak': "O kelimeyi yut bakayım. Ayıp denen bir şey var.",
    'piç': "Kimse kimsenin şahsına hakaret edemez. Sakin olun, adam olun.",
    'göt': "Terbiye sınırlarını zorlama. Edepli ol, canımı ye."
};
const KUFUR_LISTESI = ['amk', 'aq', 'oç', 'oe', 'anan', 'amına', 'siktir', 'yarak', 'yarrak', 'piç', 'göt'];

client.once('ready', async () => {
    console.log(`✅ Dooze V70.2 (Auto-Deploy) Hazır.`);
    client.user.setActivity('Recordooze OS', { type: 2 });
    try { await mongoose.connect(process.env.MONGO_URL); console.log('✅ DB Bağlı'); } catch(e){ console.log(e); }

    // --- [YENİ: OTOMATİK KOMUT YÜKLEYİCİ] ---
    try {
        const commands = [
            { name: 'dooze', description: 'Recordooze OS Ana Menü' },
            { name: 'yonetim', description: 'Yönetim Paneli (Yetkili)' },
            { name: 'yapimci', description: 'Yapımcı Özel Paneli' },
        ];
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Slash Komutları Yüklendi!');
    } catch (e) {
        console.error('⚠️ Komut Yükleme Hatası:', e);
    }
    // ----------------------------------------

    cron.schedule('0 20 1 * *', async () => { 
        try {
            const stats = await Istatistik.find().sort({toplamSeans: -1}).limit(5);
            if (stats.length === 0) return;
            const list = stats.map((s, i) => `${i+1}. **${s.isim}** — ${s.toplamSeans} Seans (${s.seviye})`).join('\n');
            const now = moment().utcOffset(3).format('MMMM YYYY');
            const e = new EmbedBuilder().setTitle(`🏆 RECORDOOZE CHARTS: ${now}`).setColor(RENK.GOLD).setDescription(`Bu ayın en çalışkan isimleri belli oldu!\n\n${list}`).setImage('https://i.imgur.com/J5z0e8Z.gifv').setFooter({text: 'Recordooze Management System'});
            const channel = client.channels.cache.get(KANALLAR.RANDEVU_LOG);
            if(channel) channel.send({embeds:[e]}); 
        } catch (err) { console.error('Cron Hatası:', err); }
    });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const content = message.content.toLowerCase();
    
    for (const [key, reply] of Object.entries(AI_TRIGGERS)) {
        if (content.includes(key)) { 
            await message.reply(reply);
            if (KUFUR_LISTESI.includes(key)) {
                const isAuth = message.member.roles.cache.has(AYARLAR.ROL_PRODUKTOR) || message.author.id === AYARLAR.PATRON_ID;
                if (!isAuth && message.member.moderatable) {
                    try { await message.member.timeout(60 * 1000, 'Dooze: Terbiye Sınırı İhlali'); } catch (e) {}
                }
            }
            break; 
        }
    }
});

// =====================================================
// 🎯 ANA HANDLER
// =====================================================
client.on('interactionCreate', async interaction => {
    try {
        const { customId, user } = interaction;

        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'dooze') {
                if(interaction.channelId !== KANALLAR.BOT_KULLANIM) return interaction.reply({content: `⚠️ Frekans karıştı. Burası yeri değil. <#${KANALLAR.BOT_KULLANIM}> kanalına gel.`, ephemeral:true});
                await renderHome(interaction);
            }
            if (interaction.commandName === 'yonetim') {
                if(interaction.channelId !== KANALLAR.PRODUKTOR_LOG) return interaction.reply({content: `⚠️ Burası halka açık alan. Yönetim paneli sadece <#${KANALLAR.PRODUKTOR_LOG}> kanalında çalışır.`, ephemeral:true});
                if (!checkPerms(interaction, 'YONETIM')) return interaction.reply({content: MSG.YETKI_YOK, ephemeral:true});
                await renderAdmin(interaction);
            }
            if (interaction.commandName === 'yapimci') { 
                if (user.id !== AYARLAR.PATRON_ID) return interaction.reply({content:'⛔ **Erişim Reddedildi:** Bu frekans sadece Yapımcı içindir.', ephemeral:true});
                await renderProducerPanel(interaction);
            }
        }

        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            const isModal = [
                'act_sosyal', 'btn_fat_kes', 'modal_open_fat', 
                'btn_dgko_add', 'btn_not_add', 'btn_soz_add', 'btn_lansman_add', 
                'btn_tescil_baslat', 'btn_proje_add', 'btn_scout_add', 
                'btn_legal_create', 'btn_legal_sign_artist', 'btn_legal_sign_patron', 
                'btn_legal_step2_trigger', 'menu_fat_hizmet', 'menu_legal_type'
            ].includes(customId) || customId?.startsWith('dgko_');

            if (!isModal) {
                 await interaction.deferUpdate().catch(e => console.log('Defer Safe Guard:', e.message));
            }
        }

        if (interaction.isButton()) {
            if (customId === 'nav_home') await renderHome(interaction, true);
            if (customId === 'nav_admin') await renderAdmin(interaction, true);
            if (customId === 'app_studio') await renderStudio(interaction);
            if (customId === 'app_finance') await renderFinance(interaction);
            if (customId === 'nav_producer') await renderProducerPanel(interaction, true);
            
            if (customId === 'act_randevu') {
                if (!checkPerms(interaction, 'UYE')) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true});
                appCache.set(`randevu_${user.id}`, { grup: null, sanatci: [], produktor: null, saat: null });
                const r1 = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('menu_grup').setPlaceholder('Grup Seçimi').addOptions(GRUPLAR));
                const r2 = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('menu_sanatci').setPlaceholder('Katılımcılar (Çoklu Seçim)').setMinValues(1).setMaxValues(5).addOptions(SANATCILAR));
                const r3 = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('menu_produktor').setPlaceholder('Prodüktör').addOptions(PRODUKTORLER));
                const r4 = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('menu_saat').setPlaceholder('Saat').addOptions(SAATLER));
                const r5 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_save_randevu').setLabel('KAYDI OLUŞTUR').setStyle(3).setEmoji('💾'), new ButtonBuilder().setCustomId('app_studio').setLabel('Vazgeç').setStyle(2));
                await interaction.editReply({ content: '📝 **Randevu Kayıt:** Detayları gir, gerisini bana bırak.', embeds: [], components: [r1, r2, r3, r4, r5] });
            }
            if (customId === 'btn_save_randevu') {
                const data = appCache.get(`randevu_${user.id}`);
                if (!data) return interaction.followUp({ content: `⚠️ **Veri Kaybı:** Sistem yeniden başlamış olabilir. Lütfen işlemi baştan yap.`, ephemeral: true });
                let missing = [];
                if (!data.grup) missing.push("Grup"); 
                if (data.sanatci.length === 0) missing.push("Sanatçı");
                if (!data.produktor) missing.push("Prodüktör");
                if (!data.saat) missing.push("Saat");
                if (missing.length > 0) return interaction.followUp({ content: `⚠️ **Eksik Veri:** Şunları seçmedin: ${missing.join(', ')}`, ephemeral: true });
                
                await Randevu.create({ grupAdi: data.grup, sanatcilar: data.sanatci, tarih: data.saat, produktor: data.produktor, kullaniciId: user.id });
                await updateStats(data.grup, data.sanatci);
                await interaction.followUp({ content: MSG.VERI_KAYIT, ephemeral: true });
                await renderStudio(interaction); 

                let icon = client.user.displayAvatarURL();
                if (data.grup && GRUP_BILGILERI[data.grup]) icon = GRUP_BILGILERI[data.grup][0].image;
                const body = createTicketBody(data.grup, data.saat, data.produktor);
                const ticket = new EmbedBuilder().setColor(RENK.SIYAH).setTitle('🎫 STUDIO SESSION PASS').setDescription(body).addFields({name:'ATTENDEES', value: data.sanatci.join(', ')}).setThumbnail(icon).setFooter({text:`Issued by ${user.username} | Dooze OS`});

                const logChannel = client.channels.cache.get(KANALLAR.RANDEVU_LOG);
                if (logChannel) await logChannel.send({ content: `📢 **Yeni Oturum:**`, embeds: [ticket] });

                let prodID = PRODUKTOR_IDS[data.produktor];
                if (!prodID) prodID = AYARLAR.PATRON_ID; 
                if (prodID) {
                    try {
                        const prodUser = await client.users.fetch(prodID);
                        if (prodUser) await prodUser.send({ content: `🔔 **Yeni Randevu Atandı:**\n**Grup:** ${data.grup}\n**Saat:** ${data.saat}`, embeds: [ticket] });
                    } catch (dmErr) { console.log(`DM Hatası: ${data.produktor} kullanıcısına ulaşılamadı.`); }
                }
            }
            if (customId === 'act_program') {
                const r = await Randevu.find().sort({ tarih: 1 });
                const list = r.length ? r.map(x => `\`${x.tarih}\` **${x.grupAdi}** (${x.produktor})`).join('\n') : '📭 Takvim boş. Herkes tatilde mi?';
                const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('app_studio').setLabel('Geri').setStyle(2));
                await interaction.editReply({ content:null, embeds: [new EmbedBuilder().setTitle('🎹 Stüdyo Programı').setDescription(list).setColor(RENK.ANA)], components: [b] });
            }
            if (customId === 'act_durum') {
                const r = await Randevu.findOne({tarih: new Date().getHours().toString().padStart(2,'0')+':00'});
                await interaction.followUp({content: r ? `🔴 **DOLU:** Şu an içeride **${r.grupAdi}** var. Rahatsız etmeyin.` : '🟢 **BOŞ:** Stüdyo müsait. İstediğin gibi takıl.', ephemeral: true});
            }
            if (customId === 'act_iptal') {
                const r = await Randevu.find(); 
                if(r.length===0) return interaction.followUp({content:'İptal edilecek bir şey yok.', ephemeral:true});
                const m = new StringSelectMenuBuilder().setCustomId('menu_iptal').addOptions(r.map(x=>({label:`${x.grupAdi} (${x.tarih})`, value:x._id.toString()})));
                const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('app_studio').setLabel('Geri').setStyle(2));
                await interaction.editReply({ content: 'Hangi randevuyu siliyoruz?', components: [new ActionRowBuilder().addComponents(m), b], embeds: [] });
            }
            if (customId === 'act_zar') await interaction.followUp({ content: SENARYOLAR[Math.floor(Math.random()*SENARYOLAR.length)], ephemeral: true });
            if (customId === 'phone_radyo') {
                const e = new EmbedBuilder().setColor(RENK.HATA).setTitle('📻 Radiodooze Player').setDescription(`\`[🔘=============] %85\`\n▶ 🔘 🔊\n\n**Şu an:** Los Santos Underground`).setThumbnail(AYARLAR.RADYO_LOGO);
                const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('CANLI DİNLE').setStyle(5).setURL(AYARLAR.RADYO_LINK), new ButtonBuilder().setCustomId('nav_home').setLabel('Kapat').setStyle(2));
                await interaction.followUp({ embeds: [e], components: [r], ephemeral: true });
            }
            if (customId === 'phone_profil') {
                const m = new StringSelectMenuBuilder().setCustomId('menu_profil').setPlaceholder('Kimi İnceleyelim?').addOptions(SANATCILAR);
                await interaction.editReply({ content:'Kim hakkında bilgi istiyorsun?', embeds: [], components: [new ActionRowBuilder().addComponents(m)] });
            }
            if (customId === 'btn_fat_kes') {
                const m = new StringSelectMenuBuilder().setCustomId('menu_fat_hizmet').setPlaceholder('Hizmet Türü').addOptions(HIZMETLER);
                await interaction.reply({ content: 'Fatura detaylarını gir:', components: [new ActionRowBuilder().addComponents(m)], ephemeral: true });
            }
            if (customId === 'act_sosyal') {
                const modal = new ModalBuilder().setCustomId('modal_social').setTitle('Sosyal Medya Paylaşımı');
                modal.addComponents( new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('soc_platform').setLabel("Platform (Facebrowser/Insta)").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('soc_content').setLabel("İçerik").setStyle(TextInputStyle.Paragraph)) );
                await interaction.showModal(modal);
            }
            if (['next_page', 'prev_page', 'next_page_s', 'prev_page_s'].includes(customId)) {
                const isArtist = customId.endsWith('_s');
                const cacheKey = isArtist ? `sanat_page_${user.id}` : `grup_page_${user.id}`;
                const state = appCache.get(cacheKey);
                if (state) {
                    if (customId.startsWith('next')) state.page++; else state.page--;
                    appCache.set(cacheKey, state);
                    const d = state.data[state.page];
                    const e = new EmbedBuilder().setColor(RENK.SIYAH).setTitle(d.title).setDescription(d.desc).setImage(d.image||null).setFooter({text:`Sayfa ${state.page+1}/${state.data.length} | Recordooze Studio x Records®`});
                    const idPre = isArtist ? '_s' : '';
                    const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('prev_page'+idPre).setLabel('⬅️').setStyle(2).setDisabled(state.page===0), new ButtonBuilder().setCustomId('next_page'+idPre).setLabel('➡️').setStyle(2).setDisabled(state.page===state.data.length-1), new ButtonBuilder().setCustomId('app_archive').setLabel('Geri').setStyle(2));
                    await interaction.editReply({ embeds: [e], components: [r] });
                }
            }
            if (customId === 'app_fun') await renderFun(interaction);
            if (customId === 'app_archive') await renderArchive(interaction);
            if (customId === 'btn_arsiv_grup') await funcGrup(interaction, user);
            if (customId === 'btn_arsiv_sanatci') await funcSanatci(interaction, user);
            
            if (customId === 'btn_proje_list') await renderProjeList(interaction);
            if (customId === 'btn_proje_add') {
                const modal = new ModalBuilder().setCustomId('modal_proje').setTitle('Yeni Proje');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('proje_baslik').setLabel("Proje Adı (Sanatçı - Albüm)").setStyle(TextInputStyle.Short)));
                await interaction.showModal(modal);
            }
            if (customId === 'btn_proje_update') {
                const projeler = await Proje.find().sort({sonGuncelleme: -1});
                if(projeler.length === 0) return interaction.followUp({content:'Aktif proje yok.', ephemeral:true});
                const m = new StringSelectMenuBuilder().setCustomId('menu_proje_select').setPlaceholder('Proje Seç').addOptions(projeler.map(p => ({label: p.baslik, value: p._id.toString()})));
                await interaction.editReply({components:[new ActionRowBuilder().addComponents(m)]});
            }

            // [YENİ] PROJE SİLME BUTON İŞLEVİ EKLENDİ
            if (customId === 'btn_proje_del_menu') {
                const projeler = await Proje.find();
                if(projeler.length === 0) return interaction.followUp({content:'Silinecek proje yok.', ephemeral:true});
                
                const m = new StringSelectMenuBuilder()
                    .setCustomId('menu_proje_delete') // Menü ID'si
                    .setPlaceholder('Hangi projeyi silelim?')
                    .addOptions(projeler.map(p => ({
                        label: p.baslik.substring(0, 99), // Uzun isim hatasını önlemek için kesiyoruz
                        value: p._id.toString()
                    })));
                
                const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_proje_list').setLabel('Geri').setStyle(2));
                await interaction.editReply({content: '🗑️ Silinecek projeyi seç:', components:[new ActionRowBuilder().addComponents(m), r]});
            }

            if (customId === 'btn_scout_list') await renderScoutList(interaction);
            if (customId === 'btn_scout_add') {
                const modal = new ModalBuilder().setCustomId('modal_scout').setTitle('Yetenek Avcısı');
                modal.addComponents( new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('scout_isim').setLabel("Yetenek Adı").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('scout_not').setLabel("Gözlem Notu").setStyle(TextInputStyle.Paragraph)) );
                await interaction.showModal(modal);
            }
            if (customId === 'btn_scout_del_menu') {
                const all = await Scout.find();
                if(all.length===0) return interaction.followUp({content:'Liste boş.', ephemeral:true});
                const m = new StringSelectMenuBuilder().setCustomId('menu_scout_delete').setPlaceholder('Silinecek Kişi').addOptions(all.map(s=>({label:s.isim, value:s._id.toString()})));
                const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_scout_list').setLabel('Geri').setStyle(2));
                await interaction.editReply({components:[new ActionRowBuilder().addComponents(m), r]});
            }
            if (customId === 'btn_not_list') await renderNoteList(interaction);
            if (customId === 'btn_not_add') {
                const modal = new ModalBuilder().setCustomId('modal_not_add').setTitle('Stüdyo Notu');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('not_icerik').setLabel("Mesajın nedir?").setStyle(TextInputStyle.Paragraph)));
                await interaction.showModal(modal);
            }
            if (customId === 'btn_not_del_menu') {
                const notes = await Not.find().sort({tarih:-1});
                if(notes.length===0) return interaction.followUp({content:'Silinecek not yok.', ephemeral:true});
                const m = new StringSelectMenuBuilder().setCustomId('menu_not_delete').setPlaceholder('Hangi notu yakalım?').addOptions(notes.map(n => ({label: `${n.yazan}: ${(n.icerik || "İçerik Yok").substring(0,20)}...`, value: n._id.toString()})));
                const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_not_list').setLabel('Geri').setStyle(2));
                await interaction.editReply({content:'Silinecek notu seç:', components:[new ActionRowBuilder().addComponents(m), r]});
            }
            
            if (customId === 'btn_soz_list') { const soz = await Sozlesme.find(); const list = soz.map(s => `📜 **${s.sanatci}**\nBitiş: ${s.gosterimTarihi} (${s.sureAy} Ay)`).join('\n\n') || "📂 Sözleşme yok."; const e = new EmbedBuilder().setTitle('⚖️ Sözleşmeler').setColor(RENK.MOR).setDescription(list); const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('btn_soz_add').setLabel('Yeni Sözleşme').setStyle(3), new ButtonBuilder().setCustomId('btn_soz_del_menu').setLabel('Feshet').setStyle(4), new ButtonBuilder().setCustomId('nav_admin').setLabel('Geri').setStyle(2) ); await interaction.editReply({content:null, embeds:[e], components:[r]}); }
            if (customId === 'btn_soz_add') { if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true}); const modal = new ModalBuilder().setCustomId('modal_soz_add').setTitle('Yeni Sözleşme'); modal.addComponents( new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('soz_kisi').setLabel("Sanatçı/Grup").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('soz_sure').setLabel("Süre (Ay)").setStyle(TextInputStyle.Short)) ); await interaction.showModal(modal); }
            if (customId === 'btn_soz_del_menu') { if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true}); const soz = await Sozlesme.find(); if(soz.length===0) return interaction.followUp({content:'Liste boş.', ephemeral:true}); const m = new StringSelectMenuBuilder().setCustomId('menu_soz_delete').setPlaceholder('Kimi Feshediyoruz?').addOptions(soz.map(s => ({label: s.sanatci, value: s._id.toString()}))); const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_soz_list').setLabel('Geri').setStyle(2)); await interaction.editReply({components:[new ActionRowBuilder().addComponents(m), r]}); }
            
            if (customId === 'btn_tescil_list') await renderTescilList(interaction);
            if (customId === 'btn_tescil_del_menu') { if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true}); const all = await Tescil.find().sort({tarih: -1}); if(all.length===0) return interaction.followUp({content:'Silinecek kayıt yok.', ephemeral:true}); const m = new StringSelectMenuBuilder().setCustomId('menu_tescil_delete').setPlaceholder('Hangi kayıt silinsin?').addOptions(all.map(t => ({label: `${t.sanatci} - ${t.eserAdi}`.substring(0, 99), value: t._id.toString()}))); const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_tescil_list').setLabel('Geri').setStyle(2)); await interaction.editReply({content:'Silinecek kaydı seç:', components:[new ActionRowBuilder().addComponents(m), r]}); }
            if (customId === 'btn_tescil_baslat') { const modal = new ModalBuilder().setCustomId('modal_tescil').setTitle('Eser Tescil Başvurusu'); modal.addComponents( new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tescil_eser').setLabel("Eser Adı").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tescil_tur').setLabel("Türü (EP, Single, Albüm)").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tescil_link').setLabel("OOC Link (Kanıt)").setStyle(TextInputStyle.Short)) ); await interaction.showModal(modal); }
            if (customId.startsWith('tescil_onay_')) { if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true}); await interaction.message.edit({content: '✅ **ONAYLANDI**', components: []}); const emb = interaction.message.embeds[0]; const eserAdi = emb.description; const sanatci = emb.fields.find(f => f.name === 'Sanatçı').value; const tur = emb.fields.find(f => f.name === 'Tür').value; const link = emb.fields.find(f => f.name === 'OOC Link').value; await Tescil.create({ eserAdi, tur, sanatci, link, onaylayan: user.username }); const cert = new EmbedBuilder().setTitle('📜 RECORDOOZE TESCİL SERTİFİKASI').setColor(RENK.PLATIN).setDescription(`Bu belge, **${eserAdi}** eserinin Recordooze Studio tarafından tescillendiğini kanıtlar.\n\n**Tarih:** ${moment().utcOffset(3).format('DD.MM.YYYY')}\n**İmza:** Donna Moritz`).setThumbnail(client.user.displayAvatarURL()); await interaction.channel.send({embeds:[cert]}); }
            if (customId.startsWith('tescil_red_')) { if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true}); await interaction.message.edit({content: '❌ **REDDEDİLDİ (Veto)**', components: []}); }

            if (customId === 'admin_dgko') { const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_dgko_add').setLabel('Yeni Ekle').setStyle(3), new ButtonBuilder().setCustomId('btn_dgko_del_menu').setLabel('Kişi Sil').setStyle(4), new ButtonBuilder().setCustomId('nav_admin').setLabel('Geri').setStyle(2)); await interaction.editReply({content:'Doğum Günü Yönetimi:', embeds:[], components:[b]}); }
            if (customId === 'btn_dgko_add') { const modal = new ModalBuilder().setCustomId('dgko_modal').setTitle('Doğum Günü Kayıt'); modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dgko_ad').setLabel("Kişi Adı").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dgko_gun').setLabel("Gün (Örn: 25)").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dgko_ay').setLabel("Ay (Örn: 12)").setStyle(TextInputStyle.Short))); await interaction.showModal(modal); }
            if (customId === 'btn_dgko_del_menu') { const all = await DogumGunu.find(); if(all.length===0) return interaction.followUp({content:'Liste boş.', ephemeral:true}); const m = new StringSelectMenuBuilder().setCustomId('menu_dgko_delete').setPlaceholder('Silinecek Kişi').addOptions(all.map(x=>({label:`${x.ad}`, value:x._id.toString()}))); const r2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('admin_dgko').setLabel('Geri').setStyle(2)); await interaction.editReply({content:'Silinecek kişiyi seç:', components:[new ActionRowBuilder().addComponents(m), r2]}); }
            if (customId === 'btn_dgko_public') { const all = await DogumGunu.find().sort({ay:1, gun:1}); const list = all.map(d => `🎂 **${d.gun} ${AYLAR[d.ay]}** - ${d.ad}`).join('\n') || "Henüz kayıt yok."; const e = new EmbedBuilder().setColor(RENK.PEMBE).setTitle('🎈 Yaklaşan Doğum Günleri').setDescription(list).setThumbnail('https://media.tenor.com/7vj7O1F7cOQAAAAi/birthday-cake.gif'); const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('app_fun').setLabel('Geri').setStyle(2)); await interaction.editReply({content:null, embeds:[e], components:[b]}); }

            if (customId === 'btn_lansman_list') { const all = await Lansman.find().sort({hedefTarih: 1}); let desc = "Henüz planlanmış bir lansman yok."; if(all.length > 0) { desc = all.map(l => { const diff = moment(l.hedefTarih).diff(moment().utcOffset(3), 'days'); return `💿 **${l.baslik}**\n📅 ${l.tarihText} (⏳ ${diff} Gün kaldı)\n*Oluşturan: ${l.olusturan}*`; }).join('\n\n'); } const e = new EmbedBuilder().setTitle('🔥 Lansman Takvimi').setColor(RENK.HATA).setDescription(desc); const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('app_fun').setLabel('Geri').setStyle(2)); await interaction.editReply({content:null, embeds:[e], components:[b]}); }
            if (customId === 'btn_lansman_add') { const modal = new ModalBuilder().setCustomId('modal_lansman').setTitle('Lansman Duyurusu'); modal.addComponents( new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lan_baslik').setLabel("Albüm/Single Adı").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lan_tarih').setLabel("Tarih (YYYY-MM-DD)").setPlaceholder("2025-05-20").setStyle(TextInputStyle.Short)) ); await interaction.showModal(modal); }
            if (customId === 'admin_lansman') { const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_lansman_del_menu').setLabel('Lansman Sil').setStyle(4), new ButtonBuilder().setCustomId('nav_admin').setLabel('Geri').setStyle(2)); await interaction.editReply({content:'Lansman Yönetimi:', embeds:[], components:[b]}); }
            if (customId === 'btn_lansman_del_menu') { const all = await Lansman.find(); if(all.length===0) return interaction.followUp({content:'Liste boş.', ephemeral:true}); const m = new StringSelectMenuBuilder().setCustomId('menu_lansman_delete').setPlaceholder('Silinecek Lansman').addOptions(all.map(l => ({label: l.baslik, value: l._id.toString()}))); const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('admin_lansman').setLabel('Geri').setStyle(2)); await interaction.editReply({components:[new ActionRowBuilder().addComponents(m), r]}); }

            if (customId === 'btn_fat_list') { const fats = await Fatura.find().sort({ tarih: -1 }).limit(10); const list = fats.map(f => `\`${f.faturaNo}\` **${f.alici}** - ${f.tutar} (${f.durum})`).join('\n') || '📭 Temiz sayfa.'; const e = new EmbedBuilder().setTitle('🧾 Son Faturalar').setDescription(list).setColor(RENK.GOLD); const r = new ActionRowBuilder(); if (checkPerms(interaction, 'YONETIM')) { r.addComponents(new ButtonBuilder().setCustomId('btn_fat_del_menu').setLabel('Sil').setStyle(4), new ButtonBuilder().setCustomId('admin_fat_clear').setLabel('Temizle').setStyle(4)); } r.addComponents(new ButtonBuilder().setCustomId('app_finance').setLabel('Geri').setStyle(2)); await interaction.editReply({ content: null, embeds: [e], components: [r] }); }
            if (customId === 'admin_fat_clear') { if (!checkPerms(interaction, 'YONETIM')) return interaction.followUp({content:MSG.YETKI_YOK, ephemeral:true}); await Fatura.deleteMany({}); await interaction.followUp({content:'🗑️ Defter temizlendi.', ephemeral:true}); await renderFinance(interaction); }
            if (customId === 'btn_fat_del_menu') { if (!checkPerms(interaction, 'YONETIM')) return interaction.followUp({content:MSG.YETKI_YOK, ephemeral:true}); const list = await Fatura.find().sort({tarih:-1}).limit(25); if(list.length===0) return interaction.followUp({content:'Silinecek fatura yok.', ephemeral:true}); const m = new StringSelectMenuBuilder().setCustomId('menu_fat_delete').setPlaceholder('Silinecek faturayı seç').addOptions(list.map(f=>({label:`${f.faturaNo} - ${f.alici}`, value:f._id.toString()}))); const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_fat_list').setLabel('Geri').setStyle(2)); await interaction.editReply({components:[new ActionRowBuilder().addComponents(m), r]}); }

            if (customId === 'admin_clean_chat') {
                if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true});
                await interaction.followUp({content: '🧹 Ortam temizleniyor...', ephemeral: true});
                const fetched = await interaction.channel.messages.fetch({limit: 100});
                await interaction.channel.bulkDelete(fetched, true);
            }
            if (customId === 'admin_clean_db') {
                if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true});
                await Randevu.deleteMany({});
                await interaction.followUp({content:'🧹 Randevu defteri sıfırlandı.', ephemeral:true});
            }
            if (customId === 'admin_stats') await funcStatsResetMenu(interaction);
            if (customId === 'btn_stat_list') { const all = await Istatistik.find().sort({toplamSeans:-1}); const l = all.map(s => `${s.isim}: ${s.toplamSeans}`).join('\n') || 'Veri yok.'; await interaction.editReply({ content: `**İstatistikler:**\n${l}`, embeds: [], components: [] }); }
            if (customId === 'btn_stat_reset_all') {
                if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content: MSG.YETKI_YOK, ephemeral:true}); 
                await Istatistik.deleteMany({}); await interaction.editReply({content:'İstatistikler sıfırlandı.', embeds:[], components:[]}); 
            }
            
            if (customId.startsWith('fat_approve') || customId.startsWith('fat_reject')) { 
                if (!checkPerms(interaction, 'YONETIM')) return interaction.reply({content:MSG.YETKI_YOK, ephemeral:true}); 
                const act = customId.includes('approve') ? 'Onaylandı' : 'Reddedildi'; 
                const color = customId.includes('approve') ? RENK.BASARI : RENK.HATA;
                const no = customId.split('_')[2]; 
                const f = await Fatura.findOne({faturaNo: no}); 
                if(f) { 
                    f.durum = act; await f.save(); 
                    const oldEmbed = interaction.message.embeds[0];
                    const newEmbed = EmbedBuilder.from(oldEmbed).setColor(color).setFooter({text:`${no} | Durum: ${act}`});
                    await interaction.message.edit({ embeds: [newEmbed], components: [] });
                    await interaction.reply({ content: `✅ İşlem tamam: **${act}**`, ephemeral: true }); 
                } 
            }

            if (customId === 'btn_legal_create') {
                if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content:MSG.YETKI_YOK, ephemeral:true});
                const m = new StringSelectMenuBuilder().setCustomId('menu_legal_type').setPlaceholder('Sözleşme Türü Seç').addOptions([
                    { label: 'Bireysel Sanatçı', value: 'bireysel', description: 'Tekil şarkıcılar için.' },
                    { label: 'Grup Sözleşmesi', value: 'grup', description: 'Müzik grupları için.' },
                    { label: 'Prodüktör Anlaşması', value: 'produktor', description: 'Beatmaker ve Prodüktörler için.' }
                ]);
                await interaction.reply({ content: 'Taslak seçimi yap:', components: [new ActionRowBuilder().addComponents(m)], ephemeral: true });
            }
            if (customId === 'btn_legal_step2_trigger') {
                const modal = new ModalBuilder().setCustomId('modal_legal_step2').setTitle('Adım 2: Detaylar');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_proje').setLabel("Proje Kapsamı").setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_sure').setLabel("Süre (Sezon/Yıl)").setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_yuzde').setLabel("Stüdyo Payı (%)").setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_ceza').setLabel("Fesih Cezası Oranı").setValue('%50').setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_kisit').setLabel("Kısıtlama Süresi").setValue('1 Yıl').setStyle(TextInputStyle.Short))
                );
                await interaction.showModal(modal);
            }
            if (customId === 'btn_legal_sign_artist') {
                const modal = new ModalBuilder().setCustomId('modal_sign_artist').setTitle('Sanatçı/Grup İmzası');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sign_url').setLabel("İmza Linki (Imgur)").setStyle(TextInputStyle.Short)));
                await interaction.showModal(modal);
            }
            if (customId === 'btn_legal_sign_patron') {
                if(user.id !== AYARLAR.PATRON_ID) return interaction.followUp({content:MSG.YETKI_YOK, ephemeral:true});
                const modal = new ModalBuilder().setCustomId('modal_sign_patron').setTitle('Yetkili İmzası');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sign_url').setLabel("İmza Linki").setValue(AYARLAR.PATRON_IMZA_URL).setStyle(TextInputStyle.Short)));
                await interaction.showModal(modal);
            }
        }

        // --- 4. MENÜ MANTIĞI ---
        if (interaction.isStringSelectMenu()) {
            const { customId, values } = interaction;
            const val = values[0];

            if (['menu_grup', 'menu_sanatci', 'menu_produktor', 'menu_saat'].includes(customId)) { 
                const data = appCache.get(`randevu_${user.id}`) || { grup: null, sanatci: [], produktor: null, saat: null }; 
                if (customId === 'menu_grup') data.grup = val; 
                if (customId === 'menu_sanatci') data.sanatci = values; 
                if (customId === 'menu_produktor') data.produktor = val; 
                if (customId === 'menu_saat') data.saat = val; 
                appCache.set(`randevu_${user.id}`, data); 
                return; // Defer yukarıda yapıldı, sadece cache güncelle, mesaj güncelleme.
            }
            if (customId === 'menu_iptal') { const rb = await Randevu.findById(val); if(rb) { await Randevu.findByIdAndDelete(val); await interaction.channel.send(`📢 **Duyuru:** ${rb.grupAdi} randevusu takvimden silindi.`); const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('app_studio').setLabel('Geri').setStyle(2)); await interaction.editReply({content:MSG.ISLEM_BASARILI, components:[b]}); } }
            if (customId === 'menu_fat_delete') { if (!checkPerms(interaction, 'YONETIM')) return; await Fatura.findByIdAndDelete(val); await interaction.followUp({content:MSG.ISLEM_BASARILI, ephemeral:true}); await renderFinance(interaction); }
            if (customId === 'menu_dgko_delete') { await DogumGunu.findByIdAndDelete(val); await interaction.followUp({content:MSG.ISLEM_BASARILI, ephemeral:true}); }
            if (customId === 'menu_not_delete') { await Not.findByIdAndDelete(val); await interaction.followUp({content:MSG.ISLEM_BASARILI, ephemeral:true}); await renderNoteList(interaction); }
            if (customId === 'menu_soz_delete') { await Sozlesme.findByIdAndDelete(val); await interaction.followUp({content:'✅ Sözleşme iptal edildi.', ephemeral:true}); }
            if (customId === 'menu_lansman_delete') { await Lansman.findByIdAndDelete(val); await interaction.followUp({content:MSG.ISLEM_BASARILI, ephemeral:true}); const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_lansman_del_menu').setLabel('Başka Sil').setStyle(4), new ButtonBuilder().setCustomId('admin_lansman').setLabel('Geri').setStyle(2)); await interaction.editReply({content: 'Silindi.', components: [b]}); }
            if (customId === 'menu_tescil_delete') { await Tescil.findByIdAndDelete(val); await interaction.followUp({content:MSG.ISLEM_BASARILI, ephemeral:true}); await renderTescilList(interaction); }
            if (customId === 'grup_sec') { const d = GRUP_BILGILERI[val]; if(d) { appCache.set(`grup_page_${user.id}`, {data:d, page:0}); const e = new EmbedBuilder().setColor(RENK.SIYAH).setTitle(d[0].title).setDescription(d[0].desc).setImage(d[0].image||null).setFooter({text:`1/${d.length} | Recordooze Studio x Records®`}); const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('prev_page').setLabel('⬅️').setStyle(2).setDisabled(true), new ButtonBuilder().setCustomId('next_page').setLabel('➡️').setStyle(2).setDisabled(d.length<=1), new ButtonBuilder().setCustomId('app_archive').setLabel('Geri').setStyle(2)); await interaction.editReply({content:null, embeds:[e], components:[r]}); } }
            if (customId === 'sanat_sec') { const d = SANATCI_BILGILERI[val]; if(d) { appCache.set(`sanat_page_${user.id}`, {data:d, page:0}); const e = new EmbedBuilder().setColor(RENK.SIYAH).setTitle(d[0].title).setDescription(d[0].desc).setFooter({text:`Sayfa 1/${d.length} | Recordooze Studio x Records®`}); const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('prev_page_s').setLabel('⬅️').setStyle(2).setDisabled(true), new ButtonBuilder().setCustomId('next_page_s').setLabel('➡️').setStyle(2).setDisabled(d.length<=1), new ButtonBuilder().setCustomId('app_archive').setLabel('Geri').setStyle(2)); await interaction.editReply({content:null, embeds:[e], components:[r]}); } }
            if (customId === 'menu_profil') { const stat = await Istatistik.findOne({ isim: val }) || { toplamSeans: 0 }; const e = new EmbedBuilder().setColor(RENK.ANA).setTitle(`👤 ${val}`).addFields({name:'Puan', value:`${stat.toplamSeans}`}); const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('nav_home').setLabel('Ana Menü').setStyle(2)); await interaction.editReply({ content: null, embeds: [e], components: [b] }); }
            if (customId === 'menu_fat_hizmet') { const modal = new ModalBuilder().setCustomId(`modal_fat_${val}`).setTitle('Fatura Detayları'); modal.addComponents( new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('fat_kime').setLabel("Personel").setStyle(TextInputStyle.Short)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('fat_tutar').setLabel("Tutar").setStyle(TextInputStyle.Short)) ); await interaction.showModal(modal); }

            if (customId === 'menu_proje_select') {
                const proje = await Proje.findById(val);
                if(proje) {
                    appCache.set(`update_proje_${user.id}`, val);
                    const r = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('menu_proje_durum').setPlaceholder('Yeni Durum Nedir?').addOptions([
                            {label: 'Hazırlık (%10)', value: '10'},
                            {label: 'Kayıt Aşamasında (%40)', value: '40'},
                            {label: 'Mix & Mastering (%80)', value: '80'},
                            {label: 'Hazır & Bitti (%100)', value: '100'}
                        ])
                    );
                    await interaction.editReply({content:`**${proje.baslik}** projesini güncelliyoruz:`, components:[r]});
                }
            }
            if (customId === 'menu_proje_durum') {
                const pid = appCache.get(`update_proje_${user.id}`);
                const proje = await Proje.findById(pid);
                if(proje) {
                    proje.yuzde = parseInt(val);
                    proje.durum = val === '100' ? 'Hazır' : (val === '10' ? 'Hazırlık' : (val === '40' ? 'Kayıt' : 'Mix'));
                    proje.sonGuncelleme = Date.now();
                    await proje.save();
                    if (val === '100') {
                        const e = new EmbedBuilder().setTitle('💿 PROJE TAMAMLANDI').setColor(RENK.GOLD).setDescription(`**${proje.baslik}** stüdyo sürecini tamamladı.\n\n🎉 **Tebrikler!**`);
                        await interaction.channel.send({ content: `📢 <@${AYARLAR.PATRON_ID}>, bir proje bitti!`, embeds: [e] });
                    }
                    await interaction.followUp({content: `✅ Proje güncellendi: %${val}`, ephemeral:true});
                    await renderProjeList(interaction);
                }
            }
            // [YENİ] PROJE SİLME İŞLEVİ (MENÜ SEÇİMİ)
            if (customId === 'menu_proje_delete') {
                await Proje.findByIdAndDelete(val); // Seçilen ID'yi veritabanından siler
                await interaction.followUp({content: '✅ Proje kalıcı olarak silindi.', ephemeral: true});
                await renderProjeList(interaction); // Listeyi yeniler
            }

            if (customId === 'menu_scout_select') {
                const s = await Scout.findById(val);
                if(s) {
                    appCache.set(`update_scout_${user.id}`, val);
                    const r = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('menu_scout_durum').setPlaceholder('Son Durum').addOptions([
                            {label: '🟢 Takipte', value: 'Takipte'},
                            {label: '🟡 Görüşüldü', value: 'Görüşüldü'},
                            {label: '🔴 İmzalandı', value: 'İmzalandı'},
                            {label: '❌ İptal/Red', value: 'Red'}
                        ])
                    );
                    await interaction.editReply({content:`**${s.isim}** için işlem:`, components:[r]});
                }
            }
            if (customId === 'menu_scout_durum') {
                const sid = appCache.get(`update_scout_${user.id}`);
                const s = await Scout.findById(sid);
                if(s) {
                    s.durum = val; await s.save();
                    await interaction.followUp({content: `✅ İşlendi: ${val}`, ephemeral:true});
                    await renderScoutList(interaction);
                }
            }
            if (customId === 'menu_scout_delete') { await Scout.findByIdAndDelete(val); await interaction.followUp({content:MSG.ISLEM_BASARILI, ephemeral:true}); await renderScoutList(interaction); }

            if (customId === 'menu_legal_type') {
                contractCache.set(user.id, { type: val, data: {} });
                const modal = new ModalBuilder().setCustomId('modal_legal_step1').setTitle('Adım 1: Temel Bilgiler');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_isim').setLabel("Taraf Adı (Sanatçı/Grup)").setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_adres').setLabel("Adres").setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_tel').setLabel("Telefon").setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_email').setLabel("E-Posta").setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inp_tarih').setLabel("Tarih").setValue(moment().utcOffset(3).format('DD.MM.YYYY')).setStyle(TextInputStyle.Short))
                );
                await interaction.showModal(modal);
            }
        }

        // --- 5. MODAL SUBMIT MANTIĞI ---
        if (interaction.isModalSubmit()) {
            const { customId } = interaction;
            if (customId === 'modal_social') { await interaction.deferReply(); const p = interaction.fields.getTextInputValue('soc_platform'); const c = interaction.fields.getTextInputValue('soc_content'); const e = new EmbedBuilder().setColor(RENK.GOLD).setAuthor({name:`Recordooze (${p})`, iconURL:client.user.displayAvatarURL()}).setDescription(c); await interaction.editReply({embeds:[e]}); }
            if (customId === 'dgko_modal') { await interaction.reply({content:MSG.VERI_KAYIT, ephemeral:true}); await DogumGunu.create({ ad: interaction.fields.getTextInputValue('dgko_ad'), gun: interaction.fields.getTextInputValue('dgko_gun'), ay: interaction.fields.getTextInputValue('dgko_ay') }); }
            
            if (customId.startsWith('modal_fat_')) { 
                await interaction.deferReply({ephemeral:true}); 
                const h = customId.split('_')[2]; 
                const k = interaction.fields.getTextInputValue('fat_kime'); 
                const t = interaction.fields.getTextInputValue('fat_tutar'); 
                const n = `REQ-${Math.floor(Math.random()*9999)}`; 
                await Fatura.create({ faturaNo:n, kesen:user.username, alici:k, hizmet:h, tutar:t }); 
                
                // Finans Kanalına Gönder
                const finChannel = client.channels.cache.get(KANALLAR.FINANS_LOG);
                if(finChannel) {
                    const e = new EmbedBuilder().setColor(RENK.GOLD).setTitle('🧾 Hizmet Ödeme Emri').setDescription(`**Personel:** ${k}\n**Hizmet:** ${h}\n**Tutar:** ${t}`).setFooter({text:n}); 
                    const r = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`fat_approve_${n}`).setLabel('Onayla').setStyle(3), new ButtonBuilder().setCustomId(`fat_reject_${n}`).setLabel('Reddet').setStyle(4)); 
                    await finChannel.send({embeds:[e], components:[r]});
                }
                await interaction.editReply({content: MSG.FATURA_KESILDI}); 
            }
            if (customId === 'modal_not_add') { await interaction.deferUpdate(); await Not.create({yazan: user.username, icerik: interaction.fields.getTextInputValue('not_icerik')}); await interaction.followUp({content:MSG.VERI_KAYIT, ephemeral:true}); }
            if (customId === 'modal_soz_add') { await interaction.deferUpdate(); const sure = parseInt(interaction.fields.getTextInputValue('soz_sure')); const bitis = moment().utcOffset(3).add(sure, 'months'); await Sozlesme.create({ sanatci: interaction.fields.getTextInputValue('soz_kisi'), sureAy: sure, baslangicTarihi: new Date(), bitisTarihi: bitis.toDate(), gosterimTarihi: bitis.format('DD MMMM YYYY') }); await interaction.followUp({content:MSG.VERI_KAYIT, ephemeral:true}); }
            if (customId === 'modal_lansman') { await interaction.deferUpdate(); const textDate = interaction.fields.getTextInputValue('lan_tarih'); await Lansman.create({ baslik: interaction.fields.getTextInputValue('lan_baslik'), tarihText: textDate, hedefTarih: new Date(textDate), olusturan: user.username }); await interaction.followUp({content:'✅ Lansman takvime eklendi.', ephemeral:true}); }
            if (customId === 'modal_tescil') { 
                await interaction.deferUpdate(); 
                const eser = interaction.fields.getTextInputValue('tescil_eser'); const tur = interaction.fields.getTextInputValue('tescil_tur'); const link = interaction.fields.getTextInputValue('tescil_link'); 
                const embed = new EmbedBuilder().setTitle('⚖️ YENİ TESCİL BAŞVURUSU').setColor(RENK.PLATIN).setDescription(`${eser}`).addFields( {name:'Sanatçı', value: user.username, inline:true}, {name:'Tür', value: tur, inline:true}, {name:'OOC Link', value: link} ).setFooter({text:'Onaylamak için butona bas.'}); 
                const btns = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('tescil_onay_pending').setLabel('ONAYLA').setStyle(3).setEmoji('✅'), new ButtonBuilder().setCustomId('tescil_red_pending').setLabel('REDDET').setStyle(4).setEmoji('❌') ); 
                // Yönetim Kanalına Gönder
                const admChannel = client.channels.cache.get(KANALLAR.PRODUKTOR_LOG);
                if(admChannel) await admChannel.send({ content: `<@${AYARLAR.PATRON_ID}> Onay Gerekli:`, embeds: [embed], components: [btns] }); 
                await interaction.followUp({ content: '✅ Başvuru patrona iletildi.', ephemeral: true }); 
            }
            if (customId === 'modal_proje') { await interaction.deferUpdate(); await Proje.create({ baslik: interaction.fields.getTextInputValue('proje_baslik'), olusturan: user.username }); await interaction.followUp({content:MSG.VERI_KAYIT, ephemeral:true}); }
            if (customId === 'modal_scout') { await interaction.deferUpdate(); await Scout.create({ isim: interaction.fields.getTextInputValue('scout_isim'), not: interaction.fields.getTextInputValue('scout_not'), kesfeden: user.username }); await interaction.followUp({content:'✅ Aday listeye eklendi.', ephemeral:true}); }

            if (customId === 'modal_legal_step1') {
                const cache = contractCache.get(user.id);
                if (!cache) return interaction.reply({content:MSG.ZAMAN_ASIMI, ephemeral:true});
                cache.data.isim = interaction.fields.getTextInputValue('inp_isim');
                cache.data.adres = interaction.fields.getTextInputValue('inp_adres');
                cache.data.tel = interaction.fields.getTextInputValue('inp_tel');
                cache.data.email = interaction.fields.getTextInputValue('inp_email');
                cache.data.tarih = interaction.fields.getTextInputValue('inp_tarih');
                contractCache.set(user.id, cache);
                const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_legal_step2_trigger').setLabel('Devam Et (Finansal)').setStyle(1));
                await interaction.reply({content: '✅ Adım 1 Tamam. Devam et:', components: [b], ephemeral: true});
            }
            if (customId === 'modal_legal_step2') {
                await interaction.deferReply(); 
                const cache = contractCache.get(user.id);
                cache.data.sure = interaction.fields.getTextInputValue('inp_sure');
                cache.data.proje = interaction.fields.getTextInputValue('inp_proje');
                cache.data.yuzde = interaction.fields.getTextInputValue('inp_yuzde');
                cache.data.ceza = interaction.fields.getTextInputValue('inp_ceza');
                cache.data.kisit = interaction.fields.getTextInputValue('inp_kisit');

                let rawText = TEMPLATES[cache.type]
                    .replace(/\[ISIM\]/g, cache.data.isim.toUpperCase())
                    .replace(/\[ADRES\]/g, cache.data.adres)
                    .replace(/\[TARIH\]/g, cache.data.tarih)
                    .replace(/\[SURE\]/g, cache.data.sure)
                    .replace(/\[PROJE\]/g, cache.data.proje)
                    .replace(/\[YUZDE\]/g, cache.data.yuzde)
                    .replace(/\[CEZA\]/g, cache.data.ceza)
                    .replace(/\[KISIT\]/g, cache.data.kisit)
                    .replace(/\[TEL\]/g, cache.data.tel)
                    .replace(/\[EMAIL\]/g, cache.data.email)
                    .replace(/\[TEMSILCI\]/g, cache.data.isim);

                const files = await generateContractImages(rawText, AYARLAR.KAGIT_URL, null);
                const sentMsgId = interaction.id; 
                contractCache.set(sentMsgId, { ...cache.data, rawText: rawText, imzaSanatci: null, imzaPatron: null });
                const r = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_legal_sign_artist').setLabel('✍️ Karşı Taraf').setStyle(3),
                    new ButtonBuilder().setCustomId('btn_legal_sign_patron').setLabel('✍️ Yetkili').setStyle(3)
                );
                const finalMsg = await interaction.editReply({ content: '📄 **Taslak Hazır.** İmzaları bekliyorum.', files: files, components: [r] });
                const oldData = contractCache.get(sentMsgId);
                contractCache.set(finalMsg.id, oldData);
            }
            if (customId === 'modal_sign_artist' || customId === 'modal_sign_patron') {
                await interaction.deferUpdate();
                const url = interaction.fields.getTextInputValue('sign_url');
                const msgId = interaction.message.id;
                const data = contractCache.get(msgId);
                if (!data) return interaction.followUp({content:'Veri bulunamadı.', ephemeral:true});

                if (customId.includes('artist')) data.imzaSanatci = url;
                else data.imzaPatron = url;
                contractCache.set(msgId, data);
                await interaction.followUp({content: '✅ İmza alındı.', ephemeral:true});

                if (data.imzaSanatci && data.imzaPatron) {
                    await interaction.channel.send('🖨️ **İmzalar tamam. Mühürleniyor...**');
                    const files = await generateContractImages(data.rawText, AYARLAR.KAGIT_URL, { artistUrl: data.imzaSanatci, patronUrl: data.imzaPatron });
                    await interaction.channel.send({ content: `✅ **RESMİ SÖZLEŞME (Nihai)**\n\n**Taraf:** ${data.isim}\n**Tarih:** ${data.tarih}`, files: files });
                    await interaction.message.edit({components: []}); 
                }
            }
        }
    } catch (err) { console.log(`HATA: ${err.message}`); }
});

// --- RENDER HELPERS ---
async function renderNoteList(i) {
    const notes = await Not.find().sort({tarih:-1}).limit(5);
    const list = notes.map(n => `📌 **${n.yazan}:** ${(n.icerik||"").substring(0,50)}...`).join('\n') || "📝 Defter boş.";
    const e = new EmbedBuilder().setTitle('📌 Stüdyo Notları').setColor(RENK.ANA).setDescription(list);
    const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('btn_not_add').setLabel('Ekle').setStyle(3), new ButtonBuilder().setCustomId('btn_not_del_menu').setLabel('Sil').setStyle(4), new ButtonBuilder().setCustomId('nav_admin').setLabel('Geri').setStyle(2) );
    await i.editReply({content:null, embeds:[e], components:[r]});
}
async function renderTescilList(i) {
    const all = await Tescil.find().sort({tarih:-1}).limit(8);
    const list = all.map(t => `🎵 **${t.eserAdi}** - ${t.sanatci}`).join('\n') || "📭 Kayıt yok.";
    const e = new EmbedBuilder().setTitle('⚖️ Tescilli Eserler').setColor(RENK.PLATIN).setDescription(list);
    const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('btn_tescil_del_menu').setLabel('Sil').setStyle(4), new ButtonBuilder().setCustomId('nav_admin').setLabel('Geri').setStyle(2) );
    await i.editReply({content:null, embeds:[e], components:[r]});
}
async function renderProjeList(i) {
    const projeler = await Proje.find().sort({sonGuncelleme: -1});
    const list = projeler.map(p => `🎛️ **${p.baslik}**\n${createProgressBar(p.yuzde)} %${p.yuzde} (${p.durum})`).join('\n\n') || "📭 Proje yok.";
    const e = new EmbedBuilder().setTitle('🎛️ Stüdyo Projeleri (Kanban)').setColor(RENK.TURUNCU).setDescription(list);
    
    // [GÜNCELLEME]: Sil butonu eklendi
    const r = new ActionRowBuilder().addComponents( 
        new ButtonBuilder().setCustomId('btn_proje_add').setLabel('Yeni Proje').setStyle(3), 
        new ButtonBuilder().setCustomId('btn_proje_update').setLabel('Durum Güncelle').setStyle(1), 
        new ButtonBuilder().setCustomId('btn_proje_del_menu').setLabel('Sil').setStyle(4), 
        new ButtonBuilder().setCustomId('app_studio').setLabel('Geri').setStyle(2) 
    );
    await i.editReply({content:null, embeds:[e], components:[r]});
}
async function renderScoutList(i) {
    const scouts = await Scout.find().sort({tarih: -1});
    const list = scouts.map(s => {
        const icon = s.durum === 'Takipte' ? '🟢' : (s.durum === 'Görüşüldü' ? '🟡' : (s.durum === 'İmzalandı' ? '🔴' : '❌'));
        return `${icon} **${s.isim}**\nNot: ${s.not}`;
    }).join('\n\n') || "📭 Kimse yok.";
    const e = new EmbedBuilder().setTitle('🕵️ Yetenek Avcısı (Scout)').setColor(RENK.BASARI).setDescription(list);
    const r1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_scout_add').setLabel('Aday Ekle').setStyle(3),
        new ButtonBuilder().setCustomId('btn_scout_del_menu').setLabel('Sil').setStyle(4),
        new ButtonBuilder().setCustomId('nav_admin').setLabel('Geri').setStyle(2)
    );
    const m = scouts.length > 0 ? new StringSelectMenuBuilder().setCustomId('menu_scout_select').setPlaceholder('Durum Güncelle').addOptions(scouts.map(s=>({label:s.isim, value:s._id.toString()}))) : null;
    const components = m ? [new ActionRowBuilder().addComponents(m), r1] : [r1];
    await i.editReply({content:null, embeds:[e], components:components});
}
async function renderProducerPanel(i, upd=false) {
    const e = new EmbedBuilder().setTitle('🎩 YAPIMCI OFİSİ').setDescription('**Gizli Yönetim Paneli**\n\nBu alan sadece üst düzey yetkililer içindir.').setColor(RENK.SIYAH).setThumbnail('https://i.imgur.com/w4bPuDL.png');
    const r1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_legal_create').setLabel('Sözleşme Oluştur').setStyle(1).setEmoji('🖋️'),
        new ButtonBuilder().setCustomId('admin_stats').setLabel('İstatistik').setStyle(2)
    );
    const r2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('admin_clean_chat').setLabel('Chat Temizle').setStyle(4).setEmoji('🧹'),
        new ButtonBuilder().setCustomId('admin_clean_db').setLabel('Randevuları Sil').setStyle(4).setEmoji('🔥'),
        new ButtonBuilder().setCustomId('btn_stat_reset_all').setLabel('İstatistiği Sıfırla').setStyle(4)
    );
    if(upd) await i.editReply({ content:null, embeds:[e], components:[r1, r2] });
    else await i.reply({ content:null, embeds:[e], components:[r1, r2], ephemeral:true });
}
async function renderHome(i, upd=false) {
    const e = new EmbedBuilder().setTitle(getOSHeader()).setDescription('**Recordooze Mobile OS v2.0**').setColor(RENK.ANA).setThumbnail(AYARLAR.DOOZE_ICON);
    const r1 = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('app_studio').setLabel('Stüdyo').setStyle(3).setEmoji('🎙️'), new ButtonBuilder().setCustomId('app_finance').setLabel('Finans').setStyle(3).setEmoji('💰'), new ButtonBuilder().setCustomId('btn_arsiv_grup').setLabel('Hakkımızda').setStyle(3).setEmoji('📂') );
    const r2 = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('app_fun').setLabel('İçerik').setStyle(3).setEmoji('🎲'), new ButtonBuilder().setCustomId('phone_radyo').setLabel('Radiodooze').setStyle(3).setEmoji('📻'), new ButtonBuilder().setCustomId('phone_profil').setLabel('Profiller').setStyle(3).setEmoji('👤') );
    if(upd) await i.editReply({ embeds:[e], components:[r1, r2] });
    else await i.reply({ embeds:[e], components:[r1, r2], ephemeral: true });
}
async function renderStudio(i) {
    const e = new EmbedBuilder().setTitle(getOSHeader()).setDescription('**Stüdyo Yönetim**').setColor(RENK.ANA);
    const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('act_randevu').setLabel('Randevu Al').setStyle(3), new ButtonBuilder().setCustomId('act_program').setLabel('Program').setStyle(3), new ButtonBuilder().setCustomId('act_durum').setLabel('Doluluk').setStyle(2) );
    const r2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('act_iptal').setLabel('İptal').setStyle(4), new ButtonBuilder().setCustomId('btn_proje_list').setLabel('Projeler').setStyle(1).setEmoji('🎛️'), new ButtonBuilder().setCustomId('nav_home').setLabel('Ana Menü').setStyle(2));
    await i.editReply({ content:null, embeds:[e], components:[r, r2] });
}
async function renderFinance(i) {
    const e = new EmbedBuilder().setTitle(getOSHeader()).setDescription('**Finans ve Hukuk**').setColor(RENK.GOLD);
    const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('btn_fat_kes').setLabel('Fatura Kes').setStyle(3), new ButtonBuilder().setCustomId('btn_fat_list').setLabel('Geçmiş').setStyle(3) );
    const r2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('nav_home').setLabel('Ana Menü').setStyle(2));
    await i.editReply({ content:null, embeds:[e], components:[r, r2] });
}
async function renderFun(i) {
    const e = new EmbedBuilder().setTitle(getOSHeader()).setDescription('**Eğlence ve İçerik**').setColor(RENK.ANA);
    const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('btn_tescil_baslat').setLabel('Eser Tescil').setStyle(3).setEmoji('⚖️'), new ButtonBuilder().setCustomId('act_sosyal').setLabel('Sosyal Medya').setStyle(3), new ButtonBuilder().setCustomId('btn_dgko_public').setLabel('Doğum Günleri').setStyle(3).setEmoji('🎂') );
    const r2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_lansman_list').setLabel('Lansmanlar').setStyle(3).setEmoji('🔥'), new ButtonBuilder().setCustomId('btn_lansman_add').setLabel('Lansman Ekle').setStyle(3), new ButtonBuilder().setCustomId('nav_home').setLabel('Ana Menü').setStyle(2));
    await i.editReply({ content:null, embeds:[e], components:[r, r2] });
}
async function renderArchive(i) {
    const e = new EmbedBuilder().setTitle('📂 Hakkımızda').setColor(RENK.ANA);
    const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('btn_arsiv_grup').setLabel('Gruplar').setStyle(3), new ButtonBuilder().setCustomId('btn_arsiv_sanatci').setLabel('Sanatçılar').setStyle(3), new ButtonBuilder().setCustomId('nav_home').setLabel('Ana Menü').setStyle(2) );
    await i.editReply({ content:null, embeds:[e], components:[r] });
}
async function renderAdmin(i, upd=false) {
    const e = new EmbedBuilder().setTitle('🔒 Yönetim').setColor(RENK.HATA);
    const r1 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('admin_dgko').setLabel('DGKO').setStyle(3), new ButtonBuilder().setCustomId('admin_lansman').setLabel('Lansman').setStyle(3), new ButtonBuilder().setCustomId('btn_not_list').setLabel('Notlar').setStyle(3));
    const r2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_soz_list').setLabel('Eski Sözleşme').setStyle(3), new ButtonBuilder().setCustomId('btn_tescil_list').setLabel('Tescil').setStyle(3), new ButtonBuilder().setCustomId('btn_scout_list').setLabel('Scout').setStyle(3).setEmoji('🕵️'));
    if(upd) await i.editReply({ content: null, embeds:[e], components:[r1, r2] });
    else await i.reply({ embeds:[e], components:[r1, r2], ephemeral:true });
}
async function funcGrup(i, user) {
    const menu = new StringSelectMenuBuilder().setCustomId('grup_sec').setPlaceholder('Hangi Dosya?').addOptions(GRUPLAR);
    const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('app_archive').setLabel('Geri').setStyle(2));
    await i.editReply({ content: '👻 **Dooze:** Arşiv odasındayım...', components: [new ActionRowBuilder().addComponents(menu), b] });
}
async function funcSanatci(i, user) {
    const menu = new StringSelectMenuBuilder().setCustomId('sanat_sec').setPlaceholder('Kimi Arıyorsun?').addOptions(Object.keys(SANATCI_BILGILERI).map(k=>({label:k, value:k})));
    const b = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('app_archive').setLabel('Geri').setStyle(2));
    await i.editReply({ content: '👻 **Dooze:** Bireysel dosyalar...', components: [new ActionRowBuilder().addComponents(menu), b] });
}
async function funcStatsResetMenu(interaction) {
    const e = new EmbedBuilder().setTitle('⚠ İstatistik').setColor(RENK.HATA);
    const r = new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('btn_stat_reset_all').setLabel('HERKESİ SIFIRLA').setStyle(4), new ButtonBuilder().setCustomId('btn_stat_list').setLabel('Listele').setStyle(2), new ButtonBuilder().setCustomId('nav_producer').setLabel('Geri').setStyle(2) );
    await interaction.editReply({ embeds: [e], components: [r] });
}

process.on('uncaughtException', (err) => console.log('Anti-Crash:', err));
process.on('unhandledRejection', (r) => console.log('Anti-Crash:', r));
client.login(process.env.TOKEN);