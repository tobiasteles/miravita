import { config } from "dotenv"; config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless"; import { drizzle } from "drizzle-orm/neon-http";
import * as s from "./schema"; import { computeItem } from "../lib/game/item-stats";
const db = drizzle(neon(process.env.DATABASE_URL!));
// [Z, símbolo, nome, massa, Mohs, abundância ppm, categoria]
const E: [number, string, string, number, number | null, number, string][] = [
 [1,"H","Hidrogênio",1.008,null,1400,"não-metal"],[6,"C","Carbono",12.011,1.5,200,"não-metal"],[13,"Al","Alumínio",26.98,2.75,82300,"metal"],
 [26,"Fe","Ferro",55.85,4,56300,"metal de transição"],[29,"Cu","Cobre",63.55,3,60,"metal de transição"],[22,"Ti","Titânio",47.87,6,5650,"metal de transição"],
 [82,"Pb","Chumbo",207.2,1.5,14,"metal pós-transição"],[47,"Ag","Prata",107.87,2.5,0.075,"metal de transição"],[79,"Au","Ouro",196.97,2.5,0.01,"metal de transição"],
 [78,"Pt","Platina",195.08,4,0.0025,"metal de transição"],[76,"Os","Ósmio",190.23,7,0.0015,"metal de transição"],[77,"Ir","Irídio",192.22,6.5,0.001,"metal de transição"],
 [92,"U","Urânio",238.03,6,1.8,"actinídeo"],[94,"Pu","Plutônio",244,1,0.000001,"actinídeo"]];
const st = (hp: number, mp: number, atk: number, def: number, crit: number) => ({ hp, mp, atk, def, crit, spd: 10 });
async function main() {
  await db.insert(s.elements).values(E.map(([z,sym,name,m,h,ab,cat]) => ({ atomicNumber:z, symbol:sym, name, atomicMass:m, mohsHardness:h, crustalAbundancePpm:ab, category:cat }))).onConflictDoNothing();
  await db.insert(s.items).values(E.map(([z,,name,m,h,ab]) => { const i = computeItem({atomicNumber:z,atomicMass:m,mohsHardness:h,crustalAbundancePpm:ab});
    return { elementAtomicNumber:z, name, type:"material" as const, rarity:i.rarity, stats:{atk:i.atk,def:i.def,durability:i.durability}, value:i.value }; }));
  await db.insert(s.classes).values([
   { key:"exatas", name:"Ciências da Natureza & Exatas", archetype:"Combatente", description:"Combos físicos, crítico quântico e resistência mecânica.", baseStats:st(120,30,14,8,10), perLevelStats:st(14,2,5,1.4,0.05) },
   { key:"humanas", name:"Ciências Humanas", archetype:"Invocador", description:"Invoca figuras históricas como servos de batalha.", baseStats:st(90,60,8,5,5), perLevelStats:st(10,3,4.4,0.9,0.05) },
   { key:"linguagens", name:"Linguagens & Códigos", archetype:"Conjurador", description:"Magias de área, buffs de oratória e maldições semânticas.", baseStats:st(80,80,10,4,5), perLevelStats:st(9,4,4.8,0.8,0.05) },
  ]).onConflictDoNothing();
  await db.insert(s.traits).values([
   { id:"analitico", name:"Analítico", description:"+5% crítico", bonus:{ crit:5 } }, { id:"empatico", name:"Empático", description:"+15% HP", bonus:{ hp:0.15 } },
   { id:"criativo", name:"Criativo", description:"+20% MP", bonus:{ mp:0.2 } }, { id:"resiliente", name:"Resiliente", description:"+12% defesa", bonus:{ def:0.12 } },
  ]).onConflictDoNothing();
  await db.insert(s.maps).values([
   { slug:"planicie-de-aurora", name:"Planície de Aurora", biome:"planicie", minLevel:1 }, { slug:"floresta-sussurrante", name:"Floresta Sussurrante", biome:"floresta", minLevel:10 },
   { slug:"deserto-cinzento", name:"Deserto Cinzento", biome:"deserto", minLevel:30 }, { slug:"montanha-de-ferro", name:"Montanha de Ferro", biome:"montanha", minLevel:60 },
   { slug:"pantano-radioativo", name:"Pântano Radioativo", biome:"pantano", minLevel:100 }, { slug:"abismo-do-cacador", name:"Abismo do Caçador", biome:"abismo", minLevel:150 },
  ]).onConflictDoNothing();
  console.log("Seed concluído.");
}
main();
