const express=require('express'); const fs=require('fs'); const path=require('path');
const app=express(); const PORT=process.env.PORT||3000; const DB=path.join(__dirname,'data.json');
app.use(express.json()); app.use(express.static(path.join(__dirname,'public')));
function read(){if(!fs.existsSync(DB)) fs.writeFileSync(DB,JSON.stringify({users:[],questions:[],answers:[]},null,2));return JSON.parse(fs.readFileSync(DB,'utf8'))}
function write(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}
app.get('/api/data',(req,res)=>res.json(read()));
app.post('/api/signup',(req,res)=>{let d=read(),{name,email}=req.body;if(!name||!email)return res.status(400).json({error:'name and email required'});if(d.users.some(u=>u.email===email))return res.status(409).json({error:'email exists'});let u={id:Date.now().toString(),name,email,points:0};d.users.push(u);write(d);res.json(u)});
app.post('/api/questions',(req,res)=>{let d=read(),{userId,text}=req.body;if(!userId||!text)return res.status(400).json({error:'missing data'});let q={id:Date.now().toString(),userId,text,likes:0,createdAt:new Date().toISOString()};d.questions.unshift(q);write(d);res.json(q)});
app.post('/api/questions/:id/like',(req,res)=>{let d=read(),q=d.questions.find(x=>x.id===req.params.id);if(!q)return res.sendStatus(404);q.likes++;write(d);res.json(q)});
app.post('/api/questions/:id/answers',(req,res)=>{let d=read(),{userId,text}=req.body;if(!userId||!text)return res.status(400).json({error:'missing data'});let a={id:Date.now().toString(),questionId:req.params.id,userId,text,createdAt:new Date().toISOString()};d.answers.push(a);write(d);res.json(a)});
app.listen(PORT,()=>console.log('SHALAW running on '+PORT));
