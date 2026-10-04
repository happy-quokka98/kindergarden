export const MONTHS_GEORGIAN = [
  'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო'
];

export interface PaymentStatusResult {
  dueDay: number;
  amount: number;
  dueDateFormatted: string;
  dueDateGeorgian: string;
  daysLeft: number;
  status: 'paid' | 'due_soon' | 'overdue';
  badgeText: string;
  badgeColor: string;
}

export function getPaymentStatus(
  dueDay?: number | string,
  feeAmount?: number | string,
  isPaidStatus?: boolean | string
): PaymentStatusResult {
  const day = dueDay ? parseInt(String(dueDay), 10) : 10; // Default: 10th of every month
  const amount = feeAmount ? parseFloat(String(feeAmount)) : 150; // Default: 150 GEL

  const isPaid = isPaidStatus === true || isPaidStatus === 'paid' || isPaidStatus === 'true';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  const safeDay = Math.min(Math.max(1, day), 28);

  // Target due date for current month
  let dueDate = new Date(currentYear, currentMonth, safeDay);

  // If today is past the due date of current month and marked paid, calculate for next month
  if (todayDate > safeDay && isPaid) {
    dueDate = new Date(currentYear, currentMonth + 1, safeDay);
  }

  const todayZero = new Date(currentYear, currentMonth, todayDate);
  const diffTime = dueDate.getTime() - todayZero.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const monthsGeorgian = [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
  ];

  const dueDateFormatted = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
  const dueDateGeorgian = `${dueDate.getDate()} ${monthsGeorgian[dueDate.getMonth()]}`;

  let status: 'paid' | 'due_soon' | 'overdue' = 'due_soon';
  let badgeText = '';
  let badgeColor = '';

  if (isPaid) {
    status = 'paid';
    badgeText = '🟢 გადახდილია';
    badgeColor = '#10b981';
  } else if (diffDays < 0) {
    status = 'overdue';
    badgeText = `🔴 ვადაგადაცილებულია (${Math.abs(diffDays)} დღით)`;
    badgeColor = '#ef4444';
  } else if (diffDays <= 5) {
    status = 'due_soon';
    badgeText = `🟡 ვადა ახლოვდება (${diffDays} დღეში)`;
    badgeColor = '#f59e0b';
  } else {
    status = 'due_soon';
    badgeText = `🔵 ვადა: ${diffDays} დღეში (${dueDateGeorgian})`;
    badgeColor = '#2563eb';
  }

  return {
    dueDay: day,
    amount,
    dueDateFormatted,
    dueDateGeorgian,
    daysLeft: diffDays,
    status,
    badgeText,
    badgeColor,
  };
}
