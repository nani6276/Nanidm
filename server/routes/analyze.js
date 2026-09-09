import express from 'express';
import { analyzeWithAI } from '../services/aiService.js';
const router=express.Router();
const MAX=Number(process.env.MAX_TEXT_CHARS||12000);
router.post('/', async (req,res)=>{
  try{
    const {topic,text}=req.body||{};
    if(typeof topic!=='string'||!topic.trim()) return res.status(400).json({error:'Mövzu tələb olunur.'});
    if(typeof text!=='string'||!text.trim()) return res.status(400).json({error:'Paragraph boş ola bilməz.'});
    if(text.length>MAX) return res.status(413).json({error:`Mətn ${MAX} simvoldan uzun ola bilməz.`});
    const result=await Promise.race([
      analyzeWithAI({topic:topic.trim(),text:text.trim()}),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('AI request timeout.')),45000))
    ]);
    res.json(result);
  }catch(err){
    console.error('analyze-writing:',err.message);
    const status=err.message.includes('API_KEY')?503:502;
    res.status(status).json({error:'AI yoxlaması hazırda mümkün olmadı.',detail:process.env.NODE_ENV==='development'?err.message:undefined});
  }
});
export default router;
