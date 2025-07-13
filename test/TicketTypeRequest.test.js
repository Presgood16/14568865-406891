import { describe, it } from 'node:test';
import assert from 'node:assert';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';

describe('TicketTypeRequest', () => {
  describe('Valid construction', () => {
    it('should create adult ticket request', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 2);
      
      assert.strictEqual(request.getTicketType(), 'ADULT');
      assert.strictEqual(request.getNoOfTickets(), 2);
      assert.strictEqual(request.getPrice(), 25);
      assert.strictEqual(request.getTotalPrice(), 50);
      assert.strictEqual(request.requiresSeat(), true);
    });

    it('should create child ticket request', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.CHILD, 1);
      
      assert.strictEqual(request.getTicketType(), 'CHILD');
      assert.strictEqual(request.getNoOfTickets(), 1);
      assert.strictEqual(request.getPrice(), 15);
      assert.strictEqual(request.getTotalPrice(), 15);
      assert.strictEqual(request.requiresSeat(), true);
    });

    it('should create infant ticket request', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 1);
      
      assert.strictEqual(request.getTicketType(), 'INFANT');
      assert.strictEqual(request.getNoOfTickets(), 1);
      assert.strictEqual(request.getPrice(), 0);
      assert.strictEqual(request.getTotalPrice(), 0);
      assert.strictEqual(request.requiresSeat(), false);
    });
  });

  describe('Invalid construction', () => {
    it('should throw error for invalid ticket type', () => {
      assert.throws(() => {
        new TicketTypeRequest('INVALID', 1);
      }, Error);
    });

    it('should throw error for zero tickets', () => {
      assert.throws(() => {
        new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 0);
      }, Error);
    });

    it('should throw error for negative tickets', () => {
      assert.throws(() => {
        new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, -1);
      }, Error);
    });

    it('should throw error for non-integer tickets', () => {
      assert.throws(() => {
        new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 1.5);
      }, Error);
    });
  });

  describe('Immutability', () => {
    it('should be immutable after construction', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 2);
      
      // Attempt to modify should fail silently or throw in strict mode
      assert.throws(() => {
        request.type = 'CHILD';
      }, TypeError);
    });

    it('should be frozen', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 2);
      
      assert.strictEqual(Object.isFrozen(request), true);
    });
  });

  describe('Constants', () => {
    it('should have correct ticket types', () => {
      assert.strictEqual(TicketTypeRequest.TICKET_TYPES.INFANT, 'INFANT');
      assert.strictEqual(TicketTypeRequest.TICKET_TYPES.CHILD, 'CHILD');
      assert.strictEqual(TicketTypeRequest.TICKET_TYPES.ADULT, 'ADULT');
    });

    it('should have correct ticket prices', () => {
      assert.strictEqual(TicketTypeRequest.TICKET_PRICES.INFANT, 0);
      assert.strictEqual(TicketTypeRequest.TICKET_PRICES.CHILD, 15);
      assert.strictEqual(TicketTypeRequest.TICKET_PRICES.ADULT, 25);
    });
  });

  describe('Multiple ticket calculations', () => {
    it('should calculate correct total for multiple adult tickets', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.ADULT, 5);
      
      assert.strictEqual(request.getTotalPrice(), 125);
    });

    it('should calculate correct total for multiple child tickets', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.CHILD, 3);
      
      assert.strictEqual(request.getTotalPrice(), 45);
    });

    it('should calculate correct total for multiple infant tickets', () => {
      const request = new TicketTypeRequest(TicketTypeRequest.TICKET_TYPES.INFANT, 2);
      
      assert.strictEqual(request.getTotalPrice(), 0);
    });
  });
});