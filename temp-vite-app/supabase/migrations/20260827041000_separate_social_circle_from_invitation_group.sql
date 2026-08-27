-- The first social-circle migration temporarily copied invitation groups into
-- social_circle. They represent different concepts, so remove only inherited
-- values that are still identical to the invitation group.
update public.event_guests
set social_circle = '',
    updated_at = now()
where trim(social_circle) <> ''
  and lower(trim(social_circle)) = lower(trim(group_name));
