begin;

alter table one_driver_applications
  add column if not exists vehicle_class_id text references one_vehicle_classes(id);

create index if not exists one_driver_applications_vehicle_class_idx
  on one_driver_applications (vehicle_class_id, status, created_at desc);

commit;
