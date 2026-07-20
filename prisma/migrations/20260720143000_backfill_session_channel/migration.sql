-- Backfill derived channel for sessions created before attribution overhaul
UPDATE "analytics"."session"
SET "channel" = CASE
  WHEN "gclid" IS NOT NULL OR "wbraid" IS NOT NULL THEN 'google-ads'
  WHEN "msclkid" IS NOT NULL THEN 'bing-ads'
  WHEN "fbclid" IS NOT NULL THEN 'meta'
  WHEN lower(coalesce("utmSource",'')) LIKE '%whatsapp%'
    OR lower(coalesce("utmMedium",'')) LIKE '%interakt%'
    OR lower(coalesce("utmMedium",'')) LIKE '%whatsapp%' THEN 'whatsapp'
  WHEN lower(coalesce("utmSource",'')) LIKE '%instagram%'
    OR lower(coalesce("utmSource",'')) = 'ig' THEN 'instagram'
  WHEN lower(coalesce("utmSource",'')) LIKE '%facebook%'
    OR lower(coalesce("utmSource",'')) = 'fb'
    OR lower(coalesce("utmSource",'')) LIKE '%meta%' THEN 'meta'
  WHEN lower(coalesce("utmMedium",'')) IN ('cpc','ppc','paid','paidsearch')
    AND lower(coalesce("utmSource",'')) LIKE '%google%' THEN 'google-ads'
  WHEN lower(coalesce("utmMedium",'')) IN ('cpc','ppc','paid') THEN 'other-paid'
  WHEN lower(coalesce("utmMedium",'')) = 'email'
    OR lower(coalesce("utmSource",'')) LIKE '%email%' THEN 'email'
  WHEN lower(coalesce("utmSource",'')) LIKE '%google%' THEN 'google-organic'
  WHEN "utmSource" IS NOT NULL THEN 'referral'
  WHEN "referrer" ILIKE '%google.%' THEN 'google-organic'
  WHEN "referrer" ILIKE '%instagram%' THEN 'instagram'
  WHEN "referrer" ILIKE '%facebook%' THEN 'meta'
  WHEN "referrer" IS NOT NULL AND "referrer" NOT ILIKE '%zenvana%' THEN 'referral'
  ELSE 'direct'
END
WHERE "channel" IS NULL;
