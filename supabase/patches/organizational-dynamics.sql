-- Idempotent record of the approved live Term 2 setup. Does not import scores.
begin;
-- Fail rather than attach assessments to an unintended subject/batch.
do $$ begin
 if not exists(select 1 from public.subjects s join public.terms t on t.id=s.term_id
 where s.id='20bea59e-3193-4399-b3dc-f0751fab77dd' and s.code='OB102'
 and t.id='27cd4afb-7b45-4c5f-b8fc-f43cd0face35' and t.term_number=2
 and t.batch_id='cea6fb3f-df5f-43f3-a736-a88adc48bec4') then
 raise exception 'Expected Organizational Dynamics Term 2 subject is missing';
 end if;
end $$;
select id from public.subjects where id='20bea59e-3193-4399-b3dc-f0751fab77dd' for update;
insert into public.assessments(subject_id,comparison_key,name,max_marks,weight_percent)
select '20bea59e-3193-4399-b3dc-f0751fab77dd',v.key,v.name,v.maximum,v.weight
from (values
 ('class_participation','Class participation',25,25),
 ('quiz_1','Quiz 1',10,5),('quiz_2','Quiz 2',10,5),
 ('quiz_3','Quiz 3',10,5),('quiz_4','Quiz 4',10,5),
 ('midterm_group_project','Mid Term Group Project',15,15),
 ('group_project_presentation','Group Project Presentation',10,10),
 ('endterm','End Term',30,30)
) as v(key,name,maximum,weight)
where not exists(select 1 from public.assessments a
 where a.subject_id='20bea59e-3193-4399-b3dc-f0751fab77dd' and a.comparison_key=v.key);
insert into public.subject_groups(subject_id,name)
values ('20bea59e-3193-4399-b3dc-f0751fab77dd','C') on conflict(subject_id,name) do nothing;
insert into public.subject_enrollments(student_id,subject_id,subject_group_id)
select s.id,g.subject_id,g.id from public.students s join public.subject_groups g
 on g.subject_id='20bea59e-3193-4399-b3dc-f0751fab77dd' and g.name=s.section
where s.batch_id='cea6fb3f-df5f-43f3-a736-a88adc48bec4' and s.section='C' and s.is_active
on conflict(student_id,subject_id) do nothing;
commit;
