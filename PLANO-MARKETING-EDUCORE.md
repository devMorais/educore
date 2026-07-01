# 📣 Plano de Marketing — EduCore (vender assinaturas)

> Objetivo único: gerar **assinantes pagantes recorrentes** (MRR) para o EduCore.
> Complementa `PLANO-NEGOCIO.md` (estratégia geral) e `MULTITENANT-BILLING.md` (billing técnico) — este documento é só a engrenagem de marketing/aquisição.
> Fundador: Fernando Morais · Última atualização: 30/06/2026.

---

## 1. Pré-requisito de verdade (não pule)

Marketing não compensa produto não-vendável. Antes de gastar 1 real ou 1 hora em aquisição, confirme com o `MULTITENANT-BILLING.md`:

- [ ] Sprint 1 (planos + quota) concluído
- [ ] Sprint 2 (Asaas + `/precos` + checkout) concluído
- [ ] Página `/precos` pública no ar
- [ ] Cadastro self-service funcionando ponta a ponta (sem você intervir manualmente)

> Se isso não estiver pronto, qualquer clique pago ou post é **dinheiro/tempo jogado fora** — o visitante chega e não tem como assinar.

---

## 1.5 Realidade competitiva (pesquisa de mercado — 30/06/2026, com verificação de fonte)

Pesquisa em duas rodadas: primeiro mapeamento de concorrentes, depois checagem de **prova real e independente** (Reclame Aqui, Crunchbase, CNPJ, Instagram, reviews de terceiro) — não só o que a própria empresa diz de si.

### Verificados (prova de terceiro, tratar como real)
| Empresa | Prova independente | Implicação |
|---|---|---|
| **Smallpdf** | Crunchbase/Latka: **US$ 8,3M/ano de receita**, 500M usuários históricos, 75 funcionários, empresa real desde 2013 | Confirma que existe mercado pagante real para "PDF + IA". Mas é genérico (não educação específica), e free tier forte — concorre em features básicas, não no nicho. |
| **SlideSpeak** | Perfil real em Crunchbase/Tracxn, startup americana (2023, 9 funcionários), compete num mercado de 195 players de "IA pra apresentação" (Gamma, Prezi, Tome) | Prova que o nicho "PDF/slide com IA" atrai investimento de verdade — mercado validado, ainda que não brasileiro/educação. |
| **Avalea / Qconcursos** | Qconcursos é empresa brasileira grande, com reclamações reais no Reclame Aqui (cobrança, conteúdo) — sinal de operação real e clientes reais, não fachada | Confirma que **brasileiro paga** por ferramenta de estudo/concurso em escala. Avalea (o gerador de questões) é um módulo gratuito dentro de um produto maior pago — não é concorrente direto de assinatura, é isca de aquisição deles. |

### Não verificados (sem CNPJ, sem Reclame Aqui, sem Instagram localizável, sem review de terceiro)
| Empresa | O que existe | O que NÃO existe |
|---|---|---|
| **Profez** | Site com a oferta | Nenhum CNPJ, Reclame Aqui ou Instagram encontrados. (Cuidado: buscas confundem com "Profes", empresa diferente de tutoria com reclamações reais — não usar essas reclamações como se fossem do Profez.) |
| **Pedagora** | Site com depoimentos ("2.000+ professores", "fiquei impressionado") | Os depoimentos estão só no próprio site — sem fonte cruzada nenhuma. Padrão clássico de prova social fabricada/exagerada. Tratar como **não confiável até prova em contrário**. |
| **StudyGlen** | Site/ferramenta no ar | Nenhum rastro de empresa, fundadores, CNPJ ou usuários reais |
| **AprendiZAP** | Site no ar, ligado à Fundação 1Bi (essa sim é real — ONG de impacto social conhecida) | Sem dados de volume de uso ou prova de que professores pagam por algo (aliás, é declaradamente 100% gratuito — não é concorrente de assinatura) |
| **Criador de Provas** | Site no ar | Nenhum rastro de empresa/usuários reais |

