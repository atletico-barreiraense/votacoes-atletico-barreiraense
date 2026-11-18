// Interface da Urna do clube: telas, urna, painel do organizador e integração com o Firebase.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,addDoc,collection,onSnapshot,writeBatch,getDocs} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import {FIREBASE,ADMIN_EMAIL} from './config.js';
import {pct,pl,rnd,nd,nv,norm,inRound,all,tally as tallyOf,finalistsFrom,irv,parties,partyIdx,propResult,winnersOf,resText,vkey} from './apuracao.js';

const app0=initializeApp(FIREBASE),auth=getAuth(app0),fdb=getFirestore(app0);
const snapDoc=function(s){return {exists:s.exists(),data:function(){return s.data();}};};
function makeDb(){return {
 doc:function(p){var r=doc(fdb,p);return {
  set:function(d){return setDoc(r,d);},update:function(d){return updateDoc(r,d);},delete:function(){return deleteDoc(r);},
  get:async function(){return snapDoc(await getDoc(r));},
  onSnapshot:function(cb,er){return onSnapshot(r,function(s){cb(snapDoc(s));},er);}};},
 collection:function(p){var c=collection(fdb,p);return {
  add:function(d){return addDoc(c,d);},
  onSnapshot:function(cb,er){return onSnapshot(c,function(s){cb({size:s.size,docs:s.docs.map(function(d){return {id:d.id,data:function(){return d.data();}};})});},er);}};}
};}
async function saveAllowed(t){
 var em=(t||'').toLowerCase().split(/[\s,;]+/).filter(function(x){return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x);});
 if(!em.length)return;var b=writeBatch(fdb);
 em.forEach(function(x){b.set(doc(fdb,'allowed',x),{ok:true});});await b.commit();
}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});
(function(){
var app=document.getElementById('app');
var PH='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 120"><rect width="90" height="120" fill="#c9c9c2"/><circle cx="45" cy="45" r="20" fill="#8a8a84"/><path d="M8 120c0-28 16-42 37-42s37 14 37 42z" fill="#8a8a84"/></svg>');
var S={manage:false,tv:false,tvStep:0,allowedList:[],members:[],showAtt:false,phase:'',r2o:'',r2f:'',picks:[],cargos:[],old:null,cid:null,setup:false,listLoaded:false,auth:'load',email:'',ready:false,nodb:false,cfgLoaded:false,slow:false,cfg:null,uid:null,admin:false,canWrite:null,
 vdocs:[],ballots:[],busy:false,ballotDoneRound:0,msg:'',confirm:'',lastRound:1,digits:'',mode:'',mute:false,
 draft:{e:'',q:'Primeiro-ministro do Atlético Barreiraense',n:'15',b:false,c:[{n:'01',name:'Helton Weber Ferreira',party:'União Nacional das Questões Balançantes',sigla:'UNQB',vice:'Eduardo Narciso Schiavon',photo:null},{n:'18',name:'Ian Wiederkehr de Filippo',party:'Partido Sacudo',sigla:'PS',vice:'Gustavo Li Spada',photo:null},{n:'23',name:'Lucas Medeiros Oliva',party:'Partido Rabo Liberado',sigla:'PRL',vice:'Luigi Scolari',photo:null}]}};
var AC=null;var db=makeDb();
window.addEventListener('unhandledrejection',function(e){var r=e.reason;S.fatal=(r&&(r.code||r.message))||String(r);render();});
window.addEventListener('error',function(e){if(/ResizeObserver/.test(e.message||''))return;S.fatal=e.message||'erro desconhecido';render();});

function h(t,a){var e=document.createElement(t),k=Array.prototype.slice.call(arguments,2);
 for(var x in (a||{})){var v=a[x];if(x==='class')e.className=v;else if(x.slice(0,2)==='on')e.addEventListener(x.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(x,v===true?'':v);}
 k.flat(Infinity).forEach(function(c){if(c==null||c===false)return;e.append(c.nodeType?c:document.createTextNode(c));});
 return e;}
function note(t){return h('div',{class:'card'},h('p',{class:'mut'},t));}
function warn(t){return h('div',{class:'warn'},t);}
function errTxt(e){return (e&&e.code)||'erro';}
function tone(f,t0,d,v){if(S.mute)return;try{
 if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
 var o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+t0;v=v||.06;
 o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);
 g.gain.setValueAtTime(v,t+d-.01);g.gain.linearRampToValueAtTime(0,t+d);
 o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02);}catch(e){}}
function beepKey(){tone(1000,0,.07);}
function beepDone(){tone(1500,0,.1);tone(1500,.16,.1);tone(1500,.32,1.2,.08);}

/* apuração */
function tally(c,r){return tallyOf(c,r,S.ballots,S.vdocs);}
function hasVoted(r){if(S.cid==='__train')return !!S.trainDone;var k=vkey(S.cfg,r);return S.vdocs.some(function(d){return d.id===S.uid&&(d.data[k]===true||(!S.cfg.eid&&r===1&&d.data.voted===true));});}
function candOf(c,d){for(var i=0;i<c.cands.length;i++)if(c.cands[i].n===d&&inRound(c,i))return i;return -1;}
function cur(c){if(S.mode==='b')return -1;if(c.mode==='prop'&&S.digits.length===2){var pi=partyIdx(c,S.digits);if(pi>=0)return 100+pi;}if(S.digits.length<nd(c))return null;var i=candOf(c,S.digits);return i<0?-2:i;}
function canVote(c){return !!c&&c.status!=='closed'&&phase(c)==='on'&&!!S.uid&&S.canWrite!==false&&!hasVoted(rnd(c))&&!S.busy;}
function press(d){if(!canVote(S.cfg)||S.mode==='b'||S.digits.length>=nd(S.cfg))return;S.digits+=d;beepKey();render();}
function corrige(){if(!canVote(S.cfg))return;if(!S.digits&&!S.mode&&S.picks.length)S.picks.pop();else{S.digits='';S.mode='';}tone(700,0,.08);render();}
function branco(){if(!canVote(S.cfg))return;S.mode='b';S.digits='';beepKey();render();}
function confirma(){var c=S.cfg;if(!canVote(c))return;var ch=cur(c);if(ch==null)return;if(ch>=0&&S.picks.indexOf(ch)>=0)return;
 if(c.mode==='rank'&&ch<0){while(S.picks.length+1<nv(c))S.picks.push(-1);}
 if(S.picks.length+1<nv(c)){S.picks.push(ch);S.digits='';S.mode='';beepKey();tone(1400,.08,.08);render();return;}
 beepDone();vote(S.picks.concat([ch]));}
document.addEventListener('keydown',function(e){
 var t=e.target&&e.target.tagName;if(t==='INPUT'||e.ctrlKey||e.metaKey||e.altKey||!canVote(S.cfg))return;
 if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')corrige();
 else if(e.key==='Enter'){e.preventDefault();confirma();}else if(e.key==='b'||e.key==='B')branco();
});
async function vote(list){
 if(S.cid==='__train'){S.busy=true;render();setTimeout(function(){S.busy=false;S.trainDone=true;S.digits='';S.mode='';S.picks=[];render();},500);return;}
 var c=S.cfg,r=rnd(c);S.busy=true;S.msg='';render();
 try{
  var b=writeBatch(fdb),k='r'+r,own=S.vdocs.some(function(d){return d.id===S.uid;}),flag={};flag[k]=true;
  if(c.mode==='rank')b.set(doc(collection(fdb,BP(S.cid))),{round:r,ranks:list});else list.forEach(function(ch){b.set(doc(collection(fdb,BP(S.cid))),{round:r,choice:ch});});
  if(own)b.update(doc(fdb,VP(S.cid),S.uid),flag);else b.set(doc(fdb,VP(S.cid),S.uid),flag);
  await b.commit();S.digits='';S.mode='';S.picks=[];
 }catch(e){S.msg='Não foi possível registrar o voto ('+errTxt(e)+'). Confirme de novo.';}
 S.busy=false;render();
}
function screen(c){
 var r=rnd(c),L=h('div',{class:'lcd','aria-live':'polite'});
 if(S.busy)return h('div',{class:'lcd'},h('div',{class:'fim'},h('p',{},'Registrando…')));
 if(hasVoted(r))return h('div',{class:'lcd'},h('div',{class:'fim'},h('b',{},'FIM'),h('p',{},'VOTOU')));
 L.append(h('div',{class:'lab'},r+'º TURNO · '+(nv(c)>1?(c.mode==='rank'?'OPÇÃO ':'VOTO ')+(S.picks.length+1)+' DE '+nv(c)+' · ':'')+'SEU VOTO PARA'),h('div',{class:'big'},c.question),(S.picks.length>0?h('div',{class:'sm',style:'margin:0 0 6px'},'Já escolhidos: '+S.picks.map(function(i){return i<0?'branco/nulo':c.cands[i].name;}).join(', ')):''));
 var ch=cur(c);
 if(S.mode==='b')L.append(h('div',{class:'big'},'VOTO EM BRANCO'));
 else{
  var dg=h('div',{class:'dg'});for(var k=0;k<nd(c);k++)dg.append(h('span',{class:k===S.digits.length?'cur':''},S.digits[k]||''));
  L.append(h('div',{class:'lab'},'NÚMERO'),dg);
  if(ch!=null&&ch>=100){var pp=parties(c)[ch-100];L.append(h('div',{class:'big'},'VOTO DE LEGENDA'),h('div',{class:'nmx'},pp.sigla),h('div',{class:'sm'},pp.name||'Só no partido. Para votar num candidato, continue digitando o número.'));}
  else if(ch!=null&&ch>=0&&S.picks.indexOf(ch)>=0)L.append(h('div',{class:'big'},'JÁ VOTADO'),h('div',{class:'nmx'},'Você já escolheu '+c.cands[ch].name+'. Aperte CORRIGE e escolha outro candidato.'));
  else if(ch!=null&&ch>=0){var x=c.cands[ch];L.append(h('div',{class:'cinfo'},h('div',{},h('div',{class:'lab'},'NOME'),h('div',{class:'nmx'},x.name),x.sigla&&[h('div',{class:'lab'},'PARTIDO'),h('div',{class:'nmx'},x.sigla),h('div',{class:'sm'},x.party||'')],x.vice&&[h('div',{class:'lab'},'VICE'),h('div',{class:'nmx'},x.vice)]),h('img',{src:x.photo||PH,alt:''})));}
  else if(ch===-2)L.append(h('div',{class:'big'},'NÚMERO ERRADO'),h('div',{class:'big'},'VOTO NULO'));
 }
 L.append(h('div',{class:'hint'},ch==null?'Digite o número do candidato.':'Aperte a tecla verde para CONFIRMAR este voto ou a laranja para CORRIGIR.'));
 return L;
}
function urna(c){
 var pad=h('div',{class:'pad'});
 '123456789'.split('').forEach(function(d){pad.append(h('button',{class:'k'+(d==='5'?' dot':''),'aria-label':'Tecla '+d,onclick:function(){press(d);}},d));});
 pad.append(h('span'),h('button',{class:'k',onclick:function(){press('0');}},'0'),h('span'),
  h('button',{class:'k br',onclick:branco},'BRANCO'),h('button',{class:'k co',onclick:corrige},'CORRIGE'),h('button',{class:'k ok',onclick:confirma},'CONFIRMA'));
 return h('div',{class:'urna'},h('div',{class:'plate'},h('span',{},'Urna eletrônica, '+((S.brand&&S.brand.name)||'clube')),h('span',{class:'spk'})),h('div',{class:'ubody'},screen(c),pad));
}

