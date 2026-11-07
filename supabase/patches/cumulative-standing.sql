-- Running subject standings. Existing component comparisons remain unchanged.
alter table public.assessments drop constraint assessments_weight_percent_check;
alter table public.assessments add constraint assessments_weight_percent_check check(weight_percent>=0 and weight_percent<=100);
create or replace function private.my_cumulative_performance(p_subject_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 me public.subject_enrollments; scope_name text; item jsonb;
 comparisons jsonb:='[]'::jsonb;
begin
 if auth.uid() is null or private.my_student_id() is null then
  raise exception 'A confirmed, approved student account is required.' using errcode='42501';
 end if;
 select * into me from public.subject_enrollments
 where subject_id=p_subject_id and student_id=private.my_student_id();
 if me.id is null then raise exception 'You are not enrolled in this subject.' using errcode='42501'; end if;
 if not exists(select 1 from public.subjects s join public.terms t on t.id=s.term_id
  where s.id=p_subject_id and (t.term_number<3 or exists(select 1 from public.term_enrollment_status es
   where es.student_id=me.student_id and es.term_id=t.id and es.locked_at is not null))) then
  raise exception 'Lock your subject enrollment before viewing standings.' using errcode='42501';
 end if;
 foreach scope_name in array array['batch_subject','subject_group'] loop
  with eligible as materialized (
   select e.id from public.subject_enrollments e join public.students st on st.id=e.student_id
   join public.subjects s on s.id=e.subject_id join public.terms t on t.id=s.term_id
   where e.subject_id=p_subject_id and st.is_active and st.batch_id=t.batch_id
    and (scope_name='batch_subject' or e.subject_group_id=me.subject_group_id)
    and (t.term_number<3 or exists(select 1 from public.term_enrollment_status es
     where es.student_id=e.student_id and es.term_id=t.id and es.locked_at is not null))
  ), activated as materialized (
   select a.id,a.name,a.max_marks,a.weight_percent
   from public.assessments a join public.scores sc on sc.assessment_id=a.id
   join eligible e on e.id=sc.subject_enrollment_id
   where a.subject_id=p_subject_id and a.weight_percent>0
   group by a.id,a.name,a.max_marks,a.weight_percent
   having count(distinct e.id)>=5
  ), component_set as (
   select count(*) component_count,coalesce(sum(weight_percent),0) total_weight,
    coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'weight_percent',weight_percent) order by name),'[]'::jsonb) components
   from activated
  ), totals as materialized (
   select e.id,sum(sc.marks/a.max_marks*a.weight_percent) weighted_score
   from eligible e cross join activated a
   left join public.scores sc on sc.subject_enrollment_id=e.id and sc.assessment_id=a.id
   group by e.id having count(sc.id)=(select component_count from component_set)
  ), mine as (
   select weighted_score from totals where id=me.id
  ), statistics as (
   select count(*) participants,avg(weighted_score) average_value,
    min(weighted_score) minimum_value,max(weighted_score) maximum_value,
    percentile_cont(0.5) within group(order by weighted_score) median_value,
    1+count(*) filter(where weighted_score>(select weighted_score from mine)) rank_value,
    count(*) filter(where weighted_score=(select weighted_score from mine)) tied_value
   from totals
  ), state as (
   select cs.*,st.*, (select weighted_score from mine) own_score,
    case when scope_name='subject_group' and me.subject_group_id is null then 'group_not_assigned'
     when cs.component_count=0 then 'no_active_components'
     when not exists(select 1 from mine) then 'missing_scores'
     when st.participants<5 then 'insufficient_submissions' else 'available' end status
   from component_set cs cross join statistics st
  )
  select jsonb_build_object(
   'scope',scope_name,'status',status,
   'eligible_students',(select count(*) from eligible),'submitted_students',participants,
   'included_assessments',components,'total_weight',total_weight,
   'missing_assessments',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'name',a.name) order by a.name)
    from activated a where not exists(select 1 from public.scores sc
     where sc.subject_enrollment_id=me.id and sc.assessment_id=a.id)),'[]'::jsonb),
   'own_score',own_score,
   'rank',case when status='available' then rank_value end,
   'tie_count',case when status='available' then tied_value end,
   'average_score',case when status='available' then average_value end,
   'median_score',case when status='available' then median_value end,
   'minimum_score',case when status='available' then minimum_value end,
   'maximum_score',case when status='available' then maximum_value end,
   'distribution',case when status='available' then (
    select jsonb_agg(jsonb_build_object('lower_percent',b*20,'upper_percent',(b+1)*20,
     'students',(select count(*) from totals t where least(4,floor(t.weighted_score/total_weight*5))=b)) order by b)
    from generate_series(0,4) b) end
  ) into item from state;
  comparisons:=comparisons||jsonb_build_array(item);
 end loop;
 return jsonb_build_object('subject_id',p_subject_id,'minimum_participants',5,'activation_threshold',5,
  'comparisons',comparisons);
end $$;
revoke all on function private.my_cumulative_performance(uuid) from public,anon;
grant execute on function private.my_cumulative_performance(uuid) to authenticated;
create or replace function public.get_my_cumulative_performance(p_subject_id uuid)
returns jsonb language sql stable set search_path='' as $$
 select private.my_cumulative_performance(p_subject_id)
$$;
revoke all on function public.get_my_cumulative_performance(uuid) from public,anon;
grant execute on function public.get_my_cumulative_performance(uuid) to authenticated;
