import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import crypto from 'node:crypto';
const app=express(),server=createServer(app),io=new Server(server);app.use(express.static('public'));
const rooms=new Map();const id=()=>crypto.randomBytes(3).toString('hex').toUpperCase();
const safe=(r)=>({code:r.code,phase:r.phase,round:r.round,players:r.players.map(p=>({id:p.id,name:p.name,gems:p.gems,ready:!!p.move,online:p.online})),log:r.log,winner:r.winner});
function emit(r){io.to(r.code).emit('state',safe(r))}
function resolve(r){const moves=r.players.map(p=>({p,move:p.move}));const log=[];for(const {p,move} of moves){if(move==='mine'){p.gems+=2;log.push(`${p.name} mined 2 gems 💎`)}else if(move==='guard'){log.push(`${p.name} guarded 🛡️`)}}
for(const {p,move} of moves){if(move!=='swipe')continue;const targets=moves.filter(x=>x.p.id!==p.id&&x.move==='mine');if(targets.length){const t=targets[Math.floor(Math.random()*targets.length)].p;t.gems=Math.max(0,t.gems-1);p.gems++;log.push(`${p.name} swiped a gem from ${t.name} 🥷`)}else{const guards=moves.filter(x=>x.p.id!==p.id&&x.move==='guard');if(guards.length){const t=guards[Math.floor(Math.random()*guards.length)].p;t.gems++;log.push(`${p.name} tried swiping, but ${t.name} blocked and gained a gem!`)}else log.push(`${p.name} swiped at empty air!`)}}
for(const p of r.players)p.move=null;r.log=log;r.winner=[...r.players].sort((a,b)=>b.gems-a.gems).find(p=>p.gems>=10)?.name||null;r.phase=r.winner?'finished':'reveal';emit(r)}
io.on('connection',s=>{let room=null;function join(r,name){if(r.phase!=='lobby')return s.emit('errorMessage','Game already started.');if(r.players.length>=8)return s.emit('errorMessage','Room full.');const p={id:s.id,name:String(name||'Player').trim().slice(0,18)||'Player',gems:0,move:null,online:true};r.players.push(p);room=r;s.join(r.code);s.emit('joined',{id:s.id,code:r.code});emit(r)}
s.on('create',({name}={})=>{const code=id();const r={code,phase:'lobby',round:1,players:[],log:[],winner:null};rooms.set(code,r);join(r,name)});
s.on('join',({code,name}={})=>{const r=rooms.get(String(code||'').toUpperCase().trim());if(!r)return s.emit('errorMessage','Room not found.');join(r,name)});
s.on('start',()=>{if(!room||room.players[0]?.id!==s.id||room.phase!=='lobby')return;if(room.players.length<2)return s.emit('errorMessage','At least two players required.');room.phase='playing';emit(room)});
s.on('move',move=>{if(!room||room.phase!=='playing'||!['mine','swipe','guard'].includes(move))return;const p=room.players.find(p=>p.id===s.id);if(!p||p.move)return;p.move=move;emit(room);if(room.players.every(p=>p.move))resolve(room)});
s.on('next',()=>{if(!room||room.phase!=='reveal'||room.players[0]?.id!==s.id)return;room.round++;room.phase='playing';room.log=[];emit(room)});
s.on('restart',()=>{if(!room||room.phase!=='finished'||room.players[0]?.id!==s.id)return;room.round=1;room.phase='playing';room.winner=null;room.log=[];for(const p of room.players){p.gems=0;p.move=null}emit(room)});
s.on('disconnect',()=>{if(!room)return;room.players=room.players.filter(p=>p.id!==s.id);if(!room.players.length){rooms.delete(room.code);return}if(room.phase==='playing'&&room.players.every(p=>p.move))resolve(room);else if(room.players.length<2&&room.phase==='playing'){room.phase='lobby';room.round=1;for(const p of room.players){p.move=null;p.gems=0}}emit(room)})});
server.listen(process.env.PORT||3000,()=>console.log('Gem Jinx running'));
