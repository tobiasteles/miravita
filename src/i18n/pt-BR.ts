// Idioma-base. TODA chave nova nasce aqui e em en.ts (o TypeScript e o teste acusam chave faltando).
// Convenções: "err.*" = mensagens de erro vindas do servidor (viajam em ?error=chave e só chaves válidas são aceitas);
// {nome} = variável; números e datas NÃO entram aqui: use fmt (Intl).
export const ptBR = {
  // comum
  "common.close": "Fechar",
  "common.continue": "Continuar",
  "lang.label": "Idioma",
  "lang.pt-BR": "Português (BR)",
  "lang.en": "English",
  "meta.title": "Miravita — Desperte o seu poder",
  "meta.description": "MMORPG de navegador: caçadores, portais, calabouços e a sua própria técnica suprema.",
  "meta.ogDescription": "Desperte o seu poder.",
  // página inicial
  "home.tagline": "Seja um Desperto: reúna o poder despedaçado, enfrente portais e forje a sua técnica suprema.",
  "home.cta": "Despertar",
  "home.news": "Notícias",
  // login e cadastro
  "auth.signIn": "Entrar",
  "auth.signUp": "Criar conta",
  "auth.namePlaceholder": "Nome de jogador (opcional)",
  "auth.email": "Email",
  "auth.password": "Senha",
  "auth.passwordNew": "Senha (mín. 8 caracteres)",
  "auth.passwordRepeat": "Repita a senha",
  "auth.submitUp": "Criar conta e jogar",
  "auth.haveAccount": "Já tem conta?",
  "auth.firstTime": "Primeira vez?",
  "err.auth.badLogin": "Email ou senha incorretos.",
  "err.auth.tooMany": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  "err.auth.tooManyAccounts": "Muitas contas criadas deste lugar. Tente de novo mais tarde.",
  "err.auth.email": "Email inválido.",
  "err.auth.pwShort": "A senha precisa ter pelo menos 8 caracteres.",
  "err.auth.pwLong": "A senha pode ter no máximo 128 caracteres.",
  "err.auth.pwEqualsEmail": "A senha não pode ser igual ao email.",
  "err.auth.pwMismatch": "As senhas não são iguais.",
  "err.auth.emailTaken": "Este email já tem conta. Entre ou peça a redefinição.",
  // seleção e criação de personagem
  "char.title": "Seus personagens ({n}/6)",
  "char.play": "Jogar",
  "char.delete": "Excluir",
  "char.level": "Nv. {n}",
  "char.create": "Criar personagem",
  "char.new": "Novo personagem",
  "char.namePlaceholder": "Nome único",
  "char.appearance": "Aparência",
  "char.appearanceN": "Aparência {n}",
  "char.traits": "Personalidade (até 2)",
  "err.char.name": "Nome inválido (3–16 caracteres).",
  "err.char.class": "Classe inválida.",
  "err.char.avatar": "Avatar não pertence à classe.",
  "err.char.seed": "Rode o seed: npm run db:seed",
  "err.char.limit": "Limite de 6 personagens ou nome já em uso.",
  "err.char.notFound": "Personagem não encontrado.",
} as const;
export type Key = keyof typeof ptBR;
export type Dict = { [K in Key]: string };
