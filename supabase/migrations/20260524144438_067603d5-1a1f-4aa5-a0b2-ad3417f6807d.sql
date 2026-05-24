
DROP POLICY IF EXISTS "Chapters readable" ON public.chapters;
CREATE POLICY "Chapters readable"
ON public.chapters
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'member'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.books b
    WHERE b.id = chapters.book_id
      AND (b.is_published OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

DROP POLICY IF EXISTS "Pages readable" ON public.pages;
CREATE POLICY "Pages readable"
ON public.pages
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'member'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.books b ON b.id = c.book_id
    WHERE c.id = pages.chapter_id
      AND (b.is_published OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));
