# ELA — Arquitetura Supabase e evolução até versão completa

## Objetivo

Transformar o ELA de uma PWA majoritariamente local em um aplicativo com conta pessoal, sincronização segura, notificações, privacidade, histórico persistente e base pronta para a futura ELA IA, sem quebrar as funcionalidades que já existem.

## Diretriz principal

O ELA terá um projeto Supabase próprio, separado do CaptaPro e de outros sistemas operacionais. A organização Supabase onde esse projeto será criado será escolhida explicitamente pelo Raphael no momento do provisionamento, antes de qualquer criação que gere custo ou vínculo administrativo.

## Estado atual

O frontend já possui: tela Hoje, check-in de humor, energia e sintomas, ciclo menstrual, cálculo de fase, janela fértil, calendário visual, diário, agenda básica, signo, insights simples, manifest PWA e service worker.

Os dados funcionais ainda são persistidos principalmente em `localStorage`. Existe estrutura SQL preparada para perfis, check-ins, diário, agenda, preferências, lembretes e controles de privacidade, mas o frontend ainda não usa esse backend como fonte principal de dados.

## Arquitetura proposta

### 1. Autenticação

- Supabase Auth como camada única de autenticação do ELA.
- Login Google como principal método de entrada.
- Sessão persistente no dispositivo.
- Cada usuária acessa somente os próprios dados.
- Nenhuma credencial administrativa ou `service_role` será exposta no navegador.

### 2. Banco de dados

O projeto Supabase do ELA armazenará:

- `profiles`: identidade da usuária e configurações de ciclo.
- `checkins`: humor, energia, sintomas e registros diários.
- `diary_entries`: diário pessoal.
- `agenda_events`: compromissos e lembretes.
- `user_preferences`: preferências, notificações e privacidade.
- `reminders`: lembretes de ciclo, check-in, agenda e autocuidado.

Toda tabela de dados pessoais terá RLS habilitado e políticas por `auth.uid()`.

### 3. Estratégia de migração do localStorage

A migração será progressiva para preservar quem já usa o app:

1. A usuária entra com Google.
2. O app detecta dados locais existentes.
3. O app oferece importar os registros locais para a conta.
4. Após sincronização bem-sucedida, Supabase vira a fonte principal.
5. O armazenamento local passa a funcionar somente como cache/offline e fila de sincronização.

### 4. Offline e sincronização

- O ELA continuará funcionando em modo PWA.
- Registros criados sem internet serão guardados localmente com identificação de pendência.
- Ao recuperar conexão, o app sincronizará os itens pendentes.
- Conflitos simples serão resolvidos por identificador e data de atualização.
- Dados sensíveis autenticados não serão armazenados no cache HTTP do service worker.

### 5. Agenda e notificações

A agenda será expandida para conter:

- data;
- horário;
- título;
- categoria;
- observação;
- lembrete ativado/desativado;
- horário do lembrete;
- edição e exclusão.

Notificações terão permissão explícita da usuária e poderão contemplar:

- check-in diário;
- próxima menstruação;
- janela fértil estimada;
- agenda;
- autocuidado.

### 6. Ciclo e saúde pessoal

O núcleo de ciclo será refinado com:

- intensidade do fluxo;
- intensidade de cólica;
- intensidade de sintomas;
- histórico por dia;
- edição retroativa;
- diferenciação visual forte no calendário;
- avisos claros de que previsões são estimativas e não substituem método contraceptivo, diagnóstico ou orientação médica.

### 7. Signo e mensagem diária

Será unificada a propriedade de signo para um único campo canônico. A tela principal e a tela dedicada usarão a mesma origem de dados. O conteúdo permanecerá como entretenimento e bem-estar, separado de qualquer afirmação médica ou factual.

### 8. Diário e autocuidado

O diário ganhará:

- editar;
- excluir;
- busca;
- filtros por data;
- associação opcional com humor e sintomas.

Uma área de autocuidado/beleza será adicionada para registros leves como pele, cabelo, hidratação, sono, exercício, água e rotina pessoal. Esses itens serão opcionais e não serão tratados como diagnóstico.

### 9. Insights

A camada de insights cruzará somente dados registrados pela própria usuária, por exemplo:

- energia média por fase do ciclo;
- sintomas mais frequentes;
- humor mais comum por fase;
- recorrência de cólica;
- padrão recente de sono/autocuidado.

Os insights serão descritivos, não diagnósticos.

### 10. Privacidade e controle de dados

O ELA terá tela de Privacidade com:

- exportar meus dados;
- apagar meus dados do ELA;
- solicitar exclusão da conta;
- preferências de notificações;
- consentimento opcional para métricas não essenciais;
- bloqueio local quando suportado.

A exclusão de conta deverá passar por backend seguro; o frontend nunca receberá credenciais administrativas.

### 11. ELA IA

A ELA IA será implementada somente depois que autenticação, banco, RLS, sincronização e privacidade estiverem estáveis.

A IA poderá usar, com contexto autorizado da própria usuária:

- ciclo;
- humor;
- energia;
- sintomas;
- diário;
- agenda;
- autocuidado.

Ela deverá responder com linguagem de orientação e organização pessoal, sem substituir atendimento médico. Para sinais de alerta ou conteúdo clínico relevante, deverá incentivar avaliação profissional apropriada.

## Fases de entrega

### Fase A — Fechar o app atual

- corrigir inconsistência de signo;
- fortalecer ciclo e sintomas;
- completar diário;
- completar agenda;
- adicionar autocuidado/beleza;
- melhorar insights;
- completar PWA/offline.

### Fase B — Backend próprio

- criar projeto Supabase exclusivo do ELA;
- aplicar schema e políticas RLS;
- ativar Google Auth;
- conectar frontend;
- importar dados locais;
- habilitar sincronização.

### Fase C — Privacidade e notificações

- preferências;
- lembretes;
- exportação;
- exclusão;
- notificações push/locais compatíveis com PWA.

### Fase D — ELA IA

- endpoint seguro;
- contexto pessoal mínimo necessário;
- controles de privacidade;
- respostas orientativas e não diagnósticas.

## Critérios de conclusão

O ELA será considerado tecnicamente completo quando:

- login Google funcionar de ponta a ponta;
- cada usuária enxergar apenas seus próprios dados;
- ciclo, check-ins, diário e agenda persistirem no Supabase;
- dados locais puderem ser importados sem perda;
- o app funcionar offline e sincronizar depois;
- notificações e agenda funcionarem com permissão da usuária;
- privacidade, exportação e exclusão estiverem acessíveis no app;
- PWA instalar e abrir em modo standalone;
- calendário, signo e histórico estiverem consistentes entre telas;
- ELA IA usar somente dados autorizados e respeitar os limites definidos acima.

## Restrições

- Não misturar dados do ELA com CaptaPro.
- Não expor `service_role` ou segredos no frontend.
- Não remover suporte offline já existente.
- Não transformar previsões de ciclo em orientação contraceptiva ou diagnóstico.
- Não implantar ELA IA antes da base de autenticação, dados e privacidade estar validada.
