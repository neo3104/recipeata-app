/**
 * 文字列を正規化する関数
 * - 全角を半角に変換（英数記号）
 * - カタカナをひらがなに変換
 * - 大文字を小文字に変換
 * @param text 変換したい文字列
 * @returns 正規化された文字列
 */
export const normalizeText = (text: string | undefined | null): string => {
  if (!text) return '';

  let normalized = text;
  
  normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });

  normalized = normalized.replace(/[\u30a1-\u30f6]/g, s => {
    return String.fromCharCode(s.charCodeAt(0) - 0x60);
  });
  
  return normalized.toLowerCase();
}; 