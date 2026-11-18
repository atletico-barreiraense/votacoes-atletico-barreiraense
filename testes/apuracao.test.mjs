// Testes das regras de apuração. Rode com:  node --test testes/
import test from 'node:test';
import assert from 'node:assert/strict';
import {tally, finalistsFrom, irv, propResult, winnersOf, resText, all} from '../js/apuracao.js';

const cand = (n, sigla = '') => ({n, name: 'C' + n, sigla, party: '', vice: '', photo: null});
const cfg = (extra) => Object.assign({question: 'Teste', expected: 15, status: 'closed', round: 1, seats: 1, votes: 1}, extra);
const urna = (choices, round = 1) => ({
  ballots: choices.map((c) => (Array.isArray(c) ? {round, ranks: c} : {round, choice: c})),
  vdocs: choices.map((_, i) => ({id: 'v' + i, data: {['r' + round]: true}})),
});
const apura = (c, choices, round = 1) => {const u = urna(choices, round); return tally(c, round, u.ballots, u.vdocs);};

test('cargo único: mais de 50% dos válidos vence no 1º turno', () => {
  const c = cfg({cands: [cand('01'), cand('18'), cand('23')]});
  const t = apura(c, [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, -2]); // 8, 5, 1 e um nulo
  assert.equal(t.base, 14);
  assert.deepEqual(winnersOf(c, t), [0]);
});

test('cargo único: exatamente 50% vai para o 2º turno com os dois primeiros', () => {
  const c = cfg({cands: [cand('01'), cand('18'), cand('23')]});
  const t = apura(c, [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2]); // 7 de 14
  assert.deepEqual(winnersOf(c, t), []);
  assert.deepEqual(finalistsFrom(t).sort(), [0, 1]);
  assert.match(resText(c, t, all(c)), /2º turno/);
});

test('brancos contam na base quando a opção está marcada', () => {
  const c = cfg({cands: [cand('11'), cand('22')], blankCounts: true});
  const t = apura(c, [0, 0, 0, 1, -1, -1]); // 3 de 6 = 50%, não vence
  assert.equal(t.base, 6);
  assert.deepEqual(winnersOf(c, t), []);
});

test('empate pelo 2º lugar leva todos os empatados ao 2º turno', () => {
  const c = cfg({cands: [cand('11'), cand('22'), cand('33')]});
  const t = apura(c, [0, 0, 0, 1, 1, 2, 2]);
  assert.deepEqual(finalistsFrom(t).sort(), [0, 1, 2]);
});

test('várias vagas: os mais votados, e o sorteio decide o empate da última vaga', () => {
  const c = cfg({seats: 2, cands: [cand('11'), cand('22'), cand('33')]});
  const t = apura(c, [0, 0, 0, 1, 2]);
  assert.deepEqual(winnersOf(c, t), [0]);
  c.draws = {last: {winners: [2], order: [2, 1], pool: [1, 2], at: 1}};
  assert.deepEqual(winnersOf(c, t), [0, 2]);
});

test('senadores: dois votos por eleitor não acusam fraude na conferência', () => {
  const c = cfg({seats: 2, votes: 2, expected: 2, cands: [cand('11'), cand('22'), cand('33')]});
  const u = {ballots: [0, 1, 0, 2].map((ch) => ({round: 1, choice: ch})), vdocs: [{id: 'a', data: {r1: true}}, {id: 'b', data: {r1: true}}]};
  const t = tally(c, 1, u.ballots, u.vdocs);
  assert.equal(t.invalid, false);
  assert.deepEqual(winnersOf(c, t), [0]);
});

test('conferência: mais votos que votantes invalida o turno', () => {
  const c = cfg({cands: [cand('11'), cand('22')]});
  const t = tally(c, 1, [{round: 1, choice: 0}, {round: 1, choice: 0}], [{id: 'a', data: {r1: true}}]);
  assert.equal(t.invalid, true);
  assert.deepEqual(winnersOf(c, t), []);
});

test('proporcional: quociente, legenda e barreira de 10%', () => {
  const c = cfg({mode: 'prop', seats: 3, cands: [cand('0101', 'A'), cand('0102', 'A'), cand('0103', 'A'), cand('1801', 'B'), cand('1802', 'B'), cand('2301', 'C')]});
  const t = {counts: [60, 4, 2, 50, 5, 20], pv: [10, 0, 0]};
  const R = propResult(c, t);
  assert.equal(R.qe, 50);
  assert.deepEqual(R.rows.map((r) => r.seats), [1, 2, 0]); // A só tem 1 candidato com 5+ votos
});

test('proporcional: voto de legenda conta para o partido', () => {
  const c = cfg({mode: 'prop', seats: 2, cands: [cand('0101', 'A'), cand('0102', 'A'), cand('1801', 'B')]});
  const t = apura(c, [0, 1, 100, 100, 2]); // 100 = legenda do partido A
  assert.deepEqual(t.pv, [2, 0]);
  assert.deepEqual(winnersOf(c, t).sort(), [0, 1]);
});

test('ranqueada: os votos do eliminado passam para a próxima opção', () => {
  const c = cfg({mode: 'rank', cands: [cand('11'), cand('22'), cand('33')]});
  const t = apura(c, [[0, 1, 2], [0, 1, 2], [1, 2, 0], [2, 1, 0], [1, 0]]);
  const R = irv(c, t);
  assert.equal(R.rounds.length, 2);
  assert.equal(R.winner, 1);
});

test('ranqueada: empate final sem sorteio não elege ninguém', () => {
  const c = cfg({mode: 'rank', cands: [cand('11'), cand('22'), cand('33')]});
  const t = apura(c, [[0], [1]]);
  assert.equal(irv(c, t).winner, null);
  assert.deepEqual(winnersOf(c, t), []);
});
