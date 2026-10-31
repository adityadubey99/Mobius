import {supabase} from './supabase.js';
import {escapeHtml} from './enrollment.js';
import {quizService} from './quiz-service.js';
export async function mountQuizEntry(root,{client=supabase}={}){
 const service=quizService(client);let model,busy=false;
 const esc=escapeHtml;
 root.innerHTML='<p role="status">Loading your Quiz 1 assessment…</p>';
 try{model=await service.load();if(!root.isConnected)return;}
 catch(e){root.innerHTML=`<section class="panel score-form"><h2>Quiz 1 score entry</h2><p role="alert">${esc(e.message)}</p><button type="button" class="secondary-btn" id="retryQuiz">Retry</button></section>`;root.querySelector('#retryQuiz').onclick=()=>mountQuizEntry(root,{client});return;}
 const a=model.assessment;
 root.innerHTML=`<section class="panel score-form quiz-entry"><span class="eyebrow">TERM 2 · OPERATIONS RESEARCH</span><h2>Enter your Quiz 1 marks</h2><p>${esc(model.profile.full_name)} · Home section ${esc(model.profile.section)}</p><div class="form-row quiz-metadata"><div class="field"><label>Term</label><p>${esc(model.term.name)}</p></div><div class="field"><label>Subject</label><p>${esc(model.subject.name)}</p></div><div class="field"><label>Assessment</label><p>${esc(a.name)}</p></div></div><form id="quizScoreForm"><div class="field"><label for="quizMarks">Your raw marks out of ${esc(a.max_marks)}</label><input class="form-select" id="quizMarks" type="number" min="0" max="${esc(a.max_marks)}" step="0.01" required inputmode="decimal" placeholder="Enter marks" value="${esc(model.score?.marks??'')}" aria-describedby="quizMarksHint"><small class="field-hint" id="quizMarksHint">Weightage: ${esc(a.weight_percent)}%. Enter the marks awarded, not a percentage. Zero is a valid score.</small></div><p id="quizError" class="form-error" role="alert"></p><p id="quizSaved" role="status">${model.score?'Your saved marks are shown above. You can correct them.':'You have not submitted marks for this quiz yet.'}</p><button class="primary-btn" id="saveQuiz" type="submit">${model.score?'Update marks':'Save marks'}</button></form><p class="field-hint">Only your own marks are visible. Comparisons unlock after you submit this quiz.</p></section><section class="panel score-form quiz-standing" aria-label="Quiz 1 comparisons"><h3>Your Quiz 1 standing</h3><div id="quizComparisons"></div></section>`;
 const input=root.querySelector('#quizMarks'),button=root.querySelector('#saveQuiz'),error=root.querySelector('#quizError'),status=root.querySelector('#quizSaved');
 input.addEventListener('input',()=>{error.textContent='';status.textContent='Unsaved changes. Save to update your marks.';});
 async function comparisons(){
  const body=root.querySelector('#quizComparisons');
  if(!model.score){body.textContent='Submit your marks to unlock this quiz’s comparisons.';return;}
  body.textContent='Loading comparisons…';
  try{const result=await service.performance(model);if(!root.isConnected)return;body.innerHTML=`<p>Based on submitted scores only. Missing marks are excluded.</p>${(result.comparisons||[]).map(c=>`<div class="quiz-comparison"><strong>${c.scope==='subject_group'?'Your subject section':'Across batch taking this subject'}</strong><p>${esc(c.submitted_students)} submitted / ${esc(c.eligible_students)} eligible</p>${c.status==='available'?`<p>${Number(c.tie_count)>1?'Joint rank':'Your rank'}: <strong>${esc(c.rank)}</strong> · Percentile: <strong>${esc(c.percentile)}</strong></p>`:`<p>${c.status==='group_not_assigned'?'Section assignment pending.':`Rank and percentile appear after at least ${esc(result.minimum_participants)} submissions.`}</p>`}</div>`).join('')}<p class="field-hint">Percentile is the percentage of submitted scores at or below yours. Equal marks share rank; subsequent ranks skip tied positions (1, 1, 3). Cross-section comparisons use raw scores.</p>`;}
  catch(e){body.textContent=`Your marks remain saved. Comparisons could not be loaded: ${e.message}`;const retry=document.createElement('button');retry.type='button';retry.className='secondary-btn';retry.textContent='Retry comparisons';retry.onclick=comparisons;body.append(retry);}
 }
 root.querySelector('form').onsubmit=async event=>{
  event.preventDefault();if(busy)return;busy=true;const value=input.value;button.disabled=true;input.disabled=true;error.textContent='';status.textContent='Saving…';
  try{model.score=await service.save(model,value);status.textContent=`Saved: ${model.score.marks} / ${a.max_marks}.`;button.textContent='Update marks';await comparisons();}
  catch(e){error.textContent=e.message;status.textContent='Changes were not saved. Please retry.';}
  finally{busy=false;button.disabled=false;input.disabled=false;}
 };
 await comparisons();
}
