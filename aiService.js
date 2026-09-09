import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '../prompts/writingPrompt.js';

const schema = {
  type: 'object', additionalProperties: false,
  properties: {
    wordCount: {type:'integer', minimum:0},
    paragraphCount: {type:'integer', minimum:0},
    requirements: {type:'object', additionalProperties:false, properties:{
      minimumWordsMet:{type:'boolean'}, oneParagraph:{type:'boolean'},
      topicSentence:{type:'object',additionalProperties:false,properties:{present:{type:'boolean'},feedback:{type:'string'}},required:['present','feedback']},
      supportingIdeas:{type:'object',additionalProperties:false,properties:{count:{type:'integer',minimum:0},sufficient:{type:'boolean'},feedback:{type:'string'}},required:['count','sufficient','feedback']},
      reasonsFactsExamples:{type:'object',additionalProperties:false,properties:{count:{type:'integer',minimum:0},sufficient:{type:'boolean'},feedback:{type:'string'}},required:['count','sufficient','feedback']},
      bothSides:{type:'object',additionalProperties:false,properties:{present:{type:'boolean'},feedback:{type:'string'}},required:['present','feedback']},
      personalOpinion:{type:'object',additionalProperties:false,properties:{present:{type:'boolean'},feedback:{type:'string'}},required:['present','feedback']},
      conclusion:{type:'object',additionalProperties:false,properties:{present:{type:'boolean'},feedback:{type:'string'}},required:['present','feedback']},
      focusedOnTopic:{type:'object',additionalProperties:false,properties:{present:{type:'boolean'},feedback:{type:'string'}},required:['present','feedback']}
    },required:['minimumWordsMet','oneParagraph','topicSentence','supportingIdeas','reasonsFactsExamples','bothSides','personalOpinion','conclusion','focusedOnTopic']},
    linkingWords:{type:'array',items:{type:'object',additionalProperties:false,properties:{word:{type:'string'},category:{type:'string'},appropriate:{type:'boolean'}},required:['word','category','appropriate']}},
    grammarErrors:{type:'array',items:{type:'object',additionalProperties:false,properties:{original:{type:'string'},correction:{type:'string'},explanation:{type:'string'},severity:{type:'string',enum:['low','medium','high']}},required:['original','correction','explanation','severity']}},
    spellingErrors:{type:'array',items:{type:'object',additionalProperties:false,properties:{original:{type:'string'},correction:{type:'string'},explanation:{type:'string'}},required:['original','correction','explanation']}},
    punctuationErrors:{type:'array',items:{type:'object',additionalProperties:false,properties:{original:{type:'string'},correction:{type:'string'},explanation:{type:'string'}},required:['original','correction','explanation']}},
    vocabularyFeedback:{type:'array',items:{type:'object',additionalProperties:false,properties:{original:{type:'string'},suggestion:{type:'string'},explanation:{type:'string'}},required:['original','suggestion','explanation']}},
    coherenceFeedback:{type:'array',items:{type:'string'}}, strengths:{type:'array',items:{type:'string'}}, weaknesses:{type:'array',items:{type:'string'}}, recommendations:{type:'array',items:{type:'string'}},
    practiceScore:{type:'object',additionalProperties:false,properties:{total:{type:'integer',minimum:0,maximum:100},taskCompletion:{type:'integer',minimum:0,maximum:20},structure:{type:'integer',minimum:0,maximum:20},coherence:{type:'integer',minimum:0,maximum:20},grammar:{type:'integer',minimum:0,maximum:20},vocabulary:{type:'integer',minimum:0,maximum:10},mechanics:{type:'integer',minimum:0,maximum:10}},required:['total','taskCompletion','structure','coherence','grammar','vocabulary','mechanics']},
    overallFeedback:{type:'string'}
  },
  required:['wordCount','paragraphCount','requirements','linkingWords','grammarErrors','spellingErrors','punctuationErrors','vocabularyFeedback','coherenceFeedback','strengths','weaknesses','recommendations','practiceScore','overallFeedback']
};

function countWords(text){return text.trim()?text.trim().split(/\s+/).length:0;}
function countParagraphs(text){return text.trim()?text.trim().split(/(?:\r?\n){2,}|\r?\n/).filter(Boolean).length:0;}

export async function analyzeWithAI({topic,text}){
  if(process.env.AI_PROVIDER !== 'openai') throw new Error('Unsupported AI_PROVIDER. Set AI_PROVIDER=openai or add a provider implementation.');
  if(!process.env.AI_API_KEY) throw new Error('AI_API_KEY is not configured on the server.');
  const client = new OpenAI({apiKey:process.env.AI_API_KEY, ...(process.env.AI_BASE_URL ? {baseURL:process.env.AI_BASE_URL} : {})});
  const model = process.env.AI_MODEL || 'gpt-4.1-mini';
  const userPrompt = `TASK QUESTION:\n${topic}\n\nSTUDENT PARAGRAPH (analyze exactly this text; do not replace it):\n${text}`;
  const response = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format:{type:'json_schema',json_schema:{name:'writedim_analysis',strict:true,schema}},
    messages:[{role:'system',content:SYSTEM_PROMPT},{role:'user',content:userPrompt}],
    max_tokens:6000
  });
  const raw=response.choices?.[0]?.message?.content;
  if(!raw) throw new Error('AI returned an empty response.');
  let data; try {data=JSON.parse(raw);} catch {throw new Error('AI returned malformed JSON.');}
  data.wordCount=countWords(text); data.paragraphCount=countParagraphs(text);
  // Server-side consistency checks: total must equal component sum and component caps.
  const p=data.practiceScore;
  const sum=p.taskCompletion+p.structure+p.coherence+p.grammar+p.vocabulary+p.mechanics;
  p.total=Math.max(0,Math.min(100,sum));
  data.requirements.minimumWordsMet=data.wordCount>=100;
  data.requirements.oneParagraph=data.paragraphCount===1;
  return data;
}
