class EmailNotificationService {
    async sendTaskCompletionEmail(task: Task) {
      // Implement email sending logic
      // Could use services like SendGrid, Resend, etc.
      const emailContent = `
        Task Completed: ${task.title}
        Description: ${task.description}
        Completed on: ${new Date().toLocaleString()}
      `;
  
      await this.sendEmail({
        to: 'boss@company.com',
        subject: 'Task Completed',
        body: emailContent
      });
    }
  }