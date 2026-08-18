/**
 * 六十四卦《大象传》辞（公版原文《周易·象传》）。
 * 供六爻 AI 参详摘要注入：本卦/变卦大象辞（如乾为天「天行健，君子以自强不息」）。
 * 键为《周易》卦序 id（1-64），与 hexagram-data.ts 的 HEXAGRAMS[i].id 对齐。
 * 来源：《周易·象傳》公版原文；皆为原文引用，无演绎、无吉凶断言。
 */

export interface GuaciData {
  id: number
  name: string
  /** 《大象传》全文（象曰 之后的正文），如「天行健，君子以自强不息」 */
  daXiang: string
}

export const GUACI: GuaciData[] = [
  { id: 1, name: '乾为天', daXiang: '天行健，君子以自强不息。' },
  { id: 2, name: '坤为地', daXiang: '地势坤，君子以厚德载物。' },
  { id: 3, name: '水雷屯', daXiang: '云雷屯，君子以经纶。' },
  { id: 4, name: '山水蒙', daXiang: '山下出泉，蒙，君子以果行育德。' },
  { id: 5, name: '水天需', daXiang: '云上于天，需，君子以饮食宴乐。' },
  { id: 6, name: '天水讼', daXiang: '天与水违行，讼，君子以作事谋始。' },
  { id: 7, name: '地水师', daXiang: '地中有水，师，君子以容民畜众。' },
  { id: 8, name: '水地比', daXiang: '地上有水，比，先王以建万国、亲诸侯。' },
  { id: 9, name: '风天小畜', daXiang: '风行天上，小畜，君子以懿文德。' },
  { id: 10, name: '天泽履', daXiang: '上天下泽，履，君子以辨上下、定民志。' },
  { id: 11, name: '地天泰', daXiang: '天地交，泰，后以财成天地之道，辅相天地之宜，以左右民。' },
  { id: 12, name: '天地否', daXiang: '天地不交，否，君子以俭德辟难，不可荣以禄。' },
  { id: 13, name: '天火同人', daXiang: '天与火，同人，君子以类族辨物。' },
  { id: 14, name: '火天大有', daXiang: '火在天上，大有，君子以遏恶扬善、顺天休命。' },
  { id: 15, name: '地山谦', daXiang: '地中有山，谦，君子以裒多益寡、称物平施。' },
  { id: 16, name: '雷地豫', daXiang: '雷出地奋，豫，先王以作乐崇德，殷荐之上帝以配祖考。' },
  { id: 17, name: '泽雷随', daXiang: '泽中有雷，随，君子以向晦入宴息。' },
  { id: 18, name: '山风蛊', daXiang: '山下有风，蛊，君子以振民育德。' },
  { id: 19, name: '地泽临', daXiang: '泽上有地，临，君子以教思无穷、容保民无疆。' },
  { id: 20, name: '风地观', daXiang: '风行地上，观，先王以省方观民设教。' },
  { id: 21, name: '火雷噬嗑', daXiang: '雷电噬嗑，先王以明罚敕法。' },
  { id: 22, name: '山火贲', daXiang: '山下有火，贲，君子以明庶政、无敢折狱。' },
  { id: 23, name: '山地剥', daXiang: '山附于地，剥，上以厚下安宅。' },
  { id: 24, name: '地雷复', daXiang: '雷在地中，复，先王以至日闭关，商旅不行，后不省方。' },
  { id: 25, name: '天雷无妄', daXiang: '天下雷行，物与无妄，先王以茂对时育万物。' },
  { id: 26, name: '山天大畜', daXiang: '天在山中，大畜，君子以多识前言往行、以畜其德。' },
  { id: 27, name: '山雷颐', daXiang: '山下有雷，颐，君子以慎言语、节饮食。' },
  { id: 28, name: '泽风大过', daXiang: '泽灭木，大过，君子以独立不惧、遁世无闷。' },
  { id: 29, name: '坎为水', daXiang: '水洊至，习坎，君子以常德行、习教事。' },
  { id: 30, name: '离为火', daXiang: '明两作，离，大人以继明照于四方。' },
  { id: 31, name: '泽山咸', daXiang: '山上有泽，咸，君子以虚受人。' },
  { id: 32, name: '雷风恒', daXiang: '雷风，恒，君子以立不易方。' },
  { id: 33, name: '天山遁', daXiang: '天下有山，遁，君子以远小人、不恶而严。' },
  { id: 34, name: '雷天大壮', daXiang: '雷在天上，大壮，君子以非礼弗履。' },
  { id: 35, name: '火地晋', daXiang: '明出地上，晋，君子以自昭明德。' },
  { id: 36, name: '地火明夷', daXiang: '明入地中，明夷，君子以莅众用晦而明。' },
  { id: 37, name: '风火家人', daXiang: '风自火出，家人，君子以言有物而行有恒。' },
  { id: 38, name: '火泽睽', daXiang: '上火下泽，睽，君子以同而异。' },
  { id: 39, name: '水山蹇', daXiang: '山上有水，蹇，君子以反身修德。' },
  { id: 40, name: '雷水解', daXiang: '雷雨作，解，君子以赦过宥罪。' },
  { id: 41, name: '山泽损', daXiang: '山下有泽，损，君子以惩忿窒欲。' },
  { id: 42, name: '风雷益', daXiang: '风雷，益，君子以见善则迁、有过则改。' },
  { id: 43, name: '泽天夬', daXiang: '泽上于天，夬，君子以施禄及下、居德则忌。' },
  { id: 44, name: '天风姤', daXiang: '天下有风，姤，后以施命诰四方。' },
  { id: 45, name: '泽地萃', daXiang: '泽上于地，萃，君子以除戎器、戒不虞。' },
  { id: 46, name: '地风升', daXiang: '地中生木，升，君子以顺德、积小以高大。' },
  { id: 47, name: '泽水困', daXiang: '泽无水，困，君子以致命遂志。' },
  { id: 48, name: '水风井', daXiang: '木上有水，井，君子以劳民劝相。' },
  { id: 49, name: '泽火革', daXiang: '泽中有火，革，君子以治历明时。' },
  { id: 50, name: '火风鼎', daXiang: '木上有火，鼎，君子以正位凝命。' },
  { id: 51, name: '震为雷', daXiang: '洊雷，震，君子以恐惧修省。' },
  { id: 52, name: '艮为山', daXiang: '兼山，艮，君子以思不出其位。' },
  { id: 53, name: '风山渐', daXiang: '山上有木，渐，君子以居贤德善俗。' },
  { id: 54, name: '雷泽归妹', daXiang: '泽上有雷，归妹，君子以永终知敝。' },
  { id: 55, name: '雷火丰', daXiang: '雷电皆至，丰，君子以折狱致刑。' },
  { id: 56, name: '火山旅', daXiang: '山上有火，旅，君子以明慎用刑而不留狱。' },
  { id: 57, name: '巽为风', daXiang: '随风，巽，君子以申命行事。' },
  { id: 58, name: '兑为泽', daXiang: '丽泽，兑，君子以朋友讲习。' },
  { id: 59, name: '风水涣', daXiang: '风行水上，涣，先王以享于帝立庙。' },
  { id: 60, name: '水泽节', daXiang: '泽上有水，节，君子以制数度、议德行。' },
  { id: 61, name: '风泽中孚', daXiang: '泽上有风，中孚，君子以议狱缓死。' },
  { id: 62, name: '雷山小过', daXiang: '山上有雷，小过，君子以行过乎恭、丧过乎哀、用过乎俭。' },
  { id: 63, name: '水火既济', daXiang: '水在火上，既济，君子以思患而豫防之。' },
  { id: 64, name: '火水未济', daXiang: '火在水上，未济，君子以慎辨物居方。' },
]

/** 按卦序 id 查《大象传》辞；不存在返回 undefined */
export function daXiangOf(id: number): string | undefined {
  const hit = GUACI.find((g) => g.id === id)
  return hit?.daXiang
}

/** 按卦名查《大象传》辞（如「乾为天」）；不存在返回 undefined */
export function daXiangByName(name: string): string | undefined {
  const hit = GUACI.find((g) => g.name === name)
  return hit?.daXiang
}
