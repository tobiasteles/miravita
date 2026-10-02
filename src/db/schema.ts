// src/db/schema.ts
import {
  pgTable, pgEnum, uuid, text, integer, bigint, real, boolean,
  timestamp, jsonb, primaryKey, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ───────────── ENUMS ───────────── */
export const classKeyEnum = pgEnum("class_key", ["exatas", "humanas", "linguagens"]);
export const rarityEnum = pgEnum("rarity", ["comum", "raro", "epico", "lendario"]);
export const itemTypeEnum = pgEnum("item_type", [
  "material", "arma", "armadura", "acessorio", "catalisador", "consumivel",
]);
export const guildRankEnum = pgEnum("guild_rank", ["lider", "oficial", "veterano", "membro"]);
export const chatChannelEnum = pgEnum("chat_channel", ["global", "guilda"]);
export const biomeEnum = pgEnum("biome", [
  "planicie", "floresta", "deserto", "montanha", "pantano", "tundra", "vulcao", "abismo",
]);

/* ───────────── USERS ───────────── */
// Se usar Clerk, `id` = clerk user id (text). Com NextAuth, adapte para o adapter Drizzle.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  settings: jsonb("settings")
    .$type<{ sound: number; graphics: "low" | "medium" | "high"; notifications: boolean }>()
    .default({ sound: 70, graphics: "medium", notifications: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ───────────── CLASSES ───────────── */
export const classes = pgTable("classes", {
  key: classKeyEnum("key").primaryKey(),
  name: text("name").notNull(),
  archetype: text("archetype").notNull(), // Combatente / Invocador / Conjurador
  description: text("description").notNull(),
  baseStats: jsonb("base_stats")
    .$type<{ hp: number; mp: number; atk: number; def: number; crit: number; spd: number }>()
    .notNull(),
  perLevelStats: jsonb("per_level_stats")
    .$type<{ hp: number; mp: number; atk: number; def: number; crit: number; spd: number }>()
    .notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  classKey: classKeyEnum("class_key").notNull().references(() => classes.key),
  name: text("name").notNull(),
  minLevel: integer("min_level").default(1).notNull(),
  mpCost: integer("mp_cost").default(0).notNull(),
  power: real("power").notNull(),            // multiplicador de dano/efeito
  comboSlot: integer("combo_slot"),          // posição no combo (mecânica Cabal)
  effect: jsonb("effect").$type<Record<string, unknown>>(), // buff, maldição, invocação...
});

export const traits = pgTable("traits", {
  id: text("id").primaryKey(),               // "analitico", "empatico", "criativo"
  name: text("name").notNull(),
  description: text("description").notNull(),
  bonus: jsonb("bonus").$type<Partial<Record<"hp" | "mp" | "atk" | "def" | "crit" | "spd", number>>>().notNull(),
});

/* ───────────── MAPS & DUNGEONS ───────────── */
export const maps = pgTable("maps", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  biome: biomeEnum("biome").notNull(),
  minLevel: integer("min_level").notNull(),
  ecosystem: text("ecosystem"),
  backgroundUrl: text("background_url"),
});

export const monsters = pgTable("monsters", {
  id: uuid("id").defaultRandom().primaryKey(),
  mapId: uuid("map_id").references(() => maps.id),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  isBoss: boolean("is_boss").default(false).notNull(),
  stats: jsonb("stats").$type<{ hp: number; atk: number; def: number; spd: number }>().notNull(),
  xpReward: bigint("xp_reward", { mode: "number" }).notNull(),
  spriteUrl: text("sprite_url"),
});

export const dungeons = pgTable("dungeons", {
  id: uuid("id").defaultRandom().primaryKey(),
  mapId: uuid("map_id").notNull().references(() => maps.id), // mapa onde fica o Portal
  name: text("name").notNull(),
  minLevel: integer("min_level").notNull(),
  waves: jsonb("waves").$type<{ monsterId: string; count: number }[][]>().notNull(),
  bossId: uuid("boss_id").references(() => monsters.id),
  dropTable: jsonb("drop_table").$type<{ atomicNumber: number; chance: number }[]>().notNull(),
});

/* ───────────── GUILDS ───────────── */
export const guilds = pgTable("guilds", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  tag: text("tag").notNull().unique(),
  description: text("description"),
  level: integer("level").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ───────────── CHARACTERS ───────────── */
export const characters = pgTable(
  "characters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    classKey: classKeyEnum("class_key").notNull().references(() => classes.key),
    avatarId: text("avatar_id").notNull(),        // ex: "class_exatas_01" -> /avatars/class_exatas_01.png
    level: integer("level").default(1).notNull(),
    xp: bigint("xp", { mode: "number" }).default(0).notNull(),
    hp: integer("hp").notNull(),
    mp: integer("mp").notNull(),
    gold: bigint("gold", { mode: "number" }).default(0).notNull(),
    currentMapId: uuid("current_map_id").references(() => maps.id),
    guildId: uuid("guild_id").references(() => guilds.id, { onDelete: "set null" }),
    lastSeenAt: timestamp("last_seen_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("characters_name_unique").on(sql`lower(${t.name})`), // nome único, case-insensitive
    index("characters_user_idx").on(t.userId),
    // Limite de 6 por conta: validar na Server Action (transação com count) — ver nota abaixo.
  ],
);

export const characterTraits = pgTable(
  "character_traits",
  {
    characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
    traitId: text("trait_id").notNull().references(() => traits.id),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.traitId] })],
);

