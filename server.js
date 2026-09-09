import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import {fileURLToPath} from 'url';
import analyzeRouter from './routes/analyze.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const port=Number(process.env.PORT||3000);
app.disable('x-powered-by');
app.use(cors({origin:process.env.CLIENT_ORIGIN||true}));
app.use(express.json({limit:'100kb'}));
app.use('/api/analyze-writing',rateLimit({windowMs:60_000,max:10,standardHeaders:true,legacyHeaders:false}),analyzeRouter);
app.use(express.static(path.join(__dirname,'../client')));
app.get('/api/health',(req,res)=>res.json({ok:true,aiConfigured:Boolean(process.env.AI_API_KEY)}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../client/index.html')));
app.listen(port,()=>console.log(`WriteDIM running at http://localhost:${port}`));