### O que isso muda na leitura

- A ameaça que eu tinha descrito antes ("brasileiras já com BNCC tomando o mercado") **era construída em cima de marketing não verificado**, inclusive uma confusão de nomes (Profez/Profes). Reduzo a confiança nessa ameaça específica.
- A prova **real** de mercado pagante vem de fora do nicho educação-BR (Smallpdf, SlideSpeak) e de uma gigante brasileira adjacente (Qconcursos) — ou seja: **existe apetite comprovado para pagar por ferramentas de IA + documento**, mas a concorrência brasileira específica em "PDF de aula → material pronto" parece, pela pesquisa disponível, **pequena, não comprovada ou inexistente em escala** — o que é uma oportunidade, não só uma ameaça.
- Isso não significa "não tem concorrência" — significa que **a barreira real não é concorrência brasileira estabelecida, é a alternativa genérica grátis** (Smallpdf, SlideSpeak, ChatGPT direto) que qualquer professor pode usar sem pagar nada.

**Candidatos de diferencial, em ordem de esforço (mantém-se válido independente da checagem acima):**
1. **Qualidade visual do slide** (já existe: "11 layouts, Padrão Ouro Pedagógico" no README) — defensável se for visivelmente melhor que o output genérico do Smallpdf/SlideSpeak. Precisa de teste lado a lado antes de virar argumento de venda.
2. **Alinhamento BNCC** — não fazer essa promessa enquanto não existir de fato no produto. Avaliar como item de roadmap.
3. **Volume/consistência para curso ou equipe** — nenhum concorrente mapeado (verificado ou não) ataca esse ângulo claramente. É a brecha mais limpa hoje.

> **Decisão necessária antes do mês 1 de marketing:** rodar um teste lado a lado (EduCore vs. Smallpdf vs. SlideSpeak — os dois concorrentes reais e verificados) e decidir HONESTAMENTE qual diferencial é defensável agora.

---

## 2. Quem compra (segmentação, não "todo mundo")

| Segmento | Dor específica | Onde está | Prioridade |
|---|---|---|---|
| **Professor autônomo / particular** | Perde horas montando prova, resumo, slide de aula | Instagram/TikTok de educação, grupos de WhatsApp de professores, Facebook (ainda forte nesse público) | 🥇 1º foco |
| **Curso livre / cursinho / pré-vestibular pequeno** | Precisa de material padronizado em volume, equipe enxuta | Indicação, Google ("apostila automática", "gerador de prova IA") | 🥈 2º foco |
| **Infoprodutor / criador de curso online (Hotmart/Udemy)** | Quer transformar PDF/ebook em aula em vídeo/slide rápido | Comunidades de infoprodutores, Instagram | 🥉 3º foco |
| **RH / T&D corporativo** | Converter manuais/PDFs em treinamento | LinkedIn | Fase 2 (ticket maior, ciclo de venda mais longo) |
| **Instituição de ensino (escola/faculdade)** | Volume + necessidade de contrato | Outbound direto | Fase 2/3 (plano Instituição, sob consulta) |

**Regra:** escolha **um segmento (professor autônomo)** para os primeiros 60 dias. Tentar falar com todos ao mesmo tempo dilui a mensagem e o orçamento.

---

## 3. Proposta de valor por segmento (mensagem, não feature)

> Mensagens abaixo assumem que a seção 1.5 foi resolvida (diferencial real escolhido). Sem isso, qualquer uma destas frases também descreve uma ferramenta grátis — e a venda não acontece.

- **Professor autônomo:** "Pare de passar a noite montando prova. Suba o PDF da matéria, em segundos você tem quiz, resumo e slide prontos pra aula de amanhã." — reforçar com o diferencial escolhido (ex: "...e com slide que parece feito por designer, não modelo genérico").
- **Curso/cursinho:** "Padronize o material de todos os professores do seu curso, sem aumentar a equipe." — este é hoje o ângulo mais defensável (ver seção 1.5, item 3), porque os concorrentes grátis mapeados são uso individual, não em volume/equipe.
- **Infoprodutor:** "Seu PDF de R$ 97 vira aula em slide, resumo e quiz — mais valor percebido, mesmo produto."

