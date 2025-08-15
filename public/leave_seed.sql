-- Seed default leave types
insert into public.leave_types (key, label, color, is_paid)
values
  ('annual', 'Annual Leave', 'green', true),
  ('sick', 'Sick Leave', 'rose', true),
  ('unpaid', 'Unpaid Leave', 'gray', false),
  ('compassionate', 'Compassionate Leave', 'violet', true)
on conflict (key) do update set
  label = excluded.label,
  color = excluded.color,
  is_paid = excluded.is_paid;
