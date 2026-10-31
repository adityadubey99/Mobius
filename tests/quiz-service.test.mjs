import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseMarks,quizService} from '../src/quiz-service.js';
const model={enrollment:{id:'own-enrollment'},subject:{id:'or'},assessment:{id:'quiz1',max_marks:15}};
test('accepts zero, maximum and fractional raw marks',()=>{for(const x of [0,15,8,7.5,0.25])assert.equal(parseMarks(String(x),15),x);});
test('rejects blank, negative, excessive, nonfinite and overprecise marks',()=>{for(const x of ['',null,undefined,' ', -1,15.01,'NaN','Infinity','hello',1.234])assert.throws(()=>parseMarks(x,15));});
test('saves only own enrollment + assessment, and uses unique conflict key for repeat submissions',async()=>{const calls=[];const client={from:table=>({upsert:(value,options)=>{calls.push({table,value,options});return{select:()=>({single:async()=>({data:{marks:value.marks}})})};}})};const api=quizService(client);await api.save(model,'8');await api.save(model,'9');assert.equal(calls.length,2);assert.deepEqual(calls[1],{table:'scores',value:{subject_enrollment_id:'own-enrollment',assessment_id:'quiz1',marks:9},options:{onConflict:'subject_enrollment_id,assessment_id'}});});
test('invalid input and expired deadline never call the database',async()=>{const api=quizService({from:()=>{throw Error('database should not be called');}});await assert.rejects(api.save(model,''),/Enter/);await assert.rejects(api.save({...model,assessment:{...model.assessment,submission_deadline:'2000-01-01'}},'8'),/deadline/);});
test('database failure is surfaced, never reported as success',async()=>{const api=quizService({from:()=>({upsert:()=>({select:()=>({single:async()=>({error:Error('Permission denied')})})})})});await assert.rejects(api.save(model,'8'),/Permission denied/);});
test('comparison requests scope to this subject and quiz',async()=>{let args;const api=quizService({rpc:async(...a)=>{args=a;return{data:{comparisons:[]}};}});await api.performance(model);assert.deepEqual(args,['get_my_performance',{p_subject_id:'or',p_assessment_id:'quiz1'}]);});
test('missing configuration and signed-out sessions cannot load live scores',async()=>{await assert.rejects(quizService(null).load(),/setup/);await assert.rejects(quizService({auth:{getUser:async()=>({data:{user:null}})}}).load(),/Sign in/);});
function loadClient(overrides={}){
 const records={students:{id:'student',batch_id:'batch'},terms:{id:'term'},subjects:{id:'subject'},subject_enrollments:{id:'enrollment'},assessments:{id:'assessment'},scores:{marks:0},...overrides};
 const filters=[];const client={auth:{getUser:async()=>({data:{user:{id:'authenticated-user'}}})},from(table){const q={select(){return this;},eq(key,value){filters.push([table,key,value]);return this;},async single(){return{data:records[table]};},async maybeSingle(){return{data:records[table]};}};return q;}};
 return{client,filters};
}
test('load resolves authenticated student, batch, Term 2, OR and Quiz 1 before own saved score',async()=>{
 const{client,filters}=loadClient();const result=await quizService(client).load();assert.equal(result.score.marks,0);
 assert.deepEqual(filters,[['students','auth_user_id','authenticated-user'],['terms','batch_id','batch'],['terms','term_number',2],['subjects','term_id','term'],['subjects','code','OR'],['subject_enrollments','student_id','student'],['subject_enrollments','subject_id','subject'],['assessments','subject_id','subject'],['assessments','comparison_key','quiz_1'],['scores','subject_enrollment_id','enrollment'],['scores','assessment_id','assessment']]);
});
test('new score stays blank, and missing term, subject or enrollment stops loading',async()=>{
 assert.equal((await quizService(loadClient({scores:null}).client).load()).score,null);
 for(const[table,message]of[['terms',/Term 2/],['subjects',/Operations Research/],['subject_enrollments',/not enrolled/]])await assert.rejects(quizService(loadClient({[table]:null}).client).load(),message);
});
