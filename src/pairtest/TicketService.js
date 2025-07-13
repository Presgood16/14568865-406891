import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

// TicketService handles ticket purchasing with business rule validation
class TicketService {
  #ticketPaymentService;
  #seatReservationService;

  constructor(ticketPaymentService, seatReservationService) {
    this.#ticketPaymentService = ticketPaymentService || new TicketPaymentService();
    this.#seatReservationService = seatReservationService || new SeatReservationService();
  }

  
  purchaseTickets(accountId, ...ticketTypeRequests) {
    // Validate account ID
    this.#validateAccountId(accountId);
    
    // Validate ticket requests
    this.#validateTicketRequests(ticketTypeRequests);

    // Calculate totals
    const totals = this.#calculateTotals(ticketTypeRequests);

    // Validate business rules
    this.#validateBusinessRules(totals);

    // Process payment
    if (totals.totalAmount > 0) {
      this.#ticketPaymentService.makePayment(accountId, totals.totalAmount);
    }

    // Reserve seats
    if (totals.totalSeats > 0) {
      this.#seatReservationService.reserveSeat(accountId, totals.totalSeats);
    }

    return {
      totalAmount: totals.totalAmount,
      totalSeats: totals.totalSeats,
      ticketBreakdown: totals.ticketBreakdown
    };
  }


  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Account ID must be a positive integer');
    }
  }

  #validateTicketRequests(ticketTypeRequests) {
    if (!Array.isArray(ticketTypeRequests) || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException('At least one ticket request must be provided');
    }

    for (const request of ticketTypeRequests) {
      if (!(request instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException('All ticket requests must be instances of TicketTypeRequest');
      }
    }
  }

  #calculateTotals(ticketTypeRequests) {
    const totals = {
      totalAmount: 0,
      totalSeats: 0,
      totalTickets: 0,
      ticketBreakdown: {
        [TicketTypeRequest.TICKET_TYPES.INFANT]: 0,
        [TicketTypeRequest.TICKET_TYPES.CHILD]: 0,
        [TicketTypeRequest.TICKET_TYPES.ADULT]: 0
      }
    };

    for (const request of ticketTypeRequests) {
      const ticketType = request.getTicketType();
      const numberOfTickets = request.getNoOfTickets();

      totals.totalAmount += request.getTotalPrice();
      totals.totalTickets += numberOfTickets;
      totals.ticketBreakdown[ticketType] += numberOfTickets;

      // Only count seats for non-infant tickets
      if (request.requiresSeat()) {
        totals.totalSeats += numberOfTickets;
      }
    }

    return totals;
  }

  #validateBusinessRules(totals) {
    // Rule: Maximum 25 tickets per purchase
    if (totals.totalTickets > 25) {
      throw new InvalidPurchaseException('Cannot purchase more than 25 tickets at once');
    }

    // Rule: Child and Infant tickets cannot be purchased without Adult tickets
    const hasChildOrInfant = totals.ticketBreakdown[TicketTypeRequest.TICKET_TYPES.CHILD] > 0 || 
                            totals.ticketBreakdown[TicketTypeRequest.TICKET_TYPES.INFANT] > 0;
    const hasAdult = totals.ticketBreakdown[TicketTypeRequest.TICKET_TYPES.ADULT] > 0;

    if (hasChildOrInfant && !hasAdult) {
      throw new InvalidPurchaseException('Child and Infant tickets cannot be purchased without Adult tickets');
    }

    // Rule: Infants must be able to sit on adult laps (1 infant per adult max)
    const infantCount = totals.ticketBreakdown[TicketTypeRequest.TICKET_TYPES.INFANT];
    const adultCount = totals.ticketBreakdown[TicketTypeRequest.TICKET_TYPES.ADULT];
    
    if (infantCount > adultCount) {
      throw new InvalidPurchaseException('Number of infants cannot exceed number of adults (infants sit on adult laps)');
    }
  }
}

export default TicketService;