-- Minimum and maximum stay behind the existing minimum-cohort threshold.
CREATE OR REPLACE FUNCTION private.my_performance(p_subject_id uuid, p_assessment_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.subject_enrollments; target public.assessments; result jsonb;
begin
 if auth.uid() is null or private.my_student_id() is null then
  raise exception 'A confirmed, approved student account is required.' using errcode='42501';
 end if;
 select * into me from public.subject_enrollments where subject_id=p_subject_id and student_id=private.my_student_id();
 if me.id is null then raise exception 'You are not enrolled in this subject.' using errcode='42501'; end if;
 if p_assessment_id is not null then
  select * into target from public.assessments where id=p_assessment_id and subject_id=p_subject_id;
  if target.id is null then raise exception 'Assessment unavailable.' using errcode='42501'; end if;
  if not exists(select 1 from public.scores where subject_enrollment_id=me.id and assessment_id=target.id) then
   raise exception 'Submit your score for this assessment first.' using errcode='42501';
  end if;
 else
  if not exists(select 1 from public.assessments a where a.subject_id=p_subject_id)
   or (select sum(a.weight_percent) from public.assessments a where a.subject_id=p_subject_id)<>100 then
   raise exception 'Subject assessment weights must total 100 percent before overall comparison.' using errcode='23514';
  end if;
  if exists(select 1 from public.assessments a where a.subject_id=p_subject_id
   and not exists(select 1 from public.scores sc where sc.subject_enrollment_id=me.id and sc.assessment_id=a.id)) then
   raise exception 'Submit all subject assessment scores first.' using errcode='42501';
  end if;
 end if;
 with totals as (
  select e.id,e.subject_group_id,
   case when p_assessment_id is null then sum(sc.marks/a.max_marks*a.weight_percent)
        else max(sc.marks/a.max_marks*100) end as percentage,
   count(a.id) expected,count(sc.id) submitted,sum(a.weight_percent) weight_total
  from public.subject_enrollments e join public.students st on st.id=e.student_id
  left join public.assessments a on a.subject_id=e.subject_id
   and (p_assessment_id is null or a.id=p_assessment_id)
  left join public.scores sc on sc.assessment_id=a.id and sc.subject_enrollment_id=e.id
  where e.subject_id=p_subject_id and st.is_active
   and exists(select 1 from public.subjects su join public.terms t on t.id=su.term_id
    where su.id=e.subject_id and (t.term_number<3 or exists(
      select 1 from public.term_enrollment_status es where es.student_id=e.student_id
      and es.term_id=t.id and es.locked_at is not null)))
  group by e.id,e.subject_group_id
 ), complete as (
  select * from totals where expected>0 and expected=submitted
   and (p_assessment_id is not null or weight_total=100)
 ), mine as(select percentage from complete where id=me.id),
 scopes as (
  select 'batch_subject'::text scope,count(*) eligible from totals
  union all select 'subject_group',count(*) from totals where subject_group_id=me.subject_group_id
 ), stats as (
  select sp.scope,sp.eligible,
   count(c.id) participants,
   avg(c.percentage) average_value,
   min(c.percentage) minimum_value,
   max(c.percentage) maximum_value,
   percentile_cont(0.5) within group(order by c.percentage) median_value,
   count(c.id) filter(where c.percentage=m.percentage) tied_value,
   1+count(c.id) filter(where c.percentage>m.percentage) rank_value,
   round(100.0*count(c.id) filter(where c.percentage<=m.percentage)/nullif(count(c.id),0),2) percentile_value
  from scopes sp cross join mine m left join complete c
   on sp.scope='batch_subject' or c.subject_group_id=me.subject_group_id
  group by sp.scope,sp.eligible,m.percentage
 )
 select jsonb_build_object(
  'subject_id',p_subject_id,'assessment_id',p_assessment_id,
  'own_percentage',(select round(percentage,2) from mine),
  'minimum_participants',5,
  'percentile_definition','Percentage of submitted complete results at or below yours. Equal scores share rank; subsequent ranks skip tied positions.',
  'batch_comparison','Informational raw-score comparison across subject sections; no section normalisation is applied.',
  'comparisons',jsonb_agg(jsonb_build_object(
   'scope',scope,'eligible_students',eligible,'submitted_students',participants,
   'rank',case when participants>=5 then rank_value end,
   'tie_count',case when participants>=5 then tied_value end,
   'average_percentage',case when participants>=5 then round(average_value,2) end,
   'minimum_percentage',case when participants>=5 then round(minimum_value,2) end,
   'maximum_percentage',case when participants>=5 then round(maximum_value,2) end,
   'median_percentage',case when participants>=5 then round(median_value::numeric,2) end,
   'distribution',case when participants>=5 then (
    select jsonb_agg(jsonb_build_object('lower_percent',b*20,'upper_percent',(b+1)*20,
     'students',(select count(*) from complete c where (stats.scope='batch_subject' or c.subject_group_id=me.subject_group_id)
      and least(4,floor(c.percentage/20))=b)) order by b)
    from generate_series(0,4) b) end,
   'percentile',case when participants>=5 then percentile_value end,
   'status',case when scope='subject_group' and me.subject_group_id is null then 'group_not_assigned'
                 when participants<5 then 'insufficient_submissions' else 'available' end
  ) order by scope))
 into result from stats;
 return result;
end
$function$;
