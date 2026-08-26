/**
 * 把清单里的 assetFile 对到仓库里已经上传的图片。
 * 只匹配文件名，不改 id / sourceMuralId，也不根据文件名猜答案。
 */

const MURAL_FILES: Record<string, string[]> = {
  "shui_shen_tang_murals": [
    "出宫图_4x工作母版.jpg",
    "回宫图_4x工作母版.jpg",
  ],
  "duo_fu_si_murals": [
    "01_第五十二_魔军害佛.png",
    "02_第四十三_雪山入定.png",
    "03_第六十四_火龙魔难.png",
    "04_第十五_入学算法.png",
    "05_第十八_与南天国斗武艺.png",
    "06_第六十八_罗睺罗诞生.png",
    "07_第十七_走象奔马.png",
    "08_第三十三_问梵王.png",
    "09_第十一_天人献香.png",
    "10_第二十九及第三十一_辞别与求道.png",
  ],
  "yong_le_gong_murals": [
    "01.jpg",
    "02.jpg",
    "03.jpg",
    "04.jpg",
    "05.jpg",
    "06.jpg",
    "09.jpg",
    "10.jpg",
    "11.jpg",
    "12.jpg",
    "13.jpg",
    "14.jpg",
    "17.jpg",
  ],
};

const ELEMENT_FILES: Record<string, string[]> = {
  shui_shen_tang: [
    "出宫_四目神量雨尺_人物法器组合_补全版.png",
    "出宫_持双镜女神_电母候选_补全版.png",
    "出宫_持扇侍女01_单体补全版.png",
    "出宫_持扇侍女02_单体补全版.png",
    "出宫_持笏文官02_补全版.png",
    "出宫_雷公_人物法器组合_补全版.png",
    "出宫_风袋持有神祇_候选风伯_组合补全版.png",
    "出宫_骑乘神祇02_神龙旗幡组合_补全版.png",
    "出宫_骑乘神祇04_神龙旗幡组合_补全版.png",
    "出宫_龙母_单体_补全版.png",
    "回宫_书判记录官_候选_补全版.png",
    "回宫_四目神量雨尺_人物法器组合_补全版.png",
    "回宫_持扇侍女01_单体补全版.png",
    "回宫_骑乘神祇02_马伞盖随从组合_补全版.png",
    "回宫_骑乘神祇05_马组合_补全版.png",
    "回宫_鱼虾兽首水族部众组01_补全版.png",
  ],
  duo_fu_si: [
    "书卷_01_书册算筹.png",
    "佛_01_降魔成道坐佛.png",
    "佛_02_雪山入定坐佛.png",
    "佛_03_火龙魔难坐佛.png",
    "天人_01_云端献香天人.png",
    "天人_02_捧盘天女.png",
    "学堂_01_宫廷学堂.png",
    "松树_01_雪山古松.png",
    "梵王_01_宫殿坐像.png",
    "火龙_01.png",
    "耶输陀罗夫人_01_宫中坐像.png",
    "走象奔马_01_白象.png",
    "走象奔马_02_棕色奔马.png",
    "骑马武士_01_绿袍白马武士.png",
    "骑马武士_02_红袍黄马武士.png",
    "骑马武士_03_蓝袍棕马武士.png",
    "魔众_01_持枪天魔.png",
    "魔众_02_飞行天魔.png",
    "魔众_03_右侧魔将.png",
    "魔众_04_兽首小魔.png",
    "魔王_01_多臂魔王.png",
  ],
  yong_le_gong: [
    "01_供案主神.png",
    "02_华盖主神.png",
    "03_捧供器女神.png",
    "04_持刀护卫双人组.png",
    "05_圆光女神.png",
    "10_山中寺院院落.png",
    "12_火焰宝舆.png",
  ],
};

const GROUP_MURAL_DIR: Record<string, string> = {
  "guangling-water-god-temple": "shui_shen_tang_murals",
  "duofu-temple": "duo_fu_si_murals",
  "yongle-palace": "yong_le_gong_murals",
};

const GROUP_ELEMENT_DIR: Record<string, string> = {
  "guangling-water-god-temple": "shui_shen_tang",
  "duofu-temple": "duo_fu_si",
  "yongle-palace": "yong_le_gong",
};

function stem(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function encodePublicPath(parts: string[]): string {
  return `/${parts.map((part) => encodeURIComponent(part)).join("/")}`;
}

/** 同一资产的透明版 / 工作母版 / 略短文件名视为同一张图。 */
export function matchExistingFile(
  wantedFile: string,
  existing: string[]
): string | undefined {
  if (existing.includes(wantedFile)) return wantedFile;

  const wanted = stem(wantedFile);
  const byStem = existing.find((file) => stem(file) === wanted);
  if (byStem) return byStem;

  const wantedIsPrefix = existing.find((file) => stem(file).startsWith(wanted));
  if (wantedIsPrefix) return wantedIsPrefix;

  const existingIsPrefix = existing.find((file) =>
    wanted.startsWith(stem(file))
  );
  return existingIsPrefix;
}

export function muralImageSrc(
  groupId: string,
  assetFile: string
): string | undefined {
  const dir = GROUP_MURAL_DIR[groupId];
  if (!dir) return undefined;
  const matched = matchExistingFile(assetFile, MURAL_FILES[dir] ?? []);
  if (!matched) return undefined;
  return encodePublicPath(["images", "murals", dir, matched]);
}

/** Matching / explore tiles: 1200px JPEG, not the 4x work masters. */
export function muralThumbnailSrc(
  groupId: string,
  assetFile: string
): string | undefined {
  const dir = GROUP_MURAL_DIR[groupId];
  if (!dir) return undefined;
  const matched = matchExistingFile(assetFile, MURAL_FILES[dir] ?? []);
  if (!matched) return undefined;
  return encodePublicPath([
    "images",
    "murals",
    "thumbs",
    dir,
    `${stem(matched)}.jpg`,
  ]);
}

export function elementImageSrc(
  groupId: string,
  assetFile: string
): string | undefined {
  const dir = GROUP_ELEMENT_DIR[groupId];
  if (!dir) return undefined;
  const matched = matchExistingFile(assetFile, ELEMENT_FILES[dir] ?? []);
  if (!matched) return undefined;
  return encodePublicPath(["images", "objects", dir, matched]);
}

export function elementImageSrcByFileName(
  fileName: string
): string | undefined {
  for (const [dir, files] of Object.entries(ELEMENT_FILES)) {
    const matched = matchExistingFile(fileName, files);
    if (matched) {
      return encodePublicPath(["images", "objects", dir, matched]);
    }
  }
  return undefined;
}
