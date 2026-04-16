export class DonationService {
  async processDonation(data) {
    return { success: true, transactionId: "don_" + Date.now() }
  }
}
