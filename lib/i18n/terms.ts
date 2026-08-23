import type { LText } from "./pick";

export const eras: Record<string, LText> = {
  唐代: { zh: "唐代", en: "Tang dynasty", it: "Dinastia Tang" },
  金代: { zh: "金代", en: "Jin dynasty", it: "Dinastia Jin" },
  辽金: { zh: "辽金", en: "Liao–Jin", it: "Liao–Jin" },
  元代: { zh: "元代", en: "Yuan dynasty", it: "Dinastia Yuan" },
  明代: { zh: "明代", en: "Ming dynasty", it: "Dinastia Ming" },
  清代: { zh: "清代", en: "Qing dynasty", it: "Dinastia Qing" },
  明清: { zh: "明清", en: "Ming–Qing", it: "Ming–Qing" },
};

export const prefectures: Record<string, LText> = {
  太原: { zh: "太原", en: "Taiyuan", it: "Taiyuan" },
  大同: { zh: "大同", en: "Datong", it: "Datong" },
  阳泉: { zh: "阳泉", en: "Yangquan", it: "Yangquan" },
  长治: { zh: "长治", en: "Changzhi", it: "Changzhi" },
  晋城: { zh: "晋城", en: "Jincheng", it: "Jincheng" },
  朔州: { zh: "朔州", en: "Shuozhou", it: "Shuozhou" },
  晋中: { zh: "晋中", en: "Jinzhong", it: "Jinzhong" },
  运城: { zh: "运城", en: "Yuncheng", it: "Yuncheng" },
  忻州: { zh: "忻州", en: "Xinzhou", it: "Xinzhou" },
  临汾: { zh: "临汾", en: "Linfen", it: "Linfen" },
  吕梁: { zh: "吕梁", en: "Lüliang", it: "Lüliang" },
};

export const places: Record<string, LText> = {
  山西: { zh: "山西", en: "Shanxi", it: "Shanxi" },
  繁峙: { zh: "繁峙", en: "Fanshi", it: "Fanshi" },
  五台: { zh: "五台", en: "Wutai", it: "Wutai" },
  太原: { zh: "太原", en: "Taiyuan", it: "Taiyuan" },
  大同: { zh: "大同", en: "Datong", it: "Datong" },
  浑源: { zh: "浑源", en: "Hunyuan", it: "Hunyuan" },
  朔州: { zh: "朔州", en: "Shuozhou", it: "Shuozhou" },
  平遥: { zh: "平遥", en: "Pingyao", it: "Pingyao" },
  稷山: { zh: "稷山", en: "Jishan", it: "Jishan" },
  芮城: { zh: "芮城", en: "Ruicheng", it: "Ruicheng" },
  广灵: { zh: "广灵", en: "Guangling", it: "Guangling" },
};

export const halls: Record<string, LText> = {
  圣母殿东壁: {
    zh: "圣母殿东壁",
    en: "East wall, Hall of the Holy Mother",
    it: "Parete est, Sala della Santa Madre",
  },
  圣母殿西壁: {
    zh: "圣母殿西壁",
    en: "West wall, Hall of the Holy Mother",
    it: "Parete ovest, Sala della Santa Madre",
  },
  大雄宝殿佛传壁画: {
    zh: "大雄宝殿佛传壁画",
    en: "Life of the Buddha, Mahavira Hall",
    it: "Vita del Buddha, Sala Mahavira",
  },
  "三清殿《朝元图》": {
    zh: "三清殿《朝元图》",
    en: "Chaoyuan mural, Hall of the Three Pure Ones",
    it: "Affresco Chaoyuan, Sala dei Tre Puri",
  },
  "纯阳殿《纯阳帝君神游显化图》": {
    zh: "纯阳殿《纯阳帝君神游显化图》",
    en: "Manifestations of Lü Dongbin, Hall of Pure Yang",
    it: "Manifestazioni di Lü Dongbin, Sala del Puro Yang",
  },
};

