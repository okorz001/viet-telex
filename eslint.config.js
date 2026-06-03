import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import security from 'eslint-plugin-security'
import tsdoc from 'eslint-plugin-tsdoc'

export default tseslint.config(
  { ignores: ['dist/'] },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: { tsdoc },
    rules: {
      'tsdoc/syntax': 'error',
    },
  },
  security.configs.recommended,
  prettier,
)
