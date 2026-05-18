// Purchase types for quiz purchases management

export type PurchaseStatus = 
  | 'PAID'
  | 'PENDING'
  | 'PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING'
  | 'FAILED'
  | 'REJECTED_BY_ADMIN';

export interface QuizPurchase {
  purchaseId: number;
  transactionId: string;
  amount: number;
  purchaseDate: string;
  purchaseStatus: PurchaseStatus;
  setId: number | null;
  setName: string | null;
  templateId: string | null;
  templateName: string | null;
  trainingId: number | null;
  trainingName: string | null;
  userId: number;
  userName: string;
  paymentMethod: PaymentMethod | null;
  paymentProof: string | null;
}

export interface QuizPurchaseQueryParams {
  userId?: number;
  status?: PurchaseStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface QuizPurchaseListResponse {
  content: QuizPurchase[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export type PaymentMethod = 'ESEWA' | 'KHALTI' | 'MANUAL';
export type ModuleType = 'QUESTION_SET' | 'QUIZ_TEMPLATE' | 'TRAINING' | 'SUBSCRIPTION';

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
