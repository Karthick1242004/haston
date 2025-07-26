import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminEmail } from '@/lib/isAdmin'
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !await isAdminEmail(session.user?.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipients, subject, content, imageUrl } = body

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients are required' }, { status: 400 })
    }

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Initialize MailerSend
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || '',
    })

    const sentFrom = new Sender("hexhueclothing@gmail.com", "HEX & HUE")

    // Create recipients array
    const mailRecipients = recipients.map((email: string) => new Recipient(email, email))

    // Build HTML content
    let htmlContent = `
      <html>
        <head>
          <style>
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              font-family: 'Arial', sans-serif;
              background-color: #F1EFEE;
              padding: 20px;
            }
            .email-header {
              text-align: center;
              padding: 20px;
              background-color: white;
              border-radius: 8px 8px 0 0;
            }
            .email-body {
              background-color: white;
              padding: 30px;
              line-height: 1.6;
              color: #333;
            }
            .email-footer {
              background-color: #1e293b;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 8px 8px;
            }
            .logo {
              max-width: 150px;
              height: auto;
            }
            .email-image {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background-color: #1e293b;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1 style="color: #1e293b; font-size: 28px; margin: 0;">HEX & HUE</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Fresh Colors, Fresh Vibes</p>
            </div>
            <div class="email-body">
              ${imageUrl ? `<img src="${imageUrl}" alt="Email Image" class="email-image" />` : ''}
              ${content.replace(/\n/g, '<br>')}
              <br><br>
              <a href="${process.env.NEXTAUTH_URL || 'https://hexandhue.com'}/shop" class="button">Shop Now</a>
            </div>
            <div class="email-footer">
              <p style="margin: 0;">Thank you for choosing HEX & HUE</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
                This email was sent to you because you're a valued customer.
                <br>
                Visit us at ${process.env.NEXTAUTH_URL || 'https://hexandhue.com'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Create plain text version
    const textContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, '\n')

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(mailRecipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setHtml(htmlContent)
      .setText(`${textContent}\n\nThank you for choosing HEX & HUE\nVisit us at ${process.env.NEXTAUTH_URL || 'https://hexandhue.com'}`)

    // Send email
    const response = await mailerSend.email.send(emailParams)
    
    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${recipients.length} recipient(s)`,
      emailId: response.messageId || 'sent'
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 