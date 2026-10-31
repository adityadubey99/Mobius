export function parseMarks(value,max){
 if(value===null||value===undefined||String(value).trim()==='')throw Error('Enter your marks; leave unsubmitted scores blank.');
 const marks=Number(value);
 if(!Number.isFinite(marks)||marks<0||marks>Number(max))throw Error(`Enter marks between 0 and ${max}.`);
 if(Math.abs(marks*100-Math.round(marks*100))>1e-7)throw Error('Use at most two decimal places.');
 return marks;
}
export function quizService(client){
 const check=r=>{if(r.error)throw r.error;return r.data;};
 return {
  async load(){
   if(!client)throw Error('Student login is awaiting setup.');
   const {user}=check(await client.auth.getUser());if(!user)throw Error('Sign in to submit your marks.');
   const profile=check(await client.from('students').select('id,full_name,batch_id,section').eq('auth_user_id',user.id).single());
   const term=check(await client.from('terms').select('id,name').eq('batch_id',profile.batch_id).eq('term_number',2).maybeSingle());
   if(!term)throw Error('Term 2 has not been published for your batch.');
   const subject=check(await client.from('subjects').select('id,name,code').eq('term_id',term.id).eq('code','OR').maybeSingle());
   if(!subject)throw Error('Operations Research has not been published for your batch.');
   const enrollment=check(await client.from('subject_enrollments').select('id,subject_group_id').eq('student_id',profile.id).eq('subject_id',subject.id).maybeSingle());
   if(!enrollment)throw Error('You are not enrolled in Operations Research. Contact an admin.');
   const assessment=check(await client.from('assessments').select('id,name,max_marks,weight_percent,submission_deadline').eq('subject_id',subject.id).eq('comparison_key','quiz_1').single());
   const score=check(await client.from('scores').select('marks,updated_at').eq('subject_enrollment_id',enrollment.id).eq('assessment_id',assessment.id).maybeSingle());
   return {profile,term,subject,enrollment,assessment,score};
  },
  async save(model,value){
   const marks=parseMarks(value,model.assessment.max_marks);
   if(model.assessment.submission_deadline&&new Date(model.assessment.submission_deadline)<new Date())throw Error('The score submission deadline has passed.');
   return check(await client.from('scores').upsert({subject_enrollment_id:model.enrollment.id,assessment_id:model.assessment.id,marks},{onConflict:'subject_enrollment_id,assessment_id'}).select('marks,updated_at').single());
  },
  async performance(model){return check(await client.rpc('get_my_performance',{p_subject_id:model.subject.id,p_assessment_id:model.assessment.id}));}
 };
}
