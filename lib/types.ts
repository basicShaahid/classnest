export type Lesson = {
  id: string;
  date: string; // YYYY-MM-DD, interpreted as a local calendar date
  topic: string;
  startTime: string; // HH:mm internally; the UI always displays 12-hour time
  endTime: string;
  hourlyRate: number;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LessonInput = Pick<
  Lesson,
  "date" | "topic" | "startTime" | "endTime" | "hourlyRate" | "paid"
>;

export type Summary = {
  totalClasses: number;
  totalMinutes: number;
  totalEarnings: number;
  moneyOwed: number;
  paymentsReceived: number;
  paidPercentage: number;
};