/* configuração */
function readPhoto(file,cb){
 var fr=new FileReader();
 fr.onload=function(){var im=new Image();im.onload=function(){
  var W=120,H=160,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
  var s=Math.max(W/im.width,H/im.height),w=im.width*s,hh=im.height*s;
  x.fillStyle='#fff';x.fillRect(0,0,W,H);x.drawImage(im,(W-w)/2,(H-hh)*0.3,w,hh);
  cb(cv.toDataURL('image/jpeg',0.72));};im.onerror=function(){cb(null);};im.src=fr.result;};
 fr.onerror=function(){cb(null);};fr.readAsDataURL(file);}
function nextNum(){var u=S.draft.c.map(function(x){return x.n;});for(var i=11;i<100;i++)if(u.indexOf(String(i))<0)return String(i);return '';}
function setup(){
 var D=S.draft,q=h('input',{type:'text',value:D.q,maxlength:'200',placeholder:'Ex.: Presidente do clube',oninput:function(){D.q=q.value;}});
 var n=h('input',{type:'number',min:'1',max:'200',value:D.n,oninput:function(){D.n=n.value;}});
 var md=h('select',{style:'width:100%;font:inherit;padding:10px;margin:4px 0 12px;border-radius:8px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink)',onchange:function(){D.m=md.value;rl.textContent=ruleTxt();}},h('option',{value:'maj'},'Majoritária (cargo único ou mais votados)'),h('option',{value:'prop'},'Proporcional por partido (deputados)'),h('option',{value:'rank'},'Ranqueada (ordem de preferência, eliminação por rodadas)')),rl=h('p',{class:'mut'}),ruleTxt=function(){var k=parseInt(D.s||'1',10);if(D.m==='rank')return 'Ranqueada: cada eleitor ordena até 5 candidatos (1ª, 2ª, 3ª opção...). Se ninguém passar de 50% das primeiras opções, elimina-se o menos votado e seus votos vão para a próxima opção de cada eleitor, até alguém passar de 50%. A tecla BRANCO encerra a lista. Mínimo de 3 candidatos.';
 if(D.m==='prop')return 'Proporcional: o eleitor vota num candidato ou só no partido (digitando os 2 primeiros dígitos). Cadeiras por quociente eleitoral e maiores médias; dentro do partido, os mais votados são eleitos. Número do candidato = 2 dígitos do partido + os do candidato (ex.: 0101).';var v=parseInt(D.v||'1',10);return k>1?'Regra: com '+k+' vagas, os '+k+' candidatos mais votados são eleitos, sem 2º turno'+(v>1?'. Cada eleitor tem '+v+' votos, em candidatos diferentes':'')+'. A caixa acima só muda as porcentagens exibidas.':'Regra: se uma opção passar de 50%, ela vence. Caso contrário, haverá 2º turno entre as mais votadas.';},list=h('div'),sv=h('input',{type:'number',min:'1',max:'40',value:D.s||'1',oninput:function(){D.s=sv.value;rl.textContent=ruleTxt();}}),vt=h('input',{type:'number',min:'1',max:'40',value:D.v||'1',oninput:function(){D.v=vt.value;rl.textContent=ruleTxt();}});md.value=D.m||'maj';rl.textContent=ruleTxt();
 D.c.forEach(function(x,i){
  var nm=h('input',{type:'text',value:x.name,maxlength:'40',placeholder:'Nome do candidato',oninput:function(){x.name=nm.value;}});
  var no=h('input',{type:'text',value:x.n,maxlength:'5',inputmode:'numeric',style:'width:80px',oninput:function(){x.n=no.value.trim();}});
  var pa=h('input',{type:'text',value:x.party||'',maxlength:'60',placeholder:'Partido (nome completo)',oninput:function(){x.party=pa.value;}});
  var sg=h('input',{type:'text',value:x.sigla||'',maxlength:'8',placeholder:'Sigla',style:'width:100px',oninput:function(){x.sigla=sg.value.trim();}});
  var vi=h('input',{type:'text',value:x.vice||'',maxlength:'40',placeholder:'Nome do vice',oninput:function(){x.vice=vi.value;}});
  var bi=h('input',{type:'text',value:x.bio||'',maxlength:'160',placeholder:'Slogan ou proposta (opcional)',oninput:function(){x.bio=bi.value;}});
  var f=h('input',{type:'file',accept:'image/*',style:'display:none',onchange:function(){if(f.files[0])readPhoto(f.files[0],function(u){x.photo=u;render();});}});
  list.append(h('div',{class:'card'},
   h('div',{class:'cinfo'},h('img',{class:'th',src:x.photo||PH,alt:'',style:'width:60px;height:80px'}),h('div',{style:'flex:1'},nm,pa,h('label',{},'Sigla '),sg,h('label',{},' Número (mesmo nº de dígitos para todos) '),no,h('label',{},'Vice'),vi,bi)),
   h('button',{class:'ghost',onclick:function(){f.click();}},x.photo?'Trocar foto':'Escolher foto'),f,
   D.c.length>2&&h('button',{class:'ghost',onclick:function(){D.c.splice(i,1);render();}},'Remover candidato')));
 });
 return [h('div',{class:'card'},h('p',{class:'q'},'Nova votação'),h('button',{class:'ghost',onclick:function(){D.c=[{n:'1',name:'Sim',party:'',sigla:'',vice:'',bio:'',photo:null},{n:'2',name:'Não',party:'',sigla:'',vice:'',bio:'',photo:null}];D.s='1';D.v='1';D.m='maj';render();}},'Usar modelo Sim / Não (plebiscito)'),
  h('label',{},'Cargo ou pergunta'),q,h('label',{},'Número de votantes esperados'),n,h('label',{},'Tipo de votação'),md,h('label',{},'Vagas (1 = cargo único, com 2º turno; mais de 1 = os mais votados são eleitos)'),sv,h('label',{},'Votos por eleitor (ex.: senadores com 2 vagas = 2 votos, em candidatos diferentes)'),vt,h('label',{},'Abre em (opcional; vazio = já aberta)'),dtIn(D,'o'),h('label',{},'Fecha em (opcional; vazio = você encerra manualmente)'),dtIn(D,'f'),h('p',{class:'mut'},S.allowedList.length+' eleitores cadastrados. Para adicionar ou remover, use "Gerenciar eleitores" na tela inicial.'),
  h('label',{style:'display:block;margin:0 0 12px'},h('input',{type:'checkbox',checked:D.b,style:'width:auto;margin:0 8px 0 0',onchange:function(e){D.b=e.target.checked;}}),'Votos em branco/nulos entram no cálculo dos 50% (se desmarcado, contam só os válidos)'),h('label',{style:'display:block;margin:0 0 12px'},h('input',{type:'checkbox',checked:D.lv,style:'width:auto;margin:0 8px 0 0',onchange:function(e){D.lv=e.target.checked;}}),'Mostrar resultado parcial ao vivo (boca de urna) para quem já votou'),
  rl),
  list,D.c.length<40&&h('button',{class:'ghost',onclick:function(){D.c.push({name:'',n:nextNum(),photo:null});render();}},'Adicionar candidato'),
  S.msg&&warn(S.msg),h('button',{class:'btn',onclick:openVote},'Abrir 1º turno'),h('button',{class:'ghost',onclick:function(){S.setup=false;S.editId=null;S.msg='';if(S.admin){S.panel=true;S.ptab='v';}render();}},'Cancelar')];
}
async function openVote(){
 var D=S.draft,nums=[],names=[],n=parseInt(D.n,10),sv=parseInt(D.s||'1',10),vt=parseInt(D.v||'1',10),ok=true,len=(D.c[0].n||'').length;
 if(D.m==='rank'){sv=1;vt=1;}
 D.c.forEach(function(x){var nm=x.name.trim();if(!nm||names.indexOf(nm)>=0||!/^\d{1,5}$/.test(x.n)||x.n.length!==len||nums.indexOf(x.n)>=0)ok=false;names.push(nm);nums.push(x.n);});
 if(!D.q.trim()){S.msg='Escreva o cargo ou a pergunta.';return render();}
 if(D.m==='rank'&&D.c.length<3){S.msg='A votação ranqueada precisa de pelo menos 3 candidatos.';return render();}
 if(!ok){S.msg='Cada candidato precisa de nome e de um número único, todos com a mesma quantidade de dígitos (de 1 a 5).';return render();}
 if(!(n>0)){S.msg='Informe o número de votantes esperados.';return render();}
 if(!(sv>=1&&sv<D.c.length)){S.msg='As vagas devem ser menos que o número de candidatos.';return render();}
 if(!(vt>=1&&vt<=sv)){S.msg='Os votos por eleitor devem ir de 1 até o número de vagas.';return render();}
 if(ts(D.f)&&(ts(D.f)<=Date.now()||(ts(D.o)&&ts(D.f)<=ts(D.o)))){S.msg='O horário de encerramento deve ser no futuro e depois da abertura.';return render();}
 if(D.m==='prop'){var pm={},bad=false;D.c.forEach(function(x){var pre=x.n.slice(0,2),sg=(x.sigla||'').trim();if(!sg||len<3||(pm[pre]&&pm[pre]!==sg))bad=true;pm[pre]=sg;});var sgs=Object.keys(pm).map(function(k){return pm[k];});if(bad||sgs.length!==new Set(sgs).size||sv<2||vt!==1){S.msg='Proporcional: cada candidato precisa de sigla e de número com 3 ou mais dígitos, começando pelos 2 dígitos do partido (mesma sigla = mesmo prefixo); vagas ≥ 2 e 1 voto por eleitor.';return render();}}
 try{
  var id=S.editId||'c'+Date.now().toString(36);
  if(S.editId&&(await getDocs(collection(fdb,BP(id)))).size>0){S.msg='Já existem votos nesta votação, então não dá mais para editá-la. Cancele e use Apagar esta votação se quiser recomeçar.';return render();}
  await db.doc(P(id)).set({question:D.q.trim(),cands:D.c.map(function(x){return {n:x.n,name:x.name.trim(),party:(x.party||'').trim(),sigla:(x.sigla||'').trim(),vice:(x.vice||'').trim(),bio:(x.bio||'').trim(),photo:x.photo||null};}),expected:n,status:'open',round:1,seats:sv,votes:D.m==='rank'?Math.min(D.c.length,5):vt,mode:D.m==='prop'?'prop':D.m==='rank'?'rank':'maj',live:!!D.lv,digits:len,opensAt:ts(D.o),closesAt:ts(D.f),blankCounts:!!D.b,created:Date.now()});
  S.setup=false;S.editId=null;S.msg='';openCargo(id);
 }catch(e){S.msg='Não foi possível abrir a votação ('+errTxt(e)+').';render();}
}
async function reconf(){var c=S.cfg;
 S.draft={e:S.draft.e||'',q:c.question,n:String(c.expected),s:String(c.seats||1),v:String(c.votes||1),m:c.mode||'maj',lv:!!c.live,o:toLocal(c.opensAt),f:toLocal(c.closesAt),b:!!c.blankCounts,c:c.cands.map(function(x){return {n:x.n,name:x.name,party:x.party||'',sigla:x.sigla||'',vice:x.vice||'',bio:x.bio||'',photo:x.photo||null};})};
 S.editId=S.cid;stop();S.cid=null;S.cfg=null;S.setup=true;S.msg='';render();}
