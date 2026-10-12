import { redirect } from 'next/navigation';

export default function AdminSurveyRedirect() {
  const target = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/survey`
    : 'https://www.dissafyt.com/survey';
  redirect(target);
}
