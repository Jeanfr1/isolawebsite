# Isola — kit visual e roteiros

Direção aprovada: primeira proposta clara, com troca de sabores do Universo de Sabores.

Comece pelos PDFs em `roteiros/`: o roteiro da animação explica scroll, troca manual, partículas, encaixe e passagem ao catálogo; o roteiro das seções define layout, textos em dinamarquês e ordem de montagem.

## Imagens

- 01–04: bolas de Pistacie, Saltkaramel, Mango-sorbet e Hindbær-sorbet, com transparência.
- 05–08: ingredientes separados para órbitas e detalhes; reutilize instâncias com movimento independente.
- 09: casquinha separada, com transparência.
- 10: logo PNG transparente, adaptação da marca fornecida para o header.
- 11: composição estática do hero de pistache, com transparência.
- 12: adaptação visual da foto da loja, reconstruída a partir da referência; conferir com o original antes da publicação.
- 13: affogato ilustrativo para a seção de bebidas.
- 14: imagem original da placa fornecida, sem alteração.

`referencias/` inclui três mockups, os menus e a foto da loja. `manifest.json` registra tamanhos, área visível, cores e sugestões iniciais de alinhamento. Os PNGs são fontes; produza versões otimizadas no tamanho adequado durante a implementação.

As quatro bolas foram criadas com câmera e luz semelhantes, mas precisam de alinhamento pela área visível. A composição estática deve ser reduzida para caber integralmente no palco, preservando a ponta do cone e os ingredientes.

## Animação

Sequência: pistache → caramelo → manga → framboesa → encaixe na casquinha → catálogo. O seletor manual usa a mesma transição. Fundos, títulos e botões pertencem ao site: não estão gravados nos PNGs.

Este pacote permite animação em 2,5D com deslocamento, escala, parallax e rotação no plano. Não contém modelos 3D, vídeos ou frames consecutivos. O site e a animação ainda precisam ser implementados. Para movimento reduzido, use a composição estática e mantenha o seletor funcional.

As imagens de produto são apresentações conceituais. Confirme apresentação real, sabores, descrições, endereço, horário e canais de contato antes de publicar. O roteiro indica os pontos onde inserir esses dados.

## Produção

Imagens criadas com a ferramenta integrada imagegen; prompts completos em `prompts-imagegen.txt`. Guias criados em PDF. Fontes PNG preservadas sem corte, recompressão ou alteração do canal alfa.
