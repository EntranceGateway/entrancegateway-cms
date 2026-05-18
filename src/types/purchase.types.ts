// Purchase types for admin purchase management

export type PurchaseStatus =
  | 'PAID'
  | 'PENDING'
  | 'PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING'
  | 'FAILED'
  | 'REJECTED_BY_ADMIN'
  | 'CANCELLED_BY_ADMIN';

export type AdminPurchaseModuleType = 'QUIZ' | 'TRAINING' | 'SUBSCRIPTION';
export type PaymentMethod = 'ESEWA' | 'KHALTI' | 'MANUAL';
export type ModuleType = 'QUESTION_SET' | 'QUIZ_TEMPLATE' | 'TRAINING' | 'SUBSCRIPTION';
export type SubscriptionPlan = 'SILVER' | 'GOLD' | 'PREMIUM';
export type PurchaseView = 'ALL' | 'PENDING' | 'QUIZ' | 'TRAINING' | 'SUBSCRIPTION';

export interface QuizPurchase {
  purchaseId: number;
  transactionId: string;
  amount: number;
  purchaseDate: string;
  purchaseStatus: PurchaseStatus;
  moduleType: AdminPurchaseModuleType;
  setId: number | null;
  setName: string | null;
  templateId: string | null;
  templateName: string | null;
  trainingId: number | null;
  trainingName: string | null;
  subscriptionPlan: SubscriptionPlan | null;
  entranceTypeSlug: string | null;
  userId: number;
  userName: string;
  userEmail: string;
  paymentMethod: PaymentMethod | null;
  paymentProof: string | null;
  paymentProofUrl: string | null;
}

export interface QuizPurchaseQueryParams {
  userId?: number;
  status?: PurchaseStatus;
  moduleType?: AdminPurchaseModuleType;
  quizId?: number;
  trainingId?: number;
  plan?: SubscriptionPlan;
  entranceTypeSlug?: string;
  startDate?: string;
  endDate?: string;
  view?: PurchaseView;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface QuizPurchaseListResponse {
  content: QuizPurchase[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  isLast: boolean;
}

export interface PurchaseStatisticsResponse {
  totalPurchases: number;
  totalRevenue: number;
  byStatus: Partial<Record<PurchaseStatus, number>>;
  byModuleType: Partial<Record<AdminPurchaseModuleType, number>>;
  byPaymentMethod: Partial<Record<PaymentMethod, number>>;
  pendingApprovals: number;
  recentPurchases: number;
}

export interface AdminPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  userEmail?: string;
}

export interface PaymentResponse {
  purchaseId: number;
  status: string;
  paymentType: PaymentMethod;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
}

export interface PurchaseMutationResult {
  success: boolean;
  data?: QuizPurchase | PaymentResponse;
  error?: string;
}
