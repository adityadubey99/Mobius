export const OVERALL_SUBJECT='overall_subject';
export function parseMarks(value,max){
 if(value===null||value===undefined||String(value).trim()==='')throw Error('Enter your marks; leave unsubmitted scores blank.');
 const marks=Number(value);
 if(!Number.isFinite(marks)||marks<0||marks>Number(max))throw Error(`Enter marks between 0 and ${max}.`);
 if(Math.abs(marks*100-Math.round(marks*100))>1e-7)throw Error('Use at most two decimal places.');
 return marks;
}
export const selectionFor=model=>({termId:model.term.id,subjectId:model.subject.id,assessmentId:model.assessment.id});
export function quizService(client){
 const check=r=>{if(r.error)throw r.error;return r.data;};
 const api={
  async catalog(){
   if(!client)throw Error('Student login is awaiting setup.');
   const {user}=check(await client.auth.getUser());if(!user)throw Error('Sign in to submit your marks.');
   const profile=check(await client.from('students').select('id,full_name,batch_id,section').eq('auth_user_id',user.id).single());
   const terms=check(await client.from('terms').select('id,name,term_number').eq('batch_id',profile.batch_id).order('term_number'));
   const enrollments=check(await client.from('subject_enrollments').select('id,subject_id,subject_group_id').eq('student_id',profile.id));
   if(!terms.length||!enrollments.length)throw Error('No enrolled subjects are available. Open Profile & Subjects or contact your admin.');
   const groupIds=[...new Set(enrollments.map(e=>e.subject_group_id).filter(Boolean))];
   const groups=groupIds.length?check(await client.from('subject_groups').select('id,name,subject_id').in('id',groupIds)):[];
   const offered=check(await client.from('subjects').select('id,term_id,name,code').in('term_id',terms.map(t=>t.id)).order('name'));
   const subjects=offered.filter(s=>enrollments.some(e=>e.subject_id===s.id));
   const assessments=subjects.length?check(await client.from('assessments').select('id,subject_id,name,comparison_key,max_marks,weight_percent,submission_deadline').in('subject_id',subjects.map(s=>s.id)).order('name')):[];
   if(!assessments.length)throw Error('Your admin has not published assessments for your enrolled subjects yet.');
   return {profile,terms,subjects,enrollments,assessments,groups};
  },
  async load(selection={},catalog,{allowOverall=false}={}){
   catalog ||= await api.catalog();
   const {profile,terms,subjects,enrollments,assessments}=catalog;
   const availableSubjects=subjects.filter(s=>assessments.some(a=>a.subject_id===s.id));
   const term=selection.termId?terms.find(t=>t.id===selection.termId):terms.find(t=>t.term_number===2&&availableSubjects.some(s=>s.term_id===t.id))||terms.find(t=>availableSubjects.some(s=>s.term_id===t.id));
   if(!term)throw Error('This term is not available for your batch.');
   const choices=availableSubjects.filter(s=>s.term_id===term.id);
   const subject=selection.subjectId?choices.find(s=>s.id===selection.subjectId):choices.find(s=>s.code==='OR')||choices[0];
   if(!subject)throw Error('No published assessments are available for this enrolled subject or term.');
   const options=assessments.filter(a=>a.subject_id===subject.id);
   const cumulative=allowOverall&&selection.assessmentId===OVERALL_SUBJECT;
   const assessment=cumulative?{id:OVERALL_SUBJECT,name:'Overall subject'}:selection.assessmentId?options.find(a=>a.id===selection.assessmentId):options.find(a=>a.comparison_key==='quiz_1')||options[0];
   if(!assessment)throw Error('This assessment does not belong to the selected subject.');
   const enrollment=enrollments.find(e=>e.subject_id===subject.id);
   const score=cumulative?null:check(await client.from('scores').select('marks,updated_at').eq('subject_enrollment_id',enrollment.id).eq('assessment_id',assessment.id).maybeSingle());
   return {profile,term,subject,enrollment,group:catalog.groups?.find(g=>g.id===enrollment.subject_group_id),assessment,score,catalog,cumulative};
  },
  async save(model,value){
   if(model.cumulative||model.assessment.id===OVERALL_SUBJECT)throw Error('Enter marks for an individual assessment.');
   const marks=parseMarks(value,model.assessment.max_marks);
   if(model.assessment.submission_deadline&&new Date(model.assessment.submission_deadline)<new Date())throw Error('The score submission deadline has passed.');
   return check(await client.from('scores').upsert({subject_enrollment_id:model.enrollment.id,assessment_id:model.assessment.id,marks},{onConflict:'subject_enrollment_id,assessment_id'}).select('marks,updated_at').single());
  },
  async performance(model){if(model.cumulative)return check(await client.rpc('get_my_cumulative_performance',{p_subject_id:model.subject.id}));return check(await client.rpc('get_my_performance',{p_subject_id:model.subject.id,p_assessment_id:model.assessment.id}));}
 };
 return api;
}
