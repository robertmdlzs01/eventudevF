const nodemailer = require('nodemailer')

class EmailService {
  constructor() {
    // Configuración del transportador de email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || 'eventu.app@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    })
  }

  // Enviar email de recuperación de contraseña
  async sendPasswordResetEmail(email, resetToken, userName = 'Usuario') {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-password?token=${resetToken}&email=${encodeURIComponent(email)}`
    
    const mailOptions = {
      from: `"Eventu" <${process.env.SMTP_USER || 'eventu.app@gmail.com'}>`,
      to: email,
      subject: 'Recupera tu contraseña - Eventu',
      html: this.getPasswordResetTemplate(userName, resetUrl)
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email de recuperación enviado:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error enviando email de recuperación:', error)
      return { success: false, error: error.message }
    }
  }

  // Template HTML para el email de recuperación
  getPasswordResetTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recupera tu contraseña - Eventu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            display: inline-block;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .title {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .link {
            color: #ec4899;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Eventu</div>
            <h1 class="title">¡Hola ${userName}!</h1>
            <p class="subtitle">Recibimos una solicitud para restablecer tu contraseña</p>
          </div>
          
          <div class="content">
            <p>Si solicitaste restablecer tu contraseña, haz clic en el botón de abajo para crear una nueva contraseña segura.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p><a href="${resetUrl}" class="link">${resetUrl}</a></p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este enlace expira en 1 hora por seguridad</li>
              <li>Si no solicitaste este cambio, puedes ignorar este email</li>
              <li>Nunca compartas este enlace con nadie</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>¿Tienes preguntas? Contacta nuestro soporte en <a href="mailto:soporte@eventu.co" class="link">soporte@eventu.co</a></p>
            <p>© 2024 Eventu. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Enviar email de confirmación de cambio de contraseña
  async sendPasswordChangedEmail(email, userName = 'Usuario') {
    const mailOptions = {
      from: `"Eventu" <${process.env.SMTP_USER || 'eventu.app@gmail.com'}>`,
      to: email,
      subject: 'Tu contraseña ha sido actualizada - Eventu',
      html: this.getPasswordChangedTemplate(userName)
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email de confirmación enviado:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error enviando email de confirmación:', error)
      return { success: false, error: error.message }
    }
  }

  // Template HTML para confirmación de cambio de contraseña
  getPasswordChangedTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Actualizada - Eventu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            display: inline-block;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .title {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .content {
            margin-bottom: 30px;
          }
          .success {
            background-color: #d1fae5;
            border: 1px solid #a7f3d0;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #065f46;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .link {
            color: #10b981;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Eventu</div>
            <h1 class="title">¡Contraseña Actualizada!</h1>
            <p class="subtitle">Tu contraseña ha sido cambiada exitosamente</p>
          </div>
          
          <div class="content">
            <p>Hola ${userName},</p>
            
            <p>Tu contraseña ha sido actualizada exitosamente. Ya puedes usar tu nueva contraseña para acceder a tu cuenta.</p>
            
            <div class="success">
              <strong>✅ Confirmado:</strong> El cambio de contraseña se realizó correctamente.
            </div>
            
            <p>Si no realizaste este cambio, contacta inmediatamente a nuestro equipo de soporte.</p>
          </div>
          
          <div class="footer">
            <p>¿Tienes preguntas? Contacta nuestro soporte en <a href="mailto:soporte@eventu.co" class="link">soporte@eventu.co</a></p>
            <p>© 2024 Eventu. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

module.exports = new EmailService()
