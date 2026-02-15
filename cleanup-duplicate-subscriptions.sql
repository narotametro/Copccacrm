-- ================================================================
-- CLEANUP: Remove Duplicate Subscriptions
-- ================================================================
-- Keep only the ACTIVE subscription, remove old trial subscriptions
-- ================================================================

-- View duplicate subscriptions before cleanup
SELECT 
  u.email,
  sp.display_name as plan,
  us.status,
  us.trial_end_date,
  us.created_at
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.user_id IN (
  SELECT user_id
  FROM user_subscriptions
  WHERE status IN ('trial', 'active')
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
ORDER BY u.email, us.created_at;

-- Remove old trial subscriptions where user has an active subscription
DELETE FROM user_subscriptions
WHERE id IN (
  SELECT us1.id
  FROM user_subscriptions us1
  WHERE us1.status = 'trial'
  AND EXISTS (
    SELECT 1
    FROM user_subscriptions us2
    WHERE us2.user_id = us1.user_id
    AND us2.status = 'active'
    AND us2.id != us1.id
  )
);

-- Verify cleanup
SELECT 
  u.email,
  sp.display_name as plan,
  us.status,
  COUNT(*) as subscription_count
FROM users u
JOIN user_subscriptions us ON us.user_id = u.id
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.status IN ('trial', 'active')
GROUP BY u.email, sp.display_name, us.status
HAVING COUNT(*) > 1;

-- Should return no rows if cleanup successful
SELECT '✅ Cleanup complete! Each user now has only ONE active subscription' as result
WHERE NOT EXISTS (
  SELECT 1
  FROM user_subscriptions
  WHERE status IN ('trial', 'active')
  GROUP BY user_id
  HAVING COUNT(*) > 1
);
