import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import security from 'eslint-plugin-security'

export default tseslint.config(
  { ignores: ['dist/'] },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  security.configs.recommended,
  prettier,
)
