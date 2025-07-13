// Custom exception for invalid ticket purchase requests
class InvalidPurchaseException extends Error {
    constructor(message) {
      super(message);
      this.name = 'InvalidPurchaseException';
    }
  }
  
export default InvalidPurchaseException;