export const muralTemples: Record<string, LText> = {
  广灵水神堂: {
    zh: "广灵水神堂",
    en: "Guangling Shuishentang (Water God Temple)",
    it: "Shuishentang di Guangling (Tempio del Dio dell’Acqua)",
  },
  太原多福寺: {
    zh: "太原多福寺",
    en: "Duofu Temple, Taiyuan",
    it: "Tempio Duofu, Taiyuan",
  },
  芮城永乐宫: {
    zh: "芮城永乐宫",
    en: "Yongle Palace, Ruicheng",
    it: "Palazzo Yongle, Ruicheng",
  },
};

export const categories: Record<string, LText> = {
  主神: { zh: "主神", en: "Principal deity", it: "Divinità principale" },
  天气神: { zh: "天气神", en: "Weather deity", it: "Divinità del tempo" },
  车乘组合: { zh: "车乘组合", en: "Chariot group", it: "Gruppo del carro" },
  主神场景: { zh: "主神场景", en: "Principal scene", it: "Scena principale" },
  骑乘神祇: { zh: "骑乘神祇", en: "Mounted deity", it: "Divinità a cavallo" },
  文官: { zh: "文官", en: "Civil official", it: "Ufficiale civile" },
  异形部众: { zh: "异形部众", en: "Hybrid retinue", it: "Seguito ibrido" },
  水族异形: { zh: "水族异形", en: "Water spirits", it: "Spiriti delle acque" },
  山野神祇: { zh: "山野神祇", en: "Mountain gods", it: "Dèi dei monti" },
  人间层: { zh: "人间层", en: "Human realm", it: "Mondo umano" },
  侍女: { zh: "侍女", en: "Attendant maid", it: "Ancella" },
  法器: { zh: "法器", en: "Ritual object", it: "Oggetto rituale" },
  旗幡: { zh: "旗幡", en: "Banner", it: "Stendardo" },
  坐骑: { zh: "坐骑", en: "Mount", it: "Cavalcatura" },
  动物: { zh: "动物", en: "Animal", it: "Animale" },
  车辆: { zh: "车辆", en: "Carriage", it: "Carrozza" },
  云纹: { zh: "云纹", en: "Cloud motif", it: "Motivo di nuvole" },
  佛: { zh: "佛", en: "Buddha", it: "Buddha" },
  魔王: { zh: "魔王", en: "Māra", it: "Māra" },
  魔众: { zh: "魔众", en: "Demon host", it: "Schiera demoniaca" },
  山石: { zh: "山石", en: "Rocks", it: "Rocce" },
  植物: { zh: "植物", en: "Plant", it: "Pianta" },
  神兽: { zh: "神兽", en: "Mythic beast", it: "Bestia mitica" },
  建筑: { zh: "建筑", en: "Architecture", it: "Architettura" },
  器物: { zh: "器物", en: "Object", it: "Oggetto" },
  骑马武士: { zh: "骑马武士", en: "Mounted warrior", it: "Guerriero a cavallo" },
  神祇: { zh: "神祇", en: "Deity", it: "Divinità" },
  天人: { zh: "天人", en: "Celestial being", it: "Essere celeste" },
  玉女: { zh: "玉女", en: "Jade maiden", it: "Fanciulla di giada" },
  护卫: { zh: "护卫", en: "Guard", it: "Guardia" },
  女仙官: { zh: "女仙官", en: "Female immortal", it: "Immortale femminile" },
  护法神: { zh: "护法神", en: "Guardian deity", it: "Divinità protettrice" },
  仪仗: { zh: "仪仗", en: "Regalia", it: "Insegne" },
  神众: { zh: "神众", en: "Divine host", it: "Schiera divina" },
  车舆: { zh: "车舆", en: "Palanquin", it: "Palanchino" },
  人物: { zh: "人物", en: "Figure", it: "Figura" },
};

export const coverCategories: Record<string, LText> = {
  figure: { zh: "人物", en: "Figure", it: "Figura" },
  object: { zh: "法器", en: "Ritual object", it: "Oggetto rituale" },
  architecture: { zh: "建筑", en: "Architecture", it: "Architettura" },
  animal: { zh: "瑞兽", en: "Auspicious beast", it: "Bestia fausta" },
  cloud: { zh: "云纹", en: "Cloud motif", it: "Motivo di nuvole" },
  banner: { zh: "旗幡", en: "Banner", it: "Stendardo" },
};

