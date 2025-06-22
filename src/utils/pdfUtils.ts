import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Recipe } from '../types';

// レシピの情報量を計算する関数
const calculateContentSize = (recipe: Recipe): number => {
  let size = 0;
  
  // タイトルの長さ
  size += recipe.title.length * 0.1;
  
  // 説明文の長さ
  size += recipe.description.length * 0.05;
  
  // 材料の数
  size += recipe.ingredients.filter(ing => ing.name).length * 2;
  
  // 工程の数
  size += recipe.steps.filter(step => step).length * 3;
  
  // 画像の有無
  if (recipe.mainImageUrl) size += 5;
  size += recipe.steps.filter(step => step?.imageUrl).length * 2;
  
  // タグの数
  size += recipe.tags.length * 0.5;
  
  return size;
};

// 情報量に応じてフォントサイズとレイアウトを調整
export const getLayoutConfig = (recipe: Recipe) => {
  const contentSize = calculateContentSize(recipe);
  
  if (contentSize < 20) {
    // 情報量が少ない場合：大きく表示
    return {
      titleFontSize: '32px',
      descriptionFontSize: '16px',
      sectionFontSize: '20px',
      bodyFontSize: '14px',
      mainImageHeight: '150px',
      stepImageHeight: '100px',
      padding: '25mm',
      spacing: 4
    };
  } else if (contentSize < 40) {
    // 中程度：標準サイズ
    return {
      titleFontSize: '24px',
      descriptionFontSize: '14px',
      sectionFontSize: '16px',
      bodyFontSize: '12px',
      mainImageHeight: '120px',
      stepImageHeight: '80px',
      padding: '20mm',
      spacing: 3
    };
  } else {
    // 情報量が多い場合：コンパクトに
    return {
      titleFontSize: '20px',
      descriptionFontSize: '12px',
      sectionFontSize: '14px',
      bodyFontSize: '10px',
      mainImageHeight: '100px',
      stepImageHeight: '60px',
      padding: '15mm',
      spacing: 2
    };
  }
};

export const generateRecipePDF = async (recipe: Recipe, elementRef: HTMLDivElement): Promise<void> => {
  try {
    // レイアウト設定を取得
    const layoutConfig = getLayoutConfig(recipe);
    
    // 要素にレイアウト設定を適用
    elementRef.style.padding = layoutConfig.padding;
    elementRef.style.fontSize = layoutConfig.bodyFontSize;
    
    // タイトル要素のフォントサイズを調整
    const titleElement = elementRef.querySelector('[data-pdf-title]');
    if (titleElement) {
      (titleElement as HTMLElement).style.fontSize = layoutConfig.titleFontSize;
    }
    
    // 説明要素のフォントサイズを調整
    const descriptionElement = elementRef.querySelector('[data-pdf-description]');
    if (descriptionElement) {
      (descriptionElement as HTMLElement).style.fontSize = layoutConfig.descriptionFontSize;
    }
    
    // セクションタイトルのフォントサイズを調整
    const sectionElements = elementRef.querySelectorAll('[data-pdf-section]');
    sectionElements.forEach(element => {
      (element as HTMLElement).style.fontSize = layoutConfig.sectionFontSize;
    });
    
    // 画像サイズを調整
    const mainImage = elementRef.querySelector('[data-pdf-main-image]');
    if (mainImage) {
      (mainImage as HTMLElement).style.maxHeight = layoutConfig.mainImageHeight;
    }
    
    const stepImages = elementRef.querySelectorAll('[data-pdf-step-image]');
    stepImages.forEach(element => {
      (element as HTMLElement).style.maxHeight = layoutConfig.stepImageHeight;
    });

    // 少し待ってからキャンバスに変換（スタイル適用のため）
    await new Promise(resolve => setTimeout(resolve, 100));

    // HTML要素をキャンバスに変換
    const canvas = await html2canvas(elementRef, {
      scale: 2, // 高解像度で出力
      useCORS: true, // 外部画像の読み込みを許可
      allowTaint: true, // 外部画像の使用を許可
      backgroundColor: '#ffffff',
      width: 210, // A4幅（mm）
      height: 297, // A4高さ（mm）
      scrollX: 0,
      scrollY: 0,
      windowWidth: 210,
      windowHeight: 297
    });

    // キャンバスを画像に変換
    const imgData = canvas.toDataURL('image/png');

    // PDFを作成
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // 画像をPDFに追加（A4サイズに合わせる）
    const imgWidth = 210; // A4幅
    const imgHeight = 297; // A4高さ
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // PDFをダウンロード
    const fileName = `${recipe.title.replace(/[^\w\s]/gi, '')}_recipe.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF生成エラー:', error);
    throw new Error('PDFの生成に失敗しました。');
  }
};

// 画像の読み込みを待つ関数
export const waitForImages = (element: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    const images = element.querySelectorAll('img');
    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        resolve();
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkComplete();
      } else {
        img.onload = checkComplete;
        img.onerror = checkComplete; // エラーでも続行
      }
    });
  });
}; 