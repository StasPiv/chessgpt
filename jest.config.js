module.exports = {
  preset: null,
  testEnvironment: 'node',
  
  // Разрешить ES-модули
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Настройки трансформации
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { 
      presets: [
        ['@babel/preset-env', { modules: 'commonjs' }],
        '@babel/preset-typescript'
      ]
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', { 
      presets: [
        ['@babel/preset-env', { modules: 'commonjs' }]
      ]
    }]
  },
  
  // Не игнорировать ES-модули в node_modules
  transformIgnorePatterns: [],
  
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  testMatch: [
    '**/tests/**/*.test.(js|jsx|ts|tsx)',
    '**/__tests__/**/*.test.(js|jsx|ts|tsx)'
  ],
  
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/**/*.d.ts'
  ]
};
