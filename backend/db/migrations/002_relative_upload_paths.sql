-- Uploaded image URLs were stored absolute, host and all, so every stored
-- image broke the moment the deployment origin changed. Keep the path only;
-- the client applies the current API origin when it reads the row.
UPDATE barbers
   SET profile_image_url = regexp_replace(profile_image_url, '^https?://[^/]+', '')
 WHERE profile_image_url ~ '^https?://[^/]+/uploads/';

UPDATE portfolio_images
   SET image_url = regexp_replace(image_url, '^https?://[^/]+', '')
 WHERE image_url ~ '^https?://[^/]+/uploads/';
