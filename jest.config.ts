module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',  // Carpeta donde se guardarán los reports
    collectCoverageFrom: [          // Archivos a incluir en el análisis
        'src/**/*.ts',
        '!src/**/*.d.ts',             // Excluye archivos de declaración TypeScript
        '!src/**/index.ts',           // Excluye archivos índice
        '!src/**/__tests__/**',       // Excluye los tests mismos
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        'app.ts',
        'src/config/',
        'src/utils/',
        'server.ts',
        'config/database.ts',
        'src/tests/__mocks__',
        'src/services/',
        'src/middlewares/',
        'src/tests/',
    ]
};