Evite falar de "IA generativa, RAG, pgvector" pro cliente final — isso é argumento técnico pra fábrica/investidor, não para quem compra. O cliente quer **tempo de volta**, não arquitetura.
Evite também prometer "alinhado à BNCC" enquanto isso não existir de fato no produto — Profez e Pedagora já entregam isso e a mentira derruba a confiança rápido num nicho pequeno e conectado (professores trocam recomendação entre si).

---

## 4. Canais e o que fazer em cada um (90 dias)

### 4.1 Conteúdo orgânico (motor principal — baixo custo, alto esforço consistente)
- **Instagram/TikTok:** vídeos curtos "antes/depois" — pega um PDF real de apostila, mostra o quiz/resumo/slide saindo em segundos. Esse é o gancho mais forte que existe pro produto (é visualmente chocante de tão rápido).
- **Frequência mínima:** 3 posts/semana. Menos que isso, o algoritmo não pega tração.
- **Formatos que funcionam pra esse nicho:** demo em tela, "professor reage", comparação tempo manual vs EduCore, depoimento de professor beta.

### 4.2 Comunidades e grupos (onde o público já está, custo zero)
- Grupos de WhatsApp/Telegram/Facebook de professores (existem centenas, por matéria/estado/concurso).
- Não entrar vendendo — entrar ajudando, depois oferecer teste grátis quando fizer sentido na conversa.

### 4.3 SEO de cauda longa (médio prazo, mas composto)
- Página `/precos` e landing precisam ranquear para: "gerador de prova com IA", "resumo automático de PDF", "criar slide a partir de PDF", "apostila em quiz automático".
- 1 artigo de blog/semana respondendo essas buscas, com CTA para teste grátis.

### 4.4 Tráfego pago (só depois de validar conversão orgânica)
- Meta Ads (Instagram/Facebook) segmentado por interesse em "educação", "concursos", "ensino" — CPC baixo nesse nicho no Brasil.
- **Não ligar tráfego pago antes de ter pelo menos 10-20 assinantes orgânicos** — primeiro confirme que o funil converte sem pagar por clique, senão você só acelera o vazamento.

### 4.5 Parceria / afiliados (alavanca de baixo custo)
- Professores influentes de nicho (mesmo com poucos seguidores, ex: 2-5k) topam divulgar em troca de assinatura grátis + comissão recorrente (ex: 20-30% nos 3 primeiros meses do indicado).
- Reaproveita o "Sistema de indicação" já desenhado no `PRIMEIROS-CLIENTES.md` — mesma lógica, agora para SaaS.

---

## 5. Funil (visão simples, métrica por etapa)

```
Alcance (posts, grupos, SEO, ads)
   ↓
Visita /precos ou landing
   ↓
Cadastro (Free / trial)
   ↓
Ativação — 1º PDF processado com sucesso  ⚠️ etapa crítica, ver seção 6
   ↓
Conversão — vira assinante pago (Pro/Equipe)
   ↓
Retenção — segue pagando mês 2, 3, 4...
   ↓
Indicação — traz outro assinante
```

**Métrica que mais importa no início não é tráfego — é Cadastro → Ativação.** Se a pessoa se cadastra e nunca sobe um PDF, marketing trouxe gente, mas o produto não converteu. Meça isso antes de gastar mais em topo de funil.

---

## 6. Ativação e onboarding (o marketing não para no cadastro)

- **Free tier generoso o suficiente pra sentir o "uau"** (3 PDFs/mês já está bom, segundo o `PLANO-NEGOCIO.md` — manter).
- **E-mail/onboarding automático:** ao cadastrar, guiar direto pra "suba seu primeiro PDF" — não deixar a pessoa cair numa tela vazia sem saber o próximo passo.
- **Gatilho de upgrade natural:** quando bater no limite do Free (HTTP 402 já mapeado no billing técnico), a mensagem do modal **é** uma peça de marketing — precisa vender o upgrade ali, não só avisar limite.

---

## 7. Calendário de execução (alinhado ao roteiro técnico do `PLANO-NEGOCIO.md`)

**Mês 1 — Fundação de marketing (em paralelo ao Sprint 1 de billing)**
- [ ] Teste lado a lado EduCore vs. Smallpdf vs. SlideSpeak (mesmo PDF) — decidir o diferencial real (seção 1.5)
- [ ] Definir 1 segmento foco (professor autônomo)
- [ ] Gravar 6 vídeos demo "PDF → quiz/resumo/slide em segundos"
- [ ] Criar perfil Instagram/TikTok do EduCore
- [ ] Entrar em 10 grupos de professores
- [ ] Escrever página `/precos` com a proposta de valor da seção 3 (não "RAG/pgvector")

**Mês 2 — Lançamento beta (alinhado ao Sprint 2 de billing — cobrança ativa)**
- [ ] Recrutar 10-15 professores beta (grupos quentes, sem cobrar ainda — trial estendido)
- [ ] Coletar depoimento em vídeo de quem usou
- [ ] Publicar 3x/semana no Instagram/TikTok com os depoimentos
- [ ] Lançar artigo de blog #1 (SEO)
- [ ] Abrir programa de indicação (seção 4.5)

**Mês 3 — Tração paga (alinhado ao Sprint 3 — operação)**
- [ ] Validar conversão orgânica (cadastro → ativação → pago)
- [ ] Se conversão > 15% ativação e funil saudável: ligar primeiro orçamento de tráfego pago (teste pequeno, R$ 500-1000)
- [ ] Meta: 30-50 assinantes pagos, MRR inicial visível
- [ ] 2º e 3º artigo de blog

---

## 8. O que NÃO fazer

- ❌ Comprar tráfego antes do checkout/billing funcionar de ponta a ponta.
- ❌ Vender "PDF vira quiz/resumo/slide" como diferencial isolado — é commodity grátis hoje (StudyGlen, SlideSpeak, Smallpdf).
- ❌ Prometer "alinhado à BNCC" sem isso existir no produto — Profez/Pedagora já entregam de verdade.
- ❌ Falar de arquitetura técnica (RAG, embeddings, pgvector) na comunicação pro cliente final.
- ❌ Tentar atingir todos os segmentos ao mesmo tempo nos primeiros 60 dias.
- ❌ Lançar sem pelo menos 5-10 depoimentos/casos reais — prova social é o que vende IA pra quem desconfia de "mais uma ferramenta de IA".
- ❌ Deixar o Free tier tão fraco que ninguém sente o produto, nem tão forte que ninguém precisa pagar.

---

## 9. Indicadores a acompanhar (dashboard simples no Avante/planilha)

| Métrica | Onde vem | Meta mês 3 |
|---|---|---|
| Cadastros novos | Laravel `/api/admin` (estender `AdminController`, ver billing técnico) | 150+ |
| Taxa de ativação (1º PDF processado) | mesmo | > 40% |
| Taxa de conversão Free → Pago | mesmo | > 8-10% |
| MRR | `subscriptions` ativas × preço | R$ 1.000-2.000 |
| Churn mensal | cancelamentos / assinantes ativos | < 8% |
| Custo por assinante (quando houver ads) | gasto ads / novos assinantes | < 1 mês de mensalidade |

---

## 10. Como isso entra no Avante (produção)

Use o quadro **"Marketing EduCore"** com os épicos abaixo (ver `marketing-educore-tasks.json` no mesmo diretório, pronto pro importador JSON em massa do Avante):

- Conteúdo & Demos
- Comunidades & Parcerias
- SEO & Landing
- Onboarding & Ativação
- Tráfego Pago
- Métricas & Indicadores
