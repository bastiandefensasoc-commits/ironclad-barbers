-- Ironclad Barbers — seed data
-- Run after schema.sql. IDs are hardcoded (not gen_random_uuid()) so this
-- script stays deterministic and re-runnable, and so anyone poking around
-- in the SQL editor can reference a specific barber/service by a readable id.

-- ============================================
-- SERVICES (6)
-- ============================================

insert into public.services (id, slug, name, duration_minutes, price, description) values
('a1111111-1111-4111-8111-111111111111', 'classic-cut', 'Classic Cut', 30, 32.00,
 'Scissor-and-clipper cut, tailored to how you actually wear it day to day — not a template. Finished with a clean neckline and a hot towel neck shave.'),
('a2222222-2222-4222-8222-222222222222', 'skin-fade', 'Skin Fade', 40, 38.00,
 'A tight fade taken down to the skin and blended by hand, not just a clipper guard swap. Finished with a straight-edge line-up around the hairline.'),
('a3333333-3333-4333-8333-333333333333', 'beard-trim', 'Beard Trim', 20, 20.00,
 'Shape and length, cleaned up with a straight-razor edge along the cheek and neckline. Fifteen minutes to look like you didn''t need one.'),
('a4444444-4444-4444-8444-444444444444', 'hot-towel-shave', 'Hot Towel Shave', 35, 40.00,
 'The traditional straight-razor shave: hot towel prep to soften the beard, two passes with the blade, and a cold towel finish with balm.'),
('a5555555-5555-4555-8555-555555555555', 'cut-and-beard', 'Cut & Beard Combo', 50, 52.00,
 'A full cut and a full beard trim in one visit, done by the same barber so the two actually match. Our most-booked service.'),
('a6666666-6666-4666-8666-666666666666', 'kids-cut', 'Kids Cut', 25, 22.00,
 'For 12 and under. Quick, patient, and we''re used to a squirmy first haircut — no drama, no pressure, a sticker at the end if they want one.');

-- ============================================
-- BARBERS (4)
-- ============================================
-- working_hours keys are weekday strings, Sunday = "0". Each barber's
-- individual day off is seeded relative to CURRENT_DATE (matching the
-- frontend mock data's old addDays(today, n) approach) so it's always a
-- believable near-future date, not a value that quietly goes stale.

insert into public.barbers (id, slug, name, bio, specialties, image_url, working_hours, days_off) values
(
  'b1111111-1111-4111-8111-111111111111', 'marcus-webb', 'Marcus Webb',
  'Marcus has been behind the chair for twelve years and has run Ironclad''s floor since it opened. He built his name on fades — tight, blended, no visible line where the guard changed — and he''s the one the other three barbers ask when their own fade looks slightly off. Ask him for a skin fade and he''ll ask what you actually do all week before he picks a guard.',
  array['Skin Fades', 'Beard Work', 'Hot Towel Shaves'],
  '/images/barber-1.svg',
  '{"0": null, "1": null, "2": {"start":"09:00","end":"18:00"}, "3": {"start":"09:00","end":"18:00"}, "4": {"start":"09:00","end":"18:00"}, "5": {"start":"09:00","end":"18:00"}, "6": {"start":"09:00","end":"18:00"}}'::jsonb,
  array[current_date + 9]
),
(
  'b2222222-2222-4222-8222-222222222222', 'dante-ruiz', 'Dante Ruiz',
  'Dante trained in classic barbering — scissor-over-comb, straight-razor shaves, the stuff that doesn''t show up on a clipper-guard chart. He''s the one to book if you want a cut that still looks like a haircut and not a buzz with a taper. Regulars mostly book him for the hot towel shave; he treats fifteen minutes of hot towel prep as non-negotiable, weekday rush or not.',
  array['Classic Cuts', 'Hot Towel Shaves'],
  '/images/barber-2.svg',
  '{"0": {"start":"10:00","end":"19:00"}, "1": null, "2": null, "3": {"start":"10:00","end":"19:00"}, "4": {"start":"10:00","end":"19:00"}, "5": {"start":"10:00","end":"19:00"}, "6": {"start":"10:00","end":"19:00"}}'::jsonb,
  array[current_date + 14]
),
(
  'b3333333-3333-4333-8333-333333333333', 'silas-grant', 'Silas Grant',
  'Silas co-owns the shop with his brother-in-law and still takes a full chair of clients most days — he''s just not around past mid-afternoon on Saturdays anymore. He''s fast with kids without rushing them, which is why half our under-12 bookings ask for him by name, and he''s particular about fade lines being straight, not just close.',
  array['Skin Fades', 'Kids Cuts'],
  '/images/barber-3.svg',
  '{"0": null, "1": null, "2": {"start":"09:00","end":"17:00"}, "3": {"start":"09:00","end":"17:00"}, "4": {"start":"09:00","end":"17:00"}, "5": {"start":"09:00","end":"17:00"}, "6": {"start":"09:00","end":"15:00"}}'::jsonb,
  array[current_date + 5]
),
(
  'b4444444-4444-4444-8444-444444444444', 'owen-bishop', 'Owen Bishop',
  'Owen is the newest chair at Ironclad, three years in after an apprenticeship downtown, and he''s the reason the shop is open Sundays now. He leans classic — clean cuts, sharp beard lines — and he''s patient with anyone who walks in without a clear idea of what they want, which is most first-time walk-ins.',
  array['Classic Cuts', 'Beard Trims'],
  '/images/barber-4.svg',
  '{"0": {"start":"10:00","end":"18:00"}, "1": null, "2": null, "3": null, "4": {"start":"10:00","end":"18:00"}, "5": {"start":"10:00","end":"18:00"}, "6": {"start":"10:00","end":"18:00"}}'::jsonb,
  array[current_date + 11]
);

-- ============================================
-- SHOP-WIDE WEEKLY CLOSURE
-- ============================================
-- The shop is closed every Monday — appended to every barber's days_off
-- rather than encoded in working_hours, so the calendar has real,
-- concrete dates to block via the days_off mechanism specifically (per
-- the brief). Note this is a deliberate trade-off, not the most natural
-- long-term modeling: days_off is a plain date array, so this recurrence
-- is only seeded ~6 months out (the next 26 Mondays) and needs
-- re-topping-up past that window — a genuinely recurring closure would
-- more naturally live in working_hours, which repeats forever for free.
-- Every barber's working_hours also already shows Monday as null, so
-- this closure is redundant with that in the common case — it's what
-- keeps the calendar correctly blocked even so, and it's what lets the
-- days_off mechanism specifically be exercised by real data rather than
-- relying on working_hours alone.
update public.barbers
set days_off = days_off || (
  select array_agg(d::date)
  from generate_series(current_date::timestamp, current_date + interval '182 days', interval '1 day') as d
  where extract(dow from d) = 1  -- 1 = Monday
);