async function newVote(){
 try{var b=writeBatch(fdb),id=S.cid;
  (await getDocs(collection(fdb,BP(id)))).forEach(function(d){b.delete(d.ref);});
  (await getDocs(collection(fdb,VP(id)))).forEach(function(d){b.delete(d.ref);});
  b.delete(doc(fdb,P(id)));await b.commit();S.confirm='';S.msg='';
 }catch(e){S.msg='Não foi possível apagar ('+errTxt(e)+').';S.confirm='';render();}
}
async function closeVote(){
 try{await db.doc(P(S.cid)).update({status:'closed'});S.confirm='';}
 catch(e){S.msg='Não foi possível encerrar ('+errTxt(e)+').';S.confirm='';render();}
}
async function startRound2(){
 var c=S.cfg,f=finalistsFrom(tally(c,1));
 try{await db.doc(P(S.cid)).update({round:2,status:'open',finalists:f,opensAt:ts(S.r2o),closesAt:ts(S.r2f)});}
 catch(e){S.msg='Não foi possível abrir o 2º turno ('+errTxt(e)+').';render();}
}

/* telas */
function openView(c){
 var r=rnd(c),t=tally(c,r),p=[];
 if(!S.uid)p.push(note('Entre com sua conta para votar.'));
 else if(S.canWrite===false)p.push(note('Seu acesso é somente de leitura, então não dá para votar. Peça ao organizador para convidar você com permissão de colaborador.'));
 else{
  if(r===2)p.push(note('Nenhuma opção passou de 50% no 1º turno. Neste turno votam apenas as mais votadas.'));
  p.push(h('h1',{},c.question),h('div',{class:'ufoot'},h('button',{class:'sair',onclick:function(){S.showC=!S.showC;render();}},I('people'),S.showC?'Ocultar candidatos':'Conheça os candidatos'),(c.opensAt||c.closesAt)?h('button',{class:'sair',onclick:function(){ics(c);}},I('cal'),'Adicionar à agenda'):'',h('button',{class:'sair','aria-pressed':String(!S.mute),onclick:function(){S.mute=!S.mute;render();}},I(S.mute?'mute':'sound'),S.mute?'Som desligado':'Som ligado')));if(S.showC)p.push(candsCard(c));
  p.push(phase(c)==='wait'?waitCard(c):urna(c),h('p',{class:'mut'},'Também funciona pelo teclado: números, Enter (confirma), Backspace (corrige) e B (branco). Votos em branco/nulos '+(c.blankCounts?'entram':'não entram')+' no cálculo dos 50%. O voto é secreto e não pode ser alterado.'));
 }
 if(c.live&&(hasVoted(r)||S.admin))p.push(h('div',{class:'card'},h('p',{class:'q'},'Boca de urna (parcial)'),h('p',{class:'mut'},'Contagem provisória, sem valor oficial. Muda a cada voto.')),bars(c,t,r===2?c.finalists:all(c)));
 p.push(h('p',{class:'mut'},t.voters+' de '+c.expected+' eleitores já votaram neste turno.'));
 if(S.admin&&S.cid!=='__train'){
  var a=h('div',{class:'card'},h('p',{class:'mut'},'Painel do organizador'));
  if(r===1&&!t.total&&!t.voters)a.append(h('button',{class:'ghost',onclick:reconf},'Editar candidatos (antes do primeiro voto)'));
  a.append(h('button',{class:'ghost',onclick:function(){S.showAtt=!S.showAtt;render();}},S.showAtt?'Ocultar comparecimento':'Ver comparecimento'));
  if(S.confirm!=='close')a.append(h('button',{class:'ghost',onclick:function(){S.confirm='close';render();}},'Encerrar o '+r+'º turno e mostrar resultado'));
  else a.append(h('p',{class:'mut'},'Ninguém mais poderá votar neste turno. Confirmar?'),h('button',{class:'btn',onclick:closeVote},'Sim, encerrar'),h('button',{class:'ghost',onclick:function(){S.confirm='';render();}},'Cancelar'));
  p.push(a);if(S.showAtt)p.push(attend(c));
 }
 return p;
}
function bars(c,t,idxs){
 var card=h('div',{class:'card'});
 idxs.forEach(function(i){var x=c.cands[i],n=t.counts[i];
  card.append(h('div',{class:'row'+(n===t.max&&n>0?' win':'')},
   h('div',{class:'top'},h('span',{class:'nm'},h('img',{class:'th',src:x.photo||PH,alt:''}),x.n+' · '+x.name+(x.sigla?' ('+x.sigla+')':'')),h('span',{},n+' ('+pct(n,t.base)+')')),
   h('div',{class:'track'},h('div',{class:'fill',style:'width:'+(t.base?n*100/t.base:0)+'%'}))));});
 if(t.blank)card.append(h('p',{class:'mut'},'Brancos: '+t.bl+' · Nulos: '+t.nu+(c.blankCounts?' ('+pct(t.blank,t.total)+' dos votos)':' (não entram no cálculo)')));
 return card;
}
function results(c){if(c.mode==='rank')return resultsR(c);if(c.mode==='prop')return resultsP(c);if((c.seats||1)>1)return resultsN(c);
 var r=rnd(c),p=[];
 if(r===2){var t1=tally(c,1);p.push(h('div',{class:'card'},h('p',{class:'mut'},'Resultado do 1º turno'),h('p',{class:'mut'},'Nenhuma opção passou de 50%.')),bars(c,t1,all(c)));}
 var t=tally(c,r),cand=r===2?c.finalists:all(c);
 p.push(h('div',{class:'card'},h('p',{class:'mut'},'Resultado do '+r+'º turno'),h('p',{class:'q'},c.question)),bars(c,t,cand));
 var leaders=cand.filter(function(i){return t.counts[i]===t.max;});
 var names=function(a){return a.map(function(i){return c.options[i];}).join(', ');};
 if(t.invalid)p.push(warn('Atenção: foram contados '+t.total+' votos para '+t.voters+' votantes registrados (esperados: '+c.expected+(nv(c)>1?', '+nv(c)+' votos cada':'')+'). Este turno deve ser considerado inválido e repetido.'));
 else if(!t.base||t.max===0)p.push(note('Nenhum voto válido neste turno (sem votos ou só votos em branco/nulos). Repitam a votação.'));
 else{
  var box=h('div',{class:'card'}),w=leaders.length===1?leaders[0]:-1;
  var win=function(lbl,txt){var x=c.cands[w];box.append(h('div',{class:'cinfo'},h('div',{},h('p',{class:'q'},lbl+x.n+' · '+x.name+(x.sigla?' ('+x.sigla+')':'')),h('p',{class:'mut'},(x.vice?'Vice: '+x.vice+'. ':'')+txt)),h('img',{class:'th',src:x.photo||PH,alt:'',style:'width:70px;height:93px'})));};
  if(r===1){
   if(w>=0&&t.counts[w]*2>t.base)win('Vencedora: ',pct(t.counts[w],t.base)+' dos votos'+(c.blankCounts?'':' válidos')+', mais de 50%. Não há 2º turno.');
   else{
    var f=finalistsFrom(t);
    box.append(h('p',{class:'q'},'Haverá 2º turno'),h('p',{class:'mut'},'Nenhuma opção passou de 50%. Passam para o 2º turno: '+names(f)+'.'));
    box.append(S.admin?h('div',{},h('label',{},'2º turno abre em (opcional)'),dtIn(S,'r2o'),h('label',{},'2º turno fecha em (opcional)'),dtIn(S,'r2f'),h('button',{class:'btn',onclick:startRound2},'Abrir 2º turno')):h('p',{class:'mut'},'Aguarde o organizador abrir o 2º turno.'));
   }
  }else{
   if(w>=0)win('Resultado final: ',pct(t.counts[w],t.base)+' dos votos no 2º turno.');
   else{var dw=c.draws&&c.draws.f;if(dw){var xw=c.cands[dw.winners[0]];box.append(h('p',{class:'q'},'Resultado final (sorteio): '+xw.n+' · '+xw.name),h('p',{class:'mut'},drawNote(dw)));}else box.append(h('p',{class:'q'},'Empate no 2º turno'),h('p',{class:'mut'},'Empatadas: '+names(leaders)+'.'),drawControl('f',leaders,1));}
  }
  box.append(h('p',{class:'mut'},'Conferência: '+pl(t.total,'voto','votos')+' e '+pl(t.voters,'votante registrado','votantes registrados')+'.'));
  p.push(box);
 }
 var a=h('div',{class:'card'},h('p',{class:'mut'},'Painel do organizador'));
 if(S.confirm!=='new')a.append(h('button',{class:'ghost',onclick:function(){S.confirm='new';render();}},'Apagar esta votação'));
 else a.append(h('p',{class:'mut'},'Os resultados deixarão de existir. Confirmar?'),h('button',{class:'btn',onclick:newVote},'Sim, apagar'),h('button',{class:'ghost',onclick:function(){S.confirm='';render();}},'Cancelar'));
 p.push(h('button',{class:'ghost',onclick:function(){boletim(c);}},'Baixar boletim de urna (imagem)'),h('button',{class:'ghost',onclick:startTv},'Modo telão (apuração animada)'));if(S.admin)p.push(a);
 return p;
}