export const pigments: Record<string, LText> = {
  cinnabar: { zh: "朱砂", en: "Cinnabar", it: "Cinabro" },
  "stone-blue": { zh: "石青", en: "Stone blue", it: "Blu di pietra" },
  "stone-green": { zh: "石绿", en: "Stone green", it: "Verde di pietra" },
  "earth-yellow": { zh: "土黄", en: "Earth yellow", it: "Giallo di terra" },
  "ink-black": { zh: "烟墨", en: "Ink black", it: "Nero d'inchiostro" },
  "wall-white": { zh: "铅白", en: "Lead white", it: "Bianco di piombo" },
  ochre: { zh: "赭石", en: "Ochre", it: "Ocra" },
  "faded-teal": { zh: "青绿", en: "Faded teal", it: "Verde-azzurro" },
  "smoke-gray": { zh: "烟灰", en: "Smoke gray", it: "Grigio fumo" },
  skin: { zh: "肤色", en: "Skin tone", it: "Carnagione" },
};

export const coloringRegions: Record<string, LText> = {
  face: { zh: "面部", en: "Face", it: "Volto" },
  hands: { zh: "双手", en: "Hands", it: "Mani" },
  tablet: { zh: "笏板", en: "Audience tablet", it: "Tavoletta di udienza" },
  crown_beads: { zh: "冠冕珠帘", en: "Crown beads", it: "Perle della corona" },
  crown_board: { zh: "冕冠板", en: "Crown board", it: "Tavola della corona" },
  beard: { zh: "胡须", en: "Beard", it: "Barba" },
  hair: { zh: "发髻", en: "Hair bun", it: "Chignon" },
  inner_robe: { zh: "内层衣饰", en: "Inner robe", it: "Veste interna" },
  collar: { zh: "衣领", en: "Collar", it: "Colletto" },
  sash: { zh: "腰带绶带", en: "Sash", it: "Cinta" },
  robe_trim: { zh: "衣缘纹样", en: "Robe trim", it: "Orlo della veste" },
  outer_robe_body: { zh: "长袍主体", en: "Outer robe", it: "Veste esterna" },
  sleeve_left: { zh: "左袖", en: "Left sleeve", it: "Manica sinistra" },
  sleeve_right: { zh: "右袖", en: "Right sleeve", it: "Manica destra" },
  robe_hem: { zh: "袍摆", en: "Robe hem", it: "Orlo inferiore" },
  shoes: { zh: "鞋履", en: "Shoes", it: "Calzature" },
  canopy: { zh: "仪仗华盖", en: "Canopy", it: "Baldacchino" },
  clouds_center: { zh: "中央祥云", en: "Central clouds", it: "Nuvole centrali" },
  clouds_left: { zh: "左侧祥云", en: "Left clouds", it: "Nuvole a sinistra" },
  clouds_right: { zh: "右侧祥云", en: "Right clouds", it: "Nuvole a destra" },
};

export const postcards: Record<string, LText> = {
  水神堂_龙母出宫降雨图: {
    zh: "水神堂 · 龙母出宫降雨图",
    en: "Water God Temple · Dragon Mother Departs to Bring Rain",
    it: "Tempio del Dio dell'Acqua · La Madre Drago esce a portare la pioggia",
  },
  多福寺_佛传故事: {
    zh: "多福寺 · 佛传故事",
    en: "Duofu Temple · Life of the Buddha",
    it: "Tempio Duofu · Vita del Buddha",
  },
  永乐宫_朝元图: {
    zh: "永乐宫 · 朝元图",
    en: "Yongle Palace · Chaoyuan Assembly",
    it: "Palazzo Yongle · Assemblea Chaoyuan",
  },
  公主寺_引路菩萨: {
    zh: "公主寺 · 引路菩萨",
    en: "Gongzhu Temple · Guide Bodhisattva",
    it: "Tempio Gongzhu · Bodhisattva guida",
  },
};
