// Regras de apuração: funções puras, sem Firebase nem tela (testadas em testes/apuracao.test.mjs).
// c = configuração da votação; t = resultado de tally(); r = turno.
export function pct(n,t){return t?(n*100/t).toFixed(1).replace('.',',')+'%':'0%';}
export function pl(n,a,b){return n+' '+(n===1?a:b);}
export function rnd(c){return c.round||1;}
export function nd(c){return (c&&c.digits)||2;}
export function nv(c){return (c&&c.votes)||1;}
export function norm(r){var c=Object.assign({},r);
 if(!c.cands&&c.options)c.cands=c.options.map(function(nm,i){return {n:String(11+i),name:nm,photo:null};});
 c.cands=c.cands||[];c.options=c.cands.map(function(x){return x.name;});return c;}
export function inRound(c,i){return rnd(c)===1||(c.finalists||[]).indexOf(i)>=0;}
export function all(c){return c.cands.map(function(_,i){return i;});}

/* som */
export function tally(c,r,ballots,vdocs){
 var counts=c.cands.map(function(){return 0;}),bad=0,total=0,bl=0,nu=0,pv=(c.mode==='prop'?parties(c).map(function(){return 0;}):[]),rb=[];
 ballots.forEach(function(b){
  if((b.round||1)!==r||(b.eid||0)!==(c.eid||0))return;total++;
  if(Array.isArray(b.ranks)){var rk=[];b.ranks.forEach(function(i){if(typeof i==='number'&&i>=0&&counts[i]!==undefined&&rk.indexOf(i)<0)rk.push(i);});if(rk.length){rb.push(rk);counts[rk[0]]++;}else bl++;}
  else if(b.choice===-1)bl++;else if(b.choice===-2)nu++;
  else if(c.mode==='prop'&&b.choice>=100&&pv[b.choice-100]!==undefined)pv[b.choice-100]++;
  else if(typeof b.choice==='number'&&counts[b.choice]!==undefined&&(r===1||(c.finalists||[]).indexOf(b.choice)>=0))counts[b.choice]++;else bad++;
 });
 var k=vkey(c,r),voters=vdocs.filter(function(d){return d.data[k]===true||(!c.eid&&r===1&&d.data.voted===true);}).length;
 var blank=bl+nu;
 return {counts:counts,pv:pv,rb:rb,total:total,bl:bl,nu:nu,blank:blank,base:(c.blankCounts?total:total-blank),voters:voters,max:Math.max.apply(null,counts),invalid:(total>voters*(c.mode==='rank'?1:nv(c))||total>c.expected*(c.mode==='rank'?1:nv(c))||bad>0)};
}
export function finalistsFrom(t){
 var idx=t.counts.map(function(_,i){return i;}).sort(function(a,b){return t.counts[b]-t.counts[a];});
 var cut=t.counts[idx[1]];
 return idx.filter(function(i){return t.counts[i]>=cut;});
}

