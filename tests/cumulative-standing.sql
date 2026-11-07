-- Run after cumulative-standing.sql within a transaction; always roll back.
create temporary table cumulative_test_subject as
with subject as (
 insert into public.subjects(term_id,code,name,is_elective)
 values('27cd4afb-7b45-4c5f-b8fc-f43cd0face35','TEST_CUMULATIVE','Cumulative test only',false) returning id
) select id from subject;
insert into public.subject_groups(subject_id,name)
select id,g from cumulative_test_subject cross join (values('C'),('D')) v(g);
create temporary table cumulative_test_students as
select id,row_number() over(order by (id='fa528d4e-d424-4e01-ab8c-7e9b59830af2') desc,id) idx
from public.students where batch_id='cea6fb3f-df5f-43f3-a736-a88adc48bec4' and is_active and section='C';
insert into public.subject_enrollments(student_id,subject_id,subject_group_id)
select st.id,s.id,g.id from cumulative_test_students st cross join cumulative_test_subject s
join public.subject_groups g on g.subject_id=s.id and g.name=case when st.idx<=47 then 'C' else 'D' end;
insert into public.assessments(subject_id,comparison_key,name,max_marks,weight_percent)
select s.id,v.key,v.name,v.maximum,v.weight from cumulative_test_subject s cross join (values
 ('quiz_1','Quiz 1',10,10),('quiz_2','Quiz 2',20,20),('zero_weight','Zero weight',10,0),('quiz_3','Quiz 3',10,10)
) v(key,name,maximum,weight);
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,case when st.idx in (2,3) then 9 else 8 end
from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='quiz_1'
where st.idx<=47;
-- Each assertion invokes the actual RPC; no replica of the calculation.
create function pg_temp.cumulative_assert(expected_weight numeric,expected_count int,expected_status text,expected_own numeric)
returns void language plpgsql as $$ declare result jsonb; c jsonb; begin
 select public.get_my_cumulative_performance((select id from cumulative_test_subject)) into result;
 select x into c from jsonb_array_elements(result->'comparisons') x where x->>'scope'='subject_group';
 if (c->>'total_weight')::numeric<>expected_weight or (c->>'submitted_students')::int<>expected_count
 or c->>'status'<>expected_status or (c->>'own_score')::numeric is distinct from expected_own then
 raise exception 'Unexpected cumulative result: %',c; end if;
 if expected_status<>'available' and (c->>'rank' is not null or c->>'average_score' is not null or c->>'distribution' is not null) then
 raise exception 'Comparison metrics exposed before complete-submission threshold'; end if;
end $$;
-- Anonymous / unapproved access is rejected.
do $$ begin begin perform public.get_my_cumulative_performance((select id from cumulative_test_subject));
 raise exception 'Anonymous call accepted'; exception when insufficient_privilege then null; end; end $$;
set local request.jwt.claim.sub='9823d453-8613-4c98-8d6f-e5b28fb7b4ce';
select pg_temp.cumulative_assert(10,47,'available',8);
-- Four distinct Quiz 2 submitters cannot activate it. Repeat saves count once.
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,16 from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='quiz_2'
where st.idx<=4;
update public.scores set marks=16 where assessment_id in(select a.id from public.assessments a join cumulative_test_subject s on s.id=a.subject_id where comparison_key='quiz_2');
select pg_temp.cumulative_assert(10,47,'available',8);
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,16 from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='quiz_2'
where st.idx between 48 and 52;
do $$ declare r jsonb; begin
 r:=public.get_my_cumulative_performance((select id from cumulative_test_subject));
 if (r->'comparisons'->0->>'total_weight')::numeric<>30 or (r->'comparisons'->1->>'total_weight')::numeric<>10 then
 raise exception 'Section activation leaked across groups'; end if;
end $$;
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,0 from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='quiz_2'
where st.idx=5;
select pg_temp.cumulative_assert(30,5,'available',24);
-- Twenty students complete both quizzes: rank denominator must be 20, not 47.
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,16 from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='quiz_2'
where st.idx between 6 and 20;
select pg_temp.cumulative_assert(30,20,'available',24);
do $$ declare c jsonb; begin
 select x into c from jsonb_array_elements(public.get_my_cumulative_performance((select id from cumulative_test_subject))->'comparisons') x where x->>'scope'='subject_group';
 if (c->>'rank')::int<>3 or (c->>'tie_count')::int<>17 or (c->>'maximum_score')::numeric<>25 then raise exception 'Competition rank/tie calculation failed: %',c; end if;
end $$;
-- Zero-weight components never affect totals or completeness.
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,10 from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='zero_weight'
where st.idx<=47;
select pg_temp.cumulative_assert(30,20,'available',24);
-- Five Quiz 3 submissions but only three intersect the complete Q1+Q2 set.
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,5 from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='quiz_3'
where st.idx in(1,2,3,21,22);
select pg_temp.cumulative_assert(40,3,'insufficient_submissions',29);
-- A student missing an activated assessment gets no cumulative peer metrics.
delete from public.scores where subject_enrollment_id=(select e.id from public.subject_enrollments e join cumulative_test_subject s on s.id=e.subject_id where e.student_id='fa528d4e-d424-4e01-ab8c-7e9b59830af2')
and assessment_id in(select a.id from public.assessments a join cumulative_test_subject s on s.id=a.subject_id where comparison_key='quiz_2');
select pg_temp.cumulative_assert(40,2,'missing_scores',null);
-- Other groups' five scores activate only that group and the whole-subject set.
insert into public.scores(subject_enrollment_id,assessment_id,marks)
select e.id,a.id,5 from cumulative_test_students st join public.subject_enrollments e on e.student_id=st.id
join cumulative_test_subject s on s.id=e.subject_id join public.assessments a on a.subject_id=s.id and a.comparison_key='quiz_3'
where st.idx between 48 and 52;
-- No active components in a completely empty subject.
insert into public.subjects(term_id,code,name) values('27cd4afb-7b45-4c5f-b8fc-f43cd0face35','TEST_EMPTY','Empty test');
insert into public.subject_enrollments(student_id,subject_id,subject_group_id)
select 'fa528d4e-d424-4e01-ab8c-7e9b59830af2',id,null from public.subjects where code='TEST_EMPTY';
do $$ declare r jsonb; begin
 r:=public.get_my_cumulative_performance((select id from public.subjects where code='TEST_EMPTY'));
 if r->'comparisons'->0->>'status'<>'no_active_components' or r->'comparisons'->1->>'status'<>'group_not_assigned' then raise exception 'Empty state incorrect'; end if;
 begin perform public.get_my_cumulative_performance(gen_random_uuid());raise exception 'Unenrolled access accepted';exception when insufficient_privilege then null;end;
end $$;
grant select on cumulative_test_subject to authenticated;
set local role authenticated;
select public.get_my_cumulative_performance((select id from cumulative_test_subject));
reset role;
select 'PASS: 47→20 complete cohort, four/five threshold, distinct saves, weighted totals, zero, zero weight, ties, missing scores, privacy threshold, empty and unauthorized access' validation;
