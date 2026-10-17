import { redirect } from 'next/navigation';

/** The design's admin opens on the Leads tab. */
export default function AdminHome() {
  redirect('/admin/leads');
}
