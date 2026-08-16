export interface NotificationProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>
}
