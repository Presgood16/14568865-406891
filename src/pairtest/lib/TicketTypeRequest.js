// Immutable object representing a ticket type request
class TicketTypeRequest {
  #type;
  #noOfTickets;

  static TICKET_TYPES = {
    INFANT: 'INFANT',
    CHILD: 'CHILD',
    ADULT: 'ADULT'
  };

  static TICKET_PRICES = {
    INFANT: 0,
    CHILD: 15,
    ADULT: 25
  };

  constructor(type, noOfTickets) {
    if (!Object.values(TicketTypeRequest.TICKET_TYPES).includes(type)) {
      throw new Error(`Invalid ticket type: ${type}`);
    }

    if (!Number.isInteger(noOfTickets) || noOfTickets <= 0) {
      throw new Error('Number of tickets must be a positive integer');
    }

    this.#type = type;
    this.#noOfTickets = noOfTickets;
    
    // Make object immutable
    Object.freeze(this);
  }

  getTicketType() {
    return this.#type;
  }

  getNoOfTickets() {
    return this.#noOfTickets;
  }

  getPrice() {
    return TicketTypeRequest.TICKET_PRICES[this.#type];
  }

  getTotalPrice() {
    return this.getPrice() * this.#noOfTickets;
  }

  requiresSeat() {
    return this.#type !== TicketTypeRequest.TICKET_TYPES.INFANT;
  }
}

export default TicketTypeRequest;