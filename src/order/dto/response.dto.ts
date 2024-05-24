import { OrderStatus } from 'src/enum/order.enum';

export class ListOrderResponse {
  all: OrderResponse[];
  issue: OrderResponse[];
  action: OrderResponse[];
  waiting: OrderResponse[];
  success: OrderResponse[];
}

export class OrderResponse {
  orderId: string;
  date: string;
  status: OrderStatus;
  branchId: number;
  branchName: string;
}
