
import * as fs from 'fs';
import * as path from 'path';

const scenariosDir = path.join(__dirname, 'DeleteVariationScenarios');

// Функция для загрузки всех JSON файлов из папки сценариев
function loadScenarios() {
  const scenarios: any[] = [];

  if (fs.existsSync(scenariosDir)) {
    const files = fs.readdirSync(scenariosDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(scenariosDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        scenarios.push(JSON.parse(content));
      }
    }
  }

  return scenarios;
}

export const deleteVariationScenarios = loadScenarios();