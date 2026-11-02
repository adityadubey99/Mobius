import {escapeHtml as esc} from './enrollment.js';
export function assessmentPicker(model){
 const {terms,subjects,assessments}=model.catalog;
 const available=subjects.filter(s=>assessments.some(a=>a.subject_id===s.id));
 const options=(rows,id)=>rows.map(r=>`<option value="${esc(r.id)}" ${r.id===id?'selected':''}>${esc(r.name)}</option>`).join('');
 return `<div class="assessment-pickers">${[
 ['Term','termId',terms.filter(t=>available.some(s=>s.term_id===t.id)),model.term.id],
 ['Subject','subjectId',available.filter(s=>s.term_id===model.term.id),model.subject.id],
 ['Assessment','assessmentId',assessments.filter(a=>a.subject_id===model.subject.id),model.assessment.id]
 ].map(([label,key,rows,id])=>`<label class="assessment-picker"><span>${label}</span><select class="form-select" aria-label="${label}" data-assessment-picker="${key}">${options(rows,id)}</select></label>`).join('')}</div>`;
}
export function bindAssessmentPicker(root,model,onChange){
 root.querySelectorAll('[data-assessment-picker]').forEach(el=>el.onchange=()=>{
  const key=el.dataset.assessmentPicker;
  onChange(key==='termId'?{termId:el.value}:key==='subjectId'?{termId:model.term.id,subjectId:el.value}:{termId:model.term.id,subjectId:model.subject.id,assessmentId:el.value});
 });
}
