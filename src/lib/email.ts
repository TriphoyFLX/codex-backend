import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
      from: process.env.EMAIL_FROM || 'CodexLearn <noreply@codexlearn.com>'
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: false,
      auth: {
        user: this.config.user,
        pass: this.config.pass
      }
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: 'Код подтверждения CodexLearn',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Код подтверждения</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
                color: #334155;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                text-align: center;
                color: white;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
              }
              .code-container {
                background: #f1f5f9;
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
              }
              .code {
                font-size: 32px;
                font-weight: bold;
                color: #2563eb;
                letter-spacing: 8px;
                margin: 10px 0;
                font-family: 'Courier New', monospace;
              }
              .instructions {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
              }
              .footer {
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
              }
              .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎓 CodexLearn</div>
                <h1>Подтверждение регистрации</h1>
              </div>
              
              <div class="content">
                <p>Здравствуйте!</p>
                <p>Спасибо за регистрацию в CodexLearn. Для завершения регистрации введите следующий код подтверждения:</p>
                
                <div class="code-container">
                  <div class="code">${code}</div>
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Код действителен 10 минут</p>
                </div>
                
                <div class="instructions">
                  <strong>Инструкция:</strong><br>
                  1. Вернитесь в приложение CodexLearn<br>
                  2. Введите код в поле подтверждения<br>
                  3. Нажмите "Подтвердить"
                </div>
                
                <p style="color: #ef4444; font-size: 14px;">
                  <strong>Внимание:</strong> Никогда не передавайте этот код другим лицам!
                </p>
              </div>
              
              <div class="footer">
                <p>Это автоматическое сообщение. Пожалуйста, не отвечайте на него.</p>
                <p>© 2024 CodexLearn. Все права защищены.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Verification code sent to:', email);
      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();
