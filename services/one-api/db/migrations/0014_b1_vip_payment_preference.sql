alter table b1_vip_hourly_requests
  add column if not exists preferred_payment_method text
  check (preferred_payment_method in ('zelle', 'cash-app', 'venmo', 'apple-cash', 'paypal'));
