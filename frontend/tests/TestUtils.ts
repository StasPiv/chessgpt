// Функция для рекурсивного сравнения ходов, проверяя только san и globalIndex для next/previous
export function compareMovesIgnoringCircular(actual: any, expected: any): boolean {
  // Если оба null или undefined
  if (actual == null && expected == null) return true;
  if (actual == null || expected == null) return false;

  // Проверяем основные поля
  if (actual.san !== expected.san || actual.globalIndex !== expected.globalIndex) {
    return false;
  }

  // Проверяем next - только san и globalIndex
  if (expected.next) {
    if (!actual.next) return false;
    if (actual.next.san !== expected.next.san || actual.next.globalIndex !== expected.next.globalIndex) {
      return false;
    }
  } else {
    if (actual.next !== null) return false;
  }

  // Проверяем previous - только san и globalIndex
  if (expected.previous) {
    if (!actual.previous) return false;
    if (actual.previous.san !== expected.previous.san || actual.previous.globalIndex !== expected.previous.globalIndex) {
      return false;
    }
  } else {
    if (actual.previous !== null) return false;
  }

  // Проверяем variations рекурсивно
  if (expected.variations) {
    if (!actual.variations || !Array.isArray(actual.variations)) return false;
    if (actual.variations.length !== expected.variations.length) return false;

    for (let i = 0; i < expected.variations.length; i++) {
      const actualVariation = actual.variations[i];
      const expectedVariation = expected.variations[i];

      if (!Array.isArray(actualVariation) || !Array.isArray(expectedVariation)) return false;
      if (actualVariation.length !== expectedVariation.length) return false;

      for (let j = 0; j < expectedVariation.length; j++) {
        if (!compareMovesIgnoringCircular(actualVariation[j], expectedVariation[j])) {
          return false;
        }
      }
    }
  } else {
    // Если variations не ожидается, проверяем что его нет или он пустой
    if (actual.variations && actual.variations.length > 0) return false;
  }

  return true;
}

// Функция для удаления циклических ссылок next и previous из объектов ходов
export function removeNextAndPreviousReferences(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeNextAndPreviousReferences(item));
  }

  if (typeof obj === 'object') {
    const cleanedObj: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Пропускаем next и previous ссылки
        if (key === 'next' || key === 'previous') {
          continue;
        }
        
        // Рекурсивно обрабатываем другие свойства
        if (key === 'variations' && Array.isArray(obj[key])) {
          cleanedObj[key] = obj[key].map((variation: any[]) => 
            variation.map((move: any) => removeNextAndPreviousReferences(move))
          );
        } else if (typeof obj[key] === 'object') {
          cleanedObj[key] = removeNextAndPreviousReferences(obj[key]);
        } else {
          cleanedObj[key] = obj[key];
        }
      }
    }
    
    return cleanedObj;
  }

  return obj;
}