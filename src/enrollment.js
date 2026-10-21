import { supabase } from './supabase.js';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const demoNames = ['Supply Chain Analytics','Digital Marketing','Corporate Finance','Operations Strategy','Business Analytics','Consumer Behaviour'];
function readDemo() { try { return JSON.parse(localStorage.getItem('mobius_demo_enrollments') || '{}'); } catch { return {}; } }
export async function mountEnrollment(root, { demo = false, notify = () => {} } = {}) {
 let profile, terms, cache = new Map(), request = 0, current, busy = false;
 const check = ({ data, error }) => { if (error) throw error; return data; };
 root.innerHTML = '<p role="status">Loading your academic profile…</p>';
 try {
  if (demo) {
   profile = { full_name:'Demo Student',roll_number:'DEMO-2026',section:'A' };
   terms = Array.from({length:6},(_,i)=>({id:`demo-${i+3}`,term_number:i+3,name:`Term ${i+3}`}));
  } else {
   if (!supabase) throw Error('Student login has not been connected yet.');
   profile = check(await supabase.from('students').select('id,full_name,roll_number,college_email,section,batch_id').single());
   check(await supabase.rpc('sync_my_core_enrollments'));
   terms = check(await supabase.from('terms').select('id,term_number,name').eq('batch_id',profile.batch_id).gte('term_number',3).lte('term_number',8).order('term_number'));
  }
 } catch(e) { root.innerHTML=`<div class="enrollment-empty" role="alert">${escapeHtml(e.message)}</div>`; return; }
 root.innerHTML = `<div class="profile-summary"><div class="profile-avatar">${escapeHtml(profile.full_name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</div><div><span class="eyebrow">STUDENT PROFILE</span><h2>${escapeHtml(profile.full_name)}</h2><p>${escapeHtml(profile.roll_number)} · Home section ${escapeHtml(profile.section || 'pending')}</p></div><span class="status-pill">${demo?'Demo profile':'Verified student'}</span></div>
 ${demo?'<div class="enrollment-notice">Demo mode · Example subjects only. Changes are saved in this browser, and demo locks are not database security.</div>':''}
 <section class="panel enrollment-panel"><div class="panel-head"><div><h3>Your subjects & sections</h3><p>Choose what you study. Confirm once for each term.</p></div><div class="field term-picker"><label for="enrollmentTerm">Select term</label><select id="enrollmentTerm" class="form-select">${Array.from({length:6},(_,i)=>{const n=i+3,t=terms.find(t=>t.term_number===n);return `<option value="${escapeHtml(t?.id||'')}" ${t?'':'disabled'}>Term ${n}${t?'':' · Not offered yet'}</option>`;}).join('')}</select></div></div><div id="enrollmentBody"></div></section>
 <div class="core-note"><strong>Terms 1 & 2</strong><span>All subjects use your registered home section: <strong>${escapeHtml(profile.section || 'Awaiting admin assignment')}</strong>. These assignments are managed by the admin.</span></div>`;
 const body = root.querySelector('#enrollmentBody'), picker=root.querySelector('#enrollmentTerm');
 const showError = message => { const el=body.querySelector('#enrollmentError'); if(el){el.textContent=message;el.focus();} else body.textContent=message; };
 async function load(id) {
  const ticket=++request; current=id;
  if(!id){body.innerHTML='<div class="enrollment-empty">Your admin has not published any subjects for Terms 3–8 yet.</div>';return;}
  if(cache.has(id)){paint(cache.get(id));return;}
  body.innerHTML='<p class="enrollment-empty" role="status">Loading subjects…</p>';
  try {
   let model;
   if(demo){const saved=readDemo()[id]; const n=terms.find(t=>t.id===id).term_number;
    const offered=demoNames.map((name,i)=>({id:`${id}-${i}`,name,code:`DEMO-${n}0${i+1}`,is_elective:true}));
    model={offered,groups:offered.flatMap(s=>['1','2','3'].map(x=>({id:`${s.id}-g${x}`,subject_id:s.id,name:`Group ${x}`}))),selected:new Map(saved?.choices?.map(x=>[x.subject_id,x.subject_group_id])||[]),lockedAt:saved?.locked_at,dirty:false};
   } else {
    const offered=check(await supabase.from('subjects').select('id,name,code,is_elective').eq('term_id',id).order('name'));
    const groups=offered.length?check(await supabase.from('subject_groups').select('id,subject_id,name').in('subject_id',offered.map(s=>s.id))):[];
    const enrollment=offered.length?check(await supabase.from('subject_enrollments').select('subject_id,subject_group_id').in('subject_id',offered.map(s=>s.id))):[];
    const status=check(await supabase.from('term_enrollment_status').select('locked_at').eq('term_id',id).maybeSingle());
    model={offered,groups,selected:new Map(enrollment.map(e=>[e.subject_id,e.subject_group_id])),lockedAt:status?.locked_at,dirty:false};
   }
   cache.set(id,model); if(ticket===request)paint(model);
  } catch(e){if(ticket===request)body.innerHTML=`<div class="enrollment-empty" role="alert">${escapeHtml(e.message)} <button id="retryEnrollment" class="secondary-btn">Retry</button></div>`;body.querySelector('#retryEnrollment')?.addEventListener('click',()=>load(id));}
 }
 function paint(model) {
  const locked=!!model.lockedAt;
  body.innerHTML=`<div class="enrollment-status ${locked?'is-locked':''}"><span><strong>${locked?'Subjects locked':'Enrollment draft'}</strong><small>${locked?'Only an admin can change your subjects or sections.':'You can edit your choices until you lock this term.'}</small></span><span id="selectedCount">${model.selected.size} selected</span></div>
  ${!model.offered.length?'<div class="enrollment-empty">No subjects published for this term yet. Please check back after your admin adds them.</div>':`<form id="enrollmentForm"><div class="enrollment-table"><div class="enrollment-head"><span>Subject</span><span>Your section</span></div>${model.offered.map(s=>{const chosen=model.selected.has(s.id),groups=model.groups.filter(g=>g.subject_id===s.id),group=groups.find(g=>g.id===model.selected.get(s.id));return `<div class="enrollment-row ${chosen?'is-selected':''}" data-subject="${s.id}"><label class="enrollment-subject"><input type="checkbox" data-choice="${s.id}" ${chosen?'checked':''} ${locked||!groups.length?'disabled':''}><span><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.code)} · ${s.is_elective?'Elective':'Core'}</small>${!groups.length?'<small>Sections awaiting admin setup</small>':''}</span></label><div class="section-field"><input type="text" list="sections-${s.id}" data-section="${s.id}" value="${escapeHtml(group?.name||'')}" placeholder="Choose section" aria-label="Section for ${escapeHtml(s.name)}" autocomplete="off" ${locked||!chosen?'disabled':''}><datalist id="sections-${s.id}">${groups.map(g=>`<option value="${escapeHtml(g.name)}"></option>`).join('')}</datalist></div></div>`;}).join('')}</div>
  <p id="enrollmentError" class="form-error" role="alert" tabindex="-1"></p><div class="enrollment-footer"><p>${locked?`Confirmed ${escapeHtml(new Date(model.lockedAt).toLocaleDateString('en-IN'))}`:'Check every section carefully. Locking applies to this term only.'}</p>${locked?'<span class="locked-badge">Locked · Contact admin for changes</span>':'<div class="enrollment-actions"><button class="secondary-btn" id="saveEnrollment" type="button">Save draft</button><button class="primary-btn" id="reviewEnrollment" type="button">Lock subjects →</button></div>'}</div></form>`}`;
  if(locked)return;
  body.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('change',()=>{
   if(el.checked)model.selected.set(el.dataset.choice,null);else model.selected.delete(el.dataset.choice);
   model.dirty=true;paint(model);
  }));
  body.querySelectorAll('[data-section]').forEach(el=>el.addEventListener('input',()=>{
   const group=model.groups.find(g=>g.subject_id===el.dataset.section&&g.name.toLowerCase()===el.value.trim().toLowerCase());
   model.selected.set(el.dataset.section,group?.id||null);model.dirty=true;
  }));
  body.querySelector('#saveEnrollment')?.addEventListener('click',()=>save(model,false));
  body.querySelector('#reviewEnrollment')?.addEventListener('click',()=>{
   if(!valid(model,true))return;
   const dialog=document.createElement('dialog');dialog.className='lock-dialog';
   dialog.innerHTML=`<h2>Lock ${escapeHtml(terms.find(t=>t.id===current)?.name||'this term')}?</h2><p>Confirm your ${model.selected.size} subjects and sections. After locking, only an admin can make corrections.</p><ul>${[...model.selected].map(([sid,gid])=>`<li>${escapeHtml(model.offered.find(s=>s.id===sid)?.name)} <strong>${escapeHtml(model.groups.find(g=>g.id===gid)?.name)}</strong></li>`).join('')}</ul><div class="enrollment-actions"><button class="secondary-btn" id="cancelLock">Review again</button><button class="primary-btn" id="confirmLock">Confirm & lock</button></div>`;
   document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.querySelector('#cancelLock').onclick=()=>dialog.close();dialog.querySelector('#confirmLock').onclick=()=>{dialog.close();save(model,true);};dialog.showModal();
  });
 }
 function valid(model,lock){
  if(lock&&!model.selected.size){showError('Select at least one subject.');return false;}
  if([...model.selected.values()].some(v=>!v)){showError('Choose a configured section for every selected subject.');return false;}return true;
 }
 async function save(model,lock){
  if(busy||!valid(model,lock))return;busy=true;picker.disabled=true;body.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  const id=current,choices=[...model.selected].map(([subject_id,subject_group_id])=>({subject_id,subject_group_id}));
  try {
   let result;
   if(demo){result={locked_at:lock?new Date().toISOString():null};const saved=readDemo();saved[id]={choices,...result};localStorage.setItem('mobius_demo_enrollments',JSON.stringify(saved));}
   else result=check(await supabase.rpc('save_my_term_enrollments',{p_term_id:id,p_choices:choices,p_lock:lock}));
   model.lockedAt=result.locked_at;model.dirty=false;paint(model);notify(lock?'Your subjects and sections are locked.':'Enrollment draft saved.');
  }catch(e){if(e.message?.includes('locked')){cache.delete(id);await load(id);}else paint(model);showError(e.message);}
  finally{busy=false;picker.disabled=false;}
 }
 picker.addEventListener('change',()=>load(picker.value));
 // Local draft edits survive term switches in this page; Save draft persists them.
 await load(terms[0]?.id||'');
}
