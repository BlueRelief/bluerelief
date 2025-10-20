// Simple HTML template for testing
export function createSimpleTemplate(data: Record<string, any>): string {
  const {
    title = 'BlueRelief Notification',
    content = 'This is a notification from BlueRelief.',
    buttonText,
    buttonUrl,
    alertType,
    severity,
    location,
    description
  } = data;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #007ee6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .severity-high { background: #f8d7da; border-color: #f5c6cb; }
        .severity-critical { background: #f8d7da; border-color: #f5c6cb; }
        .button { display: inline-block; background: #007ee6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BlueRelief</h1>
          <h2>${title}</h2>
        </div>
        <div class="content">
  `;

  // Add alert-specific content if it's an alert
  if (alertType && severity) {
    const severityClass = severity.toLowerCase() === 'critical' || severity.toLowerCase() === 'high' ? `severity-${severity.toLowerCase()}` : '';
    html += `
      <div class="alert ${severityClass}">
        <strong>${alertType}</strong> - ${severity} Priority
        ${location ? `<br><strong>Location:</strong> ${location}` : ''}
        ${description ? `<br><strong>Description:</strong> ${description}` : ''}
      </div>
    `;
  }

  html += `
          <p>${content}</p>
  `;

  if (buttonText && buttonUrl) {
    html += `
          <p><a href="${buttonUrl}" class="button">${buttonText}</a></p>
    `;
  }

  html += `
        </div>
        <div class="footer">
          <p>This email was sent by BlueRelief Emergency Response System.</p>
          <p>Stay safe and follow local emergency guidelines.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}
