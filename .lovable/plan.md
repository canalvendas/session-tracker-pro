# Corrigir falha de conexão no login

## Diagnóstico confirmado

O backend hospedado do TeraDay está pausado. Enquanto permanecer assim, autenticação e banco não respondem, causando `Failed to fetch`. Os registros também mostram que o retry atual repete a mesma tentativa sem conseguir alcançar o serviço.

## Plano

1. Retomar o backend do Lovable Cloud e aguardar até que banco e autenticação estejam saudáveis.
2. Testar a conectividade do serviço de autenticação e executar um login real pela página `/auth`.
3. Se o backend estiver saudável, mas a tela ainda falhar, revisar a chamada no navegador e corrigir somente o ponto residual confirmado.
4. Ajustar o tratamento de erro para distinguir serviço temporariamente indisponível de credenciais inválidas, evitando retries duplicados e mensagens enganosas.
5. Validar login, sessão persistida, redirecionamento após entrada e ausência de novos erros de rede no console.

## Resultado esperado

O login volta a conectar normalmente quando o backend estiver ativo, e indisponibilidades futuras passam a exibir uma mensagem clara sem disparar chamadas duplicadas.