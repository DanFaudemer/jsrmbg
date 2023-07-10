/* eslint-env node */
module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'airbnb-base', 'airbnb-typescript/base'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json'
    },
    plugins: ['@typescript-eslint'],
    root: true,
    rules: {
        "import/no-extraneous-dependencies":[
            "error",
            {
               "devDependencies":[
                  "./vite.config.ts",
               ]
            }
          ]
    }
};