﻿# Elegoo Print Control

**Aplicativo Web e Mobile para Monitoramento e Controle Remoto de Impressoras 3D Elegoo**

---

## 🧠 Descrição do Projeto

Este projeto consiste em um sistema completo para o **monitoramento em tempo real** e **controle remoto** de impressoras 3D Elegoo que utilizam o protocolo **SDCP**. O sistema é compatível com **qualquer modelo Elegoo** que suporte SDCP, como a Saturn 4 Ultra, já que o usuário informa o IP da impressora diretamente no aplicativo.

O projeto é desenvolvido como Trabalho de Conclusão de Curso em Engenharia da Computação – PUC Campinas.

---

## 🚀 Tecnologias Utilizadas

- **Frontend (Web/Mobile)**: React + TypeScript
- **Backend**: Node.js + Express
- **Comunicação com Impressora**: WebSockets via protocolo SDCP
- **Notificações Push**: Firebase Cloud Messaging (FCM)
- **Banco de Dados (opcional)**: PostgreSQL, Firebase ou outro

---

## ⚙️ Funcionalidades

- ✅ Visualização de status em tempo real da impressora
- ✅ Controles de impressão: **pausar**, **retomar** e **cancelar**
- ✅ Tempo total, tempo restante, previsão de término e progresso (%)
- ✅ Controles de temperatura, uso do fep film
- ✅ Informações básicas da impressora: nome, modelo, versão do firmware
- ✅ Informações sobrea as configurações da impressão: altura de camada, tempo de exposição, quantidade de camada base, tempo de exposição da camada base  
- ✅ Configuração do IP da impressora na tela inicial
- ✅ Compatível com todas as impressoras **Elegoo com SDCP**
- 🚧 Notificações push [ex: impressão finalizada, erros] (em desenvolvimento)
- 🚧 Visualização via câmera (em desenvolvimento)
- 🚧 Histórico de impressões (em desenvolvimento)

---

## 🛠️ Como Rodar o Projeto

### 📌 Requisitos

- Node.js v18+
- Yarn ou npm
- Impressora Elegoo conectada na rede local

### 🔧 Utilizando via terminal

```bash
cd /caminho/do/projeto
npm install
# ou
yarn install

npm run dev
```

No seu navegador: http://localhost:8080

---

## 📘 Referências

- [Elegoo SDCP Protocol (SDCP 3.0)](https://github.com/cbd-tech/SDCP-Smart-Device-Control-Protocol-V3.0.0/blob/main/SDCP(Smart%20Device%20Control%20Protocol)_V3.0.0_EN.md)
- React + TypeScript
- Node.js WebSocket (`ws`)

---

## 👨‍💻 Autor

**Gabriel S. Garcia**  
Aluno de Engenharia da Computação – PUC Campinas  
📧 gabriel.sg2@puccampinas.edu.br