var P=function(id){return id==='__old'?'config/main':'cargos/'+id;},VP=function(id){return id==='__old'?'voters':'cargos/'+id+'/voters';},BP=function(id){return id==='__old'?'ballots':'cargos/'+id+'/ballots';};
function save(cv,name){cv.toBlob(function(bl){var f=new File([bl],name,{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(function(){});}else{var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=name;a.click();}});}
function diploma(c,i){
 var d=c.cands[i],W=1000,H=700,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d'),bn=(S.brand&&S.brand.name)||'Urna do clube';
 var done=function(img){
  x.fillStyle='#fffdf5';x.fillRect(0,0,W,H);x.strokeStyle='#8a6d1d';x.lineWidth=10;x.strokeRect(24,24,W-48,H-48);x.lineWidth=2;x.strokeRect(44,44,W-88,H-88);
  x.textAlign='center';x.fillStyle='#8a6d1d';x.font='700 54px Georgia,serif';x.fillText('DIPLOMA',W/2,140);
  x.fillStyle='#333';x.font='24px Georgia,serif';x.fillText(bn+' confere a',W/2,200);
  x.fillStyle='#111';x.font='700 46px Georgia,serif';x.fillText(d.name,W/2,280);
  x.font='24px Georgia,serif';x.fillStyle='#333';x.fillText('o título de eleito(a) para',W/2,330);
  x.font='700 34px Georgia,serif';x.fillStyle='#111';x.fillText(c.question.slice(0,50),W/2,382);
  x.font='22px Georgia,serif';x.fillStyle='#555';x.fillText((d.sigla?d.sigla+' · ':'')+'nº '+d.n+' · eleição de '+new Date(c.electedAt||Date.now()).toLocaleDateString('pt-BR'),W/2,430);
  if(img)x.drawImage(img,W/2-50,470,100,133);
  x.strokeStyle='#333';x.lineWidth=1.5;x.beginPath();x.moveTo(110,620);x.lineTo(360,620);x.moveTo(640,620);x.lineTo(890,620);x.stroke();
  x.font='18px Georgia,serif';x.fillText('Organizador(a)',235,646);x.fillText('Eleito(a)',765,646);
  save(cv,'diploma-'+d.name.replace(/\s+/g,'-')+'.png');};
 if(d.photo){var im=new Image();im.onload=function(){done(im);};im.onerror=function(){done(null);};im.src=d.photo;}else done(null);
}
function closing(c){
 var w=c.elected||[],card=h('div',{class:'card'},h('p',{class:'q'},'Documentos'));
 card.append(h('button',{class:'ghost',onclick:function(){boletim(c,true);}},'Baixar ata da eleição (imagem)'));
 w.forEach(function(i){card.append(h('button',{class:'ghost',onclick:function(){diploma(c,i);}},'Diploma: '+c.cands[i].name));});
 if(S.admin)card.append(h('button',{class:'btn',onclick:publishBoard},c.elected?'Atualizar quadro de eleitos':'Publicar no quadro de eleitos'));
 return card;
}
async function publishBoard(){var c=S.cfg,w=winnersOf(c,tally(c,rnd(c)));if(!w.length){S.msg='Ainda não há eleito definido: faça o 2º turno ou o sorteio de desempate.';return render();}
 try{await db.doc(P(S.cid)).update({elected:w,electedAt:Date.now()});S.msg='';}catch(e){S.msg='Não foi possível publicar ('+errTxt(e)+').';render();}}
function quadro(){
 var L=S.cargos.filter(function(x){return x.c.elected&&x.c.elected.length;});if(!L.length)return null;
 var g=h('div',{class:'gal'});
 L.forEach(function(x){x.c.elected.forEach(function(i){var d=x.c.cands[i];g.append(h('div',{class:'por'},h('img',{src:d.photo||PH,alt:'Foto de '+d.name}),h('div',{class:'num'},d.n),h('b',{},d.name),h('span',{},x.c.question+(d.sigla?', '+d.sigla:''))));});});
 return [h('h2',{},'Quadro de eleitos'),g];
}
function applyBrand(){var b=S.brand||{},st=document.documentElement.style;
 if(b.color&&/^#[0-9a-f]{6}$/i.test(b.color)){var n=parseInt(b.color.slice(1),16),l=0.299*(n>>16)+0.587*(n>>8&255)+0.114*(n&255);st.setProperty('--acc',b.color);st.setProperty('--accink',l>150?'#111':'#fff');st.setProperty('--bar','color-mix(in srgb,'+b.color+' 30%,var(--card))');}
 else['--acc','--accink','--bar'].forEach(function(k){st.removeProperty(k);});
 document.title=b.name||'Urna do clube';}
function readLogo(file,cb){var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){var k=Math.min(1,160/im.height,320/im.width),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);cb(cv.toDataURL('image/png'));};im.onerror=function(){cb(null);};im.src=fr.result;};fr.readAsDataURL(file);}
async function saveBrand(){var B=S.brandDraft;try{await db.doc('settings/site').set({name:(B.name||'').trim(),color:B.color||'',logo:B.logo||''});S.msg='';S.brandOn=false;}catch(e){S.msg='Não foi possível salvar ('+errTxt(e)+').';}render();}
function brandView(){
 var B=S.brandDraft,nm=h('input',{type:'text',value:B.name||'',maxlength:'40',placeholder:'Ex.: Atlético Barreiraense',oninput:function(){B.name=nm.value;}});
 var co=h('input',{type:'color',value:B.color||'#2d6a4f',style:'height:44px;padding:2px',oninput:function(){B.color=co.value;}});
 var f=h('input',{type:'file',accept:'image/*',style:'display:none',onchange:function(){if(f.files[0])readLogo(f.files[0],function(u){B.logo=u;render();});}});
 return [h('button',{class:'back',onclick:function(){S.brandOn=false;S.msg='';render();}},'← Todas as votações'),S.msg&&warn(S.msg),
  h('div',{class:'card'},h('p',{class:'q'},'Identidade do clube'),h('label',{},'Nome do clube'),nm,h('label',{},'Cor principal'),co,
   B.logo?h('img',{src:B.logo,alt:'',style:'height:60px;display:block;margin:0 0 10px'}):'',
   h('button',{class:'ghost',onclick:function(){f.click();}},B.logo?'Trocar logo':'Escolher logo'),f,B.logo?h('button',{class:'ghost',onclick:function(){B.logo='';render();}},'Remover logo'):'',
   h('button',{class:'btn',onclick:saveBrand},'Salvar'),h('button',{class:'ghost',onclick:function(){B.name='';B.color='';B.logo='';saveBrand();}},'Restaurar padrão'))];
}
function santinho(c,i){
 var d=c.cands[i],W=600,H=900,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d'),bn=(S.brand&&S.brand.name)||'Urna do clube',ac=(S.brand&&S.brand.color)||'#2d6a4f';
 var wrap=function(txt,mx,y,lh,w){var ln='';txt.split(' ').forEach(function(wd){var t=ln?ln+' '+wd:wd;if(x.measureText(t).width>w&&ln){x.fillText(ln,mx,y);y+=lh;ln=wd;}else ln=t;});x.fillText(ln,mx,y);};
 var done=function(img){
  x.fillStyle=ac;x.fillRect(0,0,W,H);x.fillStyle='#fff';x.fillRect(30,30,W-60,H-60);
  x.fillStyle=ac;x.fillRect(30,30,W-60,110);x.fillStyle='#fff';x.textAlign='center';x.font='700 30px Arial';x.fillText(bn.toUpperCase().slice(0,28),W/2,72);x.font='22px Arial';x.fillText(c.question.slice(0,40),W/2,110);
  if(img)x.drawImage(img,W/2-110,160,220,293);else{x.fillStyle='#ddd';x.fillRect(W/2-110,160,220,293);}
  x.fillStyle=ac;x.font='700 110px Arial';x.fillText(d.n,W/2,570);
  x.fillStyle='#111';x.font='700 38px Arial';x.fillText(d.name.slice(0,30),W/2,626);
  x.font='24px Arial';x.fillStyle='#444';x.fillText((d.sigla?d.sigla+(d.party?' · '+d.party:''):'').slice(0,40),W/2,664);
  if(d.vice)x.fillText('Vice: '+d.vice,W/2,698);
  if(d.bio){x.font='italic 24px Arial';x.fillStyle='#222';wrap('“'+d.bio+'”',W/2,748,28,W-140);}
  save(cv,'santinho-'+d.name.replace(/\s+/g,'-')+'.png');};
 if(d.photo){var im=new Image();im.onload=function(){done(im);};im.onerror=function(){done(null);};im.src=d.photo;}else done(null);
}
function ics(c){
 var z=function(ms){return new Date(ms).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');},st=c.opensAt||Date.now(),en=c.closesAt||st+3600000;
 var t=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Urna do clube//PT','BEGIN:VEVENT','UID:'+(S.cid||'v')+'@urna','DTSTAMP:'+z(Date.now()),'DTSTART:'+z(st),'DTEND:'+z(en),'SUMMARY:Votação: '+c.question.replace(/[,;\n]/g,' '),'DESCRIPTION:Vote em '+location.href.split('#')[0],'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:Votação','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/calendar'}));a.download='votacao.ics';a.click();
}
function startTrain(){
 stop();S.cid='__train';S.trainDone=false;S.cfgLoaded=true;S.vdocs=[];S.ballots=[];S.digits='';S.mode='';S.picks=[];S.lastRound=1;
 S.cfg=norm({question:'Votação de treino',cands:[{n:'11',name:'Candidato Azul',sigla:'AZ',party:'Partido Azul',vice:'Vice Anil',bio:'Treino de urna: digite 11, 22 ou 33.',photo:null},{n:'22',name:'Candidata Verde',sigla:'VD',party:'Partido Verde',vice:'Vice Musgo',bio:'',photo:null},{n:'33',name:'Candidato Laranja',sigla:'LJ',party:'Partido Laranja',vice:'',bio:'',photo:null}],expected:1,status:'open',round:1,seats:1,votes:1,digits:2});
 render();
}
var NS='http://www.w3.org/2000/svg',ICO={
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
 text:'<path d="M4 7V5h11v2M9.5 5v14M7 19h5M14 12h6M17 12v7M15.5 19h3"/>',
 out:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 chev:'<path d="M9 6l6 6-6 6"/>', left:'<path d="M15 18l-6-6 6-6"/>', plus:'<path d="M12 5v14M5 12h14"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 palette:'<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2a5.5 5.5 0 0 0 5.4-5.4C22 6.5 17.5 2 12 2z"/>',
 ballot:'<path d="M4 13h16v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M8 13V4h8v9M10.5 8.5l1.5 1.5 3-3"/>',
 cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 sound:'<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
 mute:'<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M23 9l-6 6M17 9l6 6"/>',
 people:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
};
function I(n){var s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','2');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');s.setAttribute('aria-hidden','true');s.innerHTML=ICO[n]||'';return s;}
function darkNow(){var t=document.documentElement.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;}
function toggleTheme(){var t=darkNow()?'light':'dark';document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('urna-tema',t);}catch(e){}render();}
function goHome(){stop();S.cid=null;S.cfg=null;S.panel=false;S.setup=false;S.msg='';S.confirm='';render();}
function openPanel(tab){stop();S.cid=null;S.cfg=null;S.setup=false;S.panel=true;S.ptab=tab||S.ptab||'v';S.msg='';S.confirm='';if(S.ptab==='i')S.brandDraft=Object.assign({},S.brand||{});render();window.scrollTo(0,0);}
function isFin(c){return c.status==='closed'||phase(c)==='over';}
function turnout(id,c){var d=(S.turn&&S.turn[id])||[],k=vkey(c,rnd(c));return d.filter(function(x){return x[k]===true||(!c.eid&&rnd(c)===1&&x.voted===true);}).length;}
function subTurn(id){S.turn=S.turn||{};S.tsub=S.tsub||{};if(S.tsub[id])return;S.tsub[id]=db.collection(VP(id)).onSnapshot(function(s){S.turn[id]=s.docs.map(function(d){return d.data();});render();},function(){});}
function panel(){
 var tabs=[['v','ballot','Votações'],['e','users','Eleitores'],['i','palette','Identidade']],T=h('div',{class:'tabs',role:'tablist'});
 tabs.forEach(function(x){T.append(h('button',{class:'tab',role:'tab','aria-selected':String(S.ptab===x[0]),onclick:function(){openPanel(x[0]);}},I(x[1]),x[2]));});
 var out=[h('button',{class:'back',onclick:goHome},I('left'),'Voltar para as votações'),h('h1',{},'Painel do organizador'),h('p',{class:'lede'},'Crie votações, acompanhe quem já votou e cuide da lista de eleitores e da cara do site.'),T];
 if(S.ptab==='e')return out.concat(manage().slice(1));
 if(S.ptab==='i')return out.concat(brandView().slice(1));
 var L=S.cargos.map(function(x){return x;});if(S.old)L.push({id:'__old',c:S.old});
 var open=L.filter(function(x){return !isFin(x.c);}),done=L.filter(function(x){return isFin(x.c);});
 var votes=open.reduce(function(a,x){return a+turnout(x.id,x.c);},0),exp=open.reduce(function(a,x){return a+(x.c.expected||0);},0);
 out.push(h('div',{class:'stats'},h('div',{class:'stat'},h('b',{},String(open.length)),h('span',{},open.length===1?'votação em andamento':'votações em andamento')),h('div',{class:'stat'},h('b',{},exp?Math.round(votes*100/exp)+'%':'—'),h('span',{},'comparecimento nas abertas')),h('div',{class:'stat'},h('b',{},String(S.allowedList.length)),h('span',{},S.allowedList.length===1?'eleitor cadastrado':'eleitores cadastrados'))));
 out.push(h('button',{class:'btn',onclick:function(){S.draft=newDraft();S.setup=true;S.panel=false;S.msg='';render();}},I('plus'),'Nova votação'));
 var list=function(arr,title,empty){var card=h('div',{class:'card'},h('p',{class:'q'},title));
  if(!arr.length)card.append(h('p',{class:'mut'},empty));
  arr.forEach(function(x){var n=turnout(x.id,x.c),e=x.c.expected||1;
   card.append(h('div',{class:'adm'},h('div',{},h('div',{class:'t'},x.c.question),h('div',{class:'cgm',style:'margin-top:4px'},chip(x.c),h('span',{},pl(n,'eleitor votou','eleitores votaram')+' de '+e))),
    h('button',{class:'sair',onclick:function(){S.fromPanel=true;openCargo(x.id);}},isFin(x.c)?'Ver resultado':'Abrir'),
    h('div',{class:'track'},h('div',{class:'fill',style:'width:'+Math.min(100,n*100/e)+'%;background:var(--acc)'}))));});
  return card;};
 out.push(list(open,'Em andamento','Nenhuma votação aberta. Use Nova votação para começar.'),list(done,'Encerradas','As votações encerradas aparecem aqui, com resultado e documentos.'));
 return out;
}
function drawNote(d){return 'Sorteio de '+new Date(d.at).toLocaleString('pt-BR')+' entre '+d.pool.length+' empatados. Ordem sorteada: '+d.order.map(function(i){return S.cfg.cands[i].name;}).join(' > ')+'.';}
function rnd32(n){var a=new Uint32Array(1),lim=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a);}while(a[0]>=lim);return a[0]%n;}
function drawControl(key,pool,need){
 if(!S.admin)return h('p',{class:'mut'},'Aguardando o sorteio do organizador.');
 if(S.confirm!=='draw:'+key)return h('button',{class:'btn',onclick:function(){S.confirm='draw:'+key;render();}},'Sortear desempate');
 return h('div',{},h('p',{class:'mut'},'Sortear entre '+pool.length+' empatados? O resultado fica registrado e não pode ser refeito.'),h('button',{class:'btn',onclick:function(){doDraw(key,pool,need);}},'Sim, sortear'),h('button',{class:'ghost',onclick:function(){S.confirm='';render();}},'Cancelar'));
}
async function doDraw(key,pool,need){
 var a=pool.slice(),i,j,t,o={};for(i=a.length-1;i>0;i--){j=rnd32(i+1);t=a[i];a[i]=a[j];a[j]=t;}
 o['draws.'+key]={winners:a.slice(0,need),order:a,pool:pool,at:Date.now()};
 try{await db.doc(P(S.cid)).update(o);S.confirm='';}catch(e){S.msg='Não foi possível registrar o sorteio ('+errTxt(e)+').';S.confirm='';render();}
}
function candsCard(c){
 var card=h('div',{class:'card'},h('p',{class:'q'},'Conheça os candidatos'));
 c.cands.forEach(function(x,i){if(!inRound(c,i))return;card.append(h('div',{class:'nm',style:'margin:0 0 12px;align-items:flex-start'},h('img',{class:'th',src:x.photo||PH,alt:'',style:'width:54px;height:72px'}),h('div',{},h('b',{},x.n+' · '+x.name+(x.sigla?' ('+x.sigla+')':'')),x.vice?h('div',{class:'mut'},'Vice: '+x.vice):'',x.bio?h('div',{},x.bio):'',h('button',{class:'sair',style:'margin-top:6px',onclick:function(){santinho(c,i);}},'Baixar santinho'))));});
 return card;
}
function resultsR(c){
 var t=tally(c,1),p=[h('div',{class:'card'},h('p',{class:'mut'},'Resultado · votação ranqueada'),h('p',{class:'q'},c.question))];
 if(t.invalid)p.push(warn('Atenção: foram contados '+t.total+' votos para '+t.voters+' votantes registrados (esperados: '+c.expected+'). A votação deve ser considerada inválida e repetida.'));
 else if(!t.rb.length)p.push(note('Nenhum voto válido. Repitam a votação.'));
 else{
  var R=irv(c,t);
  R.rounds.forEach(function(rd,k){
   var card=h('div',{class:'card'},h('p',{class:'mut'},'Rodada '+(k+1)+' · '+rd.act+' votos ativos'));
   rd.alive.slice().sort(function(a,b){return rd.cnt[b]-rd.cnt[a];}).forEach(function(i){var x=c.cands[i],n=rd.cnt[i];
    card.append(h('div',{class:'row'+(n*2>rd.act?' win':'')},h('div',{class:'top'},h('span',{class:'nm'},h('img',{class:'th',src:x.photo||PH,alt:''}),x.n+' · '+x.name),h('span',{},n+' ('+pct(n,rd.act)+')')),h('div',{class:'track'},h('div',{class:'fill',style:'width:'+(rd.act?n*100/rd.act:0)+'%'}))));});
   var nx=R.rounds[k+1];
   if(nx){var out=rd.alive.filter(function(i){return nx.alive.indexOf(i)<0;});card.append(h('p',{class:'mut'},'Eliminado'+(out.length>1?'s':'')+': '+out.map(function(i){return c.cands[i].name;}).join(', ')+'. Os votos vão para a próxima opção de cada eleitor.'));}
   p.push(card);});
  var box=h('div',{class:'card'}),dw=c.draws&&c.draws.irv,wi=R.winner!=null?R.winner:(dw?dw.winners[0]:null);
  if(wi!==null){var x=c.cands[wi];box.append(h('div',{class:'cinfo'},h('div',{},h('p',{class:'q'},'Vencedor: '+x.n+' · '+x.name+(x.sigla?' ('+x.sigla+')':'')),h('p',{class:'mut'},R.winner!=null?'Passou de 50% dos votos ativos na última rodada.':drawNote(dw))),h('img',{class:'th',src:x.photo||PH,alt:'',style:'width:70px;height:93px'})));}
  else box.append(h('p',{class:'q'},'Empate na última rodada'),h('p',{class:'mut'},'Empatados: '+R.tied.map(function(i){return c.cands[i].name;}).join(', ')+'.'),drawControl('irv',R.tied,1));
  box.append(h('p',{class:'mut'},'Sem preferência (branco): '+t.bl+' · Votos: '+t.total+' · Votantes: '+t.voters+' de '+c.expected+'.'));p.push(box);
 }
 p.push(h('button',{class:'ghost',onclick:function(){boletim(c);}},'Baixar boletim de urna (imagem)'),h('button',{class:'ghost',onclick:startTv},'Modo telão (apuração animada)'));
 if(S.admin){var a=h('div',{class:'card'},h('p',{class:'mut'},'Painel do organizador'));
  if(S.confirm!=='new')a.append(h('button',{class:'ghost',onclick:function(){S.confirm='new';render();}},'Apagar esta votação'));
  else a.append(h('p',{class:'mut'},'Os resultados deixarão de existir. Confirmar?'),h('button',{class:'btn',onclick:newVote},'Sim, apagar'),h('button',{class:'ghost',onclick:function(){S.confirm='';render();}},'Cancelar'));
  p.push(a);}
 return p;
}
function resultsP(c){
 var t=tally(c,1),p=[h('div',{class:'card'},h('p',{class:'mut'},'Resultado · proporcional · '+c.seats+' vagas'),h('p',{class:'q'},c.question))];
 if(t.invalid)p.push(warn('Atenção: foram contados '+t.total+' votos para '+t.voters+' votantes registrados (esperados: '+c.expected+'). A votação deve ser considerada inválida e repetida.'));
 else if(!t.base)p.push(note('Nenhum voto válido. Repitam a votação.'));
 else{
  var R=propResult(c,t),card=h('div',{class:'card'},h('p',{class:'q'},'Cadeiras por partido'),h('p',{class:'mut'},'Votos válidos: '+R.V+' · quociente eleitoral: '+R.qe));
  R.rows.slice().sort(function(a,b){return b.seats-a.seats||b.tot-a.tot;}).forEach(function(r){card.append(h('div',{style:'margin:0 0 10px'},h('div',{class:'top'},h('b',{},r.p.sigla+' · '+r.p.pre),h('b',{},r.seats+' cadeira'+(r.seats===1?'':'s'))),h('div',{class:'mut'},r.nom+' nominais + '+r.leg+' de legenda = '+r.tot)));});
  p.push(card);
  var box=h('div',{class:'card'},h('p',{class:'q'},'Eleitos'));
  R.rows.forEach(function(r){r.elected.forEach(function(i){var x=c.cands[i];box.append(h('div',{class:'nm',style:'margin:0 0 8px'},h('img',{class:'th',src:x.photo||PH,alt:''}),x.n+' · '+x.name+' ('+r.p.sigla+') · '+t.counts[i]+(t.counts[i]===1?' voto':' votos')));});
   if(r.tie&&r.drawn)box.append(h('p',{class:'mut'},'Última vaga de '+r.p.sigla+' decidida por sorteio. '+drawNote(r.drawn)));else if(r.tie)box.append(warn('Empate na última vaga de '+r.p.sigla+' entre: '+r.tied.map(function(i){return c.cands[i].name;}).join(', ')+'.'),drawControl('p'+r.p.pre,r.tied,r.need));if(r.miss)box.append(warn(r.p.sigla+' tem '+r.miss+' cadeira(s) sem candidato suficiente.'));});
  if(R.left>0)box.append(warn(R.left+' vaga(s) sem candidato elegível (mínimo de 10% do quociente).'));
  box.append(h('p',{class:'mut'},'Regra: quociente eleitoral; sobras por maiores médias entre partidos com pelo menos 80% do quociente; dentro do partido, os mais votados, cada um com pelo menos 10% do quociente.'));
  p.push(box);
 }
 p.push(h('button',{class:'ghost',onclick:function(){boletim(c);}},'Baixar boletim de urna (imagem)'),h('button',{class:'ghost',onclick:startTv},'Modo telão (apuração animada)'));
 if(S.admin){var a=h('div',{class:'card'},h('p',{class:'mut'},'Painel do organizador'));
  if(S.confirm!=='new')a.append(h('button',{class:'ghost',onclick:function(){S.confirm='new';render();}},'Apagar esta votação'));
  else a.append(h('p',{class:'mut'},'Os resultados deixarão de existir. Confirmar?'),h('button',{class:'btn',onclick:newVote},'Sim, apagar'),h('button',{class:'ghost',onclick:function(){S.confirm='';render();}},'Cancelar'));
  p.push(a);}
 return p;
}
function boletim(c,ata){
 var r=rnd(c),t=tally(c,r),idx=(r===2?c.finalists:all(c)).slice().sort(function(a,b){return t.counts[b]-t.counts[a];});
 var W=900,H=450+idx.length*46+(ata?130:0),cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,W,H);x.strokeStyle='#222';x.lineWidth=3;x.strokeRect(14,14,W-28,H-28);
 x.fillStyle='#111';x.font='700 34px Arial';x.fillText((ata?'ATA DA ELEIÇÃO':'BOLETIM DE URNA'),44,74);
 x.fillStyle='#555';x.font='19px Arial';x.fillText(((S.brand&&S.brand.name)||'Urna do clube')+' · emitido em '+new Date().toLocaleString('pt-BR'),44,106);
 x.fillStyle='#111';x.font='700 26px Arial';x.fillText(c.question.slice(0,52),44,158);
 x.font='20px Arial';x.fillText(r+'º turno · '+((c.seats||1)>1?c.seats+' vagas':'1 vaga'),44,190);
 x.fillStyle='#555';x.fillText('Nº',44,236);x.fillText('Candidato',130,236);x.textAlign='right';x.fillText('Votos',690,236);x.fillText('%',836,236);x.textAlign='left';
 x.fillStyle='#111';var y=282;
 idx.forEach(function(i){var d=c.cands[i];x.font='22px Arial';x.fillText(d.n,44,y);x.fillText((d.name+(d.sigla?' ('+d.sigla+')':'')).slice(0,34),130,y);x.textAlign='right';x.fillText(String(t.counts[i]),690,y);x.fillText(pct(t.counts[i],t.base),836,y);x.textAlign='left';y+=46;});
 x.fillStyle='#555';x.font='19px Arial';x.fillText('Brancos: '+t.bl+' · Nulos: '+t.nu+' · Total de votos: '+t.total,44,y+10);
 x.fillText('Votantes registrados: '+t.voters+' de '+c.expected+(t.invalid?' · ATENÇÃO: não confere':' · conferência OK'),44,y+42);
 x.fillStyle='#111';x.font='700 24px Arial';x.fillText(resText(c,t,idx).slice(0,60),44,y+96);
 if(ata){x.strokeStyle='#111';x.lineWidth=1.5;x.beginPath();x.moveTo(44,y+190);x.lineTo(380,y+190);x.moveTo(500,y+190);x.lineTo(836,y+190);x.stroke();x.font='18px Arial';x.fillStyle='#555';x.fillText('Organizador(a)',44,y+216);x.fillText('Testemunha',500,y+216);}
 cv.toBlob(function(bl){var f=new File([bl],(ata?'ata-da-eleicao.png':'boletim-de-urna.png'),{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Boletim de urna'}).catch(function(){});}
  else{var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=(ata?'ata-da-eleicao.png':'boletim-de-urna.png');a.click();}});
}
var tvT=null;
function startTv(){S.tv=true;S.tvStep=0;try{document.documentElement.requestFullscreen();}catch(e){}render();clearInterval(tvT);
 tvT=setInterval(function(){var c=S.cfg;if(!c||!S.tv){clearInterval(tvT);return;}var n=(rnd(c)===2?c.finalists:all(c)).length;
  if(S.tvStep<n+1){S.tvStep++;tone(500+S.tvStep*90,0,.18);if(S.tvStep===n+1)beepDone();render();}else clearInterval(tvT);},2200);}
function tvView(c){
 var r=rnd(c),t=tally(c,r),cand=r===2?c.finalists:all(c),asc=cand.slice().sort(function(a,b){return t.counts[a]-t.counts[b];}),n=asc.length,step=S.tvStep;
 var box=h('div',{class:'tv'},h('button',{class:'sair',style:'position:fixed;top:14px;right:14px',onclick:function(){S.tv=false;clearInterval(tvT);try{document.exitFullscreen();}catch(e){}render();}},'Sair do telão'),
  h('div',{class:'tvs'},'APURAÇÃO · '+r+'º TURNO'),h('div',{class:'tvq'},c.question));
 if(step===0)box.append(h('div',{class:'tvs'},'Preparando a contagem…'));
 asc.forEach(function(i,k){if(k>=step)return;var x=c.cands[i],w=t.base?t.counts[i]*100/t.base:0;
  box.append(h('div',{class:'tvr'+(k===step-1&&step<=n?' new':'')},h('img',{src:x.photo||PH,alt:''}),h('div',{style:'flex:1'},h('div',{class:'top'},h('b',{},x.n+' · '+x.name+(x.sigla?' ('+x.sigla+')':'')),h('b',{},t.counts[i]+' · '+pct(t.counts[i],t.base))),h('div',{class:'track'},h('div',{class:'fill tvf',style:'width:'+w+'%;background:#6fcf9b'})))));});
 if(step>n)box.append(h('div',{class:'tvw'},resText(c,t,asc.slice().reverse())),h('p',{class:'tvs'},'Brancos: '+t.bl+' · Nulos: '+t.nu+' · '+t.voters+' votantes'));
 return box;
}
function manage(){
 var ta=h('textarea',{rows:'3',placeholder:'e-mails novos, um por linha',style:'width:100%;box-sizing:border-box;font:inherit;color:var(--ink);background:var(--bg);border:1.5px solid var(--line);border-radius:8px;padding:10px;margin:4px 0 8px'});
 var card=h('div',{class:'card'},h('p',{class:'q'},'Eleitores cadastrados ('+S.allowedList.length+')'),h('p',{class:'mut'},'Quem for removido perde o acesso ao site. Votos já dados continuam valendo: como o voto é secreto, não dá para desfazê-lo.'));
 S.allowedList.slice().sort().forEach(function(e){
  var m=S.members.filter(function(z){return z.email===e;})[0],row=h('div',{class:'top',style:'margin:0 0 8px'},h('span',{},(m&&m.name?m.name+' · ':'')+e));
  if(S.confirm==='rm:'+e)row.append(h('span',{},h('button',{class:'sair',onclick:function(){removeEmail(e);}},'Confirmar'),' ',h('button',{class:'sair',onclick:function(){S.confirm='';render();}},'Cancelar')));
  else row.append(h('button',{class:'sair',onclick:function(){S.confirm='rm:'+e;render();}},'Remover'));
  card.append(row);});
 return [h('button',{class:'back',onclick:function(){S.manage=false;S.confirm='';S.msg='';render();}},'← Todas as votações'),S.msg&&warn(S.msg),
  h('div',{class:'card'},h('p',{class:'q'},'Adicionar eleitores'),ta,h('button',{class:'btn',onclick:function(){addEmails(ta.value);}},'Adicionar')),card];
}
async function addEmails(t){try{await saveAllowed(t);S.msg='';}catch(e){S.msg='Não foi possível adicionar ('+errTxt(e)+').';}render();}
async function removeEmail(e){try{var b=writeBatch(fdb);b.delete(doc(fdb,'allowed',e));S.members.filter(function(m){return m.email===e;}).forEach(function(m){b.delete(doc(fdb,'members',m.uid));});await b.commit();S.confirm='';S.msg='';}catch(x){S.msg='Não foi possível remover ('+errTxt(x)+').';S.confirm='';render();}}
function ts(v){return v?new Date(v).getTime():0;}
function toLocal(ms){return ms?new Date(ms-new Date(ms).getTimezoneOffset()*60000).toISOString().slice(0,16):'';}
function fmt(ms){return new Date(ms).toLocaleString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
function phase(c){var n=Date.now();if(c.opensAt&&n<c.opensAt)return 'wait';if(c.closesAt&&n>=c.closesAt)return 'over';return 'on';}
function cdText(c){var m=Math.max(0,Math.floor((c.opensAt-Date.now())/1000)),d=Math.floor(m/86400),hh=Math.floor(m%86400/3600),mi=Math.floor(m%3600/60);return (d?d+'d ':'')+hh+'h '+mi+'min '+(m%60)+'s';}
function waitCard(c){return h('div',{class:'card'},h('p',{class:'q'},'A votação ainda não abriu'),h('p',{class:'mut'},'Abre em '+fmt(c.opensAt)+'. Faltam ',h('b',{id:'cd'},cdText(c)),'.'));}
function dtIn(o,k){var i=h('input',{type:'datetime-local',value:o[k]||'',oninput:function(){o[k]=i.value;}});return i;}
setInterval(function(){var c=S.cfg;if(!c)return;var ph=phase(c);if(ph!==S.phase){S.phase=ph;render();return;}var el=document.getElementById('cd');if(el)el.textContent=cdText(c);},1000);
function attend(c){
 var r=rnd(c),em=S.allowedList.slice(),ad=ADMIN_EMAIL.toLowerCase(),L=['Ainda não acessou','Entrou, não votou','Já votou'];if(em.indexOf(ad)<0)em.push(ad);
 var rows=em.sort().map(function(e){var m=S.members.filter(function(x){return x.email===e;})[0];return {e:e,name:m&&m.name,st:!m?0:(S.vdocs.some(function(d){return d.id===m.uid&&d.data['r'+r]===true;})?2:1)};});
 var pend=rows.filter(function(x){return x.st<2;});
 var card=h('div',{class:'card'},h('p',{class:'q'},'Comparecimento: '+(rows.length-pend.length)+' de '+rows.length),h('p',{class:'mut'},'Mostra só quem votou, nunca em quem.'));
 rows.sort(function(a,b){return a.st-b.st;}).forEach(function(x){card.append(h('div',{class:'top',style:'margin:0 0 6px'},h('span',{},(x.name?x.name+' · ':'')+x.e),h('span',{class:'chip'+(x.st<2?' done':'')},L[x.st])));});
 if(pend.length){var msg='Oi! Ainda falta votar em "'+c.question+'" na Urna do clube. Faltam: '+pend.map(function(x){return x.name||x.e.split('@')[0];}).join(', ')+'. Link: '+location.href.split('#')[0];
  card.append(h('a',{class:'ghost',href:'https://wa.me/?text='+encodeURIComponent(msg),target:'_blank',rel:'noopener'},'Cobrar os atrasados no WhatsApp'));}
 return card;
}
var unsubs=[];
function err(e){S.slow=true;S.dbErr=(e&&e.code)||'erro';render();}
function newDraft(){var e=function(){return {name:'',n:'',party:'',sigla:'',vice:'',photo:null};};return {e:S.draft.e||'',q:'',n:'15',s:'1',v:'1',m:'maj',o:'',f:'',b:false,c:[e(),e()]};}
function subList(){
 db.collection('cargos').onSnapshot(function(s){S.cargos=s.docs.map(function(d){return {id:d.id,c:norm(d.data())};}).sort(function(a,b){return (a.c.created||0)-(b.c.created||0);});S.listLoaded=true;if(S.admin)S.cargos.forEach(function(x){subTurn(x.id);});render();},err);
 if(S.admin){db.collection('allowed').onSnapshot(function(s){S.allowedList=s.docs.map(function(d){return d.id;});render();},function(){});db.collection('members').onSnapshot(function(s){S.members=s.docs.map(function(d){return Object.assign({uid:d.id},d.data());});render();},function(){});}
 db.doc('config/main').onSnapshot(function(s){S.old=s.exists?norm(s.data()):null;if(S.old&&S.admin)subTurn('__old');render();},function(){});
}
function stop(){unsubs.forEach(function(f){f();});unsubs=[];}
function openCargo(id){
 stop();S.cid=id;S.cfg=null;S.cfgLoaded=false;S.vdocs=[];S.ballots=[];S.digits='';S.mode='';S.picks=[];S.confirm='';S.msg='';S.lastRound=1;S.ballotDoneRound=0;
 unsubs.push(db.doc(P(id)).onSnapshot(function(s){S.cfg=s.exists?norm(s.data()):null;S.cfgLoaded=true;if(!S.cfg){stop();S.cid=null;}render();},err));
 unsubs.push(db.collection(VP(id)).onSnapshot(function(s){S.vdocs=s.docs.map(function(d){return {id:d.id,data:d.data()};});render();},err));
 unsubs.push(db.collection(BP(id)).onSnapshot(function(s){S.ballots=s.docs.map(function(d){return d.data();});render();},err));
 render();
}
function chip(c){var ph=phase(c);if(isFin(c))return h('span',{class:'chip done'},'Encerrada');if(ph==='wait')return h('span',{class:'chip wait'},'Abre '+fmt(c.opensAt));return h('span',{class:'chip live'},'Aberta, '+rnd(c)+'º turno'+(c.closesAt?', até '+fmt(c.closesAt):''));}
function cargoCard(id,c){var ph=phase(c),cls=isFin(c)?' done':ph==='wait'?' wait':'';
 var meta=[pl(c.cands.length,'candidato','candidatos')];if((c.seats||1)>1)meta.push(pl(c.seats,'vaga','vagas'));if(c.mode==='rank')meta.push('ranqueada');if(c.mode==='prop')meta.push('proporcional');if(nv(c)>1&&c.mode!=='rank')meta.push(nv(c)+' votos por eleitor');
 return h('button',{class:'cg'+cls,onclick:function(){S.fromPanel=false;openCargo(id);}},h('span',{class:'stripe'}),h('span',{class:'cb'},h('div',{class:'cgt'},c.question),h('div',{class:'cgm'},chip(c),h('span',{},meta.join(', ')))),h('span',{class:'go'},I('chev')));}
function home(){
 var L=S.cargos.map(function(x){return x;});if(S.old)L.push({id:'__old',c:S.old});
 var open=L.filter(function(x){return !isFin(x.c);}),done=L.filter(function(x){return isFin(x.c);});
 var p=[h('div',{class:'hero'},h('h1',{},open.length?(open.length===1?'Há uma votação aberta':'Há '+open.length+' votações abertas'):'Nenhuma votação aberta agora'),
  h('p',{class:'lede'},open.length?'Escolha a votação, digite o número do seu candidato na urna e confirme. O voto é secreto e vale uma vez por turno.':'Quando o organizador abrir uma votação, ela aparece aqui. Enquanto isso, dá para treinar na urna.'))];
 if(S.admin)p.push(h('button',{class:'ghost',onclick:function(){openPanel('v');}},I('gear'),'Painel do organizador'));
 if(!S.listLoaded)p.push(note('Carregando…'));
 open.forEach(function(x){p.push(cargoCard(x.id,x.c));});
 p.push(h('button',{class:'ghost',onclick:startTrain},I('ballot'),'Treinar na urna, sem valer voto'));
 var qd=quadro();if(qd)p=p.concat(qd);
 if(done.length){p.push(h('h2',{},'Encerradas'));done.forEach(function(x){p.push(cargoCard(x.id,x.c));});}
 return p;
}
function back(){return h('button',{class:'back',onclick:function(){if(S.fromPanel)openPanel();else goHome();}},I('left'),S.fromPanel?'Voltar ao painel':'Todas as votações');}
function resultsN(c){
 var t=tally(c,1),idx=all(c).sort(function(a,b){return t.counts[b]-t.counts[a];}),k=c.seats,p=[];
 p.push(h('div',{class:'card'},h('p',{class:'mut'},'Resultado · '+k+' vagas'),h('p',{class:'q'},c.question)),bars(c,t,idx));
 if(t.invalid)p.push(warn('Atenção: foram contados '+t.total+' votos para '+t.voters+' votantes registrados (esperados: '+c.expected+(nv(c)>1?', '+nv(c)+' votos cada':'')+'). A votação deve ser considerada inválida e repetida.'));
 else if(!t.base||t.max===0)p.push(note('Nenhum voto válido (sem votos ou só votos em branco/nulos). Repitam a votação.'));
 else{
  var last=t.counts[idx[k-1]],sure=idx.filter(function(i){return t.counts[i]>last;}),tied=idx.filter(function(i){return t.counts[i]===last;});
  var box=h('div',{class:'card'},h('p',{class:'q'},'Eleitos'));
  var line=function(i){var x=c.cands[i];return h('div',{class:'nm',style:'margin:0 0 8px'},h('img',{class:'th',src:x.photo||PH,alt:''}),x.n+' · '+x.name+(x.sigla?' ('+x.sigla+')':'')+' · '+t.counts[i]+(t.counts[i]===1?' voto':' votos'));};
  if(last===0)tied=[];var over=sure.length+tied.length>k;
  sure.forEach(function(i){box.append(line(i));});
  if(!over)tied.forEach(function(i){box.append(line(i));});
  if(!over&&sure.length+tied.length<k)box.append(h('p',{class:'mut'},(k-sure.length-tied.length)+' vaga(s) sem eleito: não houve votos suficientes.'));
  else if(c.draws&&c.draws.last){c.draws.last.winners.forEach(function(i){box.append(line(i));});box.append(h('p',{class:'mut'},'Última vaga decidida por sorteio. '+drawNote(c.draws.last)));}
  else box.append(warn('Empate na última vaga entre: '+tied.map(function(i){return c.options[i];}).join(', ')+'.'),drawControl('last',tied,k-sure.length));
  box.append(h('p',{class:'mut'},'Conferência: '+pl(t.total,'voto','votos')+' e '+pl(t.voters,'votante registrado','votantes registrados')+'.'));
  p.push(box);
 }
 var a=h('div',{class:'card'},h('p',{class:'mut'},'Painel do organizador'));
 if(S.confirm!=='new')a.append(h('button',{class:'ghost',onclick:function(){S.confirm='new';render();}},'Apagar esta votação'));
 else a.append(h('p',{class:'mut'},'Os resultados deixarão de existir. Confirmar?'),h('button',{class:'btn',onclick:newVote},'Sim, apagar'),h('button',{class:'ghost',onclick:function(){S.confirm='';render();}},'Cancelar'));
 p.push(h('button',{class:'ghost',onclick:function(){boletim(c);}},'Baixar boletim de urna (imagem)'),h('button',{class:'ghost',onclick:startTv},'Modo telão (apuração animada)'));if(S.admin)p.push(a);
 return p;
}
function body(){
 if(S.auth==='cfg')return note('Falta configurar o Firebase. Abra o README e cole as chaves do seu projeto no arquivo js/config.js.');
 if(S.auth==='load')return note('Carregando…');
 if(S.auth==='out')return [h('div',{class:'hero'},h('h1',{},'Entre para votar'),h('p',{class:'lede'},'Use a conta Google do e-mail que você passou ao organizador. Só quem está na lista de eleitores consegue entrar.')),S.msg&&warn(S.msg),h('button',{class:'btn',onclick:signIn},'Entrar com Google')];
 if(S.auth==='denied')return h('div',{class:'card'},h('h1',{},'E-mail não autorizado'),h('p',{class:'mut'},(S.email||'')+' não está na lista de eleitores. Fale com o organizador.'),h('button',{class:'ghost',onclick:signOutFn},'Sair'));
 if(!S.ready)return note('Carregando…');
 if(S.panel&&S.admin)return panel();
 if(S.setup&&S.admin)return setup();
 if(!S.cid)return home();
 if(!S.cfgLoaded)return note(S.slow?'Ainda não consegui acessar os dados'+(S.dbErr?' ('+S.dbErr+')':'')+'. Verifique a conexão.':'Carregando…');
 var c=S.cfg;if(!c)return home();
 if(rnd(c)!==S.lastRound){S.lastRound=rnd(c);S.digits='';S.mode='';S.picks=[];S.confirm='';}
 var fin=c.status==='closed'||phase(c)==='over';
 if(S.tv&&fin)return tvView(c);
 return [back(),S.cid==='__train'&&h('div',{class:'train'},h('b',{},'Modo treino. '),'Nada é registrado. Vote à vontade para aprender a urna.'),S.cid==='__train'&&S.trainDone?h('button',{class:'ghost',onclick:function(){S.trainDone=false;render();}},'Treinar de novo'):'',S.msg&&warn(S.msg),fin?[results(c),closing(c)]:openView(c)];
}
function render(){var b;try{b=body();}catch(e){b=warn('Erro: '+e.message);}
 var bn=(S.brand&&S.brand.name)||'Urna do clube',dk=darkNow();
 var top=h('header',{class:'bar0'},h('div',{class:'in'},
  h('button',{class:'brand',onclick:goHome,'aria-label':'Início'},S.brand&&S.brand.logo?h('img',{src:S.brand.logo,alt:''}):I('ballot'),h('b',{},bn)),
  S.admin&&S.auth==='in'?h('button',{class:'ico','aria-label':'Painel do organizador',title:'Painel do organizador',onclick:function(){openPanel();}},I('gear')):'',
  h('button',{class:'ico','aria-label':dk?'Usar tema claro':'Usar tema escuro',title:dk?'Tema claro':'Tema escuro',onclick:toggleTheme},I(dk?'sun':'moon')),
  h('button',{class:'ico','aria-label':'Aumentar o tamanho do texto',title:'Tamanho do texto',onclick:function(){S.zoom=((S.zoom||0)+1)%3;document.documentElement.style.zoom=['1','1.15','1.3'][S.zoom];render();}},I('text')),
  S.auth==='in'?h('button',{class:'ico','aria-label':'Sair da conta',title:'Sair',onclick:signOutFn},I('out')):''));
 app.replaceChildren(top,h('div',{class:'wrap'},S.fatal&&warn('Erro: '+S.fatal),b));}
function signIn(){signInWithPopup(auth,new GoogleAuthProvider()).catch(function(e){S.msg='Não foi possível entrar ('+errTxt(e)+').';render();});}
function signOutFn(){signOut(auth);}

function init(){
 db.doc('settings/site').onSnapshot(function(sn){S.brand=sn.exists?sn.data():null;applyBrand();render();},function(){});
 setTimeout(function(){if(S.auth==='in'&&!S.cfgLoaded){S.slow=true;render();}},10000);
 setTimeout(function(){if(S.auth==='load'){S.auth='out';S.msg='O login demorou para responder. Toque em Entrar com Google para continuar.';render();}},6000);
 if(FIREBASE.apiKey.indexOf('COLE')===0){S.auth='cfg';return render();}
 render();
 onAuthStateChanged(auth,async function(u){
  S.msg='';
  if(!u){S.auth='out';S.uid=null;S.ready=false;return render();}
  S.uid=u.uid;S.email=(u.email||'').toLowerCase();S.admin=S.email===ADMIN_EMAIL.toLowerCase();
  var ok=S.admin;
  if(!ok){try{ok=(await getDoc(doc(fdb,'allowed',S.email))).exists();}catch(e){ok=false;}}
  if(!ok){S.auth='denied';return render();}
  try{await setDoc(doc(fdb,'members',u.uid),{email:S.email,name:u.displayName||''});}catch(e){}
  S.auth='in';S.canWrite=true;S.ready=true;subList();render();
 });
}
init();
})();