/* urna */
export function irv(c,t){
 var alive=c.cands.map(function(_,i){return i;}),rounds=[];
 for(;;){
  var cnt={},act=0;alive.forEach(function(i){cnt[i]=0;});
  t.rb.forEach(function(rk){var f=rk.filter(function(i){return alive.indexOf(i)>=0;})[0];if(f!==undefined){cnt[f]++;act++;}});
  rounds.push({cnt:cnt,act:act,alive:alive.slice()});
  if(act===0)return {rounds:rounds,winner:null,tied:alive};
  var top=alive.slice().sort(function(a,b){return cnt[b]-cnt[a];})[0];
  if(cnt[top]*2>act||alive.length===2){var tie=alive.filter(function(i){return cnt[i]===cnt[top];});return tie.length===1?{rounds:rounds,winner:top}:{rounds:rounds,winner:null,tied:tie};}
  var mn=Math.min.apply(null,alive.map(function(i){return cnt[i];})),lows=alive.filter(function(i){return cnt[i]===mn;});
  if(lows.length===alive.length)return {rounds:rounds,winner:null,tied:alive};
  alive=alive.filter(function(i){return lows.indexOf(i)<0;});
 }
}
export function parties(c){var pm={},out=[];c.cands.forEach(function(x,i){var pre=x.n.slice(0,2);if(!pm[pre]){pm[pre]={pre:pre,sigla:x.sigla||pre,name:x.party||'',idxs:[]};out.push(pm[pre]);}pm[pre].idxs.push(i);});return out;}
export function partyIdx(c,d){var P=parties(c);for(var i=0;i<P.length;i++)if(P[i].pre===d)return i;return -1;}
export function propResult(c,t){
 var P=parties(c),N=c.seats,sum=function(a){return a.reduce(function(x,y){return x+y;},0);},V=sum(t.counts)+sum(t.pv);
 var qe=Math.floor(V/N);if(V/N-qe>0.5)qe++;if(qe<1)qe=1;
 var rows=P.map(function(p,pi){var nom=sum(p.idxs.map(function(i){return t.counts[i];}));return {p:p,nom:nom,leg:t.pv[pi],tot:nom+t.pv[pi],seats:0};});
 rows.forEach(function(r){r.cap=r.p.idxs.filter(function(i){return t.counts[i]>=0.1*qe;}).length;r.seats=Math.min(Math.floor(r.tot/qe),r.cap);});
 var left=N-sum(rows.map(function(r){return r.seats;})),pool=function(){var a=rows.filter(function(r){return r.seats<r.cap&&r.tot>=0.8*qe;});return a.length?a:rows.filter(function(r){return r.seats<r.cap&&r.tot>0;});},el=pool();
 while(left>0&&el.length){var best=el[0];el.forEach(function(r){if(r.tot/(r.seats+1)>best.tot/(best.seats+1))best=r;});best.seats++;left--;el=pool();}
 rows.forEach(function(r){var ids=r.p.idxs.slice().sort(function(a,b){return t.counts[b]-t.counts[a];});r.tie=r.seats>0&&r.seats<ids.length&&t.counts[ids[r.seats-1]]===t.counts[ids[r.seats]];
  if(r.tie){var bc=t.counts[ids[r.seats-1]];r.sure=ids.filter(function(i){return t.counts[i]>bc;});r.tied=ids.filter(function(i){return t.counts[i]===bc;});r.need=r.seats-r.sure.length;r.drawn=(c.draws&&c.draws['p'+r.p.pre])||null;r.elected=r.sure.concat(r.drawn?r.drawn.winners:[]);}else r.elected=ids.slice(0,r.seats);r.miss=Math.max(0,r.seats-ids.length);});
 return {V:V,qe:qe,rows:rows,left:left};
}
export function winnersOf(c,t){
 var r=rnd(c),k=c.seats||1;
 if(t.invalid||!t.base)return [];
 if(c.mode==='rank'){var R=irv(c,t),dw=c.draws&&c.draws.irv;return R.winner!=null?[R.winner]:dw?[dw.winners[0]]:[];}
 if(c.mode==='prop'){var out=[];propResult(c,t).rows.forEach(function(x){out=out.concat(x.elected);});return out;}
 var idx=(r===2?c.finalists:all(c)).slice().sort(function(a,b){return t.counts[b]-t.counts[a];});
 if(k>1){var last=t.counts[idx[k-1]],sure=idx.filter(function(i){return t.counts[i]>last;}),tied=idx.filter(function(i){return t.counts[i]===last;});if(last===0)return sure;return sure.length+tied.length>k?sure.concat(c.draws&&c.draws.last?c.draws.last.winners:[]):sure.concat(tied);}
 var lead=idx.filter(function(i){return t.counts[i]===t.max;});
 if(r===1)return lead.length===1&&t.counts[lead[0]]*2>t.base?[lead[0]]:[];
 return lead.length===1?[lead[0]]:(c.draws&&c.draws.f?[c.draws.f.winners[0]]:[]);
}
export function resText(c,t,idx){
 var r=rnd(c),k=c.seats||1,nm=function(i){return c.cands[i].n+' · '+c.cands[i].name;};
 if(t.invalid)return 'Votação inválida: deve ser repetida';
 if(c.mode==='rank'&&t.rb.length){var R=irv(c,t),dw=c.draws&&c.draws.irv;return R.winner!=null?'Vencedor (ranqueada): '+nm(R.winner):dw?'Vencedor (sorteio): '+nm(dw.winners[0]):'Empate na última rodada: '+R.tied.map(nm).join(' / ');}
 if(c.mode==='prop'&&t.base>0)return 'Cadeiras: '+propResult(c,t).rows.filter(function(r){return r.seats>0;}).map(function(r){return r.p.sigla+' '+r.seats;}).join(' · ');
 if(!t.base||t.max===0)return 'Sem votos válidos: deve ser repetida';
 if(k>1){var last=t.counts[idx[k-1]],sure=idx.filter(function(i){return t.counts[i]>last;}),tied=idx.filter(function(i){return t.counts[i]===last;}),over=sure.length+tied.length>k;
  return 'Eleitos: '+(last===0?sure:over?sure.concat(c.draws&&c.draws.last?c.draws.last.winners:[]):sure.concat(tied)).map(nm).join(' / ')+(over&&last>0&&!(c.draws&&c.draws.last)?' (empate na última vaga: '+tied.map(nm).join(' / ')+')':'');}
 var lead=idx.filter(function(i){return t.counts[i]===t.max;});
 if(r===1)return lead.length===1&&t.counts[lead[0]]*2>t.base?'Vencedor: '+nm(lead[0])+' ('+pct(t.counts[lead[0]],t.base)+')':'Sem maioria: 2º turno entre '+finalistsFrom(t).map(nm).join(' e ');
 return lead.length===1?'Resultado final: '+nm(lead[0]):c.draws&&c.draws.f?'Resultado final (sorteio): '+nm(c.draws.f.winners[0]):'Empate: '+lead.map(nm).join(' / ');
}
export function vkey(c,r){return c.eid?'e'+c.eid+'r'+r:'r'+r;}
