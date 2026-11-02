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
 const records={
 students:[{id:'student',auth_user_id:'authenticated-user',batch_id:'batch'}],
 terms:[{id:'term',batch_id:'batch',term_number:2,name:'Term 2'}],
 subjects:[{id:'or',term_id:'term',code:'OR',name:'Operations Research'},{id:'od',term_id:'term',code:'OB102',name:'Organizational Dynamics'},{id:'foreign',term_id:'other-term',code:'OTHER'}],
 subject_enrollments:[{id:'own-enrollment',student_id:'student',subject_id:'or'},{id:'od-enrollment',student_id:'student',subject_id:'od'},{id:'someone-else',student_id:'other',subject_id:'foreign'}],
 assessments:[{id:'quiz1',subject_id:'or',comparison_key:'quiz_1',max_marks:15},{id:'od-quiz1',subject_id:'od',comparison_key:'quiz_1',max_marks:10},{id:'od-cp',subject_id:'od',comparison_key:'class_participation',max_marks:25}],
 scores:[{subject_enrollment_id:'own-enrollment',assessment_id:'quiz1',marks:0}],...overrides};
 const filters=[];
 const client={auth:{getUser:async()=>({data:{user:{id:'authenticated-user'}}})},from(table){
  let rows=records[table];const q={select(){return this;},order(){return this;},eq(key,value){filters.push([table,key,value]);rows=rows.filter(r=>r[key]===value);return this;},in(key,values){rows=rows.filter(r=>values.includes(r[key]));return this;},then(resolve){return Promise.resolve({data:rows}).then(resolve);},async single(){return{data:rows[0]};},async maybeSingle(){return{data:rows[0]||null};}};return q;
 }};return{client,filters};
}
test('default stays Term 2 OR Quiz 1 and preserves a saved zero',async()=>{
 const {client,filters}=loadClient();const result=await quizService(client).load();assert.equal(result.score.marks,0);assert.equal(result.subject.id,'or');assert.equal(result.assessment.id,'quiz1');
 assert.ok(filters.some(f=>f[0]==='students'&&f[1]==='auth_user_id'&&f[2]==='authenticated-user'));
 assert.ok(filters.some(f=>f[0]==='subject_enrollments'&&f[1]==='student_id'&&f[2]==='student'));
 assert.equal(result.catalog.subjects.some(s=>s.id==='foreign'),false);
});
test('OD selections use its own enrollment, assessment and raw maximum',async()=>{
 const api=quizService(loadClient().client);const result=await api.load({termId:'term',subjectId:'od'});assert.equal(result.enrollment.id,'od-enrollment');assert.equal(result.assessment.id,'od-quiz1');assert.equal(result.assessment.max_marks,10);assert.equal(result.score,null);
 assert.equal((await api.load({termId:'term',subjectId:'od',assessmentId:'od-cp'})).assessment.max_marks,25);
 await assert.rejects(api.save(result,'11'),/between 0 and 10/);
});
test('cross-subject assessments and subjects outside own batch or enrollment are rejected',async()=>{
 const api=quizService(loadClient().client);
 for(const selection of [{termId:'other-term'},{subjectId:'foreign'},{subjectId:'or',assessmentId:'od-quiz1'},{subjectId:'od',assessmentId:'missing'}])await assert.rejects(api.load(selection));
});
test('no enrollment or no published assessments produces a useful empty-state error',async()=>{
 await assert.rejects(quizService(loadClient({subject_enrollments:[]}).client).load(),/No enrolled/);
 await assert.rejects(quizService(loadClient({assessments:[]}).client).load(),/not published assessments/);
});
