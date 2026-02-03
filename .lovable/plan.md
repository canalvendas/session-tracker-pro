
## Plano: Garantir Visibilidade do ClinicManager para Todos os Usuários Independentes

### Diagnóstico

Após análise do banco de dados e código:

| Usuário | Role | manager_id | Tem Clínicas |
|---------|------|------------|--------------|
| tielsm@gmail.com | manager | null | 0 |
| batistamusicoterapeuta2@gmail.com | manager | null | 0 |
| anderson@gmail.com | professional | null | 2 |
| canalvendas54@gmail.com | admin | null | 4 |

**Problema Identificado:** Usuários com role `manager` que não têm `manager_id` (são independentes) deveriam ver o ClinicManager, mas a imagem mostra que não está aparecendo.

Pelo código atual em `SettingsPage.tsx`, o ClinicManager aparece quando `isLinkedProfessional = false`, que é o caso para todos os usuários sem `manager_id`.

### Solução

O código está teoricamente correto. Vou fazer duas melhorias:

1. **Verificar se é problema de ordem de renderização** - mover o ClinicManager para garantir que sempre apareça antes de outros cards para usuários independentes.

2. **Adicionar verificação explícita** - garantir que managers independentes também vejam suas clínicas.

---

### Alterações em `src/pages/SettingsPage.tsx`

#### 1. Reorganizar a ordem dos componentes na renderização

Atualmente:
```text
1. ManagerProfessionalsSection (se manager)
2. ClinicManager OU Card "Gerenciado pelo gestor"
3. Week Start
4. ...
```

O código atual (linhas 106-134) já está correto:
- Se `isLinkedProfessional = false` (profissional independente) mostra ClinicManager
- Se `isLinkedProfessional = true` (profissional vinculado) mostra mensagem

**Verificação:** O problema pode ser que `isLinkedProfessional` está sendo passado incorretamente. Vou adicionar log para debug e garantir que a prop está correta.

#### 2. Modificar lógica para garantir visibilidade

Arquivo: `src/pages/SettingsPage.tsx`

Alteração nas linhas 110-134:
- Remover a condição que esconde completamente o ClinicManager
- Sempre mostrar o ClinicManager para todos os usuários que não são linked professionals

```typescript
// Mudança proposta:
{/* Clinic Manager - Visible to all independent users (including managers) */}
{!isLinkedProfessional && (
  <ClinicManager
    clinics={clinics}
    onAdd={onAddClinic}
    onUpdate={onUpdateClinic}
    onDelete={onDeleteClinic}
  />
)}

{/* Message for linked professionals */}
{isLinkedProfessional && (
  <Card variant="glass" className="border-primary/20 bg-primary/5">
    ...mensagem atual...
  </Card>
)}
```

Na verdade, olhando o código existente, já está assim! O problema é outro.

---

### Possível Causa Real

Revisando os dados:
- Os usuários `tielsm` e `batistamusicoterapeuta2` têm **0 clínicas** cadastradas
- O ClinicManager deveria mostrar "Nenhuma clínica cadastrada" com botão de adicionar

**Problema:** O código está correto, mas pode haver cache ou problema de estado.

### Alteração Proposta

Para garantir funcionamento, vou:

1. **Adicionar log de debug** temporariamente em `SettingsPage.tsx` para confirmar os valores
2. **Verificar se há alguma condição adicional** que está escondendo o componente

Após verificação, se o código está correto, a solução é pedir ao usuário para:
- Limpar cache do navegador (Ctrl+Shift+Delete)
- Fazer hard refresh (Ctrl+Shift+R)

---

### Resumo da Implementação

| Arquivo | Ação |
|---------|------|
| `src/pages/SettingsPage.tsx` | Verificar e corrigir condição de exibição do ClinicManager |

### Verificação Técnica

O código atual em SettingsPage.tsx (linhas 110-134) usa:
```tsx
{!isLinkedProfessional ? (
  <ClinicManager ... />
) : (
  <Card>mensagem</Card>
)}
```

Para usuários como `tielsm@gmail.com`:
- `manager_id = null` no banco
- Em App.tsx linha 104: `isLinkedProfessional = Boolean(profile.manager_id)` = `Boolean(null)` = `false`
- Portanto `!isLinkedProfessional = true` e ClinicManager deveria aparecer

**Conclusão:** O código está correto. Se não está aparecendo, é provável que seja cache do PWA ou do browser.

### Ações Recomendadas

1. Limpar dados do site (Application → Storage → Clear site data)
2. Fazer refresh forçado (Ctrl+Shift+R)
3. Se persistir, verificar no console do browser por erros
