import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';

// Mock services
class MockTicketPaymentService {
  constructor() {
    this.payments = [];
  }
  
  makePayment(accountId, totalAmountToPay) {
    this.payments.push({ accountId, totalAmountToPay });
    return true;
  }
}

class MockSeatReservationService {
  constructor() {
    this.reservations = [];
  }
  
  reserveSeat(accountId, totalSeatsToAllocate) {
    this.reservations.push({ accountId, totalSeatsToAllocate });
    return true;
  }
}

describe('TicketService', () => {
  let ticketService;
  let mockPaymentService;
  let mockSeatService;

  beforeEach(() => {
    mockPaymentService = new MockTicketPaymentService();
    mockSeatService = new MockSeatReservationService();
    ticketService = new TicketService(mockPaymentService, mockSeatService);
  });

  describe('Valid purchases', () => {
    it('should purchase adult tickets successfully', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 2);
      
      const result = ticketService.purchaseTickets(1, adultRequest);
      
      assert.strictEqual(result.totalAmount, 50);
      assert.strictEqual(result.totalSeats, 2);
      assert.strictEqual(mockPaymentService.payments.length, 1);
      assert.strictEqual(mockSeatService.reservations.length, 1);
    });

    it('should purchase mixed tickets with adult, child, and infant', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 2);
      const childRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.CHILD, 1);
      const infantRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 1);
      
      const result = ticketService.purchaseTickets(1, adultRequest, childRequest, infantRequest);
      
      assert.strictEqual(result.totalAmount, 65); // 2*25 + 1*15 + 1*0
      assert.strictEqual(result.totalSeats, 3); // 2 adults + 1 child (infant doesn't get seat)
      assert.strictEqual(mockPaymentService.payments[0].totalAmountToPay, 65);
      assert.strictEqual(mockSeatService.reservations[0].totalSeatsToAllocate, 3);
    });

    it('should handle maximum 25 tickets', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 25);
      
      const result = ticketService.purchaseTickets(1, adultRequest);
      
      assert.strictEqual(result.totalAmount, 625);
      assert.strictEqual(result.totalSeats, 25);
    });

    it('should handle infants equal to adults', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 2);
      const infantRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 2);
      
      const result = ticketService.purchaseTickets(1, adultRequest, infantRequest);
      
      assert.strictEqual(result.totalAmount, 50);
      assert.strictEqual(result.totalSeats, 2);
    });
  });

  describe('Invalid account ID', () => {
    it('should throw error for zero account ID', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 1);
      
      assert.throws(() => {
        ticketService.purchaseTickets(0, adultRequest);
      }, InvalidPurchaseException);
    });

    it('should throw error for negative account ID', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 1);
      
      assert.throws(() => {
        ticketService.purchaseTickets(-1, adultRequest);
      }, InvalidPurchaseException);
    });

    it('should throw error for non-integer account ID', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 1);
      
      assert.throws(() => {
        ticketService.purchaseTickets(1.5, adultRequest);
      }, InvalidPurchaseException);
    });
  });

  describe('Invalid ticket requests', () => {
    it('should throw error for no ticket requests', () => {
      assert.throws(() => {
        ticketService.purchaseTickets(1);
      }, InvalidPurchaseException);
    });

    it('should throw error for empty ticket requests array', () => {
      assert.throws(() => {
        ticketService.purchaseTickets(1, ...[]);
      }, InvalidPurchaseException);
    });

    it('should throw error for invalid ticket request object', () => {
      assert.throws(() => {
        ticketService.purchaseTickets(1, { type: 'ADULT', count: 1 });
      }, InvalidPurchaseException);
    });
  });

  describe('Business rule violations', () => {
    it('should throw error for more than 25 tickets', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 26);
      
      assert.throws(() => {
        ticketService.purchaseTickets(1, adultRequest);
      }, InvalidPurchaseException);
    });

    it('should throw error for child tickets without adult', () => {
      const childRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.CHILD, 1);
      
      assert.throws(() => {
        ticketService.purchaseTickets(1, childRequest);
      }, InvalidPurchaseException);
    });

    it('should throw error for infant tickets without adult', () => {
      const infantRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 1);
      
      assert.throws(() => {
        ticketService.purchaseTickets(1, infantRequest);
      }, InvalidPurchaseException);
    });

    it('should throw error for more infants than adults', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 1);
      const infantRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 2);
      
      assert.throws(() => {
        ticketService.purchaseTickets(1, adultRequest, infantRequest);
      }, InvalidPurchaseException);
    });

    it('should throw error for child and infant without adult', () => {
      const childRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.CHILD, 1);
      const infantRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 1);
      
      assert.throws(() => {
        ticketService.purchaseTickets(1, childRequest, infantRequest);
      }, InvalidPurchaseException);
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple ticket requests of same type', () => {
      const adultRequest1 = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 2);
      const adultRequest2 = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 3);
      
      const result = ticketService.purchaseTickets(1, adultRequest1, adultRequest2);
      
      assert.strictEqual(result.totalAmount, 125);
      assert.strictEqual(result.totalSeats, 5);
      assert.strictEqual(result.ticketBreakdown.ADULT, 5);
    });

    it('should handle zero payment amount correctly', () => {
      const adultRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 1);
      const infantRequest = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 1);
      
      const result = ticketService.purchaseTickets(1, adultRequest, infantRequest);
      
      assert.strictEqual(result.totalAmount, 25);
      assert.strictEqual(result.totalSeats, 1);
    });
  });
});