export const guildMembers = pgTable(
  "guild_members",
  {
    guildId: uuid("guild_id").notNull().references(() => guilds.id, { onDelete: "cascade" }),
    characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }).unique(),
    rank: guildRankEnum("rank").default("membro").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.guildId, t.characterId] })],
);

/* ───────────── ITEMS (TABELA PERIÓDICA) ───────────── */
// Tabela de referência dos 118 elementos (seed). Os stats do item são DERIVADOS dessas propriedades.
export const elements = pgTable("elements", {
  atomicNumber: integer("atomic_number").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  atomicMass: real("atomic_mass").notNull(),
  mohsHardness: real("mohs_hardness"),               // null => tratado como 0.5 no algoritmo
  crustalAbundancePpm: real("crustal_abundance_ppm").notNull(), // base da raridade química
  category: text("category").notNull(),              // metal alcalino, gás nobre, etc.
});

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  elementAtomicNumber: integer("element_atomic_number").references(() => elements.atomicNumber),
  name: text("name").notNull(),
  type: itemTypeEnum("type").notNull(),
  slot: text("slot"),                                // "mao_principal", "peito"...
  rarity: rarityEnum("rarity").notNull(),            // cacheado do cálculo
  minLevel: integer("min_level").default(1).notNull(),
  classRestriction: classKeyEnum("class_restriction"),
  stats: jsonb("stats").$type<{ atk?: number; def?: number; durability?: number }>().notNull(),
  value: bigint("value", { mode: "number" }).notNull(), // valor econômico calculado
  iconUrl: text("icon_url"),
});

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull().references(() => items.id),
    quantity: integer("quantity").default(1).notNull(),
    currentDurability: integer("current_durability"),
    equipped: boolean("equipped").default(false).notNull(),
    acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  },
  (t) => [index("inventory_char_idx").on(t.characterId)],
);

/* ───────────── CHAT ───────────── */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channel: chatChannelEnum("channel").notNull(),
    guildId: uuid("guild_id").references(() => guilds.id, { onDelete: "cascade" }), // só p/ canal "guilda"
    characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("chat_channel_created_idx").on(t.channel, t.guildId, t.createdAt)],
);

/* ───────────── RELATIONS ───────────── */
export const usersRelations = relations(users, ({ many }) => ({ characters: many(characters) }));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, { fields: [characters.userId], references: [users.id] }),
  class: one(classes, { fields: [characters.classKey], references: [classes.key] }),
  map: one(maps, { fields: [characters.currentMapId], references: [maps.id] }),
  guild: one(guilds, { fields: [characters.guildId], references: [guilds.id] }),
  traits: many(characterTraits),
  inventory: many(inventory),
}));

export const guildsRelations = relations(guilds, ({ many }) => ({ members: many(guildMembers) }));
export const mapsRelations = relations(maps, ({ many }) => ({ monsters: many(monsters), dungeons: many(dungeons) }));
export const inventoryRelations = relations(inventory, ({ one }) => ({
  character: one(characters, { fields: [inventory.characterId], references: [characters.id] }),
  item: one(items, { fields: [inventory.itemId], references: [items.id] }),
}));
export const itemsRelations = relations(items, ({ one }) => ({
  element: one(elements, { fields: [items.elementAtomicNumber], references: [elements.atomicNumber] }),
}));

/* ───────────── NOTA: LIMITE DE 6 PERSONAGENS ─────────────
 Na Server Action `createCharacter`, dentro de uma transação:
   1. SELECT count(*) FROM characters WHERE user_id = $1 FOR UPDATE (ou advisory lock por userId)
   2. se >= 6 => erro
   3. INSERT
 Para garantia no banco, adicione um trigger BEFORE INSERT via migration SQL customizada.
*/

/* ───────────── BATALHAS (estado servidor-autoritativo) ───────────── */
export const battles = pgTable("battles", {
  characterId: uuid("character_id").primaryKey().references(() => characters.id, { onDelete: "cascade" }),
  state: jsonb("state").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
