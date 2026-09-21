# ELA — padrão de renderização segura

Dados vindos da usuária (diário, humor, sintomas, notas, títulos e qualquer texto livre) devem ser tratados como **texto**, nunca como HTML.

## Regra

- Preferir `ELASafeDOM.setText`, `ELASafeDOM.appendText` e `ELASafeDOM.createTextElement` de `safe-dom.js`.
- Não concatenar valores da usuária em `innerHTML`.
- `innerHTML` só pode ser usado para marcação totalmente estática/controlada pelo aplicativo.
- Ao precisar de texto em negrito, barras ou cartões, criar os elementos com `document.createElement` e preencher dados pessoais com `textContent`.

## Superfícies prioritárias

1. `insights.html`: humor, sintomas, padrões por fase e “ELA percebeu”.
2. Histórico do check-in/diário.
3. Qualquer nova tela que reutilize dados de `localStorage` ou, futuramente, Supabase.

## Casos mínimos de validação

Os valores abaixo devem aparecer literalmente na interface, sem criar elementos HTML nem executar código:

- `<script>alert(1)</script>`
- `<img src=x onerror=alert(1)>`
- `A&B "teste" 'teste'`
- `cólica 😣`
- `ansiedade 🌷`
- `ação, coração, TPM & cólicas`

## Critério para sincronização

Antes de sincronizar dados íntimos com Supabase/Google Login, revisar as superfícies que exibem conteúdo pessoal e garantir isolamento por usuário/RLS no backend. A sanitização de saída não substitui RLS; são camadas diferentes de proteção.
