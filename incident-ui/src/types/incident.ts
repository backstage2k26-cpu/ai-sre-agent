export interface Incident {
  sys_id: string;
  number: string;
  short_description: string;
  priority: string;
  state: string;
  service: string;

  investigation_status?: string | null;
  investigation_id?: string | null